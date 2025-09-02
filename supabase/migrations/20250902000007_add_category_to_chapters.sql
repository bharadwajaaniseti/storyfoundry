-- Add category field to project_chapters table for consistency with world_elements
-- This allows chapters to be treated consistently with other categorized elements

-- Add category column to project_chapters table
ALTER TABLE project_chapters 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'chapters' NOT NULL;

-- Update existing chapters to have the 'chapters' category
UPDATE project_chapters 
SET category = 'chapters' 
WHERE category IS NULL OR category = '';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_project_chapters_category ON project_chapters(category);

-- Add comment explaining the category field
COMMENT ON COLUMN project_chapters.category IS 'Category of the chapter, always "chapters" for consistency with world_elements structure.';
