// Fix the pending review versions manually
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

async function fixPendingVersions() {
  console.log('🔧 Fixing Pending Review Versions...\n')
  
  try {
    // Get all versions with "Pending Review" tag
    const { data: pendingVersions } = await supabase
      .from('project_content_versions')
      .select('*')
      .contains('tags', ['Pending Review'])
      .order('created_at', { ascending: false })

    if (!pendingVersions || pendingVersions.length === 0) {
      console.log('✅ No pending versions found')
      return
    }

    console.log(`📋 Found ${pendingVersions.length} versions with "Pending Review" tag:`)
    
    for (const version of pendingVersions) {
      console.log(`\n🔄 Processing Version ${version.version_number} (${version.id})`)
      console.log(`   Project: ${version.project_id}`)
      console.log(`   Author: ${version.user_id}`)
      console.log(`   Current tags: ${version.tags.join(', ')}`)
      
      // Check if there's a corresponding approval decision for this version
      const { data: approvals } = await supabase
        .from('editor_approval_decisions')
        .select(`
          *,
          pending_editor_changes(*)
        `)
        .eq('pending_editor_changes.project_id', version.project_id)
        .eq('decision', 'approve')
        .order('created_at', { ascending: false })
        .limit(1)

      if (approvals && approvals.length > 0) {
        const approval = approvals[0]
        console.log(`   ✅ Found approval decision: ${approval.id}`)
        
        // Update the version tags
        const { error: updateError } = await supabase
          .from('project_content_versions')
          .update({
            tags: ['Approved', 'Collaborator Edit'],
            changes_made: {
              ...version.changes_made,
              approved_by: approval.owner_id,
              approved_at: approval.created_at,
              approval_decision_id: approval.id,
              status: 'approved'
            }
          })
          .eq('id', version.id)

        if (updateError) {
          console.log(`   ❌ Error updating version: ${updateError.message}`)
        } else {
          console.log(`   ✅ Successfully updated to "Approved" + "Collaborator Edit"`)
        }
      } else {
        console.log(`   ⚠️ No approval decision found for this version`)
      }
    }

    console.log('\n✅ Finished processing pending versions')

  } catch (error) {
    console.error('❌ Error fixing pending versions:', error)
  }
}

fixPendingVersions()