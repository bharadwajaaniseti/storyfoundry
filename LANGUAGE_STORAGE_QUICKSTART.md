# 🚀 Quick Setup: Language Storage Buckets

## Prerequisites
✅ Supabase project created  
✅ `.env.local` configured with keys  
✅ Node.js installed

## 2-Step Setup

### Step 1️⃣: Create Buckets (30 seconds)

```bash
node create-language-storage.js
```

**What it creates:**
- `language-symbols` bucket (5MB limit) - For glyphs/symbols
- `language-images` bucket (10MB limit) - For reference images

### Step 2️⃣: Apply Policies (30 seconds)

1. Open Supabase Dashboard → SQL Editor
2. Copy `setup-language-storage-policies.sql`
3. Paste and run

**What it creates:**
- 8 RLS policies (read/write protection)
- Public read, authenticated write
- Owner-only update/delete

## ✅ Verification

Run in SQL Editor:
```sql
SELECT id, public FROM storage.buckets 
WHERE id LIKE 'language-%';
```

Should return 2 buckets, both public.

## 🎯 You're Done!

Now you can:
- ✅ Upload symbol images in Script tab
- ✅ Upload reference images in Media tab
- ✅ Set cover images
- ✅ Remove images

## 📖 Full Documentation

See `LANGUAGE_STORAGE_SETUP.md` for:
- Troubleshooting
- Security model
- Code examples
- Cleanup functions

---

**Time to complete:** ~2 minutes  
**Difficulty:** Easy ⭐  
**Required once:** Yes
