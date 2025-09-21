-- Add timeline support to existing world_elements table
-- This follows the existing pattern where all world-building entities are stored in world_elements
-- with different categories (characters, locations, items, cultures, maps, research, timeline)

-- Timeline entities will be stored in world_elements with category = 'timeline'
-- Timeline attributes will include:
--   - color: hex color for UI display
--   - is_default: boolean to mark the main timeline
--   - lanes: array of configurable lanes (world, plot, characters, locations, items)

-- Add timeline_id to existing timeline_events table (references world_elements.id where category='timeline')
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS timeline_id UUID REFERENCES world_elements(id) ON DELETE CASCADE;

-- Add index for timeline_events.timeline_id
CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);

-- Add new columns to timeline_events for enhanced functionality
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS lane VARCHAR(50) DEFAULT 'plot', -- plot, world, characters, locations, items
ADD COLUMN IF NOT EXISTS start_date TEXT, -- Separate start/end dates for duration events
ADD COLUMN IF NOT EXISTS end_date TEXT,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb; -- Additional metadata

-- Migrate existing timeline_events to use 'date' as both start_date and end_date if start_date is null
UPDATE timeline_events 
SET start_date = date, end_date = date 
WHERE start_date IS NULL AND date IS NOT NULL;

-- RLS policies for timeline_events already exist and work with world_elements
-- The existing world_elements RLS policies will handle timeline access control

-- Update existing timeline_events policies to include timeline_id checks
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view timeline events for projects they can access" ON timeline_events;
DROP POLICY IF EXISTS "Users can insert timeline events for their projects" ON timeline_events;
DROP POLICY IF EXISTS "Users can update timeline events for their projects" ON timeline_events;
DROP POLICY IF EXISTS "Users can delete timeline events for their projects" ON timeline_events;

-- Create new timeline_events policies with timeline support (only if they don't exist)
DO $$ 
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timeline_events' 
    AND policyname = 'timeline_events_select_policy'
  ) THEN
    CREATE POLICY "timeline_events_select_policy" ON timeline_events
      FOR SELECT USING (
        -- Owner OR collaborator can view events
        project_id IN (
          SELECT id FROM projects WHERE owner_id = auth.uid()
        )
        OR
        project_id IN (
          SELECT project_id FROM collaborations 
          WHERE member_id = auth.uid()
        )
      );
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timeline_events' 
    AND policyname = 'timeline_events_insert_policy'
  ) THEN
    CREATE POLICY "timeline_events_insert_policy" ON timeline_events
      FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        (
          project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
          )
          OR
          project_id IN (
            SELECT project_id FROM collaborations 
            WHERE member_id = auth.uid()
          )
        )
      );
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timeline_events' 
    AND policyname = 'timeline_events_update_policy'
  ) THEN
    CREATE POLICY "timeline_events_update_policy" ON timeline_events
      FOR UPDATE USING (
        user_id = auth.uid() AND
        (
          project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
          )
          OR
          project_id IN (
            SELECT project_id FROM collaborations 
            WHERE member_id = auth.uid()
          )
        )
      );
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'timeline_events' 
    AND policyname = 'timeline_events_delete_policy'
  ) THEN
    CREATE POLICY "timeline_events_delete_policy" ON timeline_events
      FOR DELETE USING (
        user_id = auth.uid() AND
        (
          project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
          )
          OR
          project_id IN (
            SELECT project_id FROM collaborations 
            WHERE member_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Create function to automatically set updated_at timestamp on world_elements (already exists)
-- No additional functions needed since world_elements already has update triggers

-- Create function to ensure only one default timeline per project
CREATE OR REPLACE FUNCTION ensure_single_default_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- If this timeline is being set as default, unset all others in the same project
  IF NEW.category = 'timeline' AND NEW.attributes ? 'is_default' AND (NEW.attributes->>'is_default')::boolean = TRUE THEN
    UPDATE world_elements 
    SET attributes = jsonb_set(attributes, '{is_default}', 'false'::jsonb)
    WHERE project_id = NEW.project_id 
    AND category = 'timeline'
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure only one default timeline per project (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'ensure_single_default_timeline_trigger'
  ) THEN
    CREATE TRIGGER ensure_single_default_timeline_trigger
      BEFORE INSERT OR UPDATE ON world_elements
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_default_timeline();
  END IF;
END $$;

-- Add indexes for new timeline_events columns
CREATE INDEX IF NOT EXISTS idx_timeline_events_lane ON timeline_events(lane);
CREATE INDEX IF NOT EXISTS idx_timeline_events_start_date ON timeline_events(start_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_attributes ON timeline_events USING GIN(attributes);

-- Add index for timeline category in world_elements (likely already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_world_elements_category_timeline ON world_elements(project_id, category) WHERE category = 'timeline';