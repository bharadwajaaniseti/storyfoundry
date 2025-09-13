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

  // Quick permission test with detailed debugging
  async quickPermissionTest() {
    console.log('\n⚡ Quick Permission Test with Debug Info...')
    
    // First, get detailed user info
    try {
      const userResponse = await fetch('/api/auth/user')
      const userData = await userResponse.json()
      console.log('🔍 Current user data:', userData)
    } catch (error) {
      console.error('❌ Error getting user data:', error)
    }
    
    // Get collaborator info with full details
    try {
      const collabResponse = await fetch(`/api/collaborations/collaborators?project_id=${this.testProject}`)
      const collabData = await collabResponse.json()
      console.log('👥 Full collaborator data:', collabData)
      
      // Find current user's collaboration record
      const currentUserCollab = collabData.collaborators?.find(c => c.user_id === this.currentUser?.id)
      if (currentUserCollab) {
        console.log('🎯 Your collaboration record:', currentUserCollab)
        console.log('📋 Your role:', currentUserCollab.role)
        console.log('🔐 Your permissions:', currentUserCollab.permissions)
        console.log('✏️ Can write:', currentUserCollab.permissions?.write)
        console.log('👁️ Can read:', currentUserCollab.permissions?.read)
        console.log('💬 Can comment:', currentUserCollab.permissions?.comment)
        console.log('👥 Can invite:', currentUserCollab.permissions?.invite)
      } else {
        console.log('❌ No collaboration record found for current user')
      }
    } catch (error) {
      console.error('❌ Error getting collaboration data:', error)
    }
    
    // Test project ownership
    try {
      const projectResponse = await fetch(`/api/projects/${this.testProject}`)
      const projectData = await projectResponse.json()
      console.log('🏠 Project owner ID:', projectData.owner_id)
      console.log('🤔 Are you owner?', projectData.owner_id === this.currentUser?.id)
    } catch (error) {
      console.error('❌ Error getting project data:', error)
    }
    
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

  // Test specific permission checking
  async testPermissionLogic() {
    console.log('\n🧪 Testing Permission Logic...')
    
    try {
      // Test the permission hook directly (if available)
      const permissionTest = await fetch(`/api/debug/permissions?project_id=${this.testProject}&user_id=${this.currentUser?.id}`)
      if (permissionTest.ok) {
        const permData = await permissionTest.json()
        console.log('🔍 Permission test result:', permData)
      } else {
        console.log('ℹ️ No debug permission endpoint available')
      }
    } catch (error) {
      console.log('ℹ️ Permission debug not available:', error.message)
    }
    
    // Check if useProjectPermissions would return correct data
    console.log('📝 To debug in UI, check:')
    console.log('1. Open browser dev tools')
    console.log('2. Go to project page')
    console.log('3. In console, run: console.log(window.permissionsDebug)')
    console.log('4. Check if permissions.canWrite is true')
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