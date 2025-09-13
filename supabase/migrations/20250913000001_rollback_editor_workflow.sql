-- Rollback script for editor approval workflow
-- Run this before reapplying the main migration

-- Drop views
DROP VIEW IF EXISTS editor_changes_with_details;

-- Drop triggers
DROP TRIGGER IF EXISTS update_pending_editor_changes_updated_at ON pending_editor_changes;

-- Drop functions
DROP FUNCTION IF EXISTS update_pending_changes_timestamp();
DROP FUNCTION IF EXISTS get_pending_editor_changes(UUID);
DROP FUNCTION IF EXISTS process_editor_change_approval(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS submit_editor_change_for_approval(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT);

-- Drop policies
DROP POLICY IF EXISTS "Project owners can create approval decisions" ON editor_approval_decisions;
DROP POLICY IF EXISTS "Users can view approval decisions for accessible projects" ON editor_approval_decisions;
DROP POLICY IF EXISTS "Editors can update their own pending changes" ON pending_editor_changes;
DROP POLICY IF EXISTS "Editors can create pending changes for projects they collaborate on" ON pending_editor_changes;
DROP POLICY IF EXISTS "Users can view pending changes for projects they have access to" ON pending_editor_changes;

-- Drop indexes
DROP INDEX IF EXISTS idx_editor_approval_decisions_owner_id;
DROP INDEX IF EXISTS idx_editor_approval_decisions_pending_change_id;
DROP INDEX IF EXISTS idx_pending_editor_changes_created_at;
DROP INDEX IF EXISTS idx_pending_editor_changes_status;
DROP INDEX IF EXISTS idx_pending_editor_changes_editor_id;
DROP INDEX IF EXISTS idx_pending_editor_changes_project_id;

-- Drop tables
DROP TABLE IF EXISTS editor_approval_decisions;
DROP TABLE IF EXISTS pending_editor_changes;