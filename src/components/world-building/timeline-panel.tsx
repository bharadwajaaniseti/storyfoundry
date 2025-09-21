import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Plus, Search, Edit3, Trash2, Clock, Calendar, GitBranch, 
  MapPin, Users, AlertTriangle, Download, Upload, Filter,
  ZoomIn, ZoomOut, Move, Link2, Eye, EyeOff, Settings,
  ChevronDown, ChevronRight, Layers, Target, BookOpen,
  ArrowRight, RotateCcw, Save, FileText, Image, Database, X
} from 'lucide-react'
import { useTimelines, useTimelineEvents, type Timeline, type TimelineEvent, type CreateTimelineEvent } from '@/hooks/useTimelines'
import { createSupabaseClient } from '@/lib/auth'

interface TimelinePanelProps {
  projectId: string
}

interface ContinuityIssue {
  type: string
  eventId: string
  message: string
  severity: 'warning' | 'error'
}

// Enhanced Timeline Management System with database integration
export default function TimelinePanel({ projectId }: TimelinePanelProps) {
  // Database integration
  const {
    timelines,
    isLoading: timelinesLoading,
    error: timelinesError,
    createTimeline: dbCreateTimeline,
    updateTimeline: dbUpdateTimeline,
    deleteTimeline: dbDeleteTimeline,
    refresh: refreshTimelines
  } = useTimelines(projectId)
  
  // UI state
  const [_selectedTimeline, _setSelectedTimeline] = useState<string | null>(null)
  const [hasManualSelection, setHasManualSelection] = useState(false) // Track manual selections
  const [pendingTimelineSelection, setPendingTimelineSelection] = useState<string | null>(null) // Track pending selections
  
  // Debug wrapper for setSelectedTimeline
  const setSelectedTimeline = (timelineId: string | null) => {
    _setSelectedTimeline(timelineId)
  }
  
  const selectedTimeline = _selectedTimeline
  
  // Load events for the currently selected timeline
  const {
    events: currentTimelineEvents,
    isLoading: eventsLoading,
    error: eventsError,
    createEvent: dbCreateEvent,
    updateEvent: dbUpdateEvent,
    deleteEvent: dbDeleteEvent,
    refresh: refreshEvents
  } = useTimelineEvents(projectId, selectedTimeline || undefined)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'characters' | 'chapters' | 'network' | 'list'>('timeline')
  const [groupBy, setGroupBy] = useState<'lane' | 'character' | 'location' | 'importance'>('lane')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ lanes: [] as string[], importance: [] as string[], types: [] as string[] })
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showContinuityPanel, setShowContinuityPanel] = useState(false)
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [newTimelineName, setNewTimelineName] = useState('')
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const timelinesRef = useRef<Timeline[]>([]) // Ref to access current timelines in event handlers
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Set default timeline when timelines load (only if no manual selection has been made)
  useEffect(() => {
    if (timelines.length > 0) {
      // If there's a pending manual selection, apply it first
      if (pendingTimelineSelection && timelines.find(t => t.id === pendingTimelineSelection)) {
        setSelectedTimeline(pendingTimelineSelection)
        setPendingTimelineSelection(null)
        setHasManualSelection(true)
      }
      // Only auto-select if no manual selection has been made, no timeline is selected, AND no pending selection exists
      else if (!hasManualSelection && !selectedTimeline && !pendingTimelineSelection) {
        const defaultTimeline = timelines.find(t => t.attributes.is_default) || timelines[0]
        setSelectedTimeline(defaultTimeline.id)
      }
    }
  }, [timelines, hasManualSelection, pendingTimelineSelection]) // Include pendingTimelineSelection

  // Keep timelinesRef current for event handler access
  useEffect(() => {
    timelinesRef.current = timelines
  }, [timelines])

  // Clear editing event whenever selectedTimeline changes (regardless of how it changes)
  useEffect(() => {
    // Clear both editing event and selected event when timeline changes
    if (selectedTimeline) {
      let shouldClearEditing = false
      let shouldClearSelected = false
      
      // Check editing event
      if (editingEvent && editingEvent.timeline_id !== selectedTimeline) {
        shouldClearEditing = true
      }
      
      // Check selected event
      if (selectedEvent && selectedEvent.timeline_id !== selectedTimeline) {
        shouldClearSelected = true
      }
      
      // Apply clearing
      if (shouldClearEditing) {
        setEditingEvent(null)
        setIsCreating(false)
      }
      if (shouldClearSelected) {
        setSelectedEvent(null)
      }
    }
  }, [selectedTimeline, editingEvent, selectedEvent])

  // Listen for timeline creation trigger from sidebar
  useEffect(() => {
    const handleTimelineCreationTrigger = () => {
      setShowTimelineForm(true)
    }

    const handleTimelineSelection = (event: CustomEvent) => {
      if (event.detail?.projectId === projectId && event.detail?.timelineId) {
        const timelineId = event.detail.timelineId
        const targetTimeline = timelinesRef.current.find(t => t.id === timelineId)
        
        setHasManualSelection(true) // Mark that a manual selection was made
        
        // If timelines are loaded, set immediately
        if (timelinesRef.current.length > 0 && timelinesRef.current.find(t => t.id === timelineId)) {
          setSelectedTimeline(timelineId)
          setPendingTimelineSelection(null) // Clear any pending selection
        } else {
          // If timelines aren't loaded yet, store as pending
          setPendingTimelineSelection(timelineId)
        }
      }
    }
    
    window.addEventListener('triggerTimelineCreation', handleTimelineCreationTrigger)
    window.addEventListener('timelineSelected', handleTimelineSelection as EventListener)
    
    return () => {
      window.removeEventListener('triggerTimelineCreation', handleTimelineCreationTrigger)
      window.removeEventListener('timelineSelected', handleTimelineSelection as EventListener)
    }
  }, [projectId]) // Remove timelines from dependencies to prevent constant re-registration

  // Timeline calculation helpers
  const getEventPosition = useCallback((event: TimelineEvent) => {
    const startDate = new Date(event.start_date || event.date)
    const baselineDate = new Date('2015-01-01') // Moved even earlier to position 2017 events closer to left
    const daysDiff = (startDate.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Determine group key for dynamic positioning
    let groupKey: string
    switch (groupBy) {
      case 'character':
        groupKey = event.participants && event.participants.length > 0 
          ? event.participants[0] 
          : 'No Character'
        break
      case 'location':
        groupKey = event.location || 'No Location'
        break
      case 'importance':
        groupKey = event.importance.charAt(0).toUpperCase() + event.importance.slice(1)
        break
      case 'lane':
      default:
        groupKey = event.lane
        break
    }
    
    return {
      x: daysDiff * 0.5 * zoomLevel + panOffset.x + 500, // Reduced scale and added offset to bring events into view
      y: getDynamicLaneY(groupKey) + panOffset.y
    }
  }, [zoomLevel, panOffset, groupBy])

  const getLaneY = (lane: string) => {
    const lanes = ['world', 'plot', 'characters', 'locations', 'items']
    return lanes.indexOf(lane) * 120 + 100
  }

  // Continuity checking
  const checkContinuity = useCallback((): ContinuityIssue[] => {
    const issues: ContinuityIssue[] = []
    
    currentTimelineEvents.forEach((event: TimelineEvent) => {
      if (event.participants && event.participants.length > 0) {
        const overlapping = currentTimelineEvents.filter((other: TimelineEvent) => 
          other.id !== event.id &&
          other.participants?.some((p: string) => event.participants.includes(p)) &&
          new Date(other.start_date || other.date) <= new Date(event.end_date || event.date) &&
          new Date(other.end_date || other.date) >= new Date(event.start_date || event.date)
        )
        
        if (overlapping.length > 0) {
          issues.push({
            type: 'character-conflict',
            eventId: event.id,
            message: `Character appears in multiple events simultaneously`,
            severity: 'warning'
          })
        }
      }
    })

    return issues
  }, [currentTimelineEvents])

  // Event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Update mouse position for tooltips
    setMousePosition({ x: e.clientX, y: e.clientY })
    
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 5))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.1))

  const createEvent = () => {
    if (!selectedTimeline) {
      if (timelines.length === 0) {
        alert('Please create a timeline first before adding events.')
        setShowTimelineForm(true)
        return
      } else {
        alert('Please select a timeline first.')
        return
      }
    }
    
    console.log('Creating new event for timeline:', selectedTimeline)
    
    setIsCreating(true)
    setEditingEvent({
      id: '',
      project_id: projectId,
      timeline_id: selectedTimeline,
      user_id: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      lane: 'plot',
      importance: 'medium',
      event_type: 'story',
      location: '',
      participants: [],
      tags: [],
      consequences: '',
      attributes: {},
      created_at: '',
      updated_at: ''
    })
  }

  const createTimeline = async () => {
    if (!newTimelineName.trim()) return
    
    try {
      const result = await dbCreateTimeline({
        project_id: projectId,
        name: newTimelineName.trim(),
        description: '',
        attributes: {
          color: '#3B82F6',
          is_default: timelines.length === 0,
          lanes: ['world', 'plot', 'characters', 'locations', 'items']
        }
      })
      
      setSelectedTimeline(result.timeline.id)
      setNewTimelineName('')
      setShowTimelineForm(false)
      
      // Broadcast the change for sidebar update using raw WorldElement data
      window.dispatchEvent(new CustomEvent('timelineCreated', { 
        detail: { timeline: result.worldElement, projectId } 
      }))
    } catch (error) {
      console.error('Error creating timeline:', error)
    }
  }

  const handleTimelineFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTimeline()
  }

  const saveEvent = async () => {
    if (!editingEvent || !selectedTimeline) {
      console.error('Missing required data:', { editingEvent: !!editingEvent, selectedTimeline })
      return
    }

    try {
      console.log('Saving event - selectedTimeline:', selectedTimeline)
      console.log('Available timelines:', timelines)
      console.log('Selected timeline exists?', timelines.find(t => t.id === selectedTimeline))
      console.log('Saving event - editingEvent:', editingEvent)

      // Validate timeline exists
      const selectedTimelineObj = timelines.find(t => t.id === selectedTimeline)
      if (!selectedTimelineObj) {
        alert(`Timeline with ID ${selectedTimeline} not found. Available timelines: ${timelines.map(t => `${t.name} (${t.id})`).join(', ')}`)
        return
      }

      // Double-check timeline exists in database
      const supabase = createSupabaseClient()
      const { data: dbTimeline, error: timelineError } = await supabase
        .from('world_elements')
        .select('id, name, category')
        .eq('id', selectedTimeline)
        .eq('category', 'timeline')
        .single()

      if (timelineError || !dbTimeline) {
        console.error('Timeline not found in database:', timelineError)
        alert(`Timeline ${selectedTimeline} not found in database. Error: ${timelineError?.message || 'Unknown error'}`)
        return
      }

      console.log('Database timeline verification passed:', dbTimeline)

      // Validate required fields
      if (!editingEvent.title?.trim()) {
        alert('Event title is required')
        return
      }

      const eventData = {
        title: editingEvent.title.trim(),
        description: editingEvent.description || '',
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        date: editingEvent.start_date, // Legacy field
        lane: editingEvent.lane,
        importance: editingEvent.importance,
        event_type: editingEvent.event_type,
        location: editingEvent.location || '',
        participants: editingEvent.participants || [],
        tags: editingEvent.tags || [],
        consequences: editingEvent.consequences || '',
        attributes: editingEvent.attributes || {}
      }

      console.log('Event data to be saved:', eventData)

      if (isCreating) {
        // Get current user for user_id
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('User not authenticated')
        }

        await dbCreateEvent({
          ...eventData,
          project_id: projectId,
          timeline_id: selectedTimeline,
          user_id: user.id
        })
      } else {
        await dbUpdateEvent(editingEvent.id, eventData)
      }
      
      setEditingEvent(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Error saving event:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Show user-friendly error message
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Failed to save event: ${error.message}`)
      } else {
        alert('Failed to save event. Please check the console for details.')
      }
    }
  }

  const exportTimeline = (format: string) => {
    const data = { timelines, events: currentTimelineEvents }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-export.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter events by selected timeline
  const timelineEvents = currentTimelineEvents || []
  
  // Filter events
  const filteredEvents = timelineEvents.filter((event: TimelineEvent) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLane = filters.lanes.length === 0 || filters.lanes.includes(event.lane)
    const matchesImportance = filters.importance.length === 0 || filters.importance.includes(event.importance)
    const matchesType = filters.types.length === 0 || filters.types.includes(event.event_type)
    
    return matchesSearch && matchesLane && matchesImportance && matchesType
  })

  // Dynamic lane organization based on groupBy setting
  const organizeEventsByGroup = useCallback(() => {
    const eventGroups: Record<string, TimelineEvent[]> = {}
    
    filteredEvents.forEach((event: TimelineEvent) => {
      let groupKey: string
      
      switch (groupBy) {
        case 'character':
          groupKey = event.participants && event.participants.length > 0 
            ? event.participants[0] 
            : 'No Character'
          break
        case 'location':
          groupKey = event.location || 'No Location'
          break
        case 'importance':
          groupKey = event.importance.charAt(0).toUpperCase() + event.importance.slice(1)
          break
        case 'lane':
        default:
          groupKey = event.lane
          break
      }
      
      if (!eventGroups[groupKey]) {
        eventGroups[groupKey] = []
      }
      eventGroups[groupKey].push(event)
    })
    
    return eventGroups
  }, [filteredEvents, groupBy])

  const eventGroups = organizeEventsByGroup()
  const dynamicLanes = Object.keys(eventGroups)

  const getDynamicLaneY = (groupKey: string) => {
    const index = dynamicLanes.indexOf(groupKey)
    return index * 120 + 100
  }

  const getDynamicLaneColor = (groupKey: string, index: number) => {
    if (groupBy === 'lane') {
      return `hsl(${index * 72}, 65%, 55%)`
    } else if (groupBy === 'importance') {
      const importanceColors = {
        'Critical': 'hsl(0, 65%, 55%)',    // Red
        'High': 'hsl(25, 65%, 55%)',      // Orange  
        'Medium': 'hsl(45, 65%, 55%)',    // Yellow
        'Low': 'hsl(200, 65%, 55%)'       // Blue
      }
      return importanceColors[groupKey as keyof typeof importanceColors] || `hsl(${index * 72}, 65%, 55%)`
    } else {
      return `hsl(${index * 45}, 60%, 50%)` // Different hue spacing for other groupings
    }
  }

  const continuityIssues = checkContinuity()

  // Loading state
  if (timelinesLoading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timelines...</p>
        </div>
      </div>
    )
  }

  // Timeline creation form modal - show whenever requested
  if (showTimelineForm) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Timeline</h2>
          
          <form onSubmit={handleTimelineFormSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline Name
              </label>
              <input
                type="text"
                value={newTimelineName}
                onChange={(e) => setNewTimelineName(e.target.value)}
                placeholder="Enter timeline name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                This will be the main timeline for your story events
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTimelineForm(false)
                  setNewTimelineName('')
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
              >
                Create Timeline
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // If no timelines exist and form is not shown, show empty state
  if (timelines.length === 0) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Timelines Yet</h2>
          <p className="text-gray-600 mb-6">Create your first timeline to start managing your story chronology and track events across your narrative.</p>
          <button
            onClick={() => setShowTimelineForm(true)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create First Timeline
          </button>
        </div>
      </div>
    )
  }

  // Main timeline interface
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {selectedTimeline && timelines.find(t => t.id === selectedTimeline)?.name 
              ? `${timelines.find(t => t.id === selectedTimeline)?.name} Timeline Manager`
              : 'Timeline Manager'
            }
          </h1>
          
          <button
            onClick={() => setShowTimelineForm(true)}
            className="p-1 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
            title="Create new timeline"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm ${viewMode === 'timeline' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('characters')}
              className={`px-3 py-1 text-sm ${viewMode === 'characters' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            >
              Characters
            </button>
            <button
              onClick={() => setViewMode('chapters')}
              className={`px-3 py-1 text-sm ${viewMode === 'chapters' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            >
              Structure
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            >
              List
            </button>
          </div>
          
          {/* Grouping Options for Timeline View */}
          {viewMode === 'timeline' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Group by:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="lane">Lane</option>
                <option value="character">Character</option>
                <option value="location">Location</option>
                <option value="importance">Importance</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
          
          <button
            onClick={() => setShowContinuityPanel(!showContinuityPanel)}
            className={`p-2 rounded-md ${continuityIssues.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200`}
          >
            <AlertTriangle className="w-4 h-4" />
            {continuityIssues.length > 0 && (
              <span className="ml-1 text-xs">{continuityIssues.length}</span>
            )}
          </button>

          <button
            onClick={createEvent}
            disabled={!selectedTimeline}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm flex items-center gap-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>

          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="p-1 hover:bg-gray-100 rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-gray-100 rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => exportTimeline('json')}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Dynamic Lanes Panel */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">
              {groupBy === 'lane' ? 'Lanes' : 
               groupBy === 'character' ? 'Characters' :
               groupBy === 'location' ? 'Locations' : 
               groupBy === 'importance' ? 'Importance' : 'Groups'}
            </h3>
            {dynamicLanes.map((laneKey, index) => (
              <div key={laneKey} className="flex items-center gap-2 py-1">
                <div 
                  className="w-4 h-4 rounded border-2 border-white"
                  style={{ backgroundColor: getDynamicLaneColor(laneKey, index) }}
                />
                <span className="text-sm capitalize">{laneKey}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {eventGroups[laneKey]?.length || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Events</h3>
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No events found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.sort((a: TimelineEvent, b: TimelineEvent) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime()).map((event: TimelineEvent) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEvent?.id === event.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: `hsl(${['world', 'plot', 'characters', 'locations', 'items'].indexOf(event.lane) * 72}, 50%, 60%)` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{event.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(event.start_date || event.date).toLocaleDateString()}
                            {event.location && ` • ${event.location}`}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              event.importance === 'high' ? 'bg-red-100 text-red-700' :
                              event.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {event.importance}
                            </span>
                            {event.participants && event.participants.length > 0 && (
                              <span className="text-xs text-gray-500">
                                <Users className="w-3 h-3 inline mr-1" />
                                {event.participants.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'timeline' && (
            <div className="flex-1 relative overflow-hidden">
              <div
                ref={canvasRef}
                className="w-full h-full bg-gradient-to-br from-slate-50 to-gray-100 cursor-move select-none overflow-hidden"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* Enhanced Background Grid */}
                <svg className="absolute inset-0 w-full h-full">
                  <defs>
                    {/* Fine grid pattern */}
                    <pattern id="smallGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f8f9fa" strokeWidth="0.5"/>
                    </pattern>
                    
                    {/* Major grid pattern */}
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="url(#smallGrid)"/>
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                    </pattern>
                    
                    {/* Gradient for depth */}
                    <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.8}} />
                      <stop offset="100%" style={{stopColor: '#f1f5f9', stopOpacity: 0.4}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Base grid */}
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <rect width="100%" height="100%" fill="url(#gridGradient)" />
                </svg>

                {/* Event Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6b7280"
                        fillOpacity="0.6"
                      />
                    </marker>
                  </defs>
                  {filteredEvents.map((event: TimelineEvent) => {
                    if (!event.participants || event.participants.length === 0) return null
                    
                    // Find related events (events with shared participants that come after this one)
                    const relatedEvents = filteredEvents.filter((other: TimelineEvent) => 
                      other.id !== event.id &&
                      other.participants?.some((p: string) => event.participants.includes(p)) &&
                      new Date(other.start_date || other.date) > new Date(event.start_date || event.date) &&
                      new Date(other.start_date || other.date).getTime() - new Date(event.start_date || event.date).getTime() < (30 * 24 * 60 * 60 * 1000) // Within 30 days
                    ).slice(0, 2) // Limit to 2 connections to avoid clutter
                    
                    return relatedEvents.map((relatedEvent: TimelineEvent) => {
                      const startPos = getEventPosition(event)
                      const endPos = getEventPosition(relatedEvent)
                      
                      // Create a curved path for the connection
                      const midX = (startPos.x + endPos.x) / 2
                      const midY = (startPos.y + endPos.y) / 2 - 20 // Curve upward
                      
                      const path = `M ${startPos.x + 150} ${startPos.y + 30} Q ${midX} ${midY} ${endPos.x} ${endPos.y + 30}`
                      
                      return (
                        <path
                          key={`${event.id}-${relatedEvent.id}`}
                          d={path}
                          stroke="#6b7280"
                          strokeWidth="1.5"
                          strokeOpacity="0.4"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                          strokeDasharray="3,3"
                        />
                      )
                    })
                  })}
                </svg>

                {/* Timeline Minimap */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg" style={{ zIndex: 20 }}>
                  <div className="text-xs font-medium text-gray-700 mb-2">Timeline Overview</div>
                  <div className="w-48 h-12 bg-gray-100 rounded relative overflow-hidden">
                    {/* Minimap background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100"></div>
                    
                    {/* Timeline range indicator */}
                    <div
                      className="absolute top-0 bottom-0 bg-blue-500/30 border-x border-blue-500"
                      style={{
                        left: `${Math.max(0, (-panOffset.x / (zoomLevel * 365 * 0.5)) * 10)}%`,
                        width: `${Math.min(100, (window.innerWidth / (zoomLevel * 365 * 0.5)) * 10)}%`
                      }}
                    />
                    
                    {/* Events dots */}
                    {filteredEvents.slice(0, 20).map((event: TimelineEvent) => {
                      const eventDate = new Date(event.start_date || event.date)
                      const baseDate = new Date('2015-01-01')
                      const yearsDiff = (eventDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
                      const x = (yearsDiff / 10) * 100 // 10 year range
                      
                      if (x < 0 || x > 100) return null
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute w-1 h-1 bg-red-500 rounded-full"
                          style={{
                            left: `${x}%`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                          title={event.title}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2015</span>
                    <span>2025</span>
                  </div>
                </div>

                {/* Timeline Markers */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 20 }, (_, i) => {
                    const year = 2015 + i
                    const yearDate = new Date(`${year}-01-01`)
                    const baselineDate = new Date('2015-01-01')
                    const daysDiff = (yearDate.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24)
                    const x = daysDiff * 0.5 * zoomLevel + panOffset.x + 500
                    
                    // Only show markers that are in view
                    if (x < -100 || x > window.innerWidth + 100) return null
                    
                    return (
                      <div
                        key={year}
                        className="absolute top-0 bottom-0 border-l border-slate-300 opacity-60"
                        style={{ left: x }}
                      >
                        <div className="absolute top-2 left-1 bg-white px-2 py-1 rounded shadow-sm border text-xs font-medium text-slate-600">
                          {year}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Dynamic Lane Background Strips */}
                {dynamicLanes.map((laneKey, index) => {
                  const laneColor = getDynamicLaneColor(laneKey, index)
                  const y = getDynamicLaneY(laneKey) + panOffset.y
                  
                  return (
                    <div
                      key={`${laneKey}-bg`}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{
                        top: y - 10,
                        height: 120,
                        background: `linear-gradient(90deg, ${laneColor}08 0%, ${laneColor}03 50%, transparent 100%)`,
                        borderTop: `1px solid ${laneColor}20`,
                        borderBottom: `1px solid ${laneColor}20`
                      }}
                    />
                  )
                })}

                {/* Enhanced Dynamic Lane Labels */}
                {dynamicLanes.map((laneKey, index) => {
                  const laneColor = getDynamicLaneColor(laneKey, index)
                  const lightLaneColor = laneColor.replace('55%', '95%')
                  
                  return (
                    <div
                      key={laneKey}
                      className="absolute left-6 font-semibold text-sm text-gray-700 px-4 py-2 rounded-xl border shadow-md backdrop-blur-sm z-10"
                      style={{ 
                        top: getDynamicLaneY(laneKey) + panOffset.y - 15,
                        background: `linear-gradient(135deg, ${lightLaneColor}cc 0%, #ffffffcc 70%)`,
                        borderColor: laneColor + '40',
                        boxShadow: `0 4px 6px -1px ${laneColor}20, 0 2px 4px -1px ${laneColor}10`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                          style={{ backgroundColor: laneColor }}
                        />
                        <span className="capitalize font-bold tracking-wide">
                          {laneKey}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({eventGroups[laneKey]?.length || 0})
                        </span>
                      </div>
                    </div>
                  )
                })}

                {filteredEvents.map((event: TimelineEvent) => {
                  const position = getEventPosition(event)
                  const duration = new Date(event.end_date || event.date).getTime() - new Date(event.start_date || event.date).getTime()
                  const width = Math.max(180, duration / (1000 * 60 * 60 * 24) * 2 * zoomLevel)
                  
                  // Determine group key and colors for current grouping
                  let groupKey: string
                  switch (groupBy) {
                    case 'character':
                      groupKey = event.participants && event.participants.length > 0 
                        ? event.participants[0] 
                        : 'No Character'
                      break
                    case 'location':
                      groupKey = event.location || 'No Location'
                      break
                    case 'importance':
                      groupKey = event.importance.charAt(0).toUpperCase() + event.importance.slice(1)
                      break
                    case 'lane':
                    default:
                      groupKey = event.lane
                      break
                  }
                  
                  const laneIndex = dynamicLanes.indexOf(groupKey)
                  const laneColor = getDynamicLaneColor(groupKey, laneIndex)
                  const lightLaneColor = laneColor.replace('55%', '95%')
                  
                  // Format date range
                  const startDate = new Date(event.start_date || event.date)
                  const endDate = event.end_date ? new Date(event.end_date) : null
                  const formatDate = (date: Date) => {
                    return date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
                    })
                  }
                  
                  const dateRange = endDate && endDate.getTime() !== startDate.getTime() 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : formatDate(startDate)
                  
                  // Determine importance styling
                  const importanceStyles = {
                    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700' },
                    high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700' },
                    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700' },
                    low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-700' }
                  }
                  
                  const importance = importanceStyles[event.importance as keyof typeof importanceStyles] || importanceStyles.medium
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute bg-white border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:z-10 ${
                        selectedEvent?.id === event.id 
                          ? 'border-blue-400 shadow-xl ring-2 ring-blue-200 z-10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        left: position.x,
                        top: position.y,
                        width: width,
                        minHeight: '120px',
                        background: `linear-gradient(135deg, ${lightLaneColor} 0%, white 50%)`
                      }}
                      onClick={() => setSelectedEvent(event)}
                      onMouseEnter={() => setHoveredEvent(event)}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      {/* Header with Lane Color Bar */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div 
                            className="w-1 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: laneColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <span 
                                className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                                style={{ backgroundColor: laneColor }}
                              >
                                {groupKey}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Importance Badge */}
                        <div className={`w-3 h-3 rounded-full ${importance.badge} flex-shrink-0`} 
                             title={`${event.importance} importance`} />
                      </div>
                      
                      {/* Date Range */}
                      <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">{dateRange}</span>
                      </div>
                      
                      {/* Event Type */}
                      {event.event_type && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                          <BookOpen className="w-3 h-3" />
                          <span className="capitalize">{event.event_type}</span>
                        </div>
                      )}
                      
                      {/* Description Preview */}
                      {event.description && (
                        <div className="text-xs text-gray-500 mt-2 leading-relaxed overflow-hidden" 
                             style={{ 
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               maxHeight: '2.5em'
                             }}>
                          {event.description}
                        </div>
                      )}
                      
                      {/* Participants */}
                      {event.participants && event.participants.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span className="truncate">
                            {event.participants.slice(0, 2).join(', ')}
                            {event.participants.length > 2 && ` +${event.participants.length - 2} more`}
                          </span>
                        </div>
                      )}
                      
                      {/* Duration Indicator for Multi-day Events */}
                      {endDate && endDate.getTime() !== startDate.getTime() && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 rounded-b-xl"
                             style={{ color: laneColor }} />
                      )}
                    </div>
                  )
                })}

                {/* Rich Event Tooltip */}
                {hoveredEvent && (
                  <div
                    className="fixed bg-gray-900 text-white p-4 rounded-lg shadow-xl border z-50 max-w-sm"
                    style={{
                      left: Math.min(mousePosition.x + 15, window.innerWidth - 350),
                      top: Math.max(mousePosition.y - 10, 10),
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getDynamicLaneColor(
                          groupBy === 'character' ? hoveredEvent.participants?.[0] || 'No Character' :
                          groupBy === 'location' ? hoveredEvent.location || 'No Location' :
                          groupBy === 'importance' ? hoveredEvent.importance.charAt(0).toUpperCase() + hoveredEvent.importance.slice(1) :
                          hoveredEvent.lane,
                          dynamicLanes.indexOf(
                            groupBy === 'character' ? hoveredEvent.participants?.[0] || 'No Character' :
                            groupBy === 'location' ? hoveredEvent.location || 'No Location' :
                            groupBy === 'importance' ? hoveredEvent.importance.charAt(0).toUpperCase() + hoveredEvent.importance.slice(1) :
                            hoveredEvent.lane
                          )
                        )}}
                      />
                      <div>
                        <h3 className="font-bold text-sm text-white">{hoveredEvent.title}</h3>
                        <p className="text-xs text-gray-300">
                          {new Date(hoveredEvent.start_date || hoveredEvent.date).toLocaleDateString()}
                          {hoveredEvent.end_date && hoveredEvent.end_date !== hoveredEvent.start_date && 
                            ` - ${new Date(hoveredEvent.end_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    
                    {hoveredEvent.description && (
                      <p className="text-sm text-gray-200 mb-3 leading-relaxed">
                        {hoveredEvent.description.length > 150 
                          ? hoveredEvent.description.substring(0, 150) + '...'
                          : hoveredEvent.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Importance:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          hoveredEvent.importance === 'high' ? 'bg-red-500' :
                          hoveredEvent.importance === 'medium' ? 'bg-yellow-500' :
                          hoveredEvent.importance === 'critical' ? 'bg-red-600' :
                          'bg-blue-500'
                        }`}>
                          {hoveredEvent.importance}
                        </span>
                      </div>
                      
                      {hoveredEvent.location && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Location:</span>
                          <span className="text-gray-200">{hoveredEvent.location}</span>
                        </div>
                      )}
                      
                      {hoveredEvent.participants && hoveredEvent.participants.length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400">Characters:</span>
                          <div className="flex flex-wrap gap-1">
                            {hoveredEvent.participants.slice(0, 4).map((participant, index) => (
                              <span key={index} className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">
                                {participant}
                              </span>
                            ))}
                            {hoveredEvent.participants.length > 4 && (
                              <span className="text-gray-400">+{hoveredEvent.participants.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {hoveredEvent.tags && hoveredEvent.tags.length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {hoveredEvent.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show connections */}
                      {filteredEvents.filter((e: TimelineEvent) => 
                        e.id !== hoveredEvent.id && 
                        e.participants?.some(p => hoveredEvent.participants?.includes(p))
                      ).length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400">Connected:</span>
                          <span className="text-blue-300">
                            {filteredEvents.filter((e: TimelineEvent) => 
                              e.id !== hoveredEvent.id && 
                              e.participants?.some(p => hoveredEvent.participants?.includes(p))
                            ).length} related events
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'characters' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Character Journey View</h2>
                {/* Group events by character */}
                {Object.entries(
                  filteredEvents
                    .filter((event: TimelineEvent) => event.participants && event.participants.length > 0)
                    .reduce((acc: Record<string, TimelineEvent[]>, event: TimelineEvent) => {
                      event.participants.forEach(character => {
                        if (!acc[character]) acc[character] = []
                        acc[character].push(event)
                      })
                      return acc
                    }, {})
                ).map(([character, events]) => (
                  <div key={character} className="mb-8 bg-white rounded-xl border shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        {character}
                        <span className="text-sm text-gray-500 ml-auto">{events.length} events</span>
                      </h3>
                    </div>
                    <div className="p-6">
                      {/* Character timeline */}
                      <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                        <div className="space-y-6">
                          {events
                            .sort((a, b) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime())
                            .map((event, index) => (
                              <div key={event.id} className="relative flex items-start gap-4">
                                <div className="relative z-10 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <div className="flex-1 min-w-0 pb-6">
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                                      <span className="text-xs text-gray-500">
                                        {new Date(event.start_date || event.date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {event.description && (
                                      <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={`px-2 py-1 rounded-full ${
                                        event.importance === 'high' ? 'bg-red-100 text-red-700' :
                                        event.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {event.importance}
                                      </span>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                        {event.lane}
                                      </span>
                                      {event.location && (
                                        <span className="text-gray-500">📍 {event.location}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'chapters' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Story Structure View</h2>
                <div className="grid gap-6">
                  {/* Group events by importance/story beats */}
                  {['critical', 'high', 'medium', 'low'].map(importance => {
                    const importanceEvents = filteredEvents.filter((e: TimelineEvent) => e.importance === importance)
                    if (importanceEvents.length === 0) return null
                    
                    const importanceConfig = {
                      critical: { title: 'Major Plot Points', color: 'red', icon: '🎯' },
                      high: { title: 'Important Events', color: 'orange', icon: '⭐' },
                      medium: { title: 'Supporting Events', color: 'yellow', icon: '📚' },
                      low: { title: 'Background Events', color: 'blue', icon: '🌟' }
                    }
                    
                    const config = importanceConfig[importance as keyof typeof importanceConfig]
                    
                    return (
                      <div key={importance} className="bg-white rounded-xl border shadow-sm">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <span className="text-xl">{config.icon}</span>
                            {config.title}
                            <span className="text-sm text-gray-500 ml-auto">{importanceEvents.length} events</span>
                          </h3>
                        </div>
                        <div className="p-4">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {importanceEvents
                              .sort((a, b) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime())
                              .map((event) => (
                                <div
                                  key={event.id}
                                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">{event.lane}</span>
                                    <span className="text-gray-500">
                                      {new Date(event.start_date || event.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl space-y-4">
                {filteredEvents.sort((a: TimelineEvent, b: TimelineEvent) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime()).map((event: TimelineEvent) => (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event)
                            setIsCreating(false)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(event.start_date || event.date).toLocaleDateString()}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <span><MapPin className="w-3 h-3 inline mr-1" />{event.location}</span>
                        </>
                      )}
                      {event.participants && event.participants.length > 0 && (
                        <>
                          <span>•</span>
                          <span><Users className="w-3 h-3 inline mr-1" />{event.participants.length} participants</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Details Panel */}
        {(selectedEvent || editingEvent) && (
          <div className="w-96 border-l border-gray-200 bg-white">
            {editingEvent ? (
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {isCreating ? 'Create Event' : 'Edit Event'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(null)
                        setIsCreating(false)
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEvent}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      Save
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Name</label>
                    <input
                      type="text"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter event name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Describe what happens..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editingEvent.start_date}
                        onChange={(e) => setEditingEvent({...editingEvent, start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={editingEvent.end_date}
                        onChange={(e) => setEditingEvent({...editingEvent, end_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Lane</label>
                    <select
                      value={editingEvent.lane}
                      onChange={(e) => setEditingEvent({...editingEvent, lane: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {['world', 'plot', 'characters', 'locations', 'items'].map(lane => (
                        <option key={lane} value={lane}>{lane.charAt(0).toUpperCase() + lane.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Importance</label>
                    <select
                      value={editingEvent.importance}
                      onChange={(e) => setEditingEvent({...editingEvent, importance: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Where does this happen?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Participants</label>
                    <input
                      type="text"
                      value={editingEvent.participants?.join(', ') || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        participants: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Character names, separated by commas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <input
                      type="text"
                      value={editingEvent.tags?.join(', ') || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tags, separated by commas"
                    />
                  </div>
                </div>
              </div>
            ) : selectedEvent && (
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEvent(selectedEvent)
                        setIsCreating(false)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this event?')) {
                          dbDeleteEvent(selectedEvent.id)
                          setSelectedEvent(null)
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedEvent.importance === 'high' ? 'bg-red-100 text-red-700' :
                      selectedEvent.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedEvent.importance} importance
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full capitalize">
                      {selectedEvent.lane}
                    </span>
                  </div>

                  {selectedEvent.description && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Start Date</h3>
                      <p className="text-gray-700">{new Date(selectedEvent.start_date || selectedEvent.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">End Date</h3>
                      <p className="text-gray-700">{new Date(selectedEvent.end_date || selectedEvent.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                      <p className="text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Participants</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.participants.map((participant, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {continuityIssues.filter(issue => issue.eventId === selectedEvent.id).length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Continuity Issues
                      </h3>
                      <ul className="space-y-1">
                        {continuityIssues
                          .filter(issue => issue.eventId === selectedEvent.id)
                          .map((issue, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                              • {issue.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continuity Issues Panel */}
        {showContinuityPanel && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg z-10">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Continuity Checker</h3>
                <button
                  onClick={() => setShowContinuityPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {continuityIssues.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No continuity issues found!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {continuityIssues.map((issue, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      issue.severity === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          issue.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm ${
                            issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {issue.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Event: {currentTimelineEvents.find((e: TimelineEvent) => e.id === issue.eventId)?.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}