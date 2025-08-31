-- Fix project_content RLS policies to allow public access for public projects

-- Drop the existing restrictive select policy
DROP POLICY IF EXISTS "project_content_select_own" ON public.project_content;

-- Create a new policy that allows:
-- 1. Project owners to see their own content
-- 2. Anyone to see content for public projects
CREATE POLICY "project_content_select_policy" ON public.project_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        projects.visibility = 'public'
      )
    )
  );

-- Add policy for anonymous users to access public project content
CREATE POLICY "project_content_select_public_anon" ON public.project_content
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.visibility = 'public'
    )
  );
