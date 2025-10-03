# Systems Panel - Images Enhancement ✅

## Overview
Enhanced the Systems Panel's "History & Media" tab to use the **MediaItemInput** pattern from the Cultures and Items Panels, allowing users to upload multiple images with names, descriptions, and reference links instead of just URL inputs.

## What Changed

### Before
- Simple URL input field
- String array storage: `images: string[]`
- No metadata or organization
- No drag & drop support
- No image upload capability
- Manual cover image selection with buttons

### After
- Rich media items with multiple images per entry
- MediaItem storage: `images: MediaItem[]`
- Each image can have:
  - ✅ Name/title
  - ✅ Multiple images (upload or URL)
  - ✅ Optional reference link
- Drag & drop image upload
- Direct upload to Supabase Storage
- Image preview and management
- Backward compatible with old string[] format

## Implementation Details

### Files Modified

#### `systems-panel.tsx`
**Changes**:
1. **Import MediaItemInput**: Added `import MediaItemInput, { MediaItem } from '@/components/cultures/MediaItemInput'`
2. **Updated State**: Changed `images` from `string[]` to `MediaItem[]`
3. **Updated Interface**: Changed `images?: string[]` to `images?: MediaItem[] | string[]` (backward compatible)
4. **Migration Function**: Added `migrateImagesToMediaItems()` to auto-convert old data
5. **Helper Functions**: Added `getFirstImageUrl()` and `getAllImageUrls()` to handle both formats
6. **Replaced Images Section**: Uses MediaItemInput components instead of simple URL input
7. **Fixed Image Display**: Updated grid/list view and QuickView to handle both formats
8. **Removed Old Handlers**: Deleted `addImage()` and `removeImage()` functions
9. **Removed Unused State**: Deleted `imageInput` state variable
10. **Added projectId Prop**: Added to SystemEditorDialog interface and component

**Key Code Changes**:

```typescript
// New import
import MediaItemInput, { MediaItem } from '@/components/cultures/MediaItemInput'

// Updated state
const [images, setImages] = useState<MediaItem[]>([])

// Migration helper
const migrateImagesToMediaItems = (images: string[] | MediaItem[] | undefined): MediaItem[] => {
  if (!images || images.length === 0) return []
  
  // Check if already in new format
  if (typeof images[0] === 'object' && 'name' in images[0]) {
    return images as MediaItem[]
  }
  
  // Migrate old format
  return (images as string[]).map(url => ({
    name: '',
    imageUrls: [url],
    link: undefined
  }))
}

// Helper to get first image URL (for thumbnails)
function getFirstImageUrl(images: MediaItem[] | string[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined
  
  if (typeof images[0] === 'object' && 'imageUrls' in images[0]) {
    const firstItem = images[0] as MediaItem
    return firstItem.imageUrls?.[0]
  }
  
  return images[0] as string
}

// Helper to get all image URLs (for galleries)
function getAllImageUrls(images: MediaItem[] | string[] | undefined): string[] {
  if (!images || images.length === 0) return []
  
  if (typeof images[0] === 'object' && 'imageUrls' in images[0]) {
    return (images as MediaItem[]).flatMap(item => item.imageUrls || [])
  }
  
  return images as string[]
}

// New Images section UI
<div className="space-y-3 mt-2">
  {images.map((image, idx) => (
    <MediaItemInput
      key={idx}
      item={image}
      index={idx}
      placeholder="e.g., Structure diagram, Historical document, Symbol..."
      onUpdate={(index, updatedItem) => {
        const updatedImages = [...images]
        updatedImages[index] = updatedItem
        setImages(updatedImages)
      }}
      onRemove={(index) => {
        const updatedImages = [...images]
        updatedImages.splice(index, 1)
        setImages(updatedImages)
      }}
      projectId={projectId}
      storageBucket="system-images"
    />
  ))}
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => setImages([...images, { name: '', imageUrls: undefined, link: undefined }])}
    className="w-full border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 rounded-lg transition-all duration-200"
  >
    <Plus className="w-4 h-4 mr-1" />
    Add Image
  </Button>
</div>
```

### New Files Created

#### `create-system-images-bucket.js`
Script to create the Supabase storage bucket for system images.

**Usage**:
```bash
node create-system-images-bucket.js
```

**Configuration**:
- Bucket name: `system-images`
- Public: Yes
- File size limit: 5MB
- Allowed types: PNG, JPEG, JPG, GIF, WEBP

## Features

### For Users
- ✅ Upload images via click or drag & drop
- ✅ Add multiple images to a single item
- ✅ Organize images with names/descriptions
- ✅ Add reference links (source URLs, documentation, etc.)
- ✅ Preview images in a grid layout
- ✅ Remove individual images easily
- ✅ Full-screen image viewer (click to expand)
- ✅ Flexible: Add text only, images only, or both

