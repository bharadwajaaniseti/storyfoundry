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

    console.log('Debug check for project:', projectId, 'user:', user.id)

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    // Check if user is owner
    const isOwner = project?.owner_id === user.id

    // Check if user is collaborator
    const { data: collaboration, error: collaborationError } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)

    // Get all collaborations for this user
    const { data: allCollaborations } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        project:projects (
          id,
          title,
          owner_id
        )
      `)
      .eq('user_id', user.id)

    return NextResponse.json({
      projectId,
      userId: user.id,
      project: {
        exists: !!project,
        data: project,
        error: projectError?.message
      },
      ownership: {
        isOwner,
        ownerId: project?.owner_id
      },
      collaboration: {
        data: collaboration,
        error: collaborationError?.message,
        found: !!collaboration
      },
      allUserCollaborations: allCollaborations
    })
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
