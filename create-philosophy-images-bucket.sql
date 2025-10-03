-- ================================================
-- Philosophy Images Storage Bucket
-- ================================================
-- Purpose: Store philosophy images with proper RLS policies
-- Created: 2024
-- ================================================

-- Create the storage bucket for philosophy images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'philosophy-images',
  'philosophy-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- RLS Policies for philosophy-images bucket
-- ================================================
-- Note: These policies are managed through Supabase Dashboard or via supabase_admin role
-- If running via SQL Editor, you may need to use the Dashboard's Storage Policies UI instead

-- Drop existing policies if they exist (cleanup)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload philosophy images to their projects" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for philosophy images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update philosophy images in their projects" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete philosophy images from their projects" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload images for philosophies they own" ON storage.objects;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy drops - insufficient privileges. Use Supabase Dashboard Storage Policies instead.';
END $$;

-- Policy 1: Allow authenticated users to upload images to their own project folders
DO $$ 
BEGIN
  CREATE POLICY "Users can upload philosophy images to their projects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'philosophy-images' AND
    -- Path format: project_id/philosophy_id/filename.ext
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM projects 
      WHERE owner_id = auth.uid()
    )
  );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create INSERT policy - use Supabase Dashboard > Storage > philosophy-images > Policies';
END $$;

-- Policy 2: Allow public read access to all philosophy images
DO $$ 
BEGIN
  CREATE POLICY "Public read access for philosophy images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'philosophy-images');
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create SELECT policy - use Supabase Dashboard > Storage > philosophy-images > Policies';
END $$;

-- Policy 3: Allow authenticated users to update images in their own project folders
DO $$ 
BEGIN
  CREATE POLICY "Users can update philosophy images in their projects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'philosophy-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM projects 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'philosophy-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM projects 
      WHERE owner_id = auth.uid()
    )
  );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create UPDATE policy - use Supabase Dashboard > Storage > philosophy-images > Policies';
END $$;

-- Policy 4: Allow authenticated users to delete images from their own project folders
DO $$ 
BEGIN
  CREATE POLICY "Users can delete philosophy images from their projects"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'philosophy-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM projects 
      WHERE owner_id = auth.uid()
    )
  );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create DELETE policy - use Supabase Dashboard > Storage > philosophy-images > Policies';
END $$;

-- ================================================
-- Indexes for Performance
-- ================================================

-- Add index on world_elements for faster philosophy lookups
CREATE INDEX IF NOT EXISTS idx_world_elements_category_project 
ON world_elements(category, project_id) 
WHERE category = 'philosophy';

-- ================================================
-- MANUAL STEPS: Create Storage Policies via Dashboard
-- ================================================

/*
If the policies above failed due to permissions, create them manually in Supabase Dashboard:

1. Go to: Storage > philosophy-images > Policies
2. Click "New Policy" for each policy below:

POLICY 1: SELECT (Public Read)
---------------------------------
Policy Name: Public read access for philosophy images
Allowed operation: SELECT
Target roles: public
USING expression:
  bucket_id = 'philosophy-images'


POLICY 2: INSERT (Upload)
---------------------------------
Policy Name: Users can upload philosophy images to their projects
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression:
  bucket_id = 'philosophy-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM projects 
    WHERE owner_id = auth.uid()
  )


POLICY 3: UPDATE (Modify)
---------------------------------
Policy Name: Users can update philosophy images in their projects
Allowed operation: UPDATE
Target roles: authenticated
USING expression:
  bucket_id = 'philosophy-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM projects 
    WHERE owner_id = auth.uid()
  )
WITH CHECK expression:
  bucket_id = 'philosophy-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM projects 
    WHERE owner_id = auth.uid()
  )


POLICY 4: DELETE (Remove)
---------------------------------
Policy Name: Users can delete philosophy images from their projects
Allowed operation: DELETE
Target roles: authenticated
USING expression:
  bucket_id = 'philosophy-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM projects 
    WHERE owner_id = auth.uid()
  )
*/

-- ================================================
-- Usage Example (for reference, not executed)
-- ================================================

/*
-- File path format in bucket:
-- philosophy-images/
--   ├── {project_id}/
--   │   ├── {philosophy_id}/
--   │   │   ├── cover.jpg
--   │   │   ├── symbol.png
--   │   │   └── diagram.webp

-- Upload example (from JavaScript):
const { data, error } = await supabase.storage
  .from('philosophy-images')
  .upload(`${projectId}/${philosophyId}/${file.name}`, file)

-- Get public URL:
const { data } = supabase.storage
  .from('philosophy-images')
  .getPublicUrl(`${projectId}/${philosophyId}/image.jpg`)

-- Delete example:
const { error } = await supabase.storage
  .from('philosophy-images')
  .remove([`${projectId}/${philosophyId}/image.jpg`])
*/
