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
      // If this is a new OAuth user with a selected role, update metadata
      if (selectedRole && ['reader', 'writer'].includes(selectedRole)) {
        try {
          // Create service role client for admin operations
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
          
          // Update user metadata to store preferred role
          await supabaseService.auth.admin.updateUserById(data.user.id, {
            user_metadata: {
              ...data.user.user_metadata,
              preferred_role: selectedRole,
              display_name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0]
            }
          })
          
          // Wait a moment for auto-trigger to potentially run
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Check if profile exists and ensure role is correct
          let attempts = 0
          const maxAttempts = 3
          
          while (attempts < maxAttempts) {
            attempts++
            
            const { data: existingProfile } = await supabaseService
              .from('profiles')
              .select('id, role')
              .eq('id', data.user.id)
              .single()

            if (existingProfile) {
              // Update profile role if it doesn't match the selected role
              if (existingProfile.role !== selectedRole) {
                await supabaseService
                  .from('profiles')
                  .update({ role: selectedRole })
                  .eq('id', data.user.id)
              }
              break
            } else if (attempts === maxAttempts) {
              // As fallback, create profile manually if auto-trigger didn't work
              await supabaseService
                .from('profiles')
                .insert({
                  id: data.user.id,
                  role: selectedRole,
                  display_name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User'
                })
            } else {
              // Wait and retry
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          }
        } catch (profileError) {
          console.error('Profile setup error:', profileError)
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
