-- Migration: Add Editor Approval Workflow for Content Changes
-- This extends the existing workflow system for specific Editor content approval needs

-- Create pending_editor_changes table for tracking Editor changes awaiting Owner approval
CREATE TABLE IF NOT EXISTS pending_editor_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  editor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID, -- Can be null for general project content
  content_type TEXT CHECK (content_type IN ('chapter', 'project_content', 'outline')) NOT NULL DEFAULT 'chapter',
  original_content TEXT NOT NULL,
  proposed_content TEXT NOT NULL,
  change_description TEXT,
  editor_notes TEXT,
  content_title TEXT, -- Chapter title or content section name
  content_metadata JSONB DEFAULT '{}', -- Store additional info like word counts, etc.
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')) NOT NULL DEFAULT 'pending',
  approval_deadline TIMESTAMPTZ, -- Optional deadline for approval
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create approval_decisions table for tracking Owner decisions
CREATE TABLE IF NOT EXISTS editor_approval_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pending_change_id UUID REFERENCES pending_editor_changes(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  decision TEXT CHECK (decision IN ('approve', 'reject', 'request_revision')) NOT NULL,
  feedback_notes TEXT,
  suggested_changes TEXT,
  decision_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_editor_changes_project_id ON pending_editor_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_pending_editor_changes_editor_id ON pending_editor_changes(editor_id);
CREATE INDEX IF NOT EXISTS idx_pending_editor_changes_status ON pending_editor_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_editor_changes_created_at ON pending_editor_changes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editor_approval_decisions_pending_change_id ON editor_approval_decisions(pending_change_id);
CREATE INDEX IF NOT EXISTS idx_editor_approval_decisions_owner_id ON editor_approval_decisions(owner_id);

-- Enable RLS
ALTER TABLE pending_editor_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_approval_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_editor_changes
DROP POLICY IF EXISTS "Users can view pending changes for projects they have access to" ON pending_editor_changes;
CREATE POLICY "Users can view pending changes for projects they have access to" ON pending_editor_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pending_editor_changes.project_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Editors can create pending changes for projects they collaborate on" ON pending_editor_changes;
CREATE POLICY "Editors can create pending changes for projects they collaborate on" ON pending_editor_changes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pending_editor_changes.project_id
      AND EXISTS (
        SELECT 1 FROM project_collaborators pc
        WHERE pc.project_id = p.id
        AND pc.user_id = auth.uid()
        AND pc.status = 'active'
        AND (pc.role = 'editor' OR 'editor' = ANY(pc.secondary_roles))
      )
    )
  );

DROP POLICY IF EXISTS "Editors can update their own pending changes" ON pending_editor_changes;
CREATE POLICY "Editors can update their own pending changes" ON pending_editor_changes
  FOR UPDATE USING (editor_id = auth.uid() AND status = 'pending');

-- RLS Policies for editor_approval_decisions
DROP POLICY IF EXISTS "Users can view approval decisions for accessible projects" ON editor_approval_decisions;
CREATE POLICY "Users can view approval decisions for accessible projects" ON editor_approval_decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pending_editor_changes pec
      JOIN projects p ON p.id = pec.project_id
      WHERE pec.id = editor_approval_decisions.pending_change_id
      AND (
        p.owner_id = auth.uid() OR
        pec.editor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Project owners can create approval decisions" ON editor_approval_decisions;
CREATE POLICY "Project owners can create approval decisions" ON editor_approval_decisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pending_editor_changes pec
      JOIN projects p ON p.id = pec.project_id
      WHERE pec.id = editor_approval_decisions.pending_change_id
      AND p.owner_id = auth.uid()
    )
  );

