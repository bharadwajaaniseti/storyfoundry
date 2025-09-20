// Test script to debug research system
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testResearchQueries() {
  console.log('Testing research system queries...')
  
  // Test 1: Check if world_elements table exists and has research items
  console.log('\n1. Checking world_elements table structure...')
  try {
    const { data, error } = await supabase
      .from('world_elements')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error querying world_elements:', error)
    } else {
      console.log('Sample world_elements records:', data.length)
      if (data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]))
        console.log('Sample record:', data[0])
      } else {
        // Try to get table schema by checking describe
        console.log('No records found, checking table schema...')
        const { data: schemaData, error: schemaError } = await supabase
          .from('world_elements')
          .select('*')
          .limit(0)
        console.log('Schema error (if any):', schemaError)
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }

  // Test 2: Check for research category items
  console.log('\n2. Checking for research category items...')
  try {
    const { data, error } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .limit(10)
    
    if (error) {
      console.error('Error querying research items:', error)
    } else {
      console.log('Research items found:', data.length)
      data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (parent_id: ${item.parent_id})`)
      })
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }

  // Test 3: Check for research files (no parent_id)
  console.log('\n3. Checking for research files - checking what columns exist...')
  try {
    // First let's try without parent_id to see table structure
    const { data, error } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .limit(5)
    
    if (error) {
      console.error('Error querying research files:', error)
    } else {
      console.log('Research items found:', data.length)
      if (data.length > 0) {
        console.log('Columns in research items:', Object.keys(data[0]))
        data.forEach((file, index) => {
          console.log(`  ${index + 1}. "${file.name}" (ID: ${file.id})`)
        })
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }

  // Test 4: Check user authentication
  console.log('\n4. Checking user authentication...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
    } else if (user) {
      console.log('User authenticated:', user.email)
    } else {
      console.log('No user authenticated')
    }
  } catch (err) {
    console.error('Unexpected auth error:', err)
  }
}

// Run the tests
testResearchQueries().then(() => {
  console.log('\nTesting complete!')
  process.exit(0)
}).catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})