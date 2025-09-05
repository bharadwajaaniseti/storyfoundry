import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: novelId } = await params
    const supabase = createSupabaseClient()

    // Get novel data with author profile
    console.log('Fetching novel data for ID:', novelId)
    const { data: novel, error: novelError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        logline,
        genre,
        word_count,
        buzz_score,
        created_at,
        updated_at,
        owner_id,
        visibility,
        format,
        profiles!owner_id (
          display_name,
          avatar_url,
          profile_visibility
        )
      `)
      .eq('id', novelId)
      .single()

    console.log('Novel query result:', { novel, novelError })

    if (novelError || !novel) {
      console.log('Novel not found for ID:', novelId)
      return NextResponse.json(
        { error: 'Novel not found' },
        { status: 404 }
      )
    }

    // Check if it's a novel (case-insensitive)
    if (novel.format?.toLowerCase() !== 'novel') {
      console.log('Project is not a novel, format:', novel.format)
      return NextResponse.json(
        { error: 'Project is not a novel' },
        { status: 404 }
      )
    }

    // Check if novel is accessible (public or preview)
    if (novel.visibility === 'private') {
      return NextResponse.json(
        { error: 'Novel is not accessible' },
        { status: 403 }
      )
    }

    // Get chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('project_chapters')
      .select('*')
      .eq('project_id', novelId)
      .order('chapter_number', { ascending: true })

    if (chaptersError) {
      console.error('Error loading chapters:', chaptersError)
    }

    // Record view event
    try {
      await supabase
        .from('engagement_events')
        .insert({
          project_id: novelId,
          kind: 'view',
          metadata: { page: 'read' }
        })
    } catch (error) {
      console.error('Error recording view:', error)
    }

    return NextResponse.json({
      novel,
      chapters: chapters || []
    })

  } catch (error) {
    console.error('Error in novel API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
