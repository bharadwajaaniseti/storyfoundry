'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Search, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  Eye,
  Heart,
  Bookmark,
  Filter,
  SortDesc,
  Crown,
  BookMarked
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { useProfileModal } from '@/hooks/useProfileModal'
import ProfileModal from '@/components/profile-modal'
import ReaderUpgradeModal from '@/components/reader-upgrade-modal'

interface ReaderDashboardProps {
  user: User
  userProfile: any
}

interface Story {
  id: number
  title: string
  author: string
  excerpt: string
  readTime: string
  category: string
  updatedAt: string
  progress: number
  projectId?: string
  profiles?: any
}

interface TrendingStory {
  id: number
  title: string
  author: string
  likes: number
  views: number
  category: string
  projectId?: string
  profiles?: any
}

interface Writer {
  id: number
  name: string
  speciality: string
  followers: number
  stories: number
  avatar: string | null
}

export default function ReaderDashboard({ user, userProfile }: ReaderDashboardProps) {
  const { 
    selectedProfileId, 
    openProfileModal, 
    closeProfileModal, 
    isProfileModalOpen 
  } = useProfileModal()

  // Helper function to determine what to display for author
  const getAuthorDisplay = (profile: any) => {
    if (!profile) return 'Unknown Writer'
    
    // If profile is private, show "Account is Private"
    if (profile.profile_visibility === 'private') {
      return 'Account is Private'
    }
    
    // Otherwise show display name or fallback
    return profile.display_name || 'Unknown Writer'
  }

  // Helper function to check if profile interactions should be disabled
  const isProfileInteractionDisabled = (profile: any) => {
    // Allow all profile viewing now that we have request access functionality
    // Users can view private profiles and request access if needed
    return false
  }

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    storiesRead: 0,
    favoriteStories: 0,
    readingTime: 0,
    followingWriters: 0
  })
  
  const [recentStories, setRecentStories] = useState<Story[]>([])
  const [trendingStories, setTrendingStories] = useState<TrendingStory[]>([])
  const [recommendedWriters, setRecommendedWriters] = useState<Writer[]>([])
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isRefreshingWriters, setIsRefreshingWriters] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  useEffect(() => {
    fetchReaderData()
  }, [user.id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [refreshTimeout])

  const handleFollowWriter = async (writerId: string) => {
    try {
      const supabase = createSupabaseClient()
      
      if (followingUsers.has(writerId)) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', writerId)
        
        if (!error) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(writerId)
            return newSet
          })
          // Update stats
          setStats(prev => ({ ...prev, followingWriters: prev.followingWriters - 1 }))
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: writerId
          })
        
        if (!error) {
          setFollowingUsers(prev => new Set([...prev, writerId]))
          // Update stats
          setStats(prev => ({ ...prev, followingWriters: prev.followingWriters + 1 }))
        }
      }

      // Refresh the recommended writers section after 30 seconds
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
      
      setIsRefreshingWriters(true)
      const timeout = setTimeout(async () => {
        await fetchRecommendedWriters()
        setIsRefreshingWriters(false)
      }, 30000) // 30 seconds
      
      setRefreshTimeout(timeout)
      
    } catch (error) {
      console.error('Error managing follow relationship:', error)
    }
  }

  const fetchRecommendedWriters = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Load recommended writers (simplified query)
      const { data: recommendedWritersData, error: recommendedError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          bio,
          avatar_url,
          role
        `)
        .eq('role', 'writer')
        .eq('discoverable', true)
        .neq('id', user.id)
        .limit(10)

      // Get writers user is already following
      const { data: currentFollows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)

      // Get project counts for each writer
      let finalRecommendedWriters: any[] = []
      if (recommendedWritersData && !recommendedError) {
        const followingIds = new Set(currentFollows?.map(f => f.following_id) || [])
        setFollowingUsers(followingIds)
        
        // Filter out writers user is already following
        const unfollowedWriters = recommendedWritersData.filter(writer => !followingIds.has(writer.id))
        
        // Get project counts and follower counts for each writer
        const writersWithCounts = await Promise.all(
          unfollowedWriters.slice(0, 3).map(async (writer) => {
            const [projectsRes, followersRes] = await Promise.all([
              supabase
                .from('projects')
                .select('id', { count: 'exact' })
                .eq('owner_id', writer.id)
                .eq('visibility', 'public'),
              supabase
                .from('user_follows')
                .select('id', { count: 'exact' })
                .eq('following_id', writer.id)
            ])
            
            return {
              id: writer.id,
              name: writer.display_name || 'Anonymous Writer',
              speciality: writer.bio ? writer.bio.substring(0, 30) + '...' : 'Storyteller',
              followers: followersRes.count || 0,
              stories: projectsRes.count || 0,
              avatar: writer.avatar_url
            }
          })
        )
        
        finalRecommendedWriters = writersWithCounts
      }

      setRecommendedWriters(finalRecommendedWriters)
      console.log('🔄 Refreshed recommended writers')
    } catch (error) {
      console.error('Error refreshing recommended writers:', error)
    }
  }

  const fetchReaderData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Fetch real user stats
      const [
        { data: readingProgressData, error: readingError },
        { data: bookmarksData, error: bookmarksError },
        { data: followingData, error: followingError },
        { data: completedReadsData, error: completedError }
      ] = await Promise.all([
        // Reading progress (stories in progress)
        supabase
          .from('reading_progress')
          .select('*, projects!inner(id, title, profiles!owner_id(display_name))')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        
        // Bookmarked stories
        supabase
          .from('engagement_events')
          .select('project_id')
          .eq('actor_id', user.id)
          .eq('kind', 'save'),
        
        // Following writers count
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id),
        
        // Completed stories (100% progress)
        supabase
          .from('reading_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
      ])

      console.log('📊 User stats response:', { 
        readingProgressData, readingError,
        bookmarksData, bookmarksError,
        followingData, followingError,
        completedReadsData, completedError
      })

      // Calculate reading time (estimate based on word count and progress)
      let totalReadingTime = 0
      if (readingProgressData) {
        for (const progress of readingProgressData) {
          const project = progress.projects
          if (project && project.word_count) {
            const wordsRead = (project.word_count * progress.progress_percentage) / 100
            totalReadingTime += Math.ceil(wordsRead / 200) // 200 words per minute average reading speed
          }
        }
      }

      // Set real stats
      setStats({
        storiesRead: completedReadsData?.length || 0,
        favoriteStories: bookmarksData?.length || 0,
        readingTime: Math.ceil(totalReadingTime / 60), // Convert minutes to hours
        followingWriters: followingData?.length || 0
      })
      
      // Load recent stories with real reading progress
      const { data: recentProjects, error: recentError } = await supabase
        .from('reading_progress')
        .select(`
          progress_percentage,
          updated_at,
          is_completed,
          projects!inner (
            id,
            title,
            logline,
            genre,
            word_count,
            created_at,
            visibility,
            profiles!owner_id!inner (
              id,
              display_name,
              avatar_url,
              profile_visibility,
              discoverable
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .eq('projects.visibility', 'public')
        .eq('projects.profiles.discoverable', true)
        .order('updated_at', { ascending: false })
        .limit(3)

      console.log('📚 Recent projects with progress:', { recentProjects, recentError })

      // Load trending projects  
      const { data: trendingProjects, error: trendingError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          logline,
          genre,
          buzz_score,
          word_count,
          profiles!owner_id!inner (
            id,
            display_name,
            avatar_url,
            profile_visibility,
            discoverable
          )
        `)
        .eq('visibility', 'public')
        .eq('profiles.discoverable', true)
        .order('buzz_score', { ascending: false })
        .limit(6)

      console.log('🔥 Trending projects response:', { trendingProjects, trendingError })

      // Load recommended writers (simplified query)
      const { data: recommendedWritersData, error: recommendedError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          bio,
          avatar_url,
          role
        `)
        .eq('role', 'writer')
        .eq('discoverable', true)
        .neq('id', user.id)
        .limit(10)

      console.log('👥 All writers response:', { recommendedWritersData, recommendedError })

      // Get writers user is already following
      const { data: currentFollows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)

      console.log('📋 Current follows:', { currentFollows, followsError })

      // Get project counts for each writer
      let finalRecommendedWriters: any[] = []
      if (recommendedWritersData && !recommendedError) {
        const followingIds = new Set(currentFollows?.map(f => f.following_id) || [])
        setFollowingUsers(followingIds)
        
        // Filter out writers user is already following
        const unfollowedWriters = recommendedWritersData.filter(writer => !followingIds.has(writer.id))
        
        // Get project counts and follower counts for each writer
        const writersWithCounts = await Promise.all(
          unfollowedWriters.slice(0, 3).map(async (writer) => {
            const [projectsRes, followersRes] = await Promise.all([
              supabase
                .from('projects')
                .select('id', { count: 'exact' })
                .eq('owner_id', writer.id)
                .eq('visibility', 'public'),
              supabase
                .from('user_follows')
                .select('id', { count: 'exact' })
                .eq('following_id', writer.id)
            ])
            
            return {
              id: writer.id,
              name: writer.display_name || 'Anonymous Writer',
              speciality: writer.bio ? writer.bio.substring(0, 30) + '...' : 'Storyteller',
              followers: followersRes.count || 0,
              stories: projectsRes.count || 0,
              avatar: writer.avatar_url
            }
          })
        )
        
        finalRecommendedWriters = writersWithCounts
      }

      console.log('✨ Final recommended writers:', finalRecommendedWriters)

      if (recentError || trendingError) {
        console.error('❌ Error loading projects:', { recentError, trendingError })
      }

      // Transform recent projects to match Story interface
      if (recentProjects && recentProjects.length > 0) {
        const transformedRecentStories = recentProjects.map((progressItem: any, index: number) => {
          const project = progressItem.projects
          return {
            id: index + 1,
            title: project.title,
            author: getAuthorDisplay(project.profiles),
            excerpt: project.logline || 'No description available',
            readTime: project.word_count ? `${Math.ceil(project.word_count / 200)} min` : 'Unknown',
            category: project.genre,
            updatedAt: new Date(progressItem.updated_at).toLocaleDateString(),
            progress: Math.round(progressItem.progress_percentage || 0),
            projectId: project.id,
            profiles: project.profiles
          }
        })
        setRecentStories(transformedRecentStories)
      } else {
        setRecentStories([])
      }

      // Transform trending projects to match TrendingStory interface
      if (trendingProjects) {
        const transformedTrendingStories = trendingProjects.map((project: any, index: number) => ({
          id: index + 4,
          title: project.title,
          author: getAuthorDisplay(project.profiles),
          likes: Math.floor(project.buzz_score || 0),
          views: Math.floor((project.buzz_score || 0) * 10),
          category: project.genre,
          projectId: project.id,
          profiles: project.profiles
        }))
        setTrendingStories(transformedTrendingStories)
      }

      // Set recommended writers from the processed data
      setRecommendedWriters(finalRecommendedWriters)

    } catch (error) {
      console.error('Error fetching reader data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Sci-Fi': 'bg-blue-100 text-blue-800',
      'Fantasy': 'bg-purple-100 text-purple-800',
      'Mystery': 'bg-gray-100 text-gray-800',
      'Romance': 'bg-pink-100 text-pink-800',
      'Thriller': 'bg-red-100 text-red-800',
      'Drama': 'bg-green-100 text-green-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
                <BookOpen className="w-7 h-7 text-purple-600" />
                <span>Welcome back, {userProfile?.display_name || 'Reader'}!</span>
              </h1>
              <p className="text-gray-600">Discover amazing stories and continue your reading journey</p>
            </div>
            
            <div className="flex items-center space-x-3">
              
              <Link
                href="/app/search"
                className="btn-primary flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Discover Stories</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Stories Read</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.storiesRead}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.storiesRead > 0 ? `+${Math.max(1, Math.floor(stats.storiesRead * 0.2))} this month` : 'Start reading today!'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Favorites</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.favoriteStories}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.favoriteStories > 0 ? 'Stories you loved' : 'Bookmark your favorites'}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Reading Time</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.readingTime}h</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.readingTime > 0 ? 'This month' : 'Time well spent'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Following</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.followingWriters}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.followingWriters > 0 ? 'Writers you follow' : 'Discover new writers'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Reading Section */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bookmark className="w-6 h-6 text-purple-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Continue Reading</h2>
                      <p className="text-gray-600">Pick up where you left off</p>
                    </div>
                  </div>
                  <Link
                    href="/app/library"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {recentStories.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No stories in progress</h3>
                    <p className="text-gray-600 mb-6">Start reading to see your progress here</p>
                    <Link
                      href="/app/search"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Discover Stories</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentStories.map((story: any) => (
                      <div 
                        key={story.id} 
                        className="group p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                {story.title}
                              </h4>
                              <Badge className={`${getCategoryColor(story.category)} flex-shrink-0 ml-2`}>
                                {story.category}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">by {story.author}</p>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{story.excerpt}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{story.readTime}</span>
                                </span>
                                <span>Updated {story.updatedAt}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${story.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{story.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trending Stories */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Trending Stories</h2>
                      <p className="text-gray-600">Popular stories this week</p>
                    </div>
                  </div>
                  <Link
                    href="/app/search?filter=trending"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {trendingStories.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No trending stories available</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingStories.map((story: any) => (
                      <div 
                        key={story.id} 
                        className="group p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={getCategoryColor(story.category)}>{story.category}</Badge>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span>{story.likes}</span>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                            {story.title}
                          </h4>
                          <p className="text-sm text-gray-600">by {story.author}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{story.views} views</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{story.likes} likes</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommended Writers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-800">Writers to Follow</h3>
                {isRefreshingWriters && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-3 h-3 border border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                    <span className="text-xs">Updating...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">Discover talented storytellers</p>
              
              <div className="space-y-4">
                {recommendedWriters.map((writer: any) => (
                  <div key={writer.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {writer.avatar ? (
                        <img src={writer.avatar} alt={writer.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {writer.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => openProfileModal(writer.id)}
                        className="text-left w-full"
                      >
                        <h5 className="font-medium text-gray-900 truncate hover:text-purple-600 transition-colors cursor-pointer">
                          {writer.name}
                        </h5>
                      </button>
                      <p className="text-xs text-gray-500">{writer.speciality}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                        <span>{writer.followers} followers</span>
                        <span>{writer.stories} stories</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowWriter(writer.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        followingUsers.has(writer.id)
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'text-purple-600 border border-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {followingUsers.has(writer.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading Goals */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reading Goals</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Monthly Goal</span>
                    <span className="text-gray-800 font-medium">
                      {stats.storiesRead}/{Math.max(10, stats.storiesRead + 3)} stories
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, (stats.storiesRead / Math.max(10, stats.storiesRead + 3)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Reading Streak</span>
                    <span className="text-gray-800 font-medium">
                      {recentStories.length > 0 ? Math.min(12, recentStories.length * 3) : 0} days
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          i < Math.min(5, recentStories.length + 2) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Reading Section */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-3">
                <Crown className="w-6 h-6 text-yellow-300" />
                <h3 className="text-lg font-semibold">Premium Reading</h3>
              </div>
              <p className="text-white/90 text-sm mb-4">
                Unlock exclusive stories and enhanced reading features!
              </p>
              <ul className="text-sm space-y-1 mb-4 text-white/90">
                <li>• Access to premium stories</li>
                <li>• Ad-free reading experience</li>
                <li>• Early access to new releases</li>
                <li>• Offline reading capabilities</li>
              </ul>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && selectedProfileId && (
        <ProfileModal
          profileId={selectedProfileId}
          currentUserRole={userProfile?.role || 'reader'}
          onClose={closeProfileModal}
          onFollow={() => {
            // Refresh recommended writers after following from modal
            if (refreshTimeout) {
              clearTimeout(refreshTimeout)
            }
            setIsRefreshingWriters(true)
            const timeout = setTimeout(async () => {
              await fetchRecommendedWriters()
              setIsRefreshingWriters(false)
            }, 30000)
            setRefreshTimeout(timeout)
          }}
          onUnfollow={() => {
            // Refresh recommended writers after unfollowing from modal
            if (refreshTimeout) {
              clearTimeout(refreshTimeout)
            }
            setIsRefreshingWriters(true)
            const timeout = setTimeout(async () => {
              await fetchRecommendedWriters()
              setIsRefreshingWriters(false)
            }, 30000)
            setRefreshTimeout(timeout)
          }}
        />
      )}

      {/* Reader Upgrade Modal */}
      <ReaderUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  )
}
