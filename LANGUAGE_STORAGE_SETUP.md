# Language Storage Setup Guide

## Overview
This guide will help you set up Supabase storage buckets for the Languages panel. Two buckets are needed:

1. **language-symbols** - For writing system glyphs and symbols (5MB limit)
2. **language-images** - For reference images, calligraphy samples, and charts (10MB limit)

## Prerequisites
- Supabase project created
- Service role key available (found in Supabase Dashboard → Settings → API)
- Environment variables configured

## Environment Variables Required

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Needed for bucket creation
```

## Setup Methods

### Method 1: Automated Setup (Recommended)

#### Step 1: Create Buckets
Run the JavaScript setup script:

```bash
node create-language-storage.js
```

Expected output:
```
🚀 Creating language storage buckets...

✅ Successfully created bucket "language-symbols"
   Storage for language writing system symbols and glyphs
   Public: true
   File size limit: 5MB
   Allowed types: PNG, JPG, JPEG, SVG, WEBP, GIF

✅ Successfully created bucket "language-images"
   Storage for language reference images, calligraphy samples, and charts
   Public: true
   File size limit: 10MB
   Allowed types: PNG, JPG, JPEG, SVG, WEBP, GIF

📝 Next step: Run the SQL policies in setup-language-storage-policies.sql
```

#### Step 2: Apply Security Policies
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `setup-language-storage-policies.sql`
4. Paste and run the SQL

Expected result:
- 8 policies created (4 per bucket)
- Verification queries show buckets and policies

### Method 2: Manual Setup (If Script Fails)

#### Step 1: Create Buckets Manually
1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Create **language-symbols** bucket:
   - Name: `language-symbols`
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types:
     - `image/png`
     - `image/jpeg`
     - `image/jpg`
     - `image/svg+xml`
     - `image/webp`
     - `image/gif`

4. Create **language-images** bucket:
   - Name: `language-images`
   - Public: ✅ Yes
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: (same as above)

#### Step 2: Apply Policies
Run the SQL file as described in Method 1, Step 2

## Verification

After setup, verify everything works:

### 1. Check Buckets Exist
Run this SQL query:
```sql
SELECT 
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('language-symbols', 'language-images')
ORDER BY id;
```

Expected output:
| bucket_name | public | file_size_limit | allowed_mime_types | created_at |
|-------------|--------|-----------------|-------------------|------------|
| language-images | true | 10485760 | {image/png, ...} | 2024-xx-xx |
| language-symbols | true | 5242880 | {image/png, ...} | 2024-xx-xx |

### 2. Check Policies Exist
Run this SQL query:
```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%language%'
ORDER BY policyname;
```

Expected output: 8 policies (4 for symbols, 4 for images)

### 3. Test Upload in App
1. Open Languages panel
2. Create or edit a language
3. Go to Script tab
4. Try uploading a symbol image
5. Go to Media tab
6. Try uploading a reference image

## Bucket Structure

Files are organized by language ID:

```
language-symbols/
  ├── {language-id-1}/
  │   ├── abc123.png        ← Symbol glyph
  │   ├── def456.svg        ← Symbol glyph
  │   └── ghi789.jpg        ← Symbol glyph
  ├── {language-id-2}/
  │   └── jkl012.png
  └── ...

language-images/
  ├── {language-id-1}/
  │   ├── sample1.jpg       ← Calligraphy sample
  │   ├── chart1.png        ← Grammar chart
  │   └── reference1.webp   ← Reference image
  ├── {language-id-2}/
  │   └── sample2.jpg
  └── ...
```

## Security Model

### Public Read Access
- ✅ Anyone can view images (bucket is public)
- ✅ Enables sharing language references without authentication

### Protected Write Access
- ✅ Only authenticated users can upload
- ✅ Only language owners can update/delete their images
- ✅ Prevents unauthorized file manipulation

### Folder-Based Security
Files are checked against the `world_elements` table:
```sql
WHERE (storage.foldername(name))[1] IN (
  SELECT id::text FROM world_elements 
  WHERE user_id = auth.uid() 
  AND category = 'languages'
)
```

## Usage in Code

### Upload Symbol Image
```typescript
const supabase = createSupabaseClient()
const fileExt = file.name.split('.').pop()
const fileName = `${crypto.randomUUID()}.${fileExt}`
const filePath = `${languageId}/${fileName}`

const { error } = await supabase.storage
  .from('language-symbols')
  .upload(filePath, file)

const { data: { publicUrl } } = supabase.storage
  .from('language-symbols')
  .getPublicUrl(filePath)
```

### Upload Language Reference Image
```typescript
const filePath = `${languageId}/${crypto.randomUUID()}.${fileExt}`

const { error } = await supabase.storage
  .from('language-images')
  .upload(filePath, file)

const { data: { publicUrl } } = supabase.storage
  .from('language-images')
  .getPublicUrl(filePath)
```

### Delete Images When Language is Deleted
```typescript
// Clean up all images for a language
const { data: files } = await supabase.storage
  .from('language-symbols')
  .list(languageId)

if (files && files.length > 0) {
  const filePaths = files.map(f => `${languageId}/${f.name}`)
  await supabase.storage
    .from('language-symbols')
    .remove(filePaths)
}

// Repeat for language-images bucket
```

## Troubleshooting

### Error: "Missing environment variables"
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Restart your development server after adding env vars

### Error: "Bucket already exists"
- This is normal if you've run the script before
- Skip to Step 2 (SQL policies)

### Error: "Permission denied"
- Verify service role key is correct
- Check you're using the service role key, not the anon key

### Upload Fails: "Policy violation"
- Verify SQL policies were applied
- Check user is authenticated
- Verify language belongs to user

### Images Don't Display
- Check bucket is set to Public
- Verify URL is using `getPublicUrl()` not `createSignedUrl()`
- Check browser console for CORS errors

## File Size Limits

| Bucket | Limit | Recommended Use |
|--------|-------|-----------------|
| language-symbols | 5MB | Individual symbol glyphs, writing system characters |
| language-images | 10MB | Calligraphy samples, grammar charts, reference images |

**Note:** If you need to store larger files (PDFs, videos), create a separate bucket with appropriate limits.

## Cleanup Recommendations

### When Deleting a Language
Always clean up associated storage:
```typescript
async function deleteLanguageAndFiles(languageId: string) {
  // 1. Delete from database
  await supabase.from('world_elements').delete().eq('id', languageId)
  
  // 2. Clean up symbol images
  const { data: symbols } = await supabase.storage
    .from('language-symbols')
    .list(languageId)
  if (symbols?.length) {
    await supabase.storage
      .from('language-symbols')
      .remove(symbols.map(f => `${languageId}/${f.name}`))
  }
  
  // 3. Clean up reference images
  const { data: images } = await supabase.storage
    .from('language-images')
    .list(languageId)
  if (images?.length) {
    await supabase.storage
      .from('language-images')
      .remove(images.map(f => `${languageId}/${f.name}`))
  }
}
```

## Next Steps

After successful setup:
1. ✅ Test image uploads in the Languages panel
2. ✅ Verify images display correctly
3. ✅ Test that other users can't delete your images
4. ✅ Implement cleanup function for deleted languages
5. ✅ Consider adding image optimization (resize, compress)
6. ✅ Add progress indicators for large uploads

## Support

If you encounter issues:
1. Check Supabase Dashboard → Storage → Policies
2. Review browser console for errors
3. Check Supabase logs in Dashboard
4. Verify environment variables are loaded
5. Test with a small image file first

---

**Status**: Ready to deploy ✅  
**Last Updated**: October 2025  
**Version**: 1.0
