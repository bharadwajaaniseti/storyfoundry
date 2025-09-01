'use client'

import { useEffect, useState } from 'react'
import { X, Clock, Plus, FileText, Eye, Users, Search, Filter } from 'lucide-react'

interface ActivityEvent {
  id: string
  type: 'project_created' | 'project_updated' | 'project_viewed' | 'collaboration_invited' | 'engagement_received'
  message: string
  timestamp: string
  project_id?: string
  project_title?: string
  details?: string
}

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activities: ActivityEvent[]
}

export default function ActivityModal({ isOpen, onClose, activities }: ActivityModalProps) {
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>(activities)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let filtered = activities

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(activity => {
        switch (filter) {
          case 'projects':
            return ['project_created', 'project_updated'].includes(activity.type)
          case 'engagement':
            return ['project_viewed', 'engagement_received'].includes(activity.type)
          case 'collaborations':
            return ['collaboration_invited'].includes(activity.type)
          default:
            return true
        }
      })
    }

    // Filter by search
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        return <Users className="w-4 h-4 text-purple-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl transform transition-transform">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Activity Timeline</h2>
              <p className="text-sm text-gray-600">Recent activity and updates</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
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
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Activities</option>
                <option value="projects">Projects</option>
                <option value="engagement">Engagement</option>
                <option value="collaborations">Collaborations</option>
              </select>
            </div>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-800 mb-1">No activity found</h3>
                <p className="text-xs text-gray-600">
                  {searchQuery ? 'Try adjusting your search' : 'Activity will appear here as you work'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="relative flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Timeline Line */}
                    {index < filteredActivities.length - 1 && (
                      <div className="absolute left-6 top-10 w-px h-8 bg-gray-200"></div>
                    )}
                    
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 bg-white border-2 border-current rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.message}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Showing {filteredActivities.length} of {activities.length} events
              </p>
              <a 
                href="/app/activity"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                onClick={onClose}
              >
                View full activity timeline →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
