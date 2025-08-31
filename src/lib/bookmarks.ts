import { createSupabaseClient } from './auth'

// Simple event emitter for bookmark updates
class BookmarkEventEmitter {
  private listeners: { [key: string]: ((projectId: string, isBookmarked: boolean) => void)[] } = {}

  on(event: string, callback: (projectId: string, isBookmarked: boolean) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: (projectId: string, isBookmarked: boolean) => void) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  emit(event: string, projectId: string, isBookmarked: boolean) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(projectId, isBookmarked))
  }
}

export const bookmarkEvents = new BookmarkEventEmitter()

export interface BookmarkData {
  id: string
  project_id: string
  actor_id: string
  created_at: string
  projects?: {
    id: string
    title: string
    logline: string
    synopsis: string | null
    format: string
    genre: string | null
    word_count: number | null
    visibility: 'private' | 'preview' | 'public'
    buzz_score: number
    created_at: string
    updated_at: string
    owner_id: string
    profiles?: {
      id: string
      display_name: string
      avatar_url?: string
      bio?: string
      verified_pro: boolean
    }
  }
}

/**
 * Check if a project is bookmarked by the current user
 */
export async function isProjectBookmarked(projectId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('engagement_events')
      .select('id')
      .eq('project_id', projectId)
      .eq('actor_id', userId)
      .eq('kind', 'save')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking bookmark status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return false
  }
}

/**
 * Get bookmark status for multiple projects
 */
export async function getMultipleBookmarkStatus(projectIds: string[], userId: string): Promise<Record<string, boolean>> {
  try {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('engagement_events')
      .select('project_id')
      .eq('actor_id', userId)
      .eq('kind', 'save')
      .in('project_id', projectIds)

    if (error) {
      console.error('Error getting bookmark status:', error)
      return {}
    }

    const bookmarkedIds = new Set(data?.map(item => item.project_id) || [])
    const result: Record<string, boolean> = {}
    
    projectIds.forEach(id => {
      result[id] = bookmarkedIds.has(id)
    })

    return result
  } catch (error) {
    console.error('Error getting bookmark status:', error)
    return {}
  }
}

/**
 * Toggle bookmark status for a project
 */
export async function toggleProjectBookmark(projectId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    // Check current status
    const isBookmarked = await isProjectBookmarked(projectId, userId)
    
    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from('engagement_events')
        .delete()
        .eq('project_id', projectId)
        .eq('actor_id', userId)
        .eq('kind', 'save')

      if (error) {
        console.error('Error removing bookmark:', error)
        throw error
      }
      
      // Emit bookmark change event
      bookmarkEvents.emit('bookmarkChanged', projectId, false)
      return false // Now not bookmarked
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('engagement_events')
        .insert({
          project_id: projectId,
          actor_id: userId,
          kind: 'save',
          weight: 5
        })

      if (error) {
        console.error('Error adding bookmark:', error)
        throw error
      }
      
      // Emit bookmark change event
      bookmarkEvents.emit('bookmarkChanged', projectId, true)
      return true // Now bookmarked
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    throw error
  }
}

/**
 * Get all bookmarked projects for a user
 */
export async function getUserBookmarks(userId: string): Promise<BookmarkData[]> {
  try {
    const supabase = createSupabaseClient()
    
    // Get bookmarks with project data
    const { data: bookmarks, error } = await supabase
      .from('engagement_events')
      .select(`
        id,
        project_id,
        actor_id,
        created_at,
        projects:project_id (
          id,
          title,
          logline,
          synopsis,
          format,
          genre,
          word_count,
          visibility,
          buzz_score,
          created_at,
          updated_at,
          owner_id
        )
      `)
      .eq('actor_id', userId)
      .eq('kind', 'save')
      .eq('projects.visibility', 'public')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading bookmarks:', error)
      return []
    }

    if (!bookmarks || bookmarks.length === 0) {
      return []
    }

    // Get owner profiles for the bookmarked projects
    const ownerIds = [...new Set(bookmarks.map(b => (b.projects as any)?.owner_id).filter(Boolean))]
    
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, verified_pro')
        .in('id', ownerIds)

      // Attach profiles to projects
      bookmarks.forEach(bookmark => {
        if (bookmark.projects && (bookmark.projects as any).owner_id) {
          (bookmark.projects as any).profiles = profiles?.find(p => p.id === (bookmark.projects as any).owner_id) || null
        }
      })
    }

    return bookmarks as any
  } catch (error) {
    console.error('Error loading user bookmarks:', error)
    return []
  }
}

/**
 * Get bookmark count for a user
 */
export async function getUserBookmarkCount(userId: string): Promise<number> {
  try {
    const supabase = createSupabaseClient()
    
    const { count, error } = await supabase
      .from('engagement_events')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', userId)
      .eq('kind', 'save')

    if (error) {
      console.error('Error getting bookmark count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting bookmark count:', error)
    return 0
  }
}

/**
 * Remove all bookmarks for a project (admin function)
 */
export async function removeAllProjectBookmarks(projectId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('engagement_events')
      .delete()
      .eq('project_id', projectId)
      .eq('kind', 'save')

    if (error) {
      console.error('Error removing all project bookmarks:', error)
      throw error
    }
  } catch (error) {
    console.error('Error removing all project bookmarks:', error)
    throw error
  }
}
