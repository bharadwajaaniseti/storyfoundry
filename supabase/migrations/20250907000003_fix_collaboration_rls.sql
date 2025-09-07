-- Fix infinite recursion in project_collaborators RLS policy
-- The issue is that the policy references itself, creating a circular dependency

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Collaborators can view project collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Active collaborators can view other collaborators" ON public.project_collaborators;

-- Create a simple, non-recursive policy for viewing collaborators
CREATE POLICY "View project collaborators" ON public.project_collaborators
  FOR SELECT USING (
    -- Users can see their own collaboration record
    auth.uid() = user_id 
    OR 
    -- Project owners can see all collaborators for their projects
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Create a simple policy for managing collaborators (INSERT, UPDATE, DELETE)
CREATE POLICY "Manage project collaborators" ON public.project_collaborators
  FOR ALL USING (
    -- Only project owners can manage collaborators
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );
