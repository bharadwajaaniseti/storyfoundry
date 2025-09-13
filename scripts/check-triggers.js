require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTriggers() {
  console.log('🔍 CHECKING TRIGGERS ON project_content TABLE')
  console.log('=' .repeat(60))
  
  try {
    // Query system tables to see what triggers exist
    const { data, error } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT 
          t.trigger_name,
          t.event_manipulation,
          t.action_timing,
          t.action_statement
        FROM information_schema.triggers t
        WHERE t.event_object_table = 'project_content'
        AND t.event_object_schema = 'public';
      `
    })
    
    if (error) {
      console.log('❌ Query failed:', error.message)
      
      // Try a simpler approach
      console.log('\n🔄 Trying alternative query...')
      
      // Check if we can query the project_content table at all
      const { data: tableData, error: tableError } = await serviceSupabase
        .from('project_content')
        .select('count')
        .limit(0)
      
      if (tableError) {
        console.log('❌ Cannot access project_content table:', tableError.message)
      } else {
        console.log('✅ project_content table is accessible')
        
        // Try to check triggers differently
        console.log('\n📋 Let me check if the trigger exists by testing it...')
        
        // Try a simple insert that should trigger the versioning
        const testProjectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
        
        const { error: testError } = await serviceSupabase
          .from('project_content')
          .insert({
            project_id: testProjectId,
            filename: 'test_trigger.txt',
            content: 'Test content to check if trigger fires',
            asset_type: 'test'
          })
        
        if (testError) {
          console.log('🔍 Insert failed:', testError.message)
          
          if (testError.message.includes('user_id')) {
            console.log('✅ Trigger IS active (user_id constraint triggered)')
          } else {
            console.log('❓ Different error - trigger status unclear')
          }
        } else {
          console.log('✅ Insert succeeded - trigger might not be active or working')
        }
      }
    } else {
      console.log('✅ Triggers found:')
      console.table(data)
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkTriggers()