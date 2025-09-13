-- Create user notification preferences table (idempotent)
DO $$
BEGIN
  -- Create table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preferences JSONB DEFAULT '{
      "workflow_submissions": true,
      "workflow_approvals": true,
      "workflow_comments": true,
      "workflow_attachments": true,
      "collaboration_invites": true,
      "collaboration_messages": true,
      "project_updates": true,
      "email_notifications": true,
      "push_notifications": true
    }'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
END $$;

-- Create RLS policies (with existence checks)
DO $$
BEGIN
  -- Check if view policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_notification_preferences' 
    AND policyname = 'Users can view own notification preferences'
  ) THEN
    CREATE POLICY "Users can view own notification preferences" ON public.user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Check if update policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_notification_preferences' 
    AND policyname = 'Users can update own notification preferences'
  ) THEN
    CREATE POLICY "Users can update own notification preferences" ON public.user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add new notification types (with existence check)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

  -- Add updated constraint with new workflow notification types
  ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'profile_access_request', 'profile_access_granted', 'profile_access_denied', 
      'follow', 'project_comment', 'collaboration_invite', 'collaboration_accepted',
      'collaboration_declined', 'collaboration_request', 'project_activity',
      'message_received', 'role_changed', 'project_shared',
      'workflow_submission_created', 'workflow_submission_approved', 'workflow_submission_rejected',
      'workflow_comment_added', 'workflow_attachment_uploaded', 'workflow_status_changed'
    )
  );
END $$;

-- Create function to send workflow notifications
CREATE OR REPLACE FUNCTION send_workflow_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
  recipient_ids UUID[];
  recipient_id UUID;
  project_title TEXT;
  submitter_name TEXT;
  reviewer_name TEXT;
