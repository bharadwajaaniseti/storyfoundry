import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

// GET /api/projects/[id]/reader-comments - Get public reader comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    console.log('GET reader comments for project:', projectId)
    
    const supabase = await createSupabaseServer()

    // Check if project exists and is public or user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, visibility')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get current user (optional for public projects)
    const { data: { user } } = await supabase.auth.getUser()
    
    // For public projects, anyone can read comments
    // For private projects, only owner and collaborators can read
    if (project.visibility !== 'public') {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if user has access to the project
      let hasAccess = project.owner_id === user.id
      
      if (!hasAccess) {
        const { data: collaborator } = await supabase
          .from('project_collaborators')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        hasAccess = !!collaborator
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get reader comments with author information
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        collaboration_response_id,
        user:profiles!project_comments_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        collaboration_response:collaboration_project_comments!project_comments_collaboration_response_id_fkey (
          id,
          content,
          created_at,
          user:profiles!collaboration_project_comments_user_id_fkey (
            display_name
          )
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching reader comments:', commentsError)
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
    console.error('Error in GET /api/projects/[id]/reader-comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/reader-comments - Create new reader comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { content, parentId = null } = body

    console.log('POST reader comment for project:', projectId, 'Content:', content, 'ParentId:', parentId)

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists and allows comments
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, visibility')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user can comment (public projects allow comments, private projects need access)
    let canComment = project.visibility === 'public'
    
    if (!canComment) {
      // Check if user has access to private project
      const isOwner = project.owner_id === user.id
      let hasAccess = isOwner

      if (!isOwner) {
        const { data: collaborator } = await supabase
          .from('project_collaborators')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        hasAccess = !!collaborator
      }

      canComment = hasAccess
    }

    if (!canComment) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the reader comment
    const { data: comment, error: insertError } = await supabase
      .from('project_comments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        collaboration_response_id,
        user:profiles!project_comments_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating reader comment:', insertError)
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
    console.error('Error in POST /api/projects/[id]/reader-comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}