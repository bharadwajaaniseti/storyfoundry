-- Create the missing trigger for project_content versioning
-- This is a basic version that will be applied manually

-- First, create the trigger function if it doesn't exist
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
BEGIN
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
    -- Generate change summary
    IF OLD IS NULL THEN
      change_summary := 'Initial content created';
      is_major := TRUE;
    ELSE
      DECLARE
        word_diff INTEGER := COALESCE(word_count, 0) - COALESCE(old_word_count, 0);
      BEGIN
        IF word_diff > 500 THEN
          change_summary := 'Major additions (+' || word_diff || ' words)';
          is_major := TRUE;
        ELSIF word_diff < -200 THEN
          change_summary := 'Significant content removed (' || word_diff || ' words)';
          is_major := TRUE;
        ELSIF word_diff > 100 THEN
          change_summary := 'Content expanded (+' || word_diff || ' words)';
        ELSIF word_diff < -50 THEN
          change_summary := 'Content trimmed (' || word_diff || ' words)';
        ELSIF word_diff > 10 THEN
          change_summary := 'Minor additions (+' || word_diff || ' words)';
        ELSIF word_diff < -10 THEN
          change_summary := 'Minor edits (' || word_diff || ' words)';
        ELSE
          change_summary := 'Text refinements and edits';
        END IF;
      END;
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
      is_major_version
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      NEW.content,
      next_version_number,
      change_summary,
      COALESCE(word_count, 0),
      char_count,
      previous_version_id,
      is_major
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_content_version ON public.project_content;
CREATE TRIGGER trigger_create_content_version
  AFTER INSERT OR UPDATE ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION create_content_version();

-- Also create the RPC function for bypassing versioning
CREATE OR REPLACE FUNCTION update_content_without_versioning(
  p_project_id uuid,
  p_content text,
  p_filename text
)
RETURNS void AS $$
BEGIN
  -- Temporarily disable the trigger
  ALTER TABLE public.project_content DISABLE TRIGGER trigger_create_content_version;
  
  -- Update or insert the content
  INSERT INTO public.project_content (project_id, filename, content, asset_type, updated_at)
  VALUES (p_project_id, p_filename, p_content, 'content', now())
  ON CONFLICT (project_id, asset_type) 
  DO UPDATE SET 
    content = p_content,
    filename = p_filename,
    updated_at = now();
  
  -- Re-enable the trigger
  ALTER TABLE public.project_content ENABLE TRIGGER trigger_create_content_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;