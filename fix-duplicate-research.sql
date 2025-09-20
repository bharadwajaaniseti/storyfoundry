-- Clean up duplicate research files
-- Based on your data, you have two research files named "ab"

-- View the duplicate research files
SELECT 
    id,
    name,
    category,
    attributes->>'research_type' as research_type,
    created_at,
    (
        SELECT COUNT(*) 
        FROM world_elements content 
        WHERE content.attributes->>'research_file_id' = world_elements.id::text
    ) as content_count
FROM world_elements 
WHERE category = 'research' 
AND attributes->>'research_type' = 'file'
AND name = 'ab'
ORDER BY created_at;

-- The file with ID 'e3f7aef6-0840-4670-b772-a4fb808cc3e2' has 3 content items
-- The file with ID '1e390627-ee6f-495e-a5be-104f62490a87' appears to be empty

-- To remove the duplicate empty research file, uncomment and run:
/*
DELETE FROM world_elements 
WHERE id = '1e390627-ee6f-495e-a5be-104f62490a87'
AND category = 'research' 
AND attributes->>'research_type' = 'file'
AND name = 'ab'
AND NOT EXISTS (
    SELECT 1 FROM world_elements content 
    WHERE content.attributes->>'research_file_id' = '1e390627-ee6f-495e-a5be-104f62490a87'
);
*/

-- Double-check that content items are properly linked
SELECT 
    id,
    name,
    attributes->>'research_type' as research_type,
    attributes->>'research_file_id' as research_file_id,
    attributes->>'type' as content_type,
    CASE 
        WHEN attributes->>'research_file_id' = 'e3f7aef6-0840-4670-b772-a4fb808cc3e2' THEN 'Linked to main ab file'
        WHEN attributes->>'research_file_id' = '1e390627-ee6f-495e-a5be-104f62490a87' THEN 'Linked to duplicate ab file'
        ELSE 'Not linked properly'
    END as link_status
FROM world_elements 
WHERE category = 'research' 
AND attributes->>'research_type' = 'content'
ORDER BY created_at DESC;