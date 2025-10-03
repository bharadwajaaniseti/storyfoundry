# 🚀 Quick Setup: Religion Images Storage

## What Changed?
Images are now stored in **Supabase Storage** instead of base64 strings in the database. This makes uploads faster, storage more efficient, and images load from CDN.

## Setup Steps (Choose One Method)

### Method 1: SQL Editor (Recommended)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `migrations/setup-religion-images-storage.sql`
4. Click **Run**
5. ✅ Done!

### Method 2: Manual Dashboard Setup
1. Go to **Storage** in Supabase Dashboard
2. Click **"New Bucket"**
3. Fill in:
   - **Name:** `religion-images`
   - **Public:** ✅ Yes
   - **File size limit:** `10485760`
   - **Allowed MIME types:**
     ```
     image/png
     image/jpeg
     image/jpg
     image/gif
     image/webp
     image/svg+xml
     ```
4. Click **"Create bucket"**
5. Go to **SQL Editor** and run just the RLS policies section from `migrations/setup-religion-images-storage.sql` (Steps 2-4)
6. ✅ Done!

## Verify It Works

1. Go to your app → Religions panel
2. Open any religion in edit mode
3. Click **"Stats & Media"** tab
4. Click **"Upload Image"**
5. Select an image (< 10MB)
6. ✅ Image should upload successfully
7. Check Supabase Dashboard → Storage → `religion-images` bucket
8. Your uploaded image should appear there!

## What Happens to Old Images?

- Old base64 images will **continue to work** (backward compatible)
- New uploads will use Supabase Storage
- You can migrate old images later if needed (optional)

## Files Created

✅ `migrations/setup-religion-images-storage.sql` - Complete setup SQL
✅ `create-religion-images-bucket.js` - Automated script (optional)
✅ `RELIGION_IMAGES_STORAGE_SETUP.md` - Detailed documentation
✅ Updated `religions-panel.tsx` - New upload/delete functions

## Need Help?

**Bucket not found error?**
→ Make sure you created the bucket (see setup steps above)

**Access denied error?**
→ Run the RLS policies from the SQL file

**Upload fails?**
→ Check file size (< 10MB) and type (PNG, JPEG, GIF, WEBP, SVG only)

---

**Ready?** Just run the SQL migration and start uploading! 🎉
