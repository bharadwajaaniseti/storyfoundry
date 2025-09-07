-- Create RPC function to save project content with proper error handling
CREATE OR REPLACE FUNCTION public.save_project_content(
  p_project_id UUID,
  p_content TEXT,
  p_filename TEXT DEFAULT 'content.txt',
  p_asset_type TEXT DEFAULT 'content'
)
RETURNS VOID AS $$
BEGIN
  -- Try to insert first
  INSERT INTO public.project_content (
    project_id,
    filename,
    content,
    asset_type,
    created_at,
    updated_at
  ) VALUES (
    p_project_id,
    p_filename,
    p_content,
    p_asset_type,
    NOW(),
    NOW()
  )
  ON CONFLICT (project_id, asset_type) 
  DO UPDATE SET
    content = EXCLUDED.content,
    filename = EXCLUDED.filename,
    updated_at = NOW();
EXCEPTION
  WHEN OTHERS THEN
    -- If insert/update fails, try update only
    UPDATE public.project_content
    SET 
      content = p_content,
      filename = p_filename,
      updated_at = NOW()
    WHERE project_id = p_project_id 
      AND asset_type = p_asset_type;
    
    -- If no rows were updated, try insert
    IF NOT FOUND THEN
      INSERT INTO public.project_content (
        project_id,
        filename,
        content,
        asset_type,
        created_at,
        updated_at
      ) VALUES (
        p_project_id,
        p_filename,
        p_content,
        p_asset_type,
        NOW(),
        NOW()
      );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.save_project_content(UUID, TEXT, TEXT, TEXT) TO authenticated;
