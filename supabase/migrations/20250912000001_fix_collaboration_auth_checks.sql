-- Fix authentication checks in collaboration invitation functions

-- Update the accept_collaboration_invitation function with proper auth check
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
  merged_permissions JSONB;
  all_roles TEXT[];
BEGIN
  -- Get invitation details with auth check
  SELECT * INTO invitation_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id 
    AND invitee_id = auth.uid() 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, already processed, or you are not authorized to accept it';
  END IF;
  
  -- Combine primary role with secondary roles
  all_roles := ARRAY[invitation_record.role] || COALESCE(invitation_record.secondary_roles, '{}');
  
  -- Calculate merged permissions from all roles
  merged_permissions := merge_role_permissions(all_roles);
  
  -- Create collaborator record
  INSERT INTO project_collaborators (
    project_id,
    user_id,
    role,
    secondary_roles,
    royalty_split,
    permissions,
    status,
    joined_at
  ) VALUES (
    invitation_record.project_id,
    invitation_record.invitee_id,
    invitation_record.role,
    invitation_record.secondary_roles,
    invitation_record.royalty_split,
    merged_permissions,
    'active',
    NOW()
  );
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Log activity
  INSERT INTO project_activity (
    project_id,
    user_id,
    activity_type,
    description
  ) VALUES (
    invitation_record.project_id,
    invitation_record.invitee_id,
    'collaborator_added',
    'Accepted collaboration invitation'
  );
  
  -- Create notification for project owner
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.owner_id,
    'collaboration_accepted',
    'Collaboration Accepted',
    prof.display_name || ' accepted your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', invitation_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = invitation_record.project_id AND prof.id = invitation_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the decline_collaboration_invitation function with proper auth check
CREATE OR REPLACE FUNCTION decline_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details with auth check
  SELECT * INTO invitation_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id 
    AND invitee_id = auth.uid() 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, already processed, or you are not authorized to decline it';
  END IF;
  
  -- Update invitation status
  UPDATE collaboration_invitations 
  SET status = 'declined', updated_at = NOW()
  WHERE id = invitation_id;
  
  -- Create notification for project owner
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.owner_id,
    'collaboration_declined',
    'Collaboration Declined',
    prof.display_name || ' declined your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', invitation_record.invitee_id)
  FROM projects p, profiles prof
  WHERE p.id = invitation_record.project_id AND prof.id = invitation_record.invitee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;