import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comments for the project
    const { data: comments, error } = await supabase
      .from('collaboration_project_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user:profiles (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { projectId, content, parentId } = await request.json()
    
    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: 'Project ID and content required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has comment permission on this project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()

    if (!project) {
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
      return NextResponse.json({ error: 'No permission to comment' }, { status: 403 })
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('collaboration_project_comments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user:profiles (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
