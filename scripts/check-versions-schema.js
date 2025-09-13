require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkVersionsSchema() {
  try {
    console.log('🔍 Checking project_content_versions table schema...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Get a sample row to see the structure
    const { data: sampleVersion, error } = await supabase
      .from('project_content_versions')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ Error fetching sample version:', error)
      return
    }
    
    console.log('📋 Sample version structure:', Object.keys(sampleVersion))
    console.log('📄 Sample data:', sampleVersion)
    
  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkVersionsSchema()