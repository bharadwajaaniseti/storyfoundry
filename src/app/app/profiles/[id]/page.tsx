'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/user-avatar'
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
  Library
} from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  display_name: string
  first_name?: string | null
  last_name?: string | null
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
  total_buzz_score?: number
  books_read?: number
  reviews_count?: number
  total_reading_time?: number
}

interface Project {
  id: string
  title: string
  description: string | null
  logline: string | null
  buzz_score: number
  created_at: string
  updated_at: string
  visibility: string
}

export default function ReaderViewProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('reader')
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [publicProjects, setPublicProjects] = useState<Project[]>([])
  
  const profileId = params.id as string

  // Purple color scheme for reader's view
  const getColorClasses = () => {
    return {
      primary: 'bg-purple-500 text-white border-purple-500',
      primaryHover: 'hover:bg-purple-600',
      primaryButton: 'bg-purple-500 hover:bg-purple-600 text-white',
      primaryText: 'text-purple-600',
      primaryTextDark: 'text-purple-700',
      primaryLight: 'bg-purple-50',
      primaryMedium: 'bg-purple-100',
      borderLight: 'border-purple-300',
      ring: 'ring-purple-500/20',
      accent: 'text-purple-400',
      gradient: 'from-purple-50 to-white',
      cardBorder: 'border-l-purple-500',
      iconColor: 'text-purple-500',
      focusRing: 'focus:ring-purple-500/20 focus:border-purple-500',
      hoverBg: 'hover:bg-purple-50',
      hoverText: 'hover:text-purple-700',
      bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      lightGradient: 'bg-gradient-to-br from-purple-50 to-purple-100/50'
    }
  }

  const colorClasses = getColorClasses()

  const loadProfileData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user and role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(userProfile?.role?.toLowerCase() || 'reader')

        // Check if following
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .single()
        
        setIsFollowing(!!followData)
      }

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        router.push('/app/dashboard')
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

      // Get projects (only public ones visible to readers)
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title, description, logline, buzz_score, created_at, updated_at, visibility')
        .eq('owner_id', profileId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

      // Get reading progress data if viewing a reader
      let enhancedProfile = {
        ...profileData,
        followers_count: followerData.data?.length || 0,
        following_count: followingData.data?.length || 0,
        projects_count: projectsData?.length || 0,
        total_buzz_score: projectsData?.reduce((sum, p) => sum + (p.buzz_score || 0), 0) || 0
      }

      if (profileData.role?.toLowerCase() === 'reader') {
        // Get reading stats for readers
        const { data: readingData } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', profileId)

        const { data: commentsData } = await supabase
          .from('project_comments')
          .select('id')
          .eq('user_id', profileId)

        const booksRead = readingData?.filter(r => r.is_completed).length || 0
        const totalReadingTime = readingData?.reduce((sum, r) => sum + (r.reading_time_minutes || 0), 0) || 0

        enhancedProfile = {
          ...enhancedProfile,
          books_read: booksRead,
          reviews_count: commentsData?.length || 0,
          total_reading_time: totalReadingTime
        }
      }

      setProfile(enhancedProfile)
      setPublicProjects(projectsData || [])

    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
          <Link href="/app/following">
            <Button className={colorClasses.primaryButton}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Following
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isWriter = profile.role?.toLowerCase() === 'writer'
  const isReader = profile.role?.toLowerCase() === 'reader'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className={`h-32 bg-gradient-to-r ${colorClasses.lightGradient} rounded-t-2xl relative`}>
            <div className="absolute top-4 left-4">
              <Link href="/app/following">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Following
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="p-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
              <div className="flex items-end space-x-6 mb-6 md:mb-0">
                <UserAvatar 
                  user={{
                    avatar_url: profile.avatar_url,
                    display_name: profile.display_name,
                    first_name: profile.first_name,
                    last_name: profile.last_name
                  }}
                  size="custom"
                  className="w-32 h-32 ring-4 ring-white shadow-lg"
                  fallbackClassName={`text-3xl font-bold ${colorClasses.bgGradient} text-white`}
                />
                
                <div className="pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
                    {profile.verified_pro && (
                      <Badge className={`${colorClasses.primaryButton} text-white`}>
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {isWriter ? 'Pro Writer' : 'Pro Reader'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Badge variant="outline" className={`${colorClasses.primaryText} border-purple-200`}>
                        <Sparkles className="w-3 h-3 mr-1" />
                        {isWriter ? 'Creative Writer' : 'Passionate Reader'}
                      </Badge>
                    </div>
                    
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-700 max-w-2xl leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                {currentUser && currentUser.id !== profile.id && (
                  <Button
                    onClick={handleFollowToggle}
                    disabled={isLoadingFollow}
                    className={isFollowing ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : colorClasses.primaryButton}
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
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Social Links */}
            {(profile.website || profile.twitter || profile.instagram || profile.github) && (
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className={`flex items-center ${colorClasses.primaryText} ${colorClasses.hoverText} text-sm`}>
                    <Globe className="w-4 h-4 mr-1" />
                    Website
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className={`flex items-center ${colorClasses.primaryText} ${colorClasses.hoverText} text-sm`}>
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className={`flex items-center ${colorClasses.primaryText} ${colorClasses.hoverText} text-sm`}>
                    <Instagram className="w-4 h-4 mr-1" />
                    Instagram
                  </a>
                )}
                {profile.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className={`flex items-center ${colorClasses.primaryText} ${colorClasses.hoverText} text-sm`}>
                    <Github className="w-4 h-4 mr-1" />
                    GitHub
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.followers_count}</div>
              <p className="text-xs text-muted-foreground">People following</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Following</CardTitle>
              <UserPlus className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.following_count}</div>
              <p className="text-xs text-muted-foreground">Following others</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{isWriter ? 'Projects' : 'Books Read'}</CardTitle>
              <BookOpen className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isWriter ? profile.projects_count : profile.books_read || 0}</div>
              <p className="text-xs text-muted-foreground">{isWriter ? 'Published works' : 'Completed stories'}</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{isWriter ? 'Total Buzz' : 'Reviews'}</CardTitle>
              {isWriter ? (
                <TrendingUp className={`h-4 w-4 ${colorClasses.iconColor}`} />
              ) : (
                <MessageCircle className={`h-4 w-4 ${colorClasses.iconColor}`} />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isWriter ? profile.total_buzz_score : profile.reviews_count || 0}</div>
              <p className="text-xs text-muted-foreground">{isWriter ? 'Community score' : 'Comments written'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Section - Different for Writers vs Readers */}
        {isWriter ? (
          /* Writer Content */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.bgGradient} flex items-center justify-center mr-4`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Public Projects</h2>
                    <p className="text-gray-600">Stories you can read and discover</p>
                  </div>
                </div>
                <div className={`px-4 py-2 bg-gradient-to-r ${colorClasses.lightGradient} border ${colorClasses.borderLight} rounded-xl`}>
                  <span className={`${colorClasses.primaryTextDark} text-sm font-semibold`}>{publicProjects.length} {publicProjects.length === 1 ? 'project' : 'projects'}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              {publicProjects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">No Public Projects Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    This writer hasn't published any public stories yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {publicProjects.map((project, index) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                      <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden`}>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 shadow-sm`}></div>
                            <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                              {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          
                          <h3 className={`text-xl font-bold text-gray-900 mb-3 group-hover:${colorClasses.primaryText} transition-colors line-clamp-2 leading-tight`}>
                            {project.title}
                          </h3>
                          
                          {project.logline && (
                            <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                              {project.logline}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-lg ${colorClasses.bgGradient} flex items-center justify-center`}>
                                <TrendingUp className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{project.buzz_score}</div>
                                <div className="text-xs text-gray-500">buzz score</div>
                              </div>
                            </div>
                            <div className={`flex items-center ${colorClasses.primaryText} text-sm font-medium group-hover:${colorClasses.primaryTextDark} transition-colors`}>
                              <span>Read story</span>
                              <div className={`ml-2 w-5 h-5 rounded-full ${colorClasses.primaryLight} group-hover:${colorClasses.primaryMedium} flex items-center justify-center transition-colors`}>
                                <div className={`w-2 h-2 bg-purple-500 rounded-full group-hover:translate-x-0.5 transition-transform`}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Reader Content */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.bgGradient} flex items-center justify-center mr-4`}>
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reading Activity</h2>
                    <p className="text-gray-600">Track record and reading habits</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-4`}>
                    <Clock className={`w-8 h-8 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {Math.round((profile.total_reading_time || 0) / 60)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Reading Time</div>
                </div>

                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-4`}>
                    <Heart className={`w-8 h-8 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">5</div>
                  <div className="text-sm text-gray-600">Favorite Genres</div>
                </div>

                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${colorClasses.lightGradient} flex items-center justify-center mx-auto mb-4`}>
                    <Award className={`w-8 h-8 ${colorClasses.primaryText}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">12</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
