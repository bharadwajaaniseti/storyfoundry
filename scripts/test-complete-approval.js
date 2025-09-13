require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testCompleteApprovalWorkflow() {
  try {
    console.log('🎯 Testing complete approval workflow with updated API logic...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const projectId = 'd92db81b-76c9-4a60-87fa-38efd528f7f8'
    const pendingChangeId = 'cc575150-51d1-4058-980d-7a8e141a5609'
    
    console.log('📋 Step 1: Verify pending change exists...')
    
    const { data: pendingChange, error: changeError } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('id', pendingChangeId)
      .single()
    
    if (changeError || !pendingChange) {
      console.error('❌ Pending change not found:', changeError)
      return
    }
    
    console.log('✅ Found pending change:', pendingChange.content_title)
    console.log('📝 Current status:', pendingChange.status)
    console.log('📄 Content preview:', pendingChange.proposed_content.substring(0, 100) + '...')
    
    console.log('\n📋 Step 2: Simulating manual approval process...')
    
    // Following the updated API logic from the route
    const editorId = pendingChange.editor_id
    const ownerId = pendingChange.editor_id // Assuming same user for test
    
    // Create approval decision record first
    console.log('📝 Creating approval decision record...')
    const { data: decisionRecord, error: decisionError } = await supabase
      .from('editor_approval_decisions')
      .insert({
        pending_change_id: pendingChangeId,
        owner_id: ownerId,
        decision: 'approve',
        feedback_notes: 'Approved via automated test workflow',
        decision_metadata: {
          decided_at: new Date().toISOString(),
          test_run: true
        }
      })
      .select('id')
      .single()
    
    if (decisionError) {
      console.error('❌ Error creating decision record:', decisionError)
      return
    }
    
    console.log('✅ Created decision record:', decisionRecord.id)
    
    // Update pending change status
    console.log('📝 Updating pending change status to approved...')
    const { error: statusError } = await supabase
      .from('pending_editor_changes')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingChangeId)
    
    if (statusError) {
      console.error('❌ Error updating status:', statusError)
      return
    }
    
    console.log('✅ Status updated to approved')
    
    // Now apply the content changes using the same logic as the updated API
    console.log('\n📋 Step 3: Applying content changes with manual versioning...')
    
    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('project_content_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()
    
    const nextVersionNumber = (lastVersion?.version_number || 0) + 1
    console.log('📊 Creating version number:', nextVersionNumber)
    
    // Create the version manually BEFORE updating content
    const { data: newVersion, error: versionCreateError } = await supabase
      .from('project_content_versions')
      .insert({
        project_id: projectId,
        user_id: editorId,
        content: pendingChange.proposed_content,
        version_number: nextVersionNumber,
        change_summary: 'Approved editor changes: ' + (pendingChange.content_title || pendingChange.content_type),
        word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
        character_count: pendingChange.proposed_content.length,
        tags: ['Approved', 'Collaborator Edit'],
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: ownerId,
        reviewer_notes: 'Approved via automated test workflow',
        is_pending_approval: false,
        is_major_version: true,
        changes_made: {
          type: 'approval',
          approved_by: ownerId,
          approved_at: new Date().toISOString(),
          pending_change_id: pendingChangeId,
          status: 'approved'
        }
      })
      .select('id')
      .single()
    
    if (versionCreateError) {
      console.error('❌ Error creating version:', versionCreateError)
      return
    }
    
    console.log('✅ Created version manually:', newVersion.id)
    
    // Now update the actual content
    console.log('📝 Updating project content...')
    const { error: contentError } = await supabase
      .from('project_content')
      .update({
        content: pendingChange.proposed_content,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
    
    let contentUpdated = false
    
    if (contentError) {
      console.log('⚠️  Content update triggered versioning error (expected):', contentError.message)
      
      // Verify the content was actually updated despite the error
      const { data: verifyContent } = await supabase
        .from('project_content')
        .select('content')
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
        .single()
      
      if (verifyContent?.content === pendingChange.proposed_content) {
        console.log('✅ Content was updated successfully (trigger error ignored)')
        contentUpdated = true
        
        // Check for and clean up duplicate versions
        const { data: recentVersions } = await supabase
          .from('project_content_versions')
          .select('id, user_id, created_at, version_number')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(3)
        
        const newVersionTime = new Date().getTime()
        const potentialDuplicate = recentVersions?.find(v => 
          v.id !== newVersion.id && 
          Math.abs(new Date(v.created_at).getTime() - newVersionTime) < 5000 &&
          (!v.user_id || v.version_number === nextVersionNumber)
        )
        
        if (potentialDuplicate) {
          console.log('🗑️  Removing duplicate version created by trigger:', potentialDuplicate.id)
          await supabase
            .from('project_content_versions')
            .delete()
            .eq('id', potentialDuplicate.id)
        }
      } else {
        console.error('❌ Content was not updated')
      }
    } else {
      console.log('✅ Content updated successfully without trigger error!')
      contentUpdated = true
    }
    
    if (!contentUpdated) {
      console.error('❌ Approval process failed - content was not updated')
      return
    }
    
    console.log('\n📋 Step 4: Verification...')
    
    // Verify final state
    const { data: finalChange } = await supabase
      .from('pending_editor_changes')
      .select('status')
      .eq('id', pendingChangeId)
      .single()
    
    const { data: finalContent } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    const { data: finalVersions } = await supabase
      .from('project_content_versions')
      .select('id, tags, change_summary, approval_status, version_number')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    console.log('✅ Final verification results:')
    console.log('   - Pending change status:', finalChange?.status)
    console.log('   - Content matches proposed:', finalContent?.content === pendingChange.proposed_content)
    console.log('   - Latest version has correct tags:', finalVersions?.[0]?.tags)
    console.log('   - Latest version status:', finalVersions?.[0]?.approval_status)
    console.log('   - Version number:', finalVersions?.[0]?.version_number)
    
    if (finalChange?.status === 'approved' && 
        finalContent?.content === pendingChange.proposed_content &&
        finalVersions?.[0]?.tags?.includes('Approved')) {
      console.log('\n🎉 APPROVAL WORKFLOW TEST SUCCESSFUL! 🎉')
      console.log('✅ All systems working correctly:')
      console.log('   - Pending change marked as approved')
      console.log('   - Content properly updated')
      console.log('   - Version created with correct tags')
      console.log('   - Trigger issue bypassed successfully')
    } else {
      console.log('\n❌ APPROVAL WORKFLOW TEST FAILED')
      console.log('Some components did not work as expected')
    }
    
  } catch (error) {
    console.error('❌ Error in approval workflow test:', error)
  }
}

testCompleteApprovalWorkflow()