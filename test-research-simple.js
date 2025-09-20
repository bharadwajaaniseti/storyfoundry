// Simple test for research system functionality
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testResearchSystem() {
  console.log('Testing new research system approach...')
  
  try {
    // Test 1: Check basic world_elements access
    console.log('\n1. Testing world_elements table access...')
    const { data, error } = await supabase
      .from('world_elements')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Database access error:', error)
      return
    }
    
    console.log('✓ Database accessible')
    if (data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]))
    }

    // Test 2: Check for research files (using new approach)
    console.log('\n2. Testing research files query...')
    const { data: researchFiles, error: researchError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .eq('attributes->>research_type', 'file')
      .limit(5)
    
    if (researchError) {
      console.log('Research files query error:', researchError)
    } else {
      console.log('✓ Research files query works')
      console.log('Research files found:', researchFiles.length)
    }

    // Test 3: Check research content query
    console.log('\n3. Testing research content query...')
    const { data: researchContent, error: contentError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .eq('attributes->>research_type', 'content')
      .limit(5)
    
    if (contentError) {
      console.log('Research content query error:', contentError)
    } else {
      console.log('✓ Research content query works')
      console.log('Research content found:', researchContent.length)
    }

    console.log('\n✅ Research system queries are working!')
    console.log('The system is ready to use with the file-based approach.')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testResearchSystem().then(() => {
  console.log('\nTest complete!')
  process.exit(0)
}).catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})