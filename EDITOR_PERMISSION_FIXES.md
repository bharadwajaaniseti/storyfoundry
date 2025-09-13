# Editor Permission Troubleshooting Guide

## Issue: Editor Role Shows "Read-Only" Instead of Editable Content

### Quick Fix Steps

1. **Check Current Permission State**
   ```javascript
   // In browser console on project page
   const debugger = new EditorPermissionDebugger()
   await debugger.runFullDebug()
   ```

2. **Run Database Migration** (if not done yet)
   ```sql
   -- In your database console
   UPDATE project_collaborators 
   SET permissions = jsonb_build_object(
     'read', true,
     'write', true,
     'comment', true,
     'invite', false
   )
   WHERE role = 'editor' 
   AND (permissions->>'write' != 'true' OR permissions->>'write' IS NULL);
   ```

3. **Verify Fix**
   ```sql
   -- Check editor permissions
   SELECT 
     id, role, 
     permissions->>'write' as can_write,
     permissions
   FROM project_collaborators 
   WHERE role = 'editor';
   ```

### Root Cause Analysis

The issue was caused by:

1. **Permission Structure Mismatch**: Database functions were using old permission structure (`admin`, `manage_roles`) while UI expected new structure (`read`, `write`, `comment`, `invite`)

2. **String vs Boolean Permissions**: Database stored permission values as strings (`"true"`) instead of booleans (`true`), causing UI boolean checks to fail

3. **Missing Write Permissions**: Editor role wasn't getting proper write permissions during invitation acceptance

### Testing Steps

1. **Load Testing Scripts**
   ```html
   <!-- In browser console -->
   <script src="/scripts/collaboration-tester.js"></script>
   <script src="/scripts/debug-editor-permissions.js"></script>
   <script src="/scripts/check-editor-permissions.js"></script>
   ```

2. **Test Editor Permissions**
   ```javascript
   // Create test editor invitation
   const tester = new CollaborationTester()
   await tester.init()
   tester.testProject = 'your-project-id'
   await tester.testInvitations() // Invite editor@test.com

   // Debug editor permissions
   const debugger = new EditorPermissionDebugger()
   await debugger.runFullDebug()
   ```

3. **Verify UI Components**
   - Editor should see editable text area, not "Read-Only View"
   - Save button should be visible for editors
   - Permission indicator should show write permission ✓

### Database Fixes Applied

1. **Updated Database Functions**
   - Fixed `merge_role_permissions` to use correct permission structure
   - Updated invitation acceptance to grant proper editor permissions

2. **Added Permission Normalization**
   - Enhanced `getCollaboratorPermissions` to handle string permissions
   - Added `parsePermissionValue` helper for robust permission parsing

3. **Created Migration**
   - `20250115000004_fix_editor_permissions.sql` updates existing collaborators

### Manual Fix Commands

If automatic fixes don't work:

```sql
-- Reset all editor permissions
UPDATE project_collaborators 
SET permissions = '{
  "read": true,
  "write": true,
  "comment": true,
  "invite": false
}'::jsonb
WHERE role = 'editor';

-- Verify all roles have correct permissions
SELECT 
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN permissions->>'write' = 'true' THEN 1 END) as with_write
FROM project_collaborators 
GROUP BY role;
```

### Testing Validation

After fixes, verify:

1. **Database Level**
   ```sql
   SELECT id, role, permissions FROM project_collaborators WHERE role = 'editor';
   ```

2. **API Level**
   ```javascript
   // Test API response
   const response = await fetch('/api/collaborations/collaborators?project_id=PROJECT_ID')
   const data = await response.json()
   console.log(data.collaborators.find(c => c.role === 'editor'))
   ```

3. **UI Level**
   - Navigate to project as editor
   - Should see editable interface, not read-only
   - Permission indicator should show write access

### Prevention

To prevent similar issues:

1. **Consistent Permission Structure**: Always use `{read, write, comment, invite}` structure
2. **Boolean Values**: Store permissions as proper JSON booleans, not strings
3. **Migration Testing**: Test database migrations in development first
4. **Permission Validation**: Add validation to ensure permissions are properly formatted

### Emergency Rollback

If needed, revert to role-based permissions:

```sql
-- Clear custom permissions, fall back to role defaults
UPDATE project_collaborators 
SET permissions = NULL
WHERE role = 'editor';
```

The system will then use `DEFAULT_ROLE_PERMISSIONS` which correctly grants write access to editors.