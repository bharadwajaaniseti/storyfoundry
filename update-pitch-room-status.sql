-- Function to automatically update pitch room status based on time
-- This should be called periodically (via cron job or manual trigger)

CREATE OR REPLACE FUNCTION update_pitch_room_status()
RETURNS void AS $$
BEGIN
  -- Update rooms to 'live' if scheduled time has arrived and status is still 'upcoming'
  -- Combines scheduled_date (date) with scheduled_time (time in HH:MM or HH:MM:SS format)
  UPDATE pitch_rooms
  SET status = 'live', updated_at = NOW()
  WHERE status = 'upcoming'
    AND (scheduled_date::date + scheduled_time::time) <= NOW();

  -- Auto-complete rooms that have been 'live' for more than 3 hours
  UPDATE pitch_rooms
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'live'
    AND updated_at < NOW() - INTERVAL '3 hours';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_pitch_room_status() TO authenticated;
GRANT EXECUTE ON FUNCTION update_pitch_room_status() TO anon;

-- Create a scheduled job to run this every 5 minutes (requires pg_cron extension)
-- If pg_cron is enabled:
-- SELECT cron.schedule('update-pitch-room-status', '*/5 * * * *', 'SELECT update_pitch_room_status()');

-- For manual testing, you can call:
-- SELECT update_pitch_room_status();
