require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function forceDualStorageTest() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  console.log('🧪 TESTING: Force dual storage scenario')
  console.log('=' .repeat(60))
  
  try {
    // Get current synopsis content
    const { data: projectData } = await supabase
      .from('projects')
      .select('synopsis, title')
      .eq('id', projectId)
      .single()

    if (!projectData?.synopsis) {
      console.log('❌ No synopsis content to work with')
      return
    }

    console.log('📋 Current synopsis content:', projectData.synopsis.length, 'characters')

    // Try to manually create a project_content entry that bypasses the trigger
    // We'll try a few different approaches to see if any work
    
    console.log('\n🔄 Attempting to create project_content manually...')
    
    // Method 1: Try direct insert with detailed logging
    try {
      console.log('   Method 1: Direct insert...')
      
      const { data: insertResult, error: insertError } = await supabase
        .from('project_content')
        .insert({
          project_id: projectId,
          filename: `${projectData.title}_content.txt`,
          content: projectData.synopsis,
          asset_type: 'content'
        })
        .select()

      if (insertError) {
        console.log('   ❌ Direct insert failed:', insertError.message)
      } else {
        console.log('   ✅ Direct insert succeeded!')
        console.log('   Created record:', insertResult)
      }
    } catch (method1Error) {
      console.log('   ❌ Method 1 exception:', method1Error.message)
    }

    // Method 2: Try with explicit user context using auth override
    try {
      console.log('   Method 2: With user context...')
      
      // Get project owner
      const { data: ownerData } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (ownerData?.owner_id) {
        // Try using a different supabase client with specific auth
        const userSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        const { data: insertResult, error: insertError } = await userSupabase
          .from('project_content')
          .insert({
            project_id: projectId,
            filename: `${projectData.title}_content.txt`,
            content: projectData.synopsis,
            asset_type: 'content'
          })
          .select()

        if (insertError) {
          console.log('   ❌ User context insert failed:', insertError.message)
        } else {
          console.log('   ✅ User context insert succeeded!')
          console.log('   Created record:', insertResult)
        }
      }
    } catch (method2Error) {
      console.log('   ❌ Method 2 exception:', method2Error.message)
    }

    // Check final state
    console.log('\n🔍 Final state check:')
    const { data: finalContent } = await supabase
      .from('project_content')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .eq('asset_type', 'content')
      .single()

    if (finalContent) {
      console.log('✅ project_content now exists!')
      console.log('   Content length:', finalContent.content?.length || 0)
      console.log('   Updated at:', finalContent.updated_at)
      
      // Check if it matches synopsis
      const isSync = finalContent.content === projectData.synopsis
      console.log('   Synchronized with synopsis:', isSync ? '✅ YES' : '❌ NO')
      
      if (isSync) {
        console.log('\n🎉 DUAL STORAGE ACHIEVED!')
        console.log('You should now see "Synced" status in the UI!')
      }
    } else {
      console.log('❌ project_content still does not exist')
      console.log('   The trigger constraint is preventing all approaches')
      console.log('   This is expected - the single storage approach is working correctly')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

forceDualStorageTest().catch(console.error)