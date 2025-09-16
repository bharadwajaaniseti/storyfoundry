import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

// GET /api/projects/[id]/comments - Get project comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    console.log('GET comments for project:', projectId)
    
    const supabase = await createSupabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Authenticated user:', user.id)

    // Check if user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .single()

    console.log('Project data:', project, 'Error:', projectError)

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator
    let hasAccess = project.owner_id === user.id
    console.log('Is owner:', hasAccess)
    
    if (!hasAccess) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      hasAccess = !!collaborator
      console.log('Is collaborator:', hasAccess, 'Collaborator data:', collaborator)
    }

    if (!hasAccess) {
      console.log('Access denied for user:', user.id)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get comments with author information
    const { data: comments, error: commentsError } = await supabase
      .from('collaboration_project_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        linked_comment_id,
        user:profiles!collaboration_project_comments_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        linked_comment:project_comments!collaboration_project_comments_linked_comment_id_fkey (
          id,
          content,
          created_at,
          user:profiles!project_comments_user_id_fkey (
            display_name
          )
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .order('created_at', { ascending: true })

    console.log('Comments query result:', { comments, error: commentsError })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Transform the data to include author_name for easier use
    const transformedComments = comments?.map((comment: any) => {
      const user = Array.isArray(comment.user) ? comment.user[0] : comment.user
      return {
        ...comment,
        author_name: user?.display_name || 'Anonymous'
      }
    }) || []

    return NextResponse.json({ comments: transformedComments })

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/comments - Create new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { content, parentId = null, linkedCommentId = null } = body

    console.log('POST comment for project:', projectId, 'Content:', content, 'ParentId:', parentId, 'LinkedCommentId:', linkedCommentId)

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error in POST:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user for POST:', user.id)

    // Check if user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or collaborator with comment permission
    const isOwner = project.owner_id === user.id
    let hasPermission = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, secondary_roles')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaborator) {
        // All collaborator roles have comment permission
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the comment
    console.log('Attempting to insert comment:', { 
      project_id: projectId, 
      user_id: user.id, 
      content: content.trim(), 
      parent_id: parentId,
      linked_comment_id: linkedCommentId
    })
    
    const { data: comment, error: insertError } = await supabase
      .from('collaboration_project_comments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
        linked_comment_id: linkedCommentId
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        linked_comment_id,
        user:profiles!collaboration_project_comments_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        linked_comment:project_comments!collaboration_project_comments_linked_comment_id_fkey (
          id,
          content,
          created_at,
          user:profiles!project_comments_user_id_fkey (
            display_name
          )
        )
      `)
      .single()

    console.log('Insert result:', { comment, error: insertError })

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Transform the response
    const user_data = Array.isArray(comment.user) ? comment.user[0] : comment.user
    const transformedComment = {
      ...comment,
      author_name: user_data?.display_name || 'Anonymous'
    }

    return NextResponse.json({ comment: transformedComment })

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}