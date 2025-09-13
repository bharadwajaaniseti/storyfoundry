require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkTrigger() {
  try {
    console.log('🔍 Checking auto-versioning trigger...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Get trigger information
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'project_content'
        AND trigger_name LIKE '%version%'
      `
    })
    
    if (error) {
      console.error('❌ Error querying triggers:', error)
      return
    }
    
    console.log('📋 Found triggers:', data)
    
    // Check the trigger function
    const { data: functionData, error: functionError } = await supabase.rpc('sql', {
      query: `
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE routine_name = 'create_content_version'
      `
    })
    
    if (functionError) {
      console.error('❌ Error querying function:', functionError)
    } else {
      console.log('📄 Trigger function definition:', functionData)
    }
    
  } catch (error) {
    console.error('❌ Error checking trigger:', error)
  }
}

checkTrigger()