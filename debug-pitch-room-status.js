/**
 * Debug script to check pitch room status update logic
 * 
 * This will help identify why rooms aren't being auto-updated correctly.
 * 
 * Run this with: node debug-pitch-room-status.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugPitchRoomStatus() {
  console.log('\n=== DEBUGGING PITCH ROOM STATUS ===\n')

  // Get all pitch rooms
  const { data: rooms, error } = await supabase
    .from('pitch_rooms')
    .select('*')
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching rooms:', error)
    return
  }

  console.log(`Found ${rooms.length} pitch rooms\n`)

  const now = new Date()
  console.log(`Current time: ${now.toISOString()} (ISO)`)
  console.log(`Current time: ${now.toLocaleString()} (Local)\n`)

  // Check each room
  rooms.forEach((room, index) => {
    console.log(`\n--- Room ${index + 1}: ${room.title} ---`)
    console.log(`ID: ${room.id}`)
    console.log(`Status: ${room.status}`)
    console.log(`Scheduled Date: ${room.scheduled_date}`)
    console.log(`Scheduled Time: ${room.scheduled_time}`)
    
    // Parse scheduled datetime
    const scheduledDateTime = new Date(`${room.scheduled_date}T${room.scheduled_time}`)
    console.log(`Combined DateTime: ${scheduledDateTime.toISOString()} (ISO)`)
    console.log(`Combined DateTime: ${scheduledDateTime.toLocaleString()} (Local)`)
    
    // Calculate difference
    const diffMs = scheduledDateTime.getTime() - now.getTime()
    const diffMinutes = diffMs / (1000 * 60)
    const diffHours = diffMinutes / 60
    
    console.log(`Time difference: ${diffMinutes.toFixed(2)} minutes (${diffHours.toFixed(2)} hours)`)
    
    // Determine what status SHOULD be
    let expectedStatus = room.status
    if (room.status === 'upcoming' && diffMinutes < 0) {
      expectedStatus = 'live'
    }
    if (room.status === 'live') {
      // Check if updated_at is more than 3 hours ago
      const updatedAt = new Date(room.updated_at)
      const timeSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
      if (timeSinceUpdate > 3) {
        expectedStatus = 'completed'
      }
    }
    
    console.log(`Expected Status: ${expectedStatus}`)
    if (expectedStatus !== room.status) {
      console.log(`⚠️  STATUS MISMATCH! Should be "${expectedStatus}" but is "${room.status}"`)
    } else {
      console.log(`✓ Status is correct`)
    }
  })

  console.log('\n\n=== TESTING AUTO-UPDATE FUNCTION ===\n')
  
  // Call the auto-update function
  console.log('Calling update_pitch_room_status() function...')
  const { data: updateResult, error: updateError } = await supabase
    .rpc('update_pitch_room_status')

  if (updateError) {
    console.error('❌ Error calling update function:', updateError)
  } else {
    console.log('✓ Update function called successfully')
    console.log('Result:', updateResult)
  }

  // Fetch rooms again to see if anything changed
  console.log('\nFetching rooms again to check for changes...')
  const { data: roomsAfter, error: errorAfter } = await supabase
    .from('pitch_rooms')
    .select('*')
    .order('scheduled_date', { ascending: true })

  if (errorAfter) {
    console.error('Error fetching rooms after update:', errorAfter)
    return
  }

  console.log('\n=== CHANGES AFTER UPDATE ===\n')
  rooms.forEach((roomBefore, index) => {
    const roomAfter = roomsAfter.find(r => r.id === roomBefore.id)
    if (roomAfter && roomBefore.status !== roomAfter.status) {
      console.log(`${roomBefore.title}: ${roomBefore.status} → ${roomAfter.status} ✓`)
    }
  })

  const noChanges = rooms.every((roomBefore, index) => {
    const roomAfter = roomsAfter.find(r => r.id === roomBefore.id)
    return !roomAfter || roomBefore.status === roomAfter.status
  })

  if (noChanges) {
    console.log('No status changes detected')
  }

  console.log('\n=== DEBUG COMPLETE ===\n')
}

debugPitchRoomStatus().catch(console.error)
