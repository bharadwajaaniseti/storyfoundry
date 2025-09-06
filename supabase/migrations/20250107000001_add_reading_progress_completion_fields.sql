-- Add completion tracking fields to reading_progress table

-- Add new columns for completion tracking
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reading_time_minutes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS milestones_reached INTEGER DEFAULT 0;

-- Add index for completion queries
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON public.reading_progress(is_completed, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_completed ON public.reading_progress(user_id, is_completed);
