'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  User,
  Star,
  Eye,
  Clock,
  CheckCircle,
  BookOpen,
  MoreHorizontal,
  UserPlus,
  Flag,
  ThumbsUp,
  ThumbsDown,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Reply,
  Edit,
  BarChart3,
  Settings,
  ExternalLink,
  Bell,
  Plus,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Pen
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/user-avatar'
import ProfileModal from '@/components/profile-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  toggleProjectBookmark, 
  isProjectBookmarked
} from '@/lib/bookmarks'

// Navigation component from marketing layout
function Navigation({ currentUser, isLoadingUser }: { currentUser: any; isLoadingUser: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser?.id) return

      const supabase = createSupabaseClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    }

    if (currentUser) {
      fetchUserProfile()
    }
  }, [currentUser?.id])

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const normalizedRole = role?.toLowerCase()
    switch (normalizedRole) {
      case 'writer':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'reader':
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm' 
        : 'bg-white border-b border-gray-200'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={!isLoadingUser && currentUser ? "/app/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors">
              StoryFoundry
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link href="/app/dashboard" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/app/projects" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Projects
                </Link>
                <Link href="/app/search" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Search
                </Link>
                
                {/* Right side actions */}
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-gray-800">
                    <Bell className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </Button>

                  {/* User Menu */}
                  <div className="group relative">
                    <div className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors cursor-pointer">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{userProfile?.display_name || currentUser.email}</div>
                        {userProfile && (
                          <div className="flex justify-end mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(userProfile.role)}`}>
                              {userProfile.role.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Dropdown Menu - Shows on hover */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Settings className="w-4 h-4 mr-3 text-gray-500" />
                          Settings
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/features" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="/signin" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/get-started" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 p-6 mt-4 shadow-lg">
              <div className="space-y-4">
                {currentUser ? (
                  <>
                    <Link href="/app/dashboard" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/app/projects" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Projects
                    </Link>
                    <Link href="/app/search" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Search
                    </Link>
                    <hr className="border-gray-200" />
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="block w-full text-left text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/features" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Features
                    </Link>
                    <Link href="/pricing" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Pricing
                    </Link>
                    <hr className="border-gray-200" />
                    <Link href="/signin" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-gray-800 font-medium transition-colors">
                      Sign In
                    </Link>
                    <Link href="/get-started" onClick={() => setIsOpen(false)} className="btn-primary w-full justify-center">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

interface Project {
  id: string
  title: string
  logline: string
  description: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  created_at: string
  updated_at: string
  owner_id: string
  profiles: {
    id: string
    display_name: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string
    bio?: string
    verified_pro: boolean
  }
}

interface ProjectContent {
  id: string
  content: string
  updated_at: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id?: string | null
  profiles: {
    id: string
    display_name: string
    avatar_url?: string
    first_name?: string
    last_name?: string
  }
  replies?: Comment[]
  like_count?: number
  dislike_count?: number
  user_reaction?: { is_like: boolean } | null
  comment_likes?: Array<{ user_id: string; is_like: boolean }>
}

interface ReadingProgress {
  progress_percentage: number
  last_position: number
  is_completed: boolean
  completed_at?: string
  updated_at: string
}

export default function PublicProjectPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [content, setContent] = useState<ProjectContent | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Reading features
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isWriterFavorited, setIsWriterFavorited] = useState(false)
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentSortOrder, setCommentSortOrder] = useState<'desc' | 'asc'>('desc') // desc = newest first, asc = oldest first
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // comment ID being replied to
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  
  // Comment editing and interaction states
  const [editingComment, setEditingComment] = useState<string | null>(null) // comment ID being edited
  const [editContent, setEditContent] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null) // comment ID being deleted
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null) // Store profile ID instead of object
  
  // Reading progress tracking
  const [scrollPosition, setScrollPosition] = useState(0)
  const [contentLength, setContentLength] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [maxProgressReached, setMaxProgressReached] = useState(0)
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null)
  const [timeSpentReading, setTimeSpentReading] = useState(0)
  const [progressMilestones, setProgressMilestones] = useState<Set<number>>(new Set())

  // Check if current user is the project owner
  const isProjectOwner = currentUser && project && currentUser.id === project.owner_id

  // Helper function to determine what to display for author
  const getAuthorDisplay = (profile: any) => {
    console.log('Profile data in getAuthorDisplay:', profile)
    if (!profile) return 'Unknown Author'
    
    // If profile is private, show "Account is Private"
    if (profile.profile_visibility === 'private') {
      return 'Account is Private'
    }
    
    // Otherwise show display name or fallback
    return profile.display_name || 'Unknown Author'
  }

  // Helper function to check if profile interactions should be disabled
  const isProfileInteractionDisabled = (profile: any) => {
    console.log('Checking profile interactions for:', profile)
    // Allow all profile viewing now that we have request access functionality
    // Users can view private profiles and request access if needed
    const disabled = false
    console.log('Profile interactions disabled:', disabled)
    return disabled
  }

  useEffect(() => {
    loadProjectAndUser()
  }, [projectId])

  useEffect(() => {
    if (currentUser && content && project) {
      loadUserInteractions()
    }
  }, [currentUser, content, project])

  useEffect(() => {
    if (project) {
      loadComments()
    }
  }, [commentSortOrder, project])

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      // Find the content container
      const contentElement = document.getElementById('story-content') as HTMLElement
      if (!contentElement) {
        setScrollPosition(0)
        return
      }

      const contentRect = contentElement.getBoundingClientRect()
      const contentTop = contentElement.offsetTop
      const contentHeight = contentElement.offsetHeight
      
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      
      // Check if content is in view
      if (scrollTop + windowHeight < contentTop) {
        // Haven't reached content yet
        setScrollPosition(0)
        return
      }
      
      // Start tracking reading time when user first reaches content
      if (readingStartTime === null) {
        setReadingStartTime(Date.now())
      }
      
      // Calculate how much of the content has been scrolled past
      const contentStartPosition = contentTop
      const contentEndPosition = contentTop + contentHeight
      const currentScrollBottom = scrollTop + windowHeight
      
      // Progress calculation
      let percentage = 0
      
      if (currentScrollBottom >= contentEndPosition) {
        // Reached or passed the end of content
        percentage = 100
      } else if (currentScrollBottom > contentStartPosition) {
        // In the middle of reading content
        const scrolledThroughContent = currentScrollBottom - contentStartPosition
        const totalContentToScroll = contentHeight
        percentage = Math.min((scrolledThroughContent / totalContentToScroll) * 100, 100)
      }
      
      setScrollPosition(Math.round(percentage))
      
      // Track progress milestones (every 10% increment)
      const milestone = Math.floor(percentage / 10) * 10
      if (milestone > 0 && !progressMilestones.has(milestone)) {
        setProgressMilestones(prev => new Set(prev).add(milestone))
      }
      
      // Track maximum progress reached (only if moving forward)
      if (percentage > maxProgressReached) {
        setMaxProgressReached(percentage)
      }
      
      // Update time spent reading
      if (readingStartTime) {
        setTimeSpentReading(Date.now() - readingStartTime)
      }
      
      // Smart completion detection
      if (percentage >= 100 && !isCompleted && currentUser) {
        const timeSpentMinutes = timeSpentReading / (1000 * 60)
        const milestonesReached = progressMilestones.size
        const estimatedReadingTime = (contentLength / 1000) * 2 // ~2 minutes per 1000 characters
        
        // Conditions for marking as completed:
        // 1. Must have spent reasonable time reading (at least 30% of estimated time)
        // 2. Must have hit at least 5 progress milestones (50% of content)
        // 3. Must have actually reached 100%
        if (timeSpentMinutes >= estimatedReadingTime * 0.3 && milestonesReached >= 5) {
          setIsCompleted(true)
          markStoryCompleted(percentage, scrollTop, timeSpentMinutes, milestonesReached)
        }
      }
      
      // Save progress to database every 5% increment (only if user is logged in)
      if (currentUser && content && percentage % 5 < 1) {
        saveReadingProgress(percentage, scrollTop)
      }
    }

    // Set initial scroll position
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [content, currentUser, contentLength])

  const loadProjectAndUser = async () => {
    console.log('Loading project:', projectId)
    setIsLoadingUser(true)
    try {
      const supabase = createSupabaseClient()
      
      // Get current user (optional for public viewing)
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user?.id || 'No user')
      setCurrentUser(user)
      setIsLoadingUser(false)

      if (user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }

      // Load project with writer info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:owner_id (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            bio,
            verified_pro,
            profile_visibility,
            discoverable
          )
        `)
        .eq('id', projectId)
        .single()

      console.log('Project data:', projectData)
      console.log('Project error:', projectError)

      if (projectError || !projectData) {
        console.error('Project not found:', projectError)
        router.push('/app/search')
        return
      }

      // Check if project is public
      if (projectData.visibility !== 'public') {
        console.error('Project is not public:', projectData.visibility)
        router.push('/app/search')
        return
      }

      setProject(projectData)

      // Load project content - try both project_content table and description field
      let contentToSet = null
      
      try {
        const { data: contentData, error: contentError } = await supabase
          .from('project_content')
          .select('*')
          .eq('project_id', projectId)
          .eq('asset_type', 'content')
          .order('updated_at', { ascending: false })
          .limit(1)

        console.log('Content data:', contentData)
        console.log('Content error:', contentError)

        if (contentData && contentData.length > 0 && contentData[0].content) {
          contentToSet = contentData[0]
          setContentLength(contentData[0].content.length)
        }
      } catch (contentError) {
        console.log('Could not load project_content:', contentError)
        // Continue to fallback - this is expected if table doesn't exist or no access
      }

      // If no content from project_content table, use project description as fallback
      if (!contentToSet) {
        const fallbackContent = {
          id: 'fallback',
          content: projectData.description || 'No content available for this project.',
          updated_at: projectData.updated_at
        }
        contentToSet = fallbackContent
        setContentLength(fallbackContent.content.length)
      }

      setContent(contentToSet)

      // Load comments
      await loadComments()

    } catch (error) {
      console.error('Error loading project:', error)
      setIsLoadingUser(false)
      // Still try to set a fallback content before redirecting
      if (project && !content) {
        const emergencyContent = {
          id: 'emergency',
          content: 'Content temporarily unavailable.',
          updated_at: new Date().toISOString()
        }
        setContent(emergencyContent)
      }
      // Don't redirect immediately if we have a project, let user see basic info
      if (!project) {
        router.push('/app/search')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserInteractions = async () => {
    if (!currentUser) return

    try {
      // Load bookmark status using centralized system
      const bookmarkStatus = await isProjectBookmarked(projectId, currentUser.id)
      setIsBookmarked(bookmarkStatus)

      // Check if user is following the writer
      if (project?.profiles?.id) {
        const supabase = createSupabaseClient()
        const { data: followData, error: followError } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', project.profiles.id)
          .maybeSingle()

        if (!followError) {
          setIsWriterFavorited(!!followData)
        }
      }

      // Load reading progress (handle table not existing)
      const supabase = createSupabaseClient()
      const { data: progress, error: progressError } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', currentUser.id)
        .single()

      if (!progressError && progress) {
        setReadingProgress(progress)
        
        // Set completion status and max progress from database
        if (progress.is_completed) {
          setIsCompleted(true)
          setMaxProgressReached(100)
        } else {
          setMaxProgressReached(progress.progress_percentage || 0)
        }
      }

    } catch (error) {
      console.log('Some user interaction features not available yet:', error)
      // Don't fail if tables don't exist yet
    }
  }

  const loadComments = async () => {
    try {
      const supabase = createSupabaseClient()
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('project_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url,
            first_name,
            last_name,
            profile_visibility,
            discoverable
          ),
          comment_likes (
            user_id,
            is_like
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: commentSortOrder === 'asc' })

      if (commentsError) {
        console.log('Comments table not available yet:', commentsError.message)
        // Don't fail if comments table doesn't exist yet
        setComments([])
        return
      }

      if (commentsData) {
        // Organize into parent-child structure for proper threading
        const parentComments = commentsData.filter(comment => !comment.parent_id)
        const childComments = commentsData.filter(comment => comment.parent_id)
        
        const organizedComments = parentComments.map(parent => {
          const replies = childComments
            .filter(child => child.parent_id === parent.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          
          return {
            ...parent,
            replies: replies,
            like_count: parent.comment_likes?.filter((like: any) => like.is_like).length || 0,
            dislike_count: parent.comment_likes?.filter((like: any) => !like.is_like).length || 0,
            user_reaction: currentUser ? parent.comment_likes?.find((like: any) => like.user_id === currentUser.id) : null
          }
        }).map(parent => ({
          ...parent,
          replies: parent.replies.map((reply: any) => ({
            ...reply,
            like_count: reply.comment_likes?.filter((like: any) => like.is_like).length || 0,
            dislike_count: reply.comment_likes?.filter((like: any) => !like.is_like).length || 0,
            user_reaction: currentUser ? reply.comment_likes?.find((like: any) => like.user_id === currentUser.id) : null
          }))
        }))

        setComments(organizedComments)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([]) // Set empty array as fallback
    }
  }

  const toggleBookmark = async () => {
    if (!currentUser) {
      router.push('/signin')
      return
    }

    try {
      const newBookmarkStatus = await toggleProjectBookmark(projectId, currentUser.id)
      setIsBookmarked(newBookmarkStatus)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const toggleWriterFavorite = async () => {
    if (!currentUser || !project) {
      router.push('/signin')
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      if (isWriterFavorited) {
        // Unfollow the writer
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', project.profiles?.id)

        if (error) {
          console.error('Error unfollowing writer:', error)
          return
        }
        
        setIsWriterFavorited(false)
      } else {
        // Follow the writer
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: project.profiles?.id
          })

        if (error) {
          console.error('Error following writer:', error)
          return
        }
        
        setIsWriterFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling writer follow:', error)
    }
  }

  const saveReadingProgress = async (percentage: number, position: number) => {
    if (!currentUser) return

    try {
      const supabase = createSupabaseClient()

      await supabase
        .from('reading_progress')
        .upsert({
          project_id: projectId,
          user_id: currentUser.id,
          progress_percentage: percentage,
          last_position: position,
          updated_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error saving reading progress:', error)
    }
  }

  const markStoryCompleted = async (percentage: number, position: number, readingTimeMinutes?: number, milestones?: number) => {
    if (!currentUser) return

    try {
      const supabase = createSupabaseClient()

      // Mark story as completed with additional metadata
      await supabase
        .from('reading_progress')
        .upsert({
          project_id: projectId,
          user_id: currentUser.id,
          progress_percentage: percentage,
          last_position: position,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reading_time_minutes: readingTimeMinutes || 0,
          milestones_reached: milestones || 0
        })

      console.log(`Story marked as completed! Reading time: ${readingTimeMinutes?.toFixed(1)}min, Milestones: ${milestones}`)

    } catch (error) {
      console.error('Error marking story as completed:', error)
    }
  }

  const submitComment = async () => {
    if (!currentUser || !newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      setShowCommentForm(false)
      await loadComments()

    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const submitReply = async () => {
    if (!currentUser || !replyContent.trim() || !replyingTo) return

    setIsSubmittingReply(true)
    try {
      const supabase = createSupabaseClient()
      
      // Post as a proper threaded reply with parent_id
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          content: replyContent.trim(),
          parent_id: replyingTo // This creates the proper nesting
        })

      if (error) throw error

      setReplyContent('')
      setReplyingTo(null)
      await loadComments()

    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const toggleCommentLike = async (commentId: string, isLike: boolean) => {
    if (!currentUser) {
      router.push('/signin')
      return
    }

    try {
      const supabase = createSupabaseClient()

      // Check if user already has a reaction
      const { data: existingReaction } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .single()

      if (existingReaction) {
        if (existingReaction.is_like === isLike) {
          // Remove reaction if clicking the same one
          await supabase
            .from('comment_likes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id)
        } else {
          // Update reaction if switching
          await supabase
            .from('comment_likes')
            .update({ is_like: isLike })
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id)
        }
      } else {
        // Add new reaction
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id,
            is_like: isLike
          })
      }

      await loadComments()
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const submitEdit = async () => {
    if (!editContent.trim() || !editingComment) return

    setIsSubmittingEdit(true)
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('project_comments')
        .update({ content: editContent.trim() })
        .eq('id', editingComment)

      if (error) throw error

      setEditingComment(null)
      setEditContent('')
      await loadComments()

    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeletingComment(commentId)
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      await loadComments()

    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeletingComment(null)
    }
  }

  const handleBackNavigation = () => {
    // First priority: Check if we came from a profile modal
    const modalData = sessionStorage.getItem('returnToProfileModal')
    if (modalData) {
      try {
        const { profileId, currentUserRole } = JSON.parse(modalData)
        sessionStorage.removeItem('returnToProfileModal')
        
        // Create custom event to trigger modal reopening
        const event = new CustomEvent('reopenProfileModal', {
          detail: { profileId, currentUserRole }
        })
        window.dispatchEvent(event)
        
        // Navigate back to the page that had the modal
        router.back()
        return
      } catch (error) {
        console.error('Error parsing modal data:', error)
      }
    }
    
    // Second priority: Check URL parameters for specific navigation
    const fromParam = searchParams.get('from')
    if (fromParam === 'library') {
      router.push('/app/library')
    } else if (fromParam === 'search') {
      router.push('/app/search')
    } else {
      // Default fallback - check if there's browser history to go back to
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/app/search')
      }
    }
  }

  const recordView = async () => {
    if (!currentUser) return

    try {
      const supabase = createSupabaseClient()
      
      await supabase
        .from('engagement_events')
        .insert({
          project_id: projectId,
          actor_id: currentUser.id,
          kind: 'view',
          weight: 1
        })
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }

  const handleViewProfile = () => {
    if (project?.profiles?.id) {
      setSelectedProfile(project.profiles.id) // Just store the profile ID
      setShowProfileModal(true)
    }
  }

  const handleViewCommentProfile = (profileId: string) => {
    console.log('Profile ID clicked:', profileId)
    if (profileId) {
      console.log('Setting selected profile and showing modal')
      setSelectedProfile(profileId)
      setShowProfileModal(true)
    } else {
      console.log('No profile ID provided')
    }
  }

  useEffect(() => {
    if (currentUser && project) {
      recordView()
    }
  }, [currentUser, project])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">This project doesn't exist or isn't available for public viewing.</p>
          <Link href="/app/search" className="text-purple-600 hover:text-purple-700">
            ← Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navigation currentUser={currentUser} isLoadingUser={isLoadingUser} />
      
      {/* Project Header */}
      <header className="bg-white border-b border-gray-200 sticky top-16 z-40 mt-16">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackNavigation}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-800">{project.title}</h1>
                <p className="text-sm text-gray-600">{project.logline}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Reading Progress */}
              {currentUser && (
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  {isCompleted ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{Math.round(scrollPosition)}% read</span>
                      {scrollPosition >= 100 && (
                        <span className="text-xs text-amber-600 ml-1">
                          (Keep reading to complete)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-green-600' : 'bg-purple-600'
              }`}
              style={{ width: `${isCompleted ? 100 : scrollPosition}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Project Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{project.title}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          {project.format}
                        </span>
                        {project.genre && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {project.genre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed">{project.logline}</p>
                
                {project.description && (
                  <p className="text-gray-600 leading-relaxed mt-3">{project.description}</p>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <div id="story-content" className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                    {content.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Comments ({comments.length})</span>
                </h3>
                
                <div className="flex items-center space-x-3">
                  {/* Comment Sort Controls */}
                  {comments.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Sort:</span>
                      <button
                        onClick={() => setCommentSortOrder('desc')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          commentSortOrder === 'desc'
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Newest first"
                      >
                        <SortDesc className="w-3 h-3" />
                        <span>Newest</span>
                      </button>
                      <button
                        onClick={() => setCommentSortOrder('asc')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          commentSortOrder === 'asc'
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Oldest first"
                      >
                        <SortAsc className="w-3 h-3" />
                        <span>Oldest</span>
                      </button>
                    </div>
                  )}
                  
                  {currentUser && (
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      className="btn-primary text-sm"
                    >
                      Add Comment
                    </button>
                  )}
                </div>
              </div>

              {/* Comment Form */}
              {showCommentForm && currentUser && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this project..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setShowCommentForm(false)
                        setNewComment('')
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="btn-primary disabled:opacity-50"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id}>
                      {/* Parent Comment */}
                      <div className="flex space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                        <UserAvatar 
                          user={{
                            avatar_url: comment.profiles?.avatar_url,
                            display_name: comment.profiles?.display_name,
                            first_name: comment.profiles?.first_name,
                            last_name: comment.profiles?.last_name
                          }}
                          size="sm"
                          fallbackClassName="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  console.log('Comment clicked:', comment)
                                  console.log('Profile data:', comment.profiles)
                                  console.log('Profile ID:', comment.profiles?.id)
                                  console.log('User ID:', comment.user_id)
                                  const profileId = comment.profiles?.id || comment.user_id
                                  console.log('Using profile ID:', profileId)
                                  handleViewCommentProfile(profileId)
                                }}
                                disabled={isProfileInteractionDisabled(comment.profiles)}
                                className={`font-medium transition-colors ${
                                  isProfileInteractionDisabled(comment.profiles)
                                    ? 'text-gray-800 cursor-default'
                                    : 'text-gray-800 hover:text-purple-600 hover:underline cursor-pointer'
                                }`}
                              >
                                {getAuthorDisplay(comment.profiles)}
                              </button>
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </span>
                            </div>
                            
                            {/* Edit/Delete menu for comment owner */}
                            {currentUser && currentUser.id === comment.user_id && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => startEditComment(comment)}
                                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteComment(comment.id)}
                                  disabled={deletingComment === comment.id}
                                  className="text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                  {deletingComment === comment.id ? '...' : '×'}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Comment content - editable if editing */}
                          {editingComment === comment.id ? (
                            <div className="mb-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-sm"
                                rows={2}
                              />
                              <div className="flex items-center justify-end space-x-2 mt-2">
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={submitEdit}
                                  disabled={!editContent.trim() || isSubmittingEdit}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isSubmittingEdit ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 leading-relaxed mb-2">{comment.content}</p>
                          )}
                          
                          {/* Like/Dislike and Reply buttons */}
                          <div className="flex items-center space-x-4">
                            {/* Like/Dislike buttons */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleCommentLike(comment.id, true)}
                                className={`flex items-center space-x-1 text-xs transition-colors ${
                                  comment.user_reaction?.is_like
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-blue-600'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{comment.like_count || 0}</span>
                              </button>
                              <button
                                onClick={() => toggleCommentLike(comment.id, false)}
                                className={`flex items-center space-x-1 text-xs transition-colors ${
                                  comment.user_reaction && !comment.user_reaction.is_like
                                    ? 'text-red-600'
                                    : 'text-gray-500 hover:text-red-600'
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{comment.dislike_count || 0}</span>
                              </button>
                            </div>
                            
                            {/* Reply button */}
                            {currentUser && (
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                              >
                                <Reply className="w-3 h-3" />
                                <span>Reply</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-11 mt-2 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3 p-3 rounded-lg bg-gray-50 border-l-2 border-purple-200">
                              <UserAvatar 
                                user={{
                                  avatar_url: reply.profiles?.avatar_url,
                                  display_name: reply.profiles?.display_name,
                                  first_name: reply.profiles?.first_name,
                                  last_name: reply.profiles?.last_name
                                }}
                                size="sm"
                                fallbackClassName="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-xs"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        const profileId = reply.profiles?.id || reply.user_id
                                        handleViewCommentProfile(profileId)
                                      }}
                                      disabled={isProfileInteractionDisabled(reply.profiles)}
                                      className={`font-medium text-sm transition-colors ${
                                        isProfileInteractionDisabled(reply.profiles)
                                          ? 'text-gray-800 cursor-default'
                                          : 'text-gray-800 hover:text-purple-600 hover:underline cursor-pointer'
                                      }`}
                                    >
                                      {getAuthorDisplay(reply.profiles)}
                                    </button>
                                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {new Date(reply.created_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </span>
                                  </div>
                                  
                                  {/* Edit/Delete menu for reply owner */}
                                  {currentUser && currentUser.id === reply.user_id && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => startEditComment(reply)}
                                        className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteComment(reply.id)}
                                        disabled={deletingComment === reply.id}
                                        className="text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                      >
                                        {deletingComment === reply.id ? '...' : '×'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Reply content - editable if editing */}
                                {editingComment === reply.id ? (
                                  <div className="mb-2">
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-sm"
                                      rows={2}
                                    />
                                    <div className="flex items-center justify-end space-x-2 mt-2">
                                      <button
                                        onClick={cancelEdit}
                                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={submitEdit}
                                        disabled={!editContent.trim() || isSubmittingEdit}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {isSubmittingEdit ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-700 text-sm leading-relaxed mb-2">{reply.content}</p>
                                )}
                                
                                {/* Like/Dislike buttons for replies */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleCommentLike(reply.id, true)}
                                    className={`flex items-center space-x-1 text-xs transition-colors ${
                                      reply.user_reaction?.is_like
                                        ? 'text-blue-600'
                                        : 'text-gray-500 hover:text-blue-600'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>{reply.like_count || 0}</span>
                                  </button>
                                  <button
                                    onClick={() => toggleCommentLike(reply.id, false)}
                                    className={`flex items-center space-x-1 text-xs transition-colors ${
                                      reply.user_reaction && !reply.user_reaction.is_like
                                        ? 'text-red-600'
                                        : 'text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                    <span>{reply.dislike_count || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form */}
                      {replyingTo === comment.id && currentUser && (
                        <div className="ml-11 mt-3 p-3 bg-gray-50 rounded-lg border-l-2 border-purple-200">
                          <div className="flex items-start space-x-2">
                            <UserAvatar 
                              user={{
                                avatar_url: userProfile?.avatar_url,
                                display_name: userProfile?.display_name,
                                first_name: userProfile?.first_name,
                                last_name: userProfile?.last_name
                              }}
                              size="sm"
                              fallbackClassName="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs"
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-2">
                                Replying to{' '}
                                <button
                                  onClick={() => handleViewCommentProfile(comment.profiles?.id)}
                                  disabled={isProfileInteractionDisabled(comment.profiles)}
                                  className={`font-medium ${
                                    isProfileInteractionDisabled(comment.profiles)
                                      ? 'text-gray-600 cursor-default'
                                      : 'text-purple-600 hover:text-purple-700 hover:underline'
                                  }`}
                                >
                                  {getAuthorDisplay(comment.profiles)}
                                </button>
                              </p>
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-sm"
                                rows={2}
                              />
                              <div className="flex items-center justify-end space-x-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyContent('')
                                  }}
                                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={submitReply}
                                  disabled={!replyContent.trim() || isSubmittingReply}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                                >
                                  {isSubmittingReply ? 'Posting...' : 'Reply'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writer Info or Project Owner Actions */}
            {isProjectOwner ? (
              /* Project Owner Dashboard */
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Your Project</span>
                </h3>
                
                <div className="space-y-3">
                  <Link
                    href={`/app/projects/${projectId}`}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Edit Project</p>
                      <p className="text-xs text-blue-600">Update content and details</p>
                    </div>
                  </Link>
                  
                  <Link
                    href={`/app/projects/${projectId}/settings`}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Project Settings</p>
                      <p className="text-xs text-gray-600">Manage visibility and features</p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Analytics</p>
                      <p className="text-xs text-green-600">Views: {Math.floor(Math.random() * 100) + 10} • Comments: {comments.length}</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Share your project:</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                      className="flex items-center space-x-2 w-full p-2 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-purple-600" />
                      <span className="text-xs text-purple-700">Copy public link</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Writer Info for other viewers */
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Writer</span>
                </h3>
                
                <div className="flex items-start space-x-3">
                  <UserAvatar 
                    user={{
                      avatar_url: project.profiles?.avatar_url,
                      display_name: project.profiles?.display_name,
                      first_name: project.profiles?.first_name,
                      last_name: project.profiles?.last_name
                    }}
                    size="custom"
                    className="w-12 h-12 flex-shrink-0"
                    fallbackClassName="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-800">{getAuthorDisplay(project.profiles)}</h4>
                      {project.profiles?.verified_pro && !isProfileInteractionDisabled(project.profiles) && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    {project.profiles?.bio && !isProfileInteractionDisabled(project.profiles) && (
                      <p className="text-sm text-gray-600 mb-3">{project.profiles.bio}</p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleWriterFavorite}
                        disabled={isProfileInteractionDisabled(project.profiles)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          isProfileInteractionDisabled(project.profiles)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isWriterFavorited
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>{isWriterFavorited ? 'Following' : 'Follow'}</span>
                      </button>
                      
                      <button
                        onClick={isProfileInteractionDisabled(project.profiles) ? undefined : handleViewProfile}
                        disabled={isProfileInteractionDisabled(project.profiles)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          isProfileInteractionDisabled(project.profiles)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Buzz Score</span>
                  <span className="font-medium">{project.buzz_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count</span>
                  <span className="font-medium">{content.content.split(/\s+/).filter(word => word.length > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Time</span>
                  <span className="font-medium">{Math.ceil(content.content.split(/\s+/).filter(word => word.length > 0).length / 200)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Reading Progress */}
            {currentUser && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Your Progress</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{Math.round(scrollPosition)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scrollPosition}%` }}
                    ></div>
                  </div>
                  {readingProgress && (
                    <p className="text-xs text-gray-500">
                      Last read: {new Date(readingProgress.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {!currentUser && (
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Join StoryFoundry</h3>
                <p className="text-purple-700 text-sm mb-4">
                  Sign up to bookmark projects, follow writers, and track your reading progress.
                </p>
                <Link href="/signup" className="btn-primary w-full text-center">
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <ProfileModal
          profileId={selectedProfile}
          currentUserRole={userProfile?.role || 'reader'}
          onClose={() => {
            setShowProfileModal(false)
            setSelectedProfile(null)
          }}
        />
      )}
    </div>
  )
}
