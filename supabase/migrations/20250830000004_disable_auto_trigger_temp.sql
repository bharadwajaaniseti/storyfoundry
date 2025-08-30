-- Temporarily disable auto profile creation trigger to fix signup issues
-- We'll handle profile creation manually via API endpoints

-- Drop the trigger that's causing signup failures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Comment: The trigger will be re-enabled once we fix the RLS policy issues
-- For now, profile creation is handled manually via the /api/create-profile endpoint
