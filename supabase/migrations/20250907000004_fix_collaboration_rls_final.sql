-- Final fix for infinite recursion in project_collaborators RLS policy
-- This completely rebuilds the policies to avoid any circular dependencies

-- Drop all existing policies on project_collaborators
DROP POLICY IF EXISTS "View project collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Manage project collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view project collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Active collaborators can view other collaborators" ON public.project_collaborators;

-- Disable RLS temporarily to clean up
ALTER TABLE public.project_collaborators DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that only checks project ownership directly
-- This avoids any recursive lookups in the project_collaborators table itself
CREATE POLICY "project_collaborators_select" ON public.project_collaborators
  FOR SELECT USING (
    -- Check if the current user is the project owner by looking directly at projects table
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
    OR
    -- Or if the current user is the collaborator themselves
    project_collaborators.user_id = auth.uid()
  );

-- Create a simple policy for modifications (only project owners)
CREATE POLICY "project_collaborators_modify" ON public.project_collaborators
  FOR ALL USING (
    -- Only project owners can insert/update/delete collaborators
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_collaborators.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Also ensure collaboration_invitations policies are simple
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.collaboration_invitations;
DROP POLICY IF EXISTS "Users can manage their invitations" ON public.collaboration_invitations;

-- Simple policies for collaboration_invitations
CREATE POLICY "collaboration_invitations_select" ON public.collaboration_invitations
  FOR SELECT USING (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  );

CREATE POLICY "collaboration_invitations_insert" ON public.collaboration_invitations
  FOR INSERT WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = collaboration_invitations.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "collaboration_invitations_update" ON public.collaboration_invitations
  FOR UPDATE USING (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  );
