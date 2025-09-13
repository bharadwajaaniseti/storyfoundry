require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectDualStorage() {
  console.log('🧪 TESTING DIRECT DUAL STORAGE LOGIC')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Get a valid user ID to use for the operation
    console.log('🔍 Getting valid user ID for project_content...')
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
    console.log('✅ Using user ID for operations:', userId)

    // Test content for the update
    const testContent = `Direct dual storage test - ${new Date().toLocaleTimeString()}\n\nThis tests the simplified approach:\n1. Update projects.synopsis directly\n2. Update/create project_content directly\n3. Skip trigger complications\n\nCreated at: ${new Date().toISOString()}`
    
    console.log('📝 Testing simplified dual storage approach...')
    console.log('Content length:', testContent.length, 'characters')
    
    // Get project info
    const { data: project } = await serviceSupabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      console.error('❌ Project not found')
      return
    }
    
    console.log('✅ Project found:', project.title)
    
    // Step 1: Update projects.synopsis (primary storage)
    console.log('\n🔄 Step 1: Updating projects.synopsis...')
    
    const { error: projectUpdateError } = await serviceSupabase
      .from('projects')
      .update({
        synopsis: testContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (projectUpdateError) {
      console.error('❌ Projects table update failed:', projectUpdateError)
      return
    }
    
    console.log('✅ Successfully updated projects.synopsis')
    
    // Step 2: Update/create project_content table entry
    console.log('\n🔄 Step 2: Handling project_content table...')
    
    let projectContentSynced = false
    
    const { data: existingContent, error: checkError } = await serviceSupabase
      .from('project_content')
      .select('id')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Error checking existing content:', checkError.message)
    }

    if (existingContent) {
      // Record exists, update it directly
      console.log('📝 Updating existing project_content record...')
      console.log('Existing record ID:', existingContent.id)
      
      const { error: updateError } = await serviceSupabase
        .from('project_content')
        .update({
          content: testContent,
          filename: project.title + '_content.txt',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContent.id) // Use the specific ID to avoid trigger issues

      if (updateError) {
        console.log('⚠️  project_content update failed:', updateError.message)
        console.log('Error details:', updateError)
      } else {
        console.log('✅ Successfully updated project_content table')
        projectContentSynced = true
      }
      
    } else {
      // Record doesn't exist, create it with skipped auto-versioning
      console.log('📝 Creating new project_content record...')
      
      // Strategy: Skip auto-versioning to avoid user_id requirement
      console.log('⚙️ Setting skip_auto_version = true')
      
      // First set the config to skip auto-versioning
      await serviceSupabase.rpc('exec', {
        sql: "SELECT set_config('app.skip_auto_version', 'true', true);"
      })
      
      // Now insert normally
      const { error: createError } = await serviceSupabase
        .from('project_content')
        .insert({
          project_id: projectId,
          filename: project.title + '_content.txt',
          content: testContent,
          asset_type: 'content',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createError) {
        console.log('⚠️  project_content creation failed:', createError.message)
        console.log('Error details:', createError)
      } else {
        console.log('✅ Successfully created project_content record')
        projectContentSynced = true
      }
    }
    
    // Step 3: Verify sync status
    console.log('\n🔍 Step 3: Verifying sync status...')
    
    // Check projects.synopsis
    const { data: updatedProject } = await serviceSupabase
      .from('projects')
      .select('synopsis, updated_at')
      .eq('id', projectId)
      .single()
    
    // Check project_content
    const { data: updatedContent } = await serviceSupabase
      .from('project_content')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    console.log('\n📊 FINAL SYNC STATUS:')
    console.log('projects.synopsis:', updatedProject?.synopsis ? '✅ EXISTS' : '❌ MISSING')
    console.log('project_content:', updatedContent?.content ? '✅ EXISTS' : '❌ MISSING')
    
    if (updatedProject?.synopsis && updatedContent?.content) {
      const synced = updatedProject.synopsis === updatedContent.content
      console.log('\n🔄 CONTENT SYNC:', synced ? '✅ PERFECT SYNC ACHIEVED!' : '⚠️  DIFFERENT')
      
      if (synced) {
        console.log('🎉 SUCCESS: Both storage locations have identical content!')
        console.log('📈 Storage mode: DUAL STORAGE (Synced)')
      } else {
        console.log('📊 projects.synopsis length:', updatedProject.synopsis.length)
        console.log('📊 project_content length:', updatedContent.content.length)
      }
    } else if (updatedProject?.synopsis) {
      console.log('📈 Storage mode: SINGLE STORAGE (Primary only)')
    } else {
      console.log('❌ Storage mode: FAILED')
    }
    
    console.log('\n✅ Direct dual storage test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testDirectDualStorage()