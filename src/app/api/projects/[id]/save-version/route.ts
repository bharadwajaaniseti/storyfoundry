import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

// Simple version storage that works without complex migrations
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { content, changeSummary } = await request.json()
    
    if (!content && content !== '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.owner_id === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Only project owners can create versions' }, { status: 403 })
    }

    // Calculate metrics
    const wordCount = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length
    const characterCount = content.length

    console.log('Creating version manually via simple endpoint...')

    // Try to create a simple version record in projects table using JSON
    // This approach stores versions as JSON in the projects table if project_content_versions doesn't exist
    try {
      // First try the proper versions table
      const { data: lastVersion } = await supabase
        .from('project_content_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const nextVersionNumber = (lastVersion?.version_number || 0) + 1

      const { data: version, error: versionError } = await supabase
        .from('project_content_versions')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content,
          version_number: nextVersionNumber,
          change_summary: changeSummary || 'Manual version save',
          word_count: wordCount,
          character_count: characterCount,
          is_major_version: false
        })
        .select('*')
        .single()

      if (versionError) {
        console.log('project_content_versions table not available, using fallback storage...')
        throw versionError
      }

      console.log('Version created in project_content_versions table:', nextVersionNumber)
      return NextResponse.json({ 
        success: true, 
        version: version,
        message: 'Version created successfully'
      })

    } catch (error) {
      console.log('Using fallback version storage in projects table...')
      
      // Fallback: store version info in projects table metadata
      const { data: currentProject } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single()

      const metadata = currentProject?.metadata || {}
      const versions = metadata.versions || []
      const nextVersionNumber = versions.length + 1

      const newVersion = {
        id: `v${nextVersionNumber}-${Date.now()}`,
        version_number: nextVersionNumber,
        content: content,
        change_summary: changeSummary || 'Manual version save',
        word_count: wordCount,
        character_count: characterCount,
        created_at: new Date().toISOString(),
        user_id: user.id
      }

      versions.push(newVersion)

      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          metadata: { ...metadata, versions },
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (updateError) {
        console.error('Failed to save version to fallback storage:', updateError)
        return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
      }

      console.log('Version created in projects.metadata fallback storage:', nextVersionNumber)
      return NextResponse.json({ 
        success: true, 
        version: newVersion,
        message: 'Version created successfully (fallback storage)'
      })
    }

  } catch (error) {
    console.error('Version creation API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
