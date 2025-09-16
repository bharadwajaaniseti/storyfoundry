-- Add version control system for world building changes
-- This allows editors to make changes that are staged for owner approval

-- =============================
-- PENDING CHANGES TABLE
-- =============================

CREATE TABLE IF NOT EXISTS public.pending_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  table_name VARCHAR(50) NOT NULL CHECK (table_name IN ('world_elements', 'project_chapters')),
  record_id UUID, -- NULL for create operations, actual ID for update/delete
  old_data JSONB, -- NULL for create, full record for update/delete
  new_data JSONB, -- Full new record for create/update, NULL for delete
  change_summary TEXT, -- Human readable description
  batch_id UUID, -- Groups related changes together
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_changes_project_id ON public.pending_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_editor_id ON public.pending_changes(editor_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_batch_id ON public.pending_changes(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON public.pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_table_record ON public.pending_changes(table_name, record_id);

-- =============================
-- CHANGE BATCHES TABLE
-- =============================

CREATE TABLE IF NOT EXISTS public.change_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_changes INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_change_batches_project_id ON public.change_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_change_batches_editor_id ON public.change_batches(editor_id);
CREATE INDEX IF NOT EXISTS idx_change_batches_status ON public.change_batches(status);

-- =============================
-- VERSIONED WORLD ELEMENTS
-- =============================

-- Add versioning columns to world_elements
ALTER TABLE public.world_elements 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS draft_data JSONB, -- Stores pending changes
ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS last_approved_by UUID REFERENCES public.profiles(id);

-- Add versioning columns to project_chapters  
ALTER TABLE public.project_chapters
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS draft_data JSONB, -- Stores pending changes
ADD COLUMN IF NOT EXISTS last_approved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS last_approved_by UUID REFERENCES public.profiles(id);

-- =============================
-- TRIGGERS FOR AUTO-VERSIONING
-- =============================

-- Function to create pending changes for editor modifications
CREATE OR REPLACE FUNCTION create_pending_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  is_owner BOOLEAN;
  current_batch_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if user is project owner
  SELECT (owner_id = current_user_id) INTO is_owner
  FROM public.projects 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- If owner, allow direct changes
  IF is_owner THEN
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
  
  -- For collaborators, create pending change record
  -- Get or create current batch for this editor
  SELECT id INTO current_batch_id
  FROM public.change_batches 
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND editor_id = current_user_id 
    AND status = 'draft'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Create new batch if none exists
  IF current_batch_id IS NULL THEN
    INSERT INTO public.change_batches (project_id, editor_id, title, description)
    VALUES (
      COALESCE(NEW.project_id, OLD.project_id),
      current_user_id,
      'Draft Changes - ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
      'Automatic batch for editor changes'
    ) RETURNING id INTO current_batch_id;
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for world_elements
DROP TRIGGER IF EXISTS world_elements_pending_changes ON public.world_elements;
CREATE TRIGGER world_elements_pending_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.world_elements
  FOR EACH ROW EXECUTE FUNCTION create_pending_change();

-- Create triggers for project_chapters
DROP TRIGGER IF EXISTS project_chapters_pending_changes ON public.project_chapters;
CREATE TRIGGER project_chapters_pending_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_chapters
  FOR EACH ROW EXECUTE FUNCTION create_pending_change();

-- =============================
-- APPROVAL FUNCTIONS
-- =============================

-- Function to approve a batch of changes
CREATE OR REPLACE FUNCTION approve_change_batch(batch_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  change_record RECORD;
  target_table TEXT;
  success BOOLEAN := TRUE;
BEGIN
  -- Mark batch as approved
  UPDATE public.change_batches 
  SET status = 'approved', 
      approved_by = auth.uid(), 
      approved_at = timezone('utc'::text, now())
  WHERE id = batch_id_param;
  
  -- Apply all pending changes in this batch
  FOR change_record IN 
    SELECT * FROM public.pending_changes 
    WHERE batch_id = batch_id_param AND status = 'pending'
    ORDER BY created_at ASC
  LOOP
    BEGIN
      target_table := 'public.' || change_record.table_name;
      
      IF change_record.change_type = 'create' THEN
        -- Apply create operation
        EXECUTE format('
          INSERT INTO %I SELECT * FROM json_populate_record(NULL::%I, $1)
        ', change_record.table_name, change_record.table_name) 
        USING change_record.new_data;
        
      ELSIF change_record.change_type = 'update' THEN
        -- Apply update operation
        EXECUTE format('
          UPDATE %I SET 
            name = COALESCE(($1->>''name''), name),
            description = COALESCE(($1->>''description''), description),
            attributes = COALESCE(($1->>''attributes'')::jsonb, attributes),
            updated_at = timezone(''utc''::text, now()),
            version = version + 1,
            is_draft = FALSE,
            draft_data = NULL,
            last_approved_at = timezone(''utc''::text, now()),
            last_approved_by = auth.uid()
          WHERE id = $2
        ', change_record.table_name)
        USING change_record.new_data, change_record.record_id;
        
      ELSIF change_record.change_type = 'delete' THEN
        -- Apply delete operation
        EXECUTE format('DELETE FROM %I WHERE id = $1', change_record.table_name)
        USING change_record.record_id;
      END IF;
      
      -- Mark change as approved
      UPDATE public.pending_changes 
      SET status = 'approved', 
          approved_by = auth.uid(), 
          approved_at = timezone('utc'::text, now())
      WHERE id = change_record.id;
      
    EXCEPTION WHEN others THEN
      -- Mark change as rejected if it fails
      UPDATE public.pending_changes 
      SET status = 'rejected'
      WHERE id = change_record.id;
      success := FALSE;
    END;
  END LOOP;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a batch of changes
CREATE OR REPLACE FUNCTION reject_change_batch(batch_id_param UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mark batch as rejected
  UPDATE public.change_batches 
  SET status = 'rejected', 
      approved_by = auth.uid(), 
      approved_at = timezone('utc'::text, now()),
      rejection_reason = reason
  WHERE id = batch_id_param;
  
  -- Mark all pending changes as rejected
  UPDATE public.pending_changes 
  SET status = 'rejected',
      approved_by = auth.uid(),
      approved_at = timezone('utc'::text, now())
  WHERE batch_id = batch_id_param AND status = 'pending';
  
  -- Remove draft flags and data
  UPDATE public.world_elements 
  SET is_draft = FALSE, draft_data = NULL 
  WHERE id IN (
    SELECT record_id FROM public.pending_changes 
    WHERE batch_id = batch_id_param AND table_name = 'world_elements'
  );
  
  UPDATE public.project_chapters 
  SET is_draft = FALSE, draft_data = NULL 
  WHERE id IN (
    SELECT record_id FROM public.pending_changes 
    WHERE batch_id = batch_id_param AND table_name = 'project_chapters'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================
-- RLS POLICIES
-- =============================

-- Enable RLS on new tables
ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_batches ENABLE ROW LEVEL SECURITY;

-- Pending changes policies
CREATE POLICY "pending_changes_select_policy" ON public.pending_changes
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR editor_id = auth.uid()
  );

CREATE POLICY "pending_changes_insert_policy" ON public.pending_changes
  FOR INSERT WITH CHECK (editor_id = auth.uid());

-- Change batches policies  
CREATE POLICY "change_batches_select_policy" ON public.change_batches
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR editor_id = auth.uid()
  );

CREATE POLICY "change_batches_insert_policy" ON public.change_batches
  FOR INSERT WITH CHECK (editor_id = auth.uid());

CREATE POLICY "change_batches_update_policy" ON public.change_batches
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
    OR editor_id = auth.uid()
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION approve_change_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_change_batch(UUID, TEXT) TO authenticated;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pending_changes_updated_at
  BEFORE UPDATE ON public.pending_changes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER change_batches_updated_at
  BEFORE UPDATE ON public.change_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();