-- =====================================================
-- FIX: Add SET search_path to RPC functions
-- =====================================================
-- This fixes a common issue where SECURITY DEFINER functions
-- fail due to search_path problems

-- Fix the save_screenplay_elements function
CREATE OR REPLACE FUNCTION save_screenplay_elements(
  p_project_id UUID,
  p_elements JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_element JSONB;
  v_element_id UUID;
  v_result JSONB;
BEGIN
  -- Delete existing elements for this project
  DELETE FROM public.screenplay_elements 
  WHERE project_id = p_project_id;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix the create_screenplay_revision function
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
    v_elements,
    v_stats,
    auth.uid()
  ) RETURNING id INTO v_revision_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'revision_id', v_revision_id,
    'revision_number', v_next_revision_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
