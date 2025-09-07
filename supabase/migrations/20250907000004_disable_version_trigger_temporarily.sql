-- Temporarily disable version control trigger to fix save content issue
-- This will be re-enabled once the database is properly set up

-- Drop the trigger that's causing save issues
DROP TRIGGER IF EXISTS trigger_create_content_version ON public.project_content;

-- Drop the function as well
DROP FUNCTION IF EXISTS create_content_version();

-- We'll recreate these once the database is properly migrated
