import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Quick fix: Creating profile for current user')
    
    // Get current user
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }
    
    console.log('👤 Current user:', user.id, user.email)
    
    // Create profile directly using regular client (should work if RLS allows)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'reader', // Default role
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      return NextResponse.json({ 
        error: 'Profile creation failed',
        details: profileError.message 
      }, { status: 500 })
    }

    console.log('✅ Profile created:', profile)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profile: profile 
    })
    
  } catch (error) {
    console.error('💥 Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
