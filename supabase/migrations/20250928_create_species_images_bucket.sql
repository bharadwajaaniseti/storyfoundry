-- Create species images bucket
insert into storage.buckets (id, name, public)
values ('species-images', 'species-images', true);

-- Set up bucket size limit to 5MB and allowed MIME types
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
where id = 'species-images';

-- Allow authenticated users to upload images
create policy "Authenticated users can upload species images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'species-images' and
    auth.role() = 'authenticated'
);

-- Allow public to view species images
create policy "Anyone can view species images"
on storage.objects for select
to public
using (bucket_id = 'species-images');

-- Allow users to delete their own images
create policy "Users can delete their own species images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'species-images' and
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow users to update their own images (for renaming, moving, etc.)
create policy "Users can update their own species images"
on storage.objects for update
to authenticated
using (
    bucket_id = 'species-images' and
    auth.uid() = (storage.foldername(name))[1]::uuid
);