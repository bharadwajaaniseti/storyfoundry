import { createSupabaseServer, requireSubscriptionTier } from '@/lib/auth-server'
import { handleApiError } from '@/lib/utils'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const pitchRoomSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  theme: z.string().max(500, 'Theme too long').optional(),
  starts_at: z.string().datetime('Invalid datetime format'),
  duration_minutes: z.number().int().min(15).max(240).default(60),
  is_pro_only: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    // Require writer pro subscription for creating pitch rooms
    const user = await requireSubscriptionTier('writer_pro')

    const body = await request.json()
    const pitchRoomData = pitchRoomSchema.parse(body)

    const supabase = await createSupabaseServer()

    // Check for scheduling conflicts (same user)
    const startTime = new Date(pitchRoomData.starts_at)
    const endTime = new Date(startTime.getTime() + pitchRoomData.duration_minutes * 60000)

    const { data: conflicts } = await supabase
      .from('pitch_rooms')
      .select('id, title, starts_at, duration_minutes')
      .eq('host_id', user.id)
      .gte('starts_at', new Date(startTime.getTime() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours before
      .lte('starts_at', new Date(endTime.getTime() + 2 * 60 * 60 * 1000).toISOString()) // 2 hours after

    if (conflicts && conflicts.length > 0) {
      return Response.json(
        { error: 'You have a scheduling conflict with another pitch room' },
        { status: 409 }
      )
    }

    // Create pitch room
    const { data: pitchRoom, error: roomError } = await supabase
      .from('pitch_rooms')
      .insert({
        ...pitchRoomData,
        host_id: user.id,
      })
      .select(`
        id,
        title,
        theme,
        starts_at,
        duration_minutes,
        is_pro_only,
        created_at,
        profiles:host_id (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (roomError) {
      throw new Error(`Failed to create pitch room: ${roomError.message}`)
    }

    return Response.json({
      success: true,
      data: pitchRoom
    })

  } catch (error) {
    return handleApiError(error)
  }
}
