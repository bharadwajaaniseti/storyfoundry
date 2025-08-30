import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Test auth endpoint called ===')
    console.log('Request cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Don't need to set cookies for a test endpoint
          },
        },
      }
    )
    
    // Try to get user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('Auth result:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      error: error?.message 
    })
    
    return NextResponse.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      error: error?.message || null,
      cookieCount: request.cookies.getAll().length
    })
    
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
