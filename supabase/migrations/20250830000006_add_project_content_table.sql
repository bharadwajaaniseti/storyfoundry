-- Add project_content table for storing text content
-- project_assets is for file attachments, this is for the actual writing content

CREATE TABLE public.project_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL DEFAULT 'content.txt',
  content TEXT DEFAULT '',
  asset_type TEXT DEFAULT 'content',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_project_content_project_id ON public.project_content(project_id);

-- Add updated_at trigger
CREATE TRIGGER project_content_updated_at
  BEFORE UPDATE ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.project_content ENABLE ROW LEVEL SECURITY;

-- Users can see content for projects they own or have access to
CREATE POLICY "project_content_select_own" ON public.project_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can insert content for projects they own
CREATE POLICY "project_content_insert_own" ON public.project_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can update content for projects they own
CREATE POLICY "project_content_update_own" ON public.project_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete content for projects they own
CREATE POLICY "project_content_delete_own" ON public.project_content
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_content.project_id 
      AND projects.owner_id = auth.uid()
    )
  );
