import { createSupabaseClient } from './auth'

export interface FollowData {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  profiles?: {
    id: string
    display_name: string
    bio?: string
    avatar_url?: string
    verified_pro: boolean
    role: string
    created_at: string
  }
}

/**
 * Follow a user
 */
export async function followUser(followingId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (user.id === followingId) {
      throw new Error('Cannot follow yourself')
    }

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: followingId
      })

    if (error) {
      console.error('Error following user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error following user:', error)
    return false
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) {
      console.error('Error unfollowing user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return false
  }
}

/**
 * Check if current user is following another user
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking follow status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

/**
 * Get follower count for a user
 */
export async function getFollowerCount(userId: string): Promise<number> {
  try {
    const supabase = createSupabaseClient()
    
    const { count, error } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (error) {
      console.error('Error getting follower count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting follower count:', error)
    return 0
  }
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const supabase = createSupabaseClient()
    
    const { count, error } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (error) {
      console.error('Error getting following count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting following count:', error)
    return 0
  }
}

/**
 * Get users that the current user is following
 */
export async function getUserFollowing(userId?: string): Promise<FollowData[]> {
  try {
    const supabase = createSupabaseClient()
    let targetUserId = userId

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return []
      }
      targetUserId = user.id
    }

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        *,
        profiles!following_id (
          id,
          display_name,
          bio,
          avatar_url,
          verified_pro,
          role,
          created_at
        )
      `)
      .eq('follower_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user following:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting user following:', error)
    return []
  }
}
