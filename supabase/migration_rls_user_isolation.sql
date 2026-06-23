-- Fix: authenticated users were seeing all active gifts (not just their own)
-- Run in Supabase SQL Editor

DROP POLICY IF EXISTS "Public read active gifts" ON gifts;

CREATE POLICY "Public read active gifts"
ON gifts FOR SELECT
TO anon
USING (
  is_active = true
  AND (expiration_date IS NULL OR expiration_date > NOW())
);
