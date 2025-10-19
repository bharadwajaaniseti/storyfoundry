// Apply screenplay elements public access fix
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('Applying screenplay elements public access fix...\n')
  
  const sqlFile = path.join(__dirname, 'supabase', 'migrations', '20250129000000_fix_screenplay_elements_public_access.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  // Split by statement (simple split by semicolon)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`Found ${statements.length} SQL statements to execute\n`)
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue
    
    console.log(`[${i + 1}/${statements.length}] Executing statement...`)
    
    try {
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: statement + ';' })
      })
      
      if (!response.ok) {
        // Try alternative approach using pg admin
        const { data, error } = await supabase.rpc('exec', { query: statement + ';' })
        
        if (error) {
          console.log('   ⚠️  Cannot execute via RPC, statement needs manual application:')
          console.log('   ' + statement.substring(0, 80) + '...')
        } else {
          console.log('   ✓ Success')
        }
      } else {
        console.log('   ✓ Success')
      }
    } catch (err) {
      console.log('   ⚠️  Error:', err.message)
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('Migration file created. Please apply it manually:')
  console.log('='.repeat(70))
  console.log('\n1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the following SQL:\n')
  console.log(sql)
  console.log('\n' + '='.repeat(70))
}

runMigration().catch(console.error)
