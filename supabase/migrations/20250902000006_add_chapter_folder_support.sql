-- Add folder support to project_chapters table to enable organizing chapters in folders
-- This allows chapters to be moved into chapter folders like world building elements

-- Add folder-related columns to project_chapters table
ALTER TABLE project_chapters 
ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES world_elements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_chapters_parent_folder ON project_chapters(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_project_chapters_sort_order ON project_chapters(project_id, parent_folder_id, sort_order);

-- Add comments explaining the folder structure
COMMENT ON COLUMN project_chapters.parent_folder_id IS 'References a world_elements folder in the "chapters" category. NULL means root level.';
COMMENT ON COLUMN project_chapters.sort_order IS 'Order of chapters within their parent folder or at root level.';

-- Initialize sort_order for existing chapters based on chapter_number
UPDATE project_chapters 
SET sort_order = chapter_number * 10 
WHERE sort_order = 0;
