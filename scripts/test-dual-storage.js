require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testNewApprovalFlow() {
  console.log('🚀 Testing updated approval flow with dual storage approach')
  console.log('=' .repeat(70))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Create a test pending change
    console.log('📋 Step 1: Creating test pending change...')
    
    const testContent = `Welcome Dota 2

TI 14
Best of 3 Elimination match
BB vs XG
Testing toast notifications.
Another edit for the testing.
Rob.in.hood18
After enabling editor
new line added href.

[DUAL STORAGE TEST - ${new Date().toISOString()}]`

    // Get current content for original_content field
    const { data: currentProject } = await supabase
      .from('projects')
      .select('synopsis')
      .eq('id', projectId)
      .single()

    const { data: pendingChange, error: pendingError } = await supabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: '8bd6f100-d76d-4d5c-a900-ffeaf85396ea', // project owner
        content_type: 'project_content',
        original_content: currentProject?.synopsis || '',
        proposed_content: testContent,
        change_description: 'Testing dual storage approach',
        status: 'pending'
      })
      .select()
      .single()

    if (pendingError) {
      console.error('❌ Failed to create pending change:', pendingError.message)
      return
    }

    console.log('✅ Created pending change:', pendingChange.id)

    // Simulate approval via API call
    console.log('\n🔄 Step 2: Simulating approval via API...')
    
    const approvalPayload = {
      pendingChangeId: pendingChange.id,
      decision: 'approve',
      feedbackNotes: 'Testing dual storage approach'
    }

    console.log('📤 Approval payload:', approvalPayload)
    console.log('💡 This would normally be called via HTTP request to /api/projects/{id}/approvals')
    console.log('💡 The updated logic should:')
    console.log('   1. Store content in projects.synopsis (primary)')
    console.log('   2. Try to sync to project_content (secondary)')
    console.log('   3. Tag the version appropriately')
    
    // Check the expected outcome
    console.log('\n🔍 Step 3: Checking current content state before approval...')
    
    const { data: beforeProject } = await supabase
      .from('projects')
      .select('synopsis, updated_at')
      .eq('id', projectId)
      .single()

    const { data: beforeContent } = await supabase
      .from('project_content')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    console.log('Before approval:')
    console.log('  projects.synopsis:', beforeProject?.synopsis?.length || 0, 'chars')
    console.log('  project_content:', beforeContent?.content?.length || 0, 'chars')

    console.log('\n💡 EXPECTED AFTER APPROVAL:')
    console.log('  projects.synopsis: Updated with new content (reliable)')
    console.log('  project_content: May or may not sync (depends on trigger)')
    console.log('  version: Tagged appropriately')
    console.log('  UI: Will show latest content from whichever source is newer')

    console.log('\n🎯 NEXT STEPS:')
    console.log('1. Run the approval through the actual API endpoint')
    console.log('2. Check that content appears in Write tab')
    console.log('3. Verify version tracking is correct')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testNewApprovalFlow().catch(console.error)