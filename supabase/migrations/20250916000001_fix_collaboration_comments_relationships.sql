-- Fix collaboration_project_comments table to use profiles instead of auth.users
-- and add linking functionality for collaborator-reader comment relationships

-- First, let's drop the existing foreign key constraint
ALTER TABLE public.collaboration_project_comments 
DROP CONSTRAINT IF EXISTS collaboration_project_comments_user_id_fkey;

-- Update the user_id column to reference profiles instead of auth.users
ALTER TABLE public.collaboration_project_comments 
ADD CONSTRAINT collaboration_project_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add a field to link collaboration comments to public reader comments
-- This allows collaborators to reference specific reader comments they're responding to
ALTER TABLE public.collaboration_project_comments 
ADD COLUMN IF NOT EXISTS linked_comment_id UUID REFERENCES public.project_comments(id) ON DELETE SET NULL;

-- Add index for the new linked_comment_id field
CREATE INDEX IF NOT EXISTS idx_collaboration_project_comments_linked_comment_id 
ON public.collaboration_project_comments(linked_comment_id);

-- Add a field to link public reader comments to collaboration comments
-- This allows readers to see when collaborators have responded (if project allows)
ALTER TABLE public.project_comments 
ADD COLUMN IF NOT EXISTS collaboration_response_id UUID REFERENCES public.collaboration_project_comments(id) ON DELETE SET NULL;

-- Add index for the new collaboration_response_id field
CREATE INDEX IF NOT EXISTS idx_project_comments_collaboration_response_id 
ON public.project_comments(collaboration_response_id);

-- Update RLS policies for collaboration_project_comments to ensure only collaborators see them
DROP POLICY IF EXISTS "collaboration_project_comments_select_policy" ON public.collaboration_project_comments;
CREATE POLICY "collaboration_project_comments_select_policy" ON public.collaboration_project_comments
  FOR SELECT USING (
    -- Owner can see comments on their projects
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = collaboration_project_comments.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR
    -- Active collaborators can see comments
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = collaboration_project_comments.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  );

-- Users can insert comments if they are owner or collaborator
DROP POLICY IF EXISTS "collaboration_project_comments_insert_policy" ON public.collaboration_project_comments;
CREATE POLICY "collaboration_project_comments_insert_policy" ON public.collaboration_project_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND (
      -- Owner can comment on their projects
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = collaboration_project_comments.project_id 
        AND projects.owner_id = auth.uid()
      )
      OR
      -- Active collaborators can comment
      EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = collaboration_project_comments.project_id 
        AND pc.user_id = auth.uid()
        AND pc.status = 'active'
      )
    )
  );

-- Users can update their own comments
DROP POLICY IF EXISTS "collaboration_project_comments_update_policy" ON public.collaboration_project_comments;
CREATE POLICY "collaboration_project_comments_update_policy" ON public.collaboration_project_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
DROP POLICY IF EXISTS "collaboration_project_comments_delete_policy" ON public.collaboration_project_comments;
CREATE POLICY "collaboration_project_comments_delete_policy" ON public.collaboration_project_comments
  FOR DELETE USING (user_id = auth.uid());

-- Create a function to automatically link comments when collaborators respond to reader comments
CREATE OR REPLACE FUNCTION public.auto_link_collaboration_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- If this collaboration comment has a linked_comment_id, update the reader comment
  IF NEW.linked_comment_id IS NOT NULL THEN
    UPDATE public.project_comments 
    SET collaboration_response_id = NEW.id
    WHERE id = NEW.linked_comment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-link comments
DROP TRIGGER IF EXISTS auto_link_collaboration_comment_trigger ON public.collaboration_project_comments;
CREATE TRIGGER auto_link_collaboration_comment_trigger
  AFTER INSERT ON public.collaboration_project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_collaboration_comment();

-- Grant necessary permissions
GRANT ALL ON public.collaboration_project_comments TO anon, authenticated;