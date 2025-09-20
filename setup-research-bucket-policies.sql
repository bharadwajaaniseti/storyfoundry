-- Research Bucket RLS Policies Setup
-- Run these commands in your Supabase SQL Editor

-- Allow authenticated users to insert files into research bucket
CREATE POLICY "Allow authenticated users to upload research files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'research');

-- Allow authenticated users to view files in research bucket
CREATE POLICY "Allow authenticated users to view research files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'research');

-- Allow authenticated users to update files in research bucket
CREATE POLICY "Allow authenticated users to update research files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'research');

-- Allow authenticated users to delete files in research bucket
CREATE POLICY "Allow authenticated users to delete research files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'research');

-- Optional: Allow public read access if you want research files to be publicly viewable
-- Uncomment the line below if you want this:
-- CREATE POLICY "Allow public read access to research files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'research');