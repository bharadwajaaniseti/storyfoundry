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
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'

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

export default function WriterFollowingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [following, setFollowing] = useState<Following[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'writers' | 'verified'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'popular'>('recent')
  
  const [stats, setStats] = useState<FollowingStats>({
    totalFollowing: 0,
    writers: 0,
    verified: 0,
    newThisMonth: 0
  })

  useEffect(() => {
    loadUserAndFollowing()
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
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              <Users className="w-8 h-8 text-orange-600" />
              <span>Following</span>
            </h1>
            <p className="text-gray-600 mt-2">Writers and creators you follow for inspiration</p>
          </div>
          
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/app/search">
              <UserPlus className="w-4 h-4 mr-2" />
              Discover Writers
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Following</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFollowing}</div>
              <p className="text-xs text-muted-foreground">People you follow</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Writers</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.writers}</div>
              <p className="text-xs text-muted-foreground">Creative writers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Star className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">Pro members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
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
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All ({stats.totalFollowing})
                </button>
                <button
                  onClick={() => setFilter('writers')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'writers'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Writers ({stats.writers})
                </button>
                <button
                  onClick={() => setFilter('verified')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'verified'
                      ? 'bg-white text-orange-600 shadow-sm'
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
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
                <Card key={follow.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {profile.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Link 
                              href={`/writers/${profile.id}`}
                              className="font-semibold text-gray-800 hover:text-orange-600 transition-colors"
                            >
                              {profile.display_name}
                            </Link>
                            {profile.verified_pro && (
                              <Star className="w-4 h-4 text-orange-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-orange-100 text-orange-700"
                            >
                              {profile.role || 'Writer'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollow(profile.id)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Following
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {profile.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {profile.followers_count || 0}
                        </div>
                        <div className="text-gray-500 text-xs">Followers</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {profile.projects_count || 0}
                        </div>
                        <div className="text-gray-500 text-xs">Projects</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {profile.total_buzz_score || 0}
                        </div>
                        <div className="text-gray-500 text-xs">Total Buzz</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Followed {new Date(follow.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/writers/${profile.id}`}>
                          <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
