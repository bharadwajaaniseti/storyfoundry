// Apply the RPC function directly to database
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
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

async function applyRpcFunction() {
  console.log('🔧 Applying RPC function for content updates without versioning...\n')
  
  try {
    // Read the SQL file
    const sql = readFileSync('add-rpc-function.sql', 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_statement: sql })
    
    if (error && error.message.includes('does not exist')) {
      // Try a different approach - execute directly
      console.log('🔄 Trying direct execution...')
      
      const { error: directError } = await supabase
        .from('pg_stat_user_functions') // This will fail but we can catch it
        .select('*')
        .limit(1)
      
      console.log('❌ Cannot execute SQL directly via client')
      console.log('Please run the following SQL in your Supabase SQL editor:')
      console.log('\n--- Copy and paste this SQL ---')
      console.log(sql)
      console.log('--- End of SQL ---\n')
      
    } else if (error) {
      console.error('❌ Error applying RPC function:', error)
    } else {
      console.log('✅ RPC function applied successfully')
    }
    
    // Test if the function now exists
    console.log('\n🧪 Testing RPC function...')
    const { error: testError } = await supabase.rpc('update_content_without_versioning', {
      p_project_id: '00000000-0000-0000-0000-000000000000',
      p_content: 'test',
      p_filename: 'test.txt'
    })
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ Function still not found')
    } else {
      console.log('✅ Function is now accessible')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    
    // Show the SQL for manual application
    const sql = readFileSync('add-rpc-function.sql', 'utf8')
    console.log('\n📋 Please apply this SQL manually in Supabase dashboard:')
    console.log('\n--- SQL to apply manually ---')
    console.log(sql)
    console.log('--- End of SQL ---')
  }
}

applyRpcFunction()