import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing exact project creation flow...')
    
    // Create the same supabase client as in project creation
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

    console.log('🔐 Testing auth...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        step: 'auth',
        success: false,
        error: authError?.message || 'No user',
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      })
    }

    console.log('👤 Testing profile fetch...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json({
        step: 'profile',
        success: false,
        error: profileError.message,
        user: { id: user.id }
      })
    }

    console.log('🏗️ Testing service client...')
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

    // Test a simple insert to projects table
    const testProject = {
      title: 'Test Project ' + Date.now(),
      logline: 'Test logline',
      synopsis: null,
      format: 'screenplay',
      genre: null,
      visibility: 'private' as const,
      owner_id: user.id,
      buzz_score: 0
    }

    console.log('📝 Testing project creation...')
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .insert(testProject)
      .select()
      .single()

    if (projectError) {
      return NextResponse.json({
        step: 'project_creation',
        success: false,
        error: projectError.message,
        details: projectError
      })
    }

    // Clean up test project
    await supabaseService
      .from('projects')
      .delete()
      .eq('id', project.id)

    return NextResponse.json({
      step: 'complete',
      success: true,
      message: 'All steps passed successfully',
      user: { id: user.id },
      profile: { id: profile.id, role: profile.role }
    })

  } catch (error) {
    console.error('🚨 Test error:', error)
    return NextResponse.json({
      step: 'unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
