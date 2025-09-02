-- Add research items table
CREATE TABLE IF NOT EXISTS research_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'book', 'website', 'image', 'video', 'document', 'note')),
  content TEXT DEFAULT '',
  url TEXT,
  file_path TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_items_project_id ON research_items(project_id);
CREATE INDEX IF NOT EXISTS idx_research_items_type ON research_items(type);
CREATE INDEX IF NOT EXISTS idx_research_items_tags ON research_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_items_is_favorited ON research_items(is_favorited);

-- RLS policies for research items
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view research items of their projects" ON research_items
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create research items for their projects" ON research_items
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update research items of their projects" ON research_items
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete research items of their projects" ON research_items
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_research_items_updated_at
  BEFORE UPDATE ON research_items
  FOR EACH ROW
  EXECUTE FUNCTION update_research_items_updated_at();
