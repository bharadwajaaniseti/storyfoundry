import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  console.log('🔥 API route called - POST /api/projects/create') // Updated with profile creation
  
  try {
    console.log('📝 Creating Supabase client...')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // For API routes, we don't need to set cookies in the response
            // The browser will handle cookie management
          },
        },
      }
    )

    // Create service role client for database operations (bypasses RLS temporarily)
    console.log('🔧 Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
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

    console.log('🔐 Checking authentication...')
    console.log('=== API Auth Debug ===')
    console.log('Cookies received:', request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('User:', user?.id)
    console.log('Auth Error:', authError?.message)
    console.log('Final auth status:', user ? 'Authenticated' : 'Not authenticated')
    console.log('====================')
    
    if (authError || !user) {
      console.log('❌ Auth failed:', authError?.message || 'No user')
      const response = NextResponse.json(
        { error: 'Unauthorized', details: authError?.message || 'No user found' },
        { status: 401 }
      )
      console.log('📤 Returning 401 response')
      return response
    }

    console.log('✅ Authentication successful for user:', user.id)
    console.log('🔍 PROFILE CHECK STARTING...')

    // Ensure user has a profile record (should be created by trigger)
    console.log('👤 Checking user profile...')
    const { data: existingProfile } = await supabaseService
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    console.log('🔍 Profile query result:', existingProfile)

    if (!existingProfile) {
      console.log('❌ No profile found - this should not happen with auto-trigger')
      return NextResponse.json(
        { error: 'User profile not found. Please try signing out and signing in again.' },
        { status: 500 }
      )
    }

    console.log('✅ User profile exists')
    
    // Check if user has permission to create projects
    if (existingProfile.role === 'reader') {
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: 'Readers cannot create projects. Please upgrade to Writer role in settings.',
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    console.log('🔍 PROFILE CHECK COMPLETE...')

    console.log('📥 Parsing request body...')
    const body = await request.json()
    console.log('📋 Request data received:', Object.keys(body))
    
    const {
      title,
      logline,
      description,
      format,
      genre,
      visibility = 'private',
      ai_enabled = true,
      ip_protection_enabled = true
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!logline?.trim()) {
      return NextResponse.json(
        { error: 'Logline is required' },
        { status: 400 }
      )
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      )
    }

    console.log('🏗️ Creating project in database...')
    // Create project (matching actual database schema) - using service role to bypass RLS temporarily
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .insert({
        title: title.trim(),
        logline: logline.trim(),
        synopsis: description?.trim() || null, // Database has 'synopsis', not 'description'
        format,
        genre: genre || null,
        visibility,
        owner_id: user.id,
        buzz_score: 0
        // Note: ai_enabled and ip_protection_enabled not in database schema
      })
      .select()
      .single()

    if (projectError) {
      console.error('💥 Project creation error:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      )
    }

    console.log('✅ Project created successfully:', project.id)

    // Create IP timestamp if enabled (only if table exists)
    if (ip_protection_enabled) {
      console.log('🔒 Creating IP protection timestamp...')
      
      // Generate content hash for IP protection
      const contentToHash = `${title.trim()}\n${logline.trim()}\n${description?.trim() || ''}`
      const contentHash = Buffer.from(contentToHash).toString('base64')
      
      const { error: timestampError } = await supabaseService
        .from('ip_timestamps')
        .insert({
          project_id: project.id,
          content_hash: contentHash,
          provider: 'local'
        })

      if (timestampError) {
        console.error('⚠️ IP timestamp creation failed:', timestampError)
        // Don't fail the entire request for IP timestamp issues
      } else {
        console.log('✅ IP timestamp created successfully')
      }
    }

    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('🚨 FATAL API ERROR:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    
    // Always return valid JSON response
    const response = NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
    
    console.log('📤 Returning 500 error response')
    return response
  }
}
