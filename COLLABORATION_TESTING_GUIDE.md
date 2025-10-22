# StoryFoundry Collaboration System Testing Guide

## 🎯 Overview
This guide provides comprehensive testing procedures for all collaboration functionalities in StoryFoundry.

## 🏗️ Testing Environment Setup

### Prerequisites
1. **Multiple User Accounts**: Create at least 3 test accounts with different roles
2. **Test Project**: Create a test novel project
3. **Database Access**: Ensure you can view database tables for verification
4. **Browser Dev Tools**: For monitoring real-time events

### Test Accounts Setup
```
Account 1: Project Owner (writer1@test.com)
Account 2: Editor (editor1@test.com) 
Account 3: Reviewer (reviewer1@test.com)
Account 4: Translator (translator1@test.com)
```

## 🧪 Core Collaboration Testing

### 1. Invitation System Testing

#### 1.1 Send Invitations
**Test Steps:**
1. Login as Project Owner
2. Navigate to project → Collaborators tab
3. Click "Invite Collaborator"
4. Search for users by email/name
5. Select role (Editor, Reviewer, Translator, etc.)
6. Set royalty split percentage
7. Add invitation message
8. Send invitation

**Expected Results:**
- ✅ Invitation appears in recipient's notifications
- ✅ Email notification sent (if enabled)
- ✅ Invitation visible in recipient's collaboration page
- ✅ Database: `collaboration_invitations` table updated
- ✅ Activity logged in `project_activity`

#### 1.2 Accept Invitations
**Test Steps:**
1. Login as invited user
2. Check notifications bell
3. Navigate to /app/collaborations
4. Find pending invitation
5. Click "Accept"

**Expected Results:**
- ✅ User added to `project_collaborators` table
- ✅ Invitation status changed to 'accepted'
- ✅ Owner receives acceptance notification
- ✅ User can access project with assigned permissions
- ✅ Activity logged

#### 1.3 Decline Invitations
**Test Steps:**
1. Login as invited user
2. Find pending invitation
3. Click "Decline"
4. Optionally add decline reason

**Expected Results:**
- ✅ Invitation status changed to 'declined'
- ✅ Owner receives decline notification
- ✅ User NOT added to collaborators
- ✅ Activity logged

### 2. Real-time Collaboration Testing

#### 2.1 Collaboration Messages
**Test Steps:**
1. Have 2+ collaborators on same project
2. Open project in different browser windows/users
3. Send messages of different types:
   - General messages
   - Announcements
   - Feedback
4. Reply to messages
5. Test threaded conversations

**Expected Results:**
- ✅ Messages appear instantly for all collaborators
- ✅ Real-time updates without page refresh
- ✅ Message threads work correctly
- ✅ Sender profiles display correctly
- ✅ Message timestamps accurate

#### 2.2 Activity Feed
**Test Steps:**
1. Perform various actions as different collaborators:
   - Edit content
   - Add comments
   - Change settings
   - Upload files
2. Monitor activity feed for all users

**Expected Results:**
- ✅ All actions logged in real-time
- ✅ Activity descriptions are clear
- ✅ User avatars and names correct
- ✅ Timestamps accurate
- ✅ No duplicate entries

### 3. Permission System Testing

#### 3.1 Role-Based Access Control
**Test Each Role:**

**Editor Role:**
```
✅ Can edit content
✅ Can comment
✅ Can view all sections
❌ Cannot invite collaborators
❌ Cannot change project settings
❌ Cannot remove collaborators
```

**Reviewer Role:**
```
✅ Can view content
✅ Can comment and suggest changes
✅ Can approve/reject submissions
❌ Cannot edit content directly
❌ Cannot invite collaborators
❌ Cannot access admin features
```

**Translator Role:**
```
✅ Can view content
✅ Can add translations
✅ Can comment on translation issues
❌ Cannot edit original content
❌ Cannot change project structure
```

#### 3.2 Permission Gates Testing
**Test Steps:**
1. Login as each role type
2. Try to access restricted features:
   - Settings button
   - Save/Share buttons
   - Collaborator management
   - Project deletion

**Expected Results:**
- ✅ Buttons disabled/hidden for unauthorized users
- ✅ API endpoints reject unauthorized requests
- ✅ Clear error messages when access denied
- ✅ No console errors

### 4. Workflow System Testing

#### 4.1 Submission Creation
**Test Steps:**
1. Login as Editor/Reviewer
2. Create different submission types:
   - Content edits
   - Suggestions
   - Reviews
   - Translation requests
3. Add descriptions, attachments
4. Set priority levels
5. Assign to specific roles

**Expected Results:**
- ✅ Submissions saved correctly
- ✅ Notifications sent to relevant users
- ✅ Files attached properly
- ✅ Status tracking works
- ✅ Real-time updates

#### 4.2 Approval Process
**Test Steps:**
1. Create submissions as different users
2. Login as users with approval permissions
3. Review submissions
4. Approve/reject with comments
5. Request changes

**Expected Results:**
- ✅ Approval actions logged
- ✅ Submitters notified of decisions
- ✅ Status changes reflected immediately
- ✅ Comments thread properly
- ✅ Email notifications sent

#### 4.3 Comments & Attachments
**Test Steps:**
1. Add comments to submissions
2. Upload various file types
3. Reply to comments
4. Test file download

**Expected Results:**
- ✅ All file types supported
- ✅ File size limits enforced
- ✅ Comments nest properly
- ✅ Downloads work correctly
- ✅ Real-time comment updates

### 5. Notification System Testing

