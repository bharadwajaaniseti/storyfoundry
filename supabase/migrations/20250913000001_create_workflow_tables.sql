-- Create workflow management tables
-- Migration: 20250913000001_create_workflow_tables.sql

-- Create workflow_submissions table
CREATE TABLE IF NOT EXISTS workflow_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  submitter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  original_content TEXT, -- For comparison
  submission_type TEXT CHECK (submission_type IN ('edit', 'translation', 'review', 'suggestion', 'task', 'comment')) NOT NULL DEFAULT 'edit',
  category TEXT CHECK (category IN ('content', 'structure', 'language', 'quality', 'production')) NOT NULL DEFAULT 'content',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending_approval', 'pending_request', 'approved', 'rejected', 'needs_changes')) NOT NULL DEFAULT 'pending_approval',
  target_role TEXT CHECK (target_role IN ('coauthor', 'editor', 'translator', 'producer', 'reviewer', 'owner')),
  chapter_reference TEXT,
  word_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- For additional data like language, version info, etc.
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create workflow_approvals table
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES workflow_submissions(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('approve', 'reject', 'request_changes')) NOT NULL,
  notes TEXT,
  review_priority TEXT CHECK (review_priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create workflow_comments table
CREATE TABLE IF NOT EXISTS workflow_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES workflow_submissions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES workflow_comments(id) ON DELETE CASCADE, -- For threaded comments
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create workflow_attachments table
CREATE TABLE IF NOT EXISTS workflow_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES workflow_submissions(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_submissions_project_id ON workflow_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_submissions_submitter_id ON workflow_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_workflow_submissions_status ON workflow_submissions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_submissions_created_at ON workflow_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_submission_id ON workflow_approvals(submission_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver_id ON workflow_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_submission_id ON workflow_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_parent_id ON workflow_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_workflow_attachments_submission_id ON workflow_attachments(submission_id);

-- Enable RLS
ALTER TABLE workflow_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflow_submissions
CREATE POLICY "Users can view submissions for projects they have access to" ON workflow_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workflow_submissions.project_id
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

CREATE POLICY "Users can create submissions for projects they have write access to" ON workflow_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workflow_submissions.project_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND (pc.permissions->>'write')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can update their own submissions" ON workflow_submissions
  FOR UPDATE USING (submitter_id = auth.uid());

-- Create RLS policies for workflow_approvals
CREATE POLICY "Users can view approvals for accessible submissions" ON workflow_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_approvals.submission_id
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

CREATE POLICY "Users can create approvals for submissions they can review" ON workflow_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_approvals.submission_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'active'
          AND (
            pc.role IN ('editor', 'reviewer', 'producer') OR
            (ws.submission_type = 'translation' AND pc.role IN ('editor', 'reviewer')) OR
            (ws.submission_type = 'review' AND pc.role IN ('coauthor', 'producer')) OR
            (ws.submission_type = 'task' AND pc.role IN ('producer', 'coauthor'))
          )
        )
      )
    )
  );

-- Create RLS policies for workflow_comments
CREATE POLICY "Users can view comments for accessible submissions" ON workflow_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_comments.submission_id
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

CREATE POLICY "Users can create comments for accessible submissions" ON workflow_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_comments.submission_id
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

CREATE POLICY "Users can update their own comments" ON workflow_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for workflow_attachments
CREATE POLICY "Users can view attachments for accessible submissions" ON workflow_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_attachments.submission_id
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

CREATE POLICY "Users can upload attachments for accessible submissions" ON workflow_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_submissions ws
      JOIN projects p ON p.id = ws.project_id
      WHERE ws.id = workflow_attachments.submission_id
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

-- Create functions for workflow management
CREATE OR REPLACE FUNCTION update_workflow_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_workflow_submissions_updated_at
  BEFORE UPDATE ON workflow_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_submission_timestamp();

CREATE TRIGGER update_workflow_comments_updated_at
  BEFORE UPDATE ON workflow_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_submission_timestamp();

-- Function to approve/reject workflow submissions
CREATE OR REPLACE FUNCTION process_workflow_approval(
  p_submission_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL,
  p_review_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  approval_id UUID;
  submission_record RECORD;
BEGIN
  -- Validate action
  IF p_action NOT IN ('approve', 'reject', 'request_changes') THEN
    RAISE EXCEPTION 'Invalid action. Must be approve, reject, or request_changes';
  END IF;

  -- Get submission details
  SELECT * INTO submission_record
  FROM workflow_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Create approval record
  INSERT INTO workflow_approvals (
    submission_id,
    approver_id,
    action,
    notes,
    review_priority
  ) VALUES (
    p_submission_id,
    auth.uid(),
    p_action,
    p_notes,
    p_review_priority
  ) RETURNING id INTO approval_id;

  -- Update submission status
  UPDATE workflow_submissions
  SET 
    status = CASE 
      WHEN p_action = 'approve' THEN 'approved'
      WHEN p_action = 'reject' THEN 'rejected'
      WHEN p_action = 'request_changes' THEN 'needs_changes'
    END,
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Create notification for submitter
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    submission_record.submitter_id,
    'workflow_' || p_action,
    CASE 
      WHEN p_action = 'approve' THEN 'Submission Approved'
      WHEN p_action = 'reject' THEN 'Submission Rejected'
      WHEN p_action = 'request_changes' THEN 'Changes Requested'
    END,
    CASE 
      WHEN p_action = 'approve' THEN 'Your submission "' || submission_record.title || '" has been approved'
      WHEN p_action = 'reject' THEN 'Your submission "' || submission_record.title || '" has been rejected'
      WHEN p_action = 'request_changes' THEN 'Changes requested for your submission "' || submission_record.title || '"'
    END,
    jsonb_build_object(
      'submission_id', p_submission_id,
      'project_id', submission_record.project_id,
      'approval_id', approval_id,
      'notes', p_notes
    );

  RETURN approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_stats(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'pending_approvals', (
      SELECT COUNT(*) 
      FROM workflow_submissions 
      WHERE project_id = p_project_id AND status = 'pending_approval'
    ),
    'pending_requests', (
      SELECT COUNT(*) 
      FROM workflow_submissions 
      WHERE project_id = p_project_id AND status = 'pending_request'
    ),
    'approved', (
      SELECT COUNT(*) 
      FROM workflow_submissions 
      WHERE project_id = p_project_id AND status = 'approved'
    ),
    'needs_changes', (
      SELECT COUNT(*) 
      FROM workflow_submissions 
      WHERE project_id = p_project_id AND status IN ('needs_changes', 'rejected')
    ),
    'total_submissions', (
      SELECT COUNT(*) 
      FROM workflow_submissions 
      WHERE project_id = p_project_id
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;