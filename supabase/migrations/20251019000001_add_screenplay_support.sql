-- Migration: Add Screenplay Support
-- Description: Creates tables and functions to support screenplay editing with scenes, elements, and versioning
-- Date: 2025-10-19

-- =====================================================
-- SCREENPLAY SCENES TABLE
-- Stores individual scenes with metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS public.screenplay_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  scene_number INTEGER NOT NULL,
  heading TEXT NOT NULL, -- e.g., "INT. COFFEE SHOP - DAY"
  location TEXT, -- Extracted location "COFFEE SHOP"
  int_ext TEXT CHECK (int_ext IN ('INT', 'EXT', 'INT/EXT')), -- Interior/Exterior
  time_of_day TEXT, -- e.g., "DAY", "NIGHT", "DAWN", "DUSK"
  description TEXT, -- Scene description/summary
  page_number NUMERIC DEFAULT 0,
  page_count NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'in_review', 'completed', 'published')) DEFAULT 'draft',
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, scene_number)
);

-- =====================================================
-- SCREENPLAY ELEMENTS TABLE
-- Stores individual screenplay elements (scene headings, action, dialogue, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.screenplay_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  scene_id UUID REFERENCES public.screenplay_scenes(id) ON DELETE CASCADE,
  element_type TEXT CHECK (element_type IN (
    'scene_heading',
    'action', 
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'note'
  )) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  character_name TEXT, -- For dialogue/character elements
  dual_dialogue BOOLEAN DEFAULT FALSE,
  centered BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- For additional element-specific data
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SCREENPLAY CHARACTERS TABLE
-- Tracks unique characters that appear in the screenplay
-- =====================================================
CREATE TABLE IF NOT EXISTS public.screenplay_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  age TEXT,
  gender TEXT,
  role TEXT CHECK (role IN ('lead', 'supporting', 'minor', 'extra')) DEFAULT 'supporting',
  first_appearance_scene_id UUID REFERENCES public.screenplay_scenes(id) ON DELETE SET NULL,
  dialogue_count INTEGER DEFAULT 0,
  scene_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- =====================================================
-- SCREENPLAY REVISIONS TABLE
-- Version history for screenplay drafts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.screenplay_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  revision_number INTEGER NOT NULL,
  revision_name TEXT, -- e.g., "First Draft", "Blue Revision", "Pink Pages"
  revision_color TEXT, -- Industry standard: white, blue, pink, yellow, green, goldenrod, buff, salmon, cherry
  description TEXT,
  elements_snapshot JSONB NOT NULL, -- Full snapshot of screenplay elements
  stats JSONB DEFAULT '{}', -- Statistics: page count, scene count, character count, etc.
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, revision_number)
);

-- =====================================================
-- SCREENPLAY COMMENTS TABLE
-- Comments on specific screenplay elements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.screenplay_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  element_id UUID REFERENCES public.screenplay_elements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('note', 'suggestion', 'question', 'approval')) DEFAULT 'note',
  resolved BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES public.screenplay_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_screenplay_scenes_project_id ON public.screenplay_scenes(project_id);
CREATE INDEX idx_screenplay_scenes_scene_number ON public.screenplay_scenes(project_id, scene_number);
CREATE INDEX idx_screenplay_elements_project_id ON public.screenplay_elements(project_id);
CREATE INDEX idx_screenplay_elements_scene_id ON public.screenplay_elements(scene_id);
CREATE INDEX idx_screenplay_elements_sort_order ON public.screenplay_elements(project_id, sort_order);
CREATE INDEX idx_screenplay_characters_project_id ON public.screenplay_characters(project_id);
CREATE INDEX idx_screenplay_revisions_project_id ON public.screenplay_revisions(project_id);
CREATE INDEX idx_screenplay_comments_project_id ON public.screenplay_comments(project_id);
CREATE INDEX idx_screenplay_comments_element_id ON public.screenplay_comments(element_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER screenplay_scenes_updated_at
  BEFORE UPDATE ON public.screenplay_scenes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER screenplay_elements_updated_at
  BEFORE UPDATE ON public.screenplay_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER screenplay_characters_updated_at
  BEFORE UPDATE ON public.screenplay_characters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER screenplay_comments_updated_at
  BEFORE UPDATE ON public.screenplay_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Screenplay Scenes RLS
ALTER TABLE public.screenplay_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenplay_scenes_select" ON public.screenplay_scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_scenes.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_scenes_insert" ON public.screenplay_scenes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_scenes.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

CREATE POLICY "screenplay_scenes_update" ON public.screenplay_scenes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_scenes.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

CREATE POLICY "screenplay_scenes_delete" ON public.screenplay_scenes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_scenes.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- Screenplay Elements RLS
ALTER TABLE public.screenplay_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenplay_elements_select" ON public.screenplay_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_elements.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_elements_insert" ON public.screenplay_elements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_elements.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

CREATE POLICY "screenplay_elements_update" ON public.screenplay_elements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_elements.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

CREATE POLICY "screenplay_elements_delete" ON public.screenplay_elements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_elements.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

-- Screenplay Characters RLS
ALTER TABLE public.screenplay_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenplay_characters_select" ON public.screenplay_characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_characters.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_characters_modify" ON public.screenplay_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_characters.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

-- Screenplay Revisions RLS
ALTER TABLE public.screenplay_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenplay_revisions_select" ON public.screenplay_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_revisions.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_revisions_insert" ON public.screenplay_revisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_revisions.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND pc.role IN ('editor', 'writer')
        )
      )
    )
  );

