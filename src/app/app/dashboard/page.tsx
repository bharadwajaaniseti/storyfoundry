'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReaderDashboard from '@/components/reader-dashboard'
import WriterUpgradeModal from '@/components/writer-upgrade-modal'
import MessageNotifications from '@/components/message-notifications'
import { 
  Plus,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Star,
  Settings,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Shield,
  Calendar
} from 'lucide-react'
import { createSupabaseClient, getUser } from '@/lib/auth'

interface Project {
  id: string
  title: string
  logline: string
  format: string
  genre: string
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  role: 'reader' | 'writer' | 'READER' | 'WRITER'
  display_name: string
}

interface ActivityEvent {
  id: string
  type: 'project_created' | 'project_updated' | 'project_viewed' | 'collaboration_invited' | 'collaboration_accepted'
  message: string
  timestamp: string
  project_id?: string
  project_title?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [isWriterUpgradeModalOpen, setIsWriterUpgradeModalOpen] = useState(false)
  const router = useRouter()

  // Function to generate recent activity from projects and engagement data
  const generateRecentActivity = (projectsData: Project[]): ActivityEvent[] => {
    const activities: ActivityEvent[] = []
    
    // Sort projects by update time to get most recent
    const sortedProjects = [...projectsData].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    // Generate activities for recent project updates
    sortedProjects.slice(0, 5).forEach((project, index) => {
      const isRecent = new Date(project.updated_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      
      if (isRecent) {
        const isNew = new Date(project.created_at).getTime() === new Date(project.updated_at).getTime()
        
        activities.push({
          id: `${project.id}_${isNew ? 'created' : 'updated'}`,
          type: isNew ? 'project_created' : 'project_updated',
          message: isNew 
            ? `Created new ${project.format.toLowerCase()}: "${project.title}"`
            : `Updated "${project.title}"`,
          timestamp: project.updated_at,
          project_id: project.id,
          project_title: project.title
        })
      }
    })

    // Add some sample engagement activities if projects have buzz score
    projectsData.forEach(project => {
      if (project.buzz_score > 0) {
        const viewTime = new Date(new Date(project.updated_at).getTime() + Math.random() * 24 * 60 * 60 * 1000)
        if (viewTime.getTime() > Date.now() - (3 * 24 * 60 * 60 * 1000)) { // Last 3 days
          activities.push({
            id: `${project.id}_viewed`,
            type: 'project_viewed',
            message: `"${project.title}" received ${project.buzz_score} new ${project.buzz_score === 1 ? 'view' : 'views'}`,
            timestamp: viewTime.toISOString(),
            project_id: project.id,
            project_title: project.title
          })
        }
      }
    })

    // Sort activities by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)
  }

  const loadRecentActivity = async (supabase: any, userId: string, projectsData: Project[]) => {
    try {
      // In a real implementation, you'd fetch from engagement_events table
      // For now, we'll generate activity from existing data
      const activity = generateRecentActivity(projectsData)
      setRecentActivity(activity)
    } catch (error) {
      console.error('Error loading activity:', error)
      setRecentActivity([])
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/signin')
          return
        }

        setUser(user)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error loading profile:', profileError)
          return
        }

        setUserProfile(profile)

        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false })

        if (projectsError) {
          console.error('Error loading projects:', projectsError)
          return
        }

        setProjects(projectsData || [])
        
        // Load recent activity
        await loadRecentActivity(supabase, user.id, projectsData || [])
        
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  // Set up real-time updates for activity
  useEffect(() => {
    if (!user || !userProfile) return

    const supabase = createSupabaseClient()
    
    // Subscribe to project changes for real-time activity updates
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `owner_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Project change detected:', payload)
          
          // Reload projects and activity
          const { data: projectsData } = await supabase
            .from('projects')
            .select('*')
            .eq('owner_id', user.id)
            .order('updated_at', { ascending: false })
          
          if (projectsData) {
            setProjects(projectsData)
            await loadRecentActivity(supabase, user.id, projectsData)
          }
        }
      )
      .subscribe()

    // Subscribe to engagement events for activity updates
    const engagementSubscription = supabase
      .channel('engagement-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'engagement_events'
        },
        async (payload) => {
          console.log('Engagement event detected:', payload)
          
          // Check if this engagement is for user's projects
          const { data: project } = await supabase
            .from('projects')
            .select('id, title, owner_id')
            .eq('id', payload.new.project_id)
            .eq('owner_id', user.id)
            .single()
          
          if (project) {
            // Add new activity event
            const newActivity: ActivityEvent = {
              id: `engagement_${payload.new.id}`,
              type: 'project_viewed',
              message: `"${project.title}" received a new ${payload.new.kind}`,
              timestamp: payload.new.created_at,
              project_id: project.id,
              project_title: project.title
            }
            
            setRecentActivity(prev => [newActivity, ...prev.slice(0, 7)])
          }
        }
      )
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
      engagementSubscription.unsubscribe()
    }
  }, [user, userProfile])

  // Set up periodic refresh for activity timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative times
      setRecentActivity(prev => [...prev])
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const stats = {
    totalProjects: projects.length,
    totalViews: projects.reduce((sum, p) => sum + p.buzz_score, 0),
    collaborators: 0, // TODO: Calculate from collaborations table
    timestamps: projects.length // Assuming all projects are timestamped
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return formatDate(dateString)
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="w-4 h-4 text-green-500" />
      case 'preview': return <Users className="w-4 h-4 text-orange-500" />
      case 'private': return <Shield className="w-4 h-4 text-gray-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Check user role and render appropriate dashboard
  const userRole = userProfile?.role?.toLowerCase()
  if (userRole === 'reader') {
    return <ReaderDashboard user={user} userProfile={userProfile} />
  }

  // Continue with Writer Dashboard for writers or default users

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {userProfile?.display_name || user?.user_metadata?.first_name || 'Creator'}!
              </h1>
              <p className="text-gray-600">Manage your creative projects and track your progress</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/app/projects/new"
                className="btn-primary group flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
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
                    <p className="text-sm text-gray-600 font-medium">Projects</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
                    <p className="text-xs text-gray-500 mt-1">Total created</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
                    <p className="text-xs text-gray-500 mt-1">Across all projects</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Collaborators</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.collaborators}</p>
                    <p className="text-xs text-gray-500 mt-1">Active connections</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Protected</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.timestamps}</p>
                    <p className="text-xs text-gray-500 mt-1">IP timestamped</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">All Projects</option>
                      <option value="screenplay">Screenplays</option>
                      <option value="treatment">Treatments</option>
                      <option value="novel">Novels</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No projects yet</h3>
                    <p className="text-gray-600 mb-6">Create your first project to get started with StoryFoundry</p>
                    <Link
                      href="/app/projects/new"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Your First Project</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => router.push(`/app/projects/${project.id}`)}
                        className="group bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:border-orange-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] p-6"
                      >
                        <div className="h-full flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="transform group-hover:scale-110 transition-transform duration-200">
                                {getVisibilityIcon(project.visibility)}
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors duration-200">
                                {project.format}
                              </span>
                              {project.genre && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full group-hover:bg-orange-200 transition-colors duration-200">
                                  {project.genre}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/app/projects/${project.id}/settings`)
                              }}
                              className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200 transform hover:scale-110 hover:rotate-12"
                              title="Project Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
                              {project.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                              {project.logline}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                              <span>{formatDate(project.updated_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                              <span>{project.buzz_score}</span>
                            </div>
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
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/app/projects/new"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">New Project</span>
                </Link>
                <Link
                  href="/app/pitch-rooms"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Join Pitch Room</span>
                </Link>
                <Link
                  href="/app/collaborations"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Manage Collaborations</span>
                </Link>
              </div>
            </div>

            {/* Message Notifications */}
            <MessageNotifications />

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No recent activity</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Activity from collaborations and project views will appear here
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (activity.project_id) {
                          router.push(`/app/projects/${activity.project_id}`)
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {activity.type === 'project_created' && (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'project_updated' && (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-3 h-3 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'project_viewed' && (
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <Eye className="w-3 h-3 text-orange-600" />
                          </div>
                        )}
                        {activity.type === 'collaboration_invited' && (
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-purple-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                      
                      {activity.project_id && (
                        <div className="flex-shrink-0">
                          <div className="w-4 h-4 text-gray-400">
                            <svg viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {recentActivity.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    href="/app/activity"
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
                  >
                    <span>View all activity</span>
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/>
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Upgrade Prompt */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-sm text-white/90 mb-4">
                Unlock advanced AI features, unlimited projects, and priority support.
              </p>
              <button
                onClick={() => setIsWriterUpgradeModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Star className="w-4 h-4" />
                <span>Upgrade Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Writer Upgrade Modal */}
      <WriterUpgradeModal
        isOpen={isWriterUpgradeModalOpen}
        onClose={() => setIsWriterUpgradeModalOpen(false)}
      />
    </div>
  )
}
