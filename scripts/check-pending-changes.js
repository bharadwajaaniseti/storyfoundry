require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPendingChanges() {
  console.log('📋 CHECKING PENDING CHANGES')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
  
  try {
    const { data: pendingChanges, error } = await serviceSupabase
      .from('pending_editor_changes')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching pending changes:', error)
      return
    }
    
    if (!pendingChanges || pendingChanges.length === 0) {
      console.log('📝 No pending changes found')
      console.log('\n💡 Creating a new test pending change for approval...')
      
      // Create a new test change
      const testContent = `AUTHENTICATED CLIENT TEST - ${new Date().toLocaleTimeString()}

This test verifies that our new authenticated client approach works:

✅ Key Changes:
1. projects.synopsis updated via serviceSupabase (admin)  
2. project_content updated via authenticated supabase (user context)
3. auth.uid() should work properly in auto-versioning trigger
4. Both storage locations should sync successfully

🎯 Expected Outcome:
- ✅ Content in both projects.synopsis AND project_content  
- ✅ Sync status: "Synced" instead of "Primary"
- ✅ Version tagged as "Dual Storage"
- ✅ No trigger constraint violations

🕐 Created: ${new Date().toISOString()}
📏 Length: This content has sufficient length for testing purposes.`

      // Get a valid user ID
      const { data: users } = await serviceSupabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single()
      
      if (!users) {
        console.error('❌ No users found')
        return
      }
      
      const { data: newChange, error: createError } = await serviceSupabase
        .from('pending_editor_changes')
        .insert({
          project_id: projectId,
          editor_id: users.id,
          content_type: 'project_content',
          original_content: 'Previous content',
          proposed_content: testContent,
          change_description: 'Testing authenticated client sync approach',
          editor_notes: 'Final test of dual storage with proper user context',
          content_title: 'Authenticated Client Test',
          status: 'pending'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Failed to create test change:', createError)
        return
      }
      
      console.log('✅ Created new test pending change:')
      console.log('   ID:', newChange.id)
      console.log('   Content length:', testContent.length, 'characters')
      
    } else {
      console.log('✅ Found', pendingChanges.length, 'pending change(s):')
      
      pendingChanges.forEach((change, index) => {
        console.log(`\n📄 Change ${index + 1}:`)
        console.log(`   ID: ${change.id}`)
        console.log(`   Description: ${change.change_description}`)
        console.log(`   Content Length: ${change.proposed_content.length} characters`)
        console.log(`   Created: ${new Date(change.created_at).toLocaleString()}`)
      })
    }
    
    console.log('\n🚀 READY FOR APPROVAL!')
    console.log('Go to the browser and approve the pending change to test dual storage sync.')
    console.log('URL: http://localhost:3000/app/projects/' + projectId)
    
  } catch (error) {
    console.error('❌ Failed to check pending changes:', error.message)
  }
}

checkPendingChanges()