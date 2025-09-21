'use client'

import React, { useState, useEffect } from 'react'
import CalendarSystemsView from './calendar-systems-view'
import { 
  Plus, Search, Edit3, Trash2, Calendar as CalendarIcon, Clock, 
  Star, MapPin, Users, Scroll, Settings, Filter, Download, Upload,
  Globe, Moon, Sun, ChevronLeft, ChevronRight, MoreHorizontal,
  Link2, FileText, Tag, AlertCircle, CheckCircle, Eye, X, 
  GripVertical, Copy, RotateCcw, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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

interface CalendarSystem {
  id: string
  name: string
  description: string
  eras: Era[]
  months: Month[]
  weekdays: string[]
  moons: Moon[]
  seasons: Season[]
}

interface Era {
  id: string
  name: string
  startYear: number
  endYear?: number
  description: string
  color: string
}

interface Month {
  id: string
  name: string
  days: number
  order: number
  season?: string
  description?: string
}

interface Moon {
  id: string
  name: string
  cycle: number // days for full cycle
  color: string
  phase: 'new' | 'waxing' | 'full' | 'waning'
}

interface Season {
  id: string
  name: string
  startMonth: number
  startDay: number
  duration: number // in days
  color: string
  description?: string
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
  
  // Calendar system state
  const [calendarSystems, setCalendarSystems] = useState<CalendarSystem[]>([])
  const [activeCalendarSystem, setActiveCalendarSystem] = useState<CalendarSystem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'month' | 'week' | 'day' | 'year' | 'timeline' | 'gantt'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentEra, setCurrentEra] = useState<Era | null>(null)
  const [currentYear, setCurrentYear] = useState(1)
  const [currentMonth, setCurrentMonth] = useState(1)
  
  // Filter and display state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showRecurring, setShowRecurring] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  
  // Advanced features state
  const [showMoonPhases, setShowMoonPhases] = useState(true)
  const [showSeasons, setShowSeasons] = useState(true)
  const [linkedElements, setLinkedElements] = useState<Record<string, WorldElement[]>>({})

  // Calendar view states
  const [currentView, setCurrentView] = useState<'calendar' | 'systems' | 'create'>('calendar')
  const [selectedCalendarType, setSelectedCalendarType] = useState<'default' | 'custom' | null>(null)
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false)
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarDescription, setNewCalendarDescription] = useState('')
  const [editingCalendarSystem, setEditingCalendarSystem] = useState<CalendarSystem | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchEvents()
    fetchCalendarSystems()
    fetchLinkedElements()
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

  const fetchCalendarSystems = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'calendar_system')

      if (error) throw error
      
      if (data && data.length > 0) {
        const systems = data.map(item => item.attributes as CalendarSystem)
        setCalendarSystems(systems)
        setActiveCalendarSystem(systems[0])
      } else {
        // Create default calendar system
        createDefaultCalendarSystem()
      }
    } catch (error) {
      console.error('Error fetching calendar systems:', error)
      createDefaultCalendarSystem()
    }
  }

  const fetchLinkedElements = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .in('category', ['characters', 'locations', 'cultures', 'research'])

      if (error) throw error
      
      const linked: Record<string, WorldElement[]> = {}
      events.forEach(event => {
        linked[event.id] = (data || []).filter(element => 
          event.attributes.linked_elements?.includes(element.id) ||
          event.tags.some(tag => element.tags.includes(tag))
        )
      })
      
      setLinkedElements(linked)
    } catch (error) {
      console.error('Error fetching linked elements:', error)
    }
  }

  const createDefaultCalendarSystem = () => {
    const defaultSystem: CalendarSystem = {
      id: 'default',
      name: 'Standard Calendar',
      description: 'Earth-like calendar system',
      eras: [
        {
          id: 'era1',
          name: 'Modern Era',
          startYear: 1,
          description: 'Current time period',
          color: '#3B82F6'
        }
      ],
      months: [
        { id: 'm1', name: 'January', days: 31, order: 1, season: 'winter' },
        { id: 'm2', name: 'February', days: 28, order: 2, season: 'winter' },
        { id: 'm3', name: 'March', days: 31, order: 3, season: 'spring' },
        { id: 'm4', name: 'April', days: 30, order: 4, season: 'spring' },
        { id: 'm5', name: 'May', days: 31, order: 5, season: 'spring' },
        { id: 'm6', name: 'June', days: 30, order: 6, season: 'summer' },
        { id: 'm7', name: 'July', days: 31, order: 7, season: 'summer' },
        { id: 'm8', name: 'August', days: 31, order: 8, season: 'summer' },
        { id: 'm9', name: 'September', days: 30, order: 9, season: 'autumn' },
        { id: 'm10', name: 'October', days: 31, order: 10, season: 'autumn' },
        { id: 'm11', name: 'November', days: 30, order: 11, season: 'autumn' },
        { id: 'm12', name: 'December', days: 31, order: 12, season: 'winter' }
      ],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      moons: [
        {
          id: 'luna',
          name: 'Luna',
          cycle: 29,
          color: '#E5E7EB',
          phase: 'full'
        }
      ],
      seasons: [
        { id: 's1', name: 'Spring', startMonth: 3, startDay: 21, duration: 92, color: '#10B981' },
        { id: 's2', name: 'Summer', startMonth: 6, startDay: 21, duration: 93, color: '#F59E0B' },
        { id: 's3', name: 'Autumn', startMonth: 9, startDay: 22, duration: 90, color: '#DC2626' },
        { id: 's4', name: 'Winter', startMonth: 12, startDay: 21, duration: 90, color: '#3B82F6' }
      ]
    }
    
    setCalendarSystems([defaultSystem])
    setActiveCalendarSystem(defaultSystem)
    setCurrentEra(defaultSystem.eras[0])
  }

  const handleCalendarSystemClick = () => {
    if (calendarSystems.length === 0) {
      // No calendars exist, create default and show systems view
      createDefaultCalendarSystem()
      setCurrentView('systems')
    } else {
      // Show calendar selection view
      setCurrentView('systems')
    }
  }

  const handleCreateNewCalendar = () => {
    setCurrentView('create')
    setIsCreatingCalendar(true)
    setNewCalendarName('')
    setNewCalendarDescription('')
    
    // Create new calendar system template
    const newSystem: CalendarSystem = {
      id: `calendar_${Date.now()}`,
      name: 'New Calendar',
      description: 'Custom calendar system',
      eras: [
        {
          id: 'era1',
          name: 'Before Common Era',
          startYear: -799,
          endYear: 0,
          description: 'Pre-historical period',
          color: '#6B7280'
        },
        {
          id: 'era2',
          name: 'Common Era',
          startYear: 1,
          description: 'Modern period',
          color: '#3B82F6'
        }
      ],
      months: [
        { id: 'm1', name: 'January', days: 31, order: 1 },
        { id: 'm2', name: 'February', days: 28, order: 2 },
        { id: 'm3', name: 'March', days: 31, order: 3 },
        { id: 'm4', name: 'April', days: 30, order: 4 },
        { id: 'm5', name: 'May', days: 31, order: 5 },
        { id: 'm6', name: 'June', days: 30, order: 6 },
        { id: 'm7', name: 'July', days: 31, order: 7 },
        { id: 'm8', name: 'August', days: 31, order: 8 },
        { id: 'm9', name: 'September', days: 30, order: 9 },
        { id: 'm10', name: 'October', days: 31, order: 10 },
        { id: 'm11', name: 'November', days: 30, order: 11 },
        { id: 'm12', name: 'December', days: 31, order: 12 }
      ],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      moons: [
        {
          id: 'moon1',
          name: 'Moon',
          cycle: 29.5,
          color: '#E5E7EB',
          phase: 'new'
        }
      ],
      seasons: [
        { id: 's1', name: 'Spring', startMonth: 3, startDay: 20, duration: 92, color: '#10B981' },
        { id: 's2', name: 'Summer', startMonth: 6, startDay: 21, duration: 93, color: '#F59E0B' },
        { id: 's3', name: 'Winter', startMonth: 12, startDay: 21, duration: 90, color: '#3B82F6' }
      ]
    }
    
    setEditingCalendarSystem(newSystem)
  }

  const handleSaveCalendarSystem = async () => {
    if (!editingCalendarSystem) return

    try {
      const calendarData = {
        ...editingCalendarSystem,
        name: newCalendarName || editingCalendarSystem.name,
        description: newCalendarDescription || editingCalendarSystem.description
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'calendar_system',
          name: calendarData.name,
          description: calendarData.description,
          attributes: calendarData,
          tags: ['calendar', 'system']
        })
        .select()
        .single()

      if (error) throw error

      const updatedSystems = [...calendarSystems, calendarData]
      setCalendarSystems(updatedSystems)
      setActiveCalendarSystem(calendarData)
      setCurrentEra(calendarData.eras[0])
      
      setCurrentView('calendar')
      setIsCreatingCalendar(false)
      setEditingCalendarSystem(null)
      setNewCalendarName('')
      setNewCalendarDescription('')
    } catch (error) {
      console.error('Error saving calendar system:', error)
    }
  }

  const handleSelectCalendarSystem = (systemId: string) => {
    const system = calendarSystems.find(s => s.id === systemId)
    if (system) {
      setActiveCalendarSystem(system)
      setCurrentEra(system.eras[0])
      setCurrentView('calendar')
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
            ...eventData.attributes,
            calendar_system_id: activeCalendarSystem?.id,
            era_id: currentEra?.id
          },
          tags: eventData.tags || []
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEvents(prev => [...prev, data])
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
        setEvents(prev => prev.map(event => event.id === id ? data : event))
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

  const getEventCategories = () => {
    const categories = new Set(events.map(event => event.attributes?.type || 'event'))
    return Array.from(categories)
  }

  const getAllTags = () => {
    const tags = new Set(events.flatMap(event => event.tags))
    return Array.from(tags)
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(event.attributes?.type || 'event')
    
    const matchesPriority = selectedPriorities.length === 0 || 
                           selectedPriorities.includes(event.attributes?.priority || 'medium')
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => event.tags.includes(tag))
    
    const matchesRecurring = showRecurring || !event.attributes?.recurring
    const matchesCompleted = showCompleted || !event.attributes?.completed
    
    return matchesSearch && matchesCategory && matchesPriority && matchesTags && 
           matchesRecurring && matchesCompleted
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
        priority: 'medium',
        completed: false,
        calendar_system_id: activeCalendarSystem?.id,
        era_id: currentEra?.id,
        custom_year: currentYear,
        custom_month: currentMonth,
        custom_day: 1,
        linked_elements: [],
        moon_phase: '',
        season: '',
        weather: '',
        significance: 'minor'
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
      case 'critical': return 'bg-red-500 text-white'
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
      'battle': 'bg-red-100 text-red-800',
      'celebration': 'bg-green-100 text-green-800',
      'discovery': 'bg-cyan-100 text-cyan-800',
      'political': 'bg-indigo-100 text-indigo-800',
      'personal': 'bg-pink-100 text-pink-800',
      'deadline': 'bg-orange-100 text-orange-800',
      'milestone': 'bg-emerald-100 text-emerald-800',
      'holiday': 'bg-amber-100 text-amber-800',
      'festival': 'bg-violet-100 text-violet-800',
      'disaster': 'bg-red-200 text-red-900',
      'birth': 'bg-blue-50 text-blue-700',
      'death': 'bg-gray-200 text-gray-800',
      'coronation': 'bg-yellow-200 text-yellow-900',
      'prophecy': 'bg-purple-200 text-purple-900'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'major': return <Star className="w-4 h-4 text-yellow-500" />
      case 'minor': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getCurrentSeason = () => {
    if (!activeCalendarSystem) return null
    // Calculate current season based on current month/day
    return activeCalendarSystem.seasons.find(season => {
      // Simple season calculation - can be made more sophisticated
      return currentMonth >= season.startMonth
    })
  }

  const getMoonPhase = (date: Date) => {
    if (!activeCalendarSystem || !showMoonPhases) return null
    const daysSinceNewMoon = Math.floor(date.getTime() / (1000 * 60 * 60 * 24)) % 29
    if (daysSinceNewMoon < 7) return 'waxing'
    if (daysSinceNewMoon < 14) return 'full'
    if (daysSinceNewMoon < 21) return 'waning'
    return 'new'
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-pulse" />
          <div className="text-gray-500">Loading enhanced calendar...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex">
      {/* Enhanced Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Story Calendar</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                size="sm"
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
          
          {/* Calendar System Selector */}
          <div className="mb-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleCalendarSystemClick}
            >
              <Globe className="w-4 h-4 mr-2" />
              {activeCalendarSystem ? activeCalendarSystem.name : 'Select Calendar System'}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
          
          {/* View Mode Selector */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="mb-4">
            <TabsList className="grid grid-cols-4 gap-1">
              <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="gantt" className="text-xs">Gantt</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Advanced Filters */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Categories</label>
              <Select value={selectedCategories.join(',') || 'all'} onValueChange={(value) => {
                setSelectedCategories(value === 'all' ? [] : value.split(','))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getEventCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      <span className={`px-2 py-1 rounded text-xs ${getTypeColor(category)}`}>
                        {category}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
              <Select value={selectedPriorities.join(',') || 'all'} onValueChange={(value) => {
                setSelectedPriorities(value === 'all' ? [] : value.split(','))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
              <Select value={selectedTags.join(',') || 'all'} onValueChange={(value) => {
                setSelectedTags(value === 'all' ? [] : value.split(','))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {getAllTags().map(tag => (
                    <SelectItem key={tag} value={tag}>
                      <Badge variant="outline">{tag}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="mb-2">No events found</div>
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
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?.id === event.id
                      ? 'ring-2 ring-orange-500 bg-orange-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedEvent(event)
                    setEditingEvent(null)
                    setIsCreating(false)
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getSignificanceIcon(event.attributes?.significance)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 truncate">{event.name}</h4>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            {event.attributes?.completed && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {linkedElements[event.id]?.length > 0 && (
                              <Link2 className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className={getTypeColor(event.attributes?.type)}>
                            {event.attributes?.type}
                          </Badge>
                          <Badge className={getPriorityColor(event.attributes?.priority)}>
                            {event.attributes?.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {event.attributes?.custom_year && currentEra && (
                            <div>{currentEra.name} {event.attributes.custom_year}</div>
                          )}
                          {event.attributes?.date && (
                            <div>{new Date(event.attributes.date).toLocaleDateString()}</div>
                          )}
                          {event.attributes?.time && (
                            <div className="text-gray-500">at {event.attributes.time}</div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {event.description}
                          </p>
                        )}
                        
                        {event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {event.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{event.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {editingEvent ? (
          // Enhanced Edit/Create Form
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Create New Event' : 'Edit Event'}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
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
              
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="timing">Date & Time</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="links">Connections</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={editingEvent.description}
                        onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                        placeholder="Describe the event..."
                        className="w-full h-32"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type
                      </label>
                      <Select
                        value={editingEvent.attributes?.type || 'event'}
                        onValueChange={(value) => setEditingEvent({
                          ...editingEvent, 
                          attributes: {...editingEvent.attributes, type: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event">General Event</SelectItem>
                          <SelectItem value="battle">Battle</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                          <SelectItem value="discovery">Discovery</SelectItem>
                          <SelectItem value="political">Political Event</SelectItem>
                          <SelectItem value="personal">Personal Event</SelectItem>
                          <SelectItem value="birth">Birth</SelectItem>
                          <SelectItem value="death">Death</SelectItem>
                          <SelectItem value="coronation">Coronation</SelectItem>
                          <SelectItem value="prophecy">Prophecy</SelectItem>
                          <SelectItem value="disaster">Disaster</SelectItem>
                          <SelectItem value="festival">Festival</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <Select
                        value={editingEvent.attributes?.priority || 'medium'}
                        onValueChange={(value) => setEditingEvent({
                          ...editingEvent, 
                          attributes: {...editingEvent.attributes, priority: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Significance
                      </label>
                      <Select
                        value={editingEvent.attributes?.significance || 'minor'}
                        onValueChange={(value) => setEditingEvent({
                          ...editingEvent, 
                          attributes: {...editingEvent.attributes, significance: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor Event</SelectItem>
                          <SelectItem value="major">Major Event</SelectItem>
                          <SelectItem value="critical">Critical Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        value={editingEvent.attributes?.location || ''}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent, 
                          attributes: {...editingEvent.attributes, location: e.target.value}
                        })}
                        placeholder="Where does this event take place?"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timing" className="space-y-6">
                  {/* Timing content would go here */}
                  <div className="text-center text-gray-500 py-20">
                    <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>Date and timing configuration coming soon...</p>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  {/* Details content would go here */}
                  <div className="text-center text-gray-500 py-20">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>Detailed event configuration coming soon...</p>
                  </div>
                </TabsContent>

                <TabsContent value="links" className="space-y-6">
                  {/* Links content would go here */}
                  <div className="text-center text-gray-500 py-20">
                    <Link2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>Element linking system coming soon...</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : selectedEvent ? (
          // Enhanced Event Details View
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getSignificanceIcon(selectedEvent.attributes?.significance)}
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.name}</h2>
                </div>
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
              
              {/* Enhanced event details would go here */}
              <div className="text-center text-gray-500 py-20">
                <Eye className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p>Enhanced event details view coming soon...</p>
              </div>
            </div>
          </div>
        ) : (
          // Calendar Views
          <div className="flex-1 flex flex-col">
            {viewMode === 'timeline' && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-500 py-20">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                  <p className="text-sm">Interactive timeline view coming soon...</p>
                </div>
              </div>
            )}

            {viewMode === 'gantt' && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-500 py-20">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Gantt Chart View</h3>
                  <p className="text-sm">Gantt chart visualization coming soon...</p>
                </div>
              </div>
            )}

            {(viewMode === 'month' || viewMode === 'list') && (
              <div className="flex-1 p-4">
                <div className="text-center text-gray-500 py-20">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Enhanced Calendar Grid</h3>
                  <p className="text-sm">Advanced calendar views coming soon...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar Systems Selection View */}
      {currentView === 'systems' && (
        <div className="h-full bg-black flex items-center justify-center">
          <div className="text-center space-y-12 max-w-2xl mx-auto px-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white">Choose Calendar Type</h1>
              <p className="text-xl text-gray-300">
                Select how you want to manage time in your story
              </p>
            </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            {!isCreatingCalendar ? (
              // Calendar Selection View
              <div className="p-12 space-y-10 bg-white m-6 rounded-xl shadow-sm">
                <div className="text-xl text-gray-700 text-center">
                  Select an existing calendar system or create a new one for your project.
                </div>

                {/* Existing Calendars */}
                {calendarSystems.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-gray-900 text-center">Existing Calendars</h3>
                    <div className="grid gap-8 max-w-4xl mx-auto">
                      {calendarSystems.map((system) => (
                        <Card
                          key={system.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-2xl border-3 ${
                            activeCalendarSystem?.id === system.id
                              ? 'ring-4 ring-orange-500 bg-orange-50 border-orange-400 shadow-xl'
                              : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => handleSelectCalendarSystem(system.id)}
                        >
                          <CardContent className="p-10">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-6 mb-4">
                                  <div className={`w-6 h-6 rounded-full ${
                                    activeCalendarSystem?.id === system.id ? 'bg-orange-500' : 'bg-gray-400'
                                  }`} />
                                  <h4 className="text-2xl font-bold text-gray-900">{system.name}</h4>
                                  {activeCalendarSystem?.id === system.id && (
                                    <Badge className="bg-orange-500 text-white px-4 py-2 text-sm font-bold rounded-full">Active</Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-6 text-lg leading-relaxed">{system.description}</p>
                                <div className="flex items-center gap-12 text-base text-gray-500">
                                  <div className="flex items-center gap-3">
                                    <CalendarIcon className="w-5 h-5" />
                                    <span className="font-medium">{system.eras.length} eras</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-medium">{system.months.length} months</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Moon className="w-5 h-5" />
                                    <span className="font-medium">{system.moons.length} moons</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Sun className="w-5 h-5" />
                                    <span className="font-medium">{system.seasons.length} seasons</span>
                                  </div>
                                </div>
                              </div>
                              {activeCalendarSystem?.id === system.id && (
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 ml-8">
                                  <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create New Calendar */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">Create New Calendar</h3>
                  <div className="max-w-4xl mx-auto">
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:shadow-2xl hover:bg-orange-50 border-3 border-dashed border-orange-500 hover:border-orange-600 bg-orange-25" 
                      onClick={handleCreateNewCalendar}
                    >
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <Plus className="w-10 h-10 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-4">New Calendar System</h4>
                        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                          Create a custom calendar with your own eras, months, moons, and seasons. Design the perfect timekeeping system for your world.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-center pt-12 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentView('calendar')}
                    className="px-12 py-4 text-lg font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Calendar
                  </Button>
                </div>
              </div>
            ) : (
              // Calendar Creation View
              <div className="bg-white m-6 rounded-xl shadow-sm">
                {/* Basic Info */}
                <div className="bg-white p-12 rounded-xl border-b space-y-8">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div>
                      <Label htmlFor="calendar-name" className="text-base font-bold text-gray-700 mb-3 block">
                        Calendar Name *
                      </Label>
                      <Input
                        id="calendar-name"
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                        placeholder="Enter calendar name..."
                        className="text-lg p-4 border-2 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calendar-description" className="text-base font-bold text-gray-700 mb-3 block">
                        Description
                      </Label>
                      <Input
                        id="calendar-description"
                        value={newCalendarDescription}
                        onChange={(e) => setNewCalendarDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="text-lg p-4 border-2 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Creation View */}
      {currentView === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="border-b border-gray-200 p-8">
            <h2 className="text-3xl font-bold text-gray-900">Create New Calendar System</h2>
            <p className="text-lg text-gray-600 mt-3">
              Design a custom calendar system for your world with eras, months, moons, and seasons.
            </p>
          </div>

          {/* Basic Info */}
          <div className="p-12 border-b space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <Label htmlFor="calendar-name" className="text-base font-bold text-gray-700 mb-3 block">
                  Calendar Name *
                </Label>
                <Input
                  id="calendar-name"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Enter calendar name..."
                  className="text-lg p-4 border-2 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="calendar-description" className="text-base font-bold text-gray-700 mb-3 block">
                  Description
                </Label>
                <Input
                  id="calendar-description"
                  value={newCalendarDescription}
                  onChange={(e) => setNewCalendarDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="text-lg p-4 border-2 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {editingCalendarSystem && (
            <div className="px-6">
              <CalendarPropertiesEditor
                calendarSystem={editingCalendarSystem}
                onUpdate={setEditingCalendarSystem}
              />
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 p-12 bg-gray-50">
            <div className="flex justify-between items-center max-w-6xl mx-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentView('systems')
                  setIsCreatingCalendar(false)
                  setEditingCalendarSystem(null)
                }}
                className="px-10 py-4 text-lg font-medium"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Selection
              </Button>
              <div className="flex gap-6">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentView('calendar')}
                  className="px-10 py-4 text-lg font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCalendarSystem}
                  disabled={!newCalendarName.trim()}
                  className="bg-orange-500 hover:bg-orange-600 px-10 py-4 text-lg font-medium"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Save Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Calendar Properties Editor Component
interface CalendarPropertiesEditorProps {
  calendarSystem: CalendarSystem
  onUpdate: (system: CalendarSystem) => void
}

function CalendarPropertiesEditor({ calendarSystem, onUpdate }: CalendarPropertiesEditorProps) {
  const [activeTab, setActiveTab] = useState('eras')

  const updateSystem = (updates: Partial<CalendarSystem>) => {
    onUpdate({ ...calendarSystem, ...updates })
  }

  const addEra = () => {
    const newEra: Era = {
      id: `era_${Date.now()}`,
      name: `Era ${calendarSystem.eras.length + 1}`,
      startYear: 1,
      description: '',
      color: '#3B82F6'
    }
    updateSystem({ eras: [...calendarSystem.eras, newEra] })
  }

  const updateEra = (index: number, updates: Partial<Era>) => {
    const newEras = [...calendarSystem.eras]
    newEras[index] = { ...newEras[index], ...updates }
    updateSystem({ eras: newEras })
  }

  const removeEra = (index: number) => {
    const newEras = calendarSystem.eras.filter((_, i) => i !== index)
    updateSystem({ eras: newEras })
  }

  const addMonth = () => {
    const newMonth: Month = {
      id: `month_${Date.now()}`,
      name: `Month ${calendarSystem.months.length + 1}`,
      days: 30,
      order: calendarSystem.months.length + 1
    }
    updateSystem({ months: [...calendarSystem.months, newMonth] })
  }

  const updateMonth = (index: number, updates: Partial<Month>) => {
    const newMonths = [...calendarSystem.months]
    newMonths[index] = { ...newMonths[index], ...updates }
    updateSystem({ months: newMonths })
  }

  const removeMonth = (index: number) => {
    const newMonths = calendarSystem.months.filter((_, i) => i !== index)
    updateSystem({ months: newMonths })
  }

  const addMoon = () => {
    const newMoon: Moon = {
      id: `moon_${Date.now()}`,
      name: `Moon ${calendarSystem.moons.length + 1}`,
      cycle: 29.5,
      color: '#E5E7EB',
      phase: 'new'
    }
    updateSystem({ moons: [...calendarSystem.moons, newMoon] })
  }

  const updateMoon = (index: number, updates: Partial<Moon>) => {
    const newMoons = [...calendarSystem.moons]
    newMoons[index] = { ...newMoons[index], ...updates }
    updateSystem({ moons: newMoons })
  }

  const removeMoon = (index: number) => {
    const newMoons = calendarSystem.moons.filter((_, i) => i !== index)
    updateSystem({ moons: newMoons })
  }

  const addSeason = () => {
    const newSeason: Season = {
      id: `season_${Date.now()}`,
      name: `Season ${calendarSystem.seasons.length + 1}`,
      startMonth: 1,
      startDay: 1,
      duration: 90,
      color: '#10B981'
    }
    updateSystem({ seasons: [...calendarSystem.seasons, newSeason] })
  }

  const updateSeason = (index: number, updates: Partial<Season>) => {
    const newSeasons = [...calendarSystem.seasons]
    newSeasons[index] = { ...newSeasons[index], ...updates }
    updateSystem({ seasons: newSeasons })
  }

  const removeSeason = (index: number) => {
    const newSeasons = calendarSystem.seasons.filter((_, i) => i !== index)
    updateSystem({ seasons: newSeasons })
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b bg-gray-50 px-6 py-3">
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="eras" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Eras
            </TabsTrigger>
            <TabsTrigger value="months" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Months
            </TabsTrigger>
            <TabsTrigger value="weeks" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Weeks
            </TabsTrigger>
            <TabsTrigger value="moons" className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Moons
            </TabsTrigger>
            <TabsTrigger value="seasons" className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Seasons
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="eras" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historical Eras</h3>
                <p className="text-sm text-gray-600">Define the major time periods in your world's history</p>
              </div>
              <Button size="sm" onClick={addEra} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Era
              </Button>
            </div>
            
            <div className="space-y-4">
              {calendarSystem.eras.map((era, index) => (
                <Card key={era.id} className="border-l-4" style={{borderLeftColor: era.color}}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                          style={{backgroundColor: era.color}}
                        />
                        <span className="text-sm font-medium text-gray-500">Era {index + 1}</span>
                      </div>
                      <Input
                        value={era.name}
                        onChange={(e) => updateEra(index, { name: e.target.value })}
                        placeholder="Era name"
                        className="flex-1 font-medium"
                      />
                      <Input
                        value={era.color}
                        onChange={(e) => updateEra(index, { color: e.target.value })}
                        type="color"
                        className="w-16 h-9"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeEra(index)}
                        disabled={calendarSystem.eras.length <= 1}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Start Year</Label>
                        <Input
                          type="number"
                          value={era.startYear}
                          onChange={(e) => updateEra(index, { startYear: parseInt(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">End Year (optional)</Label>
                        <Input
                          type="number"
                          value={era.endYear || ''}
                          onChange={(e) => updateEra(index, { endYear: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="Leave empty for ongoing"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <Textarea
                        value={era.description}
                        onChange={(e) => updateEra(index, { description: e.target.value })}
                        placeholder="Describe this era's characteristics and significance..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="months" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Months & Calendar Structure</h3>
                <p className="text-sm text-gray-600">Configure the months and basic structure of your calendar system</p>
              </div>
              <Button size="sm" onClick={addMonth} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Month
              </Button>
            </div>
            
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">Months</h4>
              <div className="space-y-4">
                {calendarSystem.months.map((month, index) => (
                  <Card key={month.id} className="border-l-4 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                          <span className="text-sm font-medium text-gray-500">Month {index + 1}</span>
                        </div>
                        <Input
                          value={month.name}
                          onChange={(e) => updateMonth(index, { name: e.target.value })}
                          placeholder="Month name"
                          className="flex-1 font-medium"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeMonth(index)}
                          disabled={calendarSystem.months.length <= 1}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Days</Label>
                          <Input
                            type="number"
                            value={month.days}
                            onChange={(e) => updateMonth(index, { days: parseInt(e.target.value) || 30 })}
                            min="1"
                            max="50"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Order</Label>
                          <Input
                            type="number"
                            value={month.order}
                            onChange={(e) => updateMonth(index, { order: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Season</Label>
                          <Select 
                            value={month.season || 'none'} 
                            onValueChange={(value) => updateMonth(index, { season: value === 'none' ? undefined : value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Season</SelectItem>
                              {calendarSystem.seasons.map(season => (
                                <SelectItem key={season.id} value={season.name.toLowerCase()}>
                                  {season.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weeks" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Week Structure</h3>
                <p className="text-sm text-gray-600">Configure how weeks and days are organized in your calendar</p>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Weekday Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Days of the Week</Label>
                  <div className="space-y-3">
                    {calendarSystem.weekdays.map((day, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <Input
                          value={day}
                          onChange={(e) => {
                            const newWeekdays = [...calendarSystem.weekdays]
                            newWeekdays[index] = e.target.value
                            updateSystem({ weekdays: newWeekdays })
                          }}
                          placeholder="Day name"
                          className="flex-1 bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox id={`weekend-${index}`} />
                          <Label htmlFor={`weekend-${index}`} className="text-sm text-gray-600">Weekend</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hours in a Day</Label>
                    <Input
                      type="number"
                      defaultValue={24}
                      min="1"
                      max="50"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Week Start Offset</Label>
                    <Input
                      type="number"
                      defaultValue={0}
                      min="0"
                      max="6"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Week Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox id="overflow-weekdays" defaultChecked />
                      <div>
                        <Label htmlFor="overflow-weekdays" className="font-medium">Overflow weekdays</Label>
                        <p className="text-sm text-gray-600">Allow weekdays to extend beyond month boundaries</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox id="alternating-weeks" />
                      <div>
                        <Label htmlFor="alternating-weeks" className="font-medium">Alternating weeks</Label>
                        <p className="text-sm text-gray-600">Use different week patterns throughout the year</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moons" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Moon Cycles</h3>
                <p className="text-sm text-gray-600">Configure celestial bodies and their cycles that affect your calendar</p>
              </div>
              <Button size="sm" onClick={addMoon} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Moon
              </Button>
            </div>
            
            <div className="space-y-4">
              {calendarSystem.moons.map((moon, index) => (
                <Card key={moon.id} className="border-l-4 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{backgroundColor: moon.color}}
                        />
                        <span className="text-sm font-medium text-gray-500">Moon {index + 1}</span>
                      </div>
                      <Input
                        value={moon.name}
                        onChange={(e) => updateMoon(index, { name: e.target.value })}
                        placeholder="Moon name"
                        className="flex-1 font-medium"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeMoon(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Cycle Length (Days)</Label>
                        <Input
                          type="number"
                          value={moon.cycle}
                          onChange={(e) => updateMoon(index, { cycle: parseFloat(e.target.value) || 29.5 })}
                          step="0.1"
                          min="1"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Color</Label>
                        <Input
                          type="color"
                          value={moon.color}
                          onChange={(e) => updateMoon(index, { color: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Day Rounding</Label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select rounding" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="down">Round Down</SelectItem>
                            <SelectItem value="up">Round Up</SelectItem>
                            <SelectItem value="nearest">Round to Nearest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Checkbox id={`reverse-cycle-${index}`} />
                      <div>
                        <Label htmlFor={`reverse-cycle-${index}`} className="font-medium">Reverse Cycle</Label>
                        <p className="text-sm text-gray-600">Reverse the direction of this moon's phase cycle</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seasons" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seasonal Cycles</h3>
                <p className="text-sm text-gray-600">Define the seasons that occur throughout your calendar year</p>
              </div>
              <Button size="sm" onClick={addSeason} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Season
              </Button>
            </div>
            
            <div className="space-y-4">
              {calendarSystem.seasons.map((season, index) => (
                <Card key={season.id} className="border-l-4" style={{borderLeftColor: season.color}}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{backgroundColor: season.color}}
                        />
                        <Select value={season.name.toLowerCase()}>
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spring">🌸</SelectItem>
                            <SelectItem value="summer">☀️</SelectItem>
                            <SelectItem value="autumn">🍂</SelectItem>
                            <SelectItem value="winter">❄️</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm font-medium text-gray-500">Season {index + 1}</span>
                      </div>
                      <Input
                        value={season.name}
                        onChange={(e) => updateSeason(index, { name: e.target.value })}
                        placeholder="Season name"
                        className="flex-1 font-medium"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeSeason(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Start Month</Label>
                        <Select 
                          value={season.startMonth.toString()} 
                          onValueChange={(value) => updateSeason(index, { startMonth: parseInt(value) })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {calendarSystem.months.map((month, monthIndex) => (
                              <SelectItem key={month.id} value={(monthIndex + 1).toString()}>
                                {month.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Start Day</Label>
                        <Input
                          type="number"
                          value={season.startDay}
                          onChange={(e) => updateSeason(index, { startDay: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="31"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Duration (Days)</Label>
                        <Input
                          type="number"
                          value={season.duration}
                          onChange={(e) => updateSeason(index, { duration: parseInt(e.target.value) || 90 })}
                          min="1"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Color</Label>
                        <Input
                          type="color"
                          value={season.color}
                          onChange={(e) => updateSeason(index, { color: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Checkbox id="length-based-seasons" />
                  <div>
                    <Label htmlFor="length-based-seasons" className="font-medium text-blue-900">Length-based seasons</Label>
                    <p className="text-sm text-blue-700">
                      Seasons have static duration but may occur on variable dates
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm font-medium text-blue-900">Seasonal offset (days)</Label>
                  <Input
                    type="number"
                    defaultValue={0}
                    className="mt-1 w-32 bg-white"
                    placeholder="0"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Enable length-based seasons to adjust this setting
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}