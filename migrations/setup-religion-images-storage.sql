-- ====================================================
-- RELIGION IMAGES STORAGE BUCKET SETUP
-- ====================================================
-- Run this SQL in your Supabase SQL Editor to set up the storage bucket
-- Or create the bucket manually via Dashboard and run the RLS policies below

-- Step 1: Create the storage bucket (if using SQL)
-- Note: You may need to create this via Supabase Dashboard instead
-- Dashboard: Storage → New Bucket → Name: "religion-images", Public: Yes

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'religion-images',
  'religion-images',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "religion_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "religion_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "religion_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "religion_images_delete_policy" ON storage.objects;

-- Step 4: Create RLS Policies

-- Policy 1: Allow authenticated users to upload (INSERT)
CREATE POLICY "religion_images_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'religion-images'
);

-- Policy 2: Allow public to view/download (SELECT)
CREATE POLICY "religion_images_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'religion-images'
);

-- Policy 3: Allow authenticated users to update (UPDATE)
CREATE POLICY "religion_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'religion-images')
WITH CHECK (bucket_id = 'religion-images');

-- Policy 4: Allow authenticated users to delete (DELETE)
CREATE POLICY "religion_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'religion-images'
);

-- Step 5: Verify the setup
-- Check if bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE id = 'religion-images';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%religion_images%'
ORDER BY policyname;

-- ====================================================
-- MANUAL DASHBOARD SETUP (Alternative)
-- ====================================================
-- If the bucket creation SQL doesn't work, create manually:
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create a new bucket"
-- 3. Enter the following:
--    • Name: religion-images
--    • Public: ✅ Yes
--    • File size limit: 10485760 (bytes)
--    • Allowed MIME types:
--      - image/png
--      - image/jpeg
--      - image/jpg
--      - image/gif
--      - image/webp
--      - image/svg+xml
-- 4. Click "Create bucket"
-- 5. Then run the RLS policies (Steps 2-4) above
-- ====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Religion images storage bucket setup complete!';
  RAISE NOTICE '📁 Bucket: religion-images';
  RAISE NOTICE '🔒 RLS Policies: Configured';
  RAISE NOTICE '👥 Access: Public read, Authenticated write';
  RAISE NOTICE '💾 Size limit: 10MB per file';
  RAISE NOTICE '🎨 Allowed: PNG, JPEG, JPG, GIF, WEBP, SVG';
END $$;
