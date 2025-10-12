import { createSupabaseClient } from './auth'

export interface PitchRoom {
  id: string
  title: string
  description: string | null
  host_id: string
  scheduled_date: string
  scheduled_time: string
  max_participants: number
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  room_type: 'public' | 'private' | 'invite_only'
  tags: string[]
  created_at: string
  updated_at: string
  host?: {
    id: string
    display_name: string
    avatar_url?: string
    first_name?: string
    last_name?: string
  }
  participant_count?: number
  user_is_participant?: boolean
}

export interface PitchRoomParticipant {
  id: string
  room_id: string
  user_id: string
  role: 'host' | 'participant' | 'presenter' | 'observer'
  joined_at: string
  status: 'joined' | 'left' | 'removed'
  profile?: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

export interface PitchRoomPitch {
  id: string
  room_id: string
  project_id: string
  presenter_id: string
  pitch_order: number | null
  status: 'pending' | 'presenting' | 'completed'
  feedback_count: number
  rating_average: number
  presented_at: string | null
  created_at: string
  project?: {
    id: string
    title: string
    logline: string
  }
  presenter?: {
    id: string
    display_name: string
  }
}

/**
 * Get a single pitch room by ID
 */
export async function getPitchRoom(roomId: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('pitch_rooms')
    .select(`
      *,
      host:profiles!pitch_rooms_host_id_fkey(id, display_name, avatar_url, first_name, last_name)
    `)
    .eq('id', roomId)
    .single()

  if (error) {
    console.error('Error fetching pitch room:', error)
    return null
  }

  // Get participant count
  const count = await getRoomParticipantCount(roomId)
  const isParticipant = await isUserParticipant(roomId)

  return {
    ...data,
    participant_count: count,
    user_is_participant: isParticipant
  } as PitchRoom
}

/**
 * Fetch all upcoming pitch rooms
 */
export async function getUpcomingPitchRooms() {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('pitch_rooms')
    .select(`
      *,
      host:profiles!pitch_rooms_host_id_fkey(id, display_name, avatar_url, first_name, last_name)
    `)
    .eq('status', 'upcoming')
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching pitch rooms:', error)
    return []
  }

  // Get participant counts for each room
  const roomsWithCounts = await Promise.all(
    (data || []).map(async (room) => {
      const count = await getRoomParticipantCount(room.id)
      const isParticipant = await isUserParticipant(room.id)
      return {
        ...room,
        participant_count: count,
        user_is_participant: isParticipant
      }
    })
  )

  return roomsWithCounts as PitchRoom[]
}

/**
 * Fetch pitch rooms hosted by the current user
 */
export async function getMyHostedRooms() {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('pitch_rooms')
    .select(`
      *,
      host:profiles!pitch_rooms_host_id_fkey(id, display_name, avatar_url, first_name, last_name)
    `)
    .eq('host_id', user.id)
    .in('status', ['upcoming', 'live']) // Only show active rooms in "My Hosted Rooms"
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching hosted rooms:', error)
    return []
  }

  // Get participant counts
  const roomsWithCounts = await Promise.all(
    (data || []).map(async (room) => {
      const count = await getRoomParticipantCount(room.id)
      return {
        ...room,
        participant_count: count,
        user_is_participant: true
      }
    })
  )

  return roomsWithCounts as PitchRoom[]
}

/**
 * Fetch completed and cancelled pitch rooms
 */
export async function getPastPitchRooms() {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('pitch_rooms')
    .select(`
      *,
      host:profiles!pitch_rooms_host_id_fkey(id, display_name, avatar_url, first_name, last_name)
    `)
    .in('status', ['completed', 'cancelled'])
    .order('scheduled_date', { ascending: false })
    .limit(20) // Show last 20 past rooms

  if (error) {
    console.error('Error fetching past rooms:', error)
    return []
  }

  // Get participant counts for each room
  const roomsWithCounts = await Promise.all(
    (data || []).map(async (room) => {
      const count = await getRoomParticipantCount(room.id)
      const isParticipant = await isUserParticipant(room.id)
      return {
        ...room,
        participant_count: count,
        user_is_participant: isParticipant
      }
    })
  )

  return roomsWithCounts as PitchRoom[]
}

