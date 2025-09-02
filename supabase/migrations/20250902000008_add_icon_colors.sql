-- Add icon color support to chapters and world elements
-- This migration adds color fields to support customizable icon colors

-- Add color field to project_chapters table
ALTER TABLE project_chapters 
ADD COLUMN IF NOT EXISTS icon_color VARCHAR(20) DEFAULT 'blue';

-- Add color field to world_elements table  
ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS icon_color VARCHAR(20) DEFAULT 'blue';

-- Add indexes for color queries
CREATE INDEX IF NOT EXISTS idx_project_chapters_icon_color ON project_chapters(icon_color);
CREATE INDEX IF NOT EXISTS idx_world_elements_icon_color ON world_elements(icon_color);

-- Add comments explaining the color system
COMMENT ON COLUMN project_chapters.icon_color IS 'Icon color for the chapter. Supports standard color names like blue, red, green, purple, etc.';
COMMENT ON COLUMN world_elements.icon_color IS 'Icon color for the world element. Supports standard color names like blue, red, green, purple, etc.';

-- Update existing records to have default colors
UPDATE project_chapters SET icon_color = 'blue' WHERE icon_color IS NULL;
UPDATE world_elements SET icon_color = 'blue' WHERE icon_color IS NULL;
