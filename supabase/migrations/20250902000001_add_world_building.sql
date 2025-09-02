-- Add world building elements table
CREATE TABLE IF NOT EXISTS world_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(50) NOT NULL, -- characters, locations, timeline, research, etc.
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  attributes JSONB DEFAULT '{}', -- Flexible storage for category-specific fields
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_world_elements_project_id ON world_elements(project_id);
CREATE INDEX IF NOT EXISTS idx_world_elements_category ON world_elements(category);
CREATE INDEX IF NOT EXISTS idx_world_elements_name ON world_elements(name);
CREATE INDEX IF NOT EXISTS idx_world_elements_tags ON world_elements USING GIN(tags);

-- RLS policies for world elements
ALTER TABLE world_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view world elements of their projects" ON world_elements
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create world elements for their projects" ON world_elements
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update world elements of their projects" ON world_elements
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete world elements of their projects" ON world_elements
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Add some sample world elements for demonstration
INSERT INTO world_elements (project_id, category, name, description, attributes, tags) 
SELECT 
  p.id,
  'characters',
  'Main Protagonist',
  'The central character of the story',
  '{"age": "25", "occupation": "Detective", "personality": "Determined and intuitive", "background": "Former military", "goals": "Solve the mystery", "conflicts": "Haunted by past failures"}',
  ARRAY['protagonist', 'detective', 'main character']
FROM projects p 
WHERE p.format = 'novel' 
LIMIT 1;

INSERT INTO world_elements (project_id, category, name, description, attributes, tags) 
SELECT 
  p.id,
  'locations',
  'Downtown Precinct',
  'The main police station where much of the action takes place',
  '{"type": "Police Station", "climate": "Urban", "population": "Busy during day", "government": "Municipal", "economy": "Government funded", "notable_features": "Old brick building with modern tech", "history": "Built in 1950s, renovated in 2010"}',
  ARRAY['police', 'urban', 'workplace']
FROM projects p 
WHERE p.format = 'novel' 
LIMIT 1;
