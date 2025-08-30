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
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
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
