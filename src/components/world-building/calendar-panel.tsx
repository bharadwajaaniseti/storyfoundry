'use client'

import React, { useState, useEffect } from 'react'
import CalendarSystemsView from './calendar-systems-view'
import { 
  Plus, Search, Edit3, Trash2, Calendar as CalendarIcon, Clock, 
  Star, MapPin, Users, Scroll, Settings, Filter, Download, Upload,
  Globe, Moon, Sun, ChevronLeft, ChevronRight, MoreHorizontal,
  Link2, FileText, Tag, AlertCircle, CheckCircle, Eye, X, 
  GripVertical, Copy, RotateCcw, ArrowLeft, Calendar, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  dbId?: string // Optional database ID for tracking saved records
  allowOverflowWeeks?: boolean // Allow weeks to continue into the next month
  lengthBasedSeasons?: boolean // Use length-based seasons instead of date-based
  seasonalOffset?: number // Offset in days for seasonal start
}

interface Era {
  id: string
  name: string
  startYear: number
  endYear?: number
  description: string
  color: string
  abbreviation?: string // Era abbreviation (e.g., "BCE", "CE")
  countBackwards?: boolean // Whether to count years backwards
}

interface Month {
  id: string
  name: string
  days: number
  order: number
  season?: string
  description?: string
  abbreviation?: string // Short name for the month (e.g., "Jan", "Feb")
  leapYearDivisor?: number // Years divisible by this number get extra days
  leapYearExclusion?: number // Exclude years divisible by this number
  leapYearInclusion?: number // Always include years divisible by this number
  offsetYears?: number // Offset in years for leap year calculations
}

interface Moon {
  id: string
  name: string
  cycle: number // days for full cycle
  color: string
  phase: 'new' | 'waxing' | 'full' | 'waning'
  days?: number // additional days property
  roundingMode?: 'nearest' | 'up' | 'down' | 'none' // rounding mode for calculations
  reverseCycle?: boolean // whether to reverse the cycle direction
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
  console.log('🎯 CalendarPanel is rendering! Project ID:', projectId)
  
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
  
  // Connection/Linking states
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [connectionType, setConnectionType] = useState<'characters' | 'locations' | 'organizations'>('characters')
  const [availableElements, setAvailableElements] = useState<WorldElement[]>([])
  const [connectionSearchTerm, setConnectionSearchTerm] = useState('')
  const [showCreateNewElement, setShowCreateNewElement] = useState(false)
  const [newElementName, setNewElementName] = useState('')
  const [newElementCategory, setNewElementCategory] = useState('characters')
  const [recentlyViewedElements, setRecentlyViewedElements] = useState<WorldElement[]>([])
  
