@echo off
echo ========================================
echo Religion Images Storage Setup
echo ========================================
echo.
echo This will guide you through setting up the religion-images storage bucket.
echo.
echo OPTION 1: Manual Setup (Recommended)
echo ----------------------------------------
echo 1. Open Supabase Dashboard
echo 2. Go to SQL Editor
echo 3. Open: migrations\setup-religion-images-storage.sql
echo 4. Copy the entire SQL content
echo 5. Paste into SQL Editor
echo 6. Click Run
echo.
echo OPTION 2: Dashboard UI
echo ----------------------------------------
echo 1. Go to Storage section in Supabase Dashboard
echo 2. Click "New Bucket"
echo 3. Name: religion-images
echo 4. Public: Yes
echo 5. File size: 10485760
echo 6. Allowed types: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml
echo.
pause
echo.
echo Opening SQL file for you to copy...
start notepad migrations\setup-religion-images-storage.sql
echo.
echo ✅ Next steps:
echo 1. Copy the SQL content from the opened file
echo 2. Paste into Supabase SQL Editor
echo 3. Click Run
echo 4. Test by uploading an image in the Religions panel
echo.
pause
