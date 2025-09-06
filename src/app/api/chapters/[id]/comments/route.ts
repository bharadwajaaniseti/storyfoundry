import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const chapterId = resolvedParams.id
    console.log('Loading comments for chapter:', chapterId)
    
    // Validate chapter ID format
    if (!chapterId) {
      console.log('No chapter ID provided')
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 })
    }
    
    // Skip processing for test IDs
    if (chapterId.startsWith('test')) {
      console.log('Test chapter ID detected, returning empty comments')
      return NextResponse.json({ comments: [] })
    }
    
    const supabase = await createSupabaseServer()
    
    if (!supabase) {
      console.error('Failed to create Supabase client')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Get comments for the chapter with user profiles
    // Since both chapter_comments.user_id and profiles.id reference auth.users(id),
    // we need to manually join by getting the user info separately
    const { data: comments, error } = await supabase
      .from('chapter_comments')
      .select('*')
      .eq('chapter_id', chapterId)
      .is('parent_comment_id', null) // Only top-level comments first
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error fetching comments:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch comments', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    // Get profile information for each comment
    const commentsWithProfiles = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', comment.user_id)
          .single()
        
        return {
          ...comment,
          profiles: profile || { display_name: 'Unknown User', avatar_url: null }
        }
      })
    )

    console.log('Found comments:', comments?.length || 0)

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      commentsWithProfiles.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('chapter_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true })

        if (repliesError) {
          console.error('Error fetching replies:', repliesError)
          return { ...comment, replies: [] }
        }

        // Get profile information for each reply
        const repliesWithProfiles = await Promise.all(
          (replies || []).map(async (reply) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('id', reply.user_id)
              .single()
            
            return {
              ...reply,
              profiles: profile || { display_name: 'Unknown User', avatar_url: null }
            }
          })
        )

        return { ...comment, replies: repliesWithProfiles }
      })
    )

    return NextResponse.json({ comments: commentsWithReplies })
  } catch (error) {
    console.error('Error in comments API:', error)
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
    console.log('Creating comment for chapter:', chapterId)
    
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
    const { content, comment_type = 'general', parent_comment_id = null, line_number = null } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
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

    // Check if user has permission to comment
    const project = chapter.projects as any
    const canComment = project.visibility === 'public' || 
                      project.visibility === 'preview' || 
                      project.owner_id === user.id

    if (!canComment) {
      return NextResponse.json({ 
        error: 'You do not have permission to comment on this chapter' 
      }, { status: 403 })
    }

    // Create the comment
    const { data: newComment, error: insertError } = await supabase
      .from('chapter_comments')
      .insert({
        chapter_id: chapterId,
        user_id: user.id,
        content: content.trim(),
        comment_type,
        parent_comment_id,
        line_number
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Supabase error creating comment:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create comment', 
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    // Get the profile information for the new comment
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    const commentWithProfile = {
      ...newComment,
      profiles: profile || { display_name: 'Unknown User', avatar_url: null }
    }

    return NextResponse.json({ comment: commentWithProfile }, { status: 201 })
  } catch (error) {
    console.error('Error in comments POST API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
