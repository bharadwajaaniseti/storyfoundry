-- Temporary fix: Disable RLS on collaboration tables to avoid recursion
-- This is a quick fix while we debug the RLS policies

-- Disable RLS on project_collaborators table
ALTER TABLE public.project_collaborators DISABLE ROW LEVEL SECURITY;

-- Disable RLS on collaboration_invitations table  
ALTER TABLE public.collaboration_invitations DISABLE ROW LEVEL SECURITY;

-- We'll re-enable with proper policies later
-- For now this allows the collaboration features to work
