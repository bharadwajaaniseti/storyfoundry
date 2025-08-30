'use client'

import { useState, useEffect } from 'react'
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
  Crown
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
}

interface TrendingStory {
  id: number
  title: string
  author: string
  likes: number
  views: number
  category: string
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
      
      // Mock data for now - you can replace with actual database queries
      setStats({
        storiesRead: 24,
        favoriteStories: 8,
        readingTime: 45, // hours
        followingWriters: 12
      })

      // Mock recent stories
      setRecentStories([
        {
          id: 1,
          title: "The Chronicles of Tomorrow",
          author: "Sarah Chen",
          excerpt: "In a world where technology has merged with magic...",
          readTime: "12 min",
          category: "Sci-Fi",
          updatedAt: "2 hours ago",
          progress: 75
        },
        {
          id: 2,
          title: "Mysteries of the Old Library",
          author: "Marcus Rivera",
          excerpt: "Deep within the ancient archives lay secrets that...",
          readTime: "8 min",
          category: "Mystery",
          updatedAt: "1 day ago",
          progress: 100
        },
        {
          id: 3,
          title: "Love in the Digital Age",
          author: "Emma Thompson",
          excerpt: "When virtual reality becomes more real than...",
          readTime: "15 min",
          category: "Romance",
          updatedAt: "3 days ago",
          progress: 45
        }
      ])

      // Mock trending stories
      setTrendingStories([
        {
          id: 4,
          title: "The Last Phoenix",
          author: "David Park",
          likes: 1234,
          views: 15678,
          category: "Fantasy"
        },
        {
          id: 5,
          title: "Corporate Shadows",
          author: "Lisa Wang",
          likes: 987,
          views: 12456,
          category: "Thriller"
        },
        {
          id: 6,
          title: "Ocean's Memory",
          author: "Alex Rodriguez",
          likes: 756,
          views: 9876,
          category: "Drama"
        }
      ])

      // Mock recommended writers
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
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Search className="w-4 h-4 mr-2" />
          Discover Stories
        </Button>
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
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
