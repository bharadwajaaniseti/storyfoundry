-- Add parent_id column to world_elements for hierarchical structure
-- This enables file-based organization where research files contain research content

ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES world_elements(id) ON DELETE CASCADE;

-- Add index for performance on parent_id lookups
CREATE INDEX IF NOT EXISTS idx_world_elements_parent_id ON world_elements(parent_id);

-- Add some additional useful columns for better research support
ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add a trigger to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_world_elements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_update_world_elements_updated_at ON world_elements;
CREATE TRIGGER trigger_update_world_elements_updated_at
  BEFORE UPDATE ON world_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_world_elements_updated_at();

-- Add comment for documentation
COMMENT ON COLUMN world_elements.parent_id IS 'References parent element for hierarchical organization (e.g., research content belongs to research file)';
COMMENT ON COLUMN world_elements.content IS 'Text content for notes and other content types';
COMMENT ON COLUMN world_elements.file_url IS 'URL for uploaded files (images, documents, videos)';
COMMENT ON COLUMN world_elements.is_favorite IS 'Whether this element is marked as favorite by the user';