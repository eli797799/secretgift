-- =============================================================================
-- SecretGift — הרצת מיגרציות (Supabase SQL Editor)
-- הרץ את הקבצים לפי הסדר. אם כבר הרצת חלק — דלג עליו.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. migration_scratch_cards.sql (אם אין עמודת scratch_cards)
-- -----------------------------------------------------------------------------
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS scratch_cards JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE gifts
SET scratch_cards = jsonb_build_array(
  jsonb_build_object(
    'hidden_scratch_text', hidden_scratch_text,
    'scratch_cover_type', scratch_cover_type,
    'scratch_cover_image_url', scratch_cover_image_url
  )
)
WHERE scratch_cards = '[]'::jsonb OR scratch_cards IS NULL;

-- -----------------------------------------------------------------------------
-- 2. migration_user_accounts.sql (אם אין user_id)
-- -----------------------------------------------------------------------------
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gifts_user_id ON gifts(user_id);

DROP POLICY IF EXISTS "Users read own gifts" ON gifts;
CREATE POLICY "Users read own gifts" ON gifts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own gifts" ON gifts;
CREATE POLICY "Users insert own gifts" ON gifts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own gifts" ON gifts;
CREATE POLICY "Users update own gifts" ON gifts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own gifts" ON gifts;
CREATE POLICY "Users delete own gifts" ON gifts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON gifts;
CREATE POLICY "Service role full access" ON gifts FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 3. migration_owner_whatsapp.sql
-- -----------------------------------------------------------------------------
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS owner_whatsapp VARCHAR(20);

-- -----------------------------------------------------------------------------
-- 4. migration_gift_sounds.sql
-- -----------------------------------------------------------------------------
ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS custom_sound_url TEXT,
  ADD COLUMN IF NOT EXISTS scratch_sound_enabled BOOLEAN NOT NULL DEFAULT true;

-- -----------------------------------------------------------------------------
-- 5. migration_invitations.sql
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE gift_type AS ENUM ('gift', 'invitation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS gift_type gift_type NOT NULL DEFAULT 'gift',
  ADD COLUMN IF NOT EXISTS event_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS event_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_location TEXT;

-- -----------------------------------------------------------------------------
-- 6. migration_invitation_rsvps.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invitation_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_rsvps_gift_id ON invitation_rsvps(gift_id);

DROP TRIGGER IF EXISTS update_invitation_rsvps_updated_at ON invitation_rsvps;
CREATE TRIGGER update_invitation_rsvps_updated_at
  BEFORE UPDATE ON invitation_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE invitation_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own invitation rsvps" ON invitation_rsvps;
CREATE POLICY "Owners read own invitation rsvps"
ON invitation_rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gifts g
    WHERE g.id = gift_id AND g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role full access rsvps" ON invitation_rsvps;
CREATE POLICY "Service role full access rsvps"
ON invitation_rsvps FOR ALL
USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 7. migration_rsvp_anonymous.sql (RSVP + אישור בלי שם)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS submit_invitation_rsvp(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS submit_invitation_rsvp(TEXT, TEXT, TEXT, UUID);

ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS rsvp_require_name BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE invitation_rsvps
  ALTER COLUMN guest_name DROP NOT NULL;

ALTER TABLE invitation_rsvps
  DROP CONSTRAINT IF EXISTS invitation_rsvps_gift_id_guest_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS invitation_rsvps_named_unique
  ON invitation_rsvps (gift_id, guest_name)
  WHERE guest_name IS NOT NULL;

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

-- -----------------------------------------------------------------------------
-- 8. migration_rls_user_isolation.sql (כל משתמש רואה רק את שלו)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active gifts" ON gifts;

CREATE POLICY "Public read active gifts"
ON gifts FOR SELECT
TO anon
USING (
  is_active = true
  AND (expiration_date IS NULL OR expiration_date > NOW())
);
