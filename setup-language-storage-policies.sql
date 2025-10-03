-- ============================================================================
-- LANGUAGE STORAGE BUCKET POLICIES
-- ============================================================================
-- Run this SQL in Supabase SQL Editor after creating the storage buckets
-- This sets up Row Level Security policies for language-symbols and language-images buckets

-- ============================================================================
-- LANGUAGE SYMBOLS BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view language symbols" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload language symbols" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their language symbols" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their language symbols" ON storage.objects;

-- Policy: Anyone can view language symbols (public bucket)
CREATE POLICY "Users can view language symbols"
ON storage.objects FOR SELECT
USING (bucket_id = 'language-symbols');

-- Policy: Authenticated users can upload language symbols
CREATE POLICY "Users can upload language symbols"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'language-symbols' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update symbols for their own languages
CREATE POLICY "Users can update their language symbols"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'language-symbols' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM world_elements 
    WHERE user_id = auth.uid() 
    AND category = 'languages'
  )
);

-- Policy: Users can delete symbols for their own languages
CREATE POLICY "Users can delete their language symbols"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'language-symbols' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM world_elements 
    WHERE user_id = auth.uid() 
    AND category = 'languages'
  )
);

-- ============================================================================
-- LANGUAGE IMAGES BUCKET POLICIES
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view language images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload language images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their language images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their language images" ON storage.objects;

-- Policy: Anyone can view language images (public bucket)
CREATE POLICY "Users can view language images"
ON storage.objects FOR SELECT
USING (bucket_id = 'language-images');

-- Policy: Authenticated users can upload language images
CREATE POLICY "Users can upload language images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'language-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update images for their own languages
CREATE POLICY "Users can update their language images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'language-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM world_elements 
    WHERE user_id = auth.uid() 
    AND category = 'languages'
  )
);

-- Policy: Users can delete images for their own languages
CREATE POLICY "Users can delete their language images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'language-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM world_elements 
    WHERE user_id = auth.uid() 
    AND category = 'languages'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify buckets exist
SELECT 
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('language-symbols', 'language-images')
ORDER BY id;

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%language%'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
BUCKET STRUCTURE:
  language-symbols/
    ├── {language-id}/
    │   ├── {uuid}.png
    │   ├── {uuid}.jpg
    │   └── {uuid}.svg
    
  language-images/
    ├── {language-id}/
    │   ├── {uuid}.png
    │   ├── {uuid}.jpg
    │   └── {uuid}.webp

SECURITY MODEL:
  - SELECT: Public access (anyone can view images)
  - INSERT: Authenticated users only
  - UPDATE/DELETE: Only users who own the language

FILE ORGANIZATION:
  - Files are organized by language ID in folders
  - This allows easy cleanup when a language is deleted
  - Policy checks folder name against user's languages

USAGE IN CODE:
  // Upload symbol image
  const filePath = `${languageId}/${crypto.randomUUID()}.${fileExt}`
  await supabase.storage.from('language-symbols').upload(filePath, file)
  
  // Upload language reference image
  const filePath = `${languageId}/${crypto.randomUUID()}.${fileExt}`
  await supabase.storage.from('language-images').upload(filePath, file)
  
  // Get public URL
  const { data } = supabase.storage
    .from('language-symbols')
    .getPublicUrl(filePath)
*/
