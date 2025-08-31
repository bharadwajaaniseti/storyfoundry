'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Github
} from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface WriterProfile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  verified_pro: boolean
  role: string
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
}

interface Project {
  id: string
  title: string
  description: string | null
  buzz_score: number
  created_at: string
  updated_at: string
  status: string
}

export default function WriterProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('reader')
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<WriterProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

  const writerId = params?.id as string

  useEffect(() => {
    if (writerId) {
      loadProfileData()
    }
  }, [writerId])

  // Color schemes based on user role
  const getColorScheme = () => {
    return userRole === 'writer' ? {
      primary: 'orange-500',
      primaryHover: 'orange-600',
      primaryLight: 'orange-50',
      primaryMedium: 'orange-100',
      primaryText: 'orange-600',
      primaryTextDark: 'orange-700',
      border: 'orange-500',
      borderLight: 'orange-300',
      ring: 'orange-500/20',
      accent: 'orange-400'
    } : {
      primary: 'blue-500',
      primaryHover: 'blue-600', 
      primaryLight: 'blue-50',
      primaryMedium: 'blue-100',
      primaryText: 'blue-600',
      primaryTextDark: 'blue-700',
      border: 'blue-500',
      borderLight: 'blue-300',
      ring: 'blue-500/20',
      accent: 'blue-400'
    }
  }

  const colors = getColorScheme()

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
          .eq('following_id', writerId)
          .single()
        
        setIsFollowing(!!followData)
      }

      // Load writer profile
      const { data: writerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', writerId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        router.push('/404')
        return
      }

      // Get follower/following counts
      const [followerData, followingData] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id')
          .eq('following_id', writerId),
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', writerId)
      ])

      // Get projects and buzz score
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, title, description, buzz_score, created_at, updated_at, status')
        .eq('owner_id', writerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      const enhancedProfile = {
        ...writerProfile,
        followers_count: followerData.data?.length || 0,
        following_count: followingData.data?.length || 0,
        projects_count: projectsData?.length || 0,
        total_buzz_score: projectsData?.reduce((sum, project) => sum + (project.buzz_score || 0), 0) || 0
      }

      setProfile(enhancedProfile)
      setProjects(projectsData || [])

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

        if (!error) {
          setIsFollowing(false)
          setProfile(prev => prev ? {
            ...prev,
            followers_count: (prev.followers_count || 0) - 1
          } : null)
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          })

        if (!error) {
          setIsFollowing(true)
          setProfile(prev => prev ? {
            ...prev,
            followers_count: (prev.followers_count || 0) + 1
          } : null)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsLoadingFollow(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-t-${colors.primary} border-gray-300 rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading writer profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Writer Not Found</h2>
            <p className="text-gray-600 mb-4">The writer profile you're looking for doesn't exist.</p>
            <Button asChild className={`bg-${colors.primary} hover:bg-${colors.primaryHover}`}>
              <Link href="/search">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className={`text-${colors.primary} hover:bg-${colors.primaryLight}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <Card className={`mb-8 bg-gradient-to-br from-white to-${colors.primaryLight}/20 border-0 shadow-lg relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${colors.primaryLight} to-transparent opacity-30 rounded-full transform translate-x-32 -translate-y-32`}></div>
          
          <CardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start mb-6 lg:mb-0">
                <div className="relative">
                  <Avatar className={`w-32 h-32 ring-4 ring-${colors.primaryLight} mb-4`}>
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={`bg-gradient-to-br from-${colors.primary} to-${colors.accent} text-white text-3xl font-bold`}>
                      {profile.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {profile.verified_pro && (
                    <div className={`absolute -top-2 -right-2 w-10 h-10 bg-${colors.primary} rounded-full flex items-center justify-center ring-4 ring-white`}>
                      <Star className="w-5 h-5 text-white fill-current" />
                    </div>
                  )}
                </div>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.display_name}</h1>
                  
                  <div className="flex items-center justify-center lg:justify-start space-x-3 mb-3">
                    <Badge className={`bg-gradient-to-r from-${colors.primaryMedium} to-${colors.primaryLight} text-${colors.primaryTextDark} border-0`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {profile.role || 'Writer'}
                    </Badge>
                    {profile.verified_pro && (
                      <Badge className={`bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-0`}>
                        <Star className="w-3 h-3 mr-1" />
                        Pro Member
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 text-sm text-gray-600">
                    {profile.location && (
                      <div className="flex items-center justify-center lg:justify-start">
                        <MapPin className="w-4 h-4 mr-2" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center justify-center lg:justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Actions */}
              <div className="flex-1">
                {profile.bio && (
                  <div className="mb-6">
                    <p className="text-gray-700 leading-relaxed text-lg">{profile.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                {(profile.website || profile.twitter || profile.instagram || profile.github) && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {profile.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {profile.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer">
                          <Twitter className="w-4 h-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {profile.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer">
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </a>
                      </Button>
                    )}
                    {profile.github && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {currentUser && currentUser.id !== profile.id && (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={handleFollowToggle}
                      disabled={isLoadingFollow}
                      className={
                        isFollowing 
                          ? `bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300`
                          : `bg-${colors.primary} hover:bg-${colors.primaryHover} text-white`
                      }
                    >
                      {isLoadingFollow ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : isFollowing ? (
                        <UserCheck className="w-4 h-4 mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.followers_count}</div>
              <p className="text-xs text-muted-foreground">People following</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Following</CardTitle>
              <UserPlus className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.following_count}</div>
              <p className="text-xs text-muted-foreground">People they follow</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <BookOpen className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.projects_count}</div>
              <p className="text-xs text-muted-foreground">Published works</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buzz</CardTitle>
              <TrendingUp className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.total_buzz_score}</div>
              <p className="text-xs text-muted-foreground">Community engagement</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className={`w-5 h-5 mr-2 text-${colors.primary}`} />
              Published Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Projects Yet</h3>
                <p className="text-gray-600">This writer hasn't published any projects yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
                    <Link href={`/projects/${project.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {project.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {project.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {project.buzz_score} buzz
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
