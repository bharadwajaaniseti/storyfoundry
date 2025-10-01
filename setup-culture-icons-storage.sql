-- ============================================
-- STEP 1: Create the bucket via Supabase Dashboard
-- ============================================
-- Go to: Storage > Create a new bucket
-- Bucket name: culture-icons
-- Public bucket: YES (checked)
-- File size limit: 2MB (2097152 bytes)
-- Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp
-- 
-- OR run this in your terminal/code:
-- const { data, error } = await supabase.storage.createBucket('culture-icons', {
--   public: true,
--   fileSizeLimit: 2097152,
--   allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
-- })
--
-- ============================================

-- ============================================
-- STEP 2: Set up RLS policies (Run this SQL)
-- ============================================
-- NOTE: First, delete any existing policies if you're re-running this:
-- DROP POLICY IF EXISTS "Allow authenticated users to upload culture icons" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public read access to culture icons" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to update culture icons" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete culture icons" ON storage.objects;

-- Policy 1: Allow authenticated users to upload (simplified - anyone authenticated can upload)
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

-- Policy 3: Allow authenticated users to update (simplified)
CREATE POLICY "Allow authenticated users to update culture icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'culture-icons')
WITH CHECK (bucket_id = 'culture-icons');

-- Policy 4: Allow authenticated users to delete (simplified)
CREATE POLICY "Allow authenticated users to delete culture icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'culture-icons');

-- Optional: If you want to restrict by project ownership, uncomment and modify these:
-- You'll need to adjust based on your actual database schema
/*
-- Stricter policy for project-based access:
CREATE POLICY "Upload to own projects only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'culture-icons' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT p.id::text
    FROM projects p
    WHERE p.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = p.id AND pc.user_id = auth.uid()
    )
  )
);
*/
