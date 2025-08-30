'use client'

import Link from 'next/link'
import { 
  Users,
  Plus,
  Mail,
  Check,
  X,
  Clock,
  FileText,
  MessageSquare,
  Settings,
  Search,
  Filter
} from 'lucide-react'

const COLLABORATION_INVITES = [
  {
    id: '1',
    project: {
      title: 'Neon Nights',
      format: 'Screenplay',
      owner: 'Alex Morgan'
    },
    role: 'Co-Writer',
    message: 'Would love to collaborate on this cyberpunk thriller. Your background in tech writing would be perfect.',
    sentAt: '2024-01-10T10:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    project: {
      title: 'The Last Garden',
      format: 'Novel',
      owner: 'Maria Santos'
    },
    role: 'Editor',
    message: 'Looking for an experienced editor to help polish this environmental fiction novel.',
    sentAt: '2024-01-08T14:15:00Z',
    status: 'pending'
  }
]

const ACTIVE_COLLABORATIONS = [
  {
    id: '1',
    project: {
      title: 'Midnight Express',
      format: 'Treatment',
      owner: 'David Kim'
    },
    role: 'Co-Writer',
    startedAt: '2023-12-15T09:00:00Z',
    lastActivity: '2024-01-12T16:45:00Z',
    status: 'active',
    progress: 65
  },
  {
    id: '2',
    project: {
      title: 'Ocean Deep',
      format: 'Screenplay',
      owner: 'Sarah Johnson'
    },
    role: 'Script Doctor',
    startedAt: '2024-01-05T11:30:00Z',
    lastActivity: '2024-01-11T13:20:00Z',
    status: 'active',
    progress: 30
  }
]

export default function CollaborationsPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return formatDate(dateString)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Collaborations</h1>
              <p className="text-gray-600">Manage your collaborative projects and team invitations</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collaborations..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Invite Collaborator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Invitations */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Pending Invitations</h2>
                {COLLABORATION_INVITES.length > 0 && (
                  <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    {COLLABORATION_INVITES.length} pending
                  </span>
                )}
              </div>
              
              {COLLABORATION_INVITES.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No pending invitations</h3>
                  <p className="text-gray-600">New collaboration invitations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {COLLABORATION_INVITES.map((invite) => (
                    <div key={invite.id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">{invite.project.title}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {invite.project.format}
                            </span>
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                              {invite.role}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{invite.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>From {invite.project.owner}</span>
                            <span>•</span>
                            <span>{formatTime(invite.sentAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 transition-colors text-sm">
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Collaborations */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Collaborations</h2>
              
              {ACTIVE_COLLABORATIONS.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No active collaborations</h3>
                  <p className="text-gray-600 mb-6">Start collaborating with other creators to bring your stories to life</p>
                  <button className="btn-primary inline-flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Find Collaborators</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ACTIVE_COLLABORATIONS.map((collab) => (
                    <div key={collab.id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">{collab.project.title}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {collab.project.format}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              {collab.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span>with {collab.project.owner}</span>
                            <span>•</span>
                            <span>Started {formatTime(collab.startedAt)}</span>
                            <span>•</span>
                            <span>Last activity {formatTime(collab.lastActivity)}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{collab.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all" 
                                style={{ width: `${collab.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <Link
                          href={`/app/projects/${collab.id}`}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View Project →
                        </Link>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            collab.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-500 capitalize">{collab.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collaboration Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Collaboration Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Set clear expectations and deadlines from the start</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Communicate regularly about progress and changes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use version control to track document changes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Respect each other's creative contributions</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Invite New Collaborator</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Find Projects to Join</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Collaboration Settings</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Collaborations</span>
                  <span className="font-semibold text-gray-800">{ACTIVE_COLLABORATIONS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Invites</span>
                  <span className="font-semibold text-gray-800">{COLLABORATION_INVITES.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Projects</span>
                  <span className="font-semibold text-gray-800">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
