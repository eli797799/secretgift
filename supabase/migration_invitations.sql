-- Invitation scratch card type
-- Run in Supabase SQL Editor

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
