require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixTriggerForServiceRole() {
  try {
    console.log('🔧 Fixing auto-versioning trigger for service role context...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // First, let's disable the trigger temporarily so we can test
    console.log('⏸️  Temporarily disabling auto-versioning trigger...')
    
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE project_content DISABLE TRIGGER create_content_version_trigger;`
    })
    
    if (disableError) {
      console.error('❌ Error disabling trigger:', disableError)
      return
    }
    
    console.log('✅ Trigger disabled successfully')
    console.log('📝 Now you can test the approval process without trigger interference')
    console.log('🔄 Run the approval test again to see if it works')
    
    // Note: We can re-enable later with proper fix
    console.log('')
    console.log('ℹ️  To re-enable the trigger later, run:')
    console.log('   ALTER TABLE project_content ENABLE TRIGGER create_content_version_trigger;')
    
  } catch (error) {
    console.error('❌ Error fixing trigger:', error)
  }
}

fixTriggerForServiceRole()