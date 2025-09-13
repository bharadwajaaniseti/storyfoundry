// Test the approval API directly
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

async function testApprovalAPI() {
  console.log('🧪 Testing Approval API and Database State...\n')
  
  try {
    // Find the pending change that was mentioned
    const { data: pendingChanges } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('📋 Pending Editor Changes:')
    if (pendingChanges && pendingChanges.length > 0) {
      pendingChanges.forEach((change, i) => {
        console.log(`   ${i + 1}. ${change.id} - ${change.content_title || 'Untitled'}`)
        console.log(`      Status: ${change.status}`)
        console.log(`      Project: ${change.project_id}`)
        console.log(`      Editor: ${change.editor_id}`)
        console.log(`      Content Preview: ${change.proposed_content?.substring(0, 100)}...`)
        console.log('')
      })
    } else {
      console.log('   ✅ No pending changes found')
    }

    // Check recent versions with "Pending Review" tag
    const { data: pendingVersions } = await supabase
      .from('project_content_versions')
      .select('id, project_id, version_number, tags, user_id, change_summary, created_at')
      .contains('tags', ['Pending Review'])
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('📊 Versions with "Pending Review" tag:')
    if (pendingVersions && pendingVersions.length > 0) {
      pendingVersions.forEach((version, i) => {
        console.log(`   ${i + 1}. V${version.version_number} (${version.id})`)
        console.log(`      Project: ${version.project_id}`)
        console.log(`      Author: ${version.user_id}`)
        console.log(`      Summary: ${version.change_summary}`)
        console.log(`      Tags: ${version.tags.join(', ')}`)
        console.log(`      Created: ${new Date(version.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('   ✅ No pending review versions found')
    }

    // Check for recent approval decisions
    const { data: recentDecisions } = await supabase
      .from('editor_approval_decisions')
      .select(`
        *,
        pending_editor_changes(content_title, status, project_id)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('📝 Recent Approval Decisions:')
    if (recentDecisions && recentDecisions.length > 0) {
      recentDecisions.forEach((decision, i) => {
        console.log(`   ${i + 1}. ${decision.decision} - ${decision.pending_editor_changes?.content_title || 'Untitled'}`)
        console.log(`      Decision ID: ${decision.id}`)
        console.log(`      Project: ${decision.pending_editor_changes?.project_id}`)
        console.log(`      Status: ${decision.pending_editor_changes?.status}`)
        console.log(`      Decided: ${new Date(decision.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('   ✅ No recent decisions found')
    }

    console.log('✅ Approval API test completed')

  } catch (error) {
    console.error('❌ Error testing approval API:', error)
  }
}

testApprovalAPI()