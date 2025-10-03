-- Migration: Create system-images storage bucket with RLS policies
-- Created: 2025-10-02
-- Purpose: Storage bucket for Systems Panel image uploads
--
-- This migration creates:
--   1. system-images storage bucket
--   2. RLS policies for authenticated users
--   3. Public access for reading images

-- ============================================================================
-- STEP 1: Create the storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-images',
  'system-images',
  true, -- Public bucket so images can be displayed
  5242880, -- 5MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Enable RLS on storage.objects
-- ============================================================================

-- RLS should already be enabled, but just in case:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS policies for system-images bucket
-- ============================================================================

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload system images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'system-images'
);

-- Policy 2: Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update system images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'system-images')
WITH CHECK (bucket_id = 'system-images');

-- Policy 3: Allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated users can delete system images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'system-images');

-- Policy 4: Allow public read access to all images (since bucket is public)
CREATE POLICY "Public can read system images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'system-images');

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================================================

-- Check if bucket was created successfully
-- SELECT * FROM storage.buckets WHERE id = 'system-images';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%system images%';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Bucket Configuration:
--   - Name: system-images
--   - Public: Yes (images are publicly accessible via URL)
--   - Max File Size: 5MB
--   - Allowed Types: PNG, JPEG, JPG, GIF, WEBP
--
-- Security:
--   - Only authenticated users can upload/update/delete
--   - Anyone can view images (public read access)
--   - File size and type restrictions enforced
--
-- Usage in Code:
--   const { data, error } = await supabase.storage
--     .from('system-images')
--     .upload(`${projectId}/${filename}`, file)
--
-- File Path Structure:
--   system-images/
--     ├── {projectId}/
--     │   ├── {timestamp}-{random}.png
--     │   ├── {timestamp}-{random}.jpg
--     │   └── ...
--
-- Rollback:
--   To remove this bucket and its policies, run:
--   DELETE FROM storage.objects WHERE bucket_id = 'system-images';
--   DELETE FROM storage.buckets WHERE id = 'system-images';
