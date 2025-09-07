-- Create project_content_versions table for version control
CREATE TABLE IF NOT EXISTS public.project_content_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  changes_made JSONB, -- Store detailed diff information
  previous_version_id UUID REFERENCES public.project_content_versions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_major_version BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[] -- For tagging versions like 'draft', 'review', 'final'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_content_versions_project_id ON public.project_content_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_content_versions_user_id ON public.project_content_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_content_versions_created_at ON public.project_content_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_project_content_versions_version_number ON public.project_content_versions(project_id, version_number);
CREATE INDEX IF NOT EXISTS idx_project_content_versions_major ON public.project_content_versions(project_id, is_major_version);

-- Enable RLS
ALTER TABLE public.project_content_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_content_versions
-- Users can view versions if they have access to the project
DROP POLICY IF EXISTS "project_content_versions_select_policy" ON public.project_content_versions;
CREATE POLICY "project_content_versions_select_policy" ON public.project_content_versions
  FOR SELECT USING (
    -- Owner can see all versions of their projects
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content_versions.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR
    -- Active collaborators can see versions
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_content_versions.project_id 
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
    OR
    -- Public projects are visible to everyone
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content_versions.project_id 
      AND projects.visibility = 'public'
    )
  );

-- Users can insert versions if they have write access to the project
DROP POLICY IF EXISTS "project_content_versions_insert_policy" ON public.project_content_versions;
CREATE POLICY "project_content_versions_insert_policy" ON public.project_content_versions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND (
      -- Owner can create versions for their projects
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_content_versions.project_id 
        AND projects.owner_id = auth.uid()
      )
      OR
      -- Active collaborators with write permission can create versions
      EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = project_content_versions.project_id 
        AND pc.user_id = auth.uid()
        AND pc.status = 'active'
      )
    )
  );

-- Only the creator can update their own versions (for adding tags, etc.)
DROP POLICY IF EXISTS "project_content_versions_update_policy" ON public.project_content_versions;
CREATE POLICY "project_content_versions_update_policy" ON public.project_content_versions
  FOR UPDATE USING (user_id = auth.uid());

-- Only the creator can delete their own versions (with restrictions)
DROP POLICY IF EXISTS "project_content_versions_delete_policy" ON public.project_content_versions;
CREATE POLICY "project_content_versions_delete_policy" ON public.project_content_versions
  FOR DELETE USING (
    user_id = auth.uid() 
    AND created_at > NOW() - INTERVAL '24 hours' -- Can only delete recent versions
  );

-- Function to automatically create version when content is saved
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version_number INTEGER;
  word_count INTEGER;
  char_count INTEGER;
  previous_version_id UUID;
  change_summary TEXT;
  is_major BOOLEAN := FALSE;
  old_word_count INTEGER := 0;
BEGIN
  -- Calculate metrics
  word_count := array_length(string_to_array(trim(NEW.content), ' '), 1);
  char_count := char_length(NEW.content);
  
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version_number
  FROM public.project_content_versions 
  WHERE project_id = NEW.project_id;
  
  -- Get previous version info
  SELECT id, word_count INTO previous_version_id, old_word_count
  FROM public.project_content_versions 
  WHERE project_id = NEW.project_id 
  ORDER BY version_number DESC 
  LIMIT 1;
  
  -- Insert new version only if content has actually changed
  IF OLD IS NULL OR OLD.content != NEW.content THEN
    -- Generate change summary
    IF OLD IS NULL THEN
      change_summary := 'Initial content created';
      is_major := TRUE;
    ELSE
      DECLARE
        word_diff INTEGER := COALESCE(word_count, 0) - COALESCE(old_word_count, 0);
      BEGIN
        IF word_diff > 500 THEN
          change_summary := 'Major additions (+' || word_diff || ' words)';
          is_major := TRUE;
        ELSIF word_diff < -200 THEN
          change_summary := 'Significant content removed (' || word_diff || ' words)';
          is_major := TRUE;
        ELSIF word_diff > 100 THEN
          change_summary := 'Content expanded (+' || word_diff || ' words)';
        ELSIF word_diff < -50 THEN
          change_summary := 'Content trimmed (' || word_diff || ' words)';
        ELSIF word_diff > 10 THEN
          change_summary := 'Minor additions (+' || word_diff || ' words)';
        ELSIF word_diff < -10 THEN
          change_summary := 'Minor edits (' || word_diff || ' words)';
        ELSE
          change_summary := 'Text refinements and edits';
        END IF;
      END;
    END IF;
  
    INSERT INTO public.project_content_versions (
      project_id,
      user_id,
      content,
      version_number,
      change_summary,
      word_count,
      character_count,
      previous_version_id,
      is_major_version
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      NEW.content,
      next_version_number,
      change_summary,
      COALESCE(word_count, 0),
      char_count,
      previous_version_id,
      is_major
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create versions
DROP TRIGGER IF EXISTS trigger_create_content_version ON public.project_content;
CREATE TRIGGER trigger_create_content_version
  AFTER INSERT OR UPDATE ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION create_content_version();
