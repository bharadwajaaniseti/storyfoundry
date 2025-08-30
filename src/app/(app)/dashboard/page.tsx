"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  FileText, 
  Users, 
  TrendingUp,
  Clock,
  Eye,
  MessageSquare,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const supabase = createSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push('/signin')
      } else {
        setLoading(false)
      }
    })
  }, [router])
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mr-4"></div>
        <span className="text-lg text-gray-600">Loading your dashboard...</span>
      </div>
    )
  }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700">
          <Link href="/projects/new">
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
                  <Link href="/projects">View All</Link>
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
              <Link href="/projects/new">
                <FileText className="w-6 h-6" />
                <span>Create Project</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/search">
                <Users className="w-6 h-6" />
                <span>Find Collaborators</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/pitch-rooms">
                <MessageSquare className="w-6 h-6" />
                <span>Create Pitch Room</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/settings/profile">
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
