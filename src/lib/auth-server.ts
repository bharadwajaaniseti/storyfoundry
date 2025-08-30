import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'

export type UserRole = 'writer' | 'pro' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  verified_pro: boolean
  company: string | null
  country: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  profile: Profile | null
}

// Create Supabase client for server-side operations
export async function createSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

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

    return {
      id: user.id,
      email: user.email || '',
      profile: profile || null
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
  
  // Admin can access everything
  if (userRole === 'admin') {
    return user
  }
  
  // Pro can access writer features
  if (requiredRole === 'writer' && (userRole === 'pro' || userRole === 'writer')) {
    return user
  }
  
  // Exact role match required
  if (userRole !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required, but user has role '${userRole}'`)
  }
  
  return user
}

// Check if user owns a project
export async function requireOwner(projectId: string, userId?: string): Promise<User> {
  const user = await requireAuth()
  const targetUserId = userId || user.id
  
  if (user.id !== targetUserId && user.profile?.role !== 'admin') {
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
