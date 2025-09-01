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
    return profile?.profile_visibility === 'private'
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

  useEffect(() => {
    fetchReaderData()
  }, [user.id])

  const fetchReaderData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      console.log('🔍 Loading reader dashboard data...')

      // Load real projects for recent stories
      const { data: recentProjects, error: recentError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          logline,
          genre,
          word_count,
          created_at,
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
        .order('created_at', { ascending: false })
        .limit(3)

      console.log('📚 Recent projects response:', { recentProjects, recentError })

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
        .limit(3)

      console.log('🔥 Trending projects response:', { trendingProjects, trendingError })

      if (recentError || trendingError) {
        console.error('❌ Error loading projects:', { recentError, trendingError })
      }

      // Transform recent projects to match Story interface
      if (recentProjects) {
        const transformedRecentStories = recentProjects.map((project: any, index: number) => ({
          id: index + 1,
          title: project.title,
          author: getAuthorDisplay(project.profiles),
          excerpt: project.logline || 'No description available',
          readTime: project.word_count ? `${Math.ceil(project.word_count / 200)} min` : 'Unknown',
          category: project.genre,
          updatedAt: new Date(project.created_at).toLocaleDateString(),
          progress: 0, // Could be real reading progress if you track it
          projectId: project.id,
          profiles: project.profiles
        }))
        setRecentStories(transformedRecentStories)
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

      // Keep mock stats for now (could be replaced with real data later)
      setStats({
        storiesRead: 24,
        favoriteStories: 8,
        readingTime: 45,
        followingWriters: 12
      })

      // Mock recommended writers (could be replaced with real data later)
      setRecommendedWriters([
        {
          id: 1,
          name: "Jordan Blake",
          speciality: "Science Fiction",
          followers: 2341,
          stories: 15,
          avatar: null
        },
        {
          id: 2,
          name: "Maya Patel",
          speciality: "Fantasy",
          followers: 1876,
          stories: 22,
          avatar: null
        },
        {
          id: 3,
          name: "Chris Anderson",
          speciality: "Mystery",
          followers: 1432,
          stories: 18,
          avatar: null
        }
      ])

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <span>Reader Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userProfile?.display_name || user.email}! Ready to dive into some great stories?
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href="/app/library">
              <BookMarked className="w-4 h-4 mr-2" />
              My Library
            </Link>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
            <Link href="/app/search">
              <Search className="w-4 h-4 mr-2" />
              Discover Stories
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Read</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storiesRead}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteStories}</div>
            <p className="text-xs text-muted-foreground">Stories you loved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readingTime}h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Following</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followingWriters}</div>
            <p className="text-xs text-muted-foreground">Writers you follow</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Reading */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-purple-600" />
                <span>Continue Reading</span>
              </CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentStories.map((story: any) => (
                <div key={story.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{story.title}</h4>
                      <Badge className={getCategoryColor(story.category)}>{story.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">by {story.author}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{story.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{story.readTime}</span>
                        </span>
                        <span>{story.updatedAt}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${story.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{story.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Writers */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Writers to Follow</span>
              </CardTitle>
              <CardDescription>Discover talented storytellers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedWriters.map((writer: any) => (
                <div key={writer.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {writer.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{writer.name}</h5>
                    <p className="text-xs text-gray-500">{writer.speciality}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span>{writer.followers} followers</span>
                      <span>{writer.stories} stories</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trending Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Trending Stories</span>
          </CardTitle>
          <CardDescription>Popular stories this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingStories.map((story: any) => (
              <div key={story.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(story.category)}>{story.category}</Badge>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Heart className="w-3 h-3" />
                      <span>{story.likes}</span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 line-clamp-2">{story.title}</h4>
                  <p className="text-sm text-gray-600">by {story.author}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{story.views}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{story.likes}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Crown className="w-5 h-5 text-orange-600" />
            <span>Upgrade to Writer</span>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Ready to share your own stories? Upgrade to a Writer account and start creating!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-orange-800 font-medium">Writer benefits include:</p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Create and publish unlimited stories</li>
                <li>• Advanced analytics and insights</li>
                <li>• Monetization opportunities</li>
                <li>• Priority support</li>
              </ul>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
