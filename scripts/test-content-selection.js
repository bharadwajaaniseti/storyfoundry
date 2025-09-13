require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testContentSelection() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  console.log('🧪 Testing content selection logic')
  console.log('=' .repeat(50))
  
  try {
    // Load content from both sources with timestamps (same as updated code)
    const [contentResult, projectResult] = await Promise.all([
      supabase
        .from('project_content')
        .select('content, updated_at')
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('projects')
        .select('synopsis, updated_at')
        .eq('id', projectId)
        .single()
    ])

    const contentData = contentResult.data
    const projectData = projectResult.data
    
    let selectedContent = ''
    let selectedSource = 'none'

    // Determine which content to use based on recency and availability
    const projectContentTime = contentData?.updated_at ? new Date(contentData.updated_at) : null
    const synopsisTime = projectData?.updated_at ? new Date(projectData.updated_at) : null

    console.log('📊 Content comparison:')
    console.log('  project_content:', contentData?.content ? `${contentData.content.length} chars @ ${projectContentTime}` : 'none')
    console.log('  projects.synopsis:', projectData?.synopsis ? `${projectData.synopsis.length} chars @ ${synopsisTime}` : 'none')

    // Use the most recently updated content that actually exists
    if (projectData?.synopsis && synopsisTime && 
        (!contentData?.content || !projectContentTime || synopsisTime > projectContentTime)) {
      selectedContent = projectData.synopsis
      selectedSource = 'projects.synopsis (most recent)'
    } else if (contentData?.content) {
      selectedContent = contentData.content
      selectedSource = 'project_content'
    } else if (projectData?.synopsis) {
      selectedContent = projectData.synopsis
      selectedSource = 'projects.synopsis (fallback)'
    }

    console.log('\n🎯 SELECTION RESULT:')
    console.log('   Source:', selectedSource)
    console.log('   Content length:', selectedContent.length)
    console.log('   Content preview:', selectedContent.substring(0, 100) + '...')
    
    console.log('\n✅ This content should now appear in the Write tab!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testContentSelection().catch(console.error)