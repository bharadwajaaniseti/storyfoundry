-- Fix infinite loop in project_collaborators RLS policy
-- The issue is the policy is checking project_collaborators table while evaluating project_collaborators queries

-- Drop the problematic policy
DROP POLICY IF EXISTS "project_collaborators_select" ON public.project_collaborators;

-- Create a simpler policy that avoids recursion
-- This policy only checks direct project ownership and self-access
CREATE POLICY "project_collaborators_select_simple" ON public.project_collaborators
  FOR SELECT USING (
    -- User can see their own collaborator record
    user_id = auth.uid()
    OR
    -- Project owner can see all collaborators for their projects
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Also update the modify policy to be more explicit
DROP POLICY IF EXISTS "project_collaborators_modify" ON public.project_collaborators;

CREATE POLICY "project_collaborators_insert" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    -- Only project owners can add collaborators
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "project_collaborators_update" ON public.project_collaborators
  FOR UPDATE USING (
    -- Project owners can update any collaborator for their projects
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
    OR
    -- Users can update their own collaborator record (limited fields)
    user_id = auth.uid()
  );

CREATE POLICY "project_collaborators_delete" ON public.project_collaborators
  FOR DELETE USING (
    -- Only project owners can remove collaborators
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );