'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/auth'

export interface Timeline {
  id: string
  project_id: string
  name: string
  description: string
  attributes: {
    color?: string
    is_default?: boolean
    lanes?: string[]
  }
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  project_id: string
  timeline_id: string
  user_id: string
  title: string
  description: string
  date: string // Legacy field, keeping for compatibility
  start_date: string
  end_date: string
  event_type: 'story' | 'historical' | 'personal' | 'world'
  importance: 'low' | 'medium' | 'high' | 'critical'
  lane: string
  participants: string[]
  location: string
  consequences: string
  tags: string[]
  attributes: Record<string, any>
  created_at: string
  updated_at: string
}

// Type for creating new events (excludes fields set by database)
export interface CreateTimelineEvent {
  project_id: string
  timeline_id: string
  title: string
  description: string
  date: string
  start_date: string
  end_date: string
  event_type: 'story' | 'historical' | 'personal' | 'world'
  importance: 'low' | 'medium' | 'high' | 'critical'
  lane: string
  participants: string[]
  location: string
  consequences: string
  tags: string[]
  attributes: Record<string, any>
  user_id?: string // Optional since trigger can handle it
}

// Hook for managing timelines (now stored in world_elements)
export function useTimelines(projectId: string) {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTimelines = useCallback(async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'timeline')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading timelines:', error)
        throw error
      }

      // Transform world_elements data to Timeline interface
      const transformedTimelines: Timeline[] = (data || []).map(element => ({
        id: element.id,
        project_id: element.project_id,
        name: element.name,
        description: element.description || '',
        attributes: {
          color: element.attributes?.color || '#3B82F6',
          is_default: element.attributes?.is_default || false,
          lanes: element.attributes?.lanes || ['world', 'plot', 'characters', 'locations', 'items']
        },
        created_at: element.created_at,
        updated_at: element.updated_at
      }))
      
      setTimelines(transformedTimelines)
      setError(null)
    } catch (error) {
      console.error('Error loading timelines:', error)
      setError('Failed to load timelines')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const createTimeline = async (timelineData: Omit<Timeline, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const supabase = createSupabaseClient()
      
      // Transform Timeline data to world_elements format
      const worldElementData = {
        project_id: timelineData.project_id,
        category: 'timeline',
        name: timelineData.name,
        description: timelineData.description,
        attributes: timelineData.attributes,
        tags: []
      }
      
      const { data, error } = await supabase
        .from('world_elements')
        .insert(worldElementData)
        .select()
        .single()

      if (error) throw error

      // Transform back to Timeline interface
      const newTimeline: Timeline = {
        id: data.id,
        project_id: data.project_id,
        name: data.name,
        description: data.description || '',
        attributes: {
          color: data.attributes?.color || '#3B82F6',
          is_default: data.attributes?.is_default || false,
          lanes: data.attributes?.lanes || ['world', 'plot', 'characters', 'locations', 'items']
        },
        created_at: data.created_at,
        updated_at: data.updated_at
      }
      
      setTimelines(prev => [newTimeline, ...prev])
      return { timeline: newTimeline, worldElement: data }
    } catch (error) {
      console.error('Error creating timeline:', error)
      throw error
    }
  }

  const updateTimeline = async (id: string, updates: Partial<Timeline>) => {
    try {
      const supabase = createSupabaseClient()
      
      // Transform updates to world_elements format
      const worldElementUpdates = {
        name: updates.name,
        description: updates.description,
        attributes: updates.attributes
      }
      
      const { data, error } = await supabase
        .from('world_elements')
        .update(worldElementUpdates)
        .eq('id', id)
        .eq('category', 'timeline')
        .select()
        .single()

      if (error) throw error

      // Transform back to Timeline interface
      const updatedTimeline: Timeline = {
        id: data.id,
        project_id: data.project_id,
        name: data.name,
        description: data.description || '',
        attributes: {
          color: data.attributes?.color || '#3B82F6',
          is_default: data.attributes?.is_default || false,
          lanes: data.attributes?.lanes || ['world', 'plot', 'characters', 'locations', 'items']
        },
        created_at: data.created_at,
        updated_at: data.updated_at
      }
      
      setTimelines(prev => prev.map(timeline => 
        timeline.id === id ? updatedTimeline : timeline
      ))
      return updatedTimeline
    } catch (error) {
      console.error('Error updating timeline:', error)
      throw error
    }
  }

  const deleteTimeline = async (id: string) => {
    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)
        .eq('category', 'timeline')

      if (error) throw error
      
      setTimelines(prev => prev.filter(timeline => timeline.id !== id))
    } catch (error) {
      console.error('Error deleting timeline:', error)
      throw error
    }
  }

  useEffect(() => {
    loadTimelines()
  }, [loadTimelines])

  // Set up real-time subscription for timeline changes
  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()
    const channel = supabase
      .channel(`world-elements-timelines-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'world_elements',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        // Only handle timeline category changes
        if (payload.new && (payload.new as any).category === 'timeline') {
          if (payload.eventType === 'INSERT') {
            const newElement = payload.new as any
            const newTimeline: Timeline = {
              id: newElement.id,
              project_id: newElement.project_id,
              name: newElement.name,
              description: newElement.description || '',
              attributes: {
                color: newElement.attributes?.color || '#3B82F6',
                is_default: newElement.attributes?.is_default || false,
                lanes: newElement.attributes?.lanes || ['world', 'plot', 'characters', 'locations', 'items']
              },
              created_at: newElement.created_at,
              updated_at: newElement.updated_at
            }
            setTimelines(prev => {
              const exists = prev.some(timeline => timeline.id === newTimeline.id)
              return exists ? prev : [newTimeline, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedElement = payload.new as any
            const updatedTimeline: Timeline = {
              id: updatedElement.id,
              project_id: updatedElement.project_id,
              name: updatedElement.name,
              description: updatedElement.description || '',
              attributes: {
                color: updatedElement.attributes?.color || '#3B82F6',
                is_default: updatedElement.attributes?.is_default || false,
                lanes: updatedElement.attributes?.lanes || ['world', 'plot', 'characters', 'locations', 'items']
              },
              created_at: updatedElement.created_at,
              updated_at: updatedElement.updated_at
            }
            setTimelines(prev => prev.map(timeline => 
              timeline.id === updatedTimeline.id ? updatedTimeline : timeline
            ))
          } else if (payload.eventType === 'DELETE') {
            const deletedElement = payload.old as any
            setTimelines(prev => prev.filter(timeline => timeline.id !== deletedElement.id))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return {
    timelines,
    isLoading,
    error,
    createTimeline,
    updateTimeline,
    deleteTimeline,
    refresh: loadTimelines
  }
}

// Hook for managing timeline events
export function useTimelineEvents(projectId: string, timelineId?: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()
      
      let query = supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)

      if (timelineId) {
        query = query.eq('timeline_id', timelineId)
      }

      const { data, error } = await query
        .order('start_date', { ascending: true })

      if (error) throw error
      
      setEvents(data || [])
      setError(null)
    } catch (error) {
      console.error('Error loading timeline events:', error)
      setError('Failed to load timeline events')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, timelineId])

  const createEvent = async (eventData: CreateTimelineEvent) => {
    try {
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase
        .from('timeline_events')
        .insert(eventData)
        .select()
        .single()

      if (error) {
        console.error('Database error details:', error)
        throw error
      }
      
      setEvents(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ))
      return data
    } catch (error) {
      console.error('Error creating timeline event:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }
  }

  const updateEvent = async (id: string, updates: Partial<TimelineEvent>) => {
    try {
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase
        .from('timeline_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setEvents(prev => prev.map(event => 
        event.id === id ? data : event
      ).sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ))
      return data
    } catch (error) {
      console.error('Error updating timeline event:', error)
      throw error
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (error) {
      console.error('Error deleting timeline event:', error)
      throw error
    }
  }

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Set up real-time subscription for timeline event changes
  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()
    const channel = supabase
      .channel(`timeline-events-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timeline_events',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEvent = payload.new as TimelineEvent
          if (!timelineId || newEvent.timeline_id === timelineId) {
            setEvents(prev => {
              const exists = prev.some(event => event.id === newEvent.id)
              if (exists) return prev
              return [...prev, newEvent].sort((a, b) => 
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              )
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedEvent = payload.new as TimelineEvent
          if (!timelineId || updatedEvent.timeline_id === timelineId) {
            setEvents(prev => prev.map(event => 
              event.id === updatedEvent.id ? updatedEvent : event
            ).sort((a, b) => 
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            ))
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedEvent = payload.old as TimelineEvent
          setEvents(prev => prev.filter(event => event.id !== deletedEvent.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, timelineId])

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: loadEvents
  }
}

// Combined hook for complete timeline management
export function useTimelineManager(projectId: string) {
  const timelineHook = useTimelines(projectId)
  const eventHook = useTimelineEvents(projectId)

  // Get default timeline or first timeline
  const defaultTimeline = timelineHook.timelines.find(t => t.attributes.is_default) || timelineHook.timelines[0]
  
  // Get events for the default/selected timeline
  const selectedTimelineEvents = useTimelineEvents(projectId, defaultTimeline?.id)

  return {
    // Timeline management
    timelines: timelineHook.timelines,
    timelinesLoading: timelineHook.isLoading,
    timelinesError: timelineHook.error,
    createTimeline: timelineHook.createTimeline,
    updateTimeline: timelineHook.updateTimeline,
    deleteTimeline: timelineHook.deleteTimeline,
    refreshTimelines: timelineHook.refresh,
    
    // Event management (all events across timelines)
    allEvents: eventHook.events,
    allEventsLoading: eventHook.isLoading,
    allEventsError: eventHook.error,
    createEvent: eventHook.createEvent,
    updateEvent: eventHook.updateEvent,
    deleteEvent: eventHook.deleteEvent,
    refreshEvents: eventHook.refresh,
    
    // Selected timeline events
    selectedTimeline: defaultTimeline,
    selectedTimelineEvents: selectedTimelineEvents.events,
    selectedTimelineEventsLoading: selectedTimelineEvents.isLoading,
    selectedTimelineEventsError: selectedTimelineEvents.error,
    
    // Helper methods
    getEventsForTimeline: (timelineId: string) => 
      eventHook.events.filter(event => event.timeline_id === timelineId),
  }
}