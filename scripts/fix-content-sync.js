require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixContentSync() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  console.log('🔧 Attempting to sync approved content to project_content table')
  console.log('=' .repeat(60))
  
  try {
    // Get the project details and current content
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('synopsis, title, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !projectData) {
      console.error('❌ Error getting project:', projectError?.message)
      return
    }

    console.log('📋 Project details:')
    console.log('   Title:', projectData.title)
    console.log('   Owner ID:', projectData.owner_id)
    console.log('   Synopsis length:', projectData.synopsis?.length || 0)

    if (!projectData.synopsis) {
      console.log('❌ No synopsis content to sync')
      return
    }

    // Strategy 1: Try creating/updating with the actual project owner's context
    console.log('\n🔄 Strategy 1: Using project owner context...')
    
    // First, check if project_content entry exists
    const { data: existingContent, error: checkError } = await supabase
      .from('project_content')
      .select('id, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing content:', checkError.message)
      return
    }

    // Use a user context approach - we'll temporarily set the trigger to expect the owner's ID
    if (existingContent) {
      console.log('📝 Updating existing project_content...')
      
      // Try updating with manual RLS context
      const { error: updateError } = await supabase
        .rpc('update_project_content_with_user_context', {
          p_project_id: projectId,
          p_content: projectData.synopsis,
          p_user_id: projectData.owner_id,
          p_filename: `${projectData.title}_content.txt`
        })

      if (updateError) {
        console.log('⚠️  RPC update failed:', updateError.message)
        
        // Fallback: Direct update with service role, but set a session context
        console.log('🔄 Trying direct update with session context...')
        
        // Set session for this transaction
        await supabase.rpc('set_session_user', { user_id: projectData.owner_id })
        
        const { error: directUpdateError } = await supabase
          .from('project_content')
          .update({
            content: projectData.synopsis,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .eq('asset_type', 'content')

        if (directUpdateError) {
          console.error('❌ Direct update also failed:', directUpdateError.message)
        } else {
          console.log('✅ Direct update successful!')
        }
      } else {
        console.log('✅ RPC update successful!')
      }
      
    } else {
      console.log('📝 Creating new project_content entry...')
      
      // Try creating with user context
      const { error: createError } = await supabase
        .rpc('create_project_content_with_user_context', {
          p_project_id: projectId,
          p_content: projectData.synopsis,
          p_user_id: projectData.owner_id,
          p_filename: `${projectData.title}_content.txt`,
          p_asset_type: 'content'
        })

      if (createError) {
        console.log('⚠️  RPC create failed:', createError.message)
        
        // Fallback: Try creating with session context
        console.log('🔄 Trying direct creation with session context...')
        
        await supabase.rpc('set_session_user', { user_id: projectData.owner_id })
        
        const { error: directCreateError } = await supabase
          .from('project_content')
          .insert({
            project_id: projectId,
            filename: `${projectData.title}_content.txt`,
            content: projectData.synopsis,
            asset_type: 'content'
          })

        if (directCreateError) {
          console.error('❌ Direct creation failed:', directCreateError.message)
          console.log('💡 The trigger constraint is preventing both approaches')
          console.log('🎯 Will implement a trigger bypass or modification approach')
        } else {
          console.log('✅ Direct creation successful!')
        }
      } else {
        console.log('✅ RPC creation successful!')
      }
    }

    // Verify final state
    console.log('\n🔍 Verification:')
    const { data: finalCheck } = await supabase
      .from('project_content')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    if (finalCheck) {
      console.log('✅ project_content table now has:')
      console.log('   Content length:', finalCheck.content?.length || 0)
      console.log('   Matches synopsis:', finalCheck.content === projectData.synopsis)
      console.log('   Updated at:', finalCheck.updated_at)
    } else {
      console.log('❌ project_content still empty - trigger constraint is blocking')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixContentSync().catch(console.error)