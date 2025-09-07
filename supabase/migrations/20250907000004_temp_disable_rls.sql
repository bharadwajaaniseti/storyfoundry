-- Temporary fix: Disable RLS on project_collaborators to test the collaboration system
-- This is a quick workaround while we debug the RLS policy issues

-- Disable RLS temporarily
ALTER TABLE public.project_collaborators DISABLE ROW LEVEL SECURITY;
