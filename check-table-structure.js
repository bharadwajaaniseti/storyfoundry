// Check the structure of pending_editor_changes table
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 Checking pending_editor_changes table structure...\n')
  
  try {
    // Get existing records to see the structure
    const { data: existing } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('📋 Existing record structure:')
      console.log(JSON.stringify(existing[0], null, 2))
    } else {
      console.log('📋 No existing records found')
    }

    // Try creating a minimal record
    console.log('\n🧪 Attempting minimal insert...')
    const { data: minimal, error: minimalError } = await supabase
      .from('pending_editor_changes')
      .insert({
        project_id: '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8',
        editor_id: '919cf6f2-70d6-4be7-82f8-1d1093c89cec',
        content_type: 'project_content',
        original_content: 'Test original',
        proposed_content: 'Test proposed',
        status: 'pending'
      })
      .select()

    if (minimalError) {
      console.error('❌ Minimal insert failed:', minimalError)
    } else {
      console.log('✅ Minimal insert successful:', minimal)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTableStructure()