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

console.log('🔍 Checking pending editor changes...')

async function checkPendingChanges() {
  try {
    // Check if table exists and has data
    const { data: pendingChanges, error: changesError } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📝 Pending editor changes table query result:')
    console.log('Error:', changesError)
    console.log('Data count:', pendingChanges?.length || 0)
    
    if (pendingChanges && pendingChanges.length > 0) {
      console.log('📋 Pending changes:')
      pendingChanges.forEach((change, index) => {
        console.log(`  ${index + 1}. ID: ${change.id}`)
        console.log(`     Project: ${change.project_id}`)
        console.log(`     Status: ${change.status}`)
        console.log(`     Content Type: ${change.content_type}`)
        console.log(`     Created: ${change.created_at}`)
        console.log('')
      })
    } else {
      console.log('📭 No pending editor changes found')
    }

    // Test the database function
    console.log('\n🔧 Testing get_pending_editor_changes function...')
    const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Your project ID
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_pending_editor_changes', {
        p_project_id: projectId
      })
    
    console.log('Function error:', functionError)
    console.log('Function result:', functionResult)

  } catch (error) {
    console.error('❌ Error checking database:', error)
  }
}

checkPendingChanges()