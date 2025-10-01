# Setting Up Culture Icons Storage Bucket

## Quick Setup Guide

You have **3 options** to create the `culture-icons` storage bucket:

---

## Option 1: Supabase Dashboard (Easiest) ⭐

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"** button
4. Configure the bucket:
   - **Name**: `culture-icons`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: 
     ```
     image/png
     image/jpeg
     image/jpg
     image/svg+xml
     image/webp
     ```
5. Click **"Create bucket"**
6. Then run the SQL policies (see Step 2 below)

---

## Option 2: Node.js Script

1. Make sure you have your **Service Role Key** in `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Run the script:
   ```bash
   node create-culture-icons-bucket.js
   ```

3. Then run the SQL policies (see Step 2 below)

---

## Option 3: Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste and run:
   ```javascript
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(
     'YOUR_SUPABASE_URL',
     'YOUR_SERVICE_ROLE_KEY'
   );
   
   await supabase.storage.createBucket('culture-icons', {
     public: true,
     fileSizeLimit: 5242880,
     allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
   });
   ```

4. Then run the SQL policies (see Step 2 below)

---

## Step 2: Set Up RLS Policies (Required)

After creating the bucket using any method above:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL from `setup-culture-icons-storage.sql` (starting from "STEP 2")
3. The policies will:
   - ✅ Allow authenticated users to upload to their project folders
   - ✅ Allow public read access (for viewing images)
   - ✅ Allow authenticated users to update/delete their own images
   - ✅ Prevent unauthorized access to other projects' images

---

## Verification

After setup, verify the bucket exists:

### In Supabase Dashboard:
1. Go to **Storage**
2. You should see `culture-icons` in the bucket list
3. Click on it - you should see an empty folder structure

### In Your App:
1. Go to Cultures panel
2. Create or edit a culture
3. Click "Choose Symbol"
4. Try uploading an image
5. If successful, you'll see a preview

---

## Troubleshooting

### Error: "must be owner of relation buckets"
**Solution**: Don't try to INSERT into `storage.buckets` directly. Use one of the 3 options above instead.

### Error: "Service role key required"
**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local` file (for Option 2)

### Error: "Bucket already exists"
**Solution**: That's fine! The bucket is already created. Just run the SQL policies (Step 2).

### Images not uploading
**Checklist**:
- ✅ Bucket exists and is public
- ✅ RLS policies are created
- ✅ User is authenticated
- ✅ File size < 5MB
- ✅ File type is allowed (PNG, JPEG, SVG, WEBP)

---

## What Gets Created

### Storage Bucket:
- **Name**: `culture-icons`
- **Access**: Public (anyone can view)
- **Size Limit**: 5MB per file
- **Types**: PNG, JPEG, JPG, SVG, WEBP

### Folder Structure:
```
culture-icons/
├── {project-id-1}/
│   ├── 1234567890-abc123.png
│   ├── 1234567890-def456.jpg
│   └── ...
├── {project-id-2}/
│   └── ...
```

### RLS Policies:
1. **Upload**: Users can upload to their project folders only
2. **Read**: Anyone can view images (public bucket)
3. **Update**: Users can update their project's images
4. **Delete**: Users can delete their project's images

---

## Summary

**Recommended**: Use **Option 1** (Dashboard) - it's the easiest and most reliable.

**Steps**:
1. Create bucket in Dashboard (or use script)
2. Run SQL policies from `setup-culture-icons-storage.sql`
3. Test by uploading a culture symbol
4. ✅ Done!

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs in Dashboard > Logs
2. Verify RLS policies are created: Storage > Policies
3. Check browser console for error messages
4. Ensure you're authenticated in the app
