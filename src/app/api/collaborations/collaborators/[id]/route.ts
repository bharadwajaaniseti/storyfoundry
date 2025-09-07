import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collaborator details to check permissions
    const { data: collaborator, error: collabError } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        projects!project_collaborators_project_id_fkey (
          owner_id
        )
      `)
      .eq('id', id)
      .single()

    if (collabError || !collaborator) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    // Check if user is project owner or removing themselves
    const isOwner = collaborator.projects?.owner_id === user.id
    const isSelf = collaborator.user_id === user.id

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Remove collaborator (update status to 'removed')
    const { error: removeError } = await supabase
      .from('project_collaborators')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (removeError) {
      console.error('Error removing collaborator:', removeError)
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    // Log activity
    await supabase.from('project_activity').insert({
      project_id: collaborator.project_id,
      user_id: user.id,
      activity_type: 'collaborator_removed',
      description: isSelf ? 'Left the project' : 'Removed collaborator from project'
    })

    return NextResponse.json({ message: 'Collaborator removed successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role, royalty_split, permissions } = body

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collaborator details to check permissions
    const { data: collaborator, error: collabError } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        projects!project_collaborators_project_id_fkey (
          id,
          title,
          owner_id,
          profiles!projects_owner_id_fkey (
            id,
            display_name
          )
        ),
        profiles!project_collaborators_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .eq('id', id)
      .single()

    if (collabError || !collaborator) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    // Only project owner can update collaborator details
    if (collaborator.projects?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only project owner can update collaborator details' }, { status: 403 })
    }

    // Track what's changing for notification
    const changes = []
    const oldRole = collaborator.role
    const oldRoyaltyShare = collaborator.royalty_split

    if (role !== undefined && role !== oldRole) {
      changes.push(`role from ${oldRole} to ${role}`)
    }
    if (royalty_split !== undefined && royalty_split !== oldRoyaltyShare) {
      changes.push(`revenue share from ${oldRoyaltyShare}% to ${royalty_split}%`)
    }

    // Update collaborator
    const updates: any = { updated_at: new Date().toISOString() }
    if (role !== undefined) updates.role = role
    if (royalty_split !== undefined) updates.royalty_split = royalty_split
    if (permissions !== undefined) updates.permissions = permissions

    const { data: updatedCollaborator, error: updateError } = await supabase
      .from('project_collaborators')
      .update(updates)
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating collaborator:', updateError)
      return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 })
    }

    // Send notification to collaborator if role or revenue share changed
    if (changes.length > 0) {
      const changeText = changes.join(' and ')
      await supabase.from('notifications').insert({
        user_id: collaborator.user_id,
        type: 'role_changed',
        title: 'Collaboration Settings Updated',
        message: `${collaborator.projects?.profiles?.display_name} updated your ${changeText} for "${collaborator.projects?.title}"`,
        data: {
          project_id: collaborator.project_id,
          project_title: collaborator.projects?.title,
          owner_name: collaborator.projects?.profiles?.display_name,
          changes: changes,
          new_role: role,
          new_royalty_split: royalty_split
        }
      })
    }

    // Log activity
    await supabase.from('project_activity').insert({
      project_id: collaborator.project_id,
      user_id: user.id,
      activity_type: 'permission_changed',
      description: `Updated collaborator permissions for ${updatedCollaborator.profiles?.display_name}`
    })

    return NextResponse.json({ collaborator: updatedCollaborator })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
