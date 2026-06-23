-- Gift Scratch Card System Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE scratch_cover_type AS ENUM ('gray', 'gold', 'silver', 'custom');
CREATE TYPE reveal_animation_type AS ENUM ('confetti', 'fireworks', 'sparkles', 'win');
CREATE TYPE winner_image_type AS ENUM ('trophy', 'gift', 'balloons', 'custom', 'none');
CREATE TYPE gift_type AS ENUM ('gift', 'invitation');

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug VARCHAR(12) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  hidden_scratch_text TEXT NOT NULL DEFAULT '',
  scratch_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  background_image_url TEXT,
  scratch_cover_type scratch_cover_type NOT NULL DEFAULT 'gray',
  scratch_cover_image_url TEXT,
  expiration_date TIMESTAMPTZ,
  reveal_animation reveal_animation_type NOT NULL DEFAULT 'confetti',
  winner_image_type winner_image_type NOT NULL DEFAULT 'gift',
  winner_image_url TEXT,
  owner_whatsapp VARCHAR(20),
  gift_type gift_type NOT NULL DEFAULT 'gift',
  event_name VARCHAR(255),
  event_datetime TIMESTAMPTZ,
  event_location TEXT,
  custom_sound_url TEXT,
  scratch_sound_enabled BOOLEAN NOT NULL DEFAULT true,
  rsvp_require_name BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  scratch_count INTEGER NOT NULL DEFAULT 0,
  reveal_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gifts_slug ON gifts(slug);
CREATE INDEX idx_gifts_user_id ON gifts(user_id);
CREATE INDEX idx_gifts_is_active ON gifts(is_active);
CREATE INDEX idx_gifts_created_at ON gifts(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_gift_stat(gift_slug TEXT, stat_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF stat_name = 'view' THEN
    UPDATE gifts SET view_count = view_count + 1 WHERE slug = gift_slug AND is_active = true;
  ELSIF stat_name = 'scratch' THEN
    UPDATE gifts SET scratch_count = scratch_count + 1 WHERE slug = gift_slug AND is_active = true;
  ELSIF stat_name = 'reveal' THEN
    UPDATE gifts SET reveal_count = reveal_count + 1 WHERE slug = gift_slug AND is_active = true;
  ELSIF stat_name = 'share' THEN
    UPDATE gifts SET share_count = share_count + 1 WHERE slug = gift_slug AND is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gift-images', 'gift-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read gift images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-images');

CREATE POLICY "Authenticated upload gift images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update gift images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete gift images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Public read active gifts
CREATE POLICY "Public read active gifts"
ON gifts FOR SELECT
TO anon
USING (
  is_active = true
  AND (expiration_date IS NULL OR expiration_date > NOW())
);

-- Users can read their own gifts (including inactive/expired)
CREATE POLICY "Users read own gifts"
ON gifts FOR SELECT
USING (auth.uid() = user_id);

-- Users can create gifts for themselves
CREATE POLICY "Users insert own gifts"
ON gifts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own gifts
CREATE POLICY "Users update own gifts"
ON gifts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own gifts
CREATE POLICY "Users delete own gifts"
ON gifts FOR DELETE
USING (auth.uid() = user_id);

-- Service role full access (for public pages & stats)
CREATE POLICY "Service role full access"
ON gifts FOR ALL
USING (auth.role() = 'service_role');

-- Allow public stat tracking via RPC
GRANT EXECUTE ON FUNCTION increment_gift_stat(TEXT, TEXT) TO anon, authenticated;

CREATE TABLE invitation_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX invitation_rsvps_named_unique
  ON invitation_rsvps (gift_id, guest_name)
  WHERE guest_name IS NOT NULL;

CREATE INDEX idx_invitation_rsvps_gift_id ON invitation_rsvps(gift_id);

CREATE TRIGGER update_invitation_rsvps_updated_at
  BEFORE UPDATE ON invitation_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE invitation_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own invitation rsvps"
ON invitation_rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gifts g
    WHERE g.id = gift_id AND g.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access rsvps"
ON invitation_rsvps FOR ALL
USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION submit_invitation_rsvp(
  gift_slug TEXT,
  guest_name TEXT,
  rsvp_response TEXT,
  rsvp_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  gid UUID;
  require_name BOOLEAN;
  trimmed_name TEXT;
  result_id UUID;
BEGIN
  IF rsvp_response NOT IN ('attending', 'declined') THEN
    RAISE EXCEPTION 'Invalid RSVP response';
  END IF;

  SELECT id, rsvp_require_name INTO gid, require_name FROM gifts
  WHERE slug = gift_slug
    AND is_active = true
    AND gift_type = 'invitation'
    AND (expiration_date IS NULL OR expiration_date > NOW());

  IF gid IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or inactive';
  END IF;

  trimmed_name := NULLIF(trim(submit_invitation_rsvp.guest_name), '');

  IF require_name THEN
    IF trimmed_name IS NULL THEN
      RAISE EXCEPTION 'Guest name is required';
    END IF;

    SELECT id INTO result_id
    FROM invitation_rsvps
    WHERE gift_id = gid AND invitation_rsvps.guest_name = trimmed_name;

    IF result_id IS NOT NULL THEN
      UPDATE invitation_rsvps
      SET response = rsvp_response, updated_at = NOW()
      WHERE id = result_id
      RETURNING id INTO result_id;
    ELSE
      INSERT INTO invitation_rsvps (gift_id, guest_name, response)
      VALUES (gid, trimmed_name, rsvp_response)
      RETURNING id INTO result_id;
    END IF;

    RETURN result_id;
  END IF;

  IF rsvp_id IS NOT NULL THEN
    UPDATE invitation_rsvps
    SET response = rsvp_response, updated_at = NOW()
    WHERE id = rsvp_id AND gift_id = gid
    RETURNING id INTO result_id;

    IF result_id IS NOT NULL THEN
      RETURN result_id;
    END IF;
  END IF;

  INSERT INTO invitation_rsvps (gift_id, guest_name, response)
  VALUES (gid, trimmed_name, rsvp_response)
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_invitation_rsvp(TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
