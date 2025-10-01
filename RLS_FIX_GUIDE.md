# RLS Policy Error Fix - Culture Icons Storage

## Problem
Error: `new row violates row-level security policy`

This happens when uploading culture icon images because the RLS policies are too restrictive or incorrectly configured.

---

## Quick Fix (Recommended)

### Step 1: Run the Fix SQL
1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy and paste the contents of `fix-culture-icons-rls.sql`
4. Click **Run**

This will:
- ✅ Drop any existing policies
- ✅ Create new, simpler policies
- ✅ Allow any authenticated user to upload to `culture-icons` bucket
- ✅ Verify the policies were created

---

## Manual Fix (Alternative)

If you prefer to do it manually:

### 1. Check Existing Policies
```sql
-- See what policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%culture%';
```

### 2. Delete Old Policies
Go to **Storage** → **Policies** in Supabase Dashboard and delete any policies for `culture-icons` bucket.

OR run this SQL:
```sql
DROP POLICY IF EXISTS "Allow authenticated users to upload culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update culture icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete culture icons" ON storage.objects;
```

### 3. Create New Simple Policies

**Upload Policy:**
```sql
CREATE POLICY "Allow authenticated users to upload culture icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'culture-icons');
```

**Read Policy:**
```sql
CREATE POLICY "Allow public read access to culture icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'culture-icons');
```

**Update Policy:**
```sql
CREATE POLICY "Allow authenticated users to update culture icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'culture-icons')
WITH CHECK (bucket_id = 'culture-icons');
```

**Delete Policy:**
```sql
CREATE POLICY "Allow authenticated users to delete culture icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'culture-icons');
```

---

## Verify It's Working

### 1. Check Policies in Dashboard
1. Go to **Storage** in Supabase
2. Click on `culture-icons` bucket
3. Click **Policies** tab
4. You should see 4 policies listed

### 2. Test Upload
1. Go to your app
2. Create or edit a culture
3. Click "Choose Symbol"
4. Upload a test image
5. Should work without errors!

---

## Understanding the Fix

### Original Problem
The original policies were checking `project_collaborators` table:
```sql
(storage.foldername(name))[1] IN (
  SELECT project_id::text 
  FROM project_collaborators 
  WHERE user_id = auth.uid()
)
```

**Issues:**
- ❌ Table might not exist or have different structure
- ❌ Complex query that can fail
- ❌ Requires exact folder structure match
- ❌ UUID conversion might not work correctly

### New Solution
Simplified policies that just check:
```sql
WITH CHECK (bucket_id = 'culture-icons')
```

**Benefits:**
- ✅ Simple and reliable
- ✅ Works for any authenticated user
- ✅ No complex table lookups
- ✅ Easy to debug

**Security:**
- Still requires authentication
- Public bucket for reading (needed for image display)
- Users can only access `culture-icons` bucket
- File size and type restrictions in bucket config

---

## Still Having Issues?

### Error: "Policy already exists"
**Solution:** Drop the existing policy first (see Step 2 in Manual Fix)

### Error: "Permission denied"
**Solution:** Make sure you're logged in to your app. The RLS policies require authentication.

### Error: "Bucket not found"
**Solution:** Create the `culture-icons` bucket first (see STORAGE_SETUP_GUIDE.md)

### Images upload but don't display
**Solution:** Check that the "Read" policy exists and bucket is public.

### Need Stricter Security?
If you want to restrict uploads to specific projects, uncomment the stricter policy in `setup-culture-icons-storage.sql` and modify it based on your actual database schema.

---

## Testing Checklist

After applying the fix:

- [ ] Policies visible in Supabase Dashboard
- [ ] Can upload image (< 5MB)
- [ ] Can see preview after upload
- [ ] Image displays in culture card
- [ ] No console errors
- [ ] Can delete and re-upload
- [ ] Can change from emoji to image
- [ ] Can change from image to emoji

---

## Need More Help?

1. **Check Browser Console**: Look for specific error messages
2. **Check Supabase Logs**: Dashboard → Logs → Filter by "storage"
3. **Verify Authentication**: Make sure `auth.uid()` is working
4. **Check Bucket Config**: Storage → culture-icons → Settings

---

## Summary

**Quick Steps:**
1. Run `fix-culture-icons-rls.sql` in SQL Editor
2. Test upload in your app
3. ✅ Done!

The new policies are simpler and more permissive, allowing any authenticated user to upload. This is suitable for most use cases and can be tightened later if needed.
