import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user', userError }, { status: 401 })
    }

    console.log('Current user:', user.id)

    // Test basic table access
    console.log('Testing reading_progress table...')
    const { data: progressTest, error: progressTestError } = await supabase
      .from('reading_progress')
      .select('*')
      .limit(1)

    console.log('Reading progress test:', { progressTest, progressTestError })

    console.log('Testing engagement_events table...')
    const { data: eventsTest, error: eventsTestError } = await supabase
      .from('engagement_events')
      .select('*')
      .eq('kind', 'save')
      .limit(1)

    console.log('Events test:', { eventsTest, eventsTestError })

    console.log('Testing projects table...')
    const { data: projectsTest, error: projectsTestError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    console.log('Projects test:', { projectsTest, projectsTestError })

    return NextResponse.json({
      user: user.id,
      tests: {
        readingProgress: { data: progressTest, error: progressTestError },
        events: { data: eventsTest, error: eventsTestError },
        projects: { data: projectsTest, error: projectsTestError }
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    // Get or create a test project first
    let testProject = null
    
    // Check if test project exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('title', 'Test Story for Reading Progress')
      .single()

    if (existingProject) {
      testProject = existingProject
    } else {
      // Create a test project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: 'Test Story for Reading Progress',
          description: 'A test story to demonstrate reading progress functionality.',
          owner_id: user.id,
          author_id: user.id,
          format: 'novel',
          genre: 'drama',
          status: 'published',
          word_count: 50000,
          estimated_reading_time: 200,
          buzz_score: 75.5,
          is_public: true
        })
        .select()
        .single()

      if (projectError) {
        console.error('Error creating test project:', projectError)
        return NextResponse.json({ error: 'Failed to create test project', details: projectError }, { status: 500 })
      }
      
      testProject = newProject
    }

    // Create reading progress
    const { data: progressData, error: progressError } = await supabase
      .from('reading_progress')
      .upsert({
        project_id: testProject.id,
        user_id: user.id,
        progress_percentage: 65,
        last_position: 32500,
        is_completed: false
      })
      .select()

    if (progressError) {
      console.error('Error creating reading progress:', progressError)
      return NextResponse.json({ error: 'Failed to create reading progress', details: progressError }, { status: 500 })
    }

    // Create bookmark
    const { data: bookmarkData, error: bookmarkError } = await supabase
      .from('project_bookmarks')
      .upsert({
        project_id: testProject.id,
        user_id: user.id
      })
      .select()

    if (bookmarkError) {
      console.error('Error creating bookmark:', bookmarkError)
      return NextResponse.json({ error: 'Failed to create bookmark', details: bookmarkError }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Test data created successfully',
      testProject,
      readingProgress: progressData,
      bookmark: bookmarkData
    })

  } catch (error) {
    console.error('Test creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
