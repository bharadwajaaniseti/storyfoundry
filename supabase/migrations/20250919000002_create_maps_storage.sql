-- Create storage bucket and policies for map images
-- This sets up storage for world-building map images

-- Create storage bucket for map images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maps', 'maps', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to map images  
CREATE POLICY "Map images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'maps');

-- Allow users to upload map images for their own projects
CREATE POLICY "Users can upload map images for their projects" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'maps' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'maps'
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id::text = (storage.foldername(name))[2]
    AND projects.owner_id = auth.uid()
  )
);

-- Allow users to update map images for their own projects
CREATE POLICY "Users can update map images for their projects" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'maps' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'maps'
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id::text = (storage.foldername(name))[2]
    AND projects.owner_id = auth.uid()
  )
);

-- Allow users to delete map images for their own projects
CREATE POLICY "Users can delete map images for their projects" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'maps' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'maps'
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id::text = (storage.foldername(name))[2]
    AND projects.owner_id = auth.uid()
  )
);

COMMENT ON POLICY "Map images are publicly accessible" ON storage.objects IS 'Allow public read access to map images';
COMMENT ON POLICY "Users can upload map images for their projects" ON storage.objects IS 'Allow users to upload map images for projects they own';
COMMENT ON POLICY "Users can update map images for their projects" ON storage.objects IS 'Allow users to update map images for projects they own';
COMMENT ON POLICY "Users can delete map images for their projects" ON storage.objects IS 'Allow users to delete map images for projects they own';