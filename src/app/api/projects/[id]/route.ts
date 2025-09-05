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
    const hasAccess = 
      project.owner_id === user.id || // Owner
      project.visibility === 'public' || // Public project
      project.visibility === 'preview' // Preview allowed

    if (!hasAccess) {
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
