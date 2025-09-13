-- Create helper functions to manage auto-versioning during sync operations
-- This allows us to temporarily disable auto-versioning during content sync from projects.synopsis

-- Function to disable auto-versioning trigger
CREATE OR REPLACE FUNCTION disable_auto_versioning()
RETURNS text AS $$
BEGIN
  -- Disable the trigger temporarily
  ALTER TABLE project_content DISABLE TRIGGER trigger_create_content_version;
  
  RETURN 'Auto-versioning trigger disabled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable auto-versioning trigger
CREATE OR REPLACE FUNCTION enable_auto_versioning()
RETURNS text AS $$
BEGIN
  -- Re-enable the trigger
  ALTER TABLE project_content ENABLE TRIGGER trigger_create_content_version;
  
  RETURN 'Auto-versioning trigger enabled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely sync content from projects.synopsis to project_content
-- This bypasses auto-versioning to avoid user_id constraint issues during admin operations
CREATE OR REPLACE FUNCTION sync_content_to_project_content(
  p_project_id UUID,
  p_content TEXT,
  p_filename TEXT DEFAULT 'content.txt'
)
RETURNS text AS $$
DECLARE
  existing_record_id UUID;
  result_message TEXT;
BEGIN
  -- Temporarily disable auto-versioning
  PERFORM disable_auto_versioning();
  
  BEGIN
    -- Check if record exists
    SELECT id INTO existing_record_id
    FROM project_content 
    WHERE project_id = p_project_id AND asset_type = 'content';
    
    IF existing_record_id IS NOT NULL THEN
      -- Update existing record
      UPDATE project_content 
      SET 
        content = p_content,
        filename = p_filename,
        updated_at = NOW()
      WHERE id = existing_record_id;
      
      result_message := 'Updated existing project_content record';
    ELSE
      -- Create new record
      INSERT INTO project_content (
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
        'content',
        NOW(),
        NOW()
      );
      
      result_message := 'Created new project_content record';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Ensure trigger is re-enabled even if sync fails
    PERFORM enable_auto_versioning();
    RAISE;
  END;
  
  -- Re-enable auto-versioning
  PERFORM enable_auto_versioning();
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION disable_auto_versioning() TO service_role;
GRANT EXECUTE ON FUNCTION enable_auto_versioning() TO service_role;
GRANT EXECUTE ON FUNCTION sync_content_to_project_content(UUID, TEXT, TEXT) TO service_role;