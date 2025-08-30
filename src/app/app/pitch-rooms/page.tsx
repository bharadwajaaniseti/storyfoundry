'use client'

import Link from 'next/link'
import { 
  Calendar,
  Users,
  Clock,
  Plus,
  Video,
  MessageSquare,
  Star,
  Eye
} from 'lucide-react'

const UPCOMING_PITCH_ROOMS = [
  {
    id: '1',
    title: 'Sci-Fi & Fantasy Showcase',
    description: 'Present your science fiction and fantasy projects to industry professionals',
    date: '2024-01-15',
    time: '2:00 PM PST',
    participants: 12,
    maxParticipants: 15,
    host: 'Sarah Chen',
    rating: 4.8
  },
  {
    id: '2',
    title: 'Independent Film Pitch Session',
    description: 'Perfect for indie filmmakers looking for funding and collaboration',
    date: '2024-01-18',
    time: '6:00 PM EST',
    participants: 8,
    maxParticipants: 10,
    host: 'Michael Rodriguez',
    rating: 4.9
  },
  {
    id: '3',
    title: 'Comedy Writers Meetup',
    description: 'Share your comedic scripts and get feedback from fellow writers',
    date: '2024-01-22',
    time: '7:00 PM PST',
    participants: 6,
    maxParticipants: 12,
    host: 'Emma Thompson',
    rating: 4.7
  }
]

export default function PitchRoomsPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Pitch Rooms</h1>
              <p className="text-gray-600">Present your projects to industry professionals and fellow creators</p>
            </div>
            
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Host a Pitch Room</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Pitch Rooms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Upcoming Pitch Rooms</h2>
              
              <div className="space-y-6">
                {UPCOMING_PITCH_ROOMS.map((room) => (
                  <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{room.title}</h3>
                        <p className="text-gray-600 mb-4">{room.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(room.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{room.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{room.participants}/{room.maxParticipants} participants</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{room.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <button className="btn-primary text-sm">
                          Join Room
                        </button>
                        <span className="text-xs text-gray-500">Hosted by {room.host}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          room.participants >= room.maxParticipants 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {room.participants >= room.maxParticipants ? 'Full' : 'Open'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {room.maxParticipants - room.participants} spots remaining
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Video className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Hosted Rooms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">My Hosted Rooms</h2>
              
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No hosted rooms yet</h3>
                <p className="text-gray-600 mb-6">Create your first pitch room to start connecting with other creators</p>
                <button className="btn-primary inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Host Your First Pitch Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">How Pitch Rooms Work</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Join a Room</h4>
                    <p className="text-sm text-gray-600">Browse and join pitch rooms that match your interests</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Present Your Project</h4>
                    <p className="text-sm text-gray-600">Share your story with industry professionals and peers</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Get Feedback</h4>
                    <p className="text-sm text-gray-600">Receive valuable insights and connect with collaborators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Rooms</span>
                  <span className="font-semibold text-gray-800">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-semibold text-gray-800">247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects Pitched</span>
                  <span className="font-semibold text-gray-800">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">73%</span>
                </div>
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-sm text-white/90 mb-4">
                AI-powered pitch coaching, recorded sessions, and direct investor connections.
              </p>
              <button className="text-sm bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
