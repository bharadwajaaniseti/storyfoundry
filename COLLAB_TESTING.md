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
3. Navigate to /app/collab
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

---

## 🧪 **How to Test All Collaboration Functionalities**

### **Step 1: Quick Setup (5 minutes)**

1. **Create Test Accounts:**
   ```
   Account 1: owner@test.com (Project Owner)
   Account 2: editor@test.com (Editor)  
   Account 3: reviewer@test.com (Reviewer)
   ```

2. **Create Test Project:**
   - Login as `owner@test.com`
   - Create a new novel project
   - Add some sample content
   - Copy the project ID from the URL

### **Step 2: Use the Testing Helper Script**

1. **Load the testing script:**
   - Open your StoryFoundry app in browser
   - Login as project owner
   - Open browser console (F12)
   - Copy and paste the content from `scripts/collaboration-tester.js`

2. **Run automated tests:**
   ```javascript
   const tester = new CollaborationTester()
   await tester.runAllTests('your-project-id-here')
   ```

### **Step 3: Manual Testing Workflow**

#### **🎯 Test Invitations (10 minutes)**
1. **Send invitations:**
   - Go to project → Collaborators tab
   - Click "Invite Collaborator" 
   - Invite `editor@test.com` as Editor with 15% royalty
   - Invite `reviewer@test.com` as Reviewer with 10% royalty

2. **Accept invitations:**
   - Login as `editor@test.com`
   - Check notification bell (should have invitation)
   - Go to `/app/collab` page
   - Accept the invitation
   - Verify you can access the project

3. **Check real-time updates:**
   - Keep owner account open in another tab
   - Should see acceptance notification immediately

#### **💬 Test Real-time Messaging (5 minutes)**
1. **Multi-user messaging:**
   - Have 2+ collaborators open project simultaneously
   - Send messages from different accounts
   - Watch messages appear in real-time
   - Test replies and threading

2. **Message types:**
   - Send general messages
   - Send announcements  
   - Send feedback messages

#### **📝 Test Workflow System (15 minutes)**
1. **Create submissions:**
   - Login as Editor
   - Create content edit submission
   - Add description and set priority
   - Upload attachment file

2. **Review submissions:**
   - Login as Reviewer/Owner
   - View pending submissions
   - Add comments
   - Approve/reject submissions

3. **Test notifications:**
   - Verify submitter gets notification of approval/rejection
   - Check activity feed updates

#### **🔐 Test Permission System (10 minutes)**
1. **Role restrictions:**
   - Login as Editor - try to access settings (should be blocked)
   - Login as Reviewer - try to edit content (should be read-only)
   - Login as non-collaborator - try to access project (should be denied)

2. **Permission gates:**
   - Check Save/Share buttons visibility
   - Test collaborator management access
   - Verify API endpoint security

#### **📨 Test Notification System (5 minutes)**
1. **In-app notifications:**
   - Perform actions that trigger notifications
   - Check notification bell updates
   - Test mark as read functionality

2. **Notification preferences:**
   - Go to `/app/settings/notifications`
   - Toggle different notification types
   - Test that preferences are respected

### **Step 4: Database Verification**

Run these queries in your database console:

```sql
-- Check collaborations
SELECT c.*, p.display_name, pr.title 
FROM project_collaborators c 
JOIN profiles p ON c.user_id = p.id 
JOIN projects pr ON c.project_id = pr.id 
WHERE c.project_id = 'your-project-id';

-- Check recent activity
SELECT * FROM project_activity 
WHERE project_id = 'your-project-id' 
ORDER BY created_at DESC LIMIT 20;

-- Check notifications
SELECT * FROM notifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 10;
```

### **Step 5: Edge Case Testing**

1. **Network issues:**
   - Disconnect internet briefly
   - Send messages/perform actions
   - Reconnect and verify data sync

2. **Permission edge cases:**
   - Try to invite someone already invited
   - Try to exceed 100% royalty split
   - Test removing yourself as collaborator

3. **Data validation:**
   - Send empty messages
   - Upload invalid file types
   - Submit forms with missing required fields

### **Step 6: Performance Testing**

1. **Load testing:**
   - Add 10+ collaborators to a project
   - Send rapid-fire messages
   - Create multiple workflow submissions
   - Monitor browser performance

2. **Real-time stress test:**
   - Open project in 5+ browser tabs
   - Send messages simultaneously
   - Check for memory leaks or connection issues

## **🚨 What to Look For**

### **✅ Success Indicators:**
- Messages appear instantly across all connected users
- Notifications show up immediately
- Permission gates work correctly
- Database records created properly
- No console errors
- Real-time subscriptions working

