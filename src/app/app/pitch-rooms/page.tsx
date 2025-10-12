'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar,
  Users,
  Clock,
  Plus,
  Video,
  MessageSquare,
  Star,
  Eye,
  LogIn,
  LogOut as LeaveIcon,
  MoreVertical,
  Trash2,
  XCircle,
  ExternalLink,
  Edit
} from 'lucide-react'
import { 
  getUpcomingPitchRooms,
  getMyHostedRooms,
  getPitchRoomStats,
  joinPitchRoom,
  leavePitchRoom,
  getRoomTimingStatus,
  isRoomTimePassed,
  updatePitchRoomStatusAuto,
  cancelPitchRoom,
  deletePitchRoom,
  type PitchRoom
} from '@/lib/pitch-rooms'
import { useToast } from '@/components/ui/toast'
import HostPitchRoomModal from '@/components/host-pitch-room-modal'
import ConfirmDialog from '@/components/confirm-dialog'

export default function PitchRoomsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [upcomingRooms, setUpcomingRooms] = useState<PitchRoom[]>([])
  const [hostedRooms, setHostedRooms] = useState<PitchRoom[]>([])
  const [stats, setStats] = useState({
    activeRooms: 0,
    totalParticipants: 0,
    projectsPitched: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [showHostModal, setShowHostModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<PitchRoom | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'danger' | 'warning'
    onConfirm: () => void
    isLoading: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    isLoading: false
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        setOpenDropdownId(null)
      }
    }
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  useEffect(() => {
    loadData()
    
    // Auto-update room status on page load
    updatePitchRoomStatusAuto().then(() => {
      // Auto-update successful
    }).catch(() => {
      // Silently ignore if auto-update function not installed yet
    })
    
    // Auto-update status every 1 minute
    const updateInterval = setInterval(() => {
      updatePitchRoomStatusAuto().then(() => {
        loadData() // Reload data after auto-update
      }).catch(() => {})
    }, 60000) // 1 minute
    
    // Refresh data every 30 seconds to catch status changes
    const refreshInterval = setInterval(() => {
      loadData()
    }, 30000) // 30 seconds
    
    return () => {
      clearInterval(updateInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [upcoming, hosted, statistics] = await Promise.all([
        getUpcomingPitchRooms(),
        getMyHostedRooms(),
        getPitchRoomStats()
      ])
      
      // Filter out hosted rooms from upcoming rooms to avoid duplication
      const hostedIds = new Set(hosted.map(room => room.id))
      const filteredUpcoming = upcoming.filter(room => {
        // Exclude hosted rooms
        if (hostedIds.has(room.id)) return false
        
        // For non-hosts: hide rooms where time has passed (unless they're already participants)
        if (isRoomTimePassed(room) && !room.user_is_participant) {
          return false
        }
        
        return true
      })
      
      setUpcomingRooms(filteredUpcoming)
      setHostedRooms(hosted)
      setStats(statistics)
    } catch (error) {
      console.error('Error loading pitch rooms:', error)
      addToast({
        type: 'error',
        title: 'Error loading pitch rooms',
        message: 'Please try again later'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    setJoiningRoomId(roomId)
    try {
      await joinPitchRoom(roomId)
      addToast({
        type: 'success',
        title: 'Joined room!',
        message: 'You have successfully joined the pitch room'
      })
      await loadData() // Reload to update participant counts
    } catch (error: any) {
      console.error('Error joining room:', error)
      addToast({
        type: 'error',
        title: 'Failed to join room',
        message: error.message || 'Please try again'
      })
    } finally {
      setJoiningRoomId(null)
    }
  }

  const handleLeaveRoom = async (roomId: string) => {
    setJoiningRoomId(roomId)
    try {
      await leavePitchRoom(roomId)
      addToast({
        type: 'success',
        title: 'Left room',
        message: 'You have left the pitch room'
      })
      await loadData()
    } catch (error: any) {
      console.error('Error leaving room:', error)
      addToast({
        type: 'error',
        title: 'Failed to leave room',
        message: error.message || 'Please try again'
      })
    } finally {
      setJoiningRoomId(null)
    }
  }

  const handleCancelRoom = async (roomId: string, roomTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Pitch Room',
      message: `Are you sure you want to cancel "${roomTitle}"?\n\nThis will mark the room as cancelled. Participants will be notified.`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }))
        
        try {
          await cancelPitchRoom(roomId)
          addToast({
            type: 'success',
            title: 'Room cancelled',
            message: 'The pitch room has been cancelled'
          })
          await loadData()
          setConfirmDialog({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => {}, isLoading: false })
        } catch (error: any) {
          addToast({
            type: 'error',
            title: 'Failed to cancel room',
            message: error.message || 'Please try again'
          })
          setConfirmDialog(prev => ({ ...prev, isLoading: false }))
        } finally {
          setOpenDropdownId(null)
        }
      },
      isLoading: false
    })
  }

  const handleDeleteRoom = async (roomId: string, roomTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pitch Room',
      message: `Are you sure you want to permanently delete "${roomTitle}"?\n\nThis action cannot be undone. All data including participants, pitches, and ratings will be permanently removed.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }))
        
        try {
          await deletePitchRoom(roomId)
          addToast({
            type: 'success',
            title: 'Room deleted',
            message: 'The pitch room has been permanently deleted'
          })
          await loadData()
          setConfirmDialog({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {}, isLoading: false })
        } catch (error: any) {
          addToast({
            type: 'error',
            title: 'Failed to delete room',
            message: error.message || 'Please try again'
          })
          setConfirmDialog(prev => ({ ...prev, isLoading: false }))
        } finally {
          setOpenDropdownId(null)
        }
      },
      isLoading: false
    })
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimingBadge = (room: PitchRoom) => {
    const status = getRoomTimingStatus(room)
    
    switch (status) {
      case 'live':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-pulse">🔴 Live Now</span>
      case 'starting-soon':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">⏰ Starting Soon</span>
      case 'past-time':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⏱️ Past Scheduled Time</span>
      case 'ended':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">✓ Ended</span>
      default:
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">📅 Upcoming</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Host Pitch Room Modal */}
      <HostPitchRoomModal 
        isOpen={showHostModal}
        onClose={() => {
          setShowHostModal(false)
          setEditingRoom(null)
        }}
        onSuccess={() => {
          loadData()
          setEditingRoom(null)
        }}
        editingRoom={editingRoom}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        isLoading={confirmDialog.isLoading}
        confirmText={confirmDialog.type === 'danger' ? 'Delete' : 'Cancel Room'}
        cancelText="Go Back"
      />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Pitch Rooms</h1>
              <p className="text-gray-600">Present your projects to industry professionals and fellow creators</p>
            </div>
            
            <button 
              onClick={() => setShowHostModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
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
              
              {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading pitch rooms...</p>
                </div>
              ) : upcomingRooms.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No upcoming pitch rooms</h3>
                  <p className="text-gray-600 mb-6">Be the first to create a pitch room!</p>
                  <button 
                    onClick={() => setShowHostModal(true)}
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Host a Pitch Room</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingRooms.map((room) => {
                    const participantCount = room.participant_count || 0
                    const isFull = participantCount >= room.max_participants
                    const isUserInRoom = room.user_is_participant
                    
                    return (
                      <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">{room.title}</h3>
                              {getTimingBadge(room)}
                            </div>
                            <p className="text-gray-600 mb-4">{room.description}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(room.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{room.scheduled_time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{participantCount}/{room.max_participants} participants</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            {isUserInRoom ? (
                              <button 
                                onClick={() => handleLeaveRoom(room.id)}
                                disabled={joiningRoomId === room.id}
                                className="btn-secondary text-sm flex items-center space-x-2"
                              >
                                <LeaveIcon className="w-4 h-4" />
                                <span>{joiningRoomId === room.id ? 'Leaving...' : 'Leave Room'}</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleJoinRoom(room.id)}
                                disabled={isFull || joiningRoomId === room.id}
                                className="btn-primary text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <LogIn className="w-4 h-4" />
                                <span>{joiningRoomId === room.id ? 'Joining...' : 'Join Room'}</span>
                              </button>
                            )}
                            <span className="text-xs text-gray-500">
                              Hosted by {room.host?.display_name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isFull
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {isFull ? 'Full' : 'Open'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {room.max_participants - participantCount} spots remaining
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {room.tags && room.tags.length > 0 && (
                              <div className="flex items-center space-x-2">
                                {room.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* My Hosted Rooms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">My Hosted Rooms</h2>
              
              {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your rooms...</p>
                </div>
              ) : hostedRooms.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No hosted rooms yet</h3>
                  <p className="text-gray-600 mb-6">Create your first pitch room to start connecting with other creators</p>
                  <button 
                    onClick={() => setShowHostModal(true)}
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Host Your First Pitch Room</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostedRooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{room.title}</h3>
                            {getTimingBadge(room)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(room.scheduled_date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{room.scheduled_time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{room.participant_count || 0}/{room.max_participants} participants</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Dropdown Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === room.id ? null : room.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {openDropdownId === room.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  router.push(`/app/pitch-rooms/${room.id}`)
                                  setOpenDropdownId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>{room.status === 'live' ? 'Manage Live Session' : 'View Details'}</span>
                              </button>
                              
                              {room.status === 'upcoming' && (
                                <button
                                  onClick={() => {
                                    setEditingRoom(room)
                                    setShowHostModal(true)
                                    setOpenDropdownId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Edit Room</span>
                                </button>
                              )}
                              
                              {room.status !== 'completed' && room.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelRoom(room.id, room.title)}
                                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Cancel Room</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteRoom(room.id, room.title)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Room</span>
                              </button>
                            </div>
                          )}
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
                  <span className="font-semibold text-gray-800">{stats.activeRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-semibold text-gray-800">{stats.totalParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects Pitched</span>
                  <span className="font-semibold text-gray-800">{stats.projectsPitched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{stats.successRate}%</span>
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
