require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testProjectsTableWorkaround() {
  try {
    console.log('🔄 Testing projects table workaround for approval...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const projectId = 'd92db81b-76c9-4a60-87fa-38efd528f7f8'
    const pendingChangeId = 'cc575150-51d1-4058-980d-7a8e141a5609'
    
    const { data: pendingChange } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('id', pendingChangeId)
      .single()
    
    if (!pendingChange) {
      console.error('❌ Pending change not found')
      return
    }
    
    console.log('📋 Step 1: Update projects table synopsis field...')
    
    // Update the projects table synopsis field instead of project_content
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({
        synopsis: pendingChange.proposed_content,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (projectUpdateError) {
      console.error('❌ Projects table update failed:', projectUpdateError)
      return
    }
    
    console.log('✅ Projects table updated successfully!')
    
    console.log('📋 Step 2: Create version record for tracking...')
    
    const { data: newVersion, error: versionError } = await supabase
      .from('project_content_versions')
      .insert({
        project_id: projectId,
        user_id: pendingChange.editor_id,
        content: pendingChange.proposed_content,
        version_number: 1,
        change_summary: 'Approved via projects table: ' + pendingChange.content_title,
        word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
        character_count: pendingChange.proposed_content.length,
        tags: ['Approved', 'Collaborator Edit', 'Projects Table'],
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: pendingChange.editor_id,
        reviewer_notes: 'Stored in projects.synopsis due to trigger issues',
        is_pending_approval: false,
        is_major_version: true
      })
      .select('id')
      .single()
    
    if (versionError) {
      console.error('❌ Version creation failed:', versionError)
      return
    }
    
    console.log('✅ Version record created:', newVersion.id)
    
    console.log('📋 Step 3: Update pending change status...')
    
    const { error: statusError } = await supabase
      .from('pending_editor_changes')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingChangeId)
    
    if (statusError) {
      console.error('❌ Status update failed:', statusError)
      return
    }
    
    console.log('✅ Pending change marked as approved')
    
    // Verify the final state
    const { data: project } = await supabase
      .from('projects')
      .select('synopsis')
      .eq('id', projectId)
      .single()
    
    const { data: finalVersions } = await supabase
      .from('project_content_versions')
      .select('id, tags, approval_status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    const { data: finalChange } = await supabase
      .from('pending_editor_changes')
      .select('status')
      .eq('id', pendingChangeId)
      .single()
    
    console.log('\n📋 Final verification:')
    console.log('✅ Project synopsis updated:', project?.synopsis === pendingChange.proposed_content)
    console.log('✅ Change status:', finalChange?.status)
    console.log('✅ Version created with tags:', finalVersions?.[0]?.tags)
    
    if (project?.synopsis === pendingChange.proposed_content && 
        finalChange?.status === 'approved' &&
        finalVersions?.[0]?.tags?.includes('Approved')) {
      console.log('\n🎉 PROJECTS TABLE WORKAROUND SUCCESSFUL! 🎉')
      console.log('✅ All components working:')
      console.log('   - Content stored in projects.synopsis')
      console.log('   - Version tracking maintained')
      console.log('   - Approval status updated')
      console.log('   - No trigger interference!')
      console.log('\n💡 This approach can be used in the API as a reliable fallback')
    } else {
      console.log('\n❌ Projects table workaround failed')
    }
    
  } catch (error) {
    console.error('❌ Error in projects table workaround test:', error)
  }
}

testProjectsTableWorkaround()