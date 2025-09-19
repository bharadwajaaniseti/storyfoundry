-- Fix RLS policies for project-assets bucket to support maps folder structure
-- Path structure: maps/userId/projectId/filename

-- Drop existing policies
DROP POLICY IF EXISTS "project_assets_upload" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_view" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_delete" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_update" ON storage.objects;

-- Create new policies that account for maps/userId/projectId structure
-- For uploads: check that the user ID matches the second folder in the path
CREATE POLICY "project_assets_upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- For viewing: allow users to view their own files
CREATE POLICY "project_assets_view" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- For deletion: allow users to delete their own files  
CREATE POLICY "project_assets_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Also add policy for updates (if needed for metadata updates)
CREATE POLICY "project_assets_update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);