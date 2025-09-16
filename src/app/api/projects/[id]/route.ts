import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    // Fetch the project with all necessary fields
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        logline,
        synopsis,
        format,
        genre,
        subgenre,
        word_count,
        cast_size,
        language,
        visibility,
        buzz_score,
        created_at,
        updated_at,
        owner_id,
        profiles!projects_owner_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access to this project
    let hasAccess = 
      project.owner_id === user.id || // Owner
      project.visibility === 'public' || // Public project
      project.visibility === 'preview' // Preview allowed

    // If not already allowed, check if user is a collaborator
    if (!hasAccess) {
      const { data: collaboration } = await supabase
        .from('project_collaborators')
        .select('status, role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaboration) {
        hasAccess = true // Any active collaborator can access the project
        console.log('User has collaborator access:', collaboration)
      }
    }

    if (!hasAccess) {
      console.log('Access denied for user:', user.id, 'to project:', id)
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Format the response to match the expected interface
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.logline, // Using logline as description
      synopsis: project.synopsis,
      format: project.format,
      genre: project.genre,
      subgenre: project.subgenre,
      word_count: project.word_count,
      cast_size: project.cast_size,
      language: project.language,
      visibility: project.visibility,
      buzz_score: project.buzz_score,
      created_at: project.created_at,
      updated_at: project.updated_at,
      owner_id: project.owner_id, // Include owner_id for ownership checks
      owner: project.profiles
    }

    return Response.json(formattedProject)

  } catch (error) {
    console.error('Error in project API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    console.log('Updating project with data:', body)

    // Check if user has permission to edit this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      console.error('Error fetching project for permissions:', projectError)
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user owns the project or is a collaborator with edit permissions
    let hasEditPermission = project.owner_id === user.id

    if (!hasEditPermission) {
      // Check if user is a collaborator with edit permissions
      const { data: collaboration } = await supabase
        .from('project_collaborators')
        .select('roles')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (collaboration?.roles) {
        const roles = Array.isArray(collaboration.roles) ? collaboration.roles : [collaboration.roles]
        hasEditPermission = roles.some((role: string) => 
          ['editor', 'co-author', 'admin'].includes(role)
        )
      }
    }

    if (!hasEditPermission) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prepare update data - only update fields that are provided
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.logline = body.description // Map description to logline
    if (body.synopsis !== undefined) updateData.synopsis = body.synopsis
    if (body.format !== undefined) updateData.format = body.format
    if (body.genre !== undefined) updateData.genre = body.genre
    if (body.subgenre !== undefined) updateData.subgenre = body.subgenre
    if (body.word_count !== undefined) updateData.word_count = body.word_count
    if (body.cast_size !== undefined) updateData.cast_size = body.cast_size
    if (body.language !== undefined) updateData.language = body.language
    if (body.visibility !== undefined) updateData.visibility = body.visibility

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    console.log('Updating project with data:', updateData)

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        title,
        logline,
        synopsis,
        format,
        genre,
        subgenre,
        word_count,
        cast_size,
        language,
        visibility,
        buzz_score,
        created_at,
        updated_at,
        owner_id
      `)
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return Response.json({ error: 'Failed to update project' }, { status: 500 })
    }

    // Format the response
    const formattedProject = {
      id: updatedProject.id,
      title: updatedProject.title,
      description: updatedProject.logline,
      synopsis: updatedProject.synopsis,
      format: updatedProject.format,
      genre: updatedProject.genre,
      subgenre: updatedProject.subgenre,
      word_count: updatedProject.word_count,
      cast_size: updatedProject.cast_size,
      language: updatedProject.language,
      visibility: updatedProject.visibility,
      buzz_score: updatedProject.buzz_score,
      created_at: updatedProject.created_at,
      updated_at: updatedProject.updated_at,
      owner_id: updatedProject.owner_id
    }

    console.log('Project updated successfully:', formattedProject)
    return Response.json(formattedProject)

  } catch (error) {
    console.error('Error in project PUT API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
