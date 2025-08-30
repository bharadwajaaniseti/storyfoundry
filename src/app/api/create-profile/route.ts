import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  console.log('🔧 Manual profile creation endpoint called')
  
  try {
    // Create service role client
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

    const userId = '7d6d33b7-5d85-497b-89cd-7a09e52f31ee'
    
    console.log('👤 Creating profile for user:', userId)
    
    const { data, error } = await supabaseService
      .from('profiles')
      .insert({
        id: userId,
        role: 'reader', // Default to reader role
        display_name: 'test_user'
      })
      .select()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Profile created:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profile: data 
    })
    
  } catch (error) {
    console.error('Fatal error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
