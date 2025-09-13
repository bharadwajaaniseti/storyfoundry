-- Simple script to add the RPC function for content updates without versioning
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