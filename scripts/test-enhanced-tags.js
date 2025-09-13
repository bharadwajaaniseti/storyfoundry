require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEnhancedTagging() {
  console.log('🎨 TESTING ENHANCED TAG SYSTEM')
  console.log('=' .repeat(60))
  
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8'
  
  try {
    // Get the latest versions with their tags
    const { data: versions, error } = await serviceSupabase
      .from('project_content_versions')
      .select('version_number, tags, change_summary, word_count, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching versions:', error)
      return
    }
    
    console.log('📊 LATEST VERSIONS WITH ENHANCED TAGS:')
    console.log('')
    
    versions.forEach((version, index) => {
      console.log(`🔸 Version ${version.version_number}`)
      console.log(`   📅 Created: ${new Date(version.created_at).toLocaleString()}`)
      console.log(`   📝 Summary: ${version.change_summary || 'No summary'}`)
      console.log(`   📊 Words: ${version.word_count}`)
      
      if (version.tags && version.tags.length > 0) {
        console.log(`   🏷️  Tags: ${version.tags.join(', ')}`)
        
        // Show what colors these tags would get
        version.tags.forEach(tag => {
          const color = getTagColor(tag)
          console.log(`      • ${tag} → ${color}`)
        })
      } else {
        console.log(`   🏷️  Tags: None`)
      }
      console.log('')
    })
    
    console.log('🎨 TAG COLOR SYSTEM TEST:')
    console.log('')
    
    const testTags = [
      'Approved', 'Dual Storage', 'Auto Synced', 'Collaborator Edit',
      '+25 words', '-10 words', 'Major Edit', 'Minor Edit',
      'Projects Table', 'Synced', 'Initial Content'
    ]
    
    testTags.forEach(tag => {
      const color = getTagColor(tag)
      console.log(`🎯 "${tag}" → ${color}`)
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Helper function to determine tag colors (matches the React component logic)
function getTagColor(tag) {
  const tagLower = tag.toLowerCase()
  
  if (tagLower.includes('approved')) return 'GREEN (success)'
  if (tagLower.includes('dual storage')) return 'PURPLE (storage)'
  if (tagLower.includes('synced') || tagLower.includes('auto synced')) return 'BLUE (sync)'
  if (tagLower.includes('collaborator edit')) return 'ORANGE (collaboration)'
  if (tagLower.includes('projects table')) return 'INDIGO (primary)'
  if (tagLower.includes('major edit')) return 'PINK (major)'
  if (tagLower.includes('minor edit')) return 'CYAN (minor)'
  if (tagLower.includes('+') && tagLower.includes('words')) return 'EMERALD (addition)'
  if (tagLower.includes('-') && tagLower.includes('words')) return 'AMBER (reduction)'
  if (tagLower.includes('initial content')) return 'SLATE (initial)'
  
  return 'GRAY (default)'
}

testEnhancedTagging()