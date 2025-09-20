// Migration script to add parent_id support to world_elements table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for DDL operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('Running migration to add hierarchical support to world_elements...')
  
  try {
    // Add parent_id column
    console.log('1. Adding parent_id column...')
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE world_elements 
        ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES world_elements(id) ON DELETE CASCADE;
      `
    })
    
    if (error1) {
      console.error('Error adding parent_id column:', error1)
      return
    }
    console.log('✓ parent_id column added')

    // Add index
    console.log('2. Adding index for parent_id...')
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_world_elements_parent_id ON world_elements(parent_id);
      `
    })
    
    if (error2) {
      console.error('Error adding index:', error2)
      return
    }
    console.log('✓ Index added')

    // Add additional columns
    console.log('3. Adding content, file_url, and is_favorite columns...')
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE world_elements 
        ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS file_url TEXT,
        ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
      `
    })
    
    if (error3) {
      console.error('Error adding additional columns:', error3)
      return
    }
    console.log('✓ Additional columns added')

    console.log('\n✅ Migration completed successfully!')
    console.log('The world_elements table now supports hierarchical structure for research files.')
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Check if exec_sql RPC function exists, if not suggest alternative
async function checkRPCFunction() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  if (error && error.message.includes('function') && error.message.includes('does not exist')) {
    console.log('exec_sql RPC function not available. Let me try direct SQL execution...')
    return false
  }
  return true
}

async function runDirectSQL() {
  console.log('Attempting direct SQL migration...')
  
  try {
    // Try to add columns using individual queries
    const queries = [
      'ALTER TABLE world_elements ADD COLUMN IF NOT EXISTS parent_id UUID',
      'ALTER TABLE world_elements ADD COLUMN IF NOT EXISTS content TEXT DEFAULT \'\'',
      'ALTER TABLE world_elements ADD COLUMN IF NOT EXISTS file_url TEXT',
      'ALTER TABLE world_elements ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false',
      'CREATE INDEX IF NOT EXISTS idx_world_elements_parent_id ON world_elements(parent_id)'
    ]
    
    for (const query of queries) {
      console.log(`Executing: ${query}`)
      const { error } = await supabase.from('world_elements').select('id').limit(0)
      // This is a workaround since we can't execute DDL directly
      console.log('Note: DDL operations require service role or database admin access')
    }
    
  } catch (error) {
    console.error('Direct SQL failed:', error)
  }
}

// Run the migration
checkRPCFunction().then(hasRPC => {
  if (hasRPC) {
    runMigration()
  } else {
    console.log('Unable to execute DDL operations. Need to apply migration through Supabase dashboard.')
    console.log('\nPlease run this SQL in your Supabase SQL Editor:')
    console.log(`
-- Add hierarchical support to world_elements table
ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES world_elements(id) ON DELETE CASCADE;

ALTER TABLE world_elements 
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_world_elements_parent_id ON world_elements(parent_id);
    `)
  }
}).catch(console.error)