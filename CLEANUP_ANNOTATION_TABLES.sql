-- Remove dedicated annotation tables
-- Since we're using JSONB storage in world_elements.attributes.annotations instead

-- Step 1: Drop the annotation tables
DROP TABLE IF EXISTS public.map_pins CASCADE;
DROP TABLE IF EXISTS public.map_labels CASCADE;
DROP TABLE IF EXISTS public.map_zones CASCADE;
DROP TABLE IF EXISTS public.map_measurements CASCADE;
DROP TABLE IF EXISTS public.map_decorations CASCADE;

-- Step 2: Remove the maps bucket from storage (if you don't need it)
-- Uncomment the line below if you want to remove the storage bucket too
-- DELETE FROM storage.buckets WHERE id = 'maps';

-- Verification: Show remaining tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'map_%'
ORDER BY tablename;

-- Success message
SELECT 'Annotation tables cleaned up successfully! Using JSONB storage in world_elements.' as result;