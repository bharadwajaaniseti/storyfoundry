import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🔄 Role upgrade endpoint called')
  
  try {
    const cookieStore = await cookies()
    
    // Create authenticated client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetRole } = await request.json()
    
    // Validate target role
    if (!['reader', 'writer'].includes(targetRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    console.log(`🔄 Upgrading user ${user.id} to ${targetRole}`)
    
    // Create service role client for database operations
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

    const { data, error } = await supabaseService
      .from('profiles')
      .update({ role: targetRole })
      .eq('id', user.id)
      .select('id, role, display_name')
      .single()

    if (error) {
      console.error('Role upgrade error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Role upgraded successfully:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: `Role updated to ${targetRole}`,
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
