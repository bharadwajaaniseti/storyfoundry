const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testOwnerEditTags() {
  console.log('🎨 TESTING OWNER EDIT TAG SYSTEM')
  console.log('============================================================')
  
  try {
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
    
    // Get project details to check owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, owner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError) {
      console.error('❌ Error fetching project:', projectError)
      return
    }
    
    console.log('📁 Project Info:')
    console.log(`   Title: ${project.title}`)
    console.log(`   Owner ID: ${project.owner_id}`)
    
    // Check recent versions to see tag updates
    const { data: versions, error: versionsError } = await supabase
      .from('project_content_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(5)
    
    if (versionsError) {
      console.error('❌ Error fetching versions:', versionsError)
      return
    }
    
    console.log('\n📊 RECENT VERSION TAGS:')
    versions.forEach(version => {
      const tags = version.tags || []
      const hasOwnerEdit = tags.some(tag => tag.toLowerCase().includes('owner edit'))
      const hasSynced = tags.some(tag => tag.toLowerCase().includes('synced'))
      const hasDualStorage = tags.some(tag => tag.toLowerCase().includes('dual storage'))
      
      console.log(`\n🏷️  Version ${version.version_number}:`)
      console.log(`   Tags: ${tags.join(', ')}`)
      console.log(`   Created: ${new Date(version.created_at).toLocaleString()}`)
      console.log(`   Word Count: ${version.word_count}`)
      
      // Color coding feedback
      if (hasOwnerEdit) {
        console.log('   ✅ "Owner Edit" → PURPLE badge (correct)')
      }
      if (hasSynced) {
        console.log('   ✅ "Synced" → BLUE badge (correct)')
      }
      if (hasDualStorage) {
        console.log('   ⚠️  "Dual Storage" → Should be removed')
      }
    })
    
    // Check if we have any content to create a test with
    const { data: currentContent, error: contentError } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .single()
    
    if (currentContent) {
      const currentWordCount = currentContent.content.split(/\s+/).filter(word => word.length > 0).length
      console.log(`\n📝 Current content word count: ${currentWordCount}`)
      
      // Create a test content change to trigger owner edit
      const testContent = currentContent.content + '\n\nTesting owner edit functionality with additional content to trigger proper tagging system.'
      const newWordCount = testContent.split(/\s+/).filter(word => word.length > 0).length
      const wordDiff = newWordCount - currentWordCount
      
      console.log(`\n🧪 CREATING OWNER EDIT TEST:`)
      console.log(`   New word count: ${newWordCount}`)
      console.log(`   Word difference: +${wordDiff}`)
      console.log(`   Expected tags: Synced, Owner Edit, +${wordDiff} words`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testOwnerEditTags()