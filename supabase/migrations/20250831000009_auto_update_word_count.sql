-- Function to calculate and update word count for a project
CREATE OR REPLACE FUNCTION public.update_project_word_count()
RETURNS TRIGGER AS $$
DECLARE
  project_uuid UUID;
  total_words INTEGER;
  content_text TEXT;
BEGIN
  -- Get the project_id from the operation
  IF TG_OP = 'DELETE' THEN
    project_uuid := OLD.project_id;
  ELSE
    project_uuid := NEW.project_id;
  END IF;

  -- Get the main content (asset_type = 'content') for this project
  SELECT content INTO content_text
  FROM public.project_content
  WHERE project_id = project_uuid 
    AND asset_type = 'content'
    AND content IS NOT NULL
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Calculate word count using a method that matches JavaScript split(/\s+/)
  IF content_text IS NOT NULL AND trim(content_text) != '' THEN
    -- Replace multiple whitespace with single space, then split and count
    SELECT array_length(
      string_to_array(
        trim(regexp_replace(content_text, '\s+', ' ', 'g')), 
        ' '
      ), 
      1
    ) INTO total_words;
    
    -- Handle edge case where content is only whitespace
    IF total_words IS NULL THEN
      total_words := 0;
    END IF;
  ELSE
    total_words := 0;
  END IF;

  -- Update the word_count in the projects table
  UPDATE public.projects 
  SET 
    word_count = total_words,
    updated_at = NOW()
  WHERE id = project_uuid;

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT, UPDATE, and DELETE on project_content
DROP TRIGGER IF EXISTS trigger_update_word_count_insert ON public.project_content;
DROP TRIGGER IF EXISTS trigger_update_word_count_update ON public.project_content;
DROP TRIGGER IF EXISTS trigger_update_word_count_delete ON public.project_content;

CREATE TRIGGER trigger_update_word_count_insert
  AFTER INSERT ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_word_count();

CREATE TRIGGER trigger_update_word_count_update
  AFTER UPDATE ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_word_count();

CREATE TRIGGER trigger_update_word_count_delete
  AFTER DELETE ON public.project_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_word_count();

-- Initialize word counts for existing projects
UPDATE public.projects 
SET word_count = (
  SELECT CASE 
    WHEN pc.content IS NOT NULL AND trim(pc.content) != '' THEN
      array_length(
        string_to_array(
          trim(regexp_replace(pc.content, '\s+', ' ', 'g')), 
          ' '
        ), 
        1
      )
    ELSE 0 
  END
  FROM public.project_content pc
  WHERE pc.project_id = projects.id 
    AND pc.asset_type = 'content'
    AND pc.content IS NOT NULL
  ORDER BY pc.updated_at DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM public.project_content pc2 
  WHERE pc2.project_id = projects.id
    AND pc2.asset_type = 'content'
);
