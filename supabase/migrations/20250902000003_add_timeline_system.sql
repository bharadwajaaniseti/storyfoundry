-- Create timeline_events table for project timelines
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL, -- Using TEXT to allow custom date formats (Year 2157, Third Age, etc.)
  event_type TEXT CHECK (event_type IN ('story', 'historical', 'personal', 'world')) DEFAULT 'story',
  importance TEXT CHECK (importance IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  participants TEXT[] DEFAULT '{}',
  location TEXT,
  consequences TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policies for timeline_events
CREATE POLICY "Users can view timeline events for projects they can access" ON timeline_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline events for their projects" ON timeline_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events for their projects" ON timeline_events
  FOR UPDATE USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events for their projects" ON timeline_events
  FOR DELETE USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_timeline_events_project_id ON timeline_events(project_id);
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date);
CREATE INDEX idx_timeline_events_event_type ON timeline_events(event_type);
CREATE INDEX idx_timeline_events_importance ON timeline_events(importance);

-- Create full-text search index for timeline events
CREATE INDEX idx_timeline_events_search ON timeline_events 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')));

-- Create function to automatically set user_id and updated_at
CREATE OR REPLACE FUNCTION set_timeline_event_user_and_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user_id and timestamp setting
CREATE TRIGGER set_timeline_event_user_and_timestamp_trigger
  BEFORE INSERT OR UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION set_timeline_event_user_and_timestamp();
