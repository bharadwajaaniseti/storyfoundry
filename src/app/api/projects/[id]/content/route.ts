import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { content, createVersion = false, changeSummary = null } = await request.json()

    if (!content && content !== '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is owner or has write access
    const isOwner = project.owner_id === user.id
    let hasWriteAccess = isOwner

    if (!isOwner) {
      try {
        const { data: collaborator } = await supabase
          .from('project_collaborators')
          .select('permissions')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        hasWriteAccess = collaborator?.permissions?.write === true
      } catch (error) {
        console.log('Collaboration table not available, restricting to owner access')
        hasWriteAccess = false
      }
    }

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).filter((word: string) => word.length > 0).length

    console.log('Saving content via API for project:', projectId, 'word count:', wordCount)

    // Try to save to project_content table first
    let contentSaved = false
    try {
      // Use a direct SQL approach to avoid RLS issues
      const { error: rpcError } = await supabase.rpc('save_project_content', {
        p_project_id: projectId,
        p_content: content,
        p_filename: `${project.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
        p_asset_type: 'content'
      })

      if (rpcError) {
        console.log('RPC failed, trying direct table access...')
        
        // Fallback to direct table operations
        const { error: directInsertError } = await supabase
          .from('project_content')
          .insert({
            project_id: projectId,
            filename: `${project.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
            content,
            asset_type: 'content'
          })

        if (directInsertError && directInsertError.code === '23505') {
          // Record exists, update it
          const { error: updateError } = await supabase
            .from('project_content')
            .update({
              content,
              filename: `${project.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
              updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .eq('asset_type', 'content')

          if (!updateError) {
            contentSaved = true
            console.log('Content updated in project_content table via API')
          }
        } else if (!directInsertError) {
          contentSaved = true
          console.log('Content inserted to project_content table via API')
        }
      } else {
        contentSaved = true
        console.log('Content saved via RPC function')
      }

      // If content was saved successfully, create a version only if explicitly requested
      if (contentSaved && createVersion) {
        try {
          console.log('Creating version manually (explicitly requested)...')
          
          // Try creating version in project_content_versions table first
          let versionCreated = false
          try {
            const { data: lastVersion } = await supabase
              .from('project_content_versions')
              .select('version_number')
              .eq('project_id', projectId)
              .order('version_number', { ascending: false })
              .limit(1)
              .single()

            const nextVersionNumber = (lastVersion?.version_number || 0) + 1
            const characterCount = content.length

            const { error: versionError } = await supabase
              .from('project_content_versions')
              .insert({
                project_id: projectId,
                user_id: user.id,
                content,
                version_number: nextVersionNumber,
                change_summary: changeSummary || `Manual save (${wordCount} words)`,
                word_count: wordCount,
                character_count: characterCount,
                is_major_version: false
              })

            if (!versionError) {
              versionCreated = true
              console.log('Version created in project_content_versions table - version', nextVersionNumber)
            }
          } catch (tableError) {
            console.log('project_content_versions table not available, using fallback...')
          }

          // If that failed, use fallback storage in projects table
          if (!versionCreated) {
            console.log('Using fallback version storage in projects.metadata...')
            
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
              change_summary: changeSummary || `Manual save (${wordCount} words)`,
              word_count: wordCount,
              character_count: content.length,
              created_at: new Date().toISOString(),
              user_id: user.id
            }

            versions.push(newVersion)

            const { error: updateError } = await supabase
              .from('projects')
              .update({ 
                metadata: { ...metadata, versions }
              })
              .eq('id', projectId)

            if (!updateError) {
              console.log('Version created in projects.metadata fallback storage - version', nextVersionNumber)
            } else {
              console.log('Fallback version storage failed:', updateError)
            }
          }
        } catch (versionError) {
          console.log('Version creation failed, but content was saved:', versionError)
        }
      }
    } catch (error) {
      console.log('project_content operations failed:', error)
    }

    // If project_content failed, save to projects.synopsis as fallback
    if (!contentSaved) {
      console.log('Saving to projects.synopsis as fallback...')
      
      const { error: fallbackError } = await supabase
        .from('projects')
        .update({ 
          synopsis: content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (fallbackError) {
        console.error('Fallback save failed:', fallbackError)
        return NextResponse.json({ error: 'Failed to save content' }, { status: 500 })
      }
      console.log('Content saved to projects.synopsis as fallback')
      
      // Only create version if explicitly requested
      if (createVersion) {
        try {
          console.log('Attempting to create version in project_content_versions table (fallback scenario)...')
          
          // Get the next version number by counting existing versions
          const { count: versionCount } = await supabase
            .from('project_content_versions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)

          const nextVersionNumber = (versionCount || 0) + 1

          const { error: versionError } = await supabase
            .from('project_content_versions')
            .insert({
              project_id: projectId,
              user_id: user.id,
              content: content,
              version_number: nextVersionNumber,
              change_summary: changeSummary || `Manual save (${wordCount} words)`,
              word_count: wordCount,
              character_count: content.length,
              is_major_version: false,
              tags: []
            })

          if (versionError) {
            console.log('Failed to create version in project_content_versions:', versionError.message)
          } else {
            console.log('Version created successfully in project_content_versions - version', nextVersionNumber)
          }
        } catch (versionError) {
          console.log('Version creation failed:', versionError)
        }
      }
    } else {
      // Update project metadata
      await supabase
        .from('projects')
        .update({ 
          word_count: wordCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', projectId)
    }

    return NextResponse.json({ 
      success: true, 
      wordCount,
      savedTo: contentSaved ? 'project_content' : 'projects.synopsis'
    })

  } catch (error) {
    console.error('Content save API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
