import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { 
      chapterId, 
      contentType = 'chapter', 
      originalContent, 
      proposedContent, 
      changeDescription, 
      editorNotes, 
      contentTitle 
    } = await request.json()

    if (!originalContent && originalContent !== '') {
      return NextResponse.json({ error: 'Original content is required' }, { status: 400 })
    }

    if (!proposedContent && proposedContent !== '') {
      return NextResponse.json({ error: 'Proposed content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project exists and user has editor role
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is an editor on this project
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .select('role, secondary_roles, permissions')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (collaboratorError || !collaborator) {
      return NextResponse.json({ error: 'User is not a collaborator on this project' }, { status: 403 })
    }

    const isEditor = collaborator.role === 'editor' || 
                    (collaborator.secondary_roles && collaborator.secondary_roles.includes('editor'))

    if (!isEditor) {
      return NextResponse.json({ error: 'User does not have editor permissions' }, { status: 403 })
    }

    // Submit the change for approval using the database function
    const { data: changeId, error: submitError } = await supabase
      .rpc('submit_editor_change_for_approval', {
        p_project_id: projectId,
        p_original_content: originalContent,
        p_proposed_content: proposedContent,
        p_chapter_id: chapterId || null,
        p_content_type: contentType,
        p_change_description: changeDescription || null,
        p_editor_notes: editorNotes || null,
        p_content_title: contentTitle || null
      })

    if (submitError) {
      console.error('Error submitting editor change for approval:', submitError)
      return NextResponse.json({ 
        error: 'Failed to submit change for approval',
        details: submitError.message 
      }, { status: 500 })
    }

    // Create a version in the history with "Pending Review" tag
    let versionId = null
    if (contentType === 'project_content') {
      try {
        // Get the next version number
        const { data: lastVersion } = await supabase
          .from('project_content_versions')
          .select('version_number')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()

        const nextVersionNumber = (lastVersion?.version_number || 0) + 1
        const wordCount = proposedContent.trim().split(/\s+/).filter((word: string) => word.length > 0).length
        const characterCount = proposedContent.length

        // Create version with editor attribution and "Pending Review" tag
        const { data: newVersion, error: versionError } = await supabase
          .from('project_content_versions')
          .insert({
            project_id: projectId,
            user_id: user.id, // Editor who submitted the changes
            content: proposedContent,
            version_number: nextVersionNumber,
            change_summary: changeDescription || 'Editor changes pending approval',
            word_count: wordCount,
            character_count: characterCount,
            is_major_version: false,
            tags: ['Pending Review'], // Tag indicating pending approval
            changes_made: {
              pending_change_id: changeId,
              submitted_for_approval: true,
              submitted_at: new Date().toISOString(),
              status: 'pending_approval'
            }
          })
          .select('id')
          .single()

        if (versionError) {
          console.error('Error creating pending version:', versionError)
        } else {
          versionId = newVersion.id
          console.log('Created version', nextVersionNumber, 'with "Pending Review" tag for editor:', user.id)
        }
      } catch (versionCreationError) {
        console.error('Failed to create pending version:', versionCreationError)
      }
    }

    // Log the activity
    try {
      await supabase
        .from('project_activity')
        .insert({
          project_id: projectId,
          user_id: user.id,
          activity_type: 'editor_change_submitted',
          description: `Submitted ${contentType} changes for approval: ${contentTitle || 'Untitled'}`
        })
    } catch (activityError) {
      console.log('Failed to log activity, but change submission succeeded')
    }

    return NextResponse.json({ 
      success: true, 
      pendingChangeId: changeId,
      versionId: versionId,
      message: 'Changes submitted for owner approval',
      status: 'pending_approval'
    })

  } catch (error) {
    console.error('Editor change submission API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve pending changes for an editor
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

    // Get pending changes for this editor on this project
    const { data: pendingChanges, error: changesError } = await supabase
      .from('pending_editor_changes')
      .select(`
        *,
        project:projects(title),
        editor:profiles(name, email),
        decisions:editor_approval_decisions(
          decision,
          feedback_notes,
          suggested_changes,
          created_at
        )
      `)
      .eq('project_id', projectId)
      .eq('editor_id', user.id)
      .order('created_at', { ascending: false })

    if (changesError) {
      console.error('Error fetching pending changes:', changesError)
      return NextResponse.json({ error: 'Failed to fetch pending changes' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pendingChanges: pendingChanges || [] 
    })

  } catch (error) {
    console.error('Get pending changes API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}