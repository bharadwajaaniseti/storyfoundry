// Database Permission Checker
// Run this script to check the current state of editor permissions

class PermissionChecker {
  constructor() {
    this.results = []
  }

  async runDatabaseCheck() {
    console.log('🔍 Checking Database Permission State...')
    
    // These are the SQL queries to run in your database console
    const queries = {
      'Check all collaborators with editor role': `
        SELECT 
          pc.id,
          pc.project_id,
          pc.user_id,
          pc.role,
          pc.permissions,
          p.display_name as user_name,
          pr.title as project_title
        FROM project_collaborators pc
        JOIN profiles p ON pc.user_id = p.id
        JOIN projects pr ON pc.project_id = pr.id
        WHERE pc.role = 'editor'
        ORDER BY pc.created_at DESC;
      `,
      
      'Check permission structure for editors': `
        SELECT 
          id,
          role,
          permissions->>'read' as can_read,
          permissions->>'write' as can_write,
          permissions->>'comment' as can_comment,
          permissions->>'invite' as can_invite,
          permissions
        FROM project_collaborators 
        WHERE role = 'editor';
      `,
      
      'Check if migration was applied': `
        SELECT EXISTS (
          SELECT 1 FROM project_collaborators 
          WHERE role = 'editor' 
          AND permissions->>'write' = 'true'
        ) as editors_have_write_permission;
      `,
      
      'Count permission issues': `
        SELECT 
          role,
          COUNT(*) as total_collaborators,
          COUNT(CASE WHEN permissions->>'write' = 'true' THEN 1 END) as with_write,
          COUNT(CASE WHEN permissions->>'write' != 'true' THEN 1 END) as without_write
        FROM project_collaborators 
        GROUP BY role
        ORDER BY role;
      `
    }

    console.log('\n📋 Run these queries in your database console:\n')
    
    Object.entries(queries).forEach(([name, query]) => {
      console.log(`-- ${name}`)
      console.log(query)
      console.log('\n' + '='.repeat(80) + '\n')
    })
  }

  async checkAPIResponse(projectId, userId) {
    console.log('\n🌐 Checking API Responses...')
    
    try {
      // Check collaborators endpoint
      const collabResponse = await fetch(`/api/collaborations/collaborators?project_id=${projectId}`)
      const collabData = await collabResponse.json()
      
      console.log('👥 Collaborators API Response:')
      console.log(JSON.stringify(collabData, null, 2))
      
      // Find the specific user
      const userCollab = collabData.collaborators?.find(c => c.user_id === userId)
      if (userCollab) {
        console.log('\n🎯 Your specific collaboration record:')
        console.log('Role:', userCollab.role)
        console.log('Permissions object:', userCollab.permissions)
        console.log('Write permission:', userCollab.permissions?.write)
        console.log('Permission type:', typeof userCollab.permissions?.write)
        
        // Check if it's a string instead of boolean
        if (typeof userCollab.permissions?.write === 'string') {
          console.log('⚠️ WARNING: Write permission is a string, should be boolean')
          console.log('Value:', `"${userCollab.permissions.write}"`)
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking API:', error)
    }
  }

  generateFixCommands() {
    console.log('\n🔧 If editors still don\'t have write permissions, run this SQL:')
    console.log(`
-- Fix editor permissions manually
UPDATE project_collaborators 
SET permissions = jsonb_set(
  permissions, 
  '{write}', 
  'true'::jsonb
)
WHERE role = 'editor' 
AND (permissions->>'write' != 'true' OR permissions->>'write' IS NULL);

-- Verify the fix
SELECT 
  id, role, permissions->>'write' as can_write 
FROM project_collaborators 
WHERE role = 'editor';
    `)
    
    console.log('\n🔧 Alternative permission reset for all editors:')
    console.log(`
-- Reset all editor permissions to correct structure
UPDATE project_collaborators 
SET permissions = '{
  "read": true,
  "write": true, 
  "comment": true,
  "invite": false
}'::jsonb
WHERE role = 'editor';
    `)
  }

  async runFullCheck(projectId, userId) {
    console.log('🚀 Starting Full Permission Check...')
    console.log(`Project ID: ${projectId}`)
    console.log(`User ID: ${userId}`)
    
    await this.runDatabaseCheck()
    await this.checkAPIResponse(projectId, userId)
    this.generateFixCommands()
    
    console.log('\n✅ Permission check complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Run the database queries above')
    console.log('2. If editors don\'t have write permissions, run the fix commands')
    console.log('3. Test the UI again')
    console.log('4. Check browser console for any permission errors')
  }
}

// Usage
console.log(`
🔧 Permission Checker Loaded!

Usage:
const checker = new PermissionChecker()
await checker.runFullCheck('your-project-id', 'your-user-id')

Quick database check only:
await checker.runDatabaseCheck()
`)

window.PermissionChecker = PermissionChecker