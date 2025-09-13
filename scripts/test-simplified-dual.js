require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSimplifiedDualStorage() {
  console.log('🧪 TESTING SIMPLIFIED DUAL STORAGE APPROACH')
  console.log('=' * 60)
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Get a valid user ID for testing
    console.log('🔍 Getting valid user ID...')
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    
    if (!users) {
      console.error('❌ No users found in profiles table')
      return
    }
    
    const editorId = users.id
    console.log('✅ Using editor ID:', editorId)
    
    // Step 1: Create a new pending change to approve
    console.log('📝 Creating test pending change...')
    
    const testContent = `Test content for simplified dual storage approach - ${new Date().toLocaleTimeString()}\n\nThis tests our new simplified approach to updating both storage locations:\n1. projects.synopsis (primary)\n2. project_content (secondary)\n\nContent created at: ${new Date().toISOString()}`
    
    const { data: pendingChange, error: createError } = await supabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: editorId, // Use the valid editor ID
        content_type: 'project_content',
        original_content: 'Original content placeholder',
        proposed_content: testContent,
        change_description: 'Testing simplified dual storage approach',
        editor_notes: 'Testing our new simplified approach to updating both storage locations',
        content_title: 'Test Content Update',
        status: 'pending'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create pending change:', createError)
      return
    }
    
    console.log('✅ Created pending change:', pendingChange.id)
    
    // Step 2: Approve via API (which will use our new approach)
    console.log('🔄 Approving change via API...')
    
    const response = await fetch(`http://localhost:3000/api/projects/${projectId}/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pendingChangeId: pendingChange.id,
        decision: 'approve'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ API call failed:', response.status, errorData)
      return
    }
    
    const result = await response.json()
    console.log('✅ Approval response:', result.message)
    
    // Step 3: Check sync status after approval
    console.log('\n🔍 Checking sync status after approval...')
    
    // Check projects.synopsis
    const { data: project } = await supabase
      .from('projects')
      .select('synopsis, updated_at')
      .eq('id', projectId)
      .single()
    
    // Check project_content
    const { data: projectContent } = await supabase
      .from('project_content')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    console.log('\n📊 SYNC STATUS RESULTS:')
    console.log('projects.synopsis:', project?.synopsis ? '✅ EXISTS' : '❌ MISSING')
    console.log('project_content:', projectContent?.content ? '✅ EXISTS' : '❌ MISSING')
    
    if (project?.synopsis && projectContent?.content) {
      const synced = project.synopsis === projectContent.content
      console.log('\n🔄 CONTENT SYNC:', synced ? '✅ SYNCED' : '⚠️  DIFFERENT')
      
      if (!synced) {
        console.log('projects.synopsis length:', project.synopsis.length)
        console.log('project_content length:', projectContent.content.length)
      }
    }
    
    console.log('\n🎉 Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSimplifiedDualStorage()