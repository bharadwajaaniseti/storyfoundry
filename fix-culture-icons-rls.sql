-- Quick Fix: Drop existing policies and create simple ones
-- Run this in your Supabase SQL Editor

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated users to upload culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete culture icons" ON storage.objects;

-- Create simple, permissive policies
-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload culture icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'culture-icons'
);

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access to culture icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'culture-icons');

-- Policy 3: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update culture icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'culture-icons')
WITH CHECK (bucket_id = 'culture-icons');

-- Policy 4: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete culture icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'culture-icons');

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%culture icons%';
