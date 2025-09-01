'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/user-avatar'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Star,
  BookOpen,
  Calendar,
  UserCheck,
  Eye,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import ProfileModal from '@/components/profile-modal'

interface Profile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  verified_pro: boolean
  role: string
  created_at: string
  followers_count?: number
  projects_count?: number
  total_buzz_score?: number
  country?: string | null
}

interface Following {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  profiles: Profile | null
}

interface FollowingStats {
  totalFollowing: number
  writers: number
  verified: number
  newThisMonth: number
}

export default function ReaderFollowingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('reader')
  const [isLoading, setIsLoading] = useState(true)
  const [following, setFollowing] = useState<Following[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'writers' | 'verified'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'popular'>('recent')
  
  // Profile modal state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  
  const [stats, setStats] = useState<FollowingStats>({
    totalFollowing: 0,
    writers: 0,
    verified: 0,
    newThisMonth: 0
  })

  // Color schemes based on user role - using CSS variables and specific classes
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
        gradient: 'from-orange-50 to-white hover:from-orange-50',
        cardBorder: 'border-l-orange-500',
        iconColor: 'text-orange-500',
        focusRing: 'focus:ring-orange-500/20 focus:border-orange-500',
        hoverBg: 'hover:bg-orange-50',
        hoverText: 'hover:text-orange-700'
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
        gradient: 'from-purple-50 to-white hover:from-purple-50',
        cardBorder: 'border-l-purple-500',
        iconColor: 'text-purple-500',
        focusRing: 'focus:ring-purple-500/20 focus:border-purple-500',
        hoverBg: 'hover:bg-purple-50',
        hoverText: 'hover:text-purple-700'
      }
    }
  }

  const colorClasses = getColorClasses(userRole)

  useEffect(() => {
    loadUserAndFollowing()
  }, [])

  // Effect to handle profile modal reopening from project pages
  useEffect(() => {
    const handleReopenModal = (event: any) => {
      const { profileId, currentUserRole } = event.detail
      setSelectedProfileId(profileId)
    }

    window.addEventListener('reopenProfileModal', handleReopenModal)
    
    return () => {
      window.removeEventListener('reopenProfileModal', handleReopenModal)
    }
  }, [])

  const loadUserAndFollowing = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setCurrentUser(user)

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setUserRole(profile?.role?.toLowerCase() || 'reader')

      // Load following data
      await loadFollowingData(user.id)
      
    } catch (error) {
      console.error('Error loading user and following:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFollowingData = async (userId: string) => {
    try {
      const supabase = createSupabaseClient()

      console.log('Loading following for user:', userId)
      
      // First, let's try without the join to see if basic query works
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      console.log('Basic follows query:', { followsData, followsError })

      if (followsError) {
        console.error('Error loading follows:', followsError)
        setFollowing([])
        return
      }

      if (!followsData || followsData.length === 0) {
        console.log('No follows found for user')
        setFollowing([])
        setStats({
          totalFollowing: 0,
          writers: 0,
          verified: 0,
          newThisMonth: 0
        })
        return
      }

      // Now get the profile data separately
      const followingIds = followsData.map(f => f.following_id)
      console.log('Following IDs:', followingIds)

      if (followingIds.length === 0) {
        console.log('No following IDs found')
        setFollowing([])
        setStats({
          totalFollowing: 0,
          writers: 0,
          verified: 0,
          newThisMonth: 0
        })
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, bio, avatar_url, verified_pro, role, created_at, country')
        .in('id', followingIds)

      console.log('Profiles query:', { profilesData, profilesError, followingIds })

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        console.error('Profiles error details:', JSON.stringify(profilesError, null, 2))
        setFollowing([])
        return
      }

      // Combine the data
      const enhancedFollowing = followsData.map(follow => {
        const profile = profilesData?.find(p => p.id === follow.following_id)
        return {
          ...follow,
          profiles: profile || null
        }
      }).filter(f => f.profiles !== null) // Only keep follows where we found the profile

      console.log('Enhanced following data:', enhancedFollowing)

      // Enhance with additional stats for each followed user
      if (enhancedFollowing && enhancedFollowing.length > 0) {
        const followingIds = enhancedFollowing.map(f => f.following_id)
        
        // Get follower counts
        const { data: followerCounts } = await supabase
          .from('user_follows')
          .select('following_id')
          .in('following_id', followingIds)

        // Get project counts and buzz scores
        const { data: projectsData } = await supabase
          .from('projects')
          .select('owner_id, buzz_score')
          .in('owner_id', followingIds)

        // Enhance the following data
        const finalFollowingData = enhancedFollowing.map(follow => {
          const userId = follow.following_id
          const followersCount = followerCounts?.filter(f => f.following_id === userId).length || 0
          const userProjects = projectsData?.filter(p => p.owner_id === userId) || []
          const projectsCount = userProjects.length
          const totalBuzzScore = userProjects.reduce((sum, project) => sum + (project.buzz_score || 0), 0)

          return {
            ...follow,
            profiles: follow.profiles ? {
              ...follow.profiles,
              followers_count: followersCount,
              projects_count: projectsCount,
              total_buzz_score: totalBuzzScore
            } : null
          }
        })

        setFollowing(finalFollowingData)

        // Calculate stats
        const now = new Date()
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

        const statsData: FollowingStats = {
          totalFollowing: finalFollowingData.length,
          writers: finalFollowingData.filter(
            f => f.profiles?.role?.toLowerCase() === 'writer'
          ).length,
          verified: finalFollowingData.filter(f => f.profiles?.verified_pro).length,
          newThisMonth: finalFollowingData.filter(
            f => new Date(f.created_at) > oneMonthAgo
          ).length
        }
        setStats(statsData)

      } else {
        setFollowing([])
        setStats({
          totalFollowing: 0,
          writers: 0,
          verified: 0,
          newThisMonth: 0
        })
      }

    } catch (error) {
      console.error('Error loading following data:', error)
      setFollowing([])
    }
  }

  const handleUnfollow = async (userId: string) => {
    if (!currentUser) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)

      if (error) {
        console.error('Error unfollowing user:', error)
        return
      }

      // Update local state
      setFollowing(prev => prev.filter(f => f.following_id !== userId))
      
      // Update stats
      setStats(prev => {
        const unfollowedUser = following.find(f => f.following_id === userId)
        return {
          ...prev,
          totalFollowing: prev.totalFollowing - 1,
          writers: unfollowedUser?.profiles?.role?.toLowerCase() === 'writer' 
            ? prev.writers - 1 
            : prev.writers,
          verified: unfollowedUser?.profiles?.verified_pro 
            ? prev.verified - 1 
            : prev.verified
        }
      })

    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const filteredFollowing = following.filter(follow => {
    if (!follow.profiles) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const profile = follow.profiles
      if (!profile.display_name?.toLowerCase().includes(query) &&
          !profile.bio?.toLowerCase().includes(query) &&
          !profile.role?.toLowerCase().includes(query)) {
        return false
      }
    }

    // Type filter
    if (filter === 'writers') {
      return follow.profiles.role?.toLowerCase() === 'writer'
    } else if (filter === 'verified') {
      return follow.profiles.verified_pro
    }

    return true
  }).sort((a, b) => {
    if (!a.profiles || !b.profiles) return 0

    switch (sortBy) {
      case 'name':
        return (a.profiles.display_name || '').localeCompare(b.profiles.display_name || '')
      case 'popular':
        return (b.profiles.followers_count || 0) - (a.profiles.followers_count || 0)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (isLoading) {
    const tempColorClasses = getColorClasses('reader') // Default to reader colors during loading
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-t-purple-500 border-gray-300 rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading your following...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className={`w-8 h-8 ${colorClasses.iconColor} mr-3`} />
              Following
            </h1>
            <p className="text-gray-600 mt-2">Writers and creators you follow for inspiration</p>
          </div>
          
          <Button asChild className={`${colorClasses.primaryButton}`}>
            <Link href="/app/search">
              <UserPlus className="w-4 h-4 mr-2" />
              Discover Writers
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Following</CardTitle>
              <Users className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFollowing}</div>
              <p className="text-xs text-muted-foreground">People you follow</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Writers</CardTitle>
              <BookOpen className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.writers}</div>
              <p className="text-xs text-muted-foreground">Creative writers</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Star className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">Pro members</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${colorClasses.cardBorder}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className={`h-4 w-4 ${colorClasses.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <p className="text-xs text-muted-foreground">Recent follows</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? `bg-white ${colorClasses.primaryText} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All ({stats.totalFollowing})
                </button>
                <button
                  onClick={() => setFilter('writers')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'writers'
                      ? `bg-white ${colorClasses.primaryText} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Writers ({stats.writers})
                </button>
                <button
                  onClick={() => setFilter('verified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'verified'
                      ? `bg-white ${colorClasses.primaryText} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Verified ({stats.verified})
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search writers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${colorClasses.focusRing} w-64`}
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${colorClasses.focusRing}`}
                >
                  <option value="recent">Recently Followed</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Following Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFollowing.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {searchQuery ? 'No writers found' : 'Not following anyone yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms.'
                      : 'Start following writers to see their latest work and get inspiration.'
                    }
                  </p>
                  <Button asChild className={`${colorClasses.primaryButton}`}>
                    <Link href="/app/search">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Discover Writers
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredFollowing.map((follow) => {
              const profile = follow.profiles
              if (!profile) return null

              return (
                <div 
                  key={follow.id} 
                  onClick={() => setSelectedProfileId(profile.id)}
                  className="block group cursor-pointer"
                >
                  <Card className={`w-full bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:shadow-xl ${userRole === 'writer' ? 'hover:border-orange-400' : 'hover:border-purple-400'} hover:-translate-y-1 transform group-hover:h-auto overflow-hidden`}>
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <UserAvatar 
                            user={profile}
                            size="custom"
                            className="w-16 h-16 ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all duration-300"
                            fallbackClassName={`${colorClasses.primary} text-white text-lg font-semibold`}
                          />
                          {profile.verified_pro && (
                            <div className={`absolute -top-1 -right-1 w-6 h-6 ${colorClasses.primary} rounded-full flex items-center justify-center shadow-sm`}>
                              <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 group-hover:text-gray-700 transition-colors">
                            {profile.display_name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className={`text-xs ${colorClasses.primaryMedium} ${colorClasses.primaryTextDark} border-0`}>
                              <Sparkles className="w-3 h-3 mr-1" />
                              {profile.role || 'Writer'}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3 mr-1" />
                            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Following Status */}
                      <div className="flex flex-col items-end space-y-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleUnfollow(profile.id)
                          }}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${colorClasses.primary} hover:opacity-80 hover:scale-105 transform`}
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Following
                        </button>
                        <div className="text-xs text-gray-500">
                          {new Date(follow.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
                        {profile.bio}
                      </p>
                    )}

                    {/* Stats Section */}
                    <div className={`grid grid-cols-3 gap-4 py-4 border-t border-gray-100 group-hover:border-gray-200 transition-colors`}>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${colorClasses.primaryTextDark} group-hover:scale-110 transition-transform duration-200`}>
                          {profile.followers_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${colorClasses.primaryTextDark} group-hover:scale-110 transition-transform duration-200`}>
                          {profile.projects_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${colorClasses.primaryTextDark} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {profile.total_buzz_score || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Buzz Score</div>
                      </div>
                    </div>

                    {/* Footer - Dynamic Height Expansion */}
                    <div className="transition-all duration-300 ease-in-out max-h-0 group-hover:max-h-20 overflow-hidden">
                      <div className="pt-4 border-t border-gray-100 group-hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-center">
                          <div className={`text-sm ${colorClasses.primaryText} font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}>
                            Click to view profile →
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })
          )}
        </div>

        {/* Profile Modal */}
        {selectedProfileId && (
          <ProfileModal
            profileId={selectedProfileId}
            currentUserRole={userRole}
            onClose={() => setSelectedProfileId(null)}
            onFollow={() => {
              // Refresh following data after following someone
              if (currentUser) {
                loadFollowingData(currentUser.id)
              }
            }}
            onUnfollow={() => {
              // Refresh following data after unfollowing someone
              if (currentUser) {
                loadFollowingData(currentUser.id)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
