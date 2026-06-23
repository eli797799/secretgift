-- Add multiple scratch cards support
-- Run in Supabase SQL Editor if you already have the gifts table

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
