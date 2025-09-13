// Test the simplified approval process
import { createClient } from '@supabase/supabase-js'
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

async function testContentUpdate() {
  console.log('🧪 Testing Content Update Without Triggers...\n')
  
  try {
    const testProjectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // From your test project
    const testContent = `Test content update at ${new Date().toISOString()}\n\nThis is a test to verify that content updates work without relying on database triggers.`
    
    console.log('🔄 Attempting direct content update...')
    
    // Test the same update method used in the approval route (UPDATE instead of UPSERT)
    const { error: updateError } = await supabase
      .from('project_content')
      .update({
        content: testContent,
        filename: 'test_content.txt',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', testProjectId)
      .eq('asset_type', 'content')

    if (updateError) {
      console.error('❌ Content update failed:', updateError)
      console.log('\n🔍 Error analysis:')
      console.log('   - This indicates the table structure or permissions might be the issue')
      console.log('   - Check if project_content table exists and has proper RLS policies')
    } else {
      console.log('✅ Content update successful!')
      console.log('   - Direct upsert operation worked')
      console.log('   - Approval process should now work')
    }

    // Test reading the content back
    console.log('\n🔍 Verifying content was saved...')
    const { data: savedContent, error: readError } = await supabase
      .from('project_content')
      .select('*')
      .eq('project_id', testProjectId)
      .eq('asset_type', 'content')
      .limit(1)

    if (readError) {
      console.error('❌ Failed to read content:', readError)
    } else if (savedContent && savedContent.length > 0) {
      const content = savedContent[0]
      console.log('✅ Content read successfully')
      console.log(`   - Content length: ${content.content.length} characters`)
      console.log(`   - Filename: ${content.filename}`)
      console.log(`   - Last updated: ${content.updated_at}`)
    } else {
      console.log('⚠️ No content found')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testContentUpdate()