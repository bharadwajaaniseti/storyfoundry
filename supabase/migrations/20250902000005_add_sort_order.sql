-- Add sort_order column to world_elements table for ordering items within folders
ALTER TABLE world_elements ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_world_elements_sort_order ON world_elements(category, parent_folder_id, sort_order);

-- Update existing elements to have default sort order based on creation time
-- Use a CTE (Common Table Expression) with UPDATE to assign sort orders
WITH numbered_elements AS (
  SELECT 
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY category, parent_folder_id 
      ORDER BY created_at
    ) - 1) * 10 as new_sort_order
  FROM world_elements
  WHERE sort_order IS NULL OR sort_order = 0
)
UPDATE world_elements 
SET sort_order = numbered_elements.new_sort_order
FROM numbered_elements 
WHERE world_elements.id = numbered_elements.id;
