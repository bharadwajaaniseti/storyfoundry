# Quick Collaboration Fixes & Testing

## 🚨 Issues Fixed:

### 1. ✅ Decline Notification Fixed
- Added proper notification creation for declined invitations
- Both database function and manual fallback now create notifications

### 2. ✅ Editor Permission Fixed  
- Fixed permission structure in database functions
- Created migration to update existing editor collaborators
- Editors now have `write: true` permission

## 🧪 Quick Test Script

Run this in your browser console to test the fixed functionality:

```javascript
// Quick collaboration test
async function quickCollabTest(projectId) {
  console.log('🧪 Testing collaboration fixes...')
  
  // Test 1: Check current user permissions
  const permResponse = await fetch(`/api/collaborations/collaborators?project_id=${projectId}`)
  const permData = await permResponse.json()
  console.log('✅ Current collaborators:', permData.collaborators)
  
  // Test 2: Send a test message (tests write permissions)
  const msgResponse = await fetch('/api/collaborations/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      content: '🧪 Testing editor write permissions',
      message_type: 'general'
    })
  })
  
  if (msgResponse.ok) {
    console.log('✅ Editor can send messages (write permission working)')
  } else {
    console.log('❌ Message failed:', await msgResponse.text())
  }
  
  // Test 3: Check permissions object
  const currentUser = permData.collaborators.find(c => c.user_id === (await getCurrentUserId()))
  if (currentUser) {
    console.log('📋 Your permissions:', currentUser.permissions)
    console.log('✏️ Can write:', currentUser.permissions?.write === true ? '✅' : '❌')
    console.log('👁️ Can read:', currentUser.permissions?.read === true ? '✅' : '❌')
    console.log('💬 Can comment:', currentUser.permissions?.comment === true ? '✅' : '❌')
  }
}

async function getCurrentUserId() {
  const response = await fetch('/api/auth/user')
  const data = await response.json()
  return data?.id
}

// Usage: quickCollabTest('your-project-id-here')
```

## 🔄 Manual Testing Steps:

### Step 1: Test Decline Notification
1. **Owner account**: Send invitation to another user
2. **Invited user**: Login and decline the invitation
3. **Owner account**: Check notification bell - should see decline notification

### Step 2: Test Editor Write Permissions  
1. **Owner account**: Invite user as "Editor" 
2. **Editor account**: Accept invitation
3. **Editor account**: Open project - should see editable content (not "Read-Only")
4. **Editor account**: Try editing content - should work

### Step 3: Test Real-time Features
1. **Multiple accounts**: Open same project
2. **Any collaborator**: Send messages in Messages tab
3. **All accounts**: Should see messages appear instantly

## 🗄️ Database Check

Run these queries to verify the fixes:

```sql
-- Check editor permissions are correct
SELECT role, permissions, user_id 
FROM project_collaborators 
WHERE role = 'editor' 
AND project_id = 'your-project-id';

-- Should show: {"read": true, "write": true, "comment": true, "invite": false}

-- Check recent notifications include declines
SELECT type, title, message, created_at 
FROM notifications 
WHERE type = 'collaboration_declined' 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🎯 Expected Results:

### ✅ After Fixes:
- **Editors**: Can edit content (no more "Read-Only")
- **Decline notifications**: Owner gets notified when invitations are declined  
- **Real-time messaging**: Works for all collaborator types
- **Permission gates**: Show/hide features correctly based on role

### 🚨 If Still Issues:
1. **Run the database migration**: `20250115000004_fix_editor_permissions.sql`
2. **Clear browser cache**: Hard refresh (Ctrl+F5)
3. **Check browser console**: Look for permission-related errors
4. **Verify database**: Use the SQL queries above

The collaboration system should now work correctly for all testing scenarios! 🎉