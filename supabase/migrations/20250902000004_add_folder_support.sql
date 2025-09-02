-- Add folder support to world_elements table
ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES world_elements(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE;

-- Add index for folder hierarchy queries
CREATE INDEX IF NOT EXISTS idx_world_elements_parent_folder ON world_elements(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_world_elements_is_folder ON world_elements(is_folder);

-- Add a comment explaining the folder structure
COMMENT ON COLUMN world_elements.parent_folder_id IS 'References the parent folder element. NULL means root level.';
COMMENT ON COLUMN world_elements.is_folder IS 'TRUE if this element is a folder container, FALSE if it is a regular element.';