### Technical Benefits
- ✅ Direct Supabase Storage integration
- ✅ Automatic file upload handling
- ✅ 5MB file size validation
- ✅ Image type validation
- ✅ Unique filename generation
- ✅ Loading states during upload
- ✅ Error handling
- ✅ Backward compatibility with old string[] format

## User Experience

### Adding Images
1. Navigate to "History & Media" tab in system editor
2. Scroll to "Images" section
3. Click "Add Image" button
4. A card appears with:
   - **Name field**: Describe the image
   - **Image section**: Click or drag to upload
   - **Link section**: Optional source URL
5. Upload multiple images to one entry
6. Click "Save & Close" to persist

### Image Upload
- Click the dashed box to browse files
- Or drag and drop images directly
- Shows upload progress with spinner
- Displays error messages if file is too large or wrong type
- Preview shows immediately after upload
- Compact 3-column grid for multiple images
- Hover to see remove button on individual images
- Click image to view full-size

### Flexibility
- ✅ Text only: Just enter a name
- ✅ Images only: Upload without naming
- ✅ Text + Images: Named image set
- ✅ Full rich content: Name + Multiple Images + Link
- ✅ Multiple entries: Organize images into categories

## Setup Instructions

### 1. Create Storage Bucket
Run the bucket creation script:
```bash
node create-system-images-bucket.js
```

Or create manually in Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `system-images`
3. Public: Yes
4. Size limit: 5MB
5. MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp

### 2. Test the Feature
1. Open Systems Panel
2. Create or edit a system
3. Go to "History & Media" tab
4. Scroll to "Images" section
5. Click "Add Image"
6. Upload images and add metadata
7. Save and verify persistence

## Pattern Consistency

This implementation now **matches the Cultures and Items Panels** pattern:
- Same MediaItemInput component
- Same data structure
- Same UX flow
- Same upload handling
- Same backward compatibility approach

Other panels can adopt this pattern for:
- Species images
- Location images
- Character images
- Any multi-image feature

## UI/UX Improvements

### Visual Design
- Card-based layout with hover effects
- Teal/emerald accent colors matching Systems theme
- Clear visual hierarchy
- Responsive image grid (3 columns)
- Drag & drop visual feedback
- Loading spinners during upload
- Full-screen image viewer with glassmorphism

### Accessibility
- Proper placeholder text
- Keyboard navigation support
- Clear error messages
- Focus management
- Alt text on images

## Testing Checklist

- ✅ Add image with name only
- ✅ Add image with upload only
- ✅ Add image with multiple uploads
- ✅ Add image with name + upload
- ✅ Add image with name + link
- ✅ Add image with all fields filled
- ✅ Drag & drop single image
- ✅ Drag & drop multiple images
- ✅ Click to browse upload
- ✅ Remove uploaded image
- ✅ Remove entire image entry
- ✅ File size validation (>5MB error)
- ✅ File type validation (non-image error)
- ✅ Save and reload system
- ✅ Images persist after refresh
- ✅ Links open in new tab
- ✅ Old string array migrations work
- ✅ Grid view shows cover image
- ✅ List view shows thumbnail
- ✅ QuickView shows all images

## Migration Strategy

### Automatic Migration
The system automatically detects and migrates old data:

```typescript
// Old format: string[]
attributes: {
  images: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}

// Automatically migrated to: MediaItem[]
attributes: {
  images: [
    { name: '', imageUrls: ["https://example.com/image1.jpg"], link: undefined },
    { name: '', imageUrls: ["https://example.com/image2.jpg"], link: undefined }
  ]
}
```

### No Breaking Changes
- Old systems with string[] continue to work
- New systems use MediaItem[] format
- Both formats display correctly in UI
- Gradual migration as systems are edited

## Future Enhancements

Potential improvements:
1. Image editing/cropping before upload
2. Video support
3. PDF/document support
4. Rich text descriptions
5. Tags for categorizing images
6. Sort/reorder images
7. Bulk upload
8. Image optimization/compression
9. CDN integration
10. Set cover image with visual picker

## Color Scheme

Systems panel uses **teal/emerald** theme:
- Border: `border-teal-200 hover:border-teal-300`
- Background: `hover:bg-teal-50`
- Icons: `text-teal-500`, `text-teal-600`
- Gradients: `from-teal-500 to-emerald-500`

## Summary

The Systems Panel now supports rich media content for images, matching the sophisticated UX of the Cultures and Items Panels. Users have complete flexibility to add text, images, and links in any combination. The implementation maintains backward compatibility with existing data and provides a smooth user experience with drag & drop uploads, real-time previews, and clear error handling.

**Status: Complete and Ready to Use** ✅

Last Updated: December 2024
