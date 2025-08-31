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
  Github,
  Library,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface ReaderProfile {
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
  projects_read?: number
  total_reading_time?: number
}

interface ReadingActivity {
  id: string
  project_title: string
  completion_percentage: number
  last_read: string
  project_id: string
}

export default function ReaderProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('reader')
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ReaderProfile | null>(null)
  const [readingActivity, setReadingActivity] = useState<ReadingActivity[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

  const readerId = params?.id as string

  useEffect(() => {
    if (readerId) {
      loadProfileData()
    }
  }, [readerId])

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
          .eq('following_id', readerId)
          .single()
        
        setIsFollowing(!!followData)
      }

      // Load reader profile
      const { data: readerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', readerId)
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
          .eq('following_id', readerId),
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', readerId)
      ])

      // Get reading activity
      const { data: readingData } = await supabase
        .from('reading_progress')
        .select(`
          id, 
          completion_percentage, 
          last_read,
          projects (
            id,
            title
          )
        `)
        .eq('user_id', readerId)
        .order('last_read', { ascending: false })
        .limit(10)

      const enhancedProfile = {
        ...readerProfile,
        followers_count: followerData.data?.length || 0,
        following_count: followingData.data?.length || 0,
        projects_read: readingData?.filter(r => r.completion_percentage >= 100).length || 0,
        total_reading_time: readingData?.length || 0
      }

      setProfile(enhancedProfile)
      setReadingActivity(readingData?.map(r => ({
        id: r.id,
        project_title: r.projects?.title || 'Untitled',
        completion_percentage: r.completion_percentage,
        last_read: r.last_read,
        project_id: r.projects?.id || ''
      })) || [])

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
          <div className={`w-8 h-8 border-4 border-t-purple-500 border-gray-300 rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading reader profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Reader Not Found</h2>
            <p className="text-gray-600 mb-4">The reader profile you're looking for doesn't exist.</p>
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
          <div className="relative bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Enhanced Avatar & Status */}
              <div className="relative group">
                <div className="w-36 h-36 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl p-1.5 shadow-xl relative">
                  <Avatar className="w-full h-full rounded-2xl">
                    <AvatarImage src={profile.avatar_url || undefined} className="rounded-2xl object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-4xl font-bold rounded-2xl">
                      {profile.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
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
                
                {/* Reading Level Display */}
                <div className="mt-4 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-center space-x-1">
                    {[1,2,3,4,5].map((book) => (
                      <BookOpen key={book} className="w-4 h-4 text-purple-500 fill-current" />
                    ))}
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-lg font-bold text-gray-900">Avid Reader</div>
                    <div className="text-xs text-gray-500">{Math.floor(Math.random() * 100) + 50} books completed</div>
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
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl">
                        <span className="text-purple-700 text-sm font-semibold">Passionate Reader</span>
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
                          <MapPin className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">{profile.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">Reading daily</span>
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
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
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
                              <span>Follow Reader</span>
                            </div>
                          )}
                        </button>
                        
                        <button className="px-8 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all font-semibold shadow-sm hover:shadow-md">
                          <MessageCircle className="w-5 h-5 mr-2 inline" />
                          Send Message
                        </button>
                        
                        <button className="px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-purple-200 hover:bg-purple-50 transition-all shadow-sm hover:shadow-md">
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
            { label: 'Followers', value: profile.followers_count, icon: Users, gradient: 'from-purple-400 to-purple-500' },
            { label: 'Following', value: profile.following_count, icon: UserPlus, gradient: 'from-blue-400 to-blue-500' },
            { label: 'Books Read', value: profile.projects_read, icon: BookOpen, gradient: 'from-green-400 to-green-500' },
            { label: 'Reading List', value: profile.total_reading_time, icon: Library, gradient: 'from-orange-400 to-orange-500' },
          ].map((stat, index) => (
            <div key={stat.label} className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {stat.label === 'Followers' ? '+8%' :
                     stat.label === 'Following' ? 'Active' :
                     stat.label === 'Books Read' ? 'Completed' : 'In Progress'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value?.toLocaleString()}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stat.label === 'Followers' ? 'Community members' :
                   stat.label === 'Following' ? 'Writers & readers' :
                   stat.label === 'Books Read' ? 'Stories finished' : 'Hours of reading'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reading Preferences & Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Reading Preferences */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reading Preferences</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { genre: 'Fantasy & Sci-Fi', level: 95, color: 'purple' },
                { genre: 'Mystery & Thriller', level: 78, color: 'blue' },
                { genre: 'Romance', level: 85, color: 'pink' },
                { genre: 'Non-Fiction', level: 62, color: 'green' },
              ].map((item) => (
                <div key={item.genre} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.genre}</span>
                    <span className="text-sm text-gray-500">{item.level}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        item.color === 'purple' ? 'from-purple-400 to-purple-500' :
                        item.color === 'blue' ? 'from-blue-400 to-blue-500' :
                        item.color === 'pink' ? 'from-pink-400 to-pink-500' :
                        'from-green-400 to-green-500'
                      } transition-all duration-1000 ease-out`}
                      style={{ width: `${item.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reading Badges */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mr-3">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reading Badges</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Bookworm', desc: '50+ Books Read', icon: '📚', earned: true },
                { title: 'Speed Reader', desc: 'Fast Completion', icon: '⚡', earned: true },
                { title: 'Reviewer', desc: '25+ Reviews', icon: '✍️', earned: profile.followers_count && profile.followers_count > 10 },
                { title: 'Community Star', desc: 'Top Commenter', icon: '⭐', earned: false },
              ].map((badge, index) => (
                <div key={badge.title} className={`p-4 rounded-xl border-2 transition-all ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-sm' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}>
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className={`text-sm font-semibold mb-1 ${badge.earned ? 'text-purple-700' : 'text-gray-500'}`}>
                    {badge.title}
                  </div>
                  <div className={`text-xs ${badge.earned ? 'text-purple-600' : 'text-gray-400'}`}>
                    {badge.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reading Activity Section - Enhanced Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center mr-4">
                  <Library className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Reading Journey</h2>
                  <p className="text-gray-600">Explore books and reading progress</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl">
                <span className="text-purple-700 text-sm font-semibold">{readingActivity.length} {readingActivity.length === 1 ? 'book' : 'books'}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {readingActivity.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Library className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">No Reading Activity Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Start your reading journey by exploring stories in our collection!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {readingActivity.map((activity, index) => (
                  <Link key={activity.id} href={`/projects/${activity.project_id}`} className="group block">
                    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden">
                      {/* Background decoration */}
                      <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 ${
                        index % 4 === 0 ? 'bg-purple-400' :
                        index % 4 === 1 ? 'bg-blue-400' :
                        index % 4 === 2 ? 'bg-green-400' : 'bg-pink-400'
                      } rounded-full -translate-y-12 translate-x-12`}></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`w-4 h-4 rounded-full ${
                            index % 4 === 0 ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                            index % 4 === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                            index % 4 === 2 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                            'bg-gradient-to-r from-pink-400 to-pink-500'
                          } shadow-sm`}></div>
                          <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            {new Date(activity.last_read).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                          {activity.project_title}
                        </h3>
                        
                        {/* Progress Section */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Reading Progress</span>
                            <span className="text-sm font-bold text-purple-600">{activity.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-1000 ease-out"
                              style={{ width: `${activity.completion_percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.completion_percentage === 100 ? 'Completed' : 
                             activity.completion_percentage > 75 ? 'Almost finished' :
                             activity.completion_percentage > 50 ? 'Halfway through' : 'Getting started'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">
                                {activity.completion_percentage === 100 ? 'Finished' : 'Reading'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Last read {new Date(activity.last_read).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700 transition-colors">
                            <span>Continue</span>
                            <div className="ml-2 w-5 h-5 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                              <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:translate-x-0.5 transition-transform"></div>
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
      </div>
    </div>
  )
}
