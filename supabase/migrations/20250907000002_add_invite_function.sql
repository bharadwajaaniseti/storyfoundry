-- Add RPC function for inviting collaborators
-- This function should be added to the collaboration system migration

CREATE OR REPLACE FUNCTION invite_collaborator(
  p_project_id UUID,
  p_invitee_id UUID,
  p_role TEXT,
  p_royalty_split NUMERIC DEFAULT NULL,
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
  project_owner_id UUID;
BEGIN
  -- Check if current user is project owner
  SELECT owner_id INTO project_owner_id 
  FROM projects 
  WHERE id = p_project_id;
  
  IF project_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only project owner can send invitations';
  END IF;
  
  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM collaboration_invitations 
    WHERE project_id = p_project_id 
    AND invitee_id = p_invitee_id 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Invitation already pending for this user';
  END IF;
  
  -- Check if user is already a collaborator
  IF EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_id = p_project_id 
    AND user_id = p_invitee_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is already a collaborator on this project';
  END IF;
  
  -- Create invitation
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
  
  -- Create notification for invitee
  INSERT INTO notifications (user_id, type, title, message, metadata)
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
    'collaborator_added',
    'Sent collaboration invitation to ' || (SELECT display_name FROM profiles WHERE id = p_invitee_id)
  );
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
