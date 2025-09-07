-- Fix notification metadata column references in collaboration functions

-- Function to accept collaboration invitation (FIXED)
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO inv_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Add to project_collaborators (FIXED: use default permissions, removed non-existent columns)
  INSERT INTO project_collaborators (
    project_id, 
    user_id, 
    role, 
    permissions, 
    royalty_split,
    joined_at,
    updated_at
  ) VALUES (
    inv_record.project_id,
    inv_record.invitee_id,
    inv_record.role,
    CASE inv_record.role
      WHEN 'coauthor' THEN '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
      WHEN 'editor' THEN '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
      WHEN 'translator' THEN '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
      WHEN 'producer' THEN '{"read": true, "write": false, "comment": true, "invite": true}'::jsonb
      WHEN 'reviewer' THEN '{"read": true, "write": false, "comment": true, "invite": false}'::jsonb
      ELSE '{"read": true, "write": false, "comment": true, "invite": false}'::jsonb
    END,
    inv_record.royalty_split,
    NOW(),
    NOW()
  );
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'accepted', responded_at = NOW()
  WHERE id = invitation_id;
  
  -- Log activity
  INSERT INTO project_activity (project_id, user_id, activity_type, description)
  VALUES (
    inv_record.project_id, 
    inv_record.invitee_id, 
    'collaborator_added',
    'Accepted collaboration invitation as ' || inv_record.role
  );
  
  -- Create notification for project owner (FIXED: metadata -> data)
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.owner_id,
    'collaboration_accepted',
    'Collaboration Accepted',
    prof.display_name || ' accepted your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', inv_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = inv_record.project_id AND prof.id = inv_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline collaboration invitation (FIXED)
CREATE OR REPLACE FUNCTION decline_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO inv_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id AND invitee_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'declined', responded_at = NOW()
  WHERE id = invitation_id;
  
  -- Create notification for project owner (FIXED: metadata -> data)
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.owner_id,
    'collaboration_declined',
    'Collaboration Declined',
    prof.display_name || ' declined your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', inv_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = inv_record.project_id AND prof.id = inv_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send collaboration invitation (FIXED)
CREATE OR REPLACE FUNCTION send_collaboration_invitation(
  p_project_id UUID,
  p_invitee_id UUID,
  p_role TEXT,
  p_royalty_split DECIMAL DEFAULT 0,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
BEGIN
  -- Check if user is project owner
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only project owners can send invitations';
  END IF;
  
  -- Check if user is already a collaborator
  IF EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_id = p_project_id AND user_id = p_invitee_id
  ) THEN
    RAISE EXCEPTION 'User is already a collaborator on this project';
  END IF;
  
  -- Check if there's already a pending invitation
  IF EXISTS (
    SELECT 1 FROM collaboration_invitations 
    WHERE project_id = p_project_id AND invitee_id = p_invitee_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Pending invitation already exists for this user';
  END IF;
  
  -- Insert invitation
  INSERT INTO collaboration_invitations (
    project_id, 
    inviter_id, 
    invitee_id, 
    role, 
    royalty_split, 
    message
  ) VALUES (
    p_project_id, 
    auth.uid(), 
    p_invitee_id, 
    p_role, 
    p_royalty_split, 
    p_message
  ) RETURNING id INTO invitation_id;
  
  -- Create notification for invitee (FIXED: metadata -> data)
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p_invitee_id,
    'collaboration_invite',
    'Collaboration Invitation',
    prof.display_name || ' invited you to collaborate on ' || p.title || ' as ' || p_role,
    jsonb_build_object('project_id', p.id, 'invitation_id', invitation_id, 'inviter_id', auth.uid())
  FROM projects p, profiles prof
  WHERE p.id = p_project_id AND prof.id = auth.uid();
  
  -- Log activity
  INSERT INTO project_activity (project_id, user_id, activity_type, description)
  VALUES (
    p_project_id, 
    auth.uid(), 
    'invitation_sent',
    'Sent collaboration invitation to user as ' || p_role
  );
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
