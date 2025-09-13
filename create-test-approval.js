// Create a test pending change for approval testing
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestPendingChange() {
  console.log('🧪 Creating Test Pending Change for Approval Testing...\n')
  
  try {
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Your test project
    const editorId = '919cf6f2-70d6-4be7-82f8-1d1093c89cec' // Bharadwaja (editor)
    
    // Get current content first
    const { data: currentContent } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .limit(1)
      .single()

    const originalContent = currentContent?.content || 'Original content'
    const testContent = `${originalContent}\n\n🧪 TEST EDIT: This is a test edit for approval testing at ${new Date().toLocaleString()}\n\nEditor: Bharadwaja Anisetti\nPurpose: Testing the new approval workflow\nExpected: This should create a version with "Pending Review" tag`

    console.log('📝 Creating pending editor change...')
    
    // Create a pending editor change
    const { data: pendingChange, error: changeError } = await supabase
      .from('pending_editor_changes')
      .insert({
        project_id: projectId,
        editor_id: editorId,
        content_type: 'project_content',
        content_title: 'Test Approval Workflow',
        original_content: originalContent,
        proposed_content: testContent,
        change_description: '🧪 Test edit to verify the new approval workflow maintains proper version attribution',
        status: 'pending',
        content_metadata: {
          test_case: true,
          submitted_at: new Date().toISOString(),
          original_word_count: originalContent.trim().split(/\s+/).length,
          proposed_word_count: testContent.trim().split(/\s+/).length
        }
      })
      .select()
      .single()

    if (changeError) {
      console.error('❌ Failed to create pending change:', changeError)
      return
    }

    console.log('✅ Test pending change created successfully!')
    console.log(`   Change ID: ${pendingChange.id}`)
    console.log(`   Project: ${pendingChange.project_id}`)
    console.log(`   Status: ${pendingChange.status}`)

    // Also create a version with "Pending Review" tag (simulating editor submission)
    console.log('\n📊 Creating corresponding version with "Pending Review" tag...')
    
    // Get next version number
    const { data: lastVersion } = await supabase
      .from('project_content_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1
    const wordCount = testContent.trim().split(/\s+/).length

    const { data: newVersion, error: versionError } = await supabase
      .from('project_content_versions')
      .insert({
        project_id: projectId,
        user_id: editorId, // Editor as author
        content: testContent,
        version_number: nextVersionNumber,
        change_summary: 'Test approval workflow',
        word_count: wordCount,
        character_count: testContent.length,
        tags: ['Pending Review'], // This should change to ['Approved', 'Collaborator Edit'] after approval
        changes_made: {
          pending_change_id: pendingChange.id,
          test_case: true,
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (versionError) {
      console.error('❌ Failed to create version:', versionError)
    } else {
      console.log('✅ Test version created successfully!')
      console.log(`   Version: ${newVersion.version_number} (${newVersion.id})`)
      console.log(`   Author: ${newVersion.user_id} (should be editor)`)
      console.log(`   Tags: ${newVersion.tags.join(', ')} (should be "Pending Review")`)
    }

    console.log('\n🎯 TEST READY!')
    console.log('\n📋 To test the approval workflow:')
    console.log('   1. Open http://localhost:3000 in your browser')
    console.log('   2. Navigate to the project dashboard')
    console.log('   3. Look for the pending change in the approval workflow')
    console.log('   4. Click "Approve" button')
    console.log('   5. Verify:')
    console.log('      - No 500 errors occur')
    console.log('      - Content is updated with the test edit')
    console.log(`      - Version ${nextVersionNumber} changes from "Pending Review" to "Approved" + "Collaborator Edit"`)
    console.log('      - Version attribution remains with the editor (Bharadwaja)')

  } catch (error) {
    console.error('❌ Error creating test scenario:', error)
  }
}

createTestPendingChange()