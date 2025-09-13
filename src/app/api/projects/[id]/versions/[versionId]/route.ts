import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/versions/[versionId] - Get specific version content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params
    console.log('Version content API called:', { projectId: id, versionId })
    
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    // Get version with content (without relationship join to avoid schema issues)
    console.log('Fetching version data...')
    const { data: version, error } = await supabase
      .from('project_content_versions')
      .select(`
        id,
        content,
        version_number,
        change_summary,
        word_count,
        character_count,
        created_at,
        is_major_version,
        tags,
        changes_made,
        user_id
      `)
      .eq('id', versionId)
      .eq('project_id', id)
      .single()

    if (error) {
      console.error('Database error fetching version:', error)
      return NextResponse.json({ error: 'Version not found', details: error.message }, { status: 404 })
    }

    if (!version) {
      console.error('Version not found:', { versionId, projectId: id })
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    console.log('Version found, fetching user profile...')
    // Get user profile separately to avoid relationship issues
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', version.user_id)
      .single()

    console.log('User profile fetched:', userProfile ? 'success' : 'not found')

    // Transform the data to match expected format
    const transformedVersion = {
      id: version.id,
      content: version.content,
      version_number: version.version_number,
      change_summary: version.change_summary,
      word_count: version.word_count,
      character_count: version.character_count,
      created_at: version.created_at,
      is_major_version: version.is_major_version,
      tags: version.tags,
      changes_made: version.changes_made,
      user: userProfile ? {
        id: userProfile.id,
        display_name: userProfile.display_name,
        avatar_url: userProfile.avatar_url
      } : {
        id: version.user_id,
        display_name: 'Unknown User',
        avatar_url: null
      }
    }

    console.log('Returning transformed version data')
    return NextResponse.json({ version: transformedVersion })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/versions/[versionId]/restore - Restore to this version
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has write permission
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

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
      return NextResponse.json({ error: 'No permission to restore versions' }, { status: 403 })
    }

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('project_content_versions')
      .select('content, version_number')
      .eq('id', versionId)
      .eq('project_id', id)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Update the current project content
    const { error: updateError } = await supabase
      .from('project_content')
      .upsert({
        project_id: id,
        content: version.content,
        asset_type: 'content',
        filename: `restored_from_v${version.version_number}.txt`
      })

    if (updateError) {
      console.error('Error restoring version:', updateError)
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully restored to version ${version.version_number}`,
      restoredVersion: version.version_number
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
