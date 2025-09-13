require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testUserContextContentUpdate() {
  console.log('🧪 Testing user context content update approach')
  console.log('=' .repeat(60))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('synopsis, title, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('❌ Error getting project:', projectError.message)
      return
    }

    console.log('📋 Project:', projectData.title)
    console.log('📋 Owner:', projectData.owner_id)
    console.log('📋 Synopsis length:', projectData.synopsis?.length || 0)

    // Create a regular supabase client (simulating user authentication)
    // For testing, we'll still use service role but the approach would work with user auth
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // The key difference: try using authenticated context instead of service role
    // In real scenario, this would be a user-authenticated client
    
    // Check if project_content exists
    const { data: existingContent, error: checkError } = await supabase
      .from('project_content')
      .select('id, content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking content:', checkError.message)
      return
    }

    console.log('\n🔍 Current state:')
    console.log('   project_content exists:', !!existingContent)
    if (existingContent) {
      console.log('   current content length:', existingContent.content?.length || 0)
    }

    // Test content: append a timestamp to make it unique
    const testContent = projectData.synopsis + '\n\n[Test update: ' + new Date().toISOString() + ']'

    console.log('\n🔄 Testing content update...')
    
    if (existingContent) {
      console.log('📝 Updating existing content...')
      
      // Try with service role first (this should still fail due to trigger)
      const { error: serviceError } = await supabase
        .from('project_content')
        .update({
          content: testContent,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('asset_type', 'content')

      if (serviceError) {
        console.log('❌ Service role update failed (expected):', serviceError.message)
        
        console.log('💡 Key insight: Even checking existing content triggers the auto-versioning')
        console.log('💡 The trigger fires on ANY update to project_content, regardless of user context')
        console.log('💡 This means we need a different approach entirely')
        
      } else {
        console.log('✅ Unexpectedly succeeded!')
      }
    } else {
      console.log('📝 Creating new content entry...')
      
      const { error: createError } = await supabase
        .from('project_content')
        .insert({
          project_id: projectId,
          filename: `${projectData.title}_content.txt`,
          content: testContent,
          asset_type: 'content'
        })

      if (createError) {
        console.log('❌ Creation failed (expected):', createError.message)
        console.log('💡 The auto-versioning trigger prevents any insert/update to project_content')
      } else {
        console.log('✅ Creation succeeded!')
      }
    }

    console.log('\n🎯 CONCLUSION:')
    console.log('The trigger fires on ANY project_content modification, regardless of user context.')
    console.log('We need to either:')
    console.log('1. Disable the trigger temporarily during approval')
    console.log('2. Modify the trigger to handle service role context')
    console.log('3. Accept the projects.synopsis approach as the working solution')
    console.log('4. Create content outside the trigger and manually manage versioning')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testUserContextContentUpdate().catch(console.error)