// Quick test to check authentication and RLS policies
// Run this in the browser console on the maps panel page

async function quickAuthTest() {
  console.log('=== QUICK AUTH TEST ===')

  // Check if supabase is available
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase not found - make sure you are on the maps panel page')
    return
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('User:', user)
  console.log('Auth Error:', authError)

  if (!user) {
    console.error('❌ NOT AUTHENTICATED')
    console.log('💡 Please log in first')
    return
  }

  console.log('✅ AUTHENTICATED as:', user.email)

  // Get project ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const projectId = urlParams.get('projectId') || urlParams.get('id')

  if (!projectId) {
    console.error('❌ No project ID in URL')
    console.log('💡 Make sure the URL contains ?projectId= or ?id=')
    return
  }

  console.log('Project ID:', projectId)

  // Check project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('owner_id, title')
    .eq('id', projectId)
    .single()

  console.log('Project:', project)
  console.log('Project Error:', projectError)

  if (projectError) {
    console.error('❌ PROJECT NOT FOUND OR ACCESS DENIED')
    return
  }

  const isOwner = project.owner_id === user.id
  console.log('Is Owner:', isOwner)

  if (!isOwner) {
    // Check if collaborator
    const { data: collab, error: collabError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    console.log('Collaborator:', collab)
    console.log('Collaborator Error:', collabError)

    if (collab) {
      console.log('✅ IS ACTIVE COLLABORATOR')
      console.log('Permissions:', collab.permissions)
    } else {
      console.error('❌ NOT OWNER AND NOT ACTIVE COLLABORATOR')
      console.log('💡 You need to be either the project owner or an active collaborator')
      return
    }
  } else {
    console.log('✅ IS PROJECT OWNER')
  }

  // Test world_elements access
  const { data: elements, error: elementsError } = await supabase
    .from('world_elements')
    .select('id, name')
    .eq('project_id', projectId)
    .limit(3)

  console.log('World Elements:', elements)
  console.log('World Elements Error:', elementsError)

  // Test insert
  const testPayload = {
    project_id: projectId,
    category: 'maps',
    name: 'Test Map (Quick Auth Test)',
    description: 'This is a test map for debugging',
    image_url: null,
    attributes: { test: true }
  }

  const { data: insertResult, error: insertError } = await supabase
    .from('world_elements')
    .insert(testPayload)
    .select()
    .single()

  console.log('Insert Result:', insertResult)
  console.log('Insert Error:', insertError)

  if (insertError) {
    console.error('❌ INSERT FAILED - RLS POLICY VIOLATION')
    console.log('Error details:', insertError.message)
  } else {
    console.log('✅ INSERT SUCCESSFUL')

    // Clean up test record
    await supabase
      .from('world_elements')
      .delete()
      .eq('id', insertResult.id)
    console.log('Cleaned up test record')
  }

  console.log('=== TEST COMPLETE ===')
}

// Make it available globally
window.quickAuthTest = quickAuthTest

console.log('Quick auth test function loaded. Run quickAuthTest() in the console.')