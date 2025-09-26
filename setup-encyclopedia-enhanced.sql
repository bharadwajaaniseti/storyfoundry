-- Run this SQL script in your Supabase SQL editor to add enhanced encyclopedia features
-- Encyclopedia Enhanced Features Migration
-- This adds support for advanced encyclopedia features inspired by Campfire Writing

-- Create encyclopedia_folders table for organizing articles
CREATE TABLE IF NOT EXISTS encyclopedia_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  parent_id UUID REFERENCES encyclopedia_folders(id) ON DELETE CASCADE,
  expanded BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for encyclopedia_folders
ALTER TABLE encyclopedia_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view encyclopedia folders for their projects" ON encyclopedia_folders
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage encyclopedia folders for their projects" ON encyclopedia_folders
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Add folder support to world_elements for encyclopedia entries
-- Only add columns if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='world_elements' AND column_name='folder_id') THEN
    ALTER TABLE world_elements ADD COLUMN folder_id UUID REFERENCES encyclopedia_folders(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='world_elements' AND column_name='sections') THEN
    ALTER TABLE world_elements ADD COLUMN sections JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='world_elements' AND column_name='template_id') THEN
    ALTER TABLE world_elements ADD COLUMN template_id UUID DEFAULT NULL;
  END IF;
END $$;

-- Create encyclopedia_templates table for article templates
CREATE TABLE IF NOT EXISTS encyclopedia_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for encyclopedia_templates
ALTER TABLE encyclopedia_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view encyclopedia templates for their projects" ON encyclopedia_templates
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage encyclopedia templates for their projects" ON encyclopedia_templates
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encyclopedia_folders_project_id ON encyclopedia_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_folders_parent_id ON encyclopedia_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_encyclopedia_templates_project_id ON encyclopedia_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_world_elements_folder_id ON world_elements(folder_id);

-- Add triggers for updated_at (reuse existing function if it exists)
DO $$
BEGIN
  -- Check if the function already exists, create if not
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Create triggers
DROP TRIGGER IF EXISTS update_encyclopedia_folders_updated_at ON encyclopedia_folders;
CREATE TRIGGER update_encyclopedia_folders_updated_at 
  BEFORE UPDATE ON encyclopedia_folders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_encyclopedia_templates_updated_at ON encyclopedia_templates;
CREATE TRIGGER update_encyclopedia_templates_updated_at 
  BEFORE UPDATE ON encyclopedia_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE encyclopedia_folders IS 'Folders for organizing encyclopedia articles, similar to Campfire Writing';
COMMENT ON TABLE encyclopedia_templates IS 'Templates for creating new encyclopedia articles with predefined sections';
COMMENT ON COLUMN world_elements.sections IS 'JSON array of article sections for enhanced encyclopedia entries';
COMMENT ON COLUMN world_elements.folder_id IS 'Reference to encyclopedia folder for organization';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Encyclopedia enhanced features have been successfully installed!';
  RAISE NOTICE 'You can now use folders, sections, and templates in your encyclopedia.';
END $$;