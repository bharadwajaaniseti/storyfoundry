import { createSupabaseServer } from '@/lib/auth-server'
import { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent' or 'received'
    
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('collaboration_invitations')
      .select(`
        *,
        projects!collaboration_invitations_project_id_fkey (
          id,
          title,
          format,
          genre,
          owner_id,
          profiles!projects_owner_id_fkey (
            id,
            display_name,
            avatar_url,
            verified_pro
          )
        ),
        inviter:profiles!collaboration_invitations_inviter_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        ),
        invitee:profiles!collaboration_invitations_invitee_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)

    if (type === 'sent') {
      query = query.eq('inviter_id', user.id)
    } else if (type === 'received') {
      query = query.eq('invitee_id', user.id)
    } else {
      // Default: get both sent and received
      query = query.or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
    }

    const { data: invitations, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, invitee_id, role, secondary_roles, royalty_split, message } = body

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

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('collaboration_invitations')
      .select('id')
      .eq('project_id', project_id)
      .eq('invitee_id', invitee_id)
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already exists' }, { status: 400 })
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('collaboration_invitations')
      .insert({
        project_id,
        inviter_id: user.id,
        invitee_id,
        role,
        secondary_roles: secondary_roles || [],
        royalty_split,
        message
      })
      .select(`
        *,
        projects!collaboration_invitations_project_id_fkey (
          id,
          title,
          format,
          profiles!projects_owner_id_fkey (
            display_name
          )
        ),
        invitee:profiles!collaboration_invitations_invitee_id_fkey (
          display_name
        )
      `)
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Create notification for invitee
    const roleText = secondary_roles && secondary_roles.length > 0 
      ? `${role} (+${secondary_roles.length} additional role${secondary_roles.length > 1 ? 's' : ''})`
      : role

    await supabase.from('notifications').insert({
      user_id: invitee_id,
      type: 'collaboration_invite',
      title: 'New Collaboration Invitation',
      message: `${invitation.projects?.profiles?.display_name} invited you to collaborate on "${invitation.projects?.title}" as ${roleText}`,
      data: {
        invitation_id: invitation.id,
        project_id: project_id,
        role: role,
        secondary_roles: secondary_roles || [],
        project_title: invitation.projects?.title,
        inviter_name: invitation.projects?.profiles?.display_name,
        royalty_split: royalty_split
      }
    })

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
