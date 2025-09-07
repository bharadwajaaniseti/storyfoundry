-- Migration to support multiple roles per collaborator
-- Add support for multiple roles while maintaining backward compatibility

-- Add secondary_roles column to store additional roles
ALTER TABLE public.project_collaborators 
ADD COLUMN secondary_roles TEXT[] DEFAULT '{}';

-- Add constraint to validate secondary roles
ALTER TABLE public.project_collaborators 
ADD CONSTRAINT valid_secondary_roles CHECK (
  secondary_roles <@ ARRAY['coauthor', 'editor', 'translator', 'producer', 'reviewer']
);

-- Create index for secondary roles array queries
CREATE INDEX idx_project_collaborators_secondary_roles ON public.project_collaborators USING GIN(secondary_roles);

-- Update the collaboration_invitations table to support multiple roles
ALTER TABLE public.collaboration_invitations 
ADD COLUMN secondary_roles TEXT[] DEFAULT '{}';

-- Add constraint for invitation secondary roles
ALTER TABLE public.collaboration_invitations 
ADD CONSTRAINT valid_invitation_secondary_roles CHECK (
  secondary_roles <@ ARRAY['coauthor', 'editor', 'translator', 'producer', 'reviewer']
);

-- Function to get all roles for a collaborator (primary + secondary)
CREATE OR REPLACE FUNCTION get_collaborator_all_roles(collaborator_row project_collaborators)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY[collaborator_row.role] || COALESCE(collaborator_row.secondary_roles, '{}');
END;
$$ LANGUAGE plpgsql;

-- Function to check if collaborator has specific role
CREATE OR REPLACE FUNCTION collaborator_has_role(collaborator_row project_collaborators, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_role = collaborator_row.role OR check_role = ANY(COALESCE(collaborator_row.secondary_roles, '{}'));
END;
$$ LANGUAGE plpgsql;

-- Function to merge permissions from multiple roles
CREATE OR REPLACE FUNCTION merge_role_permissions(roles TEXT[])
RETURNS JSONB AS $$
DECLARE
  role_name TEXT;
  merged_permissions JSONB := '{"read": false, "write": false, "comment": false, "invite": false}';
  role_permissions JSONB;
BEGIN
  FOREACH role_name IN ARRAY roles
  LOOP
    CASE role_name
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
      ELSE
        role_permissions := '{"read": false, "write": false, "comment": false, "invite": false}';
    END CASE;
    
    -- Merge permissions (OR operation - if any role has permission, user gets it)
    merged_permissions := jsonb_build_object(
      'read', (merged_permissions->>'read')::boolean OR (role_permissions->>'read')::boolean,
      'write', (merged_permissions->>'write')::boolean OR (role_permissions->>'write')::boolean,
      'comment', (merged_permissions->>'comment')::boolean OR (role_permissions->>'comment')::boolean,
      'invite', (merged_permissions->>'invite')::boolean OR (role_permissions->>'invite')::boolean
    );
  END LOOP;
  
  RETURN merged_permissions;
END;
$$ LANGUAGE plpgsql;

-- Update the accept_collaboration_invitation function to support multiple roles
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  invitation_record RECORD;
  merged_permissions JSONB;
  all_roles TEXT[];
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM collaboration_invitations 
  WHERE id = invitation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
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
END;
$$ LANGUAGE plpgsql;

-- Add helpful views for multiple roles
CREATE OR REPLACE VIEW collaborator_roles_view AS
SELECT 
  pc.*,
  get_collaborator_all_roles(pc) as all_roles,
  merge_role_permissions(get_collaborator_all_roles(pc)) as computed_permissions
FROM project_collaborators pc;

-- Add comments for documentation
COMMENT ON COLUMN project_collaborators.secondary_roles IS 'Additional roles beyond the primary role';
COMMENT ON FUNCTION get_collaborator_all_roles IS 'Returns array of all roles (primary + secondary) for a collaborator';
COMMENT ON FUNCTION collaborator_has_role IS 'Checks if collaborator has a specific role (primary or secondary)';
COMMENT ON FUNCTION merge_role_permissions IS 'Merges permissions from multiple roles using OR logic';
