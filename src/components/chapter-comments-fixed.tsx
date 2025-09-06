'use client'

import React, { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Heart,
  Star,
  Flag,
  Edit3,
  Trash2,
  MoreHorizontal,
  User,
  Quote,
  Award,
  Lightbulb,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createSupabaseClient } from '@/lib/auth'

interface Comment {
  id: string
  content: string
  comment_type: 'general' | 'suggestion' | 'critique' | 'praise'
  line_number?: number
  created_at: string
  updated_at: string
  profiles: {
    display_name: string
    avatar_url?: string
  }
  replies?: Comment[]
  user_id: string
}

interface Review {
  id: string
  rating: number
  title: string
  content: string
  created_at: string
  profiles: {
    display_name: string
    avatar_url?: string
  }
  user_id: string
}

interface ChapterCommentsProps {
  chapterId: string
  className?: string
}

const COMMENT_TYPES = [
  { value: 'general', label: 'General', icon: MessageCircle, color: 'blue' },
  { value: 'praise', label: 'Praise', icon: Heart, color: 'pink' },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'yellow' },
  { value: 'critique', label: 'Critique', icon: AlertCircle, color: 'orange' }
]

export default function ChapterComments({ chapterId, className = '' }: ChapterCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'general' | 'suggestion' | 'critique' | 'praise'>('general')
  const [newReview, setNewReview] = useState({ title: '', content: '', rating: 5 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const [activeTab, setActiveTab] = useState('comments')

  useEffect(() => {
    loadUser()
    loadComments()
    loadReviews()
  }, [chapterId])

  const loadUser = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/chapters/${chapterId}/comments`)
      
      if (!response.ok) {
        throw new Error('Failed to load comments')
      }

      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          title: 'Excellent character development!',
          content: 'The way you developed the main character in this chapter was fantastic. The dialogue felt natural and the pacing was perfect.',
          created_at: new Date().toISOString(),
          profiles: { display_name: 'BookLover123', avatar_url: '' },
          user_id: 'mock-user-1'
        },
        {
          id: '2', 
          rating: 4,
          title: 'Great chapter with minor suggestions',
          content: 'Really enjoyed this chapter! The plot advancement was solid. One small suggestion - perhaps a bit more description of the setting would help immerse readers even more.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          profiles: { display_name: 'WriterFriend', avatar_url: '' },
          user_id: 'mock-user-2'
        }
      ]
      setReviews(mockReviews)
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          comment_type: commentType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit comment')
      }

      const data = await response.json()
      setComments(prev => [...prev, { ...data.comment, replies: [] }])
      setNewComment('')
      setCommentType('general')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user) return

    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          comment_type: 'general',
          parent_comment_id: parentCommentId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit reply')
      }

      const data = await response.json()
      
      setComments(prev => prev.map(comment => 
        comment.id === parentCommentId 
          ? { ...comment, replies: [...(comment.replies || []), data.comment] }
          : comment
      ))
      
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const submitReview = async () => {
    if (!newReview.title.trim() || !newReview.content.trim() || !user) return

    try {
      setIsSubmitting(true)
      const mockNewReview: Review = {
        id: Date.now().toString(),
        rating: newReview.rating,
        title: newReview.title.trim(),
        content: newReview.content.trim(),
        created_at: new Date().toISOString(),
        profiles: { 
          display_name: user.user_metadata?.display_name || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url 
        },
        user_id: user.id
      }
      
      setReviews(prev => [mockNewReview, ...prev])
      setNewReview({ title: '', content: '', rating: 5 })
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStarRating = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star 
              className={`w-5 h-5 ${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
        {!interactive && (
          <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
        )}
      </div>
    )
  }

  const getCommentTypeConfig = (type: string) => {
    return COMMENT_TYPES.find(t => t.value === type) || COMMENT_TYPES[0]
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 3)
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length 
    : 0

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            Reader Feedback
          </h3>
          <div className="flex items-center space-x-4">
            {reviews.length > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-yellow-700">
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            )}
            <Badge variant="secondary" className="text-sm">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Badge>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm">
          Share your thoughts, suggestions, and detailed reviews on this chapter. Help the author improve their craft!
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 mx-6 mt-4">
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-0">
          {/* Comment Form */}
          {user ? (
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  {/* Comment Type Selector */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 self-center">Comment type:</span>
                    {COMMENT_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() => setCommentType(type.value as any)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            commentType === type.value
                              ? `bg-${type.color}-100 text-${type.color}-700 ring-2 ring-${type.color}-500 ring-opacity-30`
                              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {type.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Write your ${commentType} here... Be constructive and helpful to the author.`}
                      className="min-h-[100px] resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {newComment.length}/500 characters
                      </div>
                      <Button
                        onClick={submitComment}
                        disabled={!newComment.trim() || isSubmitting || newComment.length > 500}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-gray-100 bg-blue-50 text-center">
              <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-blue-800 font-medium mb-2">Join the conversation!</p>
              <p className="text-blue-600 text-sm mb-4">
                Sign in to leave comments and help authors improve their work.
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Sign In to Comment
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="p-6">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
                <p className="text-gray-500">
                  Be the first to share your thoughts on this chapter!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedComments.map((comment) => {
                  const typeConfig = getCommentTypeConfig(comment.comment_type)
                  const TypeIcon = typeConfig.icon
                  
                  return (
                    <div key={comment.id} className="group">
                      {/* Main Comment */}
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {comment.profiles?.display_name || 'Anonymous'}
                              </span>
                              <Badge variant="outline" className={`text-xs border-${typeConfig.color}-200 text-${typeConfig.color}-700`}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                            
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all">
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                          
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-orange-600 transition-colors"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                              <Heart className="w-3 h-3" />
                              <span>Helpful</span>
                            </button>
                          </div>
                          
                          {/* Reply Form */}
                          {replyingTo === comment.id && user && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.user_metadata?.avatar_url} />
                                  <AvatarFallback>
                                    <User className="w-4 h-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                  <Textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="min-h-[80px] text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyContent('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => submitReply(comment.id)}
                                      disabled={!replyContent.trim()}
                                      className="bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-14 mt-4 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={reply.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {reply.profiles?.display_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 bg-gray-100 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {reply.profiles?.display_name || 'Anonymous'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Show More Button */}
                {comments.length > 3 && !showAllComments && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllComments(true)}
                      className="border-gray-300"
                    >
                      Show {comments.length - 3} more comments
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-0">
          {/* Review Form */}
          {user ? (
            <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                    {renderStarRating(newReview.rating, true, (rating) => 
                      setNewReview(prev => ({ ...prev, rating }))
                    )}
                  </div>

                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Review title (e.g., 'Great character development!')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500"
                  />

                  <Textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write a detailed review... What did you like? What could be improved? Be specific and constructive."
                    className="min-h-[120px] resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {newReview.content.length}/1000 characters
                    </div>
                    <Button
                      onClick={submitReview}
                      disabled={!newReview.title.trim() || !newReview.content.trim() || isSubmitting || newReview.content.length > 1000}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Star className="w-4 h-4 mr-2" />
                      )}
                      Submit Review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-gray-100 bg-yellow-50 text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <p className="text-yellow-800 font-medium mb-2">Share your detailed review!</p>
              <p className="text-yellow-600 text-sm mb-4">
                Sign in to rate this chapter and provide detailed feedback to the author.
              </p>
              <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                Sign In to Review
              </Button>
            </div>
          )}

          {/* Reviews List */}
          <div className="p-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
                <p className="text-gray-500">
                  Be the first to leave a detailed review of this chapter!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.profiles?.avatar_url} />
                          <AvatarFallback>
                            {review.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">
                                {review.profiles?.display_name || 'Anonymous'}
                              </span>
                              {renderStarRating(review.rating)}
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(review.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {review.content}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-gray-100">
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600 transition-colors">
                              <ThumbsUp className="w-3 h-3" />
                              <span>Helpful</span>
                            </button>
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-orange-600 transition-colors">
                              <Reply className="w-3 h-3" />
                              <span>Respond</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
