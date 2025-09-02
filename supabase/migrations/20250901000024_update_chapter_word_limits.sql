-- Update existing chapters to have 10000 word target instead of 2000
UPDATE project_chapters 
SET target_word_count = 10000 
WHERE target_word_count = 2000;

-- Create an index on target_word_count for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_project_chapters_target_word_count ON project_chapters(target_word_count);
