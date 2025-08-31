'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  X
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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [publicProjects, setPublicProjects] = useState<Project[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

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

  useEffect(() => {
    loadProfileData()
  }, [profileId])

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

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
            <Button onClick={onClose} className={colorClasses.primaryButton}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Following
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                <Avatar className="w-20 h-20 rounded-2xl">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className={`text-2xl font-bold ${colorClasses.bgGradient} text-white rounded-2xl`}>
                    {profile.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
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
  )
}