-- Screenplay Comments RLS
ALTER TABLE public.screenplay_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenplay_comments_select" ON public.screenplay_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_comments.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_comments_insert" ON public.screenplay_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = screenplay_comments.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

CREATE POLICY "screenplay_comments_update" ON public.screenplay_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "screenplay_comments_delete" ON public.screenplay_comments
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to save screenplay elements
CREATE OR REPLACE FUNCTION save_screenplay_elements(
  p_project_id UUID,
  p_elements JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_element JSONB;
  v_element_id UUID;
BEGIN
  -- Clear existing elements for this project
  DELETE FROM public.screenplay_elements WHERE project_id = p_project_id;
  
  -- Insert new elements
  FOR v_element IN SELECT * FROM jsonb_array_elements(p_elements)
  LOOP
    INSERT INTO public.screenplay_elements (
      project_id,
      element_type,
      content,
      character_name,
      metadata,
      sort_order
    ) VALUES (
      p_project_id,
      v_element->>'type',
      v_element->>'content',
      v_element->>'characterName',
      COALESCE(v_element->'metadata', '{}'::jsonb),
      (v_element->>'sortOrder')::INTEGER
    ) RETURNING id INTO v_element_id;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Screenplay elements saved successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new revision
CREATE OR REPLACE FUNCTION create_screenplay_revision(
  p_project_id UUID,
  p_revision_name TEXT,
  p_revision_color TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_next_revision_number INTEGER;
  v_elements JSONB;
  v_stats JSONB;
  v_revision_id UUID;
BEGIN
  -- Get next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1 
  INTO v_next_revision_number
  FROM public.screenplay_revisions
  WHERE project_id = p_project_id;
  
  -- Get current elements snapshot
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'type', element_type,
      'content', content,
      'characterName', character_name,
      'metadata', metadata,
      'sortOrder', sort_order
    ) ORDER BY sort_order
  )
  INTO v_elements
  FROM public.screenplay_elements
  WHERE project_id = p_project_id;
  
  -- Calculate stats
  SELECT jsonb_build_object(
    'sceneCount', COUNT(*) FILTER (WHERE element_type = 'scene_heading'),
    'pageCount', CEIL(COUNT(*) / 8.0),
    'characterCount', COUNT(DISTINCT character_name) FILTER (WHERE character_name IS NOT NULL),
    'dialogueLineCount', COUNT(*) FILTER (WHERE element_type = 'dialogue'),
    'actionLineCount', COUNT(*) FILTER (WHERE element_type = 'action')
  )
  INTO v_stats
  FROM public.screenplay_elements
  WHERE project_id = p_project_id;
  
  -- Create revision
  INSERT INTO public.screenplay_revisions (
    project_id,
    revision_number,
    revision_name,
    revision_color,
    description,
    elements_snapshot,
    stats,
    created_by
  ) VALUES (
    p_project_id,
    v_next_revision_number,
    p_revision_name,
    p_revision_color,
    p_description,
    COALESCE(v_elements, '[]'::jsonb),
    v_stats,
    auth.uid()
  ) RETURNING id INTO v_revision_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'revisionId', v_revision_id,
    'revisionNumber', v_next_revision_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION save_screenplay_elements(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_screenplay_revision(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.screenplay_scenes IS 'Individual scenes in a screenplay with metadata';
COMMENT ON TABLE public.screenplay_elements IS 'Individual screenplay elements (scene headings, action, dialogue, etc.)';
COMMENT ON TABLE public.screenplay_characters IS 'Character tracking for screenplays';
COMMENT ON TABLE public.screenplay_revisions IS 'Version history for screenplay drafts';
COMMENT ON TABLE public.screenplay_comments IS 'Comments on specific screenplay elements';
COMMENT ON FUNCTION save_screenplay_elements IS 'Saves screenplay elements to the database';
COMMENT ON FUNCTION create_screenplay_revision IS 'Creates a new screenplay revision/draft';
