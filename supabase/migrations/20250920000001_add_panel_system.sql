-- Panel layout and configuration storage
-- This migration adds support for customizable dashboard panels

-- Table to store panel configurations per project
CREATE TABLE IF NOT EXISTS project_panels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  panel_type VARCHAR(50) NOT NULL, -- research, notes, links, images, etc.
  title VARCHAR(255) NOT NULL,
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  size_width INTEGER DEFAULT 4,
  size_height INTEGER DEFAULT 6,
  is_minimized BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}', -- Panel-specific settings
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_panels_project_id ON project_panels(project_id);
CREATE INDEX IF NOT EXISTS idx_project_panels_type ON project_panels(panel_type);
CREATE INDEX IF NOT EXISTS idx_project_panels_order ON project_panels(project_id, display_order);

-- RLS policies for project panels
ALTER TABLE project_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view panels of their projects" ON project_panels
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create panels for their projects" ON project_panels
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update panels of their projects" ON project_panels
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete panels of their projects" ON project_panels
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_panels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_panels_updated_at
  BEFORE UPDATE ON project_panels
  FOR EACH ROW
  EXECUTE FUNCTION update_project_panels_updated_at();

-- Table for panel-specific content (extends world_elements)
-- Notes panel content
CREATE TABLE IF NOT EXISTS panel_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  panel_id UUID REFERENCES project_panels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  color VARCHAR(50) DEFAULT 'bg-yellow-100',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Links panel content
CREATE TABLE IF NOT EXISTS panel_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  panel_id UUID REFERENCES project_panels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  favicon_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Timeline events
CREATE TABLE IF NOT EXISTS panel_timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  panel_id UUID REFERENCES project_panels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE,
  event_time TIME,
  duration_minutes INTEGER,
  event_type VARCHAR(50) DEFAULT 'general', -- general, character, plot, world
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  tags TEXT[] DEFAULT '{}',
  related_elements UUID[], -- References to other world_elements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for panel content tables
CREATE INDEX IF NOT EXISTS idx_panel_notes_project_id ON panel_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_panel_notes_panel_id ON panel_notes(panel_id);
CREATE INDEX IF NOT EXISTS idx_panel_links_project_id ON panel_links(project_id);
CREATE INDEX IF NOT EXISTS idx_panel_links_panel_id ON panel_links(panel_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_project_id ON panel_timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_panel_id ON panel_timeline_events(panel_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON panel_timeline_events(event_date);

-- RLS policies for panel content
ALTER TABLE panel_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_timeline_events ENABLE ROW LEVEL SECURITY;

-- Notes RLS
CREATE POLICY "Users can view notes of their projects" ON panel_notes
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their projects" ON panel_notes
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes of their projects" ON panel_notes
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes of their projects" ON panel_notes
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Links RLS (similar pattern)
CREATE POLICY "Users can view links of their projects" ON panel_links
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links for their projects" ON panel_links
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links of their projects" ON panel_links
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links of their projects" ON panel_links
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Timeline RLS (similar pattern)
CREATE POLICY "Users can view timeline events of their projects" ON panel_timeline_events
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create timeline events for their projects" ON panel_timeline_events
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events of their projects" ON panel_timeline_events
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events of their projects" ON panel_timeline_events
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Add some default panels for existing projects
INSERT INTO project_panels (project_id, panel_type, title, color, position_x, position_y, size_width, size_height, display_order)
SELECT 
  p.id,
  'research',
  'Research',
  'bg-blue-500',
  0,
  0,
  6,
  8,
  1
FROM projects p 
WHERE NOT EXISTS (
  SELECT 1 FROM project_panels pp WHERE pp.project_id = p.id AND pp.panel_type = 'research'
);

INSERT INTO project_panels (project_id, panel_type, title, color, position_x, position_y, size_width, size_height, display_order)
SELECT 
  p.id,
  'notes',
  'Notes',
  'bg-green-500',
  6,
  0,
  4,
  6,
  2
FROM projects p 
WHERE NOT EXISTS (
  SELECT 1 FROM project_panels pp WHERE pp.project_id = p.id AND pp.panel_type = 'notes'
);

INSERT INTO project_panels (project_id, panel_type, title, color, position_x, position_y, size_width, size_height, display_order)
SELECT 
  p.id,
  'timeline',
  'Timeline',
  'bg-purple-500',
  6,
  6,
  4,
  4,
  3
FROM projects p 
WHERE NOT EXISTS (
  SELECT 1 FROM project_panels pp WHERE pp.project_id = p.id AND pp.panel_type = 'timeline'
);