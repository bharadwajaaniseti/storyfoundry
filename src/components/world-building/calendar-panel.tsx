'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit3, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/lib/auth'

interface WorldElement {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: Record<string, any>
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

interface CalendarPanelProps {
  projectId: string
}

export default function CalendarPanel({ projectId }: CalendarPanelProps) {
  const [events, setEvents] = useState<WorldElement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<WorldElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WorldElement | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchEvents()
  }, [projectId])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'calendar')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Sort by date if available
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.attributes?.date || a.created_at)
        const dateB = new Date(b.attributes?.date || b.created_at)
        return dateA.getTime() - dateB.getTime()
      })
      
      setEvents(sortedData)
    } catch (error) {
      console.error('Error fetching calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'calendar',
          name: eventData.name || 'New Event',
          description: eventData.description || '',
          attributes: {
            date: eventData.attributes?.date || '',
            time: eventData.attributes?.time || '',
            duration: eventData.attributes?.duration || '',
            location: eventData.attributes?.location || '',
            type: eventData.attributes?.type || 'event',
            recurring: eventData.attributes?.recurring || false,
            recurrence_pattern: eventData.attributes?.recurrence_pattern || '',
            attendees: eventData.attributes?.attendees || '',
            priority: eventData.attributes?.priority || 'medium'
          },
          tags: eventData.tags || []
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEvents(prev => [...prev, data].sort((a, b) => {
          const dateA = new Date(a.attributes?.date || a.created_at)
          const dateB = new Date(b.attributes?.date || b.created_at)
          return dateA.getTime() - dateB.getTime()
        }))
        setSelectedEvent(data)
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating calendar event:', error)
    }
  }

  const updateEvent = async (id: string, updates: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEvents(prev => prev.map(event => event.id === id ? data : event).sort((a, b) => {
          const dateA = new Date(a.attributes?.date || a.created_at)
          const dateB = new Date(b.attributes?.date || b.created_at)
          return dateA.getTime() - dateB.getTime()
        }))
        if (selectedEvent?.id === id) {
          setSelectedEvent(data)
        }
      }
    } catch (error) {
      console.error('Error updating calendar event:', error)
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEvents(prev => prev.filter(event => event.id !== id))
      if (selectedEvent?.id === id) {
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error)
    }
  }

  const getEventMonths = () => {
    const months = new Set(
      events
        .filter(event => event.attributes.date)
        .map(event => {
          const date = new Date(event.attributes.date)
          return date.toLocaleString('default', { month: 'long', year: 'numeric' })
        })
    )
    return Array.from(months).sort()
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesMonth = selectedMonth === 'all' || 
                        (event.attributes.date && 
                         new Date(event.attributes.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth)
    
    return matchesSearch && matchesMonth
  })

  const handleCreateNew = () => {
    setIsCreating(true)
    setEditingEvent({
      id: '',
      project_id: projectId,
      category: 'calendar',
      name: '',
      description: '',
      attributes: {
        date: '',
        time: '',
        duration: '',
        location: '',
        type: 'event',
        recurring: false,
        recurrence_pattern: '',
        attendees: '',
        priority: 'medium'
      },
      tags: [],
      created_at: '',
      updated_at: ''
    })
    setSelectedEvent(null)
  }

  const handleSave = () => {
    if (!editingEvent) return

    if (isCreating) {
      createEvent(editingEvent)
    } else {
      updateEvent(editingEvent.id, editingEvent)
    }
    setEditingEvent(null)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingEvent(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'event': 'bg-blue-100 text-blue-800',
      'meeting': 'bg-purple-100 text-purple-800',
      'deadline': 'bg-red-100 text-red-800',
      'milestone': 'bg-green-100 text-green-800',
      'holiday': 'bg-orange-100 text-orange-800',
      'reminder': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex">
      {/* Events List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
            <Button 
              size="sm"
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Months</option>
              {getEventMonths().map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="mb-2">No calendar events yet</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNew}
              >
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event)
                    setEditingEvent(null)
                    setIsCreating(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="font-medium truncate">{event.name}</div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(event.attributes.type)}`}>
                            {event.attributes.type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(event.attributes.priority)}`}>
                            {event.attributes.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {event.attributes.date ? formatDate(event.attributes.date) : 'No date set'}
                        {event.attributes.time && ` at ${event.attributes.time}`}
                      </div>
                      {event.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {event.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{event.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className="flex-1 flex flex-col">
        {editingEvent ? (
          // Edit/Create Form
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Create New Event' : 'Edit Event'}
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isCreating ? 'Create Event' : 'Save Changes'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <Input
                    value={editingEvent.name}
                    onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                    placeholder="Enter event title..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                    placeholder="Describe the event..."
                    className="w-full h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={editingEvent.attributes.date || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, date: e.target.value}
                      })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={editingEvent.attributes.time || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, time: e.target.value}
                      })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={editingEvent.attributes.type || 'event'}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, type: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="event">Event</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="milestone">Milestone</option>
                      <option value="holiday">Holiday</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={editingEvent.attributes.priority || 'medium'}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, priority: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <Input
                      value={editingEvent.attributes.duration || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, duration: e.target.value}
                      })}
                      placeholder="e.g., 2 hours"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={editingEvent.attributes.location || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, location: e.target.value}
                      })}
                      placeholder="Event location"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees/Participants
                  </label>
                  <Textarea
                    value={editingEvent.attributes.attendees || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent, 
                      attributes: {...editingEvent.attributes, attendees: e.target.value}
                    })}
                    placeholder="Who will be attending?"
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingEvent.attributes.recurring || false}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, recurring: e.target.checked}
                      })}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Recurring Event
                  </label>
                </div>

                {editingEvent.attributes.recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurrence Pattern
                    </label>
                    <Input
                      value={editingEvent.attributes.recurrence_pattern || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        attributes: {...editingEvent.attributes, recurrence_pattern: e.target.value}
                      })}
                      placeholder="e.g., Every Monday, Monthly on the 15th"
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <Input
                    value={editingEvent.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      setEditingEvent({...editingEvent, tags})
                    }}
                    placeholder="Enter tags separated by commas..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : selectedEvent ? (
          // Event Details View
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.name}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingEvent(selectedEvent)
                      setIsCreating(false)
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${selectedEvent.name}?`)) {
                        deleteEvent(selectedEvent.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm rounded-full ${getTypeColor(selectedEvent.attributes.type)}`}>
                    {selectedEvent.attributes.type}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(selectedEvent.attributes.priority)}`}>
                    {selectedEvent.attributes.priority} priority
                  </span>
                  {selectedEvent.attributes.recurring && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      Recurring
                    </span>
                  )}
                </div>

                {selectedEvent.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Date & Time</h3>
                    <p className="text-gray-700">
                      {selectedEvent.attributes.date ? formatDate(selectedEvent.attributes.date) : 'No date set'}
                      {selectedEvent.attributes.time && (
                        <span className="block text-sm text-gray-500">
                          at {selectedEvent.attributes.time}
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedEvent.attributes.duration && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Duration</h3>
                      <p className="text-gray-700">{selectedEvent.attributes.duration}</p>
                    </div>
                  )}

                  {selectedEvent.attributes.location && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                      <p className="text-gray-700">{selectedEvent.attributes.location}</p>
                    </div>
                  )}

                  {selectedEvent.attributes.recurring && selectedEvent.attributes.recurrence_pattern && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Recurrence</h3>
                      <p className="text-gray-700">{selectedEvent.attributes.recurrence_pattern}</p>
                    </div>
                  )}
                </div>

                {selectedEvent.attributes.attendees && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Attendees/Participants</h3>
                    <p className="text-gray-700">{selectedEvent.attributes.attendees}</p>
                  </div>
                )}

                {selectedEvent.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No event selected</h3>
              <p className="text-sm mb-4">Select an event from the calendar to view details</p>
              <Button 
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create New Event
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
