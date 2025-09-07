import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    
    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get messages for the project
    const { data: messages, error } = await supabase
      .from('collaboration_messages')
      .select(`
        *,
        sender:profiles!collaboration_messages_sender_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        replies:collaboration_messages!parent_id (
          *,
          sender:profiles!collaboration_messages_sender_id_fkey (
            id,
            display_name,
            avatar_url,
            verified_pro
          )
        )
      `)
      .eq('project_id', project_id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, content, message_type, parent_id } = body

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

    // Check if user is owner or collaborator
    const isOwner = project.owner_id === user.id
    let isCollaborator = false

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      isCollaborator = !!collaborator
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('collaboration_messages')
      .insert({
        project_id,
        sender_id: user.id,
        content,
        message_type: message_type || 'general',
        parent_id
      })
      .select(`
        *,
        sender:profiles!collaboration_messages_sender_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Log activity
    await supabase.from('project_activity').insert({
      project_id,
      user_id: user.id,
      activity_type: 'message_sent',
      description: parent_id ? 'Replied to a message' : 'Sent a message',
      metadata: { message_id: message.id, message_type }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
