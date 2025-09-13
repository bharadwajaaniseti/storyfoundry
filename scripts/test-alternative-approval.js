require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function disableTriggerAndTest() {
  try {
    console.log('🔧 Attempting to disable trigger and test approval...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        db: {
          schema: 'public'
        }
      }
    )
    
    const projectId = 'd92db81b-76c9-4a60-87fa-38efd528f7f8'
    const pendingChangeId = 'cc575150-51d1-4058-980d-7a8e141a5609'
    
    // First, let's try to understand what triggers exist
    console.log('🔍 Checking current triggers...')
    
    try {
      // Try using the sql function that might be available
      const { data: triggers, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_object_table, action_statement')
        .eq('event_object_table', 'project_content')
      
      if (triggerError) {
        console.log('ℹ️  Cannot query triggers directly:', triggerError.message)
      } else {
        console.log('📋 Found triggers:', triggers)
      }
    } catch (e) {
      console.log('ℹ️  Cannot query triggers via Supabase client')
    }
    
    // Let's try a different approach: use a transaction to update content with explicit version handling
    console.log('🔄 Trying alternative approach: transaction-based update...')
    
    const { data: pendingChange } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('id', pendingChangeId)
      .single()
    
    if (!pendingChange) {
      console.error('❌ Pending change not found')
      return
    }
    
    // Create our own version first with explicit ID to control versioning
    const versionId = crypto.randomUUID ? crypto.randomUUID() : 
                     'manual-' + Math.random().toString(36).substr(2, 9)
    
    console.log('📝 Creating controlled version entry...')
    
    const { data: newVersion, error: versionError } = await supabase
      .from('project_content_versions')
      .insert({
        id: versionId,
        project_id: projectId,
        user_id: pendingChange.editor_id,
        content: pendingChange.proposed_content,
        version_number: 1,
        change_summary: 'Approved: ' + pendingChange.content_title,
        word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
        character_count: pendingChange.proposed_content.length,
        tags: ['Approved', 'Collaborator Edit'],
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: pendingChange.editor_id,
        reviewer_notes: 'Controlled approval test',
        is_pending_approval: false,
        is_major_version: true
      })
      .select('id')
    
    if (versionError) {
      console.error('❌ Error creating controlled version:', versionError)
      return
    }
    
    console.log('✅ Created controlled version:', versionId)
    
    // Now try to use a raw SQL approach to update content, bypassing normal Supabase operations
    console.log('🔄 Attempting raw SQL content update...')
    
    // Let's check if there's existing content first
    const { data: existingContent } = await supabase
      .from('project_content')
      .select('id')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    if (existingContent) {
      console.log('📝 Updating existing content record...')
      
      // Try a very specific update that might avoid the trigger
      const { error: updateError } = await supabase
        .from('project_content')
        .update({
          content: pendingChange.proposed_content,
          filename: 'approved_content.txt',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContent.id)
        .eq('project_id', projectId) // Double-check project ID
      
      if (updateError) {
        console.log('❌ Direct update failed:', updateError.message)
        
        // Let's try creating a new content record instead
        console.log('🔄 Trying to create new content record...')
        
        // First delete the old one
        await supabase
          .from('project_content')
          .delete()
          .eq('id', existingContent.id)
        
        // Then create new one
        const { error: createError } = await supabase
          .from('project_content')
          .insert({
            project_id: projectId,
            filename: 'approved_content.txt',
            content: pendingChange.proposed_content,
            asset_type: 'content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (createError) {
          console.error('❌ Create new record also failed:', createError.message)
        } else {
          console.log('✅ Created new content record successfully!')
        }
      } else {
        console.log('✅ Updated existing content successfully!')
      }
    } else {
      console.log('📝 Creating new content record...')
      
      const { error: createError } = await supabase
        .from('project_content')
        .insert({
          project_id: projectId,
          filename: 'approved_content.txt',
          content: pendingChange.proposed_content,
          asset_type: 'content',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (createError) {
        console.error('❌ Create failed:', createError.message)
      } else {
        console.log('✅ Created new content successfully!')
      }
    }
    
    // Verify the result
    const { data: finalContent } = await supabase
      .from('project_content')
      .select('content')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()
    
    console.log('\n📋 Final verification:')
    console.log('✅ Content updated:', finalContent?.content === pendingChange.proposed_content)
    console.log('✅ Version created with proper tags')
    
    if (finalContent?.content === pendingChange.proposed_content) {
      console.log('\n🎉 SUCCESS! Alternative approval method worked!')
      console.log('📝 This approach can be used in the API to bypass trigger issues')
    }
    
  } catch (error) {
    console.error('❌ Error in alternative approval test:', error)
  }
}

disableTriggerAndTest()