-- Fix project_comments RLS policies to allow collaborators access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.project_comments;

-- Create comprehensive SELECT policy that allows:
-- 1. Everyone to see comments on public projects
-- 2. Project owners to see comments on their projects
-- 3. Active collaborators to see comments on projects they're collaborating on
CREATE POLICY "Comments are viewable by authorized users" ON public.project_comments
  FOR SELECT USING (
    -- Public projects are visible to everyone
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_comments.project_id 
      AND projects.visibility = 'public'
    )
    OR
    -- Project owners can see all comments on their projects
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_comments.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR
    -- Active collaborators can see comments on projects they're collaborating on
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_comments.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- Update INSERT policy to allow collaborators to comment
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.project_comments;
CREATE POLICY "Authorized users can insert comments" ON public.project_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- Project owners can comment on their projects
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_comments.project_id 
        AND projects.owner_id = auth.uid()
      )
      OR
      -- Active collaborators can comment on projects they're collaborating on
      EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = project_comments.project_id 
        AND pc.user_id = auth.uid()
        AND pc.status = 'active'
      )
      OR
      -- Anyone can comment on public projects
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_comments.project_id 
        AND projects.visibility = 'public'
      )
    )
  );