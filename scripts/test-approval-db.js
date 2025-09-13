require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testApprovalDatabase() {
  try {
    console.log('🚀 Testing approval via database operations...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
    const pendingChangeId = 'b62e445c-933a-4874-be27-cb31bf6be52f'
    
    console.log('🔍 Checking pending change before approval...')
    
    // Check the pending change
    const { data: pendingChange, error: changeError } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('id', pendingChangeId)
      .single()
    
    if (changeError || !pendingChange) {
      console.error('❌ Pending change not found:', changeError)
      return
    }
    
    console.log('✅ Found pending change:', {
      id: pendingChange.id,
      content_type: pendingChange.content_type,
      status: pendingChange.status,
      content_title: pendingChange.content_title
    })
    
    // 1. Update the pending change status to approved
    console.log('🔄 Updating pending change status to approved...')
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
    
    // 2. Apply the content changes
    if (pendingChange.content_type === 'project_content') {
      console.log('🔄 Applying content changes...')
      
      // Update the project content
      const { error: contentError } = await supabase
        .from('project_content')
        .update({
          content: pendingChange.proposed_content,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
      
      if (contentError) {
        console.error('❌ Content update error (but this might be expected due to trigger):', contentError.message)
        
        // Verify if content was actually updated despite the error
        const { data: verifyContent } = await supabase
          .from('project_content')
          .select('content')
          .eq('project_id', projectId)
          .eq('asset_type', 'content')
          .single()
        
        if (verifyContent?.content === pendingChange.proposed_content) {
          console.log('✅ Content was actually updated successfully (trigger error ignored)')
        } else {
          console.log('❌ Content was not updated')
          return
        }
      } else {
        console.log('✅ Content updated without error')
      }
    }
    
    // 3. Update version tags
    console.log('🔄 Looking for pending version to update tags...')
    
    const { data: pendingVersions } = await supabase
      .from('project_content_versions')
      .select('id, tags, changes_made')
      .eq('project_id', projectId)
      .contains('tags', ['Pending Review'])
      .order('created_at', { ascending: false })
      .limit(1)
    
    const pendingVersion = pendingVersions?.[0]
    if (pendingVersion) {
      console.log('✅ Found pending version to update:', pendingVersion.id)
      
      const { error: versionError } = await supabase
        .from('project_content_versions')
        .update({
          tags: ['Approved', 'Collaborator Edit'],
          changes_made: {
            ...pendingVersion.changes_made,
            approved_at: new Date().toISOString(),
            status: 'approved'
          }
        })
        .eq('id', pendingVersion.id)
      
      if (versionError) {
        console.error('❌ Error updating version tags:', versionError)
      } else {
        console.log('✅ Version tags updated to "Approved" and "Collaborator Edit"')
      }
    } else {
      console.log('ℹ️  No pending version found to update')
    }
    
    console.log('🎉 Approval process completed successfully!')
    console.log('📝 You can now check the project content and history to see the changes')
    
  } catch (error) {
    console.error('❌ Error in approval test:', error)
  }
}

testApprovalDatabase()