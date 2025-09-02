-- Add novel chapter system for enhanced writing experience
-- This migration adds comprehensive chapter management for novel writers

-- Create chapters table
CREATE TABLE IF NOT EXISTS project_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  target_word_count INTEGER DEFAULT 2000,
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, completed, published
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique chapter numbers per project
  UNIQUE(project_id, chapter_number)
);

-- Create chapter comments for feedback system
CREATE TABLE IF NOT EXISTS chapter_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES project_chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  line_number INTEGER, -- For inline comments
  character_position INTEGER, -- For precise positioning
  comment_type VARCHAR(50) DEFAULT 'general', -- general, suggestion, critique, praise
  is_resolved BOOLEAN DEFAULT false,
  parent_comment_id UUID REFERENCES chapter_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chapter reading progress for analytics
CREATE TABLE IF NOT EXISTS chapter_reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES project_chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  reading_time_seconds INTEGER DEFAULT 0,
  last_read_position INTEGER DEFAULT 0, -- Character position
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- One progress record per user per chapter
  UNIQUE(chapter_id, user_id)
);

-- Create novel outline/structure table
CREATE TABLE IF NOT EXISTS novel_outlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  structure_type VARCHAR(50) DEFAULT 'three_act', -- three_act, hero_journey, custom
  act_1_chapters TEXT DEFAULT '', -- JSON array of chapter numbers
  act_2_chapters TEXT DEFAULT '',
  act_3_chapters TEXT DEFAULT '',
  plot_points TEXT DEFAULT '', -- JSON object with key plot points
  character_arcs TEXT DEFAULT '', -- JSON object with character development
  themes TEXT DEFAULT '', -- JSON array of themes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- One outline per project
  UNIQUE(project_id)
);

-- Create writing goals for chapters and novels
CREATE TABLE IF NOT EXISTS writing_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- daily_words, chapter_completion, novel_completion
  target_value INTEGER NOT NULL, -- words per day, chapters per week, etc.
  current_progress INTEGER DEFAULT 0,
  goal_period VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly, custom
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chapter templates for different novel types
CREATE TABLE IF NOT EXISTS chapter_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL, -- Template with placeholders
  genre VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_chapters_project_id ON project_chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chapters_status ON project_chapters(status);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter_id ON chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user_id ON chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reading_progress_chapter_id ON chapter_reading_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_reading_progress_user_id ON chapter_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_goals_user_id ON writing_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_goals_project_id ON writing_goals(project_id);

-- Add RLS policies
ALTER TABLE project_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_templates ENABLE ROW LEVEL SECURITY;

-- Project chapters policies
CREATE POLICY "Users can view chapters of projects they own or have access to" ON project_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_chapters.project_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.visibility IN ('public', 'preview') OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc 
          WHERE pc.project_id = p.id AND pc.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert chapters for their own projects" ON project_chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_chapters.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of their own projects" ON project_chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_chapters.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of their own projects" ON project_chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_chapters.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Chapter comments policies
CREATE POLICY "Users can view comments on accessible chapters" ON chapter_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_chapters pc
      JOIN projects p ON p.id = pc.project_id
      WHERE pc.id = chapter_comments.chapter_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.visibility IN ('public', 'preview') OR
        EXISTS (
          SELECT 1 FROM project_collaborators pcol 
          WHERE pcol.project_id = p.id AND pcol.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create comments on accessible chapters" ON chapter_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM project_chapters pc
      JOIN projects p ON p.id = pc.project_id
      WHERE pc.id = chapter_comments.chapter_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.visibility IN ('public', 'preview') OR
        EXISTS (
          SELECT 1 FROM project_collaborators pcol 
          WHERE pcol.project_id = p.id AND pcol.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON chapter_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON chapter_comments
  FOR DELETE USING (user_id = auth.uid());

-- Chapter reading progress policies
CREATE POLICY "Users can view their own reading progress" ON chapter_reading_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reading progress" ON chapter_reading_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reading progress" ON chapter_reading_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Novel outlines policies
CREATE POLICY "Users can view outlines of their projects" ON novel_outlines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = novel_outlines.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create outlines for their projects" ON novel_outlines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = novel_outlines.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outlines of their projects" ON novel_outlines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = novel_outlines.project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Writing goals policies
CREATE POLICY "Users can manage their own writing goals" ON writing_goals
  FOR ALL USING (user_id = auth.uid());

-- Chapter templates policies
CREATE POLICY "Everyone can view public templates" ON chapter_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates" ON chapter_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON chapter_templates
  FOR UPDATE USING (created_by = auth.uid());

-- Insert some default chapter templates
INSERT INTO chapter_templates (name, description, template_content, genre, is_public) VALUES
('Standard Novel Chapter', 'Basic chapter template for novels', E'# Chapter [CHAPTER_NUMBER]: [CHAPTER_TITLE]\n\n[CHAPTER_CONTENT]\n\n---\n\n**Word Count Goal:** [TARGET_WORDS] words\n**Notes:** [CHAPTER_NOTES]', 'general', true),
('Mystery Chapter', 'Chapter template for mystery novels', E'# Chapter [CHAPTER_NUMBER]: [CHAPTER_TITLE]\n\n## Scene Setup\n[SCENE_DESCRIPTION]\n\n## Character POV\n[POV_CHARACTER]\n\n## Chapter Content\n[CHAPTER_CONTENT]\n\n## Clues Revealed\n[CLUES_LIST]\n\n## Suspects/Motives\n[SUSPECTS_INFO]\n\n---\n\n**Word Count Goal:** [TARGET_WORDS] words', 'mystery', true),
('Romance Chapter', 'Chapter template for romance novels', E'# Chapter [CHAPTER_NUMBER]: [CHAPTER_TITLE]\n\n## Emotional Beat\n[EMOTIONAL_FOCUS]\n\n## Relationship Development\n[RELATIONSHIP_PROGRESS]\n\n## Chapter Content\n[CHAPTER_CONTENT]\n\n## Character Growth\n[CHARACTER_DEVELOPMENT]\n\n---\n\n**Word Count Goal:** [TARGET_WORDS] words', 'romance', true),
('Fantasy Chapter', 'Chapter template for fantasy novels', E'# Chapter [CHAPTER_NUMBER]: [CHAPTER_TITLE]\n\n## Setting/World\n[WORLD_DESCRIPTION]\n\n## Magic System\n[MAGIC_ELEMENTS]\n\n## Chapter Content\n[CHAPTER_CONTENT]\n\n## World Building Notes\n[WORLDBUILDING_NOTES]\n\n---\n\n**Word Count Goal:** [TARGET_WORDS] words', 'fantasy', true);

-- Create functions for automatic word count updates
CREATE OR REPLACE FUNCTION update_chapter_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = COALESCE(array_length(string_to_array(trim(NEW.content), ' '), 1), 0);
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic word count updates
DROP TRIGGER IF EXISTS trigger_update_chapter_word_count ON project_chapters;
CREATE TRIGGER trigger_update_chapter_word_count
  BEFORE UPDATE ON project_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_chapter_word_count();

-- Create function to update project word count from chapters
CREATE OR REPLACE FUNCTION update_project_word_count_from_chapters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET word_count = (
    SELECT COALESCE(SUM(word_count), 0) 
    FROM project_chapters 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  ),
  updated_at = timezone('utc'::text, now())
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for project word count updates
DROP TRIGGER IF EXISTS trigger_update_project_word_count_on_chapter_change ON project_chapters;
CREATE TRIGGER trigger_update_project_word_count_on_chapter_change
  AFTER INSERT OR UPDATE OR DELETE ON project_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_project_word_count_from_chapters();
