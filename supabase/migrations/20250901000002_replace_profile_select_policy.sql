-- Replace the restrictive profile SELECT policy with one that allows discovery

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_discoverable" ON public.profiles;

-- Create a comprehensive policy that allows:
-- 1. Users to see their own profile
-- 2. Public discovery of discoverable profiles
-- 3. Private profiles to remain hidden from others
CREATE POLICY "profiles_select_public_and_own" ON public.profiles
  FOR SELECT USING (
    -- Always allow users to see their own profile
    auth.uid() = id 
    OR 
    -- Allow public access to discoverable profiles
    discoverable = true
  );
