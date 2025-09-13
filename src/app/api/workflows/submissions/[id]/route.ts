import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, notes, review_priority = 'medium' } = body

    if (!action || !['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (approve, reject, request_changes)' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get submission details and verify access
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        *,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        project:projects!workflow_submissions_project_id_fkey (
          id,
          title,
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user can approve this submission
    const isOwner = submission.project.owner_id === user.id
    let canApprove = isOwner

    if (!isOwner) {
      // Check if user is a collaborator with appropriate role
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, permissions')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaborator) {
        // Role-specific approval permissions
        switch (submission.submission_type) {
          case 'edit':
          case 'suggestion':
            canApprove = ['coauthor', 'editor'].includes(collaborator.role)
            break
          case 'translation':
            canApprove = ['editor', 'reviewer'].includes(collaborator.role)
            break
          case 'review':
            canApprove = ['coauthor', 'producer'].includes(collaborator.role)
            break
          case 'task':
            canApprove = ['producer', 'coauthor'].includes(collaborator.role)
            break
          default:
            canApprove = false
        }
      }
    }

    if (!canApprove) {
      return NextResponse.json({ error: 'You do not have permission to approve this submission' }, { status: 403 })
    }

    // Check if already approved by this user
    const { data: existingApproval } = await supabase
      .from('workflow_approvals')
      .select('id')
      .eq('submission_id', id)
      .eq('approver_id', user.id)
      .single()

    if (existingApproval) {
      return NextResponse.json({ error: 'You have already reviewed this submission' }, { status: 400 })
    }

    // Use the database function to process approval
    const { data: approvalId, error: processError } = await supabase
      .rpc('process_workflow_approval', {
        p_submission_id: id,
        p_action: action,
        p_notes: notes,
        p_review_priority: review_priority
      })

    if (processError) {
      console.error('Error processing approval:', processError)
      return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
    }

    // Get the updated submission with approval details
    const { data: updatedSubmission, error: fetchError } = await supabase
      .from('workflow_submissions')
      .select(`
        *,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        approvals:workflow_approvals (
          *,
          approver:profiles!workflow_approvals_approver_id_fkey (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated submission:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated submission' }, { status: 500 })
    }

    return NextResponse.json({ 
      submission: updatedSubmission,
      approval_id: approvalId,
      message: `Submission ${action}d successfully`
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get submission with full details
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        *,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        approvals:workflow_approvals (
          *,
          approver:profiles!workflow_approvals_approver_id_fkey (
            id,
            display_name,
            avatar_url
          )
        ),
        comments:workflow_comments (
          *,
          user:profiles!workflow_comments_user_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          replies:workflow_comments!parent_id (
            *,
            user:profiles!workflow_comments_user_id_fkey (
              id,
              display_name,
              avatar_url
            )
          )
        ),
        attachments:workflow_attachments (
          *,
          uploader:profiles!workflow_attachments_uploader_id_fkey (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}