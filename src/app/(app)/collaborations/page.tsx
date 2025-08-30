"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, MessageSquare, Calendar, Star } from 'lucide-react'
import Link from 'next/link'

export default function CollaborationsPage() {
  // Mock data for collaborations
  const activeCollaborations = [
    {
      id: '1',
      project: 'The Last Chronicle',
      owner: 'Sarah Mitchell',
      role: 'Editor',
      status: 'In Progress',
      lastActivity: '2 hours ago',
      progress: 65
    },
    {
      id: '2',
      project: 'Urban Legends',
      owner: 'Alex Chen',
      role: 'Co-writer',
      status: 'Review',
      lastActivity: '1 day ago',
      progress: 80
    }
  ]

  const invitations = [
    {
      id: '1',
      project: 'Summer Dreams',
      owner: 'Mike Rodriguez',
      role: 'Producer',
      message: 'Would love to have you on board as a producer for this project!',
      sentAt: '3 days ago'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Collaborations</h1>
          <p className="text-gray-300 mt-2">Manage your collaborative projects and team connections.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800">
          <Link href="/app/search">
            <Plus className="w-4 h-4 mr-2" />
            Find Collaborators
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{activeCollaborations.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{invitations.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Projects Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Collaborations */}
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Active Collaborations</CardTitle>
            <CardDescription className="text-gray-300">
              Projects you're currently working on with others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCollaborations.map((collab) => (
              <div key={collab.id} className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{collab.project}</h3>
                    <p className="text-sm text-blue-300 mb-1">by {collab.owner}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
                      <span>Role: {collab.role}</span>
                      <span>•</span>
                      <span>{collab.lastActivity}</span>
                    </div>
                    <div className="w-full bg-navy-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${collab.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">{collab.progress}% complete</span>
                  </div>
                  <Badge variant="outline" className="border-blue-400 text-blue-300">
                    {collab.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Pending Invitations</CardTitle>
            <CardDescription className="text-gray-300">
              Collaboration requests waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{invitation.project}</h3>
                    <p className="text-sm text-yellow-300 mb-1">by {invitation.owner}</p>
                    <p className="text-sm text-gray-300 mb-2">Role: {invitation.role}</p>
                    <p className="text-xs text-gray-400 mb-3">{invitation.message}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        Decline
                      </Button>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{invitation.sentAt}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-300">
            Common collaboration tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/search">
                <Users className="w-6 h-6" />
                <span>Find Collaborators</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/projects">
                <MessageSquare className="w-6 h-6" />
                <span>Invite to Project</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-navy-600 text-gray-300 hover:bg-navy-700" asChild>
              <Link href="/app/settings">
                <Calendar className="w-6 h-6" />
                <span>Collaboration Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
