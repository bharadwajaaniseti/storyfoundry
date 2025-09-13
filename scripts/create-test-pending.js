require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestPendingChange() {
  console.log('📝 CREATING TEST PENDING CHANGE FOR APPROVAL')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Get a valid user ID to use for the operation
    console.log('🔍 Getting valid user ID for pending change...')
    const { data: users } = await serviceSupabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    
    if (!users) {
      console.error('❌ No users found in profiles table')
      return
    }
    
    const userId = users.id
    console.log('✅ Using user ID:', userId)

    // Test content for the update
    const testContent = `FINAL TEST: Simplified dual storage approach - ${new Date().toLocaleTimeString()}

This is the final test of our simplified approach to achieve dual storage:

✅ Approach:
1. Update projects.synopsis using serviceSupabase (admin privileges)
2. Update/create project_content using authenticated supabase client (user context)
3. Auto-versioning trigger works properly with user context
4. Achieve true dual storage synchronization

📊 Expected Result:
- Content stored in both projects.synopsis and project_content
- Sync status should show "Synced" instead of "Primary"
- Version should be tagged as "Dual Storage"

🕐 Created at: ${new Date().toISOString()}

Content length: This content is specifically designed to test the dual storage sync.`

    // Create pending change
    const { data: pendingChange, error: createError } = await serviceSupabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: userId,
        content_type: 'project_content',
        original_content: 'Previous content placeholder',
        proposed_content: testContent,
        change_description: 'Final test of simplified dual storage approach',
        editor_notes: 'Testing authenticated client approach for project_content operations',
        content_title: 'Final Dual Storage Test',
        status: 'pending'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create pending change:', createError)
      return
    }
    
    console.log('✅ Created pending change successfully!')
    console.log('📄 Pending Change ID:', pendingChange.id)
    console.log('📊 Content Length:', testContent.length, 'characters')
    console.log('')
    console.log('🚀 READY FOR APPROVAL TEST!')
    console.log('Next step: Use the UI to approve this change and check for dual storage sync.')
    console.log('')
    console.log('📋 Details:')
    console.log(`   Project ID: ${projectId}`)
    console.log(`   Change ID: ${pendingChange.id}`)
    console.log(`   Editor ID: ${userId}`)
    console.log('')
    console.log('🔍 You can check sync status after approval with:')
    console.log('   node scripts/check-sync-status.js')
    
  } catch (error) {
    console.error('❌ Failed to create test pending change:', error.message)
    console.error('Full error:', error)
  }
}

createTestPendingChange()