#### 5.1 In-App Notifications
**Test Steps:**
1. Perform actions that trigger notifications
2. Check notification bell
3. Mark notifications as read
4. Test notification preferences

**Expected Results:**
- ✅ Notifications appear immediately
- ✅ Badge counts update correctly
- ✅ Read/unread states work
- ✅ Preferences applied correctly
- ✅ Notification history preserved

#### 5.2 Email Notifications
**Test Steps:**
1. Enable email notifications in preferences
2. Trigger various notification events
3. Check email delivery
4. Test unsubscribe functionality

**Expected Results:**
- ✅ Emails delivered promptly
- ✅ Content matches in-app notifications
- ✅ Unsubscribe links work
- ✅ Email preferences respected

### 6. Revenue Sharing Testing

#### 6.1 Royalty Split Management
**Test Steps:**
1. Set royalty splits for collaborators
2. Test validation (total ≤ 100%)
3. Update existing splits
4. Remove collaborators with splits

**Expected Results:**
- ✅ Split validation works
- ✅ Total calculation accurate
- ✅ Updates save correctly
- ✅ Warnings for over-allocation
- ✅ Changes logged in activity

### 7. Error Handling Testing

#### 7.1 Network Issues
**Test Steps:**
1. Simulate network failures
2. Test offline behavior
3. Test reconnection handling

#### 7.2 Permission Errors
**Test Steps:**
1. Try unauthorized actions
2. Test API endpoint access
3. Verify error messages

#### 7.3 Data Validation
**Test Steps:**
1. Submit invalid data
2. Test required field validation
3. Test format validation

## 🔍 Database Verification

### Key Tables to Monitor:
```sql
-- Check collaborations
SELECT * FROM project_collaborators WHERE project_id = 'your-project-id';

-- Check invitations
SELECT * FROM collaboration_invitations WHERE project_id = 'your-project-id';

-- Check messages
SELECT * FROM collaboration_messages WHERE project_id = 'your-project-id';

-- Check notifications
SELECT * FROM notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- Check activity
SELECT * FROM project_activity WHERE project_id = 'your-project-id' ORDER BY created_at DESC;

-- Check workflow submissions
SELECT * FROM workflow_submissions WHERE project_id = 'your-project-id';

-- Check workflow approvals
SELECT * FROM workflow_approvals ORDER BY created_at DESC;
```

## 🚨 Common Issues to Watch For

### Real-time Issues
- Messages not appearing immediately
- Activity feed delays
- Notification badge not updating

### Permission Issues
- Users accessing restricted features
- API endpoints not enforcing permissions
- Incorrect role permissions

### Data Consistency
- Orphaned records
- Incorrect status updates
- Missing activity logs

### Performance Issues
- Slow loading with many collaborators
- Real-time subscription memory leaks
- Database query performance

## 🛠️ Debugging Tools

### Browser Dev Tools
```javascript
// Monitor real-time subscriptions
console.log('Supabase channels:', supabase.getChannels());

// Check auth state
console.log('Auth user:', await supabase.auth.getUser());

// Monitor network requests
// Filter by "collaborations" or "workflows" in Network tab
```

### Database Queries
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'project_collaborators';

-- Monitor active connections
SELECT * FROM pg_stat_activity WHERE application_name = 'supabase';

-- Check constraint violations
SELECT * FROM information_schema.check_constraints WHERE table_name = 'notifications';
```

## ✅ Testing Checklist

### Pre-Testing Setup
- [ ] Multiple test accounts created
- [ ] Test project with content
- [ ] Database access configured
- [ ] Email testing configured

### Core Features
- [ ] Invitation system (send/accept/decline)
- [ ] Real-time messaging
- [ ] Activity tracking
- [ ] Permission gates
- [ ] Role-based access

### Workflow Features
- [ ] Submission creation
- [ ] Approval process
- [ ] Comments system
- [ ] File attachments
- [ ] Status tracking

### Notification System
- [ ] In-app notifications
- [ ] Email notifications
- [ ] Notification preferences
- [ ] Real-time updates

### Revenue & Management
- [ ] Royalty split validation
- [ ] Collaborator management
- [ ] Project settings access
- [ ] Data export/import

### Error Handling
- [ ] Network failures
- [ ] Permission errors
- [ ] Data validation
- [ ] Edge cases

## 📋 Test Results Template

```
Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]

✅ PASSED
❌ FAILED
⚠️  PARTIAL/ISSUES

Feature Test Results:
- Invitations: ✅
- Real-time: ✅
- Permissions: ✅
- Workflows: ❌ [Issue: XYZ]
- Notifications: ⚠️ [Email delays]

Issues Found:
1. [Description]
   - Impact: High/Medium/Low
   - Reproduction steps
   - Expected vs Actual

Performance Notes:
- Page load times
- Real-time responsiveness
- Database query performance
```

## 🚀 Automated Testing

### API Testing with curl
```bash
# Test invitation creation
curl -X POST http://localhost:3000/api/collaborations/invitations \
  -H "Content-Type: application/json" \
  -d '{"project_id":"uuid","invitee_id":"uuid","role":"editor"}'

# Test message sending
curl -X POST http://localhost:3000/api/collaborations/messages \
  -H "Content-Type: application/json" \
  -d '{"project_id":"uuid","content":"Test message"}'
```

### Load Testing
```bash
# Test with multiple concurrent users
# Use tools like Artillery, k6, or Postman for load testing
```

This comprehensive testing guide covers all collaboration functionalities. Start with the core features and work through each section systematically!