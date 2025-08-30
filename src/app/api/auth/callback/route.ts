import { createSupabaseServer } from '@/lib/auth-server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const redirectTo = searchParams.get('redirectTo') ?? '/app/test'
    const role = searchParams.get('role') as 'reader' | 'writer' | null

    console.log('🔗 Auth Callback START:', { code: !!code, redirectTo, role })

    if (!code) {
      console.error('❌ No auth code provided')
      return NextResponse.redirect(`${origin}/signin?error=no_code`)
    }

    // Exchange code for session
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.user) {
      console.error('❌ Session exchange failed:', error)
      return NextResponse.redirect(`${origin}/signin?error=session_failed`)
    }

    const user = data.user
    console.log('✅ Session created for user:', user.id)

    // Create service role client (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Determine final role
    const finalRole = role || 'reader'
    console.log('🎭 Setting user role to:', finalRole)

    // Force create/update profile with service role (no RLS restrictions)
    const profileData = {
      id: user.id,
      role: finalRole,
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select('*')
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
    } else {
      console.log('✅ Profile created/updated:', profile)
    }

    // Create subscription
    const tier = finalRole === 'writer' ? 'free_writer' : 'free_reader'
    const { error: subscriptionError } = await serviceSupabase
      .from('subscriptions')
      .upsert({ 
        user_id: user.id, 
        tier: tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (subscriptionError) {
      console.error('❌ Subscription creation failed:', subscriptionError)
    } else {
      console.log('✅ Subscription created:', tier)
    }

    // Build redirect URL
    let finalRedirectUrl = redirectTo
    if (role) {
      const separator = redirectTo.includes('?') ? '&' : '?'
      finalRedirectUrl = `${redirectTo}${separator}role=${role}`
    }

    console.log('🔄 Redirecting to:', finalRedirectUrl)
    
    // Determine redirect origin
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${finalRedirectUrl}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${finalRedirectUrl}`)
    } else {
      return NextResponse.redirect(`${origin}${finalRedirectUrl}`)
    }

  } catch (error) {
    console.error('❌ Auth callback error:', error)
    return NextResponse.redirect(`${origin}/signin?error=callback_failed`)
  }
}
