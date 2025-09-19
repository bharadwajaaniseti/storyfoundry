// Node.js debug script for RLS policy issues
// Run with: node debug-rls-node.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables')
  console.log('Example:')
  console.log('export SUPABASE_URL="https://your-project.supabase.co"')
  console.log('export SUPABASE_ANON_KEY="your-anon-key"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugRLS() {
  console.log('=== RLS DEBUG START ===')

  try {
    // Check authentication (this will likely fail without a session)
    console.log('Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Current user:', user)
    console.log('Auth error:', authError)

    if (!user) {
      console.log('❌ No authenticated user (expected in Node.js without session)')
      console.log('💡 This script is for testing RLS policies with a valid session')
      console.log('💡 Use the browser console version instead for testing with an active session')
      return
    }

    // For testing purposes, let's assume a project ID
    // In a real scenario, you'd get this from the application context
    const projectId = 'test-project-id' // Replace with actual project ID

    console.log('Project ID:', projectId)

    // Check if user owns the project
    console.log('Checking project ownership...')
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('owner_id, title')
      .eq('id', projectId)
      .single()

    console.log('Project data:', projectData)
    console.log('Project error:', projectError)

    if (projectError) {
      console.error('❌ Project not found or access denied')
      return
    }

    const isOwner = projectData.owner_id === user.id
    console.log('Is project owner:', isOwner)

    if (!isOwner) {
      console.log('Checking collaborator status...')

      // Check if user is a collaborator
      const { data: collabData, error: collabError } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      console.log('Collaborator data:', collabData)
      console.log('Collaborator error:', collabError)

      if (collabData) {
        console.log('✅ User is an active collaborator')
        console.log('Permissions:', collabData.permissions)
      } else {
        console.log('❌ User is not an active collaborator')
      }
    }

    // Test world_elements access
    console.log('Testing world_elements access...')
    const { data: elementsData, error: elementsError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('project_id', projectId)
      .limit(5)

    console.log('World elements data:', elementsData)
    console.log('World elements error:', elementsError)

    // Test insert (this should fail if RLS is blocking)
    console.log('Testing world_elements insert...')
    const testPayload = {
      project_id: projectId,
      category: 'maps',
      name: 'Test Map (Debug)',
      description: 'This is a test map for debugging RLS',
      image_url: null,
      attributes: { test: true }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('world_elements')
      .insert(testPayload)
      .select()
      .single()

    console.log('Insert result:', insertData)
    console.log('Insert error:', insertError)

    if (insertError) {
      console.error('❌ Insert failed - RLS policy violation!')
      console.log('Error details:', insertError)

      if (insertError.message.includes('violates row-level security policy')) {
        console.log('💡 This confirms the RLS policy is blocking the insert')
        console.log('💡 Check that you are either the project owner or an active collaborator')
      }
    } else {
      console.log('✅ Insert successful')

      // Clean up test record
      if (insertData?.id) {
        await supabase
          .from('world_elements')
          .delete()
          .eq('id', insertData.id)
        console.log('Cleaned up test record')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }

  console.log('=== RLS DEBUG END ===')
}

// Run the debug function
debugRLS().catch(console.error)