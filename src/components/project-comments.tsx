'use client'

import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth'
import { MessageSquare, Send, User, Clock } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  parent_id: string | null
  user: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
  }
}

interface ProjectCommentsProps {
  projectId: string
  userId?: string
}

export default function ProjectComments({ projectId, userId }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()

    // Load initial comments
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/projects/comments?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        } else {
          console.warn('Comments API not available:', response.status)
          setComments([]) // Set empty array if API fails
        }
      } catch (error) {
        console.error('Error loading comments:', error)
        setComments([]) // Set empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    loadComments()

    // Set up real-time subscription
    const channel = supabase
      .channel(`collaboration_project_comments_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_project_comments',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Real-time comment update:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Fetch the full comment data with user info
            const { data: newComment } = await supabase
              .from('collaboration_project_comments')
              .select(`
                id,
                content,
                created_at,
                updated_at,
                parent_id,
                user:profiles (
                  id,
                  display_name,
                  avatar_url,
                  verified_pro
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (newComment && newComment.user && !Array.isArray(newComment.user)) {
              setComments(prev => [...prev, newComment as unknown as Comment])
            }
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => 
              prev.map(comment => 
                comment.id === payload.new.id 
                  ? { ...comment, ...payload.new }
                  : comment
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => 
              prev.filter(comment => comment.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || !userId || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projects/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content: newComment.trim()
        })
      })

      if (response.ok) {
        setNewComment('')
        // Comment will be added via real-time subscription
      } else {
        throw new Error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (!userId) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs mt-2 text-gray-400">
                Note: Comments require database migration to be fully functional
              </p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {comment.user.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.display_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.user.display_name}
                    </span>
                    {comment.user.verified_pro && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        PRO
                      </span>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(comment.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real-time indicator */}
      {comments.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time updates enabled</span>
          </div>
        </div>
      )}
    </div>
  )
}
