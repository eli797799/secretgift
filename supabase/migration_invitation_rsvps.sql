-- Invitation RSVP (attendance confirmation)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invitation_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gift_id, guest_name)
);

CREATE INDEX IF NOT EXISTS idx_invitation_rsvps_gift_id ON invitation_rsvps(gift_id);

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
  rsvp_response TEXT
)
RETURNS VOID AS $$
DECLARE
  gid UUID;
BEGIN
  IF rsvp_response NOT IN ('attending', 'declined') THEN
    RAISE EXCEPTION 'Invalid RSVP response';
  END IF;

  IF trim(guest_name) = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;

  SELECT id INTO gid FROM gifts
  WHERE slug = gift_slug
    AND is_active = true
    AND gift_type = 'invitation'
    AND (expiration_date IS NULL OR expiration_date > NOW());

  IF gid IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or inactive';
  END IF;

  INSERT INTO invitation_rsvps (gift_id, guest_name, response)
  VALUES (gid, trim(guest_name), rsvp_response)
  ON CONFLICT (gift_id, guest_name)
  DO UPDATE SET
    response = EXCLUDED.response,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_invitation_rsvp(TEXT, TEXT, TEXT) TO anon, authenticated;
