import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'accept') {
      // Get invitation details before accepting
      const { data: invitation, error: fetchError } = await supabase
        .from('collaboration_invitations')
        .select(`
          *,
          projects!collaboration_invitations_project_id_fkey (
            id,
            title,
            owner_id,
            profiles!projects_owner_id_fkey (
              id,
              display_name
            )
          ),
          invitee:profiles!collaboration_invitations_invitee_id_fkey (
            id,
            display_name
          )
        `)
        .eq('id', id)
        .eq('invitee_id', user.id)
        .single()

      if (fetchError || !invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
      }

      // Use the database function to accept invitation
      const { error } = await supabase.rpc('accept_collaboration_invitation', {
        invitation_id: id
      })

      if (error) {
        console.error('Error accepting invitation:', error)
        return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
      }

      // Send notification to project owner that invitation was accepted
      await supabase.from('notifications').insert({
        user_id: invitation.projects?.owner_id,
        type: 'collaboration_accepted',
        title: 'Collaboration Invitation Accepted',
        message: `${invitation.invitee?.display_name} accepted your collaboration invitation for "${invitation.projects?.title}"`,
        data: {
          invitation_id: invitation.id,
          project_id: invitation.project_id,
          collaborator_name: invitation.invitee?.display_name,
          project_title: invitation.projects?.title,
          role: invitation.role
        }
      })

      return NextResponse.json({ message: 'Invitation accepted successfully' })
    } else if (action === 'decline') {
      // Use the database function to decline invitation
      const { error } = await supabase.rpc('decline_collaboration_invitation', {
        invitation_id: id
      })

      if (error) {
        console.error('Error declining invitation:', error)
        return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Invitation declined successfully' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
