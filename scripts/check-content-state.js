require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkContentState() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab (correct ID)
  
  console.log('🔍 Checking content state for project:', projectId)
  console.log('=' .repeat(50))
  
  // Check project_content table
  console.log('\n📄 PROJECT_CONTENT TABLE:')
  try {
    const { data: contentData, error: contentError } = await supabase
      .from('project_content')
      .select('*')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (contentError) {
      console.log('❌ Error:', contentError.message)
    } else if (contentData && contentData.length > 0) {
      console.log('✅ Found content in project_content:')
      console.log('   Content length:', contentData[0].content?.length || 0)
      console.log('   Content preview:', contentData[0].content?.substring(0, 100) + '...')
      console.log('   Updated at:', contentData[0].updated_at)
    } else {
      console.log('❌ No content found in project_content table')
    }
  } catch (error) {
    console.log('❌ Exception accessing project_content:', error.message)
  }
  
  // Check projects.synopsis field
  console.log('\n📋 PROJECTS.SYNOPSIS FIELD:')
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('synopsis, updated_at, title')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.log('❌ Error:', projectError.message)
    } else if (projectData) {
      console.log('✅ Project found:')
      console.log('   Title:', projectData.title)
      console.log('   Synopsis length:', projectData.synopsis?.length || 0)
      console.log('   Synopsis preview:', projectData.synopsis?.substring(0, 100) + '...')
      console.log('   Updated at:', projectData.updated_at)
    } else {
      console.log('❌ Project not found')
    }
  } catch (error) {
    console.log('❌ Exception accessing projects:', error.message)
  }
  
  // Check latest version for reference
  console.log('\n📚 LATEST VERSION STATUS:')
  try {
    const { data: versionData, error: versionError } = await supabase
      .from('project_content_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)

    if (versionError) {
      console.log('❌ Error:', versionError.message)
    } else if (versionData && versionData.length > 0) {
      console.log('✅ Latest version:')
      console.log('   Version:', versionData[0].version_number)
      console.log('   Status:', versionData[0].status)
      console.log('   Content length:', versionData[0].content?.length || 0)
      console.log('   Created at:', versionData[0].created_at)
    } else {
      console.log('❌ No versions found')
    }
  } catch (error) {
    console.log('❌ Exception accessing versions:', error.message)
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('💡 RECOMMENDATION:')
  console.log('The Write tab should show the content from whichever source has the latest/approved content.')
}

checkContentState().catch(console.error)