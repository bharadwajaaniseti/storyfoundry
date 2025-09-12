import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 })
    }

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

      // Try to use the database function first, fallback to manual handling
      let functionResult = await supabase.rpc('accept_collaboration_invitation', {
        invitation_id: id
      })

      if (functionResult.error && (
        (functionResult.error.message?.includes('function') && functionResult.error.message?.includes('does not exist')) ||
        functionResult.error.message?.includes('updated_at') ||
        functionResult.error.message?.includes('does not exist')
      )) {
        console.warn('Database function has issues, using manual invitation acceptance:', functionResult.error.message)
        
        // Manual acceptance process
        const { error: updateError } = await supabase
          .from('collaboration_invitations')
          .update({ 
            status: 'accepted',
            responded_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('invitee_id', user.id)
          .eq('status', 'pending')

        if (updateError) {
          console.error('Error updating invitation status:', updateError)
          return NextResponse.json({ 
            error: 'Failed to update invitation status' 
          }, { status: 500 })
        }

        // Create collaborator record manually
        const { error: collaboratorError } = await supabase
          .from('project_collaborators')
          .insert({
            project_id: invitation.project_id,
            user_id: user.id,
            role: invitation.role,
            royalty_split: invitation.royalty_split || 0,
            permissions: { read: true, write: false, comment: true, invite: false }, // Basic permissions matching schema
            status: 'active'
          })

        if (collaboratorError) {
          console.error('Error creating collaborator:', collaboratorError)
          return NextResponse.json({ 
            error: 'Failed to create collaborator record' 
          }, { status: 500 })
        }

        return NextResponse.json({ message: 'Invitation accepted successfully (manual)' })
      } else if (functionResult.error) {
        console.error('Database error accepting invitation:', functionResult.error.message, functionResult.error.details, functionResult.error.hint)
        return NextResponse.json({ 
          error: `Failed to accept invitation: ${functionResult.error.message}` 
        }, { status: 500 })
      }

      // Note: The database function already creates a notification for the project owner
      return NextResponse.json({ message: 'Invitation accepted successfully' })
    } else if (action === 'decline') {
      // Try to use the database function first, fallback to manual handling
      let functionResult = await supabase.rpc('decline_collaboration_invitation', {
        invitation_id: id
      })

      if (functionResult.error && (
        (functionResult.error.message?.includes('function') && functionResult.error.message?.includes('does not exist')) ||
        functionResult.error.message?.includes('updated_at') ||
        functionResult.error.message?.includes('does not exist')
      )) {
        console.warn('Database function has issues, using manual invitation decline:', functionResult.error.message)
        
        // Manual decline process
        const { error: updateError } = await supabase
          .from('collaboration_invitations')
          .update({ 
            status: 'declined',
            responded_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('invitee_id', user.id)
          .eq('status', 'pending')

        if (updateError) {
          console.error('Error updating invitation status:', updateError)
          return NextResponse.json({ 
            error: 'Failed to update invitation status' 
          }, { status: 500 })
        }

        return NextResponse.json({ message: 'Invitation declined successfully (manual)' })
      } else if (functionResult.error) {
        console.error('Database error declining invitation:', functionResult.error.message, functionResult.error.details, functionResult.error.hint)
        return NextResponse.json({ 
          error: `Failed to decline invitation: ${functionResult.error.message}` 
        }, { status: 500 })
      }

      return NextResponse.json({ message: 'Invitation declined successfully' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    // Ensure we always return a JSON response
    try {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }, { status: 500 })
    } catch (responseError) {
      console.error('Failed to create error response:', responseError)
      // Last resort - return a basic response
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
