require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkTestScenario() {
  try {
    console.log('🔍 Checking test scenario status...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Check for pending changes
    const { data: pendingChanges, error: pendingError } = await supabase
      .from('pending_editor_changes')
      .select(`
        id, 
        project_id, 
        editor_id, 
        status, 
        content_title, 
        change_description,
        created_at,
        editor:profiles!pending_editor_changes_editor_id_fkey(display_name, first_name, last_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (pendingError) {
      console.error('❌ Error fetching pending changes:', pendingError)
      return
    }

    console.log(`📋 Found ${pendingChanges.length} pending changes:`)
    
    if (pendingChanges.length > 0) {
      pendingChanges.forEach((change, index) => {
        console.log(`  ${index + 1}. ID: ${change.id}`)
        console.log(`     Project: ${change.project_id}`)
        console.log(`     Editor: ${change.editor?.display_name || change.editor?.first_name || 'Unknown'}`)
        console.log(`     Title: ${change.content_title}`)
        console.log(`     Status: ${change.status}`)
        console.log(`     Created: ${new Date(change.created_at).toLocaleString()}`)
        console.log('')
      })
      
      // Use the first pending change for testing
      const testChange = pendingChanges[0]
      console.log(`✅ Test scenario available: ${testChange.id}`)
      console.log(`📝 To test approval, visit: http://localhost:3000/app/projects/${testChange.project_id}?tab=approved-workflow`)
      
    } else {
      console.log('ℹ️  No pending changes found. Creating a new test scenario...')
      
      // Try to find a test project
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id, title, owner_id')
        .limit(1)

      if (projectError || !projects.length) {
        console.error('❌ No projects found for testing')
        return
      }

      const testProject = projects[0]
      console.log(`📁 Using test project: ${testProject.title} (${testProject.id})`)
      
      // Create a test pending change
      const { data: newChange, error: createError } = await supabase
        .from('pending_editor_changes')
        .insert({
          project_id: testProject.id,
          editor_id: testProject.owner_id, // Use owner as editor for testing
          content_type: 'project_content',
          content_title: 'Test Content Update',
          change_description: 'Testing approval workflow - automated test',
          original_content: 'Original test content for approval testing.',
          proposed_content: 'Updated test content with changes for approval workflow testing. This content should be approved by the owner.',
          editor_notes: 'This is a test submission for approval workflow testing.',
          status: 'pending'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ Error creating test scenario:', createError)
        return
      }

      console.log(`✅ Created new test scenario: ${newChange.id}`)
      console.log(`📝 To test approval, visit: http://localhost:3000/app/projects/${testProject.id}?tab=approved-workflow`)
    }

  } catch (error) {
    console.error('❌ Error checking test scenario:', error)
  }
}

checkTestScenario()