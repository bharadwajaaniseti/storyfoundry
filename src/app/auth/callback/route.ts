import { createSupabaseServer } from '@/lib/auth-server'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/app/dashboard'
  const selectedRole = searchParams.get('role') // Get role from OAuth flow

  if (code) {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // If this is a new OAuth user with a selected role, create/update their profile
      if (selectedRole && ['reader', 'writer'].includes(selectedRole)) {
        try {
          // Create service role client for profile management
          const supabaseService = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              cookies: {
                getAll: () => [],
                setAll: () => {},
              },
            }
          )
          
          // Check if profile exists
          const { data: existingProfile } = await supabaseService
            .from('profiles')
            .select('id, role')
            .eq('id', data.user.id)
            .single()

          if (!existingProfile) {
            // Create new profile with selected role
            await supabaseService
              .from('profiles')
              .insert({
                id: data.user.id,
                role: selectedRole,
                display_name: data.user.user_metadata?.full_name || 
                             data.user.email?.split('@')[0] || 
                             'Anonymous'
              })
          } else if (existingProfile.role !== selectedRole) {
            // Update existing profile if role changed
            await supabaseService
              .from('profiles')
              .update({ role: selectedRole })
              .eq('id', data.user.id)
          }
        } catch (profileError) {
          console.error('Profile creation/update error:', profileError)
          // Don't fail the auth flow for profile issues
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${redirectTo}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
