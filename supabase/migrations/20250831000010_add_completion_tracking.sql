-- Add completion tracking to reading_progress table
ALTER TABLE reading_progress 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reading_time_minutes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS milestones_reached INTEGER DEFAULT 0;

-- Create index for faster queries on completion status
CREATE INDEX IF NOT EXISTS idx_reading_progress_completion 
ON reading_progress(user_id, is_completed, completed_at);

-- Update existing records that have 100% progress to be marked as completed
-- Only if they don't have completion data yet
UPDATE reading_progress 
SET is_completed = TRUE, 
    completed_at = updated_at,
    reading_time_minutes = 5, -- Assume 5 minutes for existing completed reads
    milestones_reached = 10   -- Assume they hit all milestones
WHERE progress_percentage >= 100 
  AND is_completed IS FALSE;
