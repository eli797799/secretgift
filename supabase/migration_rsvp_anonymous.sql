-- Anonymous RSVP option (no name required)
-- Run in Supabase SQL Editor

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
