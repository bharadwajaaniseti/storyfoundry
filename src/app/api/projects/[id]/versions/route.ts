import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/versions - Get all versions for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const majorOnly = searchParams.get('majorOnly') === 'true'
    
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query - simplified to avoid foreign key issues
    let query = supabase
      .from('project_content_versions')
      .select(`
        id,
        user_id,
        version_number,
        change_summary,
        word_count,
        character_count,
        created_at,
        is_major_version,
        tags
      `)
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .range(offset, offset + limit - 1)

    if (majorOnly) {
      query = query.eq('is_major_version', true)
    }

    const { data: versions, error } = await query

    if (error) {
      console.error('Error fetching versions:', error)
      // If the table doesn't exist or has relationship errors, return empty array for now
      if (error.code === 'PGRST200' || error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('project_content_versions table has issues, returning empty array')
        
        return NextResponse.json({ 
          versions: [], 
          totalCount: 0,
          hasMore: false,
          source: 'empty'
        })
      }
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Format versions with user information
    const formattedVersions = await Promise.all((versions || []).map(async (version: any) => {
      // Get user info for each version
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', version.user_id)
        .single()

      return {
        ...version,
        user: {
          id: version.user_id,
          display_name: userProfile?.display_name || 'Unknown User',
          avatar_url: userProfile?.avatar_url
        }
      }
    }))

    // Get total count for pagination (with error handling)
    let count = 0
    try {
      const countResult = await supabase
        .from('project_content_versions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
      count = countResult.count || 0
    } catch (countError) {
      console.log('Failed to get count, using versions array length')
      count = formattedVersions?.length || 0
    }

    return NextResponse.json({ 
      versions: formattedVersions || [], 
      totalCount: count,
      hasMore: (offset + limit) < count
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/versions - Create a new version manually
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { content, changeSummary, tags, isMajorVersion } = await request.json()
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has write permission on this project
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = project.owner_id === user.id
    let hasPermission = isOwner

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      hasPermission = !!collaborator
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'No permission to create versions' }, { status: 403 })
    }

    // Get next version number
    const { data: lastVersion } = await supabase
      .from('project_content_versions')
      .select('version_number')
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1

    // Calculate metrics
    const wordCount = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length
    const characterCount = content.length

    // Create version
    const { data: version, error } = await supabase
      .from('project_content_versions')
      .insert({
        project_id: id,
        user_id: user.id,
        content,
        version_number: nextVersionNumber,
        change_summary: changeSummary,
        word_count: wordCount,
        character_count: characterCount,
        is_major_version: isMajorVersion || false,
        tags: tags || []
      })
      .select(`
        id,
        user_id,
        version_number,
        change_summary,
        word_count,
        character_count,
        created_at,
        is_major_version,
        tags
      `)
      .single()

    if (error) {
      console.error('Error creating version:', error)
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
