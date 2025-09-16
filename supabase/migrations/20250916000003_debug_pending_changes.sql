-- Test and fix pending changes triggers
-- Run this to debug and fix trigger issues

-- First, let's check if our triggers exist
DO $$
BEGIN
    RAISE NOTICE 'Checking triggers...';
    
    -- Check if triggers exist
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'project_chapters_pending_changes'
    ) THEN
        RAISE NOTICE '✅ project_chapters trigger exists';
    ELSE
        RAISE NOTICE '❌ project_chapters trigger missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'world_elements_pending_changes'
    ) THEN
        RAISE NOTICE '✅ world_elements trigger exists';
    ELSE
        RAISE NOTICE '❌ world_elements trigger missing';
    END IF;
END $$;

-- Test the trigger function manually
DO $$
DECLARE
    test_user_id UUID;
    test_project_id UUID;
    test_chapter_id UUID;
    is_owner_result BOOLEAN;
BEGIN
    -- Get a test user and project
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    SELECT id INTO test_project_id FROM public.projects LIMIT 1;
    SELECT id INTO test_chapter_id FROM public.project_chapters WHERE project_id = test_project_id LIMIT 1;
    
    RAISE NOTICE 'Test data: user=%, project=%, chapter=%', test_user_id, test_project_id, test_chapter_id;
    
    -- Test ownership check
    SELECT (owner_id = test_user_id) INTO is_owner_result
    FROM public.projects 
    WHERE id = test_project_id;
    
    RAISE NOTICE 'Ownership test: user % is owner of project %: %', test_user_id, test_project_id, is_owner_result;
    
    -- Check if we have any pending changes
    RAISE NOTICE 'Current pending changes count: %', (SELECT COUNT(*) FROM public.pending_changes);
    RAISE NOTICE 'Current change batches count: %', (SELECT COUNT(*) FROM public.change_batches);
    
END $$;

-- Add some debugging to the trigger function
CREATE OR REPLACE FUNCTION create_pending_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  is_owner BOOLEAN;
  current_batch_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Debug logging
  RAISE NOTICE 'TRIGGER FIRED: table=%, operation=%, user=%', TG_TABLE_NAME, TG_OP, current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'ERROR: No authenticated user found (auth.uid() returned NULL)';
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Check if user is project owner
  SELECT (owner_id = current_user_id) INTO is_owner
  FROM public.projects 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RAISE NOTICE 'User % ownership check for project %: %', 
    current_user_id, 
    COALESCE(NEW.project_id, OLD.project_id), 
    is_owner;
  
  -- If owner, allow direct changes
  IF is_owner THEN
    RAISE NOTICE 'User is owner - allowing direct changes';
    -- Update version and approval info for direct owner changes
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      NEW.version := COALESCE(OLD.version, 0) + 1;
      NEW.is_draft := FALSE;
      NEW.draft_data := NULL;
      NEW.last_approved_at := timezone('utc'::text, now());
      NEW.last_approved_by := current_user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RAISE NOTICE 'User is collaborator - creating pending change';
  
  -- For collaborators, create pending change record
  -- Get or create current batch for this editor
  SELECT id INTO current_batch_id
  FROM public.change_batches 
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND editor_id = current_user_id 
    AND status = 'draft'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RAISE NOTICE 'Found existing batch: %', current_batch_id;
  
  -- Create new batch if none exists
  IF current_batch_id IS NULL THEN
    INSERT INTO public.change_batches (project_id, editor_id, title, description)
    VALUES (
      COALESCE(NEW.project_id, OLD.project_id),
      current_user_id,
      'Draft Changes - ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
      'Automatic batch for editor changes'
    ) RETURNING id INTO current_batch_id;
    
    RAISE NOTICE 'Created new batch: %', current_batch_id;
  END IF;
  
  -- Create pending change record
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pending_changes (
      project_id, editor_id, change_type, table_name, record_id, 
      old_data, new_data, change_summary, batch_id
    ) VALUES (
      NEW.project_id, current_user_id, 'create', TG_TABLE_NAME, NEW.id,
      NULL, row_to_json(NEW), 'Created ' || COALESCE(NEW.name, NEW.title), current_batch_id
    );
    
    RAISE NOTICE 'Created pending change for INSERT';
    
    -- Mark record as draft
    NEW.is_draft := TRUE;
    NEW.draft_data := row_to_json(NEW);
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.pending_changes (
      project_id, editor_id, change_type, table_name, record_id,
      old_data, new_data, change_summary, batch_id
    ) VALUES (
      NEW.project_id, current_user_id, 'update', TG_TABLE_NAME, NEW.id,
      row_to_json(OLD), row_to_json(NEW), 'Updated ' || COALESCE(NEW.name, NEW.title), current_batch_id
    );
    
    RAISE NOTICE 'Created pending change for UPDATE';
    
    -- Store changes in draft_data
    NEW.is_draft := TRUE;
    NEW.draft_data := row_to_json(NEW);
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.pending_changes (
      project_id, editor_id, change_type, table_name, record_id,
      old_data, new_data, change_summary, batch_id
    ) VALUES (
      OLD.project_id, current_user_id, 'delete', TG_TABLE_NAME, OLD.id,
      row_to_json(OLD), NULL, 'Deleted ' || COALESCE(OLD.name, OLD.title), current_batch_id
    );
    
    RAISE NOTICE 'Created pending change for DELETE';
    
    -- Mark for deletion but don't actually delete yet
    UPDATE public.world_elements SET is_draft = TRUE WHERE id = OLD.id;
    UPDATE public.project_chapters SET is_draft = TRUE WHERE id = OLD.id;
    RETURN NULL; -- Prevent actual deletion
  END IF;
  
  -- Update batch change count
  UPDATE public.change_batches 
  SET total_changes = (
    SELECT COUNT(*) FROM public.pending_changes 
    WHERE batch_id = current_batch_id AND status = 'pending'
  )
  WHERE id = current_batch_id;
  
  RAISE NOTICE 'Updated batch change count';
  
  RETURN COALESCE(NEW, OLD);
  
EXCEPTION WHEN others THEN
  RAISE NOTICE 'ERROR in trigger: %', SQLERRM;
  -- Return the record to prevent data loss
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;