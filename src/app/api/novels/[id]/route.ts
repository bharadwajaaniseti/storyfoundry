import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const novelId = params.id
    const supabase = createSupabaseClient()

    // Get novel data with author profile
    const { data: novel, error: novelError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        logline,
        description,
        genre,
        word_count,
        buzz_score,
        created_at,
        updated_at,
        owner_id,
        visibility,
        profiles!owner_id (
          display_name,
          avatar_url,
          profile_visibility
        )
      `)
      .eq('id', novelId)
      .eq('format', 'novel')
      .single()

    if (novelError || !novel) {
      return NextResponse.json(
        { error: 'Novel not found' },
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
