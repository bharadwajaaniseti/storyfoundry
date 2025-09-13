require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkContentAfterError() {
  try {
    console.log('🔍 Checking if content was updated despite trigger error...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const projectId = 'd92db81b-76c9-4a60-87fa-38efd528f7f8'
    const pendingChangeId = 'cc575150-51d1-4058-980d-7a8e141a5609'
    
    // Get the proposed content
    const { data: pendingChange } = await supabase
      .from('pending_editor_changes')
      .select('proposed_content')
      .eq('id', pendingChangeId)
      .single()
    
    // Get the current content
    const { data: currentContent } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    console.log('📋 Proposed content length:', pendingChange?.proposed_content?.length || 0)
    console.log('📋 Current content length:', currentContent?.content?.length || 0)
    console.log('📋 Content matches:', currentContent?.content === pendingChange?.proposed_content)
    
    if (currentContent?.content === pendingChange?.proposed_content) {
      console.log('✅ Content WAS actually updated despite the trigger error!')
      console.log('🎉 The approval workflow is working - the trigger error is just a side effect')
      
      // Let's also check the versions
      const { data: versions } = await supabase
        .from('project_content_versions')
        .select('id, tags, approval_status, version_number, change_summary')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(3)
      
      console.log('📋 Recent versions:')
      versions?.forEach((v, i) => {
        console.log(`   ${i + 1}. Version ${v.version_number}: ${v.change_summary}`)
        console.log(`      Tags: ${v.tags?.join(', ') || 'none'}`)
        console.log(`      Status: ${v.approval_status}`)
      })
      
      return true
    } else {
      console.log('❌ Content was not updated')
      return false
    }
    
  } catch (error) {
    console.error('❌ Error checking content:', error)
    return false
  }
}

checkContentAfterError()