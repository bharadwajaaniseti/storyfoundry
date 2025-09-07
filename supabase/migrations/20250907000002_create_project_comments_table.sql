-- Create collaboration_project_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collaboration_project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.collaboration_project_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_project_comments_project_id ON public.collaboration_project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_project_comments_user_id ON public.collaboration_project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_project_comments_parent_id ON public.collaboration_project_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_project_comments_created_at ON public.collaboration_project_comments(created_at);

-- Enable RLS
ALTER TABLE public.collaboration_project_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for collaboration_project_comments
-- Users can view comments if they have access to the project
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
    OR
    -- Public projects are visible to everyone
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = collaboration_project_comments.project_id 
      AND projects.visibility = 'public'
    )
  );

-- Users can insert comments if they have access to the project
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

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_collaboration_project_comments_updated_at ON public.collaboration_project_comments;
CREATE TRIGGER update_collaboration_project_comments_updated_at
    BEFORE UPDATE ON public.collaboration_project_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
