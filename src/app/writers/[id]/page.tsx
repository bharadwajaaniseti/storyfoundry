'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth-client'
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
  logline: string | null
  buzz_score: number
  created_at: string
  updated_at: string
  visibility: string
}

export default function WriterProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('reader')
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<WriterProfile | null>(null)
  const [publishedProjects, setPublishedProjects] = useState<Project[]>([])
  const [draftProjects, setDraftProjects] = useState<Project[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

  const writerId = params?.id as string

  useEffect(() => {
    if (writerId) {
      loadProfileData()
    }
  }, [writerId])

  // Color schemes based on user role - matching our following pages design
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
        ring: 'ring-orange-500/20',
        accent: 'text-orange-400',
        gradient: 'from-orange-50 to-white',
        cardBorder: 'border-l-orange-500',
        iconColor: 'text-orange-500',
        focusRing: 'focus:ring-orange-500/20 focus:border-orange-500',
        hoverBg: 'hover:bg-orange-50',
        hoverText: 'hover:text-orange-700',
        bgGradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
        lightGradient: 'bg-gradient-to-br from-orange-50 to-orange-100/50'
      }
    } else {
      // Readers use purple theme
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
  }

  const colorClasses = getColorClasses(userRole)

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

      // Get projects separated by visibility (public = published, private/preview = draft)
      const [publishedProjectsData, draftProjectsData] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, description, buzz_score, created_at, updated_at, visibility, logline')
          .eq('owner_id', writerId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, title, description, buzz_score, created_at, updated_at, visibility, logline')
          .eq('owner_id', writerId)
          .in('visibility', ['private', 'preview'])
          .order('created_at', { ascending: false })
      ])

      const allProjects = [
        ...(publishedProjectsData.data || []),
        ...(draftProjectsData.data || [])
      ]

      const enhancedProfile = {
        ...writerProfile,
        followers_count: followerData.data?.length || 0,
        following_count: followingData.data?.length || 0,
        projects_count: allProjects.length,
        total_buzz_score: publishedProjectsData.data?.reduce((sum, project) => sum + (project.buzz_score || 0), 0) || 0
      }

      setProfile(enhancedProfile)
      setPublishedProjects(publishedProjectsData.data || [])
      setDraftProjects(draftProjectsData.data || [])

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
          <div className={`w-8 h-8 border-4 border-t-${userRole === 'writer' ? 'orange' : 'purple'}-500 border-gray-300 rounded-full animate-spin mx-auto mb-4`}></div>
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
            <Button asChild className={`${colorClasses.primaryButton}`}>
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="group flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Profile Hero - Enhanced Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Background Pattern */}
          <div className={`relative bg-gradient-to-br ${colorClasses.gradient} p-8`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses.accent}/5 to-transparent`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 ${colorClasses.accent}/5 rounded-full -translate-y-16 translate-x-16`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 ${colorClasses.accent}/10 rounded-full translate-y-12 -translate-x-12`}></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Enhanced Avatar & Status */}
              <div className="relative group">
                <div className={`w-36 h-36 ${colorClasses.bgGradient} rounded-3xl p-1.5 shadow-xl relative`}>
                  <UserAvatar 
                    user={profile}
                    size="custom"
                    className="w-full h-full rounded-2xl"
                    fallbackClassName={`${colorClasses.bgGradient} text-white text-4xl font-bold rounded-2xl`}
                  />
                  
                  {/* Enhanced Pro Badge */}
                  {profile.verified_pro && (
                    <div className="absolute -top-3 -right-3 w-9 h-9 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                      <Star className="w-4 h-4 text-yellow-900 fill-current" />
                    </div>
                  )}
                  
                  {/* Online Status */}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-xl border-3 border-white shadow-lg">
                    <div className="w-full h-full bg-green-400 rounded-xl animate-pulse"></div>
                  </div>
                </div>
                
                {/* Rating Display */}
                <div className="mt-4 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-center space-x-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-lg font-bold text-gray-900">4.8</div>
                    <div className="text-xs text-gray-500">Based on {Math.floor(Math.random() * 50) + 10} reviews</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Info Section */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-6 lg:mb-0">
                    <div className="flex items-center space-x-4 mb-4">
                      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                        {profile.display_name}
                      </h1>
                      <div className={`px-4 py-2 bg-gradient-to-r ${colorClasses.lightGradient} border ${colorClasses.borderLight} rounded-2xl`}>
                        <span className={`${colorClasses.primaryTextDark} text-sm font-semibold`}>
                          {profile.role === 'writer' ? 'Professional Writer' : 'Passionate Reader'}
                        </span>
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-3xl">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                      {profile.location && (
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                          <MapPin className={`w-4 h-4 ${colorClasses.accent}`} />
                          <span className="font-medium">{profile.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                        <Calendar className={`w-4 h-4 ${colorClasses.accent}`} />
                        <span className="font-medium">Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                        <Clock className={`w-4 h-4 ${colorClasses.accent}`} />
                        <span className="font-medium">Usually responds in 2 hours</span>
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    {currentUser && currentUser.id !== profile.id && (
                      <div className="flex flex-wrap gap-4 mb-6">
                        <button
                          onClick={handleFollowToggle}
                          disabled={isLoadingFollow}
                          className={`px-8 py-4 rounded-2xl font-semibold transition-all shadow-sm ${
                            isFollowing
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                              : `bg-gradient-to-r ${colorClasses.bgGradient.replace('bg-gradient-to-br', '')} text-white hover:shadow-xl hover:-translate-y-0.5 shadow-lg`
                          }`}
                        >
                          {isLoadingFollow ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isFollowing ? (
                            <div className="flex items-center space-x-2">
                              <UserCheck className="w-5 h-5" />
                              <span>Following</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <UserPlus className="w-5 h-5" />
                              <span>Follow Writer</span>
                            </div>
                          )}
                        </button>
                        
                        <button className={`px-8 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-${userRole === 'writer' ? 'orange' : 'purple'}-200 hover:bg-${userRole === 'writer' ? 'orange' : 'purple'}-50 hover:text-${userRole === 'writer' ? 'orange' : 'purple'}-700 transition-all font-semibold shadow-sm hover:shadow-md`}>
                          <MessageCircle className="w-5 h-5 mr-2 inline" />
                          Send Message
                        </button>
                        
                        <button className={`px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-${userRole === 'writer' ? 'orange' : 'purple'}-200 hover:bg-${userRole === 'writer' ? 'orange' : 'purple'}-50 transition-all shadow-sm hover:shadow-md`}>
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Enhanced Social Links */}
                    {(profile.website || profile.twitter || profile.instagram || profile.github) && (
                      <div className="flex flex-wrap gap-3">
                        {profile.website && (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                             className="p-3 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200">
                            <Globe className="w-5 h-5 text-gray-600" />
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                             className="p-3 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-200">
                            <Twitter className="w-5 h-5 text-blue-500" />
                          </a>
                        )}
                        {profile.instagram && (
                          <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                             className="p-3 bg-white hover:bg-pink-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-100 hover:border-pink-200">
                            <Instagram className="w-5 h-5 text-pink-500" />
                          </a>
                        )}
                        {profile.github && (
                          <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                             className="p-3 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-300">
                            <Github className="w-5 h-5 text-gray-700" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Enhanced Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Followers', value: profile.followers_count, icon: Users, gradient: userRole === 'writer' ? 'from-orange-400 to-orange-500' : 'from-purple-400 to-purple-500' },
            { label: 'Following', value: profile.following_count, icon: UserPlus, gradient: 'from-blue-400 to-blue-500' },
            { label: 'Projects', value: profile.projects_count, icon: BookOpen, gradient: 'from-green-400 to-green-500' },
            { label: 'Total Buzz', value: profile.total_buzz_score, icon: TrendingUp, gradient: userRole === 'writer' ? 'from-purple-400 to-purple-500' : 'from-orange-400 to-orange-500' },
          ].map((stat, index) => (
            <div key={stat.label} className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {stat.label === 'Followers' ? '+12%' :
                     stat.label === 'Following' ? 'Active' :
                     stat.label === 'Projects' ? 'Published' : 'Growing'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value?.toLocaleString()}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stat.label === 'Followers' ? 'Active readers' :
                   stat.label === 'Following' ? 'Connections' :
                   stat.label === 'Projects' ? 'Published works' : 'Community score'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills & Achievements Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Writing Skills */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 rounded-xl ${colorClasses.bgGradient} flex items-center justify-center mr-3`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Writing Skills</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { skill: 'Storytelling', level: 92, color: userRole === 'writer' ? 'orange' : 'purple' },
                { skill: 'Character Development', level: 87, color: 'blue' },
                { skill: 'World Building', level: 84, color: 'green' },
                { skill: 'Dialogue', level: 90, color: userRole === 'writer' ? 'purple' : 'orange' },
              ].map((item) => (
                <div key={item.skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.skill}</span>
                    <span className="text-sm text-gray-500">{item.level}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        item.color === 'orange' ? 'from-orange-400 to-orange-500' :
                        item.color === 'blue' ? 'from-blue-400 to-blue-500' :
                        item.color === 'green' ? 'from-green-400 to-green-500' :
                        'from-purple-400 to-purple-500'
                      } transition-all duration-1000 ease-out`}
                      style={{ width: `${item.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements & Badges */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mr-3">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Achievements</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Bestseller', desc: 'Top 10 Story', icon: '🏆', earned: true },
                { title: 'Prolific', desc: '10+ Projects', icon: '📚', earned: true },
                { title: 'Community Favorite', desc: '1000+ Buzz', icon: '❤️', earned: profile.total_buzz_score && profile.total_buzz_score > 1000 },
                { title: 'Trending Author', desc: 'Weekly Top', icon: '🔥', earned: false },
              ].map((achievement, index) => (
                <div key={achievement.title} className={`p-4 rounded-xl border-2 transition-all ${
                  achievement.earned 
                    ? `bg-gradient-to-br ${colorClasses.lightGradient} border-${userRole === 'writer' ? 'orange' : 'purple'}-200 shadow-sm` 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}>
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className={`text-sm font-semibold mb-1 ${achievement.earned ? colorClasses.primaryTextDark : 'text-gray-500'}`}>
                    {achievement.title}
                  </div>
                  <div className={`text-xs ${achievement.earned ? colorClasses.primaryText : 'text-gray-400'}`}>
                    {achievement.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Public Projects Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-xl ${colorClasses.bgGradient} flex items-center justify-center mr-4`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Public Projects</h2>
                  <p className="text-gray-600">Stories ready for the world to discover</p>
                  {draftProjects.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {draftProjects.length} private {draftProjects.length === 1 ? 'project' : 'projects'} not shown to public
                    </p>
                  )}
                </div>
              </div>
              <div className={`px-4 py-2 bg-gradient-to-r ${colorClasses.lightGradient} border ${colorClasses.borderLight} rounded-xl`}>
                <span className={`${colorClasses.primaryTextDark} text-sm font-semibold`}>{publishedProjects.length} {publishedProjects.length === 1 ? 'project' : 'projects'}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {publishedProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">No Public Projects Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  This writer is still working on their first public story. Great stories take time to perfect!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {publishedProjects.map((project, index) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                    <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:border-${userRole === 'writer' ? 'orange' : 'purple'}-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden`}>
                      {/* Background decoration */}
                      <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 ${
                        index % 4 === 0 ? (userRole === 'writer' ? 'bg-orange-400' : 'bg-purple-400') :
                        index % 4 === 1 ? 'bg-blue-400' :
                        index % 4 === 2 ? 'bg-green-400' : (userRole === 'writer' ? 'bg-purple-400' : 'bg-orange-400')
                      } rounded-full -translate-y-12 translate-x-12`}></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`w-4 h-4 rounded-full ${
                            index % 4 === 0 ? (userRole === 'writer' ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-purple-400 to-purple-500') :
                            index % 4 === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            index % 4 === 2 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                            (userRole === 'writer' ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-gradient-to-r from-orange-400 to-orange-500')
                          } shadow-sm`}></div>
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
                              <div className={`w-2 h-2 ${colorClasses.primaryButton.split(' ')[0]} rounded-full group-hover:translate-x-0.5 transition-transform`}></div>
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

        {/* Private Projects Section - Only show if user is viewing their own profile */}
        {userRole === 'writer' && currentUser?.id === profile.id && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mr-4`}>
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-dashed rounded"></div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Private Projects</h2>
                    <p className="text-gray-600">Works in progress - only visible to you</p>
                  </div>
                </div>
                <div className={`px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl`}>
                  <span className={`text-gray-700 text-sm font-semibold`}>{draftProjects.length} {draftProjects.length === 1 ? 'private project' : 'private projects'}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              {draftProjects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-400 border-dashed rounded"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">No Private Projects Yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    Start a new project to begin crafting your next story!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {draftProjects.map((project, index) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                      <div className={`bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden`}>
                        {/* Background decoration */}
                        <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 bg-gray-400 rounded-full -translate-y-12 translate-x-12`}></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 shadow-sm`}></div>
                            <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                              Private
                            </div>
                          </div>
                          
                          <h3 className={`text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors line-clamp-2 leading-tight`}>
                            {project.title}
                          </h3>
                          
                          {project.logline && (
                            <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                              {project.logline}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center`}>
                                <div className="w-4 h-4 border border-white border-dashed rounded"></div>
                              </div>
                              <div>
                                <div className="font-bold text-gray-700 text-sm">Private</div>
                                <div className="text-xs text-gray-500">in progress</div>
                              </div>
                            </div>
                            <div className={`flex items-center text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors`}>
                              <span>Continue writing</span>
                              <div className={`ml-2 w-5 h-5 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center transition-colors`}>
                                <div className={`w-2 h-2 bg-gray-600 rounded-full group-hover:translate-x-0.5 transition-transform`}></div>
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
        )}
      </div>
    </div>
  )
}
