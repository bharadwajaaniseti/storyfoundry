# Maps Feature with Full Annotation Support - Database Setup Guide

## Issue
The Maps feature in the world-building section is showing an error because the required database tables don't exist yet.

**Error Message:** `Error loading maps: {}`

## Annotation Types Supported

The enhanced database setup supports **5 types of map annotations**:

1. **Pins** - Point markers with labels, descriptions, colors, and icons
2. **Labels** - Text overlays with custom fonts, colors, and rotation
3. **Zones** - Polygon areas with fill colors, borders, and opacity
4. **Measurements** - Distance, area, and perimeter measurements with different units
5. **Decorations** - Rich graphical elements (circles, rectangles, stars, custom shapes, etc.)

## Database Architecture

The setup provides **two storage approaches**:

### Approach 1: JSONB Storage (Default)
- All annotations stored in the `maps.annotations` JSONB field
- Simpler queries and easier migration
- Good for smaller datasets

### Approach 2: Dedicated Tables (Advanced)
- Separate tables for each annotation type
- Better performance for complex queries
- Easier to index and search specific annotation types
- Recommended for production use with many annotations

## Solution

### Option 1: Quick Fix (Recommended)
1. Go to your Supabase dashboard: https://sejryxeefedjwuwhqpgu.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire content of `SETUP_MAPS_DATABASE.sql` into the SQL editor
4. Click "Run" to execute the script
5. Refresh your application - the Maps feature should now work

### Option 2: Manual Migration (Advanced)
If you have Supabase CLI set up locally:
1. Run: `supabase db push`
2. This will apply the migration files in `supabase/migrations/`

## What This Sets Up

The database setup creates:
- **maps table**: Stores map information (name, description, image URL, etc.)
- **Storage bucket**: For storing map image files
- **Row Level Security (RLS)**: Ensures users can only access maps for their own projects
- **Storage policies**: Secure file upload/download permissions

## Testing

After running the setup:
1. Go to any project in your app
2. Navigate to the "World Building" section
3. Try creating a new map or uploading a map image
4. The error should be resolved and maps should work normally

## Database Schema

### Maps Table
The main maps table includes:
- `id`: Unique identifier
- `project_id`: Links to the project this map belongs to
- `name`: Map name
- `description`: Optional description
- `image_url`: URL to the uploaded map image
- `file_path`: Storage path for the image file
- `viewport`: JSON field storing zoom/pan state
- `annotations`: JSON field containing all 5 annotation types
- `attributes`: JSON field for additional map properties
- `created_at`, `updated_at`: Timestamps

### Annotation Tables (Optional Enhanced Structure)
- `map_pins`: Point markers with coordinates, labels, colors
- `map_labels`: Text overlays with styling options
- `map_zones`: Polygon areas with visual properties
- `map_measurements`: Measurement tools with units and calculations
- `map_decorations`: Rich decorative elements with extensive customization

## Security

- Users can only see, create, edit, and delete maps for projects they own
- Map images are publicly readable but only uploadable by project owners
- All database operations are protected by Row Level Security policies