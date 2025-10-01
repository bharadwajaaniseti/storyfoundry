-- Drop all policies first
drop policy if exists "Authenticated users can upload species images" on storage.objects;
drop policy if exists "Anyone can view species images" on storage.objects;
drop policy if exists "Users can delete their own species images" on storage.objects;
drop policy if exists "Users can update their own species images" on storage.objects;

-- Delete all objects in the bucket
delete from storage.objects where bucket_id = 'species-images';

-- Drop the bucket
drop bucket if exists species-images;