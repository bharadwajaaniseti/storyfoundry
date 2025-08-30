'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReaderDashboard from '@/components/reader-dashboard'
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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

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

        // Get user profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, display_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
          console.log('✅ App Dashboard: User profile loaded', profile)
        }

        // Load user's projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false })

        setProjects(projectsData || [])
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

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
                Welcome back, {user?.user_metadata?.first_name || 'Creator'}!
              </h1>
              <p className="text-gray-600">Manage your creative projects and collaborations</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
              </button>
              
              <Link
                href="/app/settings"
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-5 h-5" />
              </Link>
              
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Projects</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collaborators</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.collaborators}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Protected</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.timestamps}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-500" />
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
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-800 hover:text-orange-600">
                                <Link href={`/app/projects/${project.id}`}>
                                  {project.title}
                                </Link>
                              </h3>
                              {getVisibilityIcon(project.visibility)}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {project.format}
                              </span>
                              {project.genre && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                  {project.genre}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {project.logline}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Updated {formatDate(project.updated_at)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{project.buzz_score} views</span>
                              </span>
                            </div>
                          </div>
                          
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
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

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>No recent activity</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Activity from collaborations and project views will appear here
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Prompt */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-sm text-white/90 mb-4">
                Unlock advanced AI features, unlimited projects, and priority support.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center space-x-2 bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Star className="w-4 h-4" />
                <span>Upgrade Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