  const elementCategories = ['characters', 'locations', 'organizations', 'items', 'species', 'cultures', 'languages', 'religions', 'magic', 'systems']
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false)
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarDescription, setNewCalendarDescription] = useState('')
  const [editingCalendarSystem, setEditingCalendarSystem] = useState<CalendarSystem | null>(null)

  const supabase = createSupabaseClient()

  console.log('🎯 Calendar Panel state:', {
    currentView,
    calendarSystemsCount: calendarSystems.length,
    activeCalendarSystem: activeCalendarSystem?.name || 'None',
    viewMode
  })

  useEffect(() => {
    console.log('=== Calendar Panel useEffect triggered ===')
    console.log('Project ID:', projectId)
    fetchEvents()
    fetchCalendarSystems()
    fetchLinkedElements()
    loadAvailableElements()
  }, [projectId])

  // Listen for calendar type selection event from sidebar
  useEffect(() => {
    const handleCalendarTypeSelection = (e: CustomEvent) => {
      if (e.detail?.projectId === projectId) {
        setCurrentView('systems')
      }
    }

    window.addEventListener('openCalendarTypeSelection', handleCalendarTypeSelection as EventListener)
    return () => window.removeEventListener('openCalendarTypeSelection', handleCalendarTypeSelection as EventListener)
  }, [projectId])

  // Listen for calendar system selection from sidebar
  useEffect(() => {
    const handleCalendarSystemSelection = (e: CustomEvent) => {
      console.log('🎯 CALENDAR: Received calendarSystemSelected event:', e.detail)
      if (e.detail?.projectId === projectId) {
        const { calendarSystem } = e.detail
        console.log('🎯 CALENDAR: Setting active calendar system:', calendarSystem.name)
        
        // Find the calendar system in our loaded systems
        const foundSystem = calendarSystems.find(sys => sys.id === calendarSystem.id || (sys as any).dbId === calendarSystem.id)
        if (foundSystem) {
          console.log('🎯 CALENDAR: Found system in state:', foundSystem.name)
          setActiveCalendarSystem(foundSystem)
          setCurrentView('calendar')
          
          // Set the current era if available
          if (foundSystem.eras && foundSystem.eras.length > 0) {
            setCurrentEra(foundSystem.eras[0])
          }
        } else {
          console.log('🎯 CALENDAR: System not found in state, trying to create from attributes')
          // If not found, try to create from element attributes
          if (calendarSystem.attributes) {
            const systemFromAttributes = calendarSystem.attributes as CalendarSystem
            setActiveCalendarSystem(systemFromAttributes)
            setCurrentView('calendar')
            
            if (systemFromAttributes.eras && systemFromAttributes.eras.length > 0) {
              setCurrentEra(systemFromAttributes.eras[0])
            }
          }
        }
      }
    }

    window.addEventListener('calendarSystemSelected', handleCalendarSystemSelection as EventListener)
    return () => window.removeEventListener('calendarSystemSelected', handleCalendarSystemSelection as EventListener)
  }, [projectId, calendarSystems])

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
      console.log('=== FETCH: Fetching calendar systems ===')
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'calendar_system')

      if (error) {
        console.error('Fetch calendar systems error:', error)
        throw error
      }
      
      console.log('Raw calendar systems data from DB:', data)
      
      if (data && data.length > 0) {
        const systems = data.map(item => {
          console.log('Processing calendar system item:', item)
          console.log('Item attributes:', item.attributes)
          const processedSystem = {
            ...item.attributes,
            dbId: item.id // Store the database ID for updates
          } as CalendarSystem & { dbId: string }
          console.log('Processed system:', processedSystem)
          return processedSystem
        })
        
        console.log('Processed calendar systems:', systems)
        console.log('Setting calendar systems state...')
        setCalendarSystems(systems)
        console.log('Setting active calendar system to:', systems[0])
        setActiveCalendarSystem(systems[0])
        
        if (systems[0]?.eras && systems[0].eras.length > 0) {
          setCurrentEra(systems[0].eras[0])
          console.log('Set current era:', systems[0].eras[0])
        }
        
        console.log('Calendar systems loaded successfully')
        console.log('Final state - systems length:', systems.length)
        console.log('Final state - active system:', systems[0])
      } else {
        console.log('No calendar systems found, creating default')
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
    console.log('=== Calendar system click ===')
    console.log('Calendar systems available:', calendarSystems.length)
    console.log('Calendar systems:', calendarSystems.map(sys => ({ id: sys.id, name: sys.name })))
    
    if (calendarSystems.length === 0) {
      // No calendars exist, create default and show systems view
      console.log('No calendar systems found, showing creation view')
      createDefaultCalendarSystem()
      setCurrentView('systems')
    } else if (calendarSystems.length === 1) {
      // Only one calendar exists, show creation view to add more
      console.log('One calendar system found, showing creation view')
      setCurrentView('systems')
    } else {
      // Multiple calendars exist, show selection view
      console.log('Multiple calendar systems found, showing selection view')
      setCurrentView('systems')
    }
  }

  // Debug function to check database
  const debugCalendarSystems = async () => {
    try {
      console.log('=== DEBUG: Checking calendar systems in database ===')
      console.log('Project ID:', projectId)
      console.log('Current state:')
      console.log('- calendarSystems.length:', calendarSystems.length)
      console.log('- activeCalendarSystem:', activeCalendarSystem)
      console.log('- currentView:', currentView)
      console.log('- currentEra:', currentEra)
      
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'calendar_system')

      if (error) {
        console.error('Database query error:', error)
        return
      }

      console.log('Found calendar systems:', data?.length || 0)
      console.log('Calendar systems data:', data)
      
      // Also check all world_elements for this project to see what categories exist
      const { data: allElements, error: allError } = await supabase
        .from('world_elements')
        .select('id, category, name, created_at')
        .eq('project_id', projectId)

      if (!allError) {
        console.log('All world elements for project:', allElements)
        const categories = [...new Set(allElements?.map(el => el.category) || [])]
        console.log('Categories found:', categories)
      }
    } catch (error) {
      console.error('Debug query failed:', error)
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

      const updatedSystems = [...calendarSystems.filter(sys => sys.dbId !== data.id), calendarData]
      setCalendarSystems(updatedSystems)
      setActiveCalendarSystem(calendarData)
      setCurrentEra(calendarData.eras[0])
      
      setCurrentView('calendar')
      setIsCreatingCalendar(false)
      setEditingCalendarSystem(null)
      setNewCalendarName('')
      setNewCalendarDescription('')

      // Broadcast the change for sidebar update
      window.dispatchEvent(new CustomEvent('calendarSystemCreated', { 
        detail: { calendarSystem: data, projectId } 
      }))
      
      console.log('🎯 CALENDAR: Calendar system created and event dispatched')
    } catch (error) {
      console.error('Error saving calendar system:', error)
    }
  }

  const handleUpdateCalendarSystem = async () => {
    if (!editingCalendarSystem || !editingCalendarSystem.dbId) return

    try {
      const { data, error } = await supabase
        .from('world_elements')
        .update({
          name: editingCalendarSystem.name,
          description: editingCalendarSystem.description,
          attributes: editingCalendarSystem,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCalendarSystem.dbId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      const updatedSystems = calendarSystems.map(sys => 
        sys.dbId === editingCalendarSystem.dbId ? editingCalendarSystem : sys
      )
      setCalendarSystems(updatedSystems)
      setActiveCalendarSystem(editingCalendarSystem)
      
      // Reset editing state
      setEditingCalendarSystem(null)
      
      console.log('Calendar system updated successfully')
      alert('Calendar system updated successfully!')
    } catch (error) {
      console.error('Error updating calendar system:', error)
      alert('Failed to update calendar system. Please try again.')
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

  // Connection/Linking functions
  const loadAvailableElements = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .neq('category', 'calendar') // Exclude calendar events
        .order('name')

      if (error) throw error
      setAvailableElements(data || [])
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }

  const handleOpenConnectionModal = (type: 'characters' | 'locations' | 'organizations') => {
    setConnectionType(type)
    setShowConnectionModal(true)
    setConnectionSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
    setNewElementCategory(type === 'organizations' ? 'organizations' : type)
  }

  const handleCloseConnectionModal = () => {
    setShowConnectionModal(false)
    setConnectionSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
  }

  const handleConnectElement = async (element: WorldElement) => {
    if (!editingEvent) return

    try {
      // Add to recently viewed
      setRecentlyViewedElements(prev => {
        const filtered = prev.filter(e => e.id !== element.id)
        return [element, ...filtered].slice(0, 5)
      })

      // Update event with new connection based on type
      const currentConnections = editingEvent.attributes?.[`connected${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)}`] || ''
      const connectionsList = currentConnections ? currentConnections.split(',').map((s: string) => s.trim()) : []
      
      if (!connectionsList.includes(element.name)) {
        connectionsList.push(element.name)
        const updatedConnections = connectionsList.join(', ')
        
        setEditingEvent(prev => prev ? {
          ...prev,
          attributes: {
            ...prev.attributes,
            [`connected${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)}`]: updatedConnections
          }
        } : null)
      }

      handleCloseConnectionModal()
    } catch (error) {
      console.error('Error connecting element:', error)
    }
  }

  const handleCreateAndConnectElement = async () => {
    if (!newElementName.trim() || !editingEvent) return

    try {
      const supabase = createSupabaseClient()
      
      // Create the new element
      const newElement = {
        project_id: projectId,
        category: newElementCategory,
        name: newElementName.trim(),
        description: '',
        attributes: {},
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error

      // Refresh the available elements list
      await loadAvailableElements()

      // Connect to the new element
      await handleConnectElement(data)
      
      // Reset form
      setNewElementName('')
      setNewElementCategory(connectionType)
      
    } catch (error) {
      console.error('Error creating and connecting element:', error)
    }
  }

  const getFilteredElements = () => {
    const filtered = availableElements.filter(element => {
      const matchesSearch = !connectionSearchTerm.trim() || 
        element.name.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
        element.category.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(connectionSearchTerm.toLowerCase())
      
      const matchesCategory = connectionType === 'organizations' ? 
        element.category === 'organizations' :
        element.category === connectionType
      
      return matchesSearch && matchesCategory
    })
    
    if (!connectionSearchTerm.trim()) return filtered.slice(0, 10)
    return filtered
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
        // Basic info
        type: 'event',
        priority: 'medium',
        significance: 'minor',
        location: '',
        
        // Date & Time
        era: currentEra?.id || '',
        year: currentYear || new Date().getFullYear(),
        month: '',
        day: 1,
        time: '',
        duration: 1,
        status: 'planned',
        isRecurring: false,
        recurrencePattern: 'yearly',
        recurrenceInterval: 1,
        
        // Details
        participants: '',
        objectives: '',
        outcomes: '',
        consequences: '',
        culturalImpact: 'none',
        historicalScope: 'local',
        additionalNotes: '',
        
        // Connections
        connectedCharacters: '',
        connectedLocations: '',
        connectedOrganizations: '',
        precedingEvents: '',
        concurrentEvents: '',
        followingEvents: '',
        eventRelations: [],
        connectionStrength: 'moderate',
        sources: '',
        
        // Legacy/System fields (keeping for compatibility)
        date: '',
        recurring: false,
        recurrence_pattern: '',
        attendees: '',
        completed: false,
        calendar_system_id: activeCalendarSystem?.id,
        era_id: currentEra?.id,
        custom_year: currentYear,
        custom_month: currentMonth,
        custom_day: 1,
        linked_elements: [],
        moon_phase: '',
        season: '',
        weather: ''
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
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-pulse" />
          <div className="text-gray-500">Loading enhanced calendar...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Main Calendar View */}
      {currentView === 'calendar' && (
        <div className="h-full bg-gray-50 flex">
      {/* Enhanced Sidebar */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Story Calendar</h3>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  const newEvent = {
                    id: '',
                    name: '',
                    description: '',
                    attributes: {
                      custom_year: '',
                      significance: 'minor',
                      type: 'general',
                      priority: 'medium',
                      completed: false
                    },
                    tags: [],
                    created_at: '',
                    updated_at: ''
                  }
                  setEditingEvent(newEvent)
                  setIsCreating(true)
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Event
              </Button>
            </div>
          </div>
          
          {/* Calendar System Display */}
          <div className="mb-4">
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  {activeCalendarSystem ? activeCalendarSystem.name : 'No Calendar System Selected'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Debug Button (temporary) */}
          
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
                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
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
                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
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
                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
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
                onClick = {() => {
                              const newEvent = {
                                id: '',
                                name: '',
                                description: '',
                                category: 'calendar',
                                project_id: projectId,
                                attributes: {
                                  date: new Date().toISOString().split('T')[0],
                                  event_type: 'story',
                                  priority: 'medium'
                                },
                                tags: [],
                                created_at: '',
                                updated_at: ''
                              }
                              setEditingEvent(newEvent)
                              setIsCreating(true)
                            }}
              >
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 ${
                    selectedEvent?.id === event.id
                      ? 'ring-2 ring-orange-400 shadow-orange-200/50'
                      : 'hover:shadow-gray-200/60'
                  }`}
                  onClick={() => {
                    setSelectedEvent(event)
                    setEditingEvent(null)
                    setIsCreating(false)
                  }}
                >
                  {/* Floating status badge */}
                  {(event.attributes?.completed || linkedElements[event.id]?.length > 0) && (
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      {event.attributes?.completed && (
                        <div className="w-6 h-6 bg-green-500 rounded-full shadow-lg flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {linkedElements[event.id]?.length > 0 && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full shadow-lg flex items-center justify-center">
                          <Link2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Color stripe */}
                  <div className={`h-2 w-full rounded-t-xl ${
                    event.attributes?.type === 'battle' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    event.attributes?.type === 'celebration' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    event.attributes?.type === 'political' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    event.attributes?.type === 'discovery' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    event.attributes?.type === 'personal' ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
                    'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`} />
                  
                  <div className="p-6">
                    {/* Header section */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {event.name}
                          </h3>
                          {event.attributes?.significance && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                              {getSignificanceIcon(event.attributes.significance)}
                              <span className="text-xs font-medium text-gray-600 capitalize">
                                {event.attributes.significance}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-gray-600 leading-relaxed line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata section */}
                    <div className="space-y-3">
                      {/* Date and time */}
                      {(event.attributes?.custom_year || event.attributes?.date || event.attributes?.time) && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {event.attributes?.custom_year && currentEra && (
                                <span>{currentEra.name} {event.attributes.custom_year}</span>
                              )}
                              {event.attributes?.date && (
                                <span>{new Date(event.attributes.date).toLocaleDateString()}</span>
                              )}
                            </div>
                            {event.attributes?.time && (
                              <div className="text-sm text-gray-600">
                                at {event.attributes.time}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Type and priority */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              event.attributes?.type === 'battle' ? 'bg-red-500' :
                              event.attributes?.type === 'celebration' ? 'bg-green-500' :
                              event.attributes?.type === 'political' ? 'bg-blue-500' :
                              event.attributes?.type === 'discovery' ? 'bg-purple-500' :
                              event.attributes?.type === 'personal' ? 'bg-pink-500' :
                              'bg-orange-500'
                            }`} />
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {event.attributes?.type || 'general'}
                            </span>
                          </div>
                          
                          {event.attributes?.priority && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                              <div className={`w-3 h-3 rounded-full ${
                                event.attributes.priority === 'critical' ? 'bg-red-500' :
                                event.attributes.priority === 'high' ? 'bg-orange-500' :
                                event.attributes.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} />
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {event.attributes.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {event.tags.slice(0, 5).map((tag, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-gray-200 text-gray-700 shadow-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                          {event.tags.length > 5 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 border border-gray-200 text-gray-500">
                              +{event.tags.length - 5} more
                            </span>
                          )}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {editingEvent ? (
          // Enhanced Edit/Create Form
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100 px-8 py-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {isCreating ? 'Create New Event' : 'Edit Event'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {isCreating ? 'Add a new event to your world\'s timeline' : 'Update event details and information'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isCreating ? 'Create Event' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
              
              <Tabs defaultValue="basic" className="space-y-8">
                <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-600 w-full">
                  <TabsTrigger 
                    value="basic" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm gap-2 flex-1"
                  >
                    <FileText className="w-4 h-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="timing" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm gap-2 flex-1"
                  >
                    <Clock className="w-4 h-4" />
                    Date & Time
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm gap-2 flex-1"
                  >
                    <Scroll className="w-4 h-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="links" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm gap-2 flex-1"
                  >
                    <Link2 className="w-4 h-4" />
                    Connections
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-8">
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600" />
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            Event Title *
                          </Label>
                          <Input
                            value={editingEvent.name}
                            onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                            placeholder="Enter event title..."
                            className="w-full h-14 text-lg font-semibold border-2 border-gray-200 focus:border-orange-400 bg-white/70 transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                              <Scroll className="w-4 h-4 text-white" />
                            </div>
                            Description
                          </Label>
                          <Textarea
                            value={editingEvent.description}
                            onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                            placeholder="Describe the event in detail..."
                            className="w-full h-32 border-2 border-gray-200 focus:border-orange-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-orange-500" />
                              Event Type
                            </Label>
                            <Select
                              value={editingEvent.attributes?.type ?? 'general'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, type: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-400 bg-white/70">
                                <SelectValue placeholder="Select event type..." />
                              </SelectTrigger>
                              <SelectContent className="z-50 max-h-[300px] overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="general">🎭 General Event</SelectItem>
                                <SelectItem value="battle">⚔️ Battle</SelectItem>
                                <SelectItem value="celebration">🎉 Celebration</SelectItem>
                                <SelectItem value="discovery">🔍 Discovery</SelectItem>
                                <SelectItem value="political">🏛️ Political Event</SelectItem>
                                <SelectItem value="personal">👤 Personal Event</SelectItem>
                                <SelectItem value="birth">👶 Birth</SelectItem>
                                <SelectItem value="death">💀 Death</SelectItem>
                                <SelectItem value="coronation">👑 Coronation</SelectItem>
                                <SelectItem value="prophecy">🔮 Prophecy</SelectItem>
                                <SelectItem value="disaster">🌪️ Disaster</SelectItem>
                                <SelectItem value="festival">🎪 Festival</SelectItem>
                                <SelectItem value="holiday">🎄 Holiday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              Priority
                            </Label>
                            <Select
                              value={editingEvent.attributes?.priority ?? 'medium'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, priority: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-400 bg-white/70">
                                <SelectValue placeholder="Select priority level..." />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="low">🟢 Low Priority</SelectItem>
                                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                                <SelectItem value="high">🟠 High Priority</SelectItem>
                                <SelectItem value="critical">🔴 Critical Priority</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <Star className="w-4 h-4 text-orange-500" />
                              Significance
                            </Label>
                            <Select
                              value={editingEvent.attributes?.significance || 'minor'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, significance: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-orange-400 bg-white/70">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="minor">⭐ Minor Event</SelectItem>
                                <SelectItem value="major">🌟 Major Event</SelectItem>
                                <SelectItem value="critical">💫 Critical Event</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              Location
                            </Label>
                            <Input
                              value={editingEvent.attributes?.location || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, location: e.target.value}
                              })}
                              placeholder="Where does this event take place?"
                              className="h-12 border-2 border-gray-200 focus:border-orange-400 bg-white/70"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timing" className="space-y-8">
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600" />
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <CalendarIcon className="w-4 h-4 text-white" />
                            </div>
                            Event Date *
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Era</Label>
                              <Select
                                value={editingEvent.attributes?.era || currentEra?.id || ''}
                                onValueChange={(value) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, era: value}
                                })}
                              >
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70">
                                  <SelectValue placeholder="Select era" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                  {activeCalendarSystem?.eras?.map((era: Era) => (
                                    <SelectItem key={era.id} value={era.id}>
                                      {era.name} ({era.abbreviation || era.id})
                                    </SelectItem>
                                  )) || <SelectItem value="">No eras defined</SelectItem>}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Year</Label>
                              <Input
                                type="number"
                                value={editingEvent.attributes?.year || ''}
                                onChange={(e) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, year: parseInt(e.target.value) || 0}
                                })}
                                placeholder="Year"
                                className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Month</Label>
                              <Select
                                value={editingEvent.attributes?.month || ''}
                                onValueChange={(value) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, month: value}
                                })}
                              >
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70">
                                  <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                  {activeCalendarSystem?.months?.map((month: Month) => (
                                    <SelectItem key={month.id} value={month.id}>
                                      {month.name}
                                    </SelectItem>
                                  )) || <SelectItem value="">No months defined</SelectItem>}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Day</Label>
                            <Input
                              type="number"
                              value={editingEvent.attributes?.day || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, day: parseInt(e.target.value) || 1}
                              })}
                              placeholder="Day of month"
                              min="1"
                              max="31"
                              className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Time of Day</Label>
                            <Input
                              type="time"
                              value={editingEvent.attributes?.time || ''}
                              onChange={(e) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, time: e.target.value}
                              })}
                              className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            Duration & Timing
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Duration (in days)</Label>
                              <Input
                                type="number"
                                value={editingEvent.attributes?.duration || ''}
                                onChange={(e) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, duration: parseInt(e.target.value) || 1}
                                })}
                                placeholder="1"
                                min="1"
                                className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Event Status</Label>
                              <Select
                                value={editingEvent.attributes?.status || 'planned'}
                                onValueChange={(value) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, status: value}
                                })}
                              >
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-400 bg-white/70">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                  <SelectItem value="planned">📅 Planned</SelectItem>
                                  <SelectItem value="ongoing">🔄 Ongoing</SelectItem>
                                  <SelectItem value="completed">✅ Completed</SelectItem>
                                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                                  <SelectItem value="postponed">⏸️ Postponed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="isRecurring"
                              checked={editingEvent.attributes?.isRecurring || false}
                              onCheckedChange={(checked) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, isRecurring: checked}
                              })}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                              Recurring Event
                            </Label>
                          </div>
                          
                          {editingEvent.attributes?.isRecurring && (
                            <div className="ml-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Recurrence Pattern</Label>
                                  <Select
                                    value={editingEvent.attributes?.recurrencePattern || 'yearly'}
                                    onValueChange={(value) => setEditingEvent({
                                      ...editingEvent, 
                                      attributes: {...editingEvent.attributes, recurrencePattern: value}
                                    })}
                                  >
                                    <SelectTrigger className="h-10 border border-blue-300 bg-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                      <SelectItem value="daily">Daily</SelectItem>
                                      <SelectItem value="weekly">Weekly</SelectItem>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="yearly">Yearly</SelectItem>
                                      <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Interval</Label>
                                  <Input
                                    type="number"
                                    value={editingEvent.attributes?.recurrenceInterval || 1}
                                    onChange={(e) => setEditingEvent({
                                      ...editingEvent, 
                                      attributes: {...editingEvent.attributes, recurrenceInterval: parseInt(e.target.value) || 1}
                                    })}
                                    placeholder="1"
                                    min="1"
                                    className="h-10 border border-blue-300 bg-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="space-y-8">
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600" />
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            Participants
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.participants || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, participants: e.target.value}
                            })}
                            placeholder="List the key participants, characters, or groups involved in this event..."
                            className="w-full h-24 border-2 border-gray-200 focus:border-purple-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            Objectives & Goals
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.objectives || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, objectives: e.target.value}
                            })}
                            placeholder="What were the main objectives or goals of this event?"
                            className="w-full h-24 border-2 border-gray-200 focus:border-purple-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            Outcomes & Results
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.outcomes || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, outcomes: e.target.value}
                            })}
                            placeholder="Describe what actually happened and the immediate results..."
                            className="w-full h-32 border-2 border-gray-200 focus:border-purple-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <ArrowLeft className="w-4 h-4 text-white transform rotate-45" />
                            </div>
                            Long-term Consequences
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.consequences || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, consequences: e.target.value}
                            })}
                            placeholder="What were the long-term effects and consequences of this event?"
                            className="w-full h-32 border-2 border-gray-200 focus:border-purple-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                              <Scroll className="w-4 h-4 text-purple-500" />
                              Cultural Impact
                            </Label>
                            <Select
                              value={editingEvent.attributes?.culturalImpact || 'none'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, culturalImpact: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 bg-white/70">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="none">No Cultural Impact</SelectItem>
                                <SelectItem value="minor">Minor Cultural Change</SelectItem>
                                <SelectItem value="moderate">Moderate Cultural Shift</SelectItem>
                                <SelectItem value="major">Major Cultural Revolution</SelectItem>
                                <SelectItem value="legendary">Legendary/Mythical Status</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                              <Globe className="w-4 h-4 text-purple-500" />
                              Historical Scope
                            </Label>
                            <Select
                              value={editingEvent.attributes?.historicalScope || 'local'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, historicalScope: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-400 bg-white/70">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="personal">Personal/Individual</SelectItem>
                                <SelectItem value="local">Local Community</SelectItem>
                                <SelectItem value="regional">Regional</SelectItem>
                                <SelectItem value="national">National</SelectItem>
                                <SelectItem value="continental">Continental</SelectItem>
                                <SelectItem value="global">Global/World-changing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            Additional Notes
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.additionalNotes || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, additionalNotes: e.target.value}
                            })}
                            placeholder="Any additional details, sources, or narrative elements..."
                            className="w-full h-32 border-2 border-gray-200 focus:border-purple-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-500" />
                            Additional Tags
                          </Label>
                          <Input
                            value={editingEvent.tags?.join(', ') || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            })}
                            placeholder="Enter tags separated by commas (e.g., war, politics, magic)"
                            className="h-12 border-2 border-gray-200 focus:border-purple-400 bg-white/70"
                          />
                          <p className="text-xs text-gray-500 mt-2">Tags help organize and filter events in your timeline</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="links" className="space-y-8">
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-600" />
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            Connected Characters
                          </Label>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border-2 border-gray-200 rounded-lg bg-white/70">
                              {editingEvent.attributes?.connectedCharacters ? 
                                editingEvent.attributes.connectedCharacters.split(',').map((char: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                    {char.trim()}
                                  </Badge>
                                )) : (
                                  <span className="text-gray-400 text-sm">No characters connected</span>
                                )
                              }
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleOpenConnectionModal('characters')}
                              className="w-full h-12 border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Character Connection
                            </Button>
                            <p className="text-xs text-gray-500">Characters directly involved or affected by this event</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            Connected Locations
                          </Label>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border-2 border-gray-200 rounded-lg bg-white/70">
                              {editingEvent.attributes?.connectedLocations ? 
                                editingEvent.attributes.connectedLocations.split(',').map((location: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                    {location.trim()}
                                  </Badge>
                                )) : (
                                  <span className="text-gray-400 text-sm">No locations connected</span>
                                )
                              }
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleOpenConnectionModal('locations')}
                              className="w-full h-12 border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Location Connection
                            </Button>
                            <p className="text-xs text-gray-500">Places where this event occurred or that were affected</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Globe className="w-4 h-4 text-white" />
                            </div>
                            Connected Organizations
                          </Label>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border-2 border-gray-200 rounded-lg bg-white/70">
                              {editingEvent.attributes?.connectedOrganizations ? 
                                editingEvent.attributes.connectedOrganizations.split(',').map((org: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                    {org.trim()}
                                  </Badge>
                                )) : (
                                  <span className="text-gray-400 text-sm">No organizations connected</span>
                                )
                              }
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleOpenConnectionModal('organizations')}
                              className="w-full h-12 border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Organization Connection
                            </Button>
                            <p className="text-xs text-gray-500">Factions, guilds, governments, or groups involved</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Link2 className="w-4 h-4 text-white" />
                            </div>
                            Related Events
                          </Label>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Preceding Events</Label>
                              <Input
                                value={editingEvent.attributes?.precedingEvents || ''}
                                onChange={(e) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, precedingEvents: e.target.value}
                                })}
                                placeholder="Events that led to this one"
                                className="h-12 border-2 border-gray-200 focus:border-green-400 bg-white/70"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Concurrent Events</Label>
                              <Input
                                value={editingEvent.attributes?.concurrentEvents || ''}
                                onChange={(e) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, concurrentEvents: e.target.value}
                                })}
                                placeholder="Events happening at the same time"
                                className="h-12 border-2 border-gray-200 focus:border-green-400 bg-white/70"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Following Events</Label>
                              <Input
                                value={editingEvent.attributes?.followingEvents || ''}
                                onChange={(e) => setEditingEvent({
                                  ...editingEvent, 
                                  attributes: {...editingEvent.attributes, followingEvents: e.target.value}
                                })}
                                placeholder="Events that resulted from this one"
                                className="h-12 border-2 border-gray-200 focus:border-green-400 bg-white/70"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Star className="w-4 h-4 text-white" />
                            </div>
                            Connection Strength
                          </Label>
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">How important is this connection to the event?</Label>
                            <Select
                              value={editingEvent.attributes?.connectionStrength || 'moderate'}
                              onValueChange={(value) => setEditingEvent({
                                ...editingEvent, 
                                attributes: {...editingEvent.attributes, connectionStrength: value}
                              })}
                            >
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-400 bg-white/70">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <SelectItem value="weak">🔗 Weak Connection</SelectItem>
                                <SelectItem value="moderate">🔗🔗 Moderate Connection</SelectItem>
                                <SelectItem value="strong">🔗🔗🔗 Strong Connection</SelectItem>
                                <SelectItem value="critical">⛓️ Critical Connection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-lg font-bold text-gray-900 mb-4 block flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            Sources & References
                          </Label>
                          <Textarea
                            value={editingEvent.attributes?.sources || ''}
                            onChange={(e) => setEditingEvent({
                              ...editingEvent, 
                              attributes: {...editingEvent.attributes, sources: e.target.value}
                            })}
                            placeholder="List any sources, references, or inspirations for this event..."
                            className="w-full h-24 border-2 border-gray-200 focus:border-green-400 bg-white/70 resize-none transition-all duration-200"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              </div>
            </div>
          </div>
        ) : selectedEvent ? (
          // Enhanced Event Details View
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Event Details View - Improved Bento Grid */}
              <div className="space-y-6">
                {/* Main Bento Grid Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Main Event Information Card - Large */}
                  <Card className="lg:col-span-2 border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600" />
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Description Section */}
                        <div>
                          <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Description</Label>
                          <p className="text-gray-900 text-base leading-relaxed mt-2">
                            {selectedEvent.description || 'No description provided.'}
                          </p>
                        </div>
                        
                        {/* Objectives Section */}
                        {selectedEvent.attributes?.objectives && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Objectives</Label>
                            <p className="text-gray-900 text-base leading-relaxed mt-2">
                              {selectedEvent.attributes.objectives}
                            </p>
                          </div>
                        )}

                        {/* Event Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                              {selectedEvent.attributes?.type === 'battle' ? '⚔️' :
                               selectedEvent.attributes?.type === 'celebration' ? '🎉' :
                               selectedEvent.attributes?.type === 'political' ? '🏛️' : '🎭'}
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Event Type</div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {selectedEvent.attributes?.type || 'General Event'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Significance</div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {selectedEvent.attributes?.significance || 'Minor'}
                              </div>
                            </div>
                          </div>

                          {selectedEvent.attributes?.location && (
                            <div className="flex items-center gap-3 md:col-span-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Location</div>
                                <div className="font-semibold text-gray-900">
                                  {selectedEvent.attributes.location}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date & Time Information Card - Compact */}
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600" />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Date & Time</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedEvent.attributes?.era && (
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Era</Label>
                            <p className="text-gray-900 font-semibold">{selectedEvent.attributes.era}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          {selectedEvent.attributes?.year && (
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase">Year</Label>
                              <p className="text-gray-900 font-semibold">{selectedEvent.attributes.year}</p>
                            </div>
                          )}
                          {selectedEvent.attributes?.month && (
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase">Month</Label>
                              <p className="text-gray-900 font-semibold">{selectedEvent.attributes.month}</p>
                            </div>
                          )}
                          {selectedEvent.attributes?.day && (
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase">Day</Label>
                              <p className="text-gray-900 font-semibold">{selectedEvent.attributes.day}</p>
                            </div>
                          )}
                          {selectedEvent.attributes?.time && (
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase">Time</Label>
                              <p className="text-gray-900 font-semibold">{selectedEvent.attributes.time}</p>
                            </div>
                          )}
                        </div>

                        {selectedEvent.attributes?.duration && (
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</Label>
                            <p className="text-gray-900 font-semibold">{selectedEvent.attributes.duration} days</p>
                          </div>
                        )}

                        {selectedEvent.attributes?.status && (
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</Label>
                            <Badge className={`mt-1 ${
                              selectedEvent.attributes.status === 'completed' ? 'bg-green-100 text-green-800' :
                              selectedEvent.attributes.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                              selectedEvent.attributes.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedEvent.attributes.status}
                            </Badge>
                          </div>
                        )}

                        {selectedEvent.attributes?.isRecurring && (
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recurrence</Label>
                            <p className="text-gray-900 font-semibold text-sm">
                              {selectedEvent.attributes.recurrencePattern} 
                              {selectedEvent.attributes.recurrenceInterval > 1 && ` (every ${selectedEvent.attributes.recurrenceInterval})`}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Connections & Relationships - Simplified */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-600" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Connections & Relationships</h3>
                    </div>
                    
                    {/* Enhanced Connection Display */}
                    {(selectedEvent as any).connections && (selectedEvent as any).connections.length > 0 ? (
                      <div className="space-y-6">
                        {/* Group connections by type */}
                        {['character', 'location', 'organization'].map(type => {
                          const typeConnections = (selectedEvent as any).connections.filter((conn: any) => conn.elementType === type);
                          if (typeConnections.length === 0) return null;
                          
                          return (
                            <div key={type}>
                              <Label className="text-sm font-medium text-gray-600 mb-3 block capitalize flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  type === 'character' ? 'bg-blue-500' : 
                                  type === 'location' ? 'bg-green-500' : 'bg-purple-500'
                                }`} />
                                {type}s ({typeConnections.length})
                              </Label>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {typeConnections.map((connection: any, index: number) => (
                                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <Badge variant="secondary" className={`${
                                          type === 'character' ? 'bg-blue-100 text-blue-800' : 
                                          type === 'location' ? 'bg-green-100 text-green-800' : 
                                          'bg-purple-100 text-purple-800'
                                        } mb-2`}>
                                          {connection.elementName}
                                        </Badge>
                                        
                                        {/* Connection Strength Visual */}
                                        <div className="flex items-center gap-1 mb-2">
                                          {[1, 2, 3, 4, 5].map(level => (
                                            <div
                                              key={level}
                                              className={`w-2 h-2 rounded-full ${
                                                level <= (connection.connectionStrength || 3) 
                                                  ? 'bg-orange-400' 
                                                  : 'bg-gray-200'
                                              }`}
                                            />
                                          ))}
                                          <span className="text-xs text-gray-500 ml-2">
                                            {connection.connectionStrength === 5 ? 'Critical' :
                                             connection.connectionStrength === 4 ? 'Major' :
                                             connection.connectionStrength === 3 ? 'Moderate' :
                                             connection.connectionStrength === 2 ? 'Minor' :
                                             'Minimal'}
                                          </span>
                                        </div>
                                        
                                        {/* Relationship Type */}
                                        {connection.relationshipType && (
                                          <Badge variant="outline" className={`text-xs ${
                                            connection.relationshipType === 'ally' ? 'border-green-300 text-green-700' :
                                            connection.relationshipType === 'enemy' ? 'border-red-300 text-red-700' :
                                            connection.relationshipType === 'neutral' ? 'border-gray-300 text-gray-700' :
                                            connection.relationshipType === 'family' ? 'border-pink-300 text-pink-700' :
                                            connection.relationshipType === 'romantic' ? 'border-rose-300 text-rose-700' :
                                            connection.relationshipType === 'mentor' ? 'border-blue-300 text-blue-700' :
                                            connection.relationshipType === 'rival' ? 'border-orange-300 text-orange-700' :
                                            connection.relationshipType === 'subordinate' ? 'border-indigo-300 text-indigo-700' :
                                            connection.relationshipType === 'leader' ? 'border-purple-300 text-purple-700' :
                                            'border-gray-300 text-gray-700'
                                          }`}>
                                            {connection.relationshipType}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Connection Description */}
                                    {connection.description && (
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {connection.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fallback for legacy simple connections */
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {selectedEvent.attributes?.connectedCharacters && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 mb-2 block">Characters</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedEvent.attributes.connectedCharacters.split(',').map((char: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                  {char.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.connectedLocations && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 mb-2 block">Locations</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedEvent.attributes.connectedLocations.split(',').map((location: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                  {location.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.connectedOrganizations && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 mb-2 block">Organizations</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedEvent.attributes.connectedOrganizations.split(',').map((org: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                  {org.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Event Details */}
                {(selectedEvent.attributes?.participants || selectedEvent.attributes?.outcomes || selectedEvent.attributes?.consequences) && (
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600" />
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                      </div>
                      
                      <div className="space-y-6">
                        {selectedEvent.attributes?.participants && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Participants</Label>
                            <p className="text-gray-900 text-base leading-relaxed mt-2">
                              {selectedEvent.attributes.participants}
                            </p>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.outcomes && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Outcomes</Label>
                            <p className="text-gray-900 text-base leading-relaxed mt-2">
                              {selectedEvent.attributes.outcomes}
                            </p>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.consequences && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Consequences</Label>
                            <p className="text-gray-900 text-base leading-relaxed mt-2">
                              {selectedEvent.attributes.consequences}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                          {selectedEvent.attributes?.culturalImpact && selectedEvent.attributes.culturalImpact !== 'none' && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Cultural Impact</Label>
                              <p className="text-gray-900 font-semibold capitalize">{selectedEvent.attributes.culturalImpact}</p>
                            </div>
                          )}
                          
                          {selectedEvent.attributes?.historicalScope && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Historical Scope</Label>
                              <p className="text-gray-900 font-semibold capitalize">{selectedEvent.attributes.historicalScope}</p>
                            </div>
                          )}
                        </div>
                        
                        {selectedEvent.attributes?.additionalNotes && (
                          <div className="pt-4 border-t border-gray-200">
                            <Label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Additional Notes</Label>
                            <p className="text-gray-900 text-base leading-relaxed mt-2">
                              {selectedEvent.attributes.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-600" />
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tags</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-indigo-200 text-indigo-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related Events */}
                {(selectedEvent.attributes?.precedingEvents || selectedEvent.attributes?.concurrentEvents || selectedEvent.attributes?.followingEvents) && (
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-600" />
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Related Events</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {selectedEvent.attributes?.precedingEvents && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Preceding Events</Label>
                            <p className="text-gray-900 text-sm mt-1">{selectedEvent.attributes.precedingEvents}</p>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.concurrentEvents && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Concurrent Events</Label>
                            <p className="text-gray-900 text-sm mt-1">{selectedEvent.attributes.concurrentEvents}</p>
                          </div>
                        )}
                        
                        {selectedEvent.attributes?.followingEvents && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Following Events</Label>
                            <p className="text-gray-900 text-sm mt-1">{selectedEvent.attributes.followingEvents}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sources */}
                {selectedEvent.attributes?.sources && (
                  <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-gray-400 via-slate-400 to-gray-600" />
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                          <Scroll className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Sources & References</h3>
                      </div>
                      
                      <p className="text-gray-900 text-base leading-relaxed">
                        {selectedEvent.attributes.sources}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Calendar Views
          <div className="flex-1 flex flex-col bg-gray-50">
            {viewMode === 'timeline' && (
              <div className="flex-1 p-4 bg-gray-50">
                <div className="text-center text-gray-500 py-20">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Timeline View</h3>
                  <p className="text-sm">Interactive timeline view coming soon...</p>
                </div>
              </div>
            )}

            {viewMode === 'gantt' && (
              <div className="flex-1 p-4 bg-gray-50">
                <div className="text-center text-gray-500 py-20">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Gantt Chart View</h3>
                  <p className="text-sm">Gantt chart visualization coming soon...</p>
                </div>
              </div>
            )}

            {(viewMode === 'month' || viewMode === 'list') && (
              <div className="flex-1 p-4 bg-gray-50">
                
                {activeCalendarSystem ? (
                  <div className="space-y-6">
                    {/* Active Calendar System Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">{activeCalendarSystem.name}</h3>
                          <p className="text-sm text-blue-700">{activeCalendarSystem.description}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCalendarSystem(activeCalendarSystem)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Calendar System Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Eras */}
                      {activeCalendarSystem.eras && activeCalendarSystem.eras.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                            Eras
                          </h4>
                          <div className="space-y-2">
                            {activeCalendarSystem.eras.map((era, index) => (
                              <div 
                                key={era.id || index}
                                className={`p-2 rounded border ${currentEra?.id === era.id ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
                              >
                                <div className="font-medium text-sm">{era.name}</div>
                                <div className="text-xs text-gray-500">Start Year: {era.startYear}</div>
                                {era.description && (
                                  <div className="text-xs text-gray-600 mt-1">{era.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Months */}
                      {activeCalendarSystem.months && activeCalendarSystem.months.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-green-500" />
                            Months ({activeCalendarSystem.months.length})
                          </h4>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {activeCalendarSystem.months.map((month, index) => (
                              <div key={month.id || index} className="p-2 bg-gray-50 rounded text-center">
                                <div className="font-medium">{month.name}</div>
                                <div className="text-gray-500">{month.days} days</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Calendar Properties */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Settings className="w-4 h-4 mr-2 text-orange-500" />
                          Properties
                        </h4>
                        <div className="space-y-2 text-sm">
                          {activeCalendarSystem.weekdays && activeCalendarSystem.weekdays.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Days per week:</span>
                              <span className="font-medium">{activeCalendarSystem.weekdays.length}</span>
                            </div>
                          )}
                          {activeCalendarSystem.months && activeCalendarSystem.months.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Months per year:</span>
                              <span className="font-medium">{activeCalendarSystem.months.length}</span>
                            </div>
                          )}
                          {activeCalendarSystem.seasons && activeCalendarSystem.seasons.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seasons:</span>
                              <span className="font-medium">{activeCalendarSystem.seasons.length}</span>
                            </div>
                          )}
                          {activeCalendarSystem.moons && activeCalendarSystem.moons.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Moons:</span>
                              <span className="font-medium">{activeCalendarSystem.moons.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Events */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-purple-500" />
                        Calendar Events ({filteredEvents.length})
                      </h4>
                      {filteredEvents.length > 0 ? (
                        <div className="space-y-2">
                          {filteredEvents.slice(0, 5).map((event, index) => (
                            <div key={event.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium text-sm">{event.name}</div>
                                <div className="text-xs text-gray-500">{event.description}</div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setSelectedEvent(event)}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                          {filteredEvents.length > 5 && (
                            <div className="text-center text-sm text-gray-500 pt-2">
                              and {filteredEvents.length - 5} more events...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <CalendarIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm">No events created yet.</p>
                          <Button 
                            size="sm" 
                            className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => {
                              const newEvent = {
                                id: '',
                                name: '',
                                description: '',
                                category: 'calendar',
                                project_id: projectId,
                                attributes: {
                                  date: new Date().toISOString().split('T')[0],
                                  event_type: 'story',
                                  priority: 'medium'
                                },
                                tags: [],
                                created_at: '',
                                updated_at: ''
                              }
                              setEditingEvent(newEvent)
                              setIsCreating(true)
                            }}
                          >
                            Create First Event
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-20">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Calendar System</h3>
                    <p className="text-sm mb-4">Create or select a calendar system to get started.</p>
                    <Button 
                      onClick={() => setCurrentView('systems')}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Choose Calendar System
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Calendar Systems Selection View */}
      {currentView === 'systems' && (
        <CalendarSystemsView
          selectedCalendarType={selectedCalendarType}
          setSelectedCalendarType={setSelectedCalendarType}
          newCalendarName={newCalendarName}
          setNewCalendarName={setNewCalendarName}
          existingCalendarSystems={calendarSystems}
          activeCalendarSystem={activeCalendarSystem}
          onCreateNew={async () => {
            const template = selectedCalendarType === 'default' ? {
              id: 'default',
              name: newCalendarName || 'Standard Calendar',
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
                  phase: 'full' as const
                }
              ],
              seasons: [
                { id: 's1', name: 'Spring', startMonth: 3, startDay: 21, duration: 92, color: '#10B981' },
                { id: 's2', name: 'Summer', startMonth: 6, startDay: 21, duration: 93, color: '#F59E0B' },
                { id: 's3', name: 'Autumn', startMonth: 9, startDay: 22, duration: 90, color: '#DC2626' },
                { id: 's4', name: 'Winter', startMonth: 12, startDay: 21, duration: 90, color: '#3B82F6' }
              ]
            } : {
              id: `custom-${Date.now()}`,
              name: newCalendarName,
              description: 'Custom calendar system',
              eras: [
                {
                  id: 'era1',
                  name: 'Current Era',
                  startYear: 1,
                  description: 'Main time period',
                  color: '#3B82F6'
                }
              ],
              months: [
                { id: 'm1', name: 'Month 1', days: 30, order: 1, season: 'season1' },
                { id: 'm2', name: 'Month 2', days: 30, order: 2, season: 'season2' },
                { id: 'm3', name: 'Month 3', days: 30, order: 3, season: 'season3' },
                { id: 'm4', name: 'Month 4', days: 30, order: 4, season: 'season4' }
              ],
              moons: [
                {
                  id: 'moon1',
                  name: 'Primary Moon',
                  cycle: 30,
                  color: '#E5E7EB',
                  phase: 'full' as const
                }
              ],
              seasons: [
                { id: 'season1', name: 'First Season', startMonth: 1, startDay: 1, duration: 90, color: '#10B981' },
                { id: 'season2', name: 'Second Season', startMonth: 2, startDay: 1, duration: 90, color: '#F59E0B' },
                { id: 'season3', name: 'Third Season', startMonth: 3, startDay: 1, duration: 90, color: '#DC2626' },
                { id: 'season4', name: 'Fourth Season', startMonth: 4, startDay: 1, duration: 90, color: '#3B82F6' }
              ],
              weekdays: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
              yearLength: 365,
              startDate: { year: 1, month: 1, day: 1 }
            }

            // Save the calendar system to the database
            try {
              console.log('Saving calendar system:', template)
              
              const { data, error } = await supabase
                .from('world_elements')
                .insert({
                  project_id: projectId,
                  category: 'calendar_system',
                  name: template.name,
                  description: template.description,
                  attributes: template,
                  tags: ['calendar', 'system']
                })
                .select()
                .single()

              if (error) {
                console.error('Database error:', error)
                throw error
              }

              console.log('Calendar saved successfully:', data)

              const updatedSystems = [...calendarSystems.filter(sys => sys.dbId !== data.id), { ...template, dbId: data.id }]
              setCalendarSystems(updatedSystems)
              setActiveCalendarSystem(template)
              if (template.eras && template.eras.length > 0) {
                setCurrentEra(template.eras[0])
              }
              
              // Reset form and go back to calendar view
              setSelectedCalendarType(null)
              setNewCalendarName('')
              setCurrentView('calendar')
              
              // Broadcast the change for sidebar update
              window.dispatchEvent(new CustomEvent('calendarSystemCreated', { 
                detail: { calendarSystem: data, projectId } 
              }))
              
              console.log('Calendar system created and state updated successfully')
              console.log('🎯 CALENDAR: Calendar system creation event dispatched')
            } catch (error) {
              console.error('Error saving calendar system:', error)
              alert('Failed to save calendar system. Please check the console for details.')
            }
          }}
          onSelect={(system) => {
            console.log('Selected calendar system:', system)
            setActiveCalendarSystem(system)
            if (system.eras && system.eras.length > 0) {
              setCurrentEra(system.eras[0])
            }
            setCurrentView('calendar')
          }}
          onBack={() => setCurrentView('calendar')}
        />
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

      {/* Calendar Properties Modal */}
      <Dialog open={!!editingCalendarSystem} onOpenChange={(open) => !open && setEditingCalendarSystem(null)}>
        <DialogContent 
          className="!w-[1400px] !max-w-none max-h-[85vh] bg-gradient-to-br from-white to-gray-50 p-0 border-0 shadow-2xl overflow-hidden flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              Calendar Properties
            </DialogTitle>
            <p className="text-gray-600 mt-1 text-sm">Configure your world's calendar system</p>
          </DialogHeader>
          
          {editingCalendarSystem && (
            <CalendarPropertiesEditor
              calendarSystem={editingCalendarSystem}
              onUpdate={setEditingCalendarSystem}
              onSave={handleUpdateCalendarSystem}
              onCancel={() => setEditingCalendarSystem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Connection Modal */}
      {showConnectionModal && (
        <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-100 pb-6">
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                Connect {connectionType.charAt(0).toUpperCase() + connectionType.slice(1)}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Select an existing {connectionType.slice(0, -1)} or create a new one to connect to this event.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col h-full pt-6">
              {/* Tabs */}
              <div className="flex bg-gray-50 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setShowCreateNewElement(false)}
                  className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    !showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Select {connectionType.charAt(0).toUpperCase() + connectionType.slice(1, -1)}
                </button>
                <button
                  onClick={() => setShowCreateNewElement(true)}
                  className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Create New {connectionType.charAt(0).toUpperCase() + connectionType.slice(1, -1)}
                </button>
              </div>

              {!showCreateNewElement ? (
                /* Select Element Tab */
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Search */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder={`Search for ${connectionType}...`}
                      value={connectionSearchTerm}
                      onChange={(e) => setConnectionSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-base border-gray-200 focus:border-gray-400 focus:ring-0 bg-gray-50"
                    />
                  </div>

                  {/* Recently Viewed */}
                  {recentlyViewedElements.length > 0 && !connectionSearchTerm && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Recently Used</h4>
                      <div className="space-y-2">
                        {recentlyViewedElements.filter((element: WorldElement) => element.category === connectionType).map((element: WorldElement) => (
                          <button
                            key={element.id}
                            onClick={() => handleConnectElement(element)}
                            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 border border-transparent hover:border-gray-200"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <span className="text-sm font-bold text-white">
                                {element.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-medium text-gray-900 truncate">{element.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                            </div>
                            <div className="text-gray-400">
                              {connectionType === 'characters' ? <Users className="w-5 h-5" /> : 
                               connectionType === 'locations' ? <MapPin className="w-5 h-5" /> : 
                               <Globe className="w-5 h-5" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {connectionSearchTerm && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Search Results</h4>
                    )}
                    <div className="space-y-2 pb-4">
                      {getFilteredElements().map((element: WorldElement) => (
                        <button
                          key={element.id}
                          onClick={() => handleConnectElement(element)}
                          className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 border border-transparent hover:border-gray-200"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {element.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-gray-900 truncate">{element.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                            {element.description && (
                              <div className="text-sm text-gray-400 truncate mt-1 max-w-md">{element.description}</div>
                            )}
                          </div>
                          <div className="text-gray-400">
                            {connectionType === 'characters' ? <Users className="w-5 h-5" /> : 
                             connectionType === 'locations' ? <MapPin className="w-5 h-5" /> : 
                             <Globe className="w-5 h-5" />}
                          </div>
                        </button>
                      ))}
                    </div>
                    {getFilteredElements().length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          {connectionType === 'characters' ? <Users className="w-8 h-8 text-gray-400" /> : 
                           connectionType === 'locations' ? <MapPin className="w-8 h-8 text-gray-400" /> : 
                           <Globe className="w-8 h-8 text-gray-400" />}
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">No {connectionType} found</p>
                        {connectionSearchTerm && (
                          <p className="text-sm text-gray-500">Try a different search term</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Create New Element Tab */
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Name</label>
                      <Input
                        placeholder={`Enter ${connectionType.slice(0, -1)} name...`}
                        value={newElementName}
                        onChange={(e) => setNewElementName(e.target.value)}
                        className="h-12 text-base border-gray-200 focus:border-gray-400 focus:ring-0 bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Category</label>
                      <select
                        value={newElementCategory}
                        onChange={(e) => setNewElementCategory(e.target.value)}
                        className="w-full h-12 px-4 text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-0 focus:border-gray-400 transition-colors"
                      >
                        {elementCategories.map((category: string) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        {connectionType === 'characters' ? <Users className="w-6 h-6 text-gray-400" /> : 
                         connectionType === 'locations' ? <MapPin className="w-6 h-6 text-gray-400" /> : 
                         <Globe className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Create new {connectionType.slice(0, -1)}</p>
                        <p className="text-xs text-gray-500">This will be added to your world elements and connected to this event</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleCloseConnectionModal}
                      className="flex-1 h-12 px-6 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAndConnectElement}
                      disabled={!newElementName.trim()}
                      className="flex-1 h-12 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create and Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Calendar Properties Editor Component
interface CalendarPropertiesEditorProps {
  calendarSystem: CalendarSystem
  onUpdate: (system: CalendarSystem) => void
  onSave: () => void
  onCancel: () => void
}

function CalendarPropertiesEditor({ calendarSystem, onUpdate, onSave, onCancel }: CalendarPropertiesEditorProps) {
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
    <div className="flex flex-1 bg-gradient-to-br from-white to-gray-50/50 rounded-lg overflow-hidden shadow-inner">
      {/* Left Sidebar with Tabs */}
      <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200/50 shadow-sm flex-shrink-0">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings className="w-5 h-5 text-orange-500" />
            Configuration
          </h3>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('eras')}
              className={`w-full flex items-center gap-4 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'eras' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
              }`}
            >
              <CalendarIcon className="w-6 h-6" />
              <span>Historical Eras</span>
              {activeTab === 'eras' && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('months')}
              className={`w-full flex items-center gap-4 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'months' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
              }`}
            >
              <Clock className="w-6 h-6" />
              <span>Months & Days</span>
              {activeTab === 'months' && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('weeks')}
              className={`w-full flex items-center gap-4 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'weeks' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
              }`}
            >
              <Target className="w-6 h-6" />
              <span>Week Structure</span>
              {activeTab === 'weeks' && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('moons')}
              className={`w-full flex items-center gap-4 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'moons' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
              }`}
            >
              <Moon className="w-6 h-6" />
              <span>Celestial Bodies</span>
              {activeTab === 'moons' && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('seasons')}
              className={`w-full flex items-center gap-4 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'seasons' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200'
              }`}
            >
              <Sun className="w-6 h-6" />
              <span>Seasonal Cycles</span>
              {activeTab === 'seasons' && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm min-h-0">
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'eras' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-white" />
                    </div>
                    Historical Eras
                  </h3>
                  <p className="text-gray-600 mt-2">Define the major time periods in your world's history</p>
                </div>
                <Button size="sm" onClick={addEra} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Era
                </Button>
              </div>
              
              <div className="space-y-6">
                {calendarSystem.eras.map((era, index) => (
                  <Card key={era.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div 
                      className="h-1 w-full" 
                      style={{background: `linear-gradient(90deg, ${era.color}, ${era.color}80)`}}
                    />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center" 
                            style={{backgroundColor: era.color}}
                          >
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Era {index + 1}</span>
                          </div>
                        </div>
                        <Input
                          value={era.name}
                          onChange={(e) => updateEra(index, { name: e.target.value })}
                          placeholder="Era name"
                          className="flex-1 font-semibold text-lg border-2 border-gray-100 focus:border-orange-300 bg-white/70 h-10"
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              value={era.color}
                              onChange={(e) => updateEra(index, { color: e.target.value })}
                              type="color"
                              className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer z-10"
                            />
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
                              style={{backgroundColor: era.color}}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeEra(index)}
                            disabled={calendarSystem.eras.length <= 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Era Name</Label>
                          <Input
                            value={era.name}
                            onChange={(e) => updateEra(index, { name: e.target.value })}
                            placeholder="Era name"
                            className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 font-medium text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Abbreviation</Label>
                          <Input
                            value={era.abbreviation || ''}
                            onChange={(e) => updateEra(index, { abbreviation: e.target.value })}
                            placeholder="BCE, CE, etc."
                            className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 font-medium text-sm h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Start Year</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                const currentYear = era.startYear || 0;
                                updateEra(index, { startYear: currentYear - 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={era.startYear}
                              onChange={(e) => updateEra(index, { startYear: parseInt(e.target.value) || 0 })}
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-8 flex-1"
                            />
                            <Button
                              onClick={() => {
                                const currentYear = era.startYear || 0;
                                updateEra(index, { startYear: currentYear + 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">End Year</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                const currentYear = era.endYear || era.startYear || 0;
                                updateEra(index, { endYear: currentYear - 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={era.endYear || ''}
                              onChange={(e) => updateEra(index, { endYear: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder="Ongoing"
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-8 flex-1"
                            />
                            <Button
                              onClick={() => {
                                const currentYear = era.endYear || era.startYear || 0;
                                updateEra(index, { endYear: currentYear + 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Options</Label>
                          <div className="flex items-center gap-3 h-10">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Checkbox 
                                  id={`count-backwards-${index}`}
                                  checked={era.countBackwards || false}
                                  onCheckedChange={(checked) => updateEra(index, { countBackwards: !!checked })}
                                  className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                />
                              </div>
                              <Label htmlFor={`count-backwards-${index}`} className="text-sm text-gray-600 font-medium cursor-pointer select-none">Count Years Backwards</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Color</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              value={era.color}
                              onChange={(e) => updateEra(index, { color: e.target.value })}
                              placeholder="#000000"
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 font-medium text-sm h-8 flex-1"
                            />
                            <div className="relative">
                              <input
                                value={era.color}
                                onChange={(e) => updateEra(index, { color: e.target.value })}
                                type="color"
                                className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer z-10"
                              />
                              <div 
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
                                style={{backgroundColor: era.color}}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          Description
                        </Label>
                        <Textarea
                          value={era.description}
                          onChange={(e) => updateEra(index, { description: e.target.value })}
                          placeholder="Describe this historical era..."
                          className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 min-h-[80px]"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'months' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    Months & Days
                  </h3>
                  <p className="text-gray-600 mt-2">Configure the months in your calendar system</p>
                </div>
                <Button size="sm" onClick={addMonth} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Month
                </Button>
              </div>
              
              <div className="space-y-4">
                {calendarSystem.months.map((month, index) => (
                  <Card key={month.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm group overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">{index + 1}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Month {index + 1}</span>
                          </div>
                        </div>
                        <Input
                          value={month.name}
                          onChange={(e) => updateMonth(index, { name: e.target.value })}
                          placeholder="Month name"
                          className="flex-1 font-semibold text-lg border-2 border-gray-100 focus:border-emerald-400 bg-white/70 h-10"
                        />
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeMonth(index)}
                            disabled={calendarSystem.months.length <= 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Month Name</Label>
                          <Input
                            value={month.name}
                            onChange={(e) => updateMonth(index, { name: e.target.value })}
                            placeholder="January"
                            className="bg-white/70 border-2 border-gray-100 focus:border-emerald-400 font-medium text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Abbreviation</Label>
                          <Input
                            value={month.abbreviation || ''}
                            onChange={(e) => updateMonth(index, { abbreviation: e.target.value })}
                            placeholder="Jan"
                            className="bg-white/70 border-2 border-gray-100 focus:border-emerald-400 font-medium text-sm h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Days in Month</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                const currentDays = month.days || 30;
                                updateMonth(index, { days: Math.max(1, currentDays - 1) });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={month.days}
                              onChange={(e) => updateMonth(index, { days: parseInt(e.target.value) || 30 })}
                              className="bg-white/70 border-2 border-gray-100 focus:border-emerald-400 text-center font-medium text-sm h-8 flex-1"
                              min="1"
                              max="366"
                            />
                            <Button
                              onClick={() => {
                                const currentDays = month.days || 30;
                                updateMonth(index, { days: currentDays + 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Leap Year Configuration */}
                      <div className="bg-emerald-50/50 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Leap Year Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Divisible By</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => {
                                  const current = month.leapYearDivisor || 4;
                                  updateMonth(index, { leapYearDivisor: Math.max(1, current - 1) });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={month.leapYearDivisor || 4}
                                onChange={(e) => updateMonth(index, { leapYearDivisor: parseInt(e.target.value) || 4 })}
                                className="bg-white border-2 border-gray-100 focus:border-emerald-400 text-center text-xs h-6 flex-1"
                                min="1"
                              />
                              <Button
                                onClick={() => {
                                  const current = month.leapYearDivisor || 4;
                                  updateMonth(index, { leapYearDivisor: current + 1 });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                +
                              </Button>
                              <div 
                                className="w-4 h-4 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center cursor-help transition-colors"
                                title="Years divisible by this number are leap years (e.g., 4 means every 4th year like 2020, 2024)"
                              >
                                <span className="text-white text-xs">?</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Excluding</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => {
                                  const current = month.leapYearExclusion || 100;
                                  updateMonth(index, { leapYearExclusion: Math.max(1, current - 1) });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={month.leapYearExclusion || 100}
                                onChange={(e) => updateMonth(index, { leapYearExclusion: parseInt(e.target.value) || 100 })}
                                className="bg-white border-2 border-gray-100 focus:border-emerald-400 text-center text-xs h-6 flex-1"
                                min="1"
                              />
                              <Button
                                onClick={() => {
                                  const current = month.leapYearExclusion || 100;
                                  updateMonth(index, { leapYearExclusion: current + 1 });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                +
                              </Button>
                              <div 
                                className="w-4 h-4 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center cursor-help transition-colors"
                                title="Exception rule: Years divisible by this number are NOT leap years, even if divisible by the base number (e.g., 100 means years like 1700, 1800, 1900 skip being leap years)"
                              >
                                <span className="text-white text-xs">?</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Always Include</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => {
                                  const current = month.leapYearInclusion || 400;
                                  updateMonth(index, { leapYearInclusion: Math.max(1, current - 1) });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={month.leapYearInclusion || 400}
                                onChange={(e) => updateMonth(index, { leapYearInclusion: parseInt(e.target.value) || 400 })}
                                className="bg-white border-2 border-gray-100 focus:border-emerald-400 text-center text-xs h-6 flex-1"
                                min="1"
                              />
                              <Button
                                onClick={() => {
                                  const current = month.leapYearInclusion || 400;
                                  updateMonth(index, { leapYearInclusion: current + 1 });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                +
                              </Button>
                              <div 
                                className="w-4 h-4 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center cursor-help transition-colors"
                                title="Override exception: Years divisible by this number are ALWAYS leap years, even if excluded by the exception rule (e.g., 400 means 1600, 2000, 2400 are leap years despite being divisible by 100)"
                              >
                                <span className="text-white text-xs">?</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Offset (Years)</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => {
                                  const current = month.offsetYears || 0;
                                  updateMonth(index, { offsetYears: current - 1 });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={month.offsetYears || 0}
                                onChange={(e) => updateMonth(index, { offsetYears: parseInt(e.target.value) || 0 })}
                                className="bg-white border-2 border-gray-100 focus:border-emerald-400 text-center text-xs h-6 flex-1"
                              />
                              <Button
                                onClick={() => {
                                  const current = month.offsetYears || 0;
                                  updateMonth(index, { offsetYears: current + 1 });
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                variant="outline"
                              >
                                +
                              </Button>
                              <div 
                                className="w-4 h-4 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center cursor-help transition-colors"
                                title="Year adjustment: Shift the leap year calculation by this many years (e.g., offset of 1 means year 2021 is calculated as 2022 for leap year rules)"
                              >
                                <span className="text-white text-xs">?</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-white/50 rounded text-xs text-gray-600">
                          <span className="font-medium">Leap Year Rule:</span> Add extra day(s) to years divisible by {month.leapYearDivisor || 4}, 
                          excluding years divisible by {month.leapYearExclusion || 100} but always including years divisible by {month.leapYearInclusion || 400}, 
                          offset by {month.offsetYears || 0} years.
                        </div>
                      </div>
                      
                      {/* Compact Additional Month Info */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-emerald-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-emerald-600 mb-0.5">Base Days</div>
                          <div className="text-sm font-bold text-emerald-700">{month.days}</div>
                        </div>
                        <div className="bg-teal-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-teal-600 mb-0.5">Month Order</div>
                          <div className="text-sm font-bold text-teal-700">{month.order} of {calendarSystem.months.length}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-blue-600 mb-0.5">Approx Weeks</div>
                          <div className="text-sm font-bold text-blue-700">{Math.ceil(month.days / (calendarSystem.weekdays?.length || 7))}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'weeks' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  Week Structure
                </h3>
                <p className="text-lg text-gray-600 mt-3">Configure how weeks work in your calendar</p>
              </div>
              
              <div className="space-y-8">
                {/* Weekday Names Section */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-gray-900">Weekdays</h4>
                      <Button 
                        onClick={() => {
                          const newWeekdays = [...calendarSystem.weekdays, `Day ${calendarSystem.weekdays.length + 1}`]
                          updateSystem({ weekdays: newWeekdays })
                        }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Week
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {calendarSystem.weekdays.map((dayName, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {i + 1}
                          </div>
                          <Input
                            value={dayName}
                            onChange={(e) => {
                              const newWeekdays = [...calendarSystem.weekdays]
                              newWeekdays[i] = e.target.value
                              updateSystem({ weekdays: newWeekdays })
                            }}
                            placeholder={`Day ${i + 1} name`}
                            className="flex-1 bg-white border-2 border-gray-100 focus:border-purple-300 h-12"
                          />
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Checkbox 
                                id={`weekend-${i}`}
                                className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-500 data-[state=checked]:to-indigo-600 data-[state=checked]:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-400"
                              />
                            </div>
                            <Label htmlFor={`weekend-${i}`} className="text-sm font-medium text-gray-700 cursor-pointer select-none">Weekend</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (calendarSystem.weekdays.length > 1) {
                                  const newWeekdays = calendarSystem.weekdays.filter((_, index) => index !== i)
                                  updateSystem({ weekdays: newWeekdays })
                                }
                              }}
                              disabled={calendarSystem.weekdays.length <= 1}
                              className="w-8 h-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Week Settings */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/50">
                  <CardContent className="p-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-6">Week Configuration</h4>
                    
                    <div className="space-y-6">
                      {/* Hours in a day */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold text-gray-900">Hours in a day</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const currentHours = (calendarSystem as any).hoursPerDay || 24
                              updateSystem({ hoursPerDay: Math.max(1, currentHours - 1) } as any)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            -
                          </Button>
                          <div className="w-16 text-center font-bold text-lg">
                            {(calendarSystem as any).hoursPerDay || 24}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const currentHours = (calendarSystem as any).hoursPerDay || 24
                              updateSystem({ hoursPerDay: currentHours + 1 } as any)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Offset week cycle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold text-gray-900">Offset week cycle</Label>
                          <p className="text-sm text-gray-600">The number of days to show before the first full week of the cycle.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const currentOffset = (calendarSystem as any).weekOffset || 6
                              updateSystem({ weekOffset: Math.max(0, currentOffset - 1) } as any)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            -
                          </Button>
                          <div className="w-16 text-center font-bold text-lg">
                            {(calendarSystem as any).weekOffset || 6}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const currentOffset = (calendarSystem as any).weekOffset || 6
                              updateSystem({ weekOffset: currentOffset + 1 } as any)
                            }}
                            className="w-8 h-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {/* Overflow weekdays */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold text-gray-900">Overflow weekdays</Label>
                          <p className="text-sm text-gray-600">Allow weeks to continue into the next month.</p>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              const currentSetting = calendarSystem.allowOverflowWeeks || false;
                              updateSystem({ allowOverflowWeeks: !currentSetting } as any);
                            }}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                              calendarSystem.allowOverflowWeeks ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                                calendarSystem.allowOverflowWeeks ? 'translate-x-6 shadow-lg' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'moons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    Celestial Bodies
                  </h3>
                  <p className="text-lg text-gray-600 mt-3">Add moons that affect your world's calendar</p>
                </div>
                <Button size="lg" onClick={addMoon} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4 text-lg">
                  <Plus className="w-6 h-6 mr-3" />
                  Add Moon
                </Button>
              </div>
              
              <div className="space-y-6">
                {calendarSystem.moons.map((moon, index) => (
                  <Card key={moon.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group overflow-hidden">
                    <div 
                      className="h-2 w-full bg-gradient-to-r" 
                      style={{backgroundImage: `linear-gradient(90deg, ${moon.color}, ${moon.color}80, ${moon.color})`}}
                    />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center relative" 
                            style={{backgroundColor: moon.color}}
                          >
                            <Moon className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Moon {index + 1}</span>
                          </div>
                        </div>
                        <Input
                          value={moon.name}
                          onChange={(e) => updateMoon(index, { name: e.target.value })}
                          placeholder="Moon name"
                          className="flex-1 font-semibold text-lg border-2 border-gray-100 focus:border-orange-300 bg-white/70 h-10"
                        />
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeMoon(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Moon</Label>
                          <Input
                            value={moon.name}
                            onChange={(e) => updateMoon(index, { name: e.target.value })}
                            placeholder="Moon name"
                            className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 font-medium text-sm h-10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Cycle Length</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                const currentCycle = moon.cycle || 29.5;
                                updateMoon(index, { cycle: Math.max(1, currentCycle - 0.5) });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={moon.cycle}
                              onChange={(e) => updateMoon(index, { cycle: parseFloat(e.target.value) || 29.5 })}
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-8 flex-1"
                              step="0.1"
                              min="1"
                            />
                            <Button
                              onClick={() => {
                                const currentCycle = moon.cycle || 29.5;
                                updateMoon(index, { cycle: currentCycle + 0.5 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Days</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => {
                                const currentDays = moon.days || 12;
                                updateMoon(index, { days: Math.max(1, currentDays - 1) });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={moon.days || 12}
                              onChange={(e) => updateMoon(index, { days: parseInt(e.target.value) || 12 })}
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-8 flex-1"
                              min="1"
                            />
                            <Button
                              onClick={() => {
                                const currentDays = moon.days || 12;
                                updateMoon(index, { days: currentDays + 1 });
                              }}
                              className="w-8 h-8 p-0"
                              variant="outline"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Color</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              value={moon.color}
                              onChange={(e) => updateMoon(index, { color: e.target.value })}
                              placeholder="#FFFF"
                              className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 font-medium text-sm h-8 flex-1"
                            />
                            <div className="relative">
                              <input
                                value={moon.color}
                                onChange={(e) => updateMoon(index, { color: e.target.value })}
                                type="color"
                                className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer z-10"
                              />
                              <div 
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
                                style={{backgroundColor: moon.color}}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Round to Nearest Day</Label>
                          <select
                            value={moon.roundingMode || 'nearest'}
                            onChange={(e) => updateMoon(index, { roundingMode: e.target.value as 'nearest' | 'up' | 'down' | 'none' })}
                            className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg shadow-sm focus:outline-none focus:border-orange-300 bg-white/70 font-medium text-sm h-10"
                          >
                            <option value="nearest">Round to Nearest Day</option>
                            <option value="up">Round Up</option>
                            <option value="down">Round Down</option>
                            <option value="none">No Rounding</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Options</Label>
                          <div className="flex items-center gap-3 h-10">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Checkbox 
                                  id={`reverse-cycle-${index}`}
                                  checked={moon.reverseCycle || false}
                                  onCheckedChange={(checked) => updateMoon(index, { reverseCycle: !!checked })}
                                  className="w-5 h-5 border-2 border-gray-300 rounded-md data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                />
                              </div>
                              <Label htmlFor={`reverse-cycle-${index}`} className="text-sm text-gray-600 font-medium cursor-pointer select-none">Reverse Cycle</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'seasons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Sun className="w-5 h-5 text-white" />
                    </div>
                    Seasonal Cycles
                  </h3>
                  <p className="text-lg text-gray-600 mt-3">Define the seasonal cycles in your world</p>
                </div>
                <Button size="lg" onClick={addSeason} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4 text-lg">
                  <Plus className="w-6 h-6 mr-3" />
                  Add Season
                </Button>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {calendarSystem.seasons.map((season, index) => (
                  <Card key={season.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group overflow-hidden">
                    <div 
                      className="h-2 w-full bg-gradient-to-r" 
                      style={{backgroundImage: `linear-gradient(90deg, ${season.color}, ${season.color}60, ${season.color})`}}
                    />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center" 
                            style={{backgroundColor: season.color}}
                          >
                            <Sun className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Season {index + 1}</span>
                          </div>
                        </div>
                        <Input
                          value={season.name}
                          onChange={(e) => updateSeason(index, { name: e.target.value })}
                          placeholder="Season name"
                          className="flex-1 font-semibold text-lg border-2 border-gray-100 focus:border-orange-300 bg-white/70 h-10"
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              value={season.color}
                              onChange={(e) => updateSeason(index, { color: e.target.value })}
                              type="color"
                              className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer p-1 bg-white shadow-sm hover:shadow-md transition-shadow"
                            />
                            <div className="absolute inset-0 rounded-lg border-2 border-gray-200 pointer-events-none" />
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeSeason(index)}
                            disabled={calendarSystem.seasons.length <= 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-amber-500" />
                            Start Month
                          </Label>
                          <select
                            value={season.startMonth}
                            onChange={(e) => updateSeason(index, { startMonth: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg shadow-sm focus:outline-none focus:border-orange-300 bg-white/70 font-medium text-sm"
                          >
                            {calendarSystem.months.map((month, monthIndex) => (
                              <option key={month.id} value={monthIndex + 1}>
                                {month.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Start Day
                          </Label>
                          <Input
                            type="number"
                            value={season.startDay}
                            onChange={(e) => updateSeason(index, { startDay: parseInt(e.target.value) || 1 })}
                            className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-10"
                            min="1"
                            max="31"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            Duration (days)
                          </Label>
                          <Input
                            type="number"
                            value={season.duration}
                            onChange={(e) => updateSeason(index, { duration: parseInt(e.target.value) || 90 })}
                            className="bg-white/70 border-2 border-gray-100 focus:border-orange-300 text-center font-medium text-sm h-10"
                            min="1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Season Configuration Options */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-6">Season Configuration</h4>
                  
                  <div className="space-y-6">
                    {/* Length-based seasons toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold text-gray-900">Length-based seasons</Label>
                        <p className="text-sm text-gray-600">Your seasons a static duration, but may occur at variable dates.</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            const currentSetting = calendarSystem.lengthBasedSeasons || false;
                            updateSystem({ lengthBasedSeasons: !currentSetting } as any);
                          }}
                          className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                            calendarSystem.lengthBasedSeasons ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                              calendarSystem.lengthBasedSeasons ? 'translate-x-6 shadow-lg' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Seasonal offset */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-900">Seasonal offset (days)</Label>
                      <p className="text-sm text-gray-600">Enable length-based seasons to adjust this.</p>
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => {
                            const currentOffset = calendarSystem.seasonalOffset || 0;
                            updateSystem({ seasonalOffset: Math.max(0, currentOffset - 1) } as any);
                          }}
                          disabled={!calendarSystem.lengthBasedSeasons}
                          className="w-8 h-8 p-0"
                          variant="outline"
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={calendarSystem.seasonalOffset || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            updateSystem({ seasonalOffset: Math.max(0, value) } as any);
                          }}
                          disabled={!calendarSystem.lengthBasedSeasons}
                          className="w-20 text-center bg-white border-2 border-gray-100 focus:border-amber-300 h-8"
                          min="0"
                        />
                        <Button
                          onClick={() => {
                            const currentOffset = calendarSystem.seasonalOffset || 0;
                            updateSystem({ seasonalOffset: currentOffset + 1 } as any);
                          }}
                          disabled={!calendarSystem.lengthBasedSeasons}
                          className="w-8 h-8 p-0"
                          variant="outline"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white px-8 py-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Calendar System</div>
              <div className="font-bold text-gray-900 text-lg">{calendarSystem.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="px-8 py-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSave} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
