'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Video,
  MessageCircle,
  Send,
  UserPlus,
  Crown,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  getPitchRoom,
  getRoomParticipants,
  getRoomPitches,
  joinPitchRoom,
  leavePitchRoom,
  startPitchRoomSession,
  endPitchRoomSession,
  getRoomTimingStatus,
  type PitchRoom,
  type PitchRoomParticipant,
  type PitchRoomPitch
} from '@/lib/pitch-rooms'
import { useToast } from '@/components/ui/toast'
import { createSupabaseClient } from '@/lib/auth'
import UserAvatar from '@/components/user-avatar'
import ConfirmDialog from '@/components/confirm-dialog'

export default function PitchRoomDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()
  const roomId = params.id as string

  const [room, setRoom] = useState<PitchRoom | null>(null)
  const [participants, setParticipants] = useState<PitchRoomParticipant[]>([])
  const [pitches, setPitches] = useState<PitchRoomPitch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'pitches' | 'chat'>('overview')
  const [isJoining, setIsJoining] = useState(false)
  const [isUpdatingSession, setIsUpdatingSession] = useState(false)
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false)

  useEffect(() => {
    loadRoomData()
    loadCurrentUser()
  }, [roomId])

  const loadCurrentUser = async () => {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadRoomData = async () => {
    setIsLoading(true)
    try {
      const [roomData, participantsData, pitchesData] = await Promise.all([
        getPitchRoom(roomId),
        getRoomParticipants(roomId),
        getRoomPitches(roomId)
      ])

      setRoom(roomData)
      setParticipants(participantsData)
      setPitches(pitchesData)
    } catch (error) {
      console.error('Error loading room data:', error)
      addToast({
        type: 'error',
        title: 'Error loading room',
        message: 'Failed to load room details'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    setIsJoining(true)
    try {
      await joinPitchRoom(roomId)
      addToast({
        type: 'success',
        title: 'Joined room!',
        message: 'You have successfully joined the pitch room'
      })
      await loadRoomData()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to join room',
        message: error.message || 'Please try again'
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveRoom = async () => {
    setIsJoining(true)
    try {
      await leavePitchRoom(roomId)
      addToast({
        type: 'success',
        title: 'Left room',
        message: 'You have left the pitch room'
      })
      await loadRoomData()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to leave room',
        message: error.message || 'Please try again'
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleStartSession = async () => {
    setIsUpdatingSession(true)
    try {
      await startPitchRoomSession(roomId)
      addToast({
        type: 'success',
        title: 'Session started!',
        message: 'Your pitch room is now live'
      })
      await loadRoomData()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to start session',
        message: error.message || 'Please try again'
      })
    } finally {
      setIsUpdatingSession(false)
    }
  }

  const handleEndSession = async () => {
    setShowEndSessionConfirm(true)
  }

  const confirmEndSession = async () => {
    setIsUpdatingSession(true)
    try {
      await endPitchRoomSession(roomId)
      addToast({
        type: 'success',
        title: 'Session ended',
        message: 'Your pitch room has been completed'
      })
      await loadRoomData()
      setShowEndSessionConfirm(false)
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to end session',
        message: error.message || 'Please try again'
      })
    } finally {
      setIsUpdatingSession(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSessionButton = () => {
    if (!isHost) return null
    
    const timingStatus = getRoomTimingStatus(room!)
    
    if (room!.status === 'live') {
      return (
        <button
          onClick={handleEndSession}
          disabled={isUpdatingSession}
          className="btn-secondary flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{isUpdatingSession ? 'Ending...' : 'End Session'}</span>
        </button>
      )
    }
    
    if (room!.status === 'upcoming') {
      const isPastTime = timingStatus === 'past-time' || timingStatus === 'starting-soon'
      return (
        <button
          onClick={handleStartSession}
          disabled={isUpdatingSession}
          className={`btn-primary flex items-center space-x-2 ${isPastTime ? 'animate-pulse' : ''}`}
        >
          <Video className="w-4 h-4" />
          <span>{isUpdatingSession ? 'Starting...' : 'Start Session'}</span>
        </button>
      )
    }
    
    return null
  }

  const isHost = currentUser && room && currentUser.id === room.host_id
  const isParticipant = room?.user_is_participant
  const isFull = room && (room.participant_count || 0) >= room.max_participants

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Room not found</h2>
          <p className="text-gray-600 mb-4">This pitch room doesn't exist or has been removed.</p>
          <button onClick={() => router.push('/app/pitch-rooms')} className="btn-primary">
            Back to Pitch Rooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirm End Session Dialog */}
      <ConfirmDialog
        isOpen={showEndSessionConfirm}
        onClose={() => setShowEndSessionConfirm(false)}
        onConfirm={confirmEndSession}
        title="End Pitch Session"
        message={`Are you sure you want to end this session?\n\nThis will mark the room as completed and participants will no longer be able to join or submit pitches.\n\nThis action cannot be undone.`}
        type="warning"
        isLoading={isUpdatingSession}
        confirmText="End Session"
        cancelText="Go Back"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/app/pitch-rooms')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{room.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{room.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isHost ? (
                <>
                  {getSessionButton()}
                  <span className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
                    <Crown className="w-4 h-4" />
                    <span>Host</span>
                  </span>
                </>
              ) : isParticipant ? (
                <button
                  onClick={handleLeaveRoom}
                  disabled={isJoining}
                  className="btn-secondary"
                >
                  {isJoining ? 'Leaving...' : 'Leave Room'}
                </button>
              ) : (
                <button
                  onClick={handleJoinRoom}
                  disabled={isFull || isJoining}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Joining...' : isFull ? 'Room Full' : 'Join Room'}
                </button>
              )}
            </div>
          </div>

          {/* Room Info Bar */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(room.scheduled_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{room.scheduled_time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{room.participant_count}/{room.max_participants} participants</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              room.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
              room.status === 'live' ? 'bg-green-100 text-green-700' :
              room.status === 'completed' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6 border-t border-gray-200 pt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                activeTab === 'participants'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Participants ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab('pitches')}
              className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                activeTab === 'pitches'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Pitches ({pitches.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
                activeTab === 'chat'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Room Description */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">About This Room</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{room.description || 'No description provided.'}</p>
                
                {room.tags && room.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {room.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Host Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Hosted By</h2>
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    user={{
                      first_name: room.host?.first_name,
                      last_name: room.host?.last_name,
                      display_name: room.host?.display_name,
                      avatar_url: room.host?.avatar_url
                    }}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{room.host?.display_name}</p>
                    <p className="text-sm text-gray-600">Room Host</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isParticipant && (
                    <button className="w-full btn-primary flex items-center justify-center space-x-2">
                      <UserPlus className="w-4 h-4" />
                      <span>Submit Your Pitch</span>
                    </button>
                  )}
                  <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>Join Video Call</span>
                  </button>
                </div>
              </div>

              {/* Room Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Room Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-gray-800 capitalize">{room.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants</span>
                    <span className="font-medium text-gray-800">{room.participant_count}/{room.max_participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pitches</span>
                    <span className="font-medium text-gray-800">{pitches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Type</span>
                    <span className="font-medium text-gray-800 capitalize">{room.room_type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Participants ({participants.length})
            </h2>
            
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No participants yet</p>
                <p className="text-sm text-gray-500 mt-2">Be the first to join this room!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <UserAvatar
                      user={{
                        display_name: participant.profile?.display_name,
                        avatar_url: participant.profile?.avatar_url
                      }}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{participant.profile?.display_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
                    </div>
                    {participant.role === 'host' && (
                      <Crown className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pitches Tab */}
        {activeTab === 'pitches' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Pitches ({pitches.length})
              </h2>
              {isParticipant && (
                <button className="btn-primary text-sm">
                  Submit Your Pitch
                </button>
              )}
            </div>
            
            {pitches.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No pitches submitted yet</p>
                {isParticipant && (
                  <p className="text-sm text-gray-500 mt-2">Be the first to submit your project!</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {pitches.map((pitch, index) => (
                  <div key={pitch.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <h3 className="font-semibold text-gray-800">{pitch.project?.title}</h3>
                          {pitch.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{pitch.project?.logline}</p>
                        <p className="text-xs text-gray-500">by {pitch.presenter?.display_name}</p>
                      </div>
                      {pitch.rating_average > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">{pitch.rating_average.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">{pitch.feedback_count} ratings</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Room Chat</h2>
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chat feature coming soon!</p>
              <p className="text-sm text-gray-500 mt-2">Connect with other participants before the session</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
