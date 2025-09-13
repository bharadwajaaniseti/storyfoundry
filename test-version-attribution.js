// Test script for version attribution workflow
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVersionAttribution() {
  console.log('🧪 Testing Version Attribution Workflow...\n')
  
  try {
    // Get a project with collaborators for testing
    const { data: project } = await supabase
      .from('projects')
      .select(`
        id, 
        title,
        project_collaborators(user_id, role, profiles(display_name))
      `)
      .not('project_collaborators', 'is', null)
      .limit(1)
      .single()

    if (!project) {
      console.log('❌ No projects with collaborators found for testing')
      return
    }

    console.log(`📝 Using project: ${project.title} (${project.id})`)
    
    // Find an editor collaborator
    const editor = project.project_collaborators.find(c => c.role === 'editor')
    if (!editor) {
      console.log('❌ No editor collaborators found')
      return
    }

    console.log(`👤 Editor: ${editor.profiles.display_name} (${editor.user_id})`)

    // Check for any existing "Pending Review" versions
    const { data: pendingVersions } = await supabase
      .from('project_content_versions')
      .select('id, tags, user_id, created_at, change_summary, version_number')
      .eq('project_id', project.id)
      .contains('tags', ['Pending Review'])
      .order('created_at', { ascending: false })

    console.log(`\n📋 Pending Versions Check:`)
    if (pendingVersions && pendingVersions.length > 0) {
      console.log(`   Found ${pendingVersions.length} pending version(s):`)
      pendingVersions.forEach((v, i) => {
        console.log(`   ${i + 1}. Version ${v.version_number} (${v.id}) by ${v.user_id}`)
        console.log(`      Tags: ${v.tags.join(', ')} - ${v.change_summary}`)
      })
    } else {
      console.log('   ✅ No pending versions found')
    }

    // Check recent versions for attribution pattern
    const { data: recentVersions } = await supabase
      .from('project_content_versions')
      .select(`
        id, 
        user_id, 
        tags, 
        change_summary, 
        version_number,
        created_at,
        profiles(display_name)
      `)
      .eq('project_id', project.id)
      .order('version_number', { ascending: false })
      .limit(8)

    console.log(`\n📊 Recent Version Attribution Analysis:`)
    if (recentVersions && recentVersions.length > 0) {
      recentVersions.forEach((v, i) => {
        const authorName = v.profiles?.display_name || 'Unknown'
        const tagStr = v.tags ? v.tags.join(', ') : 'None'
        const isProblematic = v.tags && v.tags.includes('Approved') && authorName !== editor.profiles.display_name
        const statusIcon = isProblematic ? '⚠️' : '✅'
        
        console.log(`   ${statusIcon} V${v.version_number}: ${v.change_summary} by ${authorName}`)
        console.log(`      Tags: ${tagStr}`)
        console.log(`      Created: ${new Date(v.created_at).toLocaleString()}`)
        
        if (isProblematic) {
          console.log(`      🔍 ISSUE: Approved version attributed to non-editor`)
        }
      })
    }

    // Test the RPC function exists
    console.log(`\n� Testing RPC Function:`)
    try {
      const { data, error } = await supabase.rpc('update_content_without_versioning', {
        p_project_id: '00000000-0000-0000-0000-000000000000', // fake ID for test
        p_content: 'test content',
        p_filename: 'test.txt'
      })
      
      if (error && error.message.includes('does not exist')) {
        console.log('   ❌ RPC function not found - migration may not be applied')
      } else {
        console.log('   ✅ RPC function exists and accessible')
      }
    } catch (rpcError) {
      console.log(`   ⚠️ RPC test result: ${rpcError.message}`)
    }

    console.log('\n✅ Version attribution workflow analysis completed')
    console.log('\n💡 Expected behavior after fix:')
    console.log('   1. Editor submits → Version X created with "Pending Review" tag, authored by Editor')
    console.log('   2. Owner approves → Version X tags updated to "Approved" + "Collaborator Edit", still authored by Editor')
    console.log('   3. NO Version X+1 should be created by Owner during approval')

  } catch (error) {
    console.error('❌ Error testing version attribution:', error)
  }
}

testVersionAttribution()