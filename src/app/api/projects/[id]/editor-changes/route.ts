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