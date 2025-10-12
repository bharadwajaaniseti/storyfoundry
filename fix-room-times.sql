-- Fix existing pitch rooms with text-format times
-- This script converts common text time formats to proper time format

-- First, let's see what we have
SELECT id, title, scheduled_time, scheduled_date 
FROM pitch_rooms 
ORDER BY created_at DESC;

-- For the "Testing Host Pitch Room" - convert "2:00 AM GMT" to "02:00:00"
-- UPDATE pitch_rooms 
-- SET scheduled_time = '02:00:00'
-- WHERE title = 'Testing Host Pitch Room';

-- For any room with "9:54 PM" format
-- UPDATE pitch_rooms 
-- SET scheduled_time = '21:54:00'
-- WHERE title = 'Test Artwork';

-- Note: You'll need to manually convert each time based on what you see in the SELECT results
-- Common conversions:
-- 12:00 AM = 00:00:00
-- 1:00 AM = 01:00:00
-- 12:00 PM = 12:00:00
-- 1:00 PM = 13:00:00
-- 2:00 PM = 14:00:00
-- 9:54 PM = 21:54:00
-- 10:00 PM = 22:00:00
-- 11:00 PM = 23:00:00
