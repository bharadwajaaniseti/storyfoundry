import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/versions/[versionId] - Get specific version content
export async function GET(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get version with content
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
        user:profiles (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', params.versionId)
      .eq('project_id', params.id)
      .single()

    if (error || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/versions/[versionId]/restore - Restore to this version
export async function POST(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
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
      .eq('id', params.id)
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
        .eq('project_id', params.id)
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
      .eq('id', params.versionId)
      .eq('project_id', params.id)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Update the current project content
    const { error: updateError } = await supabase
      .from('project_content')
      .upsert({
        project_id: params.id,
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
