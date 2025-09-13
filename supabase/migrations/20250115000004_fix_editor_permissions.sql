-- Fix editor role permissions for existing collaborators
-- This migration ensures editors have write permissions

-- Update existing editor collaborators to have correct permissions
UPDATE project_collaborators 
SET permissions = '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
WHERE role = 'editor' 
  AND (permissions IS NULL OR (permissions->>'write')::boolean = false);

-- Update existing coauthor collaborators to have correct permissions  
UPDATE project_collaborators 
SET permissions = '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
WHERE role = 'coauthor' 
  AND (permissions IS NULL OR (permissions->>'write')::boolean = false);

-- Update existing translator collaborators to have correct permissions
UPDATE project_collaborators 
SET permissions = '{"read": true, "write": true, "comment": true, "invite": false}'::jsonb
WHERE role = 'translator' 
  AND (permissions IS NULL OR (permissions->>'write')::boolean = false);

-- Update existing producer collaborators to have correct permissions
UPDATE project_collaborators 
SET permissions = '{"read": true, "write": false, "comment": true, "invite": true}'::jsonb
WHERE role = 'producer' 
  AND (permissions IS NULL OR (permissions->>'invite')::boolean = false);

-- Update existing reviewer collaborators to have correct permissions
UPDATE project_collaborators 
SET permissions = '{"read": true, "write": false, "comment": true, "invite": false}'::jsonb
WHERE role = 'reviewer' 
  AND (permissions IS NULL OR NOT permissions ? 'comment');

-- Log the update
INSERT INTO project_activity (project_id, user_id, activity_type, description)
SELECT 
  pc.project_id,
  p.owner_id,
  'system_update',
  'Updated collaborator permissions for role-based access'
FROM project_collaborators pc
JOIN projects p ON pc.project_id = p.id
WHERE pc.role IN ('editor', 'coauthor', 'translator', 'producer', 'reviewer')
GROUP BY pc.project_id, p.owner_id;