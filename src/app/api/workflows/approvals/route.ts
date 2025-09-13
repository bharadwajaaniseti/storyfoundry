import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { submission_id, status, review_notes, priority } = body

    if (!submission_id || !status) {
      return NextResponse.json({ error: 'Submission ID and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'needs_changes'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to approve this submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        project_id,
        submitter_id,
        submission_type,
        target_role,
        title,
        projects!inner (
          owner_id
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user can approve (project owner, target role, or editor/reviewer)
    const isOwner = (submission.projects as any)?.owner_id === user.id
    let canApprove = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, secondary_roles, permissions')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaborator) {
        const userRoles = [collaborator.role, ...(collaborator.secondary_roles || [])]
        canApprove = userRoles.includes('editor') || 
                    userRoles.includes('reviewer') ||
                    (submission.target_role && userRoles.includes(submission.target_role))
      }
    }

    if (!canApprove) {
      return NextResponse.json({ error: 'Insufficient permissions to approve this submission' }, { status: 403 })
    }

    // Create the approval record
    const { data: approval, error: approvalError } = await supabase
      .from('workflow_approvals')
      .insert({
        submission_id,
        reviewer_id: user.id,
        status,
        review_notes: review_notes || null,
        priority: priority || null
      })
      .select(`
        id,
        status,
        review_notes,
        priority,
        created_at,
        reviewer:profiles!workflow_approvals_reviewer_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (approvalError) {
      console.error('Error creating approval:', approvalError)
      return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 })
    }

    // Update the submission status
    const { error: updateError } = await supabase
      .from('workflow_submissions')
      .update({
        status,
        review_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
    }

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const submission_id = searchParams.get('submission_id')
    const project_id = searchParams.get('project_id')

    if (!submission_id && !project_id) {
      return NextResponse.json({ error: 'Submission ID or Project ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('workflow_approvals')
      .select(`
        id,
        submission_id,
        status,
        review_notes,
        priority,
        created_at,
        reviewer:profiles!workflow_approvals_reviewer_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        workflow_submissions!inner (
          id,
          title,
          submission_type,
          project_id,
          submitter_id
        )
      `)
      .order('created_at', { ascending: false })

    if (submission_id) {
      query = query.eq('submission_id', submission_id)
    } else if (project_id) {
      query = query.eq('workflow_submissions.project_id', project_id)
    }

    const { data: approvals, error } = await query

    if (error) {
      console.error('Error fetching approvals:', error)
      return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
    }

    // Filter approvals based on user access
    const accessibleApprovals = []
    
    for (const approval of approvals || []) {
      const submissionProjectId = (approval.workflow_submissions as any)?.project_id
      
      if (submissionProjectId) {
        // Check if user has access to this project
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id')
          .eq('id', submissionProjectId)
          .single()

        const isOwner = project?.owner_id === user.id
        let hasAccess = isOwner

        if (!isOwner) {
          const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('id')
            .eq('project_id', submissionProjectId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          hasAccess = !!collaborator
        }

        if (hasAccess) {
          accessibleApprovals.push(approval)
        }
      }
    }

    return NextResponse.json({ approvals: accessibleApprovals })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}