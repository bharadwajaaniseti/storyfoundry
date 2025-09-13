import { createSupabaseServer } from '@/lib/auth-server'
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

    // Get pending changes directly from the table (avoiding the problematic function)
    const { data: pendingChanges, error: changesError } = await supabase
      .from('pending_editor_changes')
      .select(`
        *,
        editor:profiles!pending_editor_changes_editor_id_fkey(display_name, first_name, last_name, avatar_url),
        project:projects!pending_editor_changes_project_id_fkey(title)
      `)
      .eq('project_id', projectId)
      .in('status', ['pending', 'needs_revision'])
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

    // Process the approval/rejection using the database function
    const { data: decisionId, error: processError } = await supabase
      .rpc('process_editor_change_approval', {
        p_pending_change_id: pendingChangeId,
        p_decision: decision,
        p_feedback_notes: feedbackNotes || null,
        p_suggested_changes: suggestedChanges || null
      })

    if (processError) {
      console.error('Error processing editor change approval:', processError)
      return NextResponse.json({ 
        error: 'Failed to process approval decision',
        details: processError.message 
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
      changesApplied: decision === 'approve'
    })

  } catch (error) {
    console.error('Approval decision API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}