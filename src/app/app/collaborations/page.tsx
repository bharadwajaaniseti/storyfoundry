'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users,
  Plus,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Calendar,
  Star
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import CollaborationInvitations from '@/components/collaboration-invitations'
import InviteCollaboratorModal from '@/components/invite-collaborator-modal'
import { useCollaborationInvitations, useActiveCollaborations } from '@/hooks/useCollaboration'

export default function CollaborationsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { invitations: receivedInvitations } = useCollaborationInvitations('received')
  const { invitations: sentInvitations } = useCollaborationInvitations('sent')
  const { collaborations: activeCollaborations, loading: activeLoading } = useActiveCollaborations()

  const pendingReceived = receivedInvitations.filter(inv => inv.status === 'pending').length
  const pendingSent = sentInvitations.filter(inv => inv.status === 'pending').length
  const activeProjects = activeCollaborations.length

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Collaborations</h1>
              <p className="text-gray-600">Manage your collaborative projects and team connections</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/app/search"
                className="btn-primary group flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Find Collaborators</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-800">{pendingReceived}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Sent Invitations</p>
                <p className="text-2xl font-bold text-gray-800">{pendingSent}</p>
                <p className="text-xs text-gray-500 mt-1">Pending approval</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Projects</p>
                <p className="text-2xl font-bold text-gray-800">{activeProjects}</p>
                <p className="text-xs text-gray-500 mt-1">Collaborating now</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-gray-800">--</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <Tabs defaultValue="received" className="space-y-6">
                  <TabsList className="bg-gray-100">
                    <TabsTrigger value="received" className="flex items-center space-x-2 data-[state=active]:bg-white">
                      <span>Received</span>
                      {pendingReceived > 0 && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600">
                          {pendingReceived}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center space-x-2 data-[state=active]:bg-white">
                      <span>Sent</span>
                      {pendingSent > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                          {pendingSent}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="active" className="data-[state=active]:bg-white">Active Projects</TabsTrigger>
                  </TabsList>

                  <TabsContent value="received" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-6 pt-2">
                        <h2 className="text-xl font-semibold text-gray-800">Collaboration Invitations</h2>
                      </div>
                      <CollaborationInvitations type="received" />
                    </div>
                  </TabsContent>

                  <TabsContent value="sent" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-6 pt-2">
                        <h2 className="text-xl font-semibold text-gray-800">Sent Invitations</h2>
                      </div>
                      <CollaborationInvitations type="sent" />
                    </div>
                  </TabsContent>

                  <TabsContent value="active" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-6 pt-2">
                        <h2 className="text-xl font-semibold text-gray-800">Active Collaborations</h2>
                      </div>
                      
                      <div className="px-6 pb-6">
                        {activeLoading ? (
                          <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading collaborations...</p>
                          </div>
                        ) : activeCollaborations.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No active collaborations</h3>
                            <p className="text-gray-600 mb-6">
                              Start collaborating with other creators to bring your stories to life
                            </p>
                            <Link
                              href="/app/search"
                              className="btn-primary inline-flex items-center space-x-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Find Collaborators</span>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeCollaborations.map((collaboration) => (
                              <div
                                key={collaboration.id}
                                className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-3">
                                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-orange-100 transition-colors duration-200">
                                        <BookOpen className="w-5 h-5 text-blue-600 group-hover:text-orange-600 transition-colors duration-200" />
                                      </div>
                                      <div>
                                        <Link 
                                          href={collaboration.project.format && collaboration.project.format.toLowerCase() === 'novel' ? `/novels/${collaboration.project.id}` : `/app/projects/${collaboration.project.id}`}
                                          className="text-lg font-semibold text-gray-800 hover:text-orange-600 transition-colors"
                                        >
                                          {collaboration.project.title}
                                        </Link>
                                        <p className="text-sm text-gray-600 mt-1">{collaboration.project.logline || collaboration.project.synopsis}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                                      <div className="flex items-center space-x-2">
                                        <Avatar className="w-5 h-5">
                                          <AvatarImage src={collaboration.project.owner.avatar_url} />
                                          <AvatarFallback className="text-xs">
                                            {collaboration.project.owner.display_name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>Owner: {collaboration.project.owner.display_name}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {formatDate(collaboration.joined_at)}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Star className="w-4 h-4 text-orange-500" />
                                        <span>{collaboration.royalty_split}% revenue</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <Badge variant="outline" className="capitalize border-gray-300 text-gray-700">
                                      {formatRole(collaboration.role)}
                                    </Badge>
                                    <Badge className="capitalize bg-orange-100 text-orange-600 hover:bg-orange-200">
                                      {collaboration.project.format}
                                    </Badge>
                                    <Link 
                                      href={collaboration.project.format && collaboration.project.format.toLowerCase() === 'novel' ? `/novels/${collaboration.project.id}` : `/app/projects/${collaboration.project.id}`}
                                      className="inline-flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      View Project
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
                  href="/app/search"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-orange-500" />
                  <span className="text-gray-700">Find Collaborators</span>
                </Link>
                <Link
                  href="/app/projects"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Browse Projects</span>
                </Link>
                <Link
                  href="/app/settings"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Collaboration Settings</span>
                </Link>
              </div>
            </div>

            {/* Collaboration Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Collaboration Tips</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Set clear expectations and deadlines from the start</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Communicate regularly about progress and changes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Use version control to track document changes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Respect each other's creative contributions</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-white/90 mb-4">
                Learn more about collaboration features and best practices.
              </p>
              <button className="inline-flex items-center space-x-2 bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <AlertCircle className="w-4 h-4" />
                <span>View Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId="demo-project" // This would be passed from a project context
        projectTitle="Demo Project"
      />
    </div>
  )
}
