import { createSupabaseServer } from '@/lib/auth-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET endpoint to retrieve pending changes for owner approval
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this project (either owner or collaborator)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.owner_id === user.id
    
    // If not owner, check if user is a collaborator
    let isCollaborator = false
    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      isCollaborator = !!collaborator
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch both editor changes and workflow submissions for unified view
    const [pendingChangesResult, workflowSubmissionsResult] = await Promise.all([
      // Get all editor changes (not just pending ones) for complete workflow view
      supabase
        .from('pending_editor_changes')
        .select(`
          *,
          editor:profiles!pending_editor_changes_editor_id_fkey(display_name, first_name, last_name, avatar_url),
          project:projects!pending_editor_changes_project_id_fkey(title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      
      // Get workflow submissions
      supabase
        .from('workflow_submissions')
        .select(`
          *,
          submitter:profiles!workflow_submissions_submitter_id_fkey(id, display_name, first_name, last_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    ])

    if (pendingChangesResult.error) {
      console.error('Error fetching pending changes:', pendingChangesResult.error)
      return NextResponse.json({ error: 'Failed to fetch pending changes' }, { status: 500 })
    }

    if (workflowSubmissionsResult.error) {
      console.error('Error fetching workflow submissions:', workflowSubmissionsResult.error)
    }

    // Combine and normalize the data
    const combinedItems = [
      // Editor changes
      ...(pendingChangesResult.data || []).map(change => ({
        id: change.id,
        type: 'editor_change',
        title: change.content_title || 'Content Update',
        author: {
          id: change.editor_id,
          name: change.editor?.display_name || change.editor?.first_name || 'Unknown Editor',
          avatar: change.editor?.avatar_url,
          role: 'Editor'
        },
        status: change.status, // pending, approved, rejected, needs_revision
        created_at: change.created_at,
        updated_at: change.updated_at,
        description: change.change_description,
        content: change.proposed_content,
        original_content: change.original_content,
        content_type: change.content_type,
        chapter_id: change.chapter_id,
        editor_notes: change.editor_notes,
        approval_deadline: change.approval_deadline
      })),
      
      // Workflow submissions (if available)
      ...(workflowSubmissionsResult.data || []).map(submission => ({
        id: submission.id,
        type: 'workflow_submission',
        title: submission.title,
        author: {
          id: submission.submitter_id,
          name: submission.submitter?.display_name || submission.submitter?.first_name || 'Unknown User',
          avatar: submission.submitter?.avatar_url,
          role: submission.submitter?.role || 'Contributor'
        },
        status: submission.status,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        description: submission.description,
        content: submission.content,
        submission_type: submission.submission_type,
        priority: submission.priority,
        tags: submission.tags
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ 
      success: true, 
      items: combinedItems,
      // Keep backward compatibility
      pendingChanges: pendingChangesResult.data || []
    })

  } catch (error) {
    console.error('Get pending approvals API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to approve/reject editor changes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 POST /api/projects/[id]/approvals called - URL:', request.url)
  console.log('🚀 Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const { id: projectId } = await params
    const { 
      pendingChangeId, 
      decision, 
      feedbackNotes, 
      suggestedChanges 
    } = await request.json()

    if (!pendingChangeId) {
      return NextResponse.json({ error: 'Pending change ID is required' }, { status: 400 })
    }

    if (!decision || !['approve', 'reject', 'request_revision'].includes(decision)) {
      return NextResponse.json({ error: 'Valid decision is required (approve, reject, request_revision)' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Processing approval with details:', {
      projectId,
      pendingChangeId,
      decision,
      userId: user.id,
      userEmail: user.email
    })

    // Verify user is the project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Verify the pending change exists and belongs to this project
    const { data: pendingChange, error: changeError } = await supabase
      .from('pending_editor_changes')
      .select('*')
      .eq('id', pendingChangeId)
      .eq('project_id', projectId)
      .single()

    if (changeError || !pendingChange) {
      return NextResponse.json({ error: 'Pending change not found' }, { status: 404 })
    }

    // Process the approval/rejection manually (bypassing the function due to auth context issues)
    let decisionId: string
    let changesApplied = false
    
    try {
      // Create approval decision record
      const { data: newDecision, error: decisionError } = await supabase
        .from('editor_approval_decisions')
        .insert({
          pending_change_id: pendingChangeId,
          owner_id: user.id,
          decision,
          feedback_notes: feedbackNotes || null,
          suggested_changes: suggestedChanges || null,
          decision_metadata: {
            decided_at: new Date().toISOString(),
            project_title: project.title
          }
        })
        .select('id')
        .single()

      if (decisionError) {
        console.error('Error creating decision record:', decisionError)
        return NextResponse.json({ 
          error: 'Failed to create approval decision',
          details: decisionError.message 
        }, { status: 500 })
      }

      decisionId = newDecision.id

      // Update pending change status using service role to bypass RLS
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: updatedChange, error: statusError } = await serviceSupabase
        .from('pending_editor_changes')
        .update({
          status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'needs_revision',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingChangeId)
        .select()

      if (statusError) {
        console.error('Error updating pending change status:', statusError)
        return NextResponse.json({ 
          error: 'Failed to update pending change status',
          details: statusError.message 
        }, { status: 500 })
      }

      console.log('✅ Successfully updated pending change status:', updatedChange)
      
      // If approved, apply the changes to the actual content
      if (decision === 'approve') {
        try {
          if (pendingChange.content_type === 'project_content') {
            console.log('🔄 Updating project content with projects table workaround...')
            
            // Get the next version number first
            const { data: lastVersion } = await serviceSupabase
              .from('project_content_versions')
              .select('version_number')
              .eq('project_id', projectId)
              .order('version_number', { ascending: false })
              .limit(1)
              .single()
            
            const nextVersionNumber = (lastVersion?.version_number || 0) + 1
            console.log('📊 Creating version number:', nextVersionNumber)
            
            // Create the version manually FIRST
            const { data: newVersion, error: versionCreateError } = await serviceSupabase
              .from('project_content_versions')
              .insert({
                project_id: projectId,
                user_id: pendingChange.editor_id,
                content: pendingChange.proposed_content,
                version_number: nextVersionNumber,
                change_summary: 'Approved editor changes: ' + (pendingChange.content_title || pendingChange.content_type),
                word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
                character_count: pendingChange.proposed_content.length,
                tags: ['Approved', 'Collaborator Edit'],
                approval_status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
                reviewer_notes: 'Approved via owner approval workflow',
                is_pending_approval: false,
                is_major_version: true,
                changes_made: {
                  type: 'approval',
                  approved_by: user.id,
                  approved_at: new Date().toISOString(),
                  pending_change_id: pendingChangeId,
                  status: 'approved'
                }
              })
              .select('id')
              .single()
            
            if (versionCreateError) {
              console.error('❌ Error creating version:', versionCreateError)
              return NextResponse.json({ 
                error: 'Failed to create content version',
                details: versionCreateError.message 
              }, { status: 500 })
            }
            
            console.log('✅ Created version manually:', newVersion.id)
            
            // Simplified dual storage approach: Update both locations directly
            console.log('🔄 Updating content in both storage locations...')
            
            // Step 1: Update projects.synopsis (primary storage)
            const { error: projectUpdateError } = await serviceSupabase
              .from('projects')
              .update({
                synopsis: pendingChange.proposed_content,
                updated_at: new Date().toISOString()
              })
              .eq('id', projectId)
            
            if (projectUpdateError) {
              console.error('❌ Projects table update failed:', projectUpdateError)
              return NextResponse.json({ 
                error: 'Failed to update content in projects table',
                details: projectUpdateError.message 
              }, { status: 500 })
            }
            
            console.log('✅ Updated projects.synopsis')
            
            // Step 2: Update/create project_content table entry
            // The key insight: We'll bypass the trigger by first checking if the record exists
            // and handling it appropriately
            
            let projectContentSynced = false
            
            const { data: existingContent, error: checkError } = await supabase
              .from('project_content')
              .select('id')
              .eq('project_id', projectId)
              .eq('asset_type', 'content')
              .single()

            if (checkError && checkError.code !== 'PGRST116') {
              console.log('⚠️  Error checking existing content:', checkError.message)
            }

            if (existingContent) {
              // Record exists, update it directly using authenticated supabase client
              console.log('📝 Updating existing project_content record...')
              
              const { error: updateError } = await supabase
                .from('project_content')
                .update({
                  content: pendingChange.proposed_content,
                  filename: project.title + '_content.txt',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingContent.id) // Use the specific ID to avoid trigger issues

              if (updateError) {
                console.log('⚠️  project_content update failed:', updateError.message)
              } else {
                console.log('✅ Successfully updated project_content table')
                projectContentSynced = true
              }
              
            } else {
              // Record doesn't exist, create it using authenticated supabase client  
              console.log('📝 Creating new project_content record...')
              
              const { error: createError } = await supabase
                .from('project_content')
                .insert({
                  project_id: projectId,
                  filename: project.title + '_content.txt',
                  content: pendingChange.proposed_content,
                  asset_type: 'content',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })

              if (createError) {
                console.log('⚠️  project_content creation failed:', createError.message)
              } else {
                console.log('✅ Successfully created project_content record')
                projectContentSynced = true
              }
            }
            
            changesApplied = true
            
            // Update version with appropriate tags
            const versionTags = projectContentSynced 
              ? ['Approved', 'Collaborator Edit', 'Dual Storage'] 
              : ['Approved', 'Collaborator Edit', 'Projects Table']
              
            const versionNotes = projectContentSynced
              ? 'Approved and stored in both project_content and projects.synopsis'
              : 'Approved and stored in projects.synopsis (primary storage)'
              
            await serviceSupabase
              .from('project_content_versions')
              .update({
                tags: versionTags,
                reviewer_notes: versionNotes
              })
              .eq('id', newVersion.id)
              
            console.log(`✅ Content approval completed with ${projectContentSynced ? 'dual' : 'single'} storage`)
              
            // Update any existing "Pending Review" version to show it was superseded
            try {
              console.log('🔍 Looking for pending version to mark as superseded...')
              
              const { data: pendingVersions } = await supabase
                .from('project_content_versions')
                .select('id, tags, changes_made')
                .eq('project_id', projectId)
                .contains('tags', ['Pending Review'])
                .neq('id', newVersion.id) // Don't update the version we just created
                .order('created_at', { ascending: false })
                .limit(1)

              const pendingVersion = pendingVersions?.[0]
              if (pendingVersion) {
                console.log('Found pending version to mark as superseded:', pendingVersion.id)
                
                const { error: updateError } = await supabase
                  .from('project_content_versions')
                  .update({
                    tags: ['Superseded'], // Mark as superseded
                    changes_made: {
                      ...pendingVersion.changes_made,
                      superseded_by: newVersion.id,
                      superseded_at: new Date().toISOString(),
                      approval_decision_id: decisionId,
                      status: 'superseded'
                    }
                  })
                  .eq('id', pendingVersion.id)

                if (updateError) {
                  console.error('Error updating pending version:', updateError)
                } else {
                  console.log('✅ Marked pending version as superseded')
                }
              } else {
                console.log('ℹ️  No pending version found to mark as superseded')
              }
            } catch (pendingUpdateError) {
              console.error('Failed to update pending version:', pendingUpdateError)
            }
            
          } else if (pendingChange.content_type === 'chapter' && pendingChange.chapter_id) {
            // Update chapter content
            const { error: chapterError } = await supabase
              .from('project_chapters')
              .update({
                content: pendingChange.proposed_content,
                word_count: pendingChange.proposed_content.trim().split(/\s+/).length,
                updated_at: new Date().toISOString()
              })
              .eq('id', pendingChange.chapter_id)

            if (chapterError) {
              console.error('Error updating chapter content:', chapterError)
            } else {
              changesApplied = true
            }
          } else if (pendingChange.content_type === 'outline') {
            // Update project outline/synopsis
            const { error: outlineError } = await supabase
              .from('projects')
              .update({
                synopsis: pendingChange.proposed_content,
                updated_at: new Date().toISOString()
              })
              .eq('id', projectId)

            if (outlineError) {
              console.error('Error updating project outline:', outlineError)
            } else {
              changesApplied = true
            }
          }

          // Create workflow submission record for tracking
          await supabase
            .from('workflow_submissions')
            .insert({
              project_id: projectId,
              submitter_id: pendingChange.editor_id,
              title: 'Approved Editor Change: ' + (pendingChange.content_title || pendingChange.content_type),
              description: pendingChange.change_description,
              content: pendingChange.proposed_content,
              original_content: pendingChange.original_content,
              submission_type: 'edit',
              status: 'approved',
              metadata: {
                pending_change_id: pendingChangeId,
                approval_decision_id: decisionId,
                auto_applied: true
              }
            })

        } catch (applyError) {
          console.error('Error applying approved changes:', applyError)
          // Changes were approved but couldn't be applied - this is logged but not fatal
        }
      } else if (decision === 'reject') {
        // Update the pending version tag to "Rejected"
        try {
          console.log('Looking for pending version to mark as rejected...')
          
          const { data: pendingVersion } = await supabase
            .from('project_content_versions')
            .select('id, tags, changes_made')
            .eq('project_id', projectId)
            .contains('tags', ['Pending Review'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (pendingVersion) {
            console.log('Found pending version to mark as rejected:', pendingVersion.id)
            
            const { error: updateError } = await supabase
              .from('project_content_versions')
              .update({
                tags: ['Rejected'], // Update tag to rejected
                changes_made: {
                  ...pendingVersion.changes_made,
                  rejected_by: user.id,
                  rejected_at: new Date().toISOString(),
                  approval_decision_id: decisionId,
                  status: 'rejected'
                }
              })
              .eq('id', pendingVersion.id)

            if (updateError) {
              console.error('Error updating version to rejected:', updateError)
            } else {
              console.log('Successfully updated version to "Rejected"')
            }
          }
        } catch (rejectionUpdateError) {
          console.error('Failed to update version for rejection:', rejectionUpdateError)
        }
      }

    } catch (processError) {
      console.error('Error processing editor change approval:', processError)
      return NextResponse.json({ 
        error: 'Failed to process approval decision',
        details: processError instanceof Error ? processError.message : 'Unknown error' 
      }, { status: 500 })
    }

    // Log the activity
    try {
      await supabase
        .from('project_activity')
        .insert({
          project_id: projectId,
          user_id: user.id,
          activity_type: `editor_change_${decision}`,
          description: `${decision.charAt(0).toUpperCase() + decision.slice(1)} editor changes for: ${pendingChange.content_title || pendingChange.content_type}`
        })
    } catch (activityError) {
      console.log('Failed to log activity, but approval processing succeeded')
    }

    return NextResponse.json({ 
      success: true, 
      decisionId,
      decision,
      message: `Editor changes ${decision === 'approve' ? 'approved and applied' : decision === 'reject' ? 'rejected' : 'marked for revision'}`,
      changesApplied
    })

  } catch (error) {
    console.error('Approval decision API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}