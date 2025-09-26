-- Simple setup for encyclopedia media storage
-- Run this in Supabase Dashboard > SQL Editor

-- Create storage bucket for encyclopedia media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('encyclopedia-media', 'encyclopedia-media', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies must be created through the Supabase Dashboard interface
-- because they require special permissions that SQL Editor doesn't have.
-- 
-- After running this script, go to:
-- Dashboard > Storage > encyclopedia-media bucket > Policies tab
-- 
-- Then create these 4 policies manually:
--
-- 1. READ Policy:
--    Name: "Public read access"
--    Operation: SELECT
--    Policy: bucket_id = 'encyclopedia-media'
--
-- 2. INSERT Policy:  
--    Name: "Authenticated users can upload"
--    Operation: INSERT
--    Policy: bucket_id = 'encyclopedia-media' AND auth.role() = 'authenticated'
--
-- 3. UPDATE Policy:
--    Name: "Authenticated users can update"
--    Operation: UPDATE  
--    Policy: bucket_id = 'encyclopedia-media' AND auth.role() = 'authenticated'
--
-- 4. DELETE Policy:
--    Name: "Authenticated users can delete"
--    Operation: DELETE
--    Policy: bucket_id = 'encyclopedia-media' AND auth.role() = 'authenticated'