-- Migration: add user accounts support
-- Run this if you already have the old schema without user_id

ALTER TABLE gifts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gifts_user_id ON gifts(user_id);

-- Drop old admin-only policy if exists
DROP POLICY IF EXISTS "Service role full access" ON gifts;

-- User ownership policies
DROP POLICY IF EXISTS "Users read own gifts" ON gifts;
CREATE POLICY "Users read own gifts"
ON gifts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own gifts" ON gifts;
CREATE POLICY "Users insert own gifts"
ON gifts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own gifts" ON gifts;
CREATE POLICY "Users update own gifts"
ON gifts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own gifts" ON gifts;
CREATE POLICY "Users delete own gifts"
ON gifts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
ON gifts FOR ALL
USING (auth.role() = 'service_role');

-- Update storage policies
DROP POLICY IF EXISTS "Authenticated upload gift images" ON storage.objects;
CREATE POLICY "Authenticated upload gift images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update gift images" ON storage.objects;
CREATE POLICY "Authenticated update gift images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete gift images" ON storage.objects;
CREATE POLICY "Authenticated delete gift images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gift-images' AND auth.role() = 'authenticated');

-- Enable email signup in Supabase Dashboard:
-- Authentication > Providers > Email > Enable Email provider
-- Optional: disable "Confirm email" for faster testing