/**
 * Get participant count for a room
 */
export async function getRoomParticipantCount(roomId: string): Promise<number> {
  const supabase = createSupabaseClient()
  
  // Use the public function to get participant count
  // This bypasses RLS and is more efficient
  const { data, error } = await supabase.rpc('get_public_room_participant_count', {
    room_id: roomId
  })

  if (error) {
    console.error('Error getting participant count:', error)
    return 0
  }

  return data || 0
}

/**
 * Check if current user is a participant in a room
 */
export async function isUserParticipant(roomId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data, error } = await supabase
    .from('pitch_room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .eq('status', 'joined')
    .single()

  return !!data
}

/**
 * Create a new pitch room
 */
export async function createPitchRoom(roomData: {
  title: string
  description: string
  scheduled_date: string
  scheduled_time: string
  max_participants: number
  room_type?: 'public' | 'private' | 'invite_only'
  tags?: string[]
}) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  const { data, error } = await supabase
    .from('pitch_rooms')
    .insert([
      {
        ...roomData,
        host_id: user.id,
        status: 'upcoming'
      }
    ])
    .select()
    .single()

  if (error) throw error

  // Automatically add host as participant
  await joinPitchRoom(data.id, 'host')

  return data as PitchRoom
}

/**
 * Update an existing pitch room
 */
export async function updatePitchRoom(roomId: string, roomData: {
  title?: string
  description?: string
  scheduled_date?: string
  scheduled_time?: string
  max_participants?: number
  room_type?: 'public' | 'private' | 'invite_only'
  tags?: string[]
}) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Verify user is the host
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    throw new Error('Only the host can update this room')
  }

  const { data, error } = await supabase
    .from('pitch_rooms')
    .update(roomData)
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error

  return data as PitchRoom
}

/**
 * Join a pitch room
 */
export async function joinPitchRoom(roomId: string, role: 'host' | 'participant' | 'presenter' | 'observer' = 'participant') {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Check if room is full
  const participantCount = await getRoomParticipantCount(roomId)
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('max_participants')
    .eq('id', roomId)
    .single()

  if (room && participantCount >= room.max_participants && role !== 'host') {
    throw new Error('Room is full')
  }

  const { data, error } = await supabase
    .from('pitch_room_participants')
    .insert([
      {
        room_id: roomId,
        user_id: user.id,
        role,
        status: 'joined'
      }
    ])
    .select()
    .single()

  if (error) {
    // If already joined, update status
    if (error.code === '23505') {
      const { data: updated, error: updateError } = await supabase
        .from('pitch_room_participants')
        .update({ status: 'joined', role })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return updated
    }
    throw error
  }

  return data
}

/**
 * Leave a pitch room
 */
export async function leavePitchRoom(roomId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  const { error } = await supabase
    .from('pitch_room_participants')
    .update({ status: 'left' })
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Get participants for a room
 */
export async function getRoomParticipants(roomId: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('pitch_room_participants')
    .select(`
      *,
      profile:profiles(id, display_name, avatar_url, first_name, last_name)
    `)
    .eq('room_id', roomId)
    .eq('status', 'joined')
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('Error fetching participants:', error)
    return []
  }

  return data as PitchRoomParticipant[]
}

/**
 * Submit a pitch to a room
 */
