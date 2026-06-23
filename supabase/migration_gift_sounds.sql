-- Custom gift sound + optional scratch rubbing sound
-- Run in Supabase SQL Editor

ALTER TABLE gifts
  ADD COLUMN IF NOT EXISTS custom_sound_url TEXT,
  ADD COLUMN IF NOT EXISTS scratch_sound_enabled BOOLEAN NOT NULL DEFAULT true;
