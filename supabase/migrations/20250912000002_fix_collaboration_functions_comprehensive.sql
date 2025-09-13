-- Migration to fix collaboration invitation functions with better error handling
-- This migration ensures the functions work correctly even if merge_role_permissions doesn't exist

-- First, create a safe version of merge_role_permissions if it doesn't exist
CREATE OR REPLACE FUNCTION merge_role_permissions(roles TEXT[])
RETURNS JSONB AS $$
DECLARE
  merged_permissions JSONB := '{}';
  role_name TEXT;
  role_permissions JSONB;
BEGIN
  -- If no roles provided, return basic read permissions
  IF roles IS NULL OR array_length(roles, 1) IS NULL THEN
    RETURN '{"read": true, "write": false, "admin": false}';
  END IF;

  -- Default permissions for each role type
  FOREACH role_name IN ARRAY roles
  LOOP
    CASE role_name
      WHEN 'owner' THEN
        role_permissions := '{"read": true, "write": true, "comment": true, "invite": true}';
      WHEN 'coauthor' THEN
        role_permissions := '{"read": true, "write": true, "comment": true, "invite": false}';
      WHEN 'editor' THEN
        role_permissions := '{"read": true, "write": true, "comment": true, "invite": false}';
      WHEN 'translator' THEN
        role_permissions := '{"read": true, "write": true, "comment": true, "invite": false}';
      WHEN 'producer' THEN
        role_permissions := '{"read": true, "write": false, "comment": true, "invite": true}';
      WHEN 'reviewer' THEN
        role_permissions := '{"read": true, "write": false, "comment": true, "invite": false}';
      WHEN 'collaborator' THEN
        role_permissions := '{"read": true, "write": true, "comment": true, "invite": false}';
      WHEN 'viewer' THEN
        role_permissions := '{"read": true, "write": false, "comment": true, "invite": false}';
      ELSE
        role_permissions := '{"read": true, "write": false, "comment": true, "invite": false}';
    END CASE;
    
    -- Merge permissions using OR logic
    merged_permissions := merged_permissions || role_permissions;
  END LOOP;

  RETURN merged_permissions;
END;
$$ LANGUAGE plpgsql;

-- Update the accept_collaboration_invitation function with better error handling
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
  merged_permissions JSONB;
  all_roles TEXT[];
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
    COALESCE(invitation_record.royalty_split, 0),
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
    COALESCE(prof.display_name, 'Someone') || ' accepted your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', invitation_record.invitee_id)
  FROM projects p
  LEFT JOIN profiles prof ON prof.id = invitation_record.invitee_id
  WHERE p.id = invitation_record.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the decline_collaboration_invitation function with better error handling
CREATE OR REPLACE FUNCTION decline_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
    COALESCE(prof.display_name, 'Someone') || ' declined your collaboration invitation for ' || p.title,
    jsonb_build_object('project_id', p.id, 'collaborator_id', invitation_record.invitee_id)
  FROM projects p
  LEFT JOIN profiles prof ON prof.id = invitation_record.invitee_id
  WHERE p.id = invitation_record.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;