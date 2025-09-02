'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  Users,
  MapPin,
  Crown
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface TimelineEvent {
  id: string
  project_id: string
  title: string
  description: string
  date: string
  event_type: 'story' | 'historical' | 'personal' | 'world'
  importance: 'low' | 'medium' | 'high' | 'critical'
  participants: string[]
  location: string
  consequences: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface TimelineManagerProps {
  projectId: string
}

const EVENT_TYPES = [
  { key: 'story', label: 'Story Event', icon: BookOpen, color: 'blue' },
  { key: 'historical', label: 'Historical', icon: Clock, color: 'purple' },
  { key: 'personal', label: 'Personal', icon: Users, color: 'green' },
  { key: 'world', label: 'World Event', icon: MapPin, color: 'orange' }
]

const IMPORTANCE_LEVELS = [
  { key: 'low', label: 'Low', color: 'gray' },
  { key: 'medium', label: 'Medium', color: 'yellow' },
  { key: 'high', label: 'High', color: 'orange' },
  { key: 'critical', label: 'Critical', color: 'red' }
]

export default function TimelineManager({ projectId }: TimelineManagerProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterImportance, setFilterImportance] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'timeline' | 'chronological'>('timeline')

  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    title: '',
    description: '',
    date: '',
    event_type: 'story',
    importance: 'medium',
    participants: [],
    location: '',
    consequences: '',
    tags: []
  })

  useEffect(() => {
    loadEvents()
  }, [projectId])

  const loadEvents = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading timeline events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createEvent = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('timeline_events')
        .insert({
          ...newEvent,
          project_id: projectId
        })
        .select()
        .single()

      if (error) throw error
      
      setEvents([...events, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      setNewEvent({
        title: '',
        description: '',
        date: '',
        event_type: 'story',
        importance: 'medium',
        participants: [],
        location: '',
        consequences: '',
        tags: []
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating timeline event:', error)
    }
  }

  const updateEvent = async (eventId: string, updates: Partial<TimelineEvent>) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('timeline_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      
      setEvents(events.map(event => 
        event.id === eventId ? data : event
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(data)
      }
    } catch (error) {
      console.error('Error updating timeline event:', error)
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      
      setEvents(events.filter(event => event.id !== eventId))
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error deleting timeline event:', error)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'all' || event.event_type === filterType
    const matchesImportance = filterImportance === 'all' || event.importance === filterImportance
    
    return matchesSearch && matchesType && matchesImportance
  })

  const getEventTypeIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.key === type)
    return eventType?.icon || BookOpen
  }

  const getEventTypeColor = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.key === type)
    return eventType?.color || 'gray'
  }

  const getImportanceColor = (importance: string) => {
    const level = IMPORTANCE_LEVELS.find(l => l.key === importance)
    return level?.color || 'gray'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No date'
    
    // Handle different date formats
    if (dateStr.includes('/') || dateStr.includes('-')) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
    }
    
    // Return as-is for custom formats (e.g., "Year 2157", "Third Age", etc.)
    return dateStr
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-800">Project Timeline</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            {EVENT_TYPES.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
          
          <select
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Importance</option>
            {IMPORTANCE_LEVELS.map(level => (
              <option key={level.key} value={level.key}>{level.label}</option>
            ))}
          </select>
          
          <div className="flex bg-gray-100 rounded-md">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 text-sm rounded-l-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-3 py-2 text-sm rounded-r-md transition-colors ${
                viewMode === 'chronological'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Create Event Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                <Input
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                <Input
                  value={newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  placeholder="YYYY-MM-DD or custom format..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <select
                  value={newEvent.event_type || 'story'}
                  onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Importance</label>
                <select
                  value={newEvent.importance || 'medium'}
                  onChange={(e) => setNewEvent({ ...newEvent, importance: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {IMPORTANCE_LEVELS.map(level => (
                    <option key={level.key} value={level.key}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="What happens in this event?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                <Input
                  value={newEvent.location || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Where does this happen?"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Participants</label>
                <Input
                  value={newEvent.participants?.join(', ') || ''}
                  onChange={(e) => setNewEvent({ 
                    ...newEvent, 
                    participants: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
                  })}
                  placeholder="Characters involved (comma-separated)"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Consequences</label>
              <Textarea
                value={newEvent.consequences || ''}
                onChange={(e) => setNewEvent({ ...newEvent, consequences: e.target.value })}
                placeholder="What are the results of this event?"
                rows={2}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={createEvent} className="flex-1">
                Create Event
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' ? (
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No events found</h3>
              <p className="text-gray-600">Add your first timeline event to get started</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {filteredEvents.map((event, index) => {
                const Icon = getEventTypeIcon(event.event_type)
                return (
                  <div key={event.id} className="relative flex items-start space-x-4 pb-8">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-6 h-6 rounded-full bg-${getEventTypeColor(event.event_type)}-500 flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Event card */}
                    <Card 
                      className={`flex-1 cursor-pointer transition-all hover:shadow-md ${
                        selectedEvent?.id === event.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <Badge className={`text-${getImportanceColor(event.importance)}-600 bg-${getImportanceColor(event.importance)}-100`}>
                              {event.importance}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                        
                        {event.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {event.participants.map((participant, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {participant}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No events found</h3>
              <p className="text-gray-600">Add your first timeline event to get started</p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const Icon = getEventTypeIcon(event.event_type)
              return (
                <Card 
                  key={event.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon className={`w-5 h-5 text-${getEventTypeColor(event.event_type)}-500 mt-0.5`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <Badge className={`text-${getImportanceColor(event.importance)}-600 bg-${getImportanceColor(event.importance)}-100`}>
                              {event.importance}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 ml-4">{formatDate(event.date)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Event Details Panel */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {React.createElement(getEventTypeIcon(selectedEvent.event_type), { 
                  className: `w-5 h-5 text-${getEventTypeColor(selectedEvent.event_type)}-500` 
                })}
                <span>{selectedEvent.title}</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (confirm('Delete this event?')) deleteEvent(selectedEvent.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(null)}>
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-800">{formatDate(selectedEvent.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Importance</label>
                <Badge className={`text-${getImportanceColor(selectedEvent.importance)}-600 bg-${getImportanceColor(selectedEvent.importance)}-100`}>
                  {selectedEvent.importance}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-800">{selectedEvent.description}</p>
            </div>

            {selectedEvent.location && (
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-800">{selectedEvent.location}</p>
              </div>
            )}

            {selectedEvent.participants.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Participants</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent.participants.map((participant, idx) => (
                    <Badge key={idx} variant="outline">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.consequences && (
              <div>
                <label className="text-sm font-medium text-gray-700">Consequences</label>
                <p className="text-gray-800">{selectedEvent.consequences}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
