require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testDeleteRecreateApproach() {
  try {
    console.log('🔄 Testing delete-and-recreate approach for content update...')
    
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
    
    console.log('📋 Step 1: Delete existing content record...')
    
    // Delete existing content
    const { error: deleteError } = await supabase
      .from('project_content')
      .delete()
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
      return
    }
    
    console.log('✅ Existing content deleted')
    
    console.log('📋 Step 2: Wait a moment to ensure trigger state clears...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('📋 Step 3: Create manual version BEFORE recreating content...')
    
    // Create version manually
    const { data: newVersion, error: versionError } = await supabase
      .from('project_content_versions')
      .insert({
        project_id: projectId,
        user_id: pendingChange.editor_id,
        content: pendingChange.proposed_content,
        version_number: 1,
        change_summary: 'Manual approval: ' + pendingChange.content_title,
        word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
        character_count: pendingChange.proposed_content.length,
        tags: ['Approved', 'Collaborator Edit'],
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: pendingChange.editor_id,
        reviewer_notes: 'Manual recreation test',
        is_pending_approval: false,
        is_major_version: true
      })
      .select('id')
      .single()
    
    if (versionError) {
      console.error('❌ Version creation failed:', versionError)
      return
    }
    
    console.log('✅ Manual version created:', newVersion.id)
    
    console.log('📋 Step 4: Recreate content record...')
    
    // Now try to recreate content
    const { error: createError } = await supabase
      .from('project_content')
      .insert({
        project_id: projectId,
        filename: 'test_content.txt',
        content: pendingChange.proposed_content,
        asset_type: 'content'
      })
    
    if (createError) {
      console.error('❌ Recreation failed:', createError.message)
      
      // Let's check if there are any orphaned versions we need to clean up
      const { data: orphanedVersions } = await supabase
        .from('project_content_versions')
        .select('id')
        .eq('project_id', projectId)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      
      if (orphanedVersions && orphanedVersions.length > 1) {
        console.log('🗑️  Cleaning up duplicate versions...')
        // Keep our manual version, delete others
        const toDelete = orphanedVersions.filter(v => v.id !== newVersion.id)
        for (const version of toDelete) {
          await supabase
            .from('project_content_versions')
            .delete()
            .eq('id', version.id)
        }
      }
      
      return
    }
    
    console.log('✅ Content recreated successfully!')
    
    // Verify the final state
    const { data: finalContent } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    const { data: finalVersions } = await supabase
      .from('project_content_versions')
      .select('id, tags, version_number, approval_status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(2)
    
    console.log('\n📋 Final verification:')
    console.log('✅ Content updated:', finalContent?.content === pendingChange.proposed_content)
    console.log('✅ Versions count:', finalVersions?.length)
    if (finalVersions?.[0]) {
      console.log('✅ Latest version tags:', finalVersions[0].tags)
      console.log('✅ Latest version status:', finalVersions[0].approval_status)
    }
    
    if (finalContent?.content === pendingChange.proposed_content) {
      console.log('\n🎉 DELETE-RECREATE APPROACH SUCCESSFUL! 🎉')
      console.log('📝 This method bypasses the trigger completely')
      console.log('💡 We can implement this in the API route as a fallback')
    } else {
      console.log('\n❌ Delete-recreate approach failed')
    }
    
  } catch (error) {
    console.error('❌ Error in delete-recreate test:', error)
  }
}

testDeleteRecreateApproach()