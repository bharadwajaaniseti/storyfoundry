import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching active collaborations for user:', user.id)

    // Get projects where the user is a collaborator
    const { data: collaborations, error } = await supabase
      .from('project_collaborators')
      .select(`
        id,
        role,
        royalty_split,
        status,
        joined_at,
        project:projects (
          id,
          title,
          logline,
          synopsis,
          genre,
          format,
          visibility,
          created_at,
          owner:profiles!projects_owner_id_fkey (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching active collaborations:', error)
      return NextResponse.json({ error: 'Failed to fetch collaborations' }, { status: 500 })
    }

    console.log('Active collaborations found:', collaborations?.length || 0)

    return NextResponse.json({ 
      collaborations: collaborations || []
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
