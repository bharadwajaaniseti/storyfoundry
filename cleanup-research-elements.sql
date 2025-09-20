-- Clean up research elements that are not properly categorized
-- This script will help identify and fix research elements that should be content but are showing as files

-- First, let's see what we have
SELECT 
    id,
    name,
    category,
    attributes->>'research_type' as research_type,
    attributes->>'research_file_id' as research_file_id,
    attributes->>'type' as content_type,
    created_at
FROM world_elements 
WHERE category = 'research'
ORDER BY created_at DESC;

-- Look for research elements that don't have research_type set
-- These are likely the ones showing incorrectly in the sidebar
SELECT 
    id,
    name,
    category,
    attributes,
    created_at
FROM world_elements 
WHERE category = 'research' 
AND (attributes->>'research_type' IS NULL OR attributes->>'research_type' = '');

-- If you want to fix elements that should be content but are missing research_type:
-- Uncomment and run the following UPDATE statement after reviewing the results above

/*
UPDATE world_elements 
SET attributes = attributes || '{"research_type": "content", "type": "note"}'::jsonb
WHERE category = 'research' 
AND (attributes->>'research_type' IS NULL OR attributes->>'research_type' = '')
AND name NOT LIKE '%file%' -- Avoid accidentally converting actual research files
AND name NOT LIKE '%research%'; -- Avoid accidentally converting actual research files
*/

-- Alternative: Delete orphaned research elements that are not proper files or content
-- BE VERY CAREFUL WITH THIS - Only run after backing up your data!
/*
DELETE FROM world_elements 
WHERE category = 'research' 
AND (attributes->>'research_type' IS NULL OR attributes->>'research_type' = '')
AND id NOT IN (
    -- Keep any that might be referenced as research_file_id by other content
    SELECT DISTINCT (attributes->>'research_file_id')::uuid 
    FROM world_elements 
    WHERE attributes->>'research_file_id' IS NOT NULL
);
*/