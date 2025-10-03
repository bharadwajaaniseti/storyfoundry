# Philosophy Images - Implementation Guide

## ✅ Migration Complete

The `philosophy-images` storage bucket has been created with the following configuration:

- **Bucket Name**: `philosophy-images`
- **Public Access**: Yes (images are publicly viewable)
- **File Size Limit**: 5MB per image
- **Allowed Types**: JPEG, JPG, PNG, GIF, WebP
- **RLS Policies**: ✅ Configured for secure access

---

## 📁 Folder Structure

```
philosophy-images/
  └── {project_id}/
      └── {philosophy_id}/
          ├── cover.jpg
          ├── symbol.png
          └── diagram.webp
```

---

## 🔒 Security Policies

### ✅ Policy 1: Public Read (SELECT)
- **Who**: Anyone (public)
- **Action**: View/download images
- **Rule**: All images in `philosophy-images` bucket

### ✅ Policy 2: Upload (INSERT)
- **Who**: Authenticated users
- **Action**: Upload new images
- **Rule**: Only to their own project folders

### ✅ Policy 3: Update (UPDATE)
- **Who**: Authenticated users
- **Action**: Replace existing images
- **Rule**: Only in their own project folders

### ✅ Policy 4: Delete (DELETE)
- **Who**: Authenticated users
- **Action**: Remove images
- **Rule**: Only from their own project folders

---

## 💻 Implementation Code for Media Tab

### Current State
The Media tab in `philosophies-panel.tsx` (lines 2740-2899) currently has:
- Upload button (line 2747) - **NOT YET FUNCTIONAL**
- Select from Library button (line 2754) - **PLACEHOLDER**
- Image display grid (lines 2760-2899) - **READY**

### Update Required: Upload Handler

Replace the placeholder upload handler with this working implementation:

```typescript
// Add this helper function near the top of PhilosophyWorkspace component
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files || files.length === 0) return

  const uploadedUrls: string[] = []
  
  for (const file of Array.from(files)) {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is 5MB.`)
      continue
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert(`${file.name} is not a supported image type.`)
      continue
    }

    try {
      // Generate unique filename to avoid collisions
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${projectId}/${philosophyId || 'temp'}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('philosophy-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('philosophy-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(urlData.publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload ${file.name}`)
    }
  }

  // Update form with new image URLs
  if (uploadedUrls.length > 0) {
    onFormChange({
      ...form,
      images: [...form.images, ...uploadedUrls]
    })
  }

  // Reset input
  e.target.value = ''
}
```

### Update the Upload Button (Line ~2747)

```typescript
<div>
  <input
    type="file"
    id="philosophy-image-upload"
    multiple
    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
    className="hidden"
    onChange={handleImageUpload}
  />
  <Button
    type="button"
    variant="outline"
    onClick={() => document.getElementById('philosophy-image-upload')?.click()}
    className="w-full"
  >
    <Upload className="w-4 h-4 mr-2" />
    Upload Images
  </Button>
</div>
```

### Update the Delete Handler (Line ~2884)

```typescript
const handleImageDelete = async (imageUrl: string, index: number) => {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this image?')) return

  try {
    // Extract path from public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/philosophy-images/{path}
    const urlParts = imageUrl.split('/philosophy-images/')
    if (urlParts.length === 2) {
      const filePath = urlParts[1]
      
      // Delete from storage
      const { error } = await supabase.storage
        .from('philosophy-images')
        .remove([filePath])

      if (error) {
        console.error('Error deleting from storage:', error)
        // Continue anyway to remove from UI
      }
    }

    // Remove from form
    const updatedImages = form.images.filter((_, i) => i !== index)
    onFormChange({
      ...form,
      images: updatedImages
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    alert('Failed to delete image')
  }
}
```

Update the delete button:
```typescript
<Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={() => handleImageDelete(image, index)}
  className="opacity-0 group-hover:opacity-100"
>
  <Trash2 className="w-4 h-4" />
</Button>
```

---

## 🚀 Quick Implementation Steps

1. **Add `handleImageUpload` function** to PhilosophyWorkspace component
2. **Update upload button** with file input and onChange handler
3. **Add `handleImageDelete` function** for removing images
4. **Update delete button** to call handleImageDelete
5. **Test upload/delete** functionality

---

## 🧪 Testing Checklist

### Upload Tests
- [ ] Upload single image → appears in grid
- [ ] Upload multiple images → all appear in grid
- [ ] Upload >5MB image → shows error
- [ ] Upload non-image file → shows error
- [ ] Upload 5 images at once → all upload successfully

### Delete Tests
- [ ] Delete image → removes from grid and storage
- [ ] Delete cover image → next image becomes cover
- [ ] Delete all images → empty state shows

### Display Tests
- [ ] Images display in 4-column grid
- [ ] Cover image has amber badge
- [ ] Hover shows reorder/delete buttons
- [ ] Reorder buttons work correctly

### Security Tests
- [ ] Can upload to own project ✅
- [ ] Cannot upload to other's project ✅
- [ ] Can delete own images ✅
- [ ] Cannot delete other's images ✅
- [ ] Public can view images ✅

---

## 📊 Image URL Format

### Uploaded Image URL
```
https://{project}.supabase.co/storage/v1/object/public/philosophy-images/{project_id}/{philosophy_id}/{filename}.jpg
```

### Example
```
https://abcdefgh.supabase.co/storage/v1/object/public/philosophy-images/123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/1696348800000-abc123.jpg
```

---

## 🔧 Additional Features (Optional)

### Image Optimization
```typescript
// Resize images before upload using browser Canvas API
const resizeImage = (file: File, maxWidth: number = 1200): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
```

### Progress Indicator
```typescript
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

// In upload handler:
const { data, error } = await supabase.storage
  .from('philosophy-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    onUploadProgress: (progress) => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: (progress.loaded / progress.total) * 100
      }))
    }
  })
```

### Lazy Loading
```typescript
<img
  src={image}
  alt={`Philosophy image ${index + 1}`}
  loading="lazy" // Browser-native lazy loading
  className="w-full h-48 object-cover"
/>
```

---

## 🐛 Troubleshooting

### Upload Fails with 403 Error
- **Cause**: RLS policy blocking upload
- **Fix**: Check that user owns the project (verify `owner_id = auth.uid()`)

### Upload Fails with 413 Error
- **Cause**: File too large
- **Fix**: Validate file size before upload (5MB limit)

### Images Don't Display
- **Cause**: URL format incorrect or bucket not public
- **Fix**: Verify bucket is public and URL format matches expected pattern

### Delete Doesn't Remove from Storage
- **Cause**: Path extraction failed
- **Fix**: Log the extracted path and verify it matches the storage path

---

## 📝 Notes

- **Storage Costs**: Supabase free tier includes 1GB storage
- **Bandwidth**: Free tier includes 2GB bandwidth/month
- **Cleanup**: Consider implementing auto-cleanup for deleted philosophies
- **Thumbnails**: Consider generating thumbnails for better performance

---

## 🎯 Next Steps

1. ✅ Migration complete
2. ⏳ Implement upload handler
3. ⏳ Implement delete handler
4. ⏳ Test functionality
5. ⏳ Deploy to production

---

**Status**: Ready for Implementation  
**Bucket**: `philosophy-images` ✅  
**Policies**: Configured ✅  
**Code**: Implementation guide above ⬆️

