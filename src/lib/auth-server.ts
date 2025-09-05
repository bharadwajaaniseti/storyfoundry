import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

export type UserRole = 'reader' | 'writer'
export type SubscriptionTier = 'free_reader' | 'reader_plus' | 'reader_pro' | 'free_writer' | 'writer_plus' | 'writer_pro'

export interface Profile {
  id: string
  role: UserRole
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  company: string | null
  country: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  stripe_customer_id: string | null
  stripe_sub_id: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  profile: Profile | null
  subscription: Subscription | null
}

// Create Supabase client for server-side operations
export async function createSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  // Dynamically import cookies only when needed (server-side)
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          console.warn('Failed to set cookies in server context:', error)
        }
      },
    },
  })
}

// Create admin client with service role key (server-side only)
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cache the user for the duration of the request
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServer()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch user subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      profile: profile || null,
      subscription: subscription || null
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
})

// Require authentication and return user
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

// Require specific role
export async function requireRole(requiredRole: UserRole): Promise<User> {
  const user = await requireAuth()
  
  if (!user.profile?.role) {
    throw new Error('User profile not found')
  }
  
  const userRole = user.profile.role
  
  // Exact role match required
  if (userRole !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required, but user has role '${userRole}'`)
  }
  
  return user
}

// Require paid subscription (any tier above free)
export async function requirePaidSubscription(): Promise<User> {
  const user = await requireAuth()
  
  if (!user.subscription) {
    throw new Error('No subscription found')
  }
  
  if (user.subscription.tier === 'free_reader' || user.subscription.tier === 'free_writer') {
    throw new Error('Paid subscription required')
  }
  
  return user
}

// Require specific subscription tier
export async function requireSubscriptionTier(requiredTier: SubscriptionTier): Promise<User> {
  const user = await requireAuth()
  
  if (!user.subscription) {
    throw new Error('No subscription found')
  }
  
  if (user.subscription.tier !== requiredTier) {
    throw new Error(`Subscription tier '${requiredTier}' required, but user has '${user.subscription.tier}'`)
  }
  
  return user
}

// Check if user owns a project
export async function requireOwner(projectId: string, userId?: string): Promise<User> {
  const user = await requireAuth()
  const targetUserId = userId || user.id
  
  if (user.id !== targetUserId) {
    const supabase = await createSupabaseServer()
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()
    
    if (error || !project) {
      throw new Error('Project not found')
    }
    
    if (project.owner_id !== targetUserId) {
      throw new Error('Access denied: not project owner')
    }
  }
  
  return user
}

// Check if user has access to view a project
export async function hasProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServer()
  
  // Check if user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id, visibility')
    .eq('id', projectId)
    .single()
  
  if (!project) return false
  
  // Owner always has access
  if (project.owner_id === userId) return true
  
  // Public projects are viewable by all
  if (project.visibility === 'public') return true
  
  // Check if user has explicit access grant
  const { data: accessGrant } = await supabase
    .from('access_grants')
    .select('id')
    .eq('project_id', projectId)
    .eq('viewer_id', userId)
    .single()
  
  return !!accessGrant
}

export async function signOut() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
}
