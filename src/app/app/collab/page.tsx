'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users,
  Plus,
  Search,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Calendar,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import CollaborationInvitations from '@/components/collaboration-invitations'
import InviteCollaboratorModal from '@/components/invite-collaborator-modal'
import { useCollaborationInvitations, useActiveCollaborations } from '@/hooks/useCollaboration'

export default function CollaborationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
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
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Collaborations</h1>
              <p className="text-gray-600">Manage your collaborative projects and team connections</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              <Button asChild>
                <Link href="/app/search">
                  <Plus className="w-4 h-4 mr-2" />
                  Find Collaborators
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                  <p className="text-2xl font-bold text-gray-800">{pendingReceived}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent Invitations</p>
                  <p className="text-2xl font-bold text-gray-800">{pendingSent}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-800">{activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-800">--</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="received" className="space-y-6">
              <TabsList>
                <TabsTrigger value="received" className="flex items-center space-x-2">
                  <span>Received</span>
                  {pendingReceived > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pendingReceived}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center space-x-2">
                  <span>Sent</span>
                  {pendingSent > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pendingSent}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">Active Projects</TabsTrigger>
              </TabsList>

              <TabsContent value="received">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Collaboration Invitations</h2>
                  </div>
                  <CollaborationInvitations type="received" />
                </div>
              </TabsContent>

              <TabsContent value="sent">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Sent Invitations</h2>
                  </div>
                  <CollaborationInvitations type="sent" />
                </div>
              </TabsContent>

              <TabsContent value="active">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Active Collaborations</h2>
                  </div>
                  
                  {activeLoading ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading collaborations...</p>
                      </CardContent>
                    </Card>
                  ) : activeCollaborations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No active collaborations</h3>
                        <p className="text-gray-600 mb-6">
                          Start collaborating with other creators to bring your stories to life
                        </p>
                        <Button asChild>
                          <Link href="/app/search">
                            <Plus className="w-4 h-4 mr-2" />
                            Find Collaborators
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {activeCollaborations.map((collaboration) => (
                        <Card key={collaboration.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-3">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <Link 
                                      href={`/app/projects/${collaboration.project.id}`}
                                      className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                                    >
                                      {collaboration.project.title}
                                    </Link>
                                    <p className="text-sm text-gray-600">{collaboration.project.logline || collaboration.project.synopsis}</p>
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
                                    <Star className="w-4 h-4" />
                                    <span>{collaboration.royalty_split}% revenue</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="capitalize">
                                  {formatRole(collaboration.role)}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                  {collaboration.project.format}
                                </Badge>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/app/projects/${collaboration.project.id}`}>
                                    View Project
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collaboration Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collaboration Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/app/search">
                    <Plus className="w-4 h-4 mr-2" />
                    Find Collaborators
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/app/projects">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/app/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Collaboration Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Need Help?</h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Learn more about collaboration features and best practices.
                </p>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  View Guide
                </Button>
              </CardContent>
            </Card>
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
