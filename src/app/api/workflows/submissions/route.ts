import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    const status = searchParams.get('status')
    const submitter_id = searchParams.get('submitter_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
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
          )
        ),
        attachments:workflow_attachments (
          id,
          filename,
          file_size,
          mime_type,
          description,
          created_at
        )
      `)
      .eq('project_id', project_id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (submitter_id) {
      query = query.eq('submitter_id', submitter_id)
    }

    // Apply pagination and ordering
    const { data: submissions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching workflow submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      project_id,
      title,
      description,
      content,
      original_content,
      submission_type = 'edit',
      category = 'content',
      priority = 'medium',
      target_role,
      chapter_reference,
      word_count = 0,
      tags = [],
      metadata = {}
    } = body

    if (!project_id || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator with write access
    const isOwner = project.owner_id === user.id
    let hasAccess = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!(collaborator && (collaborator.permissions as any)?.write === true)
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .insert({
        project_id,
        submitter_id: user.id,
        title,
        description,
        content,
        original_content,
        submission_type,
        category,
        priority,
        target_role,
        chapter_reference,
        word_count,
        tags,
        metadata
      })
      .select(`
        *,
        submitter:profiles!workflow_submissions_submitter_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    // Create notification for project owner and relevant collaborators
    const notificationQuery = supabase
      .from('notifications')
      .insert([
        // Notify project owner
        {
          user_id: project.owner_id,
          type: 'workflow_submission',
          title: 'New Workflow Submission',
          message: `${submission.submitter?.display_name || 'A collaborator'} submitted "${title}" for review`,
          data: {
            submission_id: submission.id,
            project_id: project_id,
            submission_type,
            priority
          }
        }
      ])

    // Also notify relevant role-based collaborators
    if (target_role && target_role !== 'owner') {
      const { data: targetCollaborators } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', project_id)
        .eq('role', target_role)
        .eq('status', 'active')
        .neq('user_id', user.id)

      if (targetCollaborators && targetCollaborators.length > 0) {
        const targetNotifications = targetCollaborators.map(collab => ({
          user_id: collab.user_id,
          type: 'workflow_submission',
          title: 'New Workflow Submission',
          message: `${submission.submitter?.display_name || 'A collaborator'} submitted "${title}" for ${target_role} review`,
          data: {
            submission_id: submission.id,
            project_id: project_id,
            submission_type,
            priority,
            target_role
          }
        }))

        await supabase.from('notifications').insert(targetNotifications)
      }
    }

    await notificationQuery

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}