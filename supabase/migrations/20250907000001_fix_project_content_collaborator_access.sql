-- Fix project_content RLS policies to allow collaborators to insert/update content
-- Currently only owners can modify content, but collaborators with write permission should also be able to

-- Drop existing policies for INSERT, UPDATE, DELETE (they only check for ownership)
DROP POLICY IF EXISTS "project_content_insert_own" ON public.project_content;
DROP POLICY IF EXISTS "project_content_update_own" ON public.project_content;
DROP POLICY IF EXISTS "project_content_delete_own" ON public.project_content;

-- Create new policies that check for ownership OR collaboration with appropriate permissions

-- INSERT policy: Owner OR active collaborator with any role
CREATE POLICY "project_content_insert_policy" ON public.project_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_content.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- UPDATE policy: Owner OR active collaborator with any role
CREATE POLICY "project_content_update_policy" ON public.project_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_content.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- DELETE policy: Only owner (collaborators shouldn't delete content)
CREATE POLICY "project_content_delete_policy" ON public.project_content
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Also update the SELECT policy to include collaborators (if not already done)
-- Drop the existing select policy and create a comprehensive one
DROP POLICY IF EXISTS "project_content_select_policy" ON public.project_content;

CREATE POLICY "project_content_select_policy" ON public.project_content
  FOR SELECT USING (
    -- Owner can see their own content
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR
    -- Active collaborators can see content
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_content.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
    OR
    -- Public projects are visible to everyone
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.visibility = 'public'
    )
  );
