import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50) // Max 50 per page
    const format = searchParams.get('format')
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'buzz_score' // buzz_score, created_at, updated_at
    const offset = (page - 1) * limit

    const supabase = await createSupabaseServer()

    let query = supabase
      .from('projects')
      .select(`
        id,
        title,
        logline,
        synopsis,
        format,
        genre,
        subgenre,
        visibility,
        buzz_score,
        word_count,
        created_at,
        updated_at,
        profiles:owner_id (
          id,
          display_name,
          avatar_url,
          verified_pro
        )
      `)
      .eq('visibility', 'public')

    // Apply filters
    if (format && format !== 'all') {
      query = query.eq('format', format)
    }

    if (genre && genre !== 'all') {
      query = query.eq('genre', genre)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%, logline.ilike.%${search}%, synopsis.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sortBy) {
      case 'created_at':
        query = query.order('created_at', { ascending: false })
        break
      case 'updated_at':
        query = query.order('updated_at', { ascending: false })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      default: // buzz_score
        query = query.order('buzz_score', { ascending: false })
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')

    // Apply pagination
    const { data: projects, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching public projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch public projects' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      projects: projects || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error in public projects API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
