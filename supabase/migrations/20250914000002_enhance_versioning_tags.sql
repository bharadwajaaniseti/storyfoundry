-- Update versioning trigger to add appropriate tags for better UX
-- This adds "Synced" tags and improves the tagging system

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
  skip_auto_version TEXT;
  version_tags TEXT[] := ARRAY[]::TEXT[];
  word_diff INTEGER := 0;
  project_owner_id UUID;
  current_user_id UUID;
  is_owner_edit BOOLEAN := FALSE;
BEGIN
  -- Check if auto-versioning should be skipped (e.g., during approval process)
  skip_auto_version := current_setting('app.skip_auto_version', true);
  
  IF skip_auto_version = 'true' THEN
    -- Skip auto-versioning during approval process
    RETURN NEW;
  END IF;

  -- Get project owner and current user
  SELECT owner_id INTO project_owner_id 
  FROM public.projects 
  WHERE id = NEW.project_id;
  
  current_user_id := auth.uid();
  is_owner_edit := (current_user_id = project_owner_id);

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
    -- Calculate word difference for better UX
    word_diff := COALESCE(word_count, 0) - COALESCE(old_word_count, 0);
    
    -- Generate change summary and determine tags
    IF OLD IS NULL THEN
      change_summary := 'Initial content created';
      is_major := TRUE;
      IF is_owner_edit THEN
        version_tags := ARRAY['Auto Created', 'Initial Content', 'Owner Edit'];
      ELSE
        version_tags := ARRAY['Auto Created', 'Initial Content'];
      END IF;
    ELSE
      IF word_diff > 500 THEN
        change_summary := 'Major additions (+' || word_diff || ' words)';
        is_major := TRUE;
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Major Edit', '+' || word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Major Edit', '+' || word_diff || ' words'];
        END IF;
      ELSIF word_diff < -200 THEN
        change_summary := 'Significant content removed (' || word_diff || ' words)';
        is_major := TRUE;
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Major Reduction', word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Major Reduction', word_diff || ' words'];
        END IF;
      ELSIF word_diff > 100 THEN
        change_summary := 'Content expanded (+' || word_diff || ' words)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Content Expansion', '+' || word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Content Expansion', '+' || word_diff || ' words'];
        END IF;
      ELSIF word_diff < -50 THEN
        change_summary := 'Content trimmed (' || word_diff || ' words)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Content Trimmed', word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Content Trimmed', word_diff || ' words'];
        END IF;
      ELSIF word_diff > 10 THEN
        change_summary := 'Minor additions (+' || word_diff || ' words)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Minor Edit', '+' || word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Minor Edit', '+' || word_diff || ' words'];
        END IF;
      ELSIF word_diff < -10 THEN
        change_summary := 'Minor edits (' || word_diff || ' words)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Minor Edit', word_diff || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Minor Edit', word_diff || ' words'];
        END IF;
      ELSIF word_diff = 0 THEN
        change_summary := 'Content synchronized (no word count change)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Content Update', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Content Update'];
        END IF;
      ELSE
        change_summary := 'Text refinements (' || 
          CASE 
            WHEN word_diff > 0 THEN '+' || word_diff 
            ELSE word_diff::text 
          END || ' words)';
        IF is_owner_edit THEN
          version_tags := ARRAY['Synced', 'Text Refinement', 
            CASE 
              WHEN word_diff > 0 THEN '+' || word_diff 
              ELSE word_diff::text 
            END || ' words', 'Owner Edit'];
        ELSE
          version_tags := ARRAY['Synced', 'Text Refinement', 
            CASE 
              WHEN word_diff > 0 THEN '+' || word_diff 
              ELSE word_diff::text 
            END || ' words'];
        END IF;
      END IF;
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
      is_major_version,
      tags
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      NEW.content,
      next_version_number,
      change_summary,
      COALESCE(word_count, 0),
      char_count,
      previous_version_id,
      is_major,
      version_tags
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;