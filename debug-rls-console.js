// Debug script for RLS policy issues
// Copy and paste this into the browser console to check authentication and permissions

// Make sure you're on a page where the maps panel is loaded
const debugRLS = async () => {
  console.log('=== RLS DEBUG START ===')

  // Check if supabase is available
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found. Make sure you are on a page with the maps panel.')
    return
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Current user:', user)
  console.log('Auth error:', authError)

  if (!user) {
    console.error('❌ User not authenticated!')
    console.log('💡 Try logging in first')
    return
  }

  // Get project ID from URL or context
  const urlParams = new URLSearchParams(window.location.search)
  const projectId = urlParams.get('projectId') || urlParams.get('id')

  if (!projectId) {
    console.error('❌ No project ID found in URL')
    console.log('💡 Make sure you are on a project page with ?projectId= or ?id= in the URL')
    return
  }

  console.log('Project ID:', projectId)

  // Check if user owns the project
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
      console.log('💡 You need to be either the project owner or an active collaborator to create maps')
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

  console.log('=== RLS DEBUG END ===')
}

// Make it available globally
window.debugRLS = debugRLS

console.log('RLS Debug function loaded. Run debugRLS() in the console to test permissions.')