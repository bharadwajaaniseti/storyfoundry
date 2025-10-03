-- Migration: Convert system images from string[] to MediaItem[] format
-- Database: Supabase PostgreSQL
-- Date: 2025-10-02
-- 
-- This migration converts the old image format (array of URLs) to the new 
-- MediaItem format with name, imageUrls, and link fields.
--
-- ⚠️  IMPORTANT: Backup your data before running this migration!
--
-- Usage:
--   1. Review the SELECT query below to see what will be changed
--   2. If satisfied, run the UPDATE query
--   3. Verify the changes with the validation query

-- ============================================================================
-- STEP 1: PREVIEW - See which systems will be affected
-- ============================================================================
-- This shows all systems with images in the old format (string[])

SELECT 
  id,
  name,
  category,
  (attributes->>'images')::text as current_images,
  jsonb_array_length(attributes->'images') as image_count,
  updated_at
FROM world_elements
WHERE 
  category = 'systems'
  AND attributes ? 'images'
  AND jsonb_typeof(attributes->'images') = 'array'
  AND jsonb_array_length(attributes->'images') > 0
  -- Check if first element is a string (old format)
  AND jsonb_typeof(attributes->'images'->0) = 'string'
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 2: BACKUP - Create a backup of current data (RECOMMENDED!)
-- ============================================================================
-- Uncomment and run this to create a backup table

-- CREATE TABLE world_elements_backup_20251002 AS 
-- SELECT * FROM world_elements 
-- WHERE category = 'systems' 
--   AND attributes ? 'images';

-- ============================================================================
-- STEP 3: MIGRATION - Convert old format to new format
-- ============================================================================
-- This updates all systems with images from string[] to MediaItem[]

-- IMPORTANT: Review the preview query results before running this!

WITH systems_to_migrate AS (
  SELECT 
    id,
    name,
    attributes,
    attributes->'images' as old_images
  FROM world_elements
  WHERE 
    category = 'systems'
    AND attributes ? 'images'
    AND jsonb_typeof(attributes->'images') = 'array'
    AND jsonb_array_length(attributes->'images') > 0
    AND jsonb_typeof(attributes->'images'->0) = 'string'
),
converted_data AS (
  SELECT 
    id,
    name,
    attributes,
    old_images,
    -- Convert each string URL to a MediaItem object
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', '',
          'imageUrls', jsonb_build_array(image_url),
          'link', null
        )
      )
      FROM jsonb_array_elements_text(old_images) AS image_url
    ) AS new_images
  FROM systems_to_migrate
)
UPDATE world_elements
SET 
  attributes = jsonb_set(
    world_elements.attributes,
    '{images}',
    converted_data.new_images
  ),
  updated_at = NOW()
FROM converted_data
WHERE world_elements.id = converted_data.id
RETURNING 
  world_elements.id,
  world_elements.name,
  jsonb_array_length(world_elements.attributes->'images') as migrated_count;

-- ============================================================================
-- STEP 4: VALIDATION - Verify the migration
-- ============================================================================
-- Check that all systems now have the new format

-- Count systems by image format
SELECT 
  'Old Format (string[])' as format_type,
  COUNT(*) as count
FROM world_elements
WHERE 
  category = 'systems'
  AND attributes ? 'images'
  AND jsonb_typeof(attributes->'images') = 'array'
  AND jsonb_array_length(attributes->'images') > 0
  AND jsonb_typeof(attributes->'images'->0) = 'string'

UNION ALL

SELECT 
  'New Format (MediaItem[])' as format_type,
  COUNT(*) as count
FROM world_elements
WHERE 
  category = 'systems'
  AND attributes ? 'images'
  AND jsonb_typeof(attributes->'images') = 'array'
  AND jsonb_array_length(attributes->'images') > 0
  AND jsonb_typeof(attributes->'images'->0) = 'object'
  AND (attributes->'images'->0) ? 'imageUrls'

UNION ALL

SELECT 
  'No Images' as format_type,
  COUNT(*) as count
FROM world_elements
WHERE 
  category = 'systems'
  AND (
    NOT (attributes ? 'images')
    OR jsonb_typeof(attributes->'images') != 'array'
    OR jsonb_array_length(attributes->'images') = 0
  );

-- ============================================================================
-- STEP 5: SAMPLE - View migrated data
-- ============================================================================
-- Look at a few migrated systems to verify the data looks correct

SELECT 
  id,
  name,
  jsonb_pretty(attributes->'images') as migrated_images,
  updated_at
FROM world_elements
WHERE 
  category = 'systems'
  AND attributes ? 'images'
  AND jsonb_typeof(attributes->'images') = 'array'
  AND jsonb_array_length(attributes->'images') > 0
  AND jsonb_typeof(attributes->'images'->0) = 'object'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================
-- If something went wrong and you created a backup, restore it:

-- UPDATE world_elements we
-- SET 
--   attributes = backup.attributes,
--   updated_at = backup.updated_at
-- FROM world_elements_backup_20251002 backup
-- WHERE we.id = backup.id;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Old Format:
--   "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
--
-- New Format:
--   "images": [
--     {
--       "name": "",
--       "imageUrls": ["https://example.com/img1.jpg"],
--       "link": null
--     },
--     {
--       "name": "",
--       "imageUrls": ["https://example.com/img2.jpg"],
--       "link": null
--     }
--   ]
--
-- Each old URL becomes a MediaItem with:
--   - name: empty string (user can fill in later)
--   - imageUrls: array with the single URL
--   - link: null (user can add reference link later)
--
-- This format allows:
--   - Multiple images per item
--   - Descriptive names for each image set
--   - Optional reference links
--   - Consistent structure with Cultures and Items panels