BEGIN
  -- Get project title
  SELECT title INTO project_title 
  FROM projects 
  WHERE id = (
    CASE 
      WHEN TG_TABLE_NAME = 'workflow_submissions' THEN NEW.project_id
      WHEN TG_TABLE_NAME = 'workflow_approvals' THEN (
        SELECT project_id FROM workflow_submissions WHERE id = NEW.submission_id
      )
      WHEN TG_TABLE_NAME = 'workflow_comments' THEN (
        SELECT project_id FROM workflow_submissions WHERE id = NEW.submission_id
      )
    END
  );

  -- Handle different notification scenarios
  IF TG_TABLE_NAME = 'workflow_submissions' AND TG_OP = 'INSERT' THEN
    -- New submission notification for project collaborators with review permissions
    SELECT display_name INTO submitter_name FROM profiles WHERE id = NEW.submitter_id;
    
    notification_type := 'workflow_submission_created';
    notification_title := format('New %s submission in "%s"', NEW.submission_type, project_title);
    notification_message := format('%s submitted "%s" for review', submitter_name, NEW.title);
    
    -- Get collaborators who can review this type of submission
    SELECT ARRAY_AGG(DISTINCT user_id) INTO recipient_ids
    FROM project_collaborators pc
    WHERE pc.project_id = NEW.project_id 
      AND pc.status = 'active'
      AND pc.user_id != NEW.submitter_id
      AND (
        pc.role IN ('editor', 'reviewer') OR
        (NEW.target_role IS NOT NULL AND pc.role = NEW.target_role) OR
        EXISTS (SELECT 1 FROM projects p WHERE p.id = NEW.project_id AND p.owner_id = pc.user_id)
      );

  ELSIF TG_TABLE_NAME = 'workflow_approvals' AND TG_OP = 'INSERT' THEN
    -- Approval/rejection notification for submitter
    SELECT display_name INTO reviewer_name FROM profiles WHERE id = NEW.reviewer_id;
    
    notification_type := CASE 
      WHEN NEW.status = 'approved' THEN 'workflow_submission_approved'
      WHEN NEW.status = 'rejected' THEN 'workflow_submission_rejected'
      ELSE 'workflow_status_changed'
    END;
    
    notification_title := format('Submission %s in "%s"', NEW.status, project_title);
    notification_message := format('%s %s your submission', reviewer_name, NEW.status);
    
    -- Notify the submitter
    SELECT ARRAY[submitter_id] INTO recipient_ids
    FROM workflow_submissions 
    WHERE id = NEW.submission_id;

  ELSIF TG_TABLE_NAME = 'workflow_comments' AND TG_OP = 'INSERT' THEN
    -- Comment notification for submission participants
    SELECT display_name INTO submitter_name FROM profiles WHERE id = NEW.author_id;
    
    notification_type := 'workflow_comment_added';
    notification_title := format('New comment in "%s"', project_title);
    notification_message := format('%s commented on a submission', submitter_name);
    
    -- Get submission participants (submitter + reviewers + project owner)
    WITH submission_info AS (
      SELECT submitter_id, project_id FROM workflow_submissions WHERE id = NEW.submission_id
    ),
    reviewers AS (
      SELECT DISTINCT reviewer_id as user_id 
      FROM workflow_approvals 
      WHERE submission_id = NEW.submission_id
    ),
    project_owner AS (
      SELECT owner_id as user_id 
      FROM projects p, submission_info si 
      WHERE p.id = si.project_id
    )
    SELECT ARRAY_AGG(DISTINCT user_id) INTO recipient_ids
    FROM (
      SELECT submitter_id as user_id FROM submission_info
      UNION 
      SELECT user_id FROM reviewers
      UNION
      SELECT user_id FROM project_owner
    ) all_participants
    WHERE user_id != NEW.author_id;

  ELSIF TG_TABLE_NAME = 'workflow_attachments' AND TG_OP = 'INSERT' THEN
    -- Attachment notification for submission participants
    SELECT display_name INTO submitter_name FROM profiles WHERE id = NEW.uploader_id;
    
    notification_type := 'workflow_attachment_uploaded';
    notification_title := format('New attachment in "%s"', project_title);
    notification_message := format('%s uploaded an attachment: %s', submitter_name, NEW.file_name);
    
    -- Get submission participants (submitter + reviewers + project owner)
    WITH submission_info AS (
      SELECT submitter_id, project_id FROM workflow_submissions WHERE id = NEW.submission_id
    ),
    reviewers AS (
      SELECT DISTINCT reviewer_id as user_id 
      FROM workflow_approvals 
      WHERE submission_id = NEW.submission_id
    ),
    project_owner AS (
      SELECT owner_id as user_id 
      FROM projects p, submission_info si 
      WHERE p.id = si.project_id
    )
    SELECT ARRAY_AGG(DISTINCT user_id) INTO recipient_ids
    FROM (
      SELECT submitter_id as user_id FROM submission_info
      UNION 
      SELECT user_id FROM reviewers
      UNION
      SELECT user_id FROM project_owner
    ) all_participants
    WHERE user_id != NEW.uploader_id;

  END IF;

  -- Send notifications to recipients (check preferences)
  IF recipient_ids IS NOT NULL THEN
    FOREACH recipient_id IN ARRAY recipient_ids
    LOOP
      -- Check user preferences before sending notification
      IF should_send_notification(recipient_id, notification_type) THEN
        INSERT INTO notifications (user_id, type, title, message, data, metadata)
        VALUES (
          recipient_id,
          notification_type,
          notification_title,
          notification_message,
          CASE 
            WHEN TG_TABLE_NAME = 'workflow_submissions' THEN jsonb_build_object(
              'submission_id', NEW.id,
              'project_id', NEW.project_id,
              'submission_type', NEW.submission_type
            )
            WHEN TG_TABLE_NAME = 'workflow_approvals' THEN jsonb_build_object(
              'submission_id', NEW.submission_id,
              'approval_id', NEW.id,
              'status', NEW.status
            )
            WHEN TG_TABLE_NAME = 'workflow_comments' THEN jsonb_build_object(
              'submission_id', NEW.submission_id,
              'comment_id', NEW.id,
              'comment_type', NEW.comment_type
            )
          END,
          jsonb_build_object(
            'project_id', COALESCE(NEW.project_id, (SELECT project_id FROM workflow_submissions WHERE id = NEW.submission_id)),
            'project_title', project_title
          )
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if notification should be sent based on user preferences
CREATE OR REPLACE FUNCTION should_send_notification(user_id UUID, notification_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_preferences JSONB;
  preference_key TEXT;
BEGIN
  -- Get user preferences
  SELECT preferences INTO user_preferences
  FROM user_notification_preferences
  WHERE user_notification_preferences.user_id = should_send_notification.user_id;

  -- If no preferences found, default to true
  IF user_preferences IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Map notification types to preference keys
  preference_key := CASE 
    WHEN notification_type LIKE 'workflow_submission%' THEN 'workflow_submissions'
    WHEN notification_type LIKE 'workflow_approval%' THEN 'workflow_approvals'
    WHEN notification_type = 'workflow_comment_added' THEN 'workflow_comments'
    WHEN notification_type = 'workflow_attachment_uploaded' THEN 'workflow_attachments'
    WHEN notification_type LIKE 'collaboration%' THEN 'collaboration_invites'
    WHEN notification_type = 'message_received' THEN 'collaboration_messages'
    ELSE 'project_updates'
  END;

  -- Return preference value (default to true if not set)
  RETURN COALESCE((user_preferences ->> preference_key)::boolean, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for workflow notifications
DO $$
BEGIN
  -- Only create triggers if the workflow tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_submissions') THEN
    DROP TRIGGER IF EXISTS trigger_workflow_submission_notification ON workflow_submissions;
    CREATE TRIGGER trigger_workflow_submission_notification
      AFTER INSERT ON workflow_submissions
      FOR EACH ROW EXECUTE FUNCTION send_workflow_notification();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_approvals') THEN
    DROP TRIGGER IF EXISTS trigger_workflow_approval_notification ON workflow_approvals;
    CREATE TRIGGER trigger_workflow_approval_notification
      AFTER INSERT ON workflow_approvals
      FOR EACH ROW EXECUTE FUNCTION send_workflow_notification();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_comments') THEN
    DROP TRIGGER IF EXISTS trigger_workflow_comment_notification ON workflow_comments;
    CREATE TRIGGER trigger_workflow_comment_notification
      AFTER INSERT ON workflow_comments
      FOR EACH ROW EXECUTE FUNCTION send_workflow_notification();
  END IF;

  -- Add trigger for workflow attachments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_attachments') THEN
    DROP TRIGGER IF EXISTS trigger_workflow_attachment_notification ON workflow_attachments;
    CREATE TRIGGER trigger_workflow_attachment_notification
      AFTER INSERT ON workflow_attachments
      FOR EACH ROW EXECUTE FUNCTION send_workflow_notification();
  END IF;
END $$;