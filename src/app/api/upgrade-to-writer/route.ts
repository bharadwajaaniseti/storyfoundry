import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  console.log('🔄 Upgrading user to writer role...')
  
  try {
    // Get authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // For API routes, we don't need to set cookies
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create service role client to bypass RLS
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )
    
    // Update user role to writer
    const { data: updatedProfile, error: updateError } = await supabaseService
      .from('profiles')
      .update({ 
        role: 'writer',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role', details: updateError.message },
        { status: 500 }
      )
    }

    // Update subscription tier if exists
    const { error: subscriptionError } = await supabaseService
      .from('subscriptions')
      .update({ 
        tier: 'free_writer',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (subscriptionError) {
      console.warn('⚠️ Subscription update failed:', subscriptionError)
      // Don't fail the request if subscription update fails
    }

    console.log('✅ User upgraded to writer successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully upgraded to Writer role!',
      profile: updatedProfile
    })
    
  } catch (error) {
    console.error('💥 Error upgrading user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
