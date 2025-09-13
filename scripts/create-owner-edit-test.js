const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createOwnerEditTest() {
  console.log('🎨 CREATING OWNER EDIT TEST CASE')
  console.log('============================================================')
  
  try {
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
    
    // Get current content and create a pending change that simulates owner editing
    const { data: pendingChange, error: createError } = await supabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: '8bd6f100-d76d-4d5c-a900-ffeaf85396ea', // The owner's ID from the test above
        content_type: 'project_content',
        original_content: 'Current content with some basic text.',
        proposed_content: `Enhanced content with owner modifications.

This is a significant content update made by the project owner.
The content includes multiple paragraphs and substantial additions.
These changes demonstrate the owner edit functionality.
Word count will increase significantly to trigger proper tag classification.

Additional sections:
- Feature improvements
- Enhanced storytelling
- Better character development
- Plot advancement
- Rich descriptions and world building

This comprehensive update should trigger:
1. "Synced" tag (blue badge)
2. "Owner Edit" tag (purple badge) 
3. "+XX words" tag (emerald badge)
4. "Major Edit" tag (pink badge)

The new tagging system will properly identify this as an owner-initiated change.`,
        status: 'pending',
        change_description: 'Testing owner edit tag functionality with comprehensive content update',
        editor_notes: 'Comprehensive content enhancement with multiple improvements and additions'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating pending change:', createError)
      return
    }
    
    const currentWords = pendingChange.original_content.split(/\s+/).filter(word => word.length > 0).length
    const proposedWords = pendingChange.proposed_content.split(/\s+/).filter(word => word.length > 0).length
    const wordDiff = proposedWords - currentWords
    
    console.log('✅ OWNER EDIT TEST CASE CREATED')
    console.log(`📄 Pending Change ID: ${pendingChange.id}`)
    console.log(`📊 Original word count: ${currentWords}`)
    console.log(`📊 Proposed word count: ${proposedWords}`)
    console.log(`📈 Word count difference: +${wordDiff}`)
    console.log(`🏷️  Expected classification: Major Edit (>${wordDiff} words)`)
    
    console.log('\n🎨 EXPECTED TAGS AFTER APPROVAL:')
    console.log('   ✅ "Approved" → Green badge')
    console.log('   🤝 "Collaborator Edit" → Orange badge')
    console.log('   👑 "Owner Edit" → Purple badge (NEW!)')
    console.log('   🔄 "Synced" → Blue badge (replaces Dual Storage)')
    console.log(`   📊 "+${wordDiff} words" → Emerald badge`)
    console.log('   📝 "Major Edit" → Pink badge')
    
    console.log('\n🚀 NEXT STEPS:')
    console.log('1. Go to the browser and approve this pending change')
    console.log('2. Verify the new tag colors appear correctly')
    console.log('3. Confirm "Owner Edit" appears in purple')
    console.log('4. Confirm "Synced" appears instead of "Dual Storage"')
    console.log(`\n🌐 URL: http://localhost:3000/app/projects/${projectId}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createOwnerEditTest()