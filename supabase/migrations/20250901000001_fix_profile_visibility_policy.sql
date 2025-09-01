-- Fix profile visibility RLS policy
-- This migration updates the profiles select policy to respect privacy settings

-- Drop the old policy that allowed all profile access
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Create new policy that respects profile_visibility settings
CREATE POLICY "profiles_select_with_privacy" ON public.profiles
  FOR SELECT USING (
    -- Allow users to see their own profile
    auth.uid() = id
    OR 
    -- Allow viewing public profiles
    profile_visibility = 'public'
    OR 
    -- Allow authenticated users to see members-only profiles
    (profile_visibility = 'members' AND auth.uid() IS NOT NULL)
    -- private profiles can only be seen by the owner (first condition handles this)
  );