### **❌ Red Flags:**
- Messages delayed or missing
- Permission bypasses
- Console errors or network failures
- Database inconsistencies
- UI freezing or crashes
- Memory leaks with WebSocket connections

### **📊 Monitoring Tools:**

1. **Browser DevTools:**
   - Network tab: Watch for WebSocket connections
   - Console: Check for errors
   - Application tab: Monitor localStorage

2. **Database:**
   - Monitor `project_collaborators` table
   - Check `collaboration_messages` for real-time updates
   - Verify `notifications` are being created

3. **Performance:**
   - Memory usage in DevTools
   - Network request timing
   - Real-time event frequency

## **🎯 Quick 15-Minute Test**

If you're short on time, run this abbreviated test:

1. **Setup:** Create 2 test accounts, 1 test project (3 min)
2. **Invite:** Send and accept one collaboration invitation (3 min)
3. **Message:** Send real-time messages between accounts (2 min)
4. **Workflow:** Create one submission and approve it (4 min)
5. **Permissions:** Test one permission restriction (2 min)
6. **Verify:** Check database and notifications (1 min)

This comprehensive testing approach will verify that all collaboration functionalities are working correctly! The testing helper script will automate much of the API testing, while the manual steps ensure the UI and user experience work properly.

## 📝 **Testing Helper Script**

```javascript
// StoryFoundry Collaboration Testing Helper
// Run this in your browser console on the StoryFoundry app

class CollaborationTester {
  constructor() {
    this.baseUrl = window.location.origin
    this.currentUser = null
    this.testProject = null
  }

  // Initialize testing environment
  async init() {
    console.log('🚀 Starting Collaboration Testing...')
    
    // Check if user is logged in
    const response = await fetch('/api/auth/user')
    if (response.ok) {
      this.currentUser = await response.json()
      console.log('✅ Current user:', this.currentUser.email)
    } else {
      console.error('❌ Please log in first')
      return false
    }

    return true
  }

  // Test invitation system
  async testInvitations() {
    console.log('\n📧 Testing Invitation System...')
    
    const testEmails = [
      'editor@test.com',
      'reviewer@test.com', 
      'translator@test.com'
    ]
    
    for (const email of testEmails) {
      try {
        const response = await fetch('/api/collaborations/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: this.testProject,
            invitee_email: email,
            role: email.includes('editor') ? 'editor' : email.includes('reviewer') ? 'reviewer' : 'translator',
            royalty_split: 10,
            message: `Test invitation for ${email}`
          })
        })
        
        if (response.ok) {
          console.log(`✅ Invitation sent to ${email}`)
        } else {
          console.log(`❌ Failed to invite ${email}:`, await response.text())
        }
      } catch (error) {
        console.error(`❌ Error inviting ${email}:`, error)
      }
    }
  }

  // Test real-time messaging
  async testMessaging() {
    console.log('\n💬 Testing Real-time Messaging...')
    
    const testMessages = [
      'Hello team! This is a test message.',
      'Can someone review the latest chapter?',
      'I have some suggestions for the character development.'
    ]
    
    for (const content of testMessages) {
      try {
        const response = await fetch('/api/collaborations/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: this.testProject,
            content,
            message_type: 'general'
          })
        })
        
        if (response.ok) {
          console.log(`✅ Message sent: "${content.substring(0, 30)}..."`)
        } else {
          console.log(`❌ Failed to send message:`, await response.text())
        }
      } catch (error) {
        console.error(`❌ Error sending message:`, error)
      }
    }
  }

  // Test workflow submissions
  async testWorkflowSubmissions() {
    console.log('\n📝 Testing Workflow Submissions...')
    
    const testSubmissions = [
      {
        submission_type: 'edit',
        title: 'Grammar corrections for Chapter 1',
        description: 'Found several grammar issues that need fixing',
        priority: 'medium',
        category: 'language'
      },
      {
        submission_type: 'suggestion',
        title: 'Character development suggestion',
        description: 'The main character needs more backstory',
        priority: 'low',
        category: 'content'
      },
      {
        submission_type: 'review',
        title: 'Content review request',
        description: 'Please review the new chapter for consistency',
        priority: 'high',
        category: 'quality'
      }
    ]
    
    for (const submission of testSubmissions) {
      try {
        const response = await fetch('/api/workflows/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...submission,
            project_id: this.testProject
          })
        })
        
        if (response.ok) {
          console.log(`✅ Submission created: "${submission.title}"`)
        } else {
          console.log(`❌ Failed to create submission:`, await response.text())
        }
      } catch (error) {
        console.error(`❌ Error creating submission:`, error)
      }
    }
  }

  // Test permissions for current user
  async testPermissions() {
    console.log('\n🔐 Testing Permissions...')
    
    const endpoints = [
      { url: '/api/collaborations/collaborators', method: 'GET', name: 'View Collaborators' },
      { url: '/api/collaborations/messages', method: 'GET', name: 'View Messages' },
      { url: '/api/workflows/submissions', method: 'GET', name: 'View Submissions' },
      { url: '/api/collaborations/invitations', method: 'POST', name: 'Send Invitations' }
    ]
    
    for (const endpoint of endpoints) {
      try {
        const url = endpoint.url + (endpoint.method === 'GET' ? `?project_id=${this.testProject}` : '')
        const options = {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        }
        
        if (endpoint.method === 'POST') {
          options.body = JSON.stringify({ project_id: this.testProject })
        }
        
        const response = await fetch(url, options)
        
        if (response.ok) {
          console.log(`✅ ${endpoint.name}: Allowed`)
        } else if (response.status === 403) {
          console.log(`🚫 ${endpoint.name}: Forbidden (expected for non-owners)`)
        } else {
          console.log(`❌ ${endpoint.name}: Error ${response.status}`)
        }
      } catch (error) {
        console.error(`❌ Error testing ${endpoint.name}:`, error)
      }
    }
  }

  // Monitor real-time events
  startRealtimeMonitoring() {
    console.log('\n👁️ Starting Real-time Monitoring...')
    console.log('Open browser network tab and watch for WebSocket connections')
    console.log('Look for channels like: project-messages-*, project-activity-*, etc.')
    
    // Monitor local storage for real-time events
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      if (key.includes('supabase') || key.includes('collaboration')) {
        console.log('📊 LocalStorage update:', key, value)
      }
      originalSetItem.apply(this, arguments)
    }
  }

  // Check database state (requires console access)
  logDatabaseQueries() {
    console.log('\n🗄️ Database Verification Queries:')
    console.log(`
