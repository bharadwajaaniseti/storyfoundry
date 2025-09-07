import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    
    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    console.log('Fetching collaborators for project:', project_id)

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Check if user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .single()

    if (projectError) {
      console.error('Project query error:', projectError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: projectError.message 
      }, { status: 500 })
    }
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('Project found:', project.id, 'Owner:', project.owner_id)

    // Check if user is owner or collaborator
    const isOwner = project.owner_id === user.id
    
    if (!isOwner) {
      try {
        const { data: collaboratorCheck } = await supabase
          .from('project_collaborators')
          .select('id')
          .eq('project_id', project_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        if (!collaboratorCheck) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      } catch (error) {
        console.log('Collaboration table not available, allowing owner-only access')
        return NextResponse.json({ error: 'Access denied - collaboration features not available' }, { status: 403 })
      }
    }

    // Get collaborators for the project (include all statuses for project owners)
    let collaborators = []
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          profiles!project_collaborators_user_id_fkey (
            id,
            display_name,
            avatar_url,
            verified_pro,
            bio
          )
        `)
        .eq('project_id', project_id)
        .in('status', isOwner ? ['active', 'inactive'] : ['active'])
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching collaborators:', error)
        throw error
      }
      
      collaborators = data || []
    } catch (error) {
      console.log('Collaboration table not available, returning empty collaborators list')
      collaborators = []
    }

    // Also get pending invitations if user is owner
    let pendingInvitations = []
    if (isOwner) {
      try {
        const { data: invitations, error: invError } = await supabase
          .from('collaboration_invitations')
          .select(`
            *,
            profiles!collaboration_invitations_invitee_id_fkey (
              id,
              display_name,
              avatar_url,
              verified_pro
            )
          `)
          .eq('project_id', project_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (invError) {
          console.error('Error fetching invitations:', invError)
          throw invError
        }
        
        pendingInvitations = invitations || []
      } catch (error) {
        console.log('Collaboration invitations table not available, returning empty invitations list')
        pendingInvitations = []
      }
    }

    console.log('Collaborators found:', collaborators?.length || 0)
    console.log('Pending invitations found:', pendingInvitations?.length || 0)

    return NextResponse.json({ 
      collaborators: collaborators || [], 
      pendingInvitations: pendingInvitations || [] 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, user_id, role, royalty_split, permissions } = body

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate that user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', project_id)
      .eq('owner_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Add collaborator
    const { data: collaborator, error: collabError } = await supabase
      .from('project_collaborators')
      .insert({
        project_id,
        user_id,
        role,
        royalty_split,
        permissions: permissions || { read: true, write: false, comment: true, invite: false }
      })
      .select(`
        *,
        profiles!project_collaborators_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .single()

    if (collabError) {
      console.error('Error adding collaborator:', collabError)
      return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 })
    }

    // Log activity
    await supabase.from('project_activity').insert({
      project_id,
      user_id: user.id,
      activity_type: 'collaborator_added',
      description: `Added ${collaborator.profiles?.display_name} as ${role}`
    })

    return NextResponse.json({ collaborator })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
