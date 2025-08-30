import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  console.log('🔧 Manual profile creation endpoint called')
  
  try {
    const { userId, email, displayName, role } = await request.json()
    
    if (!userId || !email || !displayName || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, email, displayName, role' 
      }, { status: 400 })
    }
    
    console.log('👤 Creating profile for:', { userId, email, displayName, role })

    // Create service role client (bypasses RLS)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )
    
    // Create profile
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .upsert({
        id: userId,
        role: role,
        display_name: displayName,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Profile creation failed',
        details: profileError.message 
      }, { status: 500 })
    }

    // Create subscription
    const tier = role === 'writer' ? 'free_writer' : 'free_reader'
    const { error: subscriptionError } = await supabaseService
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier: tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (subscriptionError) {
      console.warn('⚠️ Subscription creation failed:', subscriptionError)
      // Don't fail the request if subscription fails
    }

    console.log('✅ Profile created successfully:', profile)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profile: profile 
    })
    
  } catch (error) {
    console.error('💥 Fatal error in profile creation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
