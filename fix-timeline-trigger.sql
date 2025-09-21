-- Check and fix the trigger function for timeline_events
-- The trigger should set user_id automatically, but it might not be working correctly

-- Check current trigger function
SELECT p.proname, p.prosrc 
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE t.tgname = 'set_timeline_event_user_and_timestamp_trigger';

-- Check if the trigger exists
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger 
WHERE tgname = 'set_timeline_event_user_and_timestamp_trigger';

-- Recreate the trigger function to ensure it works correctly
CREATE OR REPLACE FUNCTION set_timeline_event_user_and_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set user_id if it's not already provided and if auth.uid() is available
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- Set updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Log for debugging (remove in production)
  RAISE LOG 'Timeline event trigger: user_id=%, auth.uid()=%', NEW.user_id, auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS set_timeline_event_user_and_timestamp_trigger ON timeline_events;

CREATE TRIGGER set_timeline_event_user_and_timestamp_trigger
  BEFORE INSERT OR UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION set_timeline_event_user_and_timestamp();