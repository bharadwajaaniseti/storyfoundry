import { createBrowserClient } from '@supabase/ssr'

export type UserRole = 'reader' | 'writer'

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

// Create Supabase client for client-side operations using SSR
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

// Client-side auth helpers
export async function signOut() {
  const supabase = createSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export async function getUser() {
  const supabase = createSupabaseClient()
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
}
