'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth-client'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/user-avatar'
import { 
  Users, 
  UserPlus, 
  UserCheck,
  Star,
  BookOpen,
  Calendar,
  Eye,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  MessageCircle,
  Share2,
  Globe,
  Twitter,
  Instagram,
  Github,
  Heart,
  Bookmark,
  Award,
  X,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface ProfileData {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  verified_pro: boolean
  role: string
  company: string | null
  country: string | null
  created_at: string
  location: string | null
  website: string | null
  twitter: string | null
  instagram: string | null
  github: string | null
  profile_visibility: 'public' | 'members' | 'private'
  followers_count?: number
  following_count?: number
  projects_count?: number
  books_read?: number
  reviews_count?: number
  total_reading_time?: number
  total_buzz_score?: number
}

interface Project {
  id: string
  title: string
  logline: string | null
  buzz_score: number
  created_at: string
  updated_at: string
  visibility: string
  total_words?: number
}

interface ProfileModalProps {
  profileId: string
  currentUserRole: string
  onClose: () => void
  onFollow?: () => void
  onUnfollow?: () => void
}

export default function ProfileModal({ profileId, currentUserRole, onClose, onFollow, onUnfollow }: ProfileModalProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [publicProjects, setPublicProjects] = useState<Project[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [hasAccessRequest, setHasAccessRequest] = useState(false)
  const [accessRequestStatus, setAccessRequestStatus] = useState<'pending' | 'approved' | 'denied' | null>(null)
  const [isLoadingAccessRequest, setIsLoadingAccessRequest] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  
  // Scroll state for modal
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Dynamic color scheme based on viewer's role
  const getColorClasses = (role: string) => {
    if (role === 'writer') {
      return {
        primary: 'bg-orange-500 text-white border-orange-500',
        primaryHover: 'hover:bg-orange-600',
        primaryButton: 'bg-orange-500 hover:bg-orange-600 text-white',
        primaryText: 'text-orange-600',
        primaryTextDark: 'text-orange-700',
        primaryLight: 'bg-orange-50',
        primaryMedium: 'bg-orange-100',
        borderLight: 'border-orange-300',
        bgGradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
        lightGradient: 'bg-gradient-to-br from-orange-50 to-orange-100/50'
      }
    } else {
      return {
        primary: 'bg-purple-500 text-white border-purple-500',
        primaryHover: 'hover:bg-purple-600',
        primaryButton: 'bg-purple-500 hover:bg-purple-600 text-white',
        primaryText: 'text-purple-600',
        primaryTextDark: 'text-purple-700',
        primaryLight: 'bg-purple-50',
        primaryMedium: 'bg-purple-100',
        borderLight: 'border-purple-300',
        bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
        lightGradient: 'bg-gradient-to-br from-purple-50 to-purple-100/50'
      }
    }
  }

  const colorClasses = getColorClasses(currentUserRole)

  const loadProfileData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)

        // Check if following
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .single()
        
        setIsFollowing(!!followData)
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        return
      }

      // Check privacy settings and access for private profiles
      if (profileData.profile_visibility === 'private' && (!user || user.id !== profileId)) {
        // Profile is private and viewer is not the owner
        if (user) {
          // Check if user has an existing access request or grant
          const [accessRequestData, accessGrantData] = await Promise.all([
            supabase
              .from('profile_access_requests')
              .select('status')
              .eq('profile_id', profileId)
              .eq('requester_id', user.id)
              .single(),
            supabase
              .from('profile_access_grants')
              .select('id')
              .eq('profile_id', profileId)
              .eq('granted_to_id', user.id)
              .single()
          ])

          setHasAccess(!!accessGrantData.data)
          if (accessRequestData.data) {
            // If the request was approved but there's no grant, it means access was revoked
            if (accessRequestData.data.status === 'approved' && !accessGrantData.data) {
              // Access was revoked, reset the request state so user can request again
              setHasAccessRequest(false)
              setAccessRequestStatus(null)
            } else {
              setHasAccessRequest(true)
              setAccessRequestStatus(accessRequestData.data.status)
            }
          }

          // If user has access, continue loading the profile normally
          if (accessGrantData.data) {
            // User has access, continue with normal profile loading
          } else {
            // User doesn't have access, show private profile state
            setProfile(profileData) // Set profile data for the private modal
            setIsLoading(false)
            return
          }
        } else {
          // Not authenticated, show private profile state
          setProfile(profileData) // Set profile data for the private modal
          setIsLoading(false)
          return
        }
      }

      if (profileData.profile_visibility === 'members' && !user) {
        // Profile is members-only and viewer is not authenticated
        setProfile(profileData) // Set profile data for the private modal
        setIsLoading(false)
        return
      }

      // Get follower/following counts
      const [followerData, followingData] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id')
          .eq('following_id', profileId),
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', profileId)
      ])

      // Get projects (only public ones) with word count
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          id, 
          title, 
          logline, 
          buzz_score, 
          created_at, 
          updated_at, 
          visibility,
          project_content(content)
        `)
        .eq('owner_id', profileId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(6)

      // Calculate total words for each project
      const projectsWithWordCount = projectsData?.map(project => {
        const totalWords = project.project_content?.reduce((total: number, content: any) => {
          const words = content.content ? content.content.split(/\s+/).filter((word: string) => word.length > 0).length : 0
          return total + words
        }, 0) || 0
        
        return {
          ...project,
          total_words: totalWords,
          project_content: undefined // Remove the content data as we only needed it for counting
        }
      }) || []

      // Get reading data if it's a reader
      let booksRead = 0, reviewsCount = 0, totalReadingTime = 0
      if (profileData.role?.toLowerCase() === 'reader') {
        const [readingData, commentsData] = await Promise.all([
          supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', profileId),
          supabase
            .from('project_comments')
            .select('id')
            .eq('user_id', profileId)
        ])

        booksRead = readingData?.data?.filter(r => r.is_completed).length || 0
        totalReadingTime = readingData?.data?.reduce((sum, r) => sum + (r.reading_time_minutes || 0), 0) || 0
        reviewsCount = commentsData?.data?.length || 0
      }

      const enhancedProfile = {
        ...profileData,
        followers_count: followerData.data?.length || 0,
        following_count: followingData.data?.length || 0,
        projects_count: projectsData?.length || 0,
        books_read: booksRead,
        reviews_count: reviewsCount,
        total_reading_time: totalReadingTime,
        total_buzz_score: projectsData?.reduce((sum: number, p: any) => sum + (p.buzz_score || 0), 0) || 0
      }

      setProfile(enhancedProfile)
      setPublicProjects(projectsWithWordCount)

    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    // Store the current modal state in sessionStorage to restore it on back
    sessionStorage.setItem('returnToProfileModal', JSON.stringify({
      profileId,
      currentUserRole
    }))
    
    // Navigate to the project page
    router.push(`/projects/${projectId}`)
  }

  const handleFollowToggle = async () => {
    if (!currentUser || !profile || isLoadingFollow) return

    setIsLoadingFollow(true)
    try {
      const supabase = createSupabaseClient()

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)

        if (error) throw error
        setIsFollowing(false)
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) - 1 } : null)
        onUnfollow?.()
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          })

        if (error) throw error
        setIsFollowing(true)
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : null)
        onFollow?.()
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoadingFollow(false)
    }
  }

  const handleAccessRequest = async () => {
    if (!currentUser || !profile || isLoadingAccessRequest) return

    setIsLoadingAccessRequest(true)
    try {
      const supabase = createSupabaseClient()
      
      // Try to create access request, handle duplicate case
      let insertData, insertError
      
      // First try a normal insert
      const insertResult = await supabase
        .from('profile_access_requests')
        .insert({
          profile_id: profile.id,
          requester_id: currentUser.id,
          message: `${currentUser.user_metadata?.display_name || 'A user'} would like to view your profile.`
        })
        .select()

      insertData = insertResult.data
      insertError = insertResult.error

      // If duplicate key error, this means there's already a request - we need to reset it to pending
      if (insertError && insertError.code === '23505') {
        // First, let's check the current request status
        const { data: currentRequest } = await supabase
          .from('profile_access_requests')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('requester_id', currentUser.id)
          .single()
        
        // Try to update the existing request to pending status
        const updateResult = await supabase
          .from('profile_access_requests')
          .update({
            status: 'pending',
            message: `${currentUser.user_metadata?.display_name || 'A user'} would like to view your profile.`,
            created_at: new Date().toISOString(),
            decided_at: null
          })
          .eq('id', currentRequest?.id)  // Use ID instead of profile_id + requester_id
          .select()

        insertData = updateResult.data
        insertError = updateResult.error
        
        if (insertError) {
          throw insertError
        }
        
        if (insertData && insertData.length > 0) {
          // Successfully updated
        } else {
          // Alternative: Delete the old request and create a new one
          const deleteResult = await supabase
            .from('profile_access_requests')
            .delete()
            .eq('id', currentRequest?.id)
          
          // Now create a new request
          const newInsertResult = await supabase
            .from('profile_access_requests')
            .insert({
              profile_id: profile.id,
              requester_id: currentUser.id,
              message: `${currentUser.user_metadata?.display_name || 'A user'} would like to view your profile.`
            })
            .select()
          
          insertData = newInsertResult.data
          insertError = newInsertResult.error
          
          if (insertError) {
            throw insertError
          }
        }
      } else {
        // Normal insert result
      }

      if (insertError) {
        throw insertError
      }

      // Create notification for profile owner
      const { error: notificationError } = await supabase.rpc('create_notification', {
        p_user_id: profile.id,
        p_type: 'profile_access_request',
        p_title: 'New Profile Access Request',
        p_message: `${currentUser.user_metadata?.display_name || 'A user'} has requested access to view your profile.`,
        p_data: {
          requester_id: currentUser.id,
          requester_name: currentUser.user_metadata?.display_name || 'A user'
        }
      })

      if (notificationError) {
        // Try manual notification creation as fallback
        await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            type: 'profile_access_request',
            title: 'New Profile Access Request',
            message: `${currentUser.user_metadata?.display_name || 'A user'} has requested access to view your profile.`,
            data: {
              requester_id: currentUser.id,
              requester_name: currentUser.user_metadata?.display_name || 'A user'
            }
          })
      }

      setHasAccessRequest(true)
      setAccessRequestStatus('pending')
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Access Request Sent',
        message: `Your request to view ${profile.display_name}'s profile has been sent.`
      })
      
      // Force refresh of any access management components
      window.dispatchEvent(new CustomEvent('profileAccessUpdated'))
    } catch (error) {
      console.error('Error requesting access:', error)
      addToast({
        type: 'error',
        title: 'Failed to Send Request',
        message: 'Unable to send access request. Please try again.'
      })
    } finally {
      setIsLoadingAccessRequest(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [profileId])

  // Check scroll position and update indicators
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    setCanScrollUp(scrollTop > 10)
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10)
    setShowScrollIndicator(scrollHeight > clientHeight)
  }

  useEffect(() => {
    if (profile) {
      setTimeout(checkScroll, 100) // Check after content loads
      const container = scrollContainerRef.current
      if (container) {
        container.addEventListener('scroll', checkScroll)
        window.addEventListener('resize', checkScroll)
        return () => {
          container.removeEventListener('scroll', checkScroll)
          window.removeEventListener('resize', checkScroll)
        }
      }
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className={`w-8 h-8 border-2 ${currentUserRole === 'writer' ? 'border-orange-500' : 'border-purple-500'} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if profile is private and user doesn't have access
  const isProfilePrivate = profile?.profile_visibility === 'private' && 
    currentUser?.id !== profile?.id && !hasAccess

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">
              Sorry, we couldn't find the profile you're looking for.
            </p>
            <Button onClick={onClose} className={colorClasses.primaryButton}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isProfilePrivate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <div className="mb-4">
              <UserAvatar 
                user={profile}
                size="custom" 
                className="w-16 h-16 rounded-2xl mx-auto mb-3"
                fallbackClassName={`text-lg font-bold ${colorClasses.bgGradient} text-white rounded-2xl`}
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Profile is Private</h2>
              <p className="text-sm text-gray-500 mb-1">{profile.display_name}</p>
            </div>
            
            <p className="text-gray-600 mb-6">
              This user has set their profile to private. Only they can view their profile information.
            </p>

            {currentUser ? (
              <div className="space-y-3">
                {!hasAccessRequest ? (
                  <Button 
                    onClick={handleAccessRequest}
                    disabled={isLoadingAccessRequest}
                    className={colorClasses.primaryButton}
                  >
                    {isLoadingAccessRequest ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Request Access
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {accessRequestStatus === 'pending' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center text-yellow-800">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Access request pending</span>
                        </div>
                      </div>
                    )}
                    {accessRequestStatus === 'denied' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-red-800">
                          <X className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Access request denied</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button variant="outline" onClick={onClose}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            ) : (
              <Button onClick={onClose} className={colorClasses.primaryButton}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Scroll Indicator - Top */}
        {showScrollIndicator && canScrollUp && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gradient-to-b from-white to-transparent h-8 w-full absolute -top-4"></div>
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-3 py-1 text-xs text-gray-500 font-medium animate-pulse">
              ↑ Scroll up
            </div>
          </div>
        )}

        {/* Scroll Indicator - Bottom */}
        {showScrollIndicator && canScrollDown && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gradient-to-t from-gray-50 to-transparent h-8 w-full absolute -bottom-4"></div>
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-3 py-1 text-xs text-gray-500 font-medium animate-pulse">
              ↓ Scroll down
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto scrollbar-hide"
          style={{ 
            maxHeight: '90vh',
          }}
          onScroll={checkScroll}
        >
          {/* Header */}
          <div className="p-6 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800 p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative">
                <UserAvatar 
                  user={profile}
                  size="custom" 
                  className="w-20 h-20 rounded-2xl"
                  fallbackClassName={`text-2xl font-bold ${colorClasses.bgGradient} text-white rounded-2xl`}
                />
                {profile.verified_pro && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                  {profile.verified_pro && (
                    <Badge className={`${colorClasses.primaryButton} text-white px-3 py-1`}>
                      Professional {profile.role === 'writer' ? 'Writer' : 'Reader'}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Usually responds in 2 hours
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentUser && currentUser.id !== profile.id && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  className={isFollowing ? "bg-gray-200 text-gray-700 hover:bg-gray-300 px-6" : `${colorClasses.primaryButton} px-6`}
                >
                  {isLoadingFollow ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : isFollowing ? (
                    <UserCheck className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              
              <Button variant="outline" className="px-6">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                <Users className={`w-6 h-6 ${colorClasses.primaryText}`} />
              </div>
              <div className="text-sm text-gray-500 mb-1">+12%</div>
              <div className="text-2xl font-bold text-gray-900">{profile.followers_count}</div>
              <div className="text-sm text-gray-600">Followers</div>
              <div className="text-xs text-gray-500">Active readers</div>
            </div>

            <div className="bg-white rounded-xl p-4 text-center">
              <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                <UserPlus className={`w-6 h-6 ${colorClasses.primaryText}`} />
              </div>
              <div className="text-sm text-gray-500 mb-1">Active</div>
              <div className="text-2xl font-bold text-gray-900">{profile.following_count}</div>
              <div className="text-sm text-gray-600">Following</div>
              <div className="text-xs text-gray-500">Connections</div>
            </div>

            {profile.role === 'writer' ? (
              <>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                    <BookOpen className={`w-6 h-6 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Published</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.projects_count}</div>
                  <div className="text-sm text-gray-600">Projects</div>
                  <div className="text-xs text-gray-500">Published works</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                    <TrendingUp className={`w-6 h-6 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Growing</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.total_buzz_score}</div>
                  <div className="text-sm text-gray-600">Total Buzz</div>
                  <div className="text-xs text-gray-500">Community score</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                    <BookOpen className={`w-6 h-6 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.books_read}</div>
                  <div className="text-sm text-gray-600">Books Read</div>
                  <div className="text-xs text-gray-500">Finished stories</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-2`}>
                    <MessageCircle className={`w-6 h-6 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-sm text-gray-500 mb-1">Active</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.reviews_count}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                  <div className="text-xs text-gray-500">Comments written</div>
                </div>
              </>
            )}
          </div>

          {/* Projects/Activity Section */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-xl ${colorClasses.bgGradient} flex items-center justify-center mr-3`}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {profile.role === 'writer' ? 'Public Projects' : 'Recent Reading'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {profile.role === 'writer' ? 'Stories ready for the world to discover' : 'Latest books and stories enjoyed'}
                  </p>
                </div>
              </div>
              {profile.role === 'writer' && (
                <div className={`px-4 py-2 bg-gradient-to-r ${colorClasses.lightGradient} border ${colorClasses.borderLight} rounded-xl`}>
                  <span className={`${colorClasses.primaryTextDark} text-sm font-semibold`}>
                    {publicProjects.length} {publicProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>
              )}
            </div>

            {profile.role === 'writer' ? (
              publicProjects.length > 0 ? (
                <div className="space-y-3">
                  {publicProjects.slice(0, 3).map((project) => (
                    <div 
                      key={project.id} 
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{project.title}</h4>
                          {project.logline && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{project.logline}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {project.total_words ? `${project.total_words.toLocaleString()} words` : 'Draft'}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="flex items-center text-sm font-medium">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {project.buzz_score}
                          </div>
                          <div className="text-xs text-gray-500">buzz score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">No Public Projects Yet</h4>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    This writer is still working on their first public story. Great stories take time to perfect!
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Reading Activity Private</h4>
                <p className="text-gray-600 max-w-sm mx-auto">
                  This reader's recent activity is private, but you can see their overall stats above.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
