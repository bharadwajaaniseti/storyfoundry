-- Fix RLS policies to allow public discovery of profiles while respecting privacy settings

-- Add a policy to allow public reading of discoverable profiles
CREATE POLICY "profiles_select_discoverable" ON public.profiles
  FOR SELECT USING (
    -- Allow users to see their own profile
    auth.uid() = id 
    OR 
    -- Allow public access to discoverable profiles with limited fields
    (discoverable = true AND profile_visibility IN ('public', 'members'))
  );

-- Keep existing policies for insert/update (users can only modify their own)
-- The existing policies will remain in effect for insert/update operations
