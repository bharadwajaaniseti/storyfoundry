require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSyncStatus() {
  const projectId = '53b039ea-92ff-4bd8-84a8-4b2fbe1de0a8' // Test Project for Collab
  
  console.log('🔍 CONTENT SYNCHRONIZATION STATUS CHECK')
  console.log('=' .repeat(60))
  
  try {
    // Get content from both sources
    const [projectResult, contentResult] = await Promise.all([
      supabase
        .from('projects')
        .select('synopsis, updated_at, title')
        .eq('id', projectId)
        .single(),
      supabase
        .from('project_content')
        .select('content, updated_at')
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
        .single()
    ])

    const projectData = projectResult.data
    const contentData = contentResult.data

    console.log('📋 PROJECT:', projectData?.title || 'Unknown')
    console.log()

    // Check if both sources exist
    const hasProjectSynopsis = !!(projectData?.synopsis)
    const hasProjectContent = !!(contentData?.content)

    console.log('📊 STORAGE STATUS:')
    console.log('   projects.synopsis:', hasProjectSynopsis ? '✅ EXISTS' : '❌ MISSING')
    console.log('   project_content:', hasProjectContent ? '✅ EXISTS' : '❌ MISSING')
    console.log()

    if (hasProjectSynopsis && hasProjectContent) {
      // Both exist - check if they're synchronized
      const synopsisContent = projectData.synopsis
      const tableContent = contentData.content
      
      const synopsisTime = new Date(projectData.updated_at)
      const contentTime = new Date(contentData.updated_at)
      
      console.log('📏 CONTENT COMPARISON:')
      console.log('   projects.synopsis:')
      console.log('     Length:', synopsisContent.length, 'characters')
      console.log('     Updated:', synopsisTime.toISOString())
      console.log('     Preview:', synopsisContent.substring(0, 80) + '...')
      console.log()
      console.log('   project_content:')
      console.log('     Length:', tableContent.length, 'characters')
      console.log('     Updated:', contentTime.toISOString())
      console.log('     Preview:', tableContent.substring(0, 80) + '...')
      console.log()

      // Check synchronization status
      const contentMatches = synopsisContent === tableContent
      const timeDiff = Math.abs(synopsisTime.getTime() - contentTime.getTime())
      const timeSync = timeDiff < 5000 // Within 5 seconds

      console.log('🔄 SYNCHRONIZATION STATUS:')
      console.log('   Content matches:', contentMatches ? '✅ SYNCHRONIZED' : '❌ OUT OF SYNC')
      console.log('   Time difference:', Math.round(timeDiff / 1000), 'seconds')
      console.log('   Time sync:', timeSync ? '✅ RECENT' : '⚠️  TIME GAP')
      console.log()

      if (contentMatches && timeSync) {
        console.log('🎉 PERFECT SYNC: Both sources have identical, recent content!')
        console.log('💡 The dual storage approach is working perfectly.')
      } else if (contentMatches) {
        console.log('✅ CONTENT SYNC: Content matches but timestamps differ')
        console.log('💡 This is normal - content is synchronized.')
      } else {
        console.log('⚠️  SYNC ISSUE: Content differs between sources')
        console.log('💡 Using the more recent content source.')
        
        if (synopsisTime > contentTime) {
          console.log('🎯 ACTIVE SOURCE: projects.synopsis (newer)')
        } else {
          console.log('🎯 ACTIVE SOURCE: project_content (newer)')
        }
      }
      
    } else if (hasProjectSynopsis && !hasProjectContent) {
      console.log('📍 SINGLE STORAGE MODE:')
      console.log('   Content stored only in projects.synopsis')
      console.log('   Length:', projectData.synopsis.length, 'characters')
      console.log('   Updated:', projectData.updated_at)
      console.log('   Status: ✅ WORKING (Primary storage)')
      console.log()
      console.log('💡 This is the expected fallback when project_content sync fails.')
      
    } else if (!hasProjectSynopsis && hasProjectContent) {
      console.log('📍 LEGACY MODE:')
      console.log('   Content stored only in project_content')
      console.log('   Length:', contentData.content.length, 'characters')
      console.log('   Updated:', contentData.updated_at)
      console.log('   Status: ✅ WORKING (Legacy storage)')
      
    } else {
      console.log('❌ NO CONTENT FOUND:')
      console.log('   Neither storage location has content')
      console.log('   This indicates a problem with the project setup')
    }

    // Check latest version for additional context
    console.log('\n📚 LATEST VERSION INFO:')
    const { data: latestVersion } = await supabase
      .from('project_content_versions')
      .select('version_number, tags, reviewer_notes, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (latestVersion) {
      console.log('   Version:', latestVersion.version_number)
      console.log('   Tags:', latestVersion.tags)
      console.log('   Notes:', latestVersion.reviewer_notes)
      console.log('   Created:', latestVersion.created_at)
      
      // Decode the sync status from version tags
      if (latestVersion.tags?.includes('Dual Storage')) {
        console.log('   Sync Status: ✅ DUAL STORAGE (Both locations)')
      } else if (latestVersion.tags?.includes('Projects Table')) {
        console.log('   Sync Status: ⚠️  SINGLE STORAGE (projects.synopsis only)')
      } else {
        console.log('   Sync Status: ❓ UNKNOWN (Check tags)')
      }
    } else {
      console.log('   No version records found')
    }

    console.log('\n' + '=' .repeat(60))
    console.log('✅ Sync status check completed!')

  } catch (error) {
    console.error('❌ Error checking sync status:', error)
  }
}

checkSyncStatus().catch(console.error)