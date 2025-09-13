require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNewSyncFunction() {
  console.log('🧪 TESTING NEW SYNC FUNCTION')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
  
  try {
    // Get current content from projects.synopsis
    const { data: project } = await serviceSupabase
      .from('projects')
      .select('synopsis, title')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      console.error('❌ Project not found')
      return
    }
    
    console.log('📋 Content to sync:', project.synopsis.length, 'characters')
    console.log('📄 Filename:', project.title + '_content.txt')
    
    // Test the new sync function
    console.log('\n🔄 Testing sync_content_to_project_content function...')
    
    const { data, error } = await serviceSupabase.rpc('sync_content_to_project_content', {
      p_project_id: projectId,
      p_content: project.synopsis,
      p_filename: project.title + '_content.txt'
    })
    
    if (error) {
      console.log('❌ Sync function failed:', error.message)
      console.log('Error code:', error.code)
      
      if (error.code === 'PGRST202') {
        console.log('\n💡 Function not found - need to apply migration first')
        console.log('Run: npx supabase db push')
      }
    } else {
      console.log('✅ Sync function succeeded:', data)
      
      // Verify the result
      console.log('\n🔍 Verifying sync result...')
      
      const { data: syncedContent } = await serviceSupabase
        .from('project_content')
        .select('content, filename, updated_at')
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
        .single()
      
      if (syncedContent) {
        const synced = syncedContent.content === project.synopsis
        console.log('📊 Verification:', synced ? '✅ PERFECT SYNC!' : '⚠️  CONTENT MISMATCH')
        console.log('📏 Length match:', syncedContent.content.length === project.synopsis.length)
        console.log('📄 Filename:', syncedContent.filename)
        console.log('🕐 Updated:', syncedContent.updated_at)
      } else {
        console.log('❌ project_content record not found after sync')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testNewSyncFunction()