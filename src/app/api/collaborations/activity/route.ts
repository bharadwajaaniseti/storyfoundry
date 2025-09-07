import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

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
    let hasAccess = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasAccess = !!collaborator
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get activity for the project
    const { data: activity, error } = await supabase
      .from('project_activity')
      .select(`
        *,
        user:profiles!project_activity_user_id_fkey (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
