import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const chapterId = resolvedParams.id
    console.log('Loading reviews for chapter:', chapterId)
    
    // Validate chapter ID format
    if (!chapterId) {
      console.log('No chapter ID provided')
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 })
    }
    
    // Skip processing for test IDs
    if (chapterId.startsWith('test')) {
      console.log('Test chapter ID detected, returning empty reviews')
      return NextResponse.json({ reviews: [] })
    }
    
    const supabase = await createSupabaseServer()
    
    if (!supabase) {
      console.error('Failed to create Supabase client')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get reviews for the chapter with user profiles
    const { data: reviews, error } = await supabase
      .from('chapter_reviews')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching reviews:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch reviews', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    // Get profile information for each review
    const reviewsWithProfiles = await Promise.all(
      (reviews || []).map(async (review) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', review.user_id)
          .single()
        
        return {
          ...review,
          profiles: profile || { display_name: 'Unknown User', avatar_url: null }
        }
      })
    )

    console.log('Found reviews:', reviewsWithProfiles?.length || 0)

    return NextResponse.json({ reviews: reviewsWithProfiles })
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const chapterId = resolvedParams.id
    console.log('Creating review for chapter:', chapterId)
    
    // Validate chapter ID
    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 })
    }
    
    const supabase = await createSupabaseServer()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, rating } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Review title is required' }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Review content is required' }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify the chapter exists and user has access
    const { data: chapter, error: chapterError } = await supabase
      .from('project_chapters')
      .select(`
        id,
        project_id,
        projects!inner (
          id,
          owner_id,
          visibility
        )
      `)
      .eq('id', chapterId)
      .single()

    if (chapterError || !chapter) {
      console.error('Chapter lookup error:', chapterError)
      return NextResponse.json({ 
        error: 'Chapter not found',
        details: chapterError?.message 
      }, { status: 404 })
    }

    // Check if user has permission to review
    const project = chapter.projects as any
    const canReview = project.visibility === 'public' || 
                     project.visibility === 'preview' || 
                     project.owner_id === user.id

    if (!canReview) {
      return NextResponse.json({ 
        error: 'You do not have permission to review this chapter' 
      }, { status: 403 })
    }

    // Check if user already has a review for this chapter
    const { data: existingReview } = await supabase
      .from('chapter_reviews')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this chapter. You can update your existing review instead.' 
      }, { status: 409 })
    }

    // Create the review
    const { data: newReview, error: insertError } = await supabase
      .from('chapter_reviews')
      .insert({
        chapter_id: chapterId,
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        rating: parseInt(rating)
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Supabase error creating review:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create review', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    // Get the profile information for the new review
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    const reviewWithProfile = {
      ...newReview,
      profiles: profile || { display_name: 'Unknown User', avatar_url: null }
    }

    return NextResponse.json({ review: reviewWithProfile }, { status: 201 })
  } catch (error) {
    console.error('Error in reviews POST API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const chapterId = resolvedParams.id
    console.log('Updating review for chapter:', chapterId)
    
    const supabase = await createSupabaseServer()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, rating } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Review title is required' }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Review content is required' }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('chapter_reviews')
      .update({
        title: title.trim(),
        content: content.trim(),
        rating: parseInt(rating)
      })
      .eq('chapter_id', chapterId)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Supabase error updating review:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update review', 
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    if (!updatedReview) {
      return NextResponse.json({ 
        error: 'Review not found or you do not have permission to update it' 
      }, { status: 404 })
    }

    // Get the profile information for the updated review
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    const reviewWithProfile = {
      ...updatedReview,
      profiles: profile || { display_name: 'Unknown User', avatar_url: null }
    }

    return NextResponse.json({ review: reviewWithProfile })
  } catch (error) {
    console.error('Error in reviews PUT API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
