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

async function fixApiDirectly() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
  
  try {
    console.log('🔧 Getting pending changes directly from table...')
    
    // Get pending changes directly without using the problematic function
    const { data: pendingChanges, error } = await supabase
      .from('pending_editor_changes')
      .select(`
        *,
        editor:profiles!pending_editor_changes_editor_id_fkey(display_name, first_name, last_name, avatar_url),
        project:projects!pending_editor_changes_project_id_fkey(title)
      `)
      .eq('project_id', projectId)
      .in('status', ['pending', 'needs_revision'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Success! Found', pendingChanges?.length || 0, 'pending changes')
    
    if (pendingChanges && pendingChanges.length > 0) {
      pendingChanges.forEach((change, index) => {
        console.log(`\n📝 Change ${index + 1}:`)
        console.log(`   ID: ${change.id}`)
        console.log(`   Type: ${change.content_type}`)
        console.log(`   Title: ${change.content_title || 'N/A'}`)
        console.log(`   Editor: ${change.editor?.display_name || `${change.editor?.first_name} ${change.editor?.last_name}`.trim() || 'Unknown'}`)
        console.log(`   Status: ${change.status}`)
        console.log(`   Description: ${change.change_description || 'N/A'}`)
        console.log(`   Created: ${change.created_at}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixApiDirectly()