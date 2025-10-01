# Cultures Feature - Media Upload Implementation

## Overview
Enhanced the Cultures feature's "Arts & Food" tab to support rich media content (images, text, and links) for Famous Works and Traditional Dishes sections.

## What Was Changed

### 1. New Components Created

#### `MediaItemInput.tsx`
- **Purpose**: Rich input component for adding cultural items with multiple media types
- **Features**:
  - Text input for name/description
  - Image upload via click or drag & drop
  - Optional URL/link input
  - 5MB file size limit validation
  - Preview uploaded images
  - Individual remove buttons
  - Uploading state indicator
  - Error handling

#### `MediaItemDisplay.tsx`
- **Purpose**: Display component for showing media items in read-only views
- **Features**:
  - Shows image thumbnail if available
  - Displays item name
  - Shows external link with icon
  - Responsive layout

### 2. Updated Components

#### `CultureEditor.tsx`
- **Changes**:
  - Imported `MediaItemInput` and `MediaItem` types
  - Added `migrateToMediaItems()` helper function for backward compatibility
  - Replaced simple string array inputs with `MediaItemInput` components
  - Updated "Famous Works" section with rich media support
  - Updated "Traditional Dishes" section with rich media support
  - Added helpful descriptions for each section
  - Modified useEffect to auto-migrate old string arrays to MediaItem format

#### `cultureSchema.ts`
- **Changes**:
  - Added `MediaItem` interface export
  - Updated `Culture` interface to support both `string[]` and `MediaItem[]` for:
    - `famous_works`
    - `dishes`
  - Added `iconImage` to attributes for culture symbol images
  - Maintained backward compatibility with existing data

### 3. Storage Configuration
- **Bucket**: Reuses existing `culture-icons` bucket
- **Path**: `{projectId}/{timestamp}-{random}.{ext}`
- **Allowed Types**: PNG, JPEG, JPG, SVG, WEBP
- **Max Size**: 5MB per file
- **Access**: Public URLs for display

## Features

### For Famous Works
Users can now:
- ✅ Enter work name (e.g., "Epic of Gilgamesh", "Mona Lisa")
- ✅ Upload an image of the artwork/book cover
- ✅ Add a link to more information (museum website, Wikipedia, etc.)
- ✅ Leave any field blank (all fields are optional except name)
- ✅ See preview of uploaded images
- ✅ Remove individual works
- ✅ Drag & drop images directly

### For Traditional Dishes
Users can now:
- ✅ Enter dish name (e.g., "Paella", "Sushi", "Biryani")
- ✅ Upload a photo of the dish
- ✅ Add a link to recipe or restaurant
- ✅ Leave any field blank (all fields are optional except name)
- ✅ See preview of uploaded food photos
- ✅ Remove individual dishes
- ✅ Drag & drop images directly

## User Experience

### Adding Items
1. Click "Add Famous Work" or "Add Dish"
2. A card appears with three sections:
   - **Name field**: Required text input
   - **Image section**: Optional - click or drag to upload
   - **Link section**: Optional URL input
3. Fill in any combination of the three fields
4. Click "Update Culture" to save

### Image Upload
- Click the dashed box to browse files
- Or drag and drop images directly
- Shows upload progress with spinner
- Displays error messages if file is too large or wrong type
- Preview shows immediately after upload
- Hover to see remove button on uploaded images

### Flexibility
- ✅ Text only: Just enter a name
- ✅ Text + Image: Name with visual representation
- ✅ Text + Link: Name with external resource
- ✅ Full rich content: Name + Image + Link
- ✅ Image only: Upload image, optional name

## Data Structure

### MediaItem Interface
```typescript
interface MediaItem {
  name: string           // Item name/title
  imageUrl?: string      // Public URL to uploaded image
  link?: string          // External URL (recipe, wiki, etc.)
}
```

### Database Storage
Stored in `world_elements.attributes` as:
```json
{
  "famous_works": [
    {
      "name": "The Epic of Gilgamesh",
      "imageUrl": "https://...supabase.co/.../epic.jpg",
      "link": "https://en.wikipedia.org/wiki/Epic_of_Gilgamesh"
    }
  ],
  "dishes": [
    {
      "name": "Paella",
      "imageUrl": "https://...supabase.co/.../paella.jpg",
      "link": "https://example.com/paella-recipe"
    }
  ]
}
```

## Backward Compatibility

### Migration Strategy
- **Old Format**: `["Work 1", "Work 2", "Dish 1"]`
- **New Format**: `[{name: "Work 1", imageUrl: undefined, link: undefined}, ...]`

### Auto-Migration
The `migrateToMediaItems()` function automatically converts old string arrays to the new MediaItem format when:
- Loading existing cultures
- Editing cultures created before this update
- No data loss - old names are preserved

### TypeScript Support
```typescript
famous_works?: MediaItem[] | string[]  // Union type allows both formats
dishes?: MediaItem[] | string[]        // Seamless migration
```

## Technical Details

### File Upload Flow
1. User selects/drops image
2. Validate file type and size
3. Generate unique filename: `{projectId}/{timestamp}-{random}.{ext}`
4. Upload to Supabase Storage `culture-icons` bucket
5. Get public URL
6. Update MediaItem with imageUrl
7. Call parent onChange to propagate to form state

### State Management
- Local state in `MediaItemInput` for upload status
- Parent state in `CultureEditor` for item data
- Propagates to `cultures-panel` for save to database
- Proper cleanup on remove

### Error Handling
- File type validation (images only)
- File size validation (5MB max)
- Upload failure handling
- User-friendly error messages
- Loading states during upload

## UI/UX Improvements

### Visual Design
- Card-based layout with hover effects
- Pink accent color matching Cultures theme
- Clear visual hierarchy
- Responsive image previews
- Drag & drop visual feedback
- Loading spinners during upload

### Accessibility
- Proper aria-labels
- Keyboard navigation support
- Screen reader friendly
- Clear error messages
- Focus management

## Files Modified

```
src/
├── components/
│   └── cultures/
│       ├── CultureEditor.tsx          (Modified)
│       ├── MediaItemInput.tsx         (New)
│       └── MediaItemDisplay.tsx       (New)
└── lib/
    └── validation/
        └── cultureSchema.ts           (Modified)
```

## Testing Checklist

- ✅ Add Famous Work with name only
- ✅ Add Famous Work with name + image
- ✅ Add Famous Work with name + link
- ✅ Add Famous Work with all three fields
- ✅ Add Dish with name only
- ✅ Add Dish with name + image
- ✅ Add Dish with name + link
- ✅ Add Dish with all three fields
- ✅ Drag & drop image upload
- ✅ Click to browse image upload
- ✅ Remove uploaded image
- ✅ Remove entire item
- ✅ File size validation (>5MB error)
- ✅ File type validation (non-image error)
- ✅ Save and reload culture
- ✅ Images persist after refresh
- ✅ Links open in new tab
- ✅ Old string array migrations

## Future Enhancements

Potential improvements:
1. Image editing/cropping before upload
2. Multiple images per item (gallery)
3. Video support
4. PDF upload for documents
5. Rich text editor for descriptions
6. Tags for categorizing items
7. Sort/reorder items
8. Bulk upload
9. Image optimization/compression
10. CDN integration for faster loading

## Summary

The Cultures feature now supports rich media content for cultural artifacts and traditional dishes. Users have complete flexibility to add text, images, and links in any combination. The implementation maintains backward compatibility with existing data and provides a smooth user experience with drag & drop uploads, real-time previews, and clear error handling.
