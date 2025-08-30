-- Fix circular dependency in projects RLS policy
-- This replaces the complex policy with a simpler one for basic functionality

-- Drop existing policies
DROP POLICY IF EXISTS "projects_select_public" ON public.projects;

-- Create simplified select policy (no circular reference)
CREATE POLICY "projects_select_simple" ON public.projects
  FOR SELECT USING (
    visibility IN ('public', 'preview') 
    OR owner_id = auth.uid()
  );

-- The insert, update, delete policies are fine as they don't have circular references
