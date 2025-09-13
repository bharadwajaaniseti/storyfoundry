require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function createEnhancedTagTest() {
  console.log('🎨 CREATING ENHANCED TAG SYSTEM TEST')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
  
  try {
    // Get current content for word count calculation
    const { data: project } = await serviceSupabase
      .from('projects')
      .select('synopsis, title')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      console.error('❌ Project not found')
      return
    }
    
    const currentWords = project.synopsis.split(/\s+/).filter(word => word.length > 0).length
    console.log('📊 Current content word count:', currentWords)
    
    // Create test content with significant word count changes for testing
    const testContent = `ENHANCED TAGGING SYSTEM TEST - ${new Date().toLocaleTimeString()}

🎨 Testing our new vibrant tag color system:

✅ ENHANCED FEATURES:
1. Vibrant color differentiation for tag types
2. Word count change indicators (+/- words)  
3. "Synced" tags for auto-versioning operations
4. Distinct colors for: Approved (green), Dual Storage (purple), Auto Synced (blue)
5. Content change tags: Major Edit (pink), Minor Edit (cyan)
6. Word count indicators: +words (emerald), -words (amber)

📊 CONTENT STATISTICS:
- This test adds approximately 50+ words to trigger "Major Edit" classification
- Expected tags: "Approved", "Collaborator Edit", "Dual Storage", "+XX words", "Major Edit"  
- Should demonstrate both storage sync AND enhanced visual UX

🎯 EXPECTED VISUAL RESULT:
- Green badge for "Approved" (success action)
- Orange badge for "Collaborator Edit" (collaboration)  
- Purple badge for "Dual Storage" (successful sync)
- Emerald badge for "+XX words" (content addition)
- Pink badge for "Major Edit" (significant change)

🚀 This comprehensive test validates our complete enhanced tagging system with optimized UX!

Created: ${new Date().toISOString()}
Word count: This content is specifically designed to exceed the word count threshold for major edit classification.`

    const newWords = testContent.split(/\s+/).filter(word => word.length > 0).length
    const wordDiff = newWords - currentWords
    
    console.log('📝 Test content word count:', newWords)
    console.log('📈 Word count difference:', wordDiff >= 0 ? `+${wordDiff}` : wordDiff)
    console.log('🏷️  Expected tag classification:', wordDiff > 100 ? 'Major Edit' : 'Minor Edit')
    
    // Get a valid user ID
    const { data: users } = await serviceSupabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()
    
    if (!users) {
      console.error('❌ No users found')
      return
    }
    
    // Create the enhanced test pending change
    const { data: newChange, error: createError } = await serviceSupabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: users.id,
        content_type: 'project_content',
        original_content: project.synopsis,
        proposed_content: testContent,
        change_description: 'Testing enhanced tag system with vibrant colors and word count indicators',
        editor_notes: 'This tests our complete enhanced tagging system: colors, word counts, and sync status',
        content_title: 'Enhanced Tagging System Test',
        status: 'pending'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create enhanced test:', createError)
      return
    }
    
    console.log('\n🎉 ENHANCED TEST CREATED SUCCESSFULLY!')
    console.log('📄 Pending Change ID:', newChange.id)
    console.log('📊 Content Length:', testContent.length, 'characters')
    console.log('📈 Word Count Change:', wordDiff >= 0 ? `+${wordDiff}` : wordDiff, 'words')
    console.log('')
    console.log('🎨 EXPECTED ENHANCED TAGS AFTER APPROVAL:')
    console.log('   ✅ "Approved" → Green badge (success)')
    console.log('   🤝 "Collaborator Edit" → Orange badge (collaboration)')
    console.log('   🔄 "Dual Storage" → Purple badge (successful sync)')
    console.log(`   📊 "+${wordDiff} words" → Emerald badge (content addition)`)
    console.log('   📝 "Major Edit" → Pink badge (significant change)')
    console.log('')
    console.log('🚀 READY FOR VISUAL TESTING!')
    console.log('Go to the browser to approve and see the enhanced tag colors in action!')
    console.log('URL: http://localhost:3000/app/projects/' + projectId)
    
  } catch (error) {
    console.error('❌ Enhanced test creation failed:', error.message)
  }
}

createEnhancedTagTest()