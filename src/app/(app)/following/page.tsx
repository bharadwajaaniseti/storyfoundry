'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Star,
  BookOpen,
  Calendar,
  MoreVertical,
  UserCheck,
  UserMinus,
  Eye,
  MessageCircle,
  TrendingUp,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import ProfileModal from '@/components/profile-modal'

interface WriterProfile {
  id: string
  display_name: string
  bio?: string
  avatar_url?: string
  verified_pro: boolean
  role: string
  created_at: string
  followers_count?: number
  following_count?: number
  projects_count?: number
  total_buzz_score?: number
}

interface Following {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  profiles: WriterProfile
}

interface FollowingStats {
  totalFollowing: number
  writers: number
  verified: number
  newThisMonth: number
}

export default function ReaderFollowingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
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

      // Load following relationships
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select(`
          *,
          profiles!following_id (
            id,
            display_name,
            bio,
            avatar_url,
            verified_pro,
            role,
            created_at
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (followingError) {
        console.error('Error loading following:', followingError)
        console.error('Error details:', {
          message: followingError.message,
          details: followingError.details,
          hint: followingError.hint,
          code: followingError.code
        })
        setFollowing([])
        return
      }

      // Enhance with additional stats for each followed user
      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id)
        
        // Get follower counts
        const { data: followerCounts } = await supabase
          .from('user_follows')
          .select('following_id')
          .in('following_id', followingIds)

        // Get following counts
        const { data: followingCounts } = await supabase
          .from('user_follows')
          .select('follower_id')
          .in('follower_id', followingIds)

        // Get project counts and buzz scores
        const { data: projectsData } = await supabase
          .from('projects')
          .select('owner_id, buzz_score')
          .in('owner_id', followingIds)

        // Enhance the following data
        const enhancedFollowing = followingData.map(follow => {
          const userId = follow.following_id
          const followersCount = followerCounts?.filter(f => f.following_id === userId).length || 0
          const followingCount = followingCounts?.filter(f => f.follower_id === userId).length || 0
          const userProjects = projectsData?.filter(p => p.owner_id === userId) || []
          const totalBuzzScore = userProjects.reduce((sum, p) => sum + (p.buzz_score || 0), 0)

          return {
            ...follow,
            profiles: {
              ...follow.profiles,
              followers_count: followersCount,
              following_count: followingCount,
              projects_count: userProjects.length,
              total_buzz_score: totalBuzzScore
            }
          }
        })

        setFollowing(enhancedFollowing)

        // Calculate stats
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const writers = enhancedFollowing.filter(f => 
          f.profiles?.role?.toLowerCase() === 'writer'
        ).length
        
        const verified = enhancedFollowing.filter(f => 
          f.profiles?.verified_pro
        ).length
        
        const newThisMonth = enhancedFollowing.filter(f => 
          new Date(f.created_at) >= thisMonth
        ).length

        setStats({
          totalFollowing: enhancedFollowing.length,
          writers,
          verified,
          newThisMonth
        })
      }

    } catch (error) {
      console.error('Error loading following data:', error)
    }
  }

  const handleUnfollow = async (followingId: string) => {
    if (!confirm('Are you sure you want to unfollow this user?')) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', followingId)

      if (error) throw error

      // Remove from local state
      setFollowing(prev => prev.filter(f => f.following_id !== followingId))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalFollowing: prev.totalFollowing - 1
      }))

    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const getFilteredFollowing = () => {
    let filtered = following

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.profiles?.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    switch (filter) {
      case 'writers':
        filtered = filtered.filter(f => f.profiles?.role?.toLowerCase() === 'writer')
        break
      case 'verified':
        filtered = filtered.filter(f => f.profiles?.verified_pro)
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => 
          (a.profiles?.display_name || '').localeCompare(b.profiles?.display_name || '')
        )
        break
      case 'popular':
        filtered.sort((a, b) => 
          (b.profiles?.total_buzz_score || 0) - (a.profiles?.total_buzz_score || 0)
        )
        break
      case 'recent':
      default:
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return filtered
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your following...</p>
        </div>
      </div>
    )
  }

  const filteredFollowing = getFilteredFollowing()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <Users className={`w-8 h-8 text-${colors.primary}`} />
              <span>Following</span>
            </h1>
            <p className="text-gray-600 mt-2">Writers and creators you follow for inspiration</p>
          </div>
          
          <Button asChild className={`bg-${colors.primary} hover:bg-${colors.primaryHover}`}>
            <Link href="/search">
              <UserPlus className="w-4 h-4 mr-2" />
              Discover Writers
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Following</CardTitle>
              <Users className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFollowing}</div>
              <p className="text-xs text-muted-foreground">People you follow</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Writers</CardTitle>
              <BookOpen className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.writers}</div>
              <p className="text-xs text-muted-foreground">Creative writers</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Star className={`h-4 w-4 text-${colors.primary}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">Pro members</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: `var(--${colors.primary})` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className={`h-4 w-4 text-${colors.primary}`} />
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
                      ? `bg-white text-${colors.primary} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All ({stats.totalFollowing})
                </button>
                <button
                  onClick={() => setFilter('writers')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'writers'
                      ? `bg-white text-${colors.primary} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Writers ({stats.writers})
                </button>
                <button
                  onClick={() => setFilter('verified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'verified'
                      ? `bg-white text-${colors.primary} shadow-sm`
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
                    className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${colors.primary}/20 focus:border-${colors.primary} w-64`}
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${colors.primary}/20 focus:border-${colors.primary}`}
                >
                  <option value="recent">Recently Followed</option>
                  <option value="name">Name A-Z</option>
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
                  <Button asChild className={`bg-${colors.primary} hover:bg-${colors.primaryHover}`}>
                    <Link href="/search">
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
                <Card 
                  key={follow.id} 
                  className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 hover:from-${colors.primaryLight} hover:to-white relative overflow-hidden`}
                >
                  {/* Background Pattern */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${colors.primaryLight} to-transparent opacity-50 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500`}></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className={`w-16 h-16 ring-2 ring-${colors.primaryLight} group-hover:ring-${colors.primary}/30 transition-all duration-300`}>
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className={`bg-gradient-to-br from-${colors.primary} to-${colors.accent} text-white text-lg font-semibold`}>
                              {profile.display_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {profile.verified_pro && (
                            <div className={`absolute -top-1 -right-1 w-6 h-6 bg-${colors.primary} rounded-full flex items-center justify-center`}>
                              <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <button 
                              onClick={() => setSelectedProfileId(profile.id)}
                              className={`font-bold text-lg text-gray-800 hover:text-${colors.primary} transition-colors group-hover:text-${colors.primaryTextDark} cursor-pointer`}
                            >
                              {profile.display_name}
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs bg-gradient-to-r from-${colors.primaryMedium} to-${colors.primaryLight} text-${colors.primaryTextDark} border-0`}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {profile.role || 'Writer'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {profile.bio}
                      </p>
                    )}

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`font-bold text-lg text-${colors.primaryTextDark}`}>
                          {profile.followers_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg text-${colors.primaryTextDark}`}>
                          {profile.projects_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg text-${colors.primaryTextDark} flex items-center justify-center`}>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {profile.total_buzz_score || 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Buzz Score</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Followed {new Date(follow.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedProfileId(profile.id)}
                          className={`text-${colors.primary} hover:bg-${colors.primaryLight} hover:text-${colors.primaryTextDark} transition-all duration-200`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollow(profile.id)}
                          className={`text-${colors.primary} border-${colors.primaryLight} hover:bg-${colors.primaryLight} hover:text-${colors.primaryTextDark} transition-all duration-200`}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Following
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
