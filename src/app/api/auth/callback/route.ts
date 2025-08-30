import { createSupabaseServer } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const redirectTo = searchParams.get('redirectTo') ?? '/app/test' // Changed to test page
  const role = searchParams.get('role') // Extract role from URL

  console.log('🔗 Auth Callback: Received params', { code: !!code, next, redirectTo, role })

  if (code) {
    const supabase = await createSupabaseServer()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      console.log('✅ Auth Callback: Session created for user:', data.user.id)
      
      // Always create/update the user profile, prioritizing role parameter
      const finalRole = role || 'reader' // Default to reader if no role specified
      
      console.log('🔄 Auth Callback: Creating/updating profile with role:', finalRole)
      
      // Add a small delay to ensure any auto-triggers have completed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          role: finalRole,
          display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('*')
        .single()
      
      console.log('📝 Auth Callback: Profile upsert result:', profile, 'Error:', profileError)
      
      // Also create/update subscription
      const tierMapping: Record<string, string> = {
        'reader': 'free_reader',
        'writer': 'free_writer'
      }
      
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: data.user.id,
          tier: tierMapping[finalRole] || 'free_reader'
        })
      
      console.log('💳 Auth Callback: Subscription upsert error:', subscriptionError)
      
      // Build the final redirect URL with role parameter if it exists
      let finalRedirectUrl = redirectTo
      if (role) {
        const separator = redirectTo.includes('?') ? '&' : '?'
        finalRedirectUrl = `${redirectTo}${separator}role=${role}`
      }
      
      console.log('✅ Auth Callback: Redirecting to', finalRedirectUrl)
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // We can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${finalRedirectUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${finalRedirectUrl}`)
      } else {
        return NextResponse.redirect(`${origin}${finalRedirectUrl}`)
      }
    } else {
      console.error('❌ Auth Callback: Session exchange failed', error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