-- Create function to submit editor changes for approval
CREATE OR REPLACE FUNCTION submit_editor_change_for_approval(
  p_project_id UUID,
  p_original_content TEXT,
  p_proposed_content TEXT,
  p_chapter_id UUID DEFAULT NULL,
  p_content_type TEXT DEFAULT 'chapter',
  p_change_description TEXT DEFAULT NULL,
  p_editor_notes TEXT DEFAULT NULL,
  p_content_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  change_id UUID;
  project_record RECORD;
  editor_record RECORD;
BEGIN
  -- Validate content type
  IF p_content_type NOT IN ('chapter', 'project_content', 'outline') THEN
    RAISE EXCEPTION 'Invalid content type. Must be chapter, project_content, or outline';
  END IF;

  -- Get project details and verify it exists
  SELECT * INTO project_record
  FROM projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Verify user is an editor on this project
  SELECT * INTO editor_record
  FROM project_collaborators
  WHERE project_id = p_project_id
  AND user_id = auth.uid()
  AND status = 'active'
  AND (role = 'editor' OR 'editor' = ANY(secondary_roles));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not an editor on this project';
  END IF;

  -- Create pending change record
  INSERT INTO pending_editor_changes (
    project_id,
    editor_id,
    chapter_id,
    content_type,
    original_content,
    proposed_content,
    change_description,
    editor_notes,
    content_title,
    content_metadata
  ) VALUES (
    p_project_id,
    auth.uid(),
    p_chapter_id,
    p_content_type,
    p_original_content,
    p_proposed_content,
    p_change_description,
    p_editor_notes,
    p_content_title,
    jsonb_build_object(
      'original_word_count', array_length(string_to_array(trim(p_original_content), ' '), 1),
      'proposed_word_count', array_length(string_to_array(trim(p_proposed_content), ' '), 1),
      'submitted_at', NOW()
    )
  ) RETURNING id INTO change_id;

  -- Create notification for project owner
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    project_record.owner_id,
    'project_activity',
    'Editor Changes Pending Approval',
    'An editor has submitted changes for approval in "' || project_record.title || '"',
    jsonb_build_object(
      'pending_change_id', change_id,
      'project_id', p_project_id,
      'content_type', p_content_type,
      'editor_id', auth.uid(),
      'content_title', p_content_title
    );

  RETURN change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve/reject editor changes
CREATE OR REPLACE FUNCTION process_editor_change_approval(
  p_pending_change_id UUID,
  p_decision TEXT,
  p_feedback_notes TEXT DEFAULT NULL,
  p_suggested_changes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  decision_id UUID;
  change_record RECORD;
  project_record RECORD;
BEGIN
  -- Validate decision
  IF p_decision NOT IN ('approve', 'reject', 'request_revision') THEN
    RAISE EXCEPTION 'Invalid decision. Must be approve, reject, or request_revision';
  END IF;

  -- Get pending change details
  SELECT * INTO change_record
  FROM pending_editor_changes
  WHERE id = p_pending_change_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found';
  END IF;

  -- Get project details and verify user is owner
  SELECT * INTO project_record
  FROM projects
  WHERE id = change_record.project_id
  AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only project owners can approve/reject editor changes';
  END IF;

  -- Create approval decision record
  INSERT INTO editor_approval_decisions (
    pending_change_id,
    owner_id,
    decision,
    feedback_notes,
    suggested_changes,
    decision_metadata
  ) VALUES (
    p_pending_change_id,
    auth.uid(),
    p_decision,
    p_feedback_notes,
    p_suggested_changes,
    jsonb_build_object(
      'decided_at', NOW(),
      'project_title', project_record.title
    )
  ) RETURNING id INTO decision_id;

  -- Update pending change status
  UPDATE pending_editor_changes
  SET 
    status = CASE 
      WHEN p_decision = 'approve' THEN 'approved'
      WHEN p_decision = 'reject' THEN 'rejected'
      WHEN p_decision = 'request_revision' THEN 'needs_revision'
    END,
    updated_at = NOW()
  WHERE id = p_pending_change_id;

  -- If approved, apply the changes to the actual content
  IF p_decision = 'approve' THEN
    -- Apply changes based on content type
    CASE change_record.content_type
      WHEN 'chapter' THEN
        -- Update chapter content
        IF change_record.chapter_id IS NOT NULL THEN
          UPDATE project_chapters
          SET 
            content = change_record.proposed_content,
            word_count = array_length(string_to_array(trim(change_record.proposed_content), ' '), 1),
            updated_at = NOW()
          WHERE id = change_record.chapter_id;
        END IF;
      
      WHEN 'project_content' THEN
        -- Update project content in project_content table
        UPDATE project_content
        SET 
          content = change_record.proposed_content,
          updated_at = NOW()
        WHERE project_id = change_record.project_id
        AND asset_type = 'content';
        
        -- If no project_content record exists, create one
        IF NOT FOUND THEN
          INSERT INTO project_content (
            project_id,
            filename,
            content,
            asset_type
          ) VALUES (
            change_record.project_id,
            project_record.title || '_content.txt',
            change_record.proposed_content,
            'content'
          );
        END IF;
      
      WHEN 'outline' THEN
        -- Update project outline/synopsis
        UPDATE projects
        SET 
          synopsis = change_record.proposed_content,
          updated_at = NOW()
        WHERE id = change_record.project_id;
    END CASE;

    -- Create a workflow submission record for tracking
    INSERT INTO workflow_submissions (
      project_id,
      submitter_id,
      title,
      description,
      content,
      original_content,
      submission_type,
      status,
      metadata
    ) VALUES (
      change_record.project_id,
      change_record.editor_id,
      'Approved Editor Change: ' || COALESCE(change_record.content_title, change_record.content_type),
      change_record.change_description,
      change_record.proposed_content,
      change_record.original_content,
      'edit',
      'approved',
      jsonb_build_object(
        'pending_change_id', p_pending_change_id,
        'approval_decision_id', decision_id,
        'auto_applied', true
      )
    );
  END IF;

  -- Create notification for editor
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    change_record.editor_id,
    'project_activity',
    CASE 
      WHEN p_decision = 'approve' THEN 'Changes Approved'
      WHEN p_decision = 'reject' THEN 'Changes Rejected'
      WHEN p_decision = 'request_revision' THEN 'Revision Requested'
    END,
    CASE 
      WHEN p_decision = 'approve' THEN 'Your changes to "' || project_record.title || '" have been approved and applied'
      WHEN p_decision = 'reject' THEN 'Your changes to "' || project_record.title || '" have been rejected'
      WHEN p_decision = 'request_revision' THEN 'Revisions requested for your changes to "' || project_record.title || '"'
    END,
    jsonb_build_object(
      'pending_change_id', p_pending_change_id,
      'decision_id', decision_id,
      'project_id', change_record.project_id,
      'feedback_notes', p_feedback_notes,
      'suggested_changes', p_suggested_changes
    );

  RETURN decision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending changes for a project owner
CREATE OR REPLACE FUNCTION get_pending_editor_changes(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  editor_name TEXT,
  editor_email TEXT,
  content_type TEXT,
  content_title TEXT,
  change_description TEXT,
  editor_notes TEXT,
  word_count_change INTEGER,
  created_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pec.id,
    COALESCE(prof.display_name, TRIM(COALESCE(prof.first_name, '') || ' ' || COALESCE(prof.last_name, '')), 'Unknown User') as editor_name,
    auth_users.email as editor_email,
    pec.content_type,
    pec.content_title,
    pec.change_description,
    pec.editor_notes,
    (pec.content_metadata->>'proposed_word_count')::INTEGER - (pec.content_metadata->>'original_word_count')::INTEGER as word_count_change,
    pec.created_at,
    pec.status
  FROM pending_editor_changes pec
  JOIN profiles prof ON prof.id = pec.editor_id
  LEFT JOIN auth.users auth_users ON auth_users.id = pec.editor_id
  WHERE pec.project_id = p_project_id
  AND pec.status IN ('pending', 'needs_revision')
  ORDER BY pec.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_pending_changes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pending_editor_changes_updated_at ON pending_editor_changes;
CREATE TRIGGER update_pending_editor_changes_updated_at
  BEFORE UPDATE ON pending_editor_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_changes_timestamp();

-- Create helpful view for editor change management
CREATE OR REPLACE VIEW editor_changes_with_details AS
SELECT 
  pec.*,
  COALESCE(prof.display_name, TRIM(COALESCE(prof.first_name, '') || ' ' || COALESCE(prof.last_name, '')), 'Unknown User') as editor_name,
  auth_users.email as editor_email,
  proj.title as project_title,
  proj.owner_id as project_owner_id,
  CASE 
    WHEN ead.id IS NOT NULL THEN ead.decision
    ELSE NULL
  END as latest_decision,
  CASE 
    WHEN ead.id IS NOT NULL THEN ead.feedback_notes
    ELSE NULL
  END as latest_feedback
FROM pending_editor_changes pec
JOIN profiles prof ON prof.id = pec.editor_id
LEFT JOIN auth.users auth_users ON auth_users.id = pec.editor_id
JOIN projects proj ON proj.id = pec.project_id
LEFT JOIN editor_approval_decisions ead ON ead.pending_change_id = pec.id
WHERE ead.id IS NULL OR ead.created_at = (
  SELECT MAX(created_at) 
  FROM editor_approval_decisions 
  WHERE pending_change_id = pec.id
);

-- Add comments for documentation
COMMENT ON TABLE pending_editor_changes IS 'Stores editor changes awaiting owner approval';
COMMENT ON TABLE editor_approval_decisions IS 'Stores owner decisions on editor changes';
COMMENT ON FUNCTION submit_editor_change_for_approval IS 'Submits editor changes for owner approval';
COMMENT ON FUNCTION process_editor_change_approval IS 'Processes owner approval/rejection of editor changes';
COMMENT ON FUNCTION get_pending_editor_changes IS 'Gets pending editor changes for a project owner';