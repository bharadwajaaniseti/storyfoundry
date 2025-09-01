-- Create storage bucket and policies for profile pictures
-- This sets up secure file upload for user avatars

-- Create storage bucket for profile pictures (if not already created via dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can view all avatars (public read)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy: Users can upload avatar to their own folder
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMENT ON POLICY "Avatar images are publicly accessible" ON storage.objects IS 'Allow public read access to avatar images';
COMMENT ON POLICY "Users can upload their own avatar" ON storage.objects IS 'Users can only upload avatars to their own user folder';
COMMENT ON POLICY "Users can update their own avatar" ON storage.objects IS 'Users can only update their own avatar files';
COMMENT ON POLICY "Users can delete their own avatar" ON storage.objects IS 'Users can only delete their own avatar files';
