'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Clock,
  Plus,
  FileText,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface ActivityEvent {
  id: string
  type: 'project_created' | 'project_updated' | 'project_viewed' | 'collaboration_invited' | 'collaboration_accepted' | 'engagement_received'
  message: string
  timestamp: string
  project_id?: string
  project_title?: string
  details?: string
  actor_name?: string
}

interface ActivityFilter {
  type: 'all' | 'projects' | 'collaborations' | 'engagement'
  timeRange: 'today' | 'week' | 'month' | 'all'
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<ActivityFilter>({ type: 'all', timeRange: 'week' })
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const generateComprehensiveActivity = (projectsData: any[]): ActivityEvent[] => {
    const activities: ActivityEvent[] = []
    const now = new Date()

    projectsData.forEach((project, index) => {
      const projectCreated = new Date(project.created_at)
      const projectUpdated = new Date(project.updated_at)
      
      // Project creation
      activities.push({
        id: `${project.id}_created`,
        type: 'project_created',
        message: `Created new ${project.format.toLowerCase()}: "${project.title}"`,
        timestamp: project.created_at,
        project_id: project.id,
        project_title: project.title,
        details: `Started working on ${project.format} in ${project.genre || 'unspecified'} genre`
      })

      // Project updates (if different from creation)
      if (projectUpdated.getTime() !== projectCreated.getTime()) {
        activities.push({
          id: `${project.id}_updated`,
          type: 'project_updated',
          message: `Updated "${project.title}"`,
          timestamp: project.updated_at,
          project_id: project.id,
          project_title: project.title,
          details: `Made changes to the project content and settings`
        })
      }

      // Simulate engagement events based on buzz score
      if (project.buzz_score > 0) {
        for (let i = 0; i < Math.min(project.buzz_score, 5); i++) {
          const engagementTime = new Date(
            projectUpdated.getTime() + Math.random() * (now.getTime() - projectUpdated.getTime())
          )
          
          const engagementTypes = ['view', 'like', 'comment', 'save']
          const engagementType = engagementTypes[Math.floor(Math.random() * engagementTypes.length)]
          
          activities.push({
            id: `${project.id}_engagement_${i}`,
            type: 'engagement_received',
            message: `"${project.title}" received a ${engagementType}`,
            timestamp: engagementTime.toISOString(),
            project_id: project.id,
            project_title: project.title,
            details: `A reader ${engagementType === 'view' ? 'viewed' : engagementType === 'like' ? 'liked' : engagementType === 'comment' ? 'commented on' : 'saved'} your project`
          })
        }
      }

      // Simulate some collaboration events for recent projects
      if (index < 2 && projectCreated.getTime() > now.getTime() - (30 * 24 * 60 * 60 * 1000)) {
        const collabTime = new Date(projectCreated.getTime() + 24 * 60 * 60 * 1000)
        activities.push({
          id: `${project.id}_collab_invited`,
          type: 'collaboration_invited',
          message: `Invited collaborator to "${project.title}"`,
          timestamp: collabTime.toISOString(),
          project_id: project.id,
          project_title: project.title,
          details: `Sent collaboration invitation for co-writing`,
          actor_name: 'Alex Chen'
        })
      }
    })

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const loadActivity = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }

      setUser(user)

      // Load projects to generate activity
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      if (projectsError) {
        console.error('Error loading projects:', projectsError)
        return
      }

      const generatedActivity = generateComprehensiveActivity(projectsData || [])
      setActivities(generatedActivity)
      
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshActivity = async () => {
    setIsRefreshing(true)
    await loadActivity()
  }

  useEffect(() => {
    loadActivity()
  }, [router])

  useEffect(() => {
    let filtered = activities

    // Filter by type
    if (filter.type !== 'all') {
      filtered = filtered.filter(activity => {
        switch (filter.type) {
          case 'projects':
            return ['project_created', 'project_updated'].includes(activity.type)
          case 'collaborations':
            return ['collaboration_invited', 'collaboration_accepted'].includes(activity.type)
          case 'engagement':
            return ['project_viewed', 'engagement_received'].includes(activity.type)
          default:
            return true
        }
      })
    }

    // Filter by time range
    if (filter.timeRange !== 'all') {
      const now = new Date()
      const cutoffTime = new Date()
      
      switch (filter.timeRange) {
        case 'today':
          cutoffTime.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoffTime.setDate(cutoffTime.getDate() - 7)
          break
        case 'month':
          cutoffTime.setMonth(cutoffTime.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoffTime)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.project_title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredActivities(filtered)
  }, [activities, filter, searchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'project_updated':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'project_viewed':
      case 'engagement_received':
        return <Eye className="w-4 h-4 text-orange-600" />
      case 'collaboration_invited':
      case 'collaboration_accepted':
        return <Users className="w-4 h-4 text-purple-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_created':
        return 'bg-green-100 border-green-200'
      case 'project_updated':
        return 'bg-blue-100 border-blue-200'
      case 'project_viewed':
      case 'engagement_received':
        return 'bg-orange-100 border-orange-200'
      case 'collaboration_invited':
      case 'collaboration_accepted':
        return 'bg-purple-100 border-purple-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/app/dashboard"
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Activity Timeline</h1>
                <p className="text-gray-600">Track your projects, collaborations, and engagement</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshActivity}
                disabled={isRefreshing}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh activity"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Activity Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Activities</option>
                  <option value="projects">Projects</option>
                  <option value="collaborations">Collaborations</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={filter.timeRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Activity Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Activity Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Events</span>
                    <span className="font-medium text-gray-800">{filteredActivities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-medium text-gray-800">
                      {filteredActivities.filter(a => 
                        new Date(a.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Activity Timeline
                    {filteredActivities.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'})
                      </span>
                    )}
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No activity found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery ? 'Try adjusting your search or filters' : 'Start creating projects to see activity here'}
                    </p>
                    {!searchQuery && (
                      <Link
                        href="/app/projects/new"
                        className="btn-primary inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Your First Project</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={`relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getActivityColor(activity.type)}`}
                      >
                        {/* Timeline Line */}
                        {index < filteredActivities.length - 1 && (
                          <div className="absolute left-8 top-12 w-px h-8 bg-gray-200"></div>
                        )}
                        
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-white border-2 border-current rounded-full flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {activity.message}
                                </p>
                                {activity.details && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {activity.details}
                                  </p>
                                )}
                                {activity.actor_name && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Involving {activity.actor_name}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <span className="text-xs text-gray-500">
                                  {formatDate(activity.timestamp)}
                                </span>
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
          </div>
        </div>
      </div>
    </div>
  )
}