-- Check collaborators for your project:
SELECT * FROM project_collaborators WHERE project_id = '${this.testProject}';

-- Check recent messages:
SELECT * FROM collaboration_messages WHERE project_id = '${this.testProject}' ORDER BY created_at DESC LIMIT 10;

-- Check notifications:
SELECT * FROM notifications WHERE user_id = '${this.currentUser?.id}' ORDER BY created_at DESC LIMIT 10;

-- Check workflow submissions:
SELECT * FROM workflow_submissions WHERE project_id = '${this.testProject}' ORDER BY created_at DESC LIMIT 10;

-- Check activity log:
SELECT * FROM project_activity WHERE project_id = '${this.testProject}' ORDER BY created_at DESC LIMIT 10;
    `)
  }

  // Run all tests
  async runAllTests(projectId) {
    this.testProject = projectId
    
    if (!await this.init()) return
    
    console.log(`\n🧪 Running tests for project: ${projectId}`)
    
    await this.testInvitations()
    await this.testMessaging()
    await this.testWorkflowSubmissions()
    await this.testPermissions()
    
    this.startRealtimeMonitoring()
    this.logDatabaseQueries()
    
    console.log('\n✅ All tests completed! Check the results above.')
    console.log('📋 Next steps:')
    console.log('1. Check notification bell for new notifications')
    console.log('2. Navigate to collaboration pages to see real-time updates')
    console.log('3. Test with different user accounts')
    console.log('4. Verify database state using the queries above')
  }

  // Quick permission test
  async quickPermissionTest() {
    console.log('\n⚡ Quick Permission Test...')
    
    const testEndpoints = [
      '/api/collaborations/collaborators?project_id=' + this.testProject,
      '/api/collaborations/messages?project_id=' + this.testProject,
      '/api/workflows/submissions?project_id=' + this.testProject
    ]
    
    for (const endpoint of testEndpoints) {
      const response = await fetch(endpoint)
      console.log(`${endpoint}: ${response.status} ${response.statusText}`)
    }
  }
}

// Usage instructions
console.log(`
🎯 Collaboration Testing Helper Loaded!

Usage:
1. const tester = new CollaborationTester()
2. await tester.runAllTests('your-project-id')

Quick tests:
- await tester.testInvitations()
- await tester.testMessaging()
- await tester.testWorkflowSubmissions()
- await tester.testPermissions()

Don't forget to:
✅ Create multiple test accounts
✅ Use a test project (not production data)
✅ Monitor network tab for real-time events
✅ Check notification system
✅ Test with different user roles
`)

// Make tester available globally
window.CollaborationTester = CollaborationTester
```