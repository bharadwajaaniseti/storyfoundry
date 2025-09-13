require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSkipAutoVersion() {
  console.log('🧪 TESTING SKIP AUTO-VERSION MECHANISM')
  console.log('=' .repeat(60))
  
  try {
    // Test if we can call the exec RPC function
    console.log('🔍 Testing set_config function call...')
    
    const { data, error } = await serviceSupabase.rpc('exec', {
      sql: "SELECT set_config('app.skip_auto_version', 'true', true);"
    })
    
    if (error) {
      console.log('❌ RPC exec failed:', error.message)
      console.log('Error details:', error)
      
      // Try alternative approach
      console.log('\n🔄 Trying alternative approach...')
      
      // Method 2: Use a custom function
      const { data: data2, error: error2 } = await serviceSupabase.rpc('set_skip_auto_version', {
        skip_value: true
      })
      
      if (error2) {
        console.log('❌ Custom RPC also failed:', error2.message)
        
        // Method 3: Try using SQL directly
        console.log('\n🔄 Trying direct SQL approach...')
        
        const { data: data3, error: error3 } = await serviceSupabase
          .from('project_content')
          .select('count')
          .limit(0) // This is just to test if we can execute something
        
        console.log('Direct query result:', { data: data3, error: error3?.message })
        
      } else {
        console.log('✅ Custom RPC worked:', data2)
      }
      
    } else {
      console.log('✅ RPC exec worked:', data)
    }
    
    console.log('\n✅ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testSkipAutoVersion()