export async function submitPitch(roomId: string, projectId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Check if user is a participant
  const isParticipant = await isUserParticipant(roomId)
  if (!isParticipant) {
    throw new Error('You must join the room first')
  }

  const { data, error } = await supabase
    .from('pitch_room_pitches')
    .insert([
      {
        room_id: roomId,
        project_id: projectId,
        presenter_id: user.id,
        status: 'pending'
      }
    ])
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Get pitches for a room
 */
export async function getRoomPitches(roomId: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('pitch_room_pitches')
    .select(`
      *,
      project:projects(id, title, logline),
      presenter:profiles(id, display_name)
    `)
    .eq('room_id', roomId)
    .order('pitch_order', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching pitches:', error)
    return []
  }

  return data as PitchRoomPitch[]
}

/**
 * Get statistics for pitch rooms
 */
export async function getPitchRoomStats() {
  const supabase = createSupabaseClient()
  
  // Get count of active rooms this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const { count: activeRooms } = await supabase
    .from('pitch_rooms')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', oneWeekAgo.toISOString())
    .in('status', ['upcoming', 'live'])

  // Get total participants this week
  const { count: totalParticipants } = await supabase
    .from('pitch_room_participants')
    .select('*', { count: 'exact', head: true })
    .gte('joined_at', oneWeekAgo.toISOString())
    .eq('status', 'joined')

  // Get pitches this week
  const { count: projectsPitched } = await supabase
    .from('pitch_room_pitches')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString())

  // Calculate success rate (rooms with average rating > 3.5)
  const { data: completedPitches } = await supabase
    .from('pitch_room_pitches')
    .select('rating_average')
    .eq('status', 'completed')
    .gte('created_at', oneWeekAgo.toISOString())

  const successfulPitches = completedPitches?.filter(p => p.rating_average >= 3.5).length || 0
  const totalCompletedPitches = completedPitches?.length || 0
  const successRate = totalCompletedPitches > 0 
    ? Math.round((successfulPitches / totalCompletedPitches) * 100)
    : 0

  return {
    activeRooms: activeRooms || 0,
    totalParticipants: totalParticipants || 0,
    projectsPitched: projectsPitched || 0,
    successRate
  }
}

/**
 * Check if a room's scheduled time has passed
 */
export function isRoomTimePassed(room: PitchRoom): boolean {
  const scheduledDateTime = new Date(`${room.scheduled_date}T${room.scheduled_time}`)
  return scheduledDateTime < new Date()
}

/**
 * Get room timing status
 */
export function getRoomTimingStatus(room: PitchRoom): 'upcoming' | 'starting-soon' | 'past-time' | 'live' | 'ended' {
  if (room.status === 'live') return 'live'
  if (room.status === 'completed' || room.status === 'cancelled') return 'ended'
  
  const scheduledDateTime = new Date(`${room.scheduled_date}T${room.scheduled_time}`)
  const now = new Date()
  const diffMinutes = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60)
  
  if (diffMinutes < -30) return 'past-time' // More than 30 mins past
  if (diffMinutes < 0) return 'starting-soon' // Past time but within 30 mins
  if (diffMinutes < 30) return 'starting-soon' // Within 30 mins
  return 'upcoming'
}

/**
 * Start a pitch room session (change status to live)
 */
export async function startPitchRoomSession(roomId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Verify user is the host
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    throw new Error('Only the host can start the session')
  }

  const { data, error } = await supabase
    .from('pitch_rooms')
    .update({ status: 'live', updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * End a pitch room session (change status to completed)
 */
export async function endPitchRoomSession(roomId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Verify user is the host
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    throw new Error('Only the host can end the session')
  }

  const { data, error } = await supabase
    .from('pitch_rooms')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel a pitch room (change status to cancelled)
 */
export async function cancelPitchRoom(roomId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Verify user is the host
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('host_id, status')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    throw new Error('Only the host can cancel the room')
  }

  if (room.status === 'completed') {
    throw new Error('Cannot cancel a completed session')
  }

  const { data, error } = await supabase
    .from('pitch_rooms')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a pitch room permanently
 */
export async function deletePitchRoom(roomId: string) {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User must be authenticated')

  // Verify user is the host
  const { data: room } = await supabase
    .from('pitch_rooms')
    .select('host_id')
    .eq('id', roomId)
    .single()

  if (!room || room.host_id !== user.id) {
    throw new Error('Only the host can delete the room')
  }

  const { error } = await supabase
    .from('pitch_rooms')
    .delete()
    .eq('id', roomId)

  if (error) throw error
  return true
}

/**
 * Update pitch room status automatically based on time
 */
export async function updatePitchRoomStatusAuto() {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase.rpc('update_pitch_room_status')
  
  if (error) {
    // If function doesn't exist yet, silently fail (it's optional)
    // User needs to run update-pitch-room-status.sql first
    console.warn('Auto-update function not available. Run update-pitch-room-status.sql to enable.')
    return false
  }
  
  return true
}
