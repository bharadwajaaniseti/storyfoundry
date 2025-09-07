'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/auth'

interface ProjectContent {
  id: string
  project_id: string
  content: string
  filename: string
  asset_type: string
  updated_at: string
}

export function useRealtimeProjectContent(projectId: string) {
  const [content, setContent] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRealtimeUpdate, setHasRealtimeUpdate] = useState(false)

  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()

    // Initial load
    const loadContent = async () => {
      try {
        // Try to load from project_content table first
        let contentLoaded = false
        
        try {
          const { data } = await supabase
            .from('project_content')
            .select('*')
            .eq('project_id', projectId)
            .eq('asset_type', 'content')
            .order('created_at', { ascending: false })
            .limit(1)

          if (data && data.length > 0) {
            setContent(data[0].content || '')
            setLastUpdated(data[0].updated_at)
            contentLoaded = true
            console.log('Content loaded from project_content table')
          }
        } catch (error) {
          console.log('project_content table not available, trying fallback...')
        }

        // If content not loaded from project_content, try loading from projects.synopsis
        if (!contentLoaded) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('synopsis, updated_at')
            .eq('id', projectId)
            .single()

          if (projectData) {
            setContent(projectData.synopsis || '')
            setLastUpdated(projectData.updated_at)
            console.log('Content loaded from projects.synopsis as fallback')
          }
        }
      } catch (error) {
        console.error('Error loading content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()

    // Real-time subscription for project_content table
    const contentChannel = supabase
      .channel(`project_content_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_content',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time content update from project_content:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newContent = payload.new as ProjectContent
            if (newContent.asset_type === 'content') {
              setContent(newContent.content || '')
              setLastUpdated(newContent.updated_at)
              setHasRealtimeUpdate(true)
              
              // Clear the realtime update indicator after 3 seconds
              setTimeout(() => setHasRealtimeUpdate(false), 3000)
            }
          }
        }
      )
      .subscribe()

    // Real-time subscription for projects table (fallback)
    const projectChannel = supabase
      .channel(`project_synopsis_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time content update from projects.synopsis:', payload)
          
          if (payload.new) {
            // Only update content if it came from synopsis (our fallback storage)
            setContent(payload.new.synopsis || '')
            setLastUpdated(payload.new.updated_at)
            setHasRealtimeUpdate(true)
            
            // Clear the realtime update indicator after 3 seconds
            setTimeout(() => setHasRealtimeUpdate(false), 3000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contentChannel)
      supabase.removeChannel(projectChannel)
    }
  }, [projectId])

  return { 
    content, 
    setContent, 
    lastUpdated, 
    isLoading, 
    hasRealtimeUpdate,
    clearRealtimeUpdate: () => setHasRealtimeUpdate(false)
  }
}

export function useRealtimeProject(projectId: string) {
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()

    // Initial load
    const loadProject = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (data) {
          setProject(data)
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()

    // Real-time subscription for project updates
    const channel = supabase
      .channel(`project_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time project update:', payload)
          setProject(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return { project, setProject, isLoading }
}
