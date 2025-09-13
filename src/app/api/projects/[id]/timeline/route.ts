import { createSupabaseServer } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id]/timeline - Get unified timeline of versions and activities
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // 'versions', 'activities', or 'all'
    
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, owner_id, title')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const timelineItems: any[] = []

    // Fetch versions if requested
    if (type === 'versions' || type === 'all' || !type) {
      try {
        const { data: versions } = await supabase
          .from('project_content_versions')
          .select(`
            id,
            version_number,
            change_summary,
            word_count,
            character_count,
            created_at,
            is_major_version,
            tags,
            user_id
          `)
          .eq('project_id', id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (versions) {
          // Get user profiles for versions
          const userIds = [...new Set(versions.map(v => v.user_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

          for (const version of versions) {
            const profile = profileMap.get(version.user_id)
            timelineItems.push({
              id: `version-${version.id}`,
              type: 'version',
              title: `Version ${version.version_number}${version.is_major_version ? ' (Major)' : ''}`,
              description: version.change_summary || 'Content updated',
              created_at: version.created_at,
              user: {
                id: version.user_id,
                display_name: profile?.display_name || 'Unknown User',
                avatar_url: profile?.avatar_url
              },
              metadata: {
                version_number: version.version_number,
                word_count: version.word_count,
                character_count: version.character_count,
                is_major_version: version.is_major_version,
                tags: version.tags,
                version_id: version.id
              }
            })
          }
        }
      } catch (error) {
        console.log('Error fetching versions:', error)
        // Continue without versions if table doesn't exist
      }
    }

    // Fetch activities if requested
    if (type === 'activities' || type === 'all' || !type) {
      try {
        const { data: activities } = await supabase
          .from('project_activity')
          .select(`
            id,
            activity_type,
            description,
            metadata,
            created_at,
            user_id
          `)
          .eq('project_id', id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (activities) {
          // Get user profiles for activities
          const userIds = [...new Set(activities.map(a => a.user_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

          for (const activity of activities) {
            const profile = profileMap.get(activity.user_id)
            timelineItems.push({
              id: `activity-${activity.id}`,
              type: 'activity',
              title: formatActivityTitle(activity.activity_type),
              description: activity.description,
              created_at: activity.created_at,
              user: {
                id: activity.user_id,
                display_name: profile?.display_name || 'Unknown User',
                avatar_url: profile?.avatar_url
              },
              metadata: {
                activity_type: activity.activity_type,
                activity_id: activity.id,
                ...activity.metadata
              }
            })
          }
        }
      } catch (error) {
        console.log('Error fetching activities:', error)
        // Continue without activities if table doesn't exist
      }
    }

    // Fetch approval workflow items
    if (type === 'approvals' || type === 'all' || !type) {
      try {
        const { data: approvals } = await supabase
          .from('editor_approval_decisions')
          .select(`
            id,
            decision,
            feedback_notes,
            created_at,
            owner_id,
            pending_change:pending_editor_changes(
              id,
              content_type,
              change_description,
              editor_id,
              created_at
            )
          `)
          .eq('pending_change.project_id', id)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (approvals) {
          // Get user profiles for approvals
          const userIds = [...new Set([
            ...approvals.map(a => a.owner_id),
            ...approvals.map(a => a.pending_change?.editor_id).filter(Boolean)
          ])]
          
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

          for (const approval of approvals) {
            const ownerProfile = profileMap.get(approval.owner_id)
            const editorProfile = profileMap.get(approval.pending_change?.editor_id)
            
            timelineItems.push({
              id: `approval-${approval.id}`,
              type: 'approval',
              title: `Changes ${approval.decision}`,
              description: approval.feedback_notes || `${approval.pending_change?.change_description || 'Editor changes'} ${approval.decision}`,
              created_at: approval.created_at,
              user: {
                id: approval.owner_id,
                display_name: ownerProfile?.display_name || 'Project Owner',
                avatar_url: ownerProfile?.avatar_url
              },
              metadata: {
                decision: approval.decision,
                approval_id: approval.id,
                editor: editorProfile ? {
                  id: approval.pending_change?.editor_id,
                  display_name: editorProfile.display_name,
                  avatar_url: editorProfile.avatar_url
                } : null,
                content_type: approval.pending_change?.content_type
              }
            })
          }
        }
      } catch (error) {
        console.log('Error fetching approvals:', error)
        // Continue without approvals if table doesn't exist
      }
    }

    // Sort all items by created_at descending
    timelineItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const paginatedItems = timelineItems.slice(offset, offset + limit)

    return NextResponse.json({ 
      timeline: paginatedItems,
      totalCount: timelineItems.length,
      hasMore: (offset + limit) < timelineItems.length
    })
  } catch (error) {
    console.error('Timeline API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatActivityTitle(activityType: string): string {
  const titleMap: Record<string, string> = {
    'project_created': 'Project Created',
    'project_updated': 'Project Updated',
    'collaborator_added': 'Collaborator Added',
    'collaborator_removed': 'Collaborator Removed',
    'chapter_created': 'Chapter Created',
    'chapter_updated': 'Chapter Updated',
    'chapter_deleted': 'Chapter Deleted',
    'comment_added': 'Comment Added',
    'message_sent': 'Message Sent',
    'file_uploaded': 'File Uploaded',
    'permission_changed': 'Permission Changed',
    'editor_change_submitted': 'Changes Submitted for Review',
    'editor_change_approved': 'Changes Approved',
    'editor_change_rejected': 'Changes Rejected'
  }
  
  return titleMap[activityType] || activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}