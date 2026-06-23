-- Gift Scratch Card System Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE scratch_cover_type AS ENUM ('gray', 'gold', 'silver', 'custom');
CREATE TYPE reveal_animation_type AS ENUM ('confetti', 'fireworks', 'sparkles', 'win');
CREATE TYPE winner_image_type AS ENUM ('trophy', 'gift', 'balloons', 'custom', 'none');

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
  custom_sound_url TEXT,
  scratch_sound_enabled BOOLEAN NOT NULL DEFAULT true,
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

-- Public can read active, non-expired gifts
CREATE POLICY "Public read active gifts"
ON gifts FOR SELECT
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
