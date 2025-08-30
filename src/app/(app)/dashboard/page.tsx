"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import ReaderDashboard from '@/components/reader-dashboard'
import { 
  Plus, 
  FileText, 
  Users, 
  TrendingUp,
  Clock,
  Eye,
  MessageSquare,
  Award,
  BookOpen,
  Star,
  Search,
  UserPlus,
  Crown,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'

interface UserProfile {
  id: string
  role: 'reader' | 'writer' | 'READER' | 'WRITER'
  display_name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [hydrated, setHydrated] = useState(false)
  
  // Handle hydration
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  useEffect(() => {
    if (!hydrated) return
    
    const supabase = createSupabaseClient()
    
    const fetchUserProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }

      setUser(user)

      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
        console.log('✅ Dashboard: User profile loaded', profile)
      }
      setLoading(false)
    }

    fetchUserProfile()
  }, [router, hydrated])

  // Show nothing during hydration to prevent mismatch
  if (!hydrated) {
    return null
  }

  // Show loading state while fetching profile
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-4">Loading your dashboard...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Setting up your profile...</h2>
            <p className="text-gray-300 mb-4">
              We're preparing your personalized dashboard. This usually takes just a moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render dashboard based on user role
  const userRole = userProfile.role?.toLowerCase()
  
  if (userRole === 'reader') {
    return <ReaderDashboard user={user} userProfile={userProfile} />
  } else {
    return <WriterDashboard userProfile={userProfile} />
  }
}

// Simple Reader Dashboard Component (fallback)
function SimpleReaderDashboard({ userProfile }: { userProfile: UserProfile }) {
  const readerStats = {
    projectsRead: 23,
    favoriteProjects: 8,
    commentsLeft: 45,
    followingWriters: 12
  }

  const discoveredProjects = [
    {
      id: '1',
      title: 'The Last Chronicle',
      writer: 'Sarah Mitchell',
      description: 'A sci-fi thriller about time travel',
      genre: 'Sci-Fi',
      rating: 4.8,
      progress: 75
    },
    {
      id: '2',
      title: 'Summer Dreams', 
      writer: 'Marcus Chen',
      description: 'Coming-of-age drama set in the 1980s',
      genre: 'Drama',
      rating: 4.6,
      progress: 100
    },
    {
      id: '3',
      title: 'Urban Legends',
      writer: 'Diana Ross',
      description: 'Horror anthology series treatment',
      genre: 'Horror',
      rating: 4.9,
      progress: 45
    }
  ]

  return (
    <div className="space-y-8">
      {/* Debug Banner */}
      <div style={{backgroundColor: 'red', color: 'white', padding: '15px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}>
        🔴 READER DASHBOARD - ROLE: {userProfile.role}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reader Dashboard</h1>
          <p className="text-gray-300 mt-2">Discover amazing stories and connect with talented writers.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700">
          <Link href="/search">
            <Search className="w-4 h-4 mr-2" />
            Discover Stories
          </Link>
        </Button>
      </div>

      {/* Reader Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Projects Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">{readerStats.projectsRead}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-gold-400" />
              <span className="text-2xl font-bold text-white">{readerStats.favoriteProjects}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{readerStats.commentsLeft}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Following</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{readerStats.followingWriters}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Discovered Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recently Discovered</CardTitle>
                <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                  <Link href="/search">Discover More</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {discoveredProjects.map((project) => (
                <div key={project.id} className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">{project.title}</h3>
                        <Badge variant="outline" className="text-xs bg-navy-700 text-gray-300 border-navy-600">
                          {project.genre}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">by {project.writer}</p>
                      <p className="text-sm text-gray-300 mb-3">{project.description}</p>
                      
                      {/* Reading Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Reading Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-gold-400 fill-current" />
                        <span className="text-sm text-gray-300">{project.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Reader Quick Actions */}
        <div>
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/search">
                  <Search className="w-4 h-4 mr-2" />
                  Find New Stories
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/projects?filter=favorites">
                  <Star className="w-4 h-4 mr-2" />
                  My Favorites
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/writers">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow Writers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
                <Link href="/settings?tab=upgrade">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Writer
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Writer Dashboard Component
function WriterDashboard({ userProfile }: { userProfile: UserProfile }) {
  // Mock data - in real app this would come from database
  const stats = {
    totalProjects: 8,
    activeCollaborations: 3,
    totalViews: 1247,
    thisMonthEngagement: 34
  }

  const recentProjects = [
    {
      id: '1',
      title: 'The Last Chronicle',
      description: 'A sci-fi thriller about time travel',
      status: 'in_progress',
      lastActivity: '2 hours ago',
      collaborators: 2,
      views: 45
    },
    {
      id: '2', 
      title: 'Summer Dreams',
      description: 'Coming-of-age drama set in the 1980s',
      status: 'review',
      lastActivity: '1 day ago',
      collaborators: 1,
      views: 23
    },
    {
      id: '3',
      title: 'Urban Legends',
      description: 'Horror anthology series treatment',
      status: 'completed',
      lastActivity: '3 days ago',
      collaborators: 3,
      views: 89
    }
  ]

  const recentActivity = [
    { id: 1, type: 'comment', content: 'Sarah left feedback on "The Last Chronicle"', time: '1 hour ago' },
    { id: 2, type: 'view', content: 'Your project "Summer Dreams" was viewed by a Pro member', time: '3 hours ago' },
    { id: 3, type: 'collaboration', content: 'Mike joined as a collaborator on "Urban Legends"', time: '1 day ago' },
    { id: 4, type: 'milestone', content: 'Completed first draft of "The Last Chronicle"', time: '2 days ago' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-yellow-500'
      case 'review': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress'
      case 'review': return 'In Review'
      case 'completed': return 'Completed'
      default: return 'Draft'
    }
  }

  return (
    <div className="space-y-8">
      {/* Debug Banner */}
      <div style={{backgroundColor: 'blue', color: 'white', padding: '15px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold'}}>
        � WRITER DASHBOARD - ROLE: {userProfile.role}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Writer Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
          <Link href="/app/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gold-400" />
              <span className="text-2xl font-bold text-white">{stats.totalProjects}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.activeCollaborations}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">+{stats.thisMonthEngagement}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Projects</CardTitle>
                <Button variant="outline" size="sm" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                  <Link href="/app/projects">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{project.title}</h3>
                      <p className="text-sm text-gray-300 mb-2">{project.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{project.lastActivity}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{project.collaborators}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{project.views}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(project.status)} text-white`}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{activity.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-300">
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/projects/new">
                <FileText className="w-6 h-6" />
                <span>Create Project</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/search">
                <Users className="w-6 h-6" />
                <span>Find Collaborators</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/pitch-rooms">
                <MessageSquare className="w-6 h-6" />
                <span>Create Pitch Room</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/settings">
                <Award className="w-6 h-6" />
                <span>Update Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}