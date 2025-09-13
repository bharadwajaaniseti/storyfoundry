import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const submission_id = searchParams.get('submission_id')

    if (!submission_id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        project_id,
        submitter_id,
        projects!inner (
          owner_id
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user has access (owner, submitter, or collaborator)
    const isOwner = (submission.projects as any)?.owner_id === user.id
    const isSubmitter = submission.submitter_id === user.id
    let hasAccess = isOwner || isSubmitter

    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch comments
    const { data: comments, error: commentsError } = await supabase
      .from('workflow_comments')
      .select(`
        id,
        content,
        comment_type,
        created_at,
        updated_at,
        author:profiles!workflow_comments_author_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        parent_comment_id,
        replies:workflow_comments!parent_comment_id (
          id,
          content,
          comment_type,
          created_at,
          author:profiles!workflow_comments_author_id_fkey (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('submission_id', submission_id)
      .is('parent_comment_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { submission_id, content, comment_type = 'comment', parent_comment_id } = body

    if (!submission_id || !content?.trim()) {
      return NextResponse.json({ error: 'Submission ID and content are required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the submission
    const { data: submission, error: submissionError } = await supabase
      .from('workflow_submissions')
      .select(`
        id,
        project_id,
        submitter_id,
        projects!inner (
          owner_id
        )
      `)
      .eq('id', submission_id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user has access (owner, submitter, or collaborator)
    const isOwner = (submission.projects as any)?.owner_id === user.id
    const isSubmitter = submission.submitter_id === user.id
    let hasAccess = isOwner || isSubmitter

    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id, role')
        .eq('project_id', submission.project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If this is a reply, verify the parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('workflow_comments')
        .select('id, submission_id')
        .eq('id', parent_comment_id)
        .eq('submission_id', submission_id)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('workflow_comments')
      .insert({
        submission_id,
        author_id: user.id,
        content: content.trim(),
        comment_type,
        parent_comment_id: parent_comment_id || null
      })
      .select(`
        id,
        content,
        comment_type,
        created_at,
        updated_at,
        parent_comment_id,
        author:profiles!workflow_comments_author_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { comment_id, content } = body

    if (!comment_id || !content?.trim()) {
      return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comment and verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('workflow_comments')
      .select(`
        id,
        author_id,
        submission_id,
        workflow_submissions!inner (
          project_id,
          projects!inner (
            owner_id
          )
        )
      `)
      .eq('id', comment_id)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user can edit (author or project owner)
    const isAuthor = comment.author_id === user.id
    const isProjectOwner = (comment.workflow_submissions as any)?.projects?.owner_id === user.id
    
    if (!isAuthor && !isProjectOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('workflow_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comment_id)
      .select(`
        id,
        content,
        comment_type,
        created_at,
        updated_at,
        parent_comment_id,
        author:profiles!workflow_comments_author_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const comment_id = searchParams.get('id')

    if (!comment_id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comment and verify access
    const { data: comment, error: commentError } = await supabase
      .from('workflow_comments')
      .select(`
        id,
        author_id,
        submission_id,
        workflow_submissions!inner (
          project_id,
          projects!inner (
            owner_id
          )
        )
      `)
      .eq('id', comment_id)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user can delete (author or project owner)
    const isAuthor = comment.author_id === user.id
    const isProjectOwner = (comment.workflow_submissions as any)?.projects?.owner_id === user.id
    
    if (!isAuthor && !isProjectOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the comment (this will also delete replies due to CASCADE)
    const { error: deleteError } = await supabase
      .from('workflow_comments')
      .delete()
      .eq('id', comment_id)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}