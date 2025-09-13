require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectContentSync() {
  console.log('🧪 TESTING DIRECT CONTENT SYNC WITHOUT AUTO-VERSIONING')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  try {
    // Get current content from projects.synopsis
    console.log('📋 Getting current content from projects.synopsis...')
    const { data: project } = await serviceSupabase
      .from('projects')
      .select('synopsis, title')
      .eq('id', projectId)
      .single()
    
    if (!project || !project.synopsis) {
      console.error('❌ No content found in projects.synopsis')
      return
    }
    
    console.log('✅ Found content in projects.synopsis:', project.synopsis.length, 'characters')
    
    // Test 1: Try to disable the trigger temporarily and then create content
    console.log('\n🔧 Test 1: Temporarily disable auto-versioning trigger...')
    
    try {
      // Disable the trigger
      const { error: disableError } = await serviceSupabase.rpc('exec_sql', {
        sql: 'ALTER TABLE project_content DISABLE TRIGGER trigger_create_content_version;'
      })
      
      if (disableError) {
        console.log('⚠️  Could not disable trigger via rpc:', disableError.message)
        
        // Try direct SQL execution instead
        console.log('🔄 Trying direct approach...')
        
        // Check if content exists
        const { data: existingContent } = await serviceSupabase
          .from('project_content')
          .select('id')
          .eq('project_id', projectId)
          .eq('asset_type', 'content')
          .single()
        
        if (existingContent) {
          console.log('📝 Updating existing project_content...')
          const { error: updateError } = await serviceSupabase
            .from('project_content')
            .update({
              content: project.synopsis,
              filename: project.title + '_content.txt',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContent.id)
          
          if (updateError) {
            console.log('❌ Update failed:', updateError.message)
          } else {
            console.log('✅ Successfully updated project_content!')
          }
        } else {
          console.log('📝 Creating new project_content...')
          const { error: createError } = await serviceSupabase
            .from('project_content')
            .insert({
              project_id: projectId,
              filename: project.title + '_content.txt',
              content: project.synopsis,
              asset_type: 'content'
            })
          
          if (createError) {
            console.log('❌ Create failed:', createError.message)
            console.log('Error details:', createError)
          } else {
            console.log('✅ Successfully created project_content!')
          }
        }
        
      } else {
        console.log('✅ Trigger disabled successfully')
        
        // Now try to sync content
        // ... rest of sync logic
        
        // Re-enable trigger
        await serviceSupabase.rpc('exec_sql', {
          sql: 'ALTER TABLE project_content ENABLE TRIGGER trigger_create_content_version;'
        })
        console.log('🔄 Re-enabled trigger')
      }
      
    } catch (testError) {
      console.log('❌ Test 1 failed:', testError.message)
    }
    
    console.log('\n🔍 Final status check...')
    
    // Check if sync worked
    const { data: finalContent } = await serviceSupabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    if (finalContent) {
      const synced = finalContent.content === project.synopsis
      console.log('📊 Sync result:', synced ? '✅ SYNCED' : '⚠️  DIFFERENT')
      console.log('projects.synopsis length:', project.synopsis.length)
      console.log('project_content length:', finalContent.content.length)
    } else {
      console.log('📊 Sync result: ❌ project_content still missing')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testDirectContentSync()