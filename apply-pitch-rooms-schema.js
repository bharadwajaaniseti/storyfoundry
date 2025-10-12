const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
  console.log('📚 Applying Pitch Rooms schema...')
  
  try {
    const sqlPath = path.join(__dirname, 'create-pitch-rooms-schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by statement (basic approach - you might need to adjust this)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct execution for CREATE statements
          const { error: directError } = await supabase.from('_').select('*').limit(0)
          console.log(`Statement ${i + 1}: Attempting direct execution`)
          
          // Since we can't execute DDL directly via JS client, we'll need to use the SQL editor
          console.log(`⚠️  Statement ${i + 1}: Please execute manually in Supabase SQL editor`)
          console.log(statement.substring(0, 100) + '...')
        } else {
          console.log(`✅ Statement ${i + 1}: Success`)
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`)
      }
    }
    
    console.log('\n📝 Schema application complete!')
    console.log('\n⚠️  IMPORTANT: You need to manually run the SQL file in Supabase SQL Editor:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of create-pitch-rooms-schema.sql')
    console.log('4. Click "Run" to execute all statements')
    
  } catch (error) {
    console.error('❌ Error applying schema:', error)
    process.exit(1)
  }
}

applySchema()
