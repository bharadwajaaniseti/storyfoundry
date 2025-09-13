-- Add new activity types for workflow events
ALTER TABLE public.project_activity 
DROP CONSTRAINT IF EXISTS project_activity_activity_type_check;

ALTER TABLE public.project_activity 
ADD CONSTRAINT project_activity_activity_type_check CHECK (
  activity_type IN (
    'project_created','project_updated','collaborator_added','collaborator_removed',
    'chapter_created','chapter_updated','chapter_deleted','comment_added',
    'message_sent','file_uploaded','permission_changed',
    'workflow_submission_created','workflow_submission_updated',
    'workflow_approval_created','workflow_comment_added','workflow_attachment_uploaded'
  )
);

-- Create trigger function for workflow activity logging
CREATE OR REPLACE FUNCTION log_workflow_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log submission activities
  IF TG_TABLE_NAME = 'workflow_submissions' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO project_activity (project_id, user_id, activity_type, description, metadata)
      VALUES (
        NEW.project_id,
        NEW.submitter_id,
        'workflow_submission_created',
        format('submitted "%s" for %s review', NEW.title, NEW.submission_type),
        jsonb_build_object(
          'submission_id', NEW.id,
          'submission_type', NEW.submission_type,
          'priority', NEW.priority,
          'category', NEW.category
        )
      );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      INSERT INTO project_activity (project_id, user_id, activity_type, description, metadata)
      VALUES (
        NEW.project_id,
        auth.uid(),
        'workflow_submission_updated',
        format('updated submission "%s" status to %s', NEW.title, NEW.status),
        jsonb_build_object(
          'submission_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'submission_type', NEW.submission_type
        )
      );
    END IF;
  END IF;

  -- Log approval activities
  IF TG_TABLE_NAME = 'workflow_approvals' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO project_activity (project_id, user_id, activity_type, description, metadata)
      SELECT 
        ws.project_id,
        NEW.reviewer_id,
        'workflow_approval_created',
        format('%s submission "%s"', NEW.status, ws.title),
        jsonb_build_object(
          'submission_id', NEW.submission_id,
          'approval_id', NEW.id,
          'status', NEW.status,
          'submission_type', ws.submission_type
        )
      FROM workflow_submissions ws
      WHERE ws.id = NEW.submission_id;
    END IF;
  END IF;

  -- Log comment activities
  IF TG_TABLE_NAME = 'workflow_comments' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO project_activity (project_id, user_id, activity_type, description, metadata)
      SELECT 
        ws.project_id,
        NEW.author_id,
        'workflow_comment_added',
        format('commented on submission "%s"', ws.title),
        jsonb_build_object(
          'submission_id', NEW.submission_id,
          'comment_id', NEW.id,
          'comment_type', NEW.comment_type,
          'is_reply', NEW.parent_comment_id IS NOT NULL
        )
      FROM workflow_submissions ws
      WHERE ws.id = NEW.submission_id;
    END IF;
  END IF;

  -- Log attachment activities  
  IF TG_TABLE_NAME = 'workflow_attachments' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO project_activity (project_id, user_id, activity_type, description, metadata)
      SELECT 
        ws.project_id,
        NEW.uploaded_by,
        'workflow_attachment_uploaded',
        format('uploaded file "%s" to submission "%s"', NEW.file_name, ws.title),
        jsonb_build_object(
          'submission_id', NEW.submission_id,
          'attachment_id', NEW.id,
          'file_name', NEW.file_name,
          'file_type', NEW.file_type,
          'file_size', NEW.file_size
        )
      FROM workflow_submissions ws
      WHERE ws.id = NEW.submission_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for workflow activity logging
DO $$
BEGIN
  -- Only create triggers if the workflow tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_submissions') THEN
    DROP TRIGGER IF EXISTS trigger_log_workflow_submission_activity ON workflow_submissions;
    CREATE TRIGGER trigger_log_workflow_submission_activity
      AFTER INSERT OR UPDATE ON workflow_submissions
      FOR EACH ROW EXECUTE FUNCTION log_workflow_activity();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_approvals') THEN
    DROP TRIGGER IF EXISTS trigger_log_workflow_approval_activity ON workflow_approvals;
    CREATE TRIGGER trigger_log_workflow_approval_activity
      AFTER INSERT ON workflow_approvals
      FOR EACH ROW EXECUTE FUNCTION log_workflow_activity();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_comments') THEN
    DROP TRIGGER IF EXISTS trigger_log_workflow_comment_activity ON workflow_comments;
    CREATE TRIGGER trigger_log_workflow_comment_activity
      AFTER INSERT ON workflow_comments
      FOR EACH ROW EXECUTE FUNCTION log_workflow_activity();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_attachments') THEN
    DROP TRIGGER IF EXISTS trigger_log_workflow_attachment_activity ON workflow_attachments;
    CREATE TRIGGER trigger_log_workflow_attachment_activity
      AFTER INSERT ON workflow_attachments
      FOR EACH ROW EXECUTE FUNCTION log_workflow_activity();
  END IF;
END $$;