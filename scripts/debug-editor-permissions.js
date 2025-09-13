// Editor Permission Debugger
// Add this to your browser console on a project page to debug editor permissions

class EditorPermissionDebugger {
  constructor() {
    this.projectId = null
    this.userId = null
  }

  // Initialize with current page context
  async init() {
    try {
      // Try to get project ID from URL
      const path = window.location.pathname
      const projectMatch = path.match(/\/projects\/([^\/]+)/)
      if (projectMatch) {
        this.projectId = projectMatch[1]
        console.log('📍 Detected project ID:', this.projectId)
      }

      // Get current user
      const userResponse = await fetch('/api/auth/user')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        this.userId = userData.id
        console.log('👤 Current user ID:', this.userId)
        return true
      } else {
        console.error('❌ User not logged in')
        return false
      }
    } catch (error) {
      console.error('❌ Init error:', error)
      return false
    }
  }

  // Debug permission flow step by step
  async debugPermissionFlow() {
    if (!this.projectId || !this.userId) {
      console.log('❌ Need project ID and user ID. Call init() first or provide them manually.')
      return
    }

    console.log('\n🔍 Debugging Permission Flow...')
    console.log(`Project: ${this.projectId}`)
    console.log(`User: ${this.userId}`)

    // Step 1: Check if user is project owner
    console.log('\n1️⃣ Checking project ownership...')
    try {
      const projectResponse = await fetch(`/api/projects/${this.projectId}`)
      const projectData = await projectResponse.json()
      const isOwner = projectData.owner_id === this.userId
      console.log(`Owner ID: ${projectData.owner_id}`)
      console.log(`Is Owner: ${isOwner}`)
      
      if (isOwner) {
        console.log('✅ User is owner - should have all permissions')
        return
      }
    } catch (error) {
      console.error('❌ Error checking ownership:', error)
    }

    // Step 2: Check collaborator record
    console.log('\n2️⃣ Checking collaborator record...')
    try {
      const collabResponse = await fetch(`/api/collaborations/collaborators?project_id=${this.projectId}`)
      const collabData = await collabResponse.json()
      
      const userCollab = collabData.collaborators?.find(c => c.user_id === this.userId)
      if (!userCollab) {
        console.log('❌ No collaboration record found')
        return
      }

      console.log('📋 Collaboration record:', userCollab)
      console.log('🎭 Role:', userCollab.role)
      console.log('🔐 Raw permissions:', userCollab.permissions)

      // Step 3: Analyze permission structure
      console.log('\n3️⃣ Analyzing permission structure...')
      if (userCollab.permissions) {
        Object.entries(userCollab.permissions).forEach(([key, value]) => {
          console.log(`${key}: ${value} (${typeof value})`)
          if (typeof value === 'string' && (value === 'true' || value === 'false')) {
            console.log(`⚠️  WARNING: ${key} is a string, should be boolean`)
          }
        })
      }

      // Step 4: Check what default permissions should be
      console.log('\n4️⃣ Expected permissions for role...')
      const expectedPerms = this.getExpectedPermissions(userCollab.role)
      console.log('Expected for', userCollab.role, ':', expectedPerms)

      // Step 5: Compare actual vs expected
      console.log('\n5️⃣ Permission comparison...')
      if (userCollab.permissions && expectedPerms) {
        Object.keys(expectedPerms).forEach(key => {
          const actual = userCollab.permissions[key]
          const expected = expectedPerms[key]
          const actualBool = this.parsePermission(actual)
          
          console.log(`${key}:`)
          console.log(`  Expected: ${expected}`)
          console.log(`  Actual: ${actual} (parsed: ${actualBool})`)
          console.log(`  Match: ${actualBool === expected ? '✅' : '❌'}`)
        })
      }

      // Step 6: Test UI permission check
      console.log('\n6️⃣ Testing UI permission logic...')
      const uiCanWrite = this.simulateUIPermissionCheck(userCollab)
      console.log(`UI canWrite result: ${uiCanWrite}`)

    } catch (error) {
      console.error('❌ Error checking collaborator:', error)
    }
  }

  // Parse permission value to boolean
  parsePermission(value) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true'
    }
    return false
  }

  // Get expected permissions for a role
  getExpectedPermissions(role) {
    const rolePermissions = {
      coauthor: { read: true, write: true, comment: true, invite: false },
      editor: { read: true, write: true, comment: true, invite: false },
      translator: { read: true, write: true, comment: true, invite: false },
      producer: { read: true, write: false, comment: true, invite: true },
      reviewer: { read: true, write: false, comment: true, invite: false }
    }
    return rolePermissions[role]
  }

  // Simulate how the UI checks permissions
  simulateUIPermissionCheck(collaborator) {
    // This mimics the logic in getCollaboratorPermissions
    if (collaborator.computed_permissions) {
      return this.parsePermission(collaborator.computed_permissions.write)
    }
    
    if (collaborator.permissions && typeof collaborator.permissions === 'object') {
      return this.parsePermission(collaborator.permissions.write)
    }
    
    // Fall back to role-based permissions
    const expectedPerms = this.getExpectedPermissions(collaborator.role)
    return expectedPerms?.write || false
  }

  // Generate SQL fixes based on findings
  generateSQLFix(collaboratorId, role) {
    console.log('\n🔧 SQL Fix Commands:')
    
    // Fix for string permissions
    console.log('-- Fix string permissions to boolean:')
    console.log(`UPDATE project_collaborators 
SET permissions = jsonb_build_object(
  'read', true,
  'write', ${role === 'editor' || role === 'coauthor' || role === 'translator' ? 'true' : 'false'},
  'comment', true,
  'invite', ${role === 'producer' ? 'true' : 'false'}
)
WHERE id = '${collaboratorId}';`)

    // Verify fix
    console.log('\n-- Verify fix:')
    console.log(`SELECT id, role, permissions FROM project_collaborators WHERE id = '${collaboratorId}';`)
  }

  // Quick fix attempt via API
  async attemptAPIFix() {
    console.log('\n🔄 Attempting to refresh permissions via API...')
    
    try {
      // Trigger a permission recalculation by updating the collaborator
      const response = await fetch(`/api/collaborations/collaborators`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: this.projectId,
          user_id: this.userId,
          refresh_permissions: true
        })
      })

      if (response.ok) {
        console.log('✅ Permission refresh triggered')
        console.log('Reload the page and test again')
      } else {
        console.log('❌ Permission refresh failed:', await response.text())
      }
    } catch (error) {
      console.error('❌ API fix error:', error)
    }
  }

  // Run full debug
  async runFullDebug(projectId = null, userId = null) {
    if (projectId) this.projectId = projectId
    if (userId) this.userId = userId
    
    if (!this.projectId || !this.userId) {
      const initialized = await this.init()
      if (!initialized) return
    }

    await this.debugPermissionFlow()
    
    console.log('\n✅ Debug complete!')
    console.log('\n📝 Next steps if editor still shows read-only:')
    console.log('1. Run the SQL fix commands above')
    console.log('2. Reload the page')
    console.log('3. Check if the issue persists')
    console.log('4. Try: await permDebugger.attemptAPIFix()')
  }
}

// Make available globally and provide usage instructions
window.EditorPermissionDebugger = EditorPermissionDebugger

console.log(`
🐛 Editor Permission Debugger Loaded!

Quick usage:
const permDebugger = new EditorPermissionDebugger()
await permDebugger.runFullDebug()

Manual usage:
await permDebugger.runFullDebug('project-id', 'user-id')

Specific tests:
await permDebugger.debugPermissionFlow()
await permDebugger.attemptAPIFix()
`)

// Auto-run if we can detect the context
if (window.location.pathname.includes('/projects/')) {
  console.log('📍 Project page detected. Run: await permDebugger.runFullDebug()')
}