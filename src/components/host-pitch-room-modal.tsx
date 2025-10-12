'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Users, Plus } from 'lucide-react'
import { createPitchRoom, updatePitchRoom, type PitchRoom } from '@/lib/pitch-rooms'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

interface HostPitchRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRoom?: PitchRoom | null
}

export default function HostPitchRoomModal({ isOpen, onClose, onSuccess, editingRoom }: HostPitchRoomModalProps) {
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    max_participants: 15,
    room_type: 'public' as 'public' | 'private' | 'invite_only',
    tags: ''
  })

  // Load editing room data when modal opens
  useEffect(() => {
    if (editingRoom) {
      console.log('Editing room data:', {
        scheduled_date: editingRoom.scheduled_date,
        scheduled_time: editingRoom.scheduled_time,
        scheduled_time_type: typeof editingRoom.scheduled_time
      })
      
      // Format the time properly for the time input
      // Time input expects HH:MM format (24-hour)
      let formattedTime = ''
      
      if (editingRoom.scheduled_time) {
        const timeStr = String(editingRoom.scheduled_time)
        
        // If it's already in HH:MM or HH:MM:SS format, extract HH:MM
        if (timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
          const timeParts = timeStr.split(':')
          formattedTime = `${timeParts[0]}:${timeParts[1]}`
        }
        // If it has timezone or other info, try to parse it
        else if (timeStr.includes(':')) {
          const timeParts = timeStr.split(':')
          if (timeParts.length >= 2) {
            const hours = timeParts[0].padStart(2, '0')
            const minutes = timeParts[1].substring(0, 2).padStart(2, '0')
            formattedTime = `${hours}:${minutes}`
          }
        }
      }
      
      console.log('Formatted time for input:', formattedTime)
      
      setFormData({
        title: editingRoom.title,
        description: editingRoom.description || '',
        scheduled_date: editingRoom.scheduled_date.split('T')[0], // Extract date from ISO string
        scheduled_time: formattedTime,
        max_participants: editingRoom.max_participants,
        room_type: editingRoom.room_type,
        tags: editingRoom.tags?.join(', ') || ''
      })
    } else {
      // Reset form when creating new room
      setFormData({
        title: '',
        description: '',
        scheduled_date: '',
        scheduled_time: '',
        max_participants: 15,
        room_type: 'public',
        tags: ''
      })
    }
  }, [editingRoom, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.scheduled_date) {
        throw new Error('Date is required')
      }
      if (!formData.scheduled_time) {
        throw new Error('Time is required')
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const roomPayload = {
        title: formData.title,
        description: formData.description,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        max_participants: formData.max_participants,
        room_type: formData.room_type,
        tags
      }

      if (editingRoom) {
        // Update existing room
        await updatePitchRoom(editingRoom.id, roomPayload)
        addToast({
          type: 'success',
          title: 'Room updated!',
          message: 'Your pitch room has been updated successfully'
        })
      } else {
        // Create new room
        await createPitchRoom(roomPayload)
        addToast({
          type: 'success',
          title: 'Pitch room created!',
          message: 'Your pitch room has been created successfully'
        })
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduled_date: '',
        scheduled_time: '',
        max_participants: 15,
        room_type: 'public',
        tags: ''
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error saving pitch room:', error)
      addToast({
        type: 'error',
        title: editingRoom ? 'Failed to update room' : 'Failed to create room',
        message: error.message || 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingRoom ? 'Edit Pitch Room' : 'Host a Pitch Room'}
            </h2>
            <p className="text-sm text-gray-600">
              {editingRoom ? 'Update your pitch session details' : 'Create a new pitch session for writers'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Sci-Fi & Fantasy Showcase"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what kind of projects you're looking for and what participants can expect..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select the time in your local timezone
              </p>
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Max Participants
            </label>
            <input
              type="number"
              value={formData.max_participants}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value) && value >= 2) {
                  setFormData({ ...formData, max_participants: value })
                }
              }}
              min={2}
              max={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 10-20 participants for best interaction
            </p>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="room_type"
                  value="public"
                  checked={formData.room_type === 'public'}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value as any })}
                  className="text-orange-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Public</div>
                  <div className="text-xs text-gray-500">Anyone can join and view</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="room_type"
                  value="private"
                  checked={formData.room_type === 'private'}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value as any })}
                  className="text-orange-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Private</div>
                  <div className="text-xs text-gray-500">Hidden from public listings</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="room_type"
                  value="invite_only"
                  checked={formData.room_type === 'invite_only'}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value as any })}
                  className="text-orange-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Invite Only</div>
                  <div className="text-xs text-gray-500">Only invited users can join</div>
                </div>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., sci-fi, fantasy, thriller"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Help participants find your room by adding relevant tags
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (editingRoom ? 'Updating...' : 'Creating...') 
                  : (editingRoom ? 'Update Room' : 'Create Pitch Room')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
