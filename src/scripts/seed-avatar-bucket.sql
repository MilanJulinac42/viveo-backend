-- ============================================================================
-- Celebrity Avatars — Storage Bucket Setup
-- ============================================================================
-- Run in Supabase SQL Editor
-- ============================================================================

-- Create public bucket for celebrity avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('celebrity-avatars', 'celebrity-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'celebrity-avatars');

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'celebrity-avatars');

-- Allow authenticated users to update their avatars (upsert)
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'celebrity-avatars');

-- Allow authenticated users to delete old avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'celebrity-avatars');
