'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Target, Search, MoreVertical, Trash2, Edit3, BookOpen,
  TrendingUp, Users, Clock, Flag, ChevronDown, ChevronRight,
  Save, X, Calendar, MapPin, User, Zap, Heart, Crown, Eye, EyeOff,
  ArrowRight, CheckCircle, Circle, AlertTriangle, Star, BarChart3,
  GitBranch, Layers, Activity, Grid, List, Download, FileText,
  Filter, SortAsc, Palette, Tag, Link, MessageSquare, History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Arc {
  id: string
  name: string
  description: string
  attributes: {
    type?: string // character, plot, theme, relationship, world, subplot
    status?: string // planned, active, completed, abandoned, on_hold
    priority?: number // 1-5 scale
    progress?: number // 0-100 percentage
    start_chapter?: string
    end_chapter?: string
    character_ids?: string[]
    character_names?: string[]
    location_ids?: string[]
    location_names?: string[]
    chapter_ids?: string[]
    chapter_names?: string[]
    timeline_event_ids?: string[]
    relationship_ids?: string[]
    parent_arc_id?: string // for sub-arcs
    sub_arc_ids?: string[]
    color?: string // for visual organization
    milestones?: Array<{
      id: string
      title: string
      description: string
      chapter?: string
      completed: boolean
      order: number
      beat_type?: string // setup, conflict, climax, resolution, custom
      character_growth?: string
      mood?: string
      theme?: string
    }>
    themes?: string[]
    moods?: string[]
    conflicts?: string[]
    resolution?: string
    notes?: string
    comments?: Array<{
      id: string
      author: string
      content: string
      timestamp: string
    }>
    ai_suggestions?: Array<{
      type: string
      content: string
      confidence: number
    }>
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface Character {
  id: string
  name: string
  description: string
  category: string
}

interface Chapter {
  id: string
  name: string
  description: string
  category: string
  order?: number
}

interface Location {
  id: string
  name: string
  description: string
  category: string
}

interface TimelineEvent {
  id: string
  name: string
  description: string
  category: string
  date?: string
}

interface Relationship {
  id: string
  name: string
  description: string
  category: string
}

interface ArcsPanelProps {
  projectId: string
  selectedElement?: any
  onArcsChange?: () => void
  onClearSelection?: () => void
  onSelectArc?: (arc: Arc) => void
}

const ARC_TYPES = [
  { value: 'character', label: 'Character Arc', icon: User, color: 'blue' },
  { value: 'plot', label: 'Plot Arc', icon: BookOpen, color: 'green' },
  { value: 'subplot', label: 'Subplot', icon: GitBranch, color: 'teal' },
  { value: 'theme', label: 'Thematic Arc', icon: Heart, color: 'purple' },
  { value: 'relationship', label: 'Relationship Arc', icon: Users, color: 'pink' },
  { value: 'world', label: 'World Arc', icon: Crown, color: 'amber' },
  { value: 'mystery', label: 'Mystery Arc', icon: Eye, color: 'indigo' }
]

const ARC_STATUS = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'active', label: 'In Progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'on_hold', label: 'On Hold', color: 'yellow' },
  { value: 'archived', label: 'Archived', color: 'red' }
]

const BEAT_TYPES = [
  { value: 'setup', label: 'Setup', color: 'blue' },
  { value: 'inciting_incident', label: 'Inciting Incident', color: 'orange' },
  { value: 'conflict', label: 'Conflict', color: 'red' },
  { value: 'climax', label: 'Climax', color: 'purple' },
  { value: 'resolution', label: 'Resolution', color: 'green' },
  { value: 'custom', label: 'Custom', color: 'gray' }
]

const VIEW_MODES = [
  { value: 'list', label: 'List View', icon: List },
  { value: 'timeline', label: 'Timeline View', icon: Activity },
  { value: 'graph', label: 'Graph View', icon: GitBranch }
]

const ARC_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
]

const COMMON_THEMES = [
  'redemption', 'coming_of_age', 'sacrifice', 'love', 'betrayal', 'power', 'justice',
  'family', 'friendship', 'revenge', 'discovery', 'transformation', 'loss', 'hope',
  'identity', 'survival', 'corruption', 'freedom', 'loyalty', 'forgiveness'
]

const COMMON_MOODS = [
  'hopeful', 'melancholic', 'tense', 'mysterious', 'romantic', 'triumphant',
  'dark', 'lighthearted', 'suspenseful', 'peaceful', 'chaotic', 'inspiring'
]

export default function ArcsPanel({ 
  projectId, 
  selectedElement, 
  onArcsChange,
  onClearSelection,
  onSelectArc 
}: ArcsPanelProps) {
  const [arcs, setArcs] = useState<Arc[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<string>('list')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArc, setEditingArc] = useState<Arc | null>(null)
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [expandedArcs, setExpandedArcs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSubArcs, setShowSubArcs] = useState(true)
  const [filterByParent, setFilterByParent] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    status: 'planned',
    priority: 3,
    progress: 0,
    start_chapter: '',
    end_chapter: '',
    character_ids: [] as string[],
    location_ids: [] as string[],
    chapter_ids: [] as string[],
    timeline_event_ids: [] as string[],
    relationship_ids: [] as string[],
    parent_arc_id: 'none',
    color: ARC_COLORS[0],
    themes: [] as string[],
    moods: [] as string[],
    conflicts: [] as string[],
    resolution: '',
    notes: '',
    tags: [] as string[],
    milestones: [] as Array<{
      id: string
      title: string
      description: string
      chapter?: string
      completed: boolean
      order: number
      beat_type?: string
      character_growth?: string
      mood?: string
      theme?: string
    }>
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadArcs()
    loadCharacters()
    loadChapters()
    loadLocations()
    loadTimelineEvents()
    loadRelationships()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'arcs') {
      setSelectedArc(selectedElement)
      setShowDetailView(true)
    }
  }, [selectedElement])

  const loadArcs = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'arcs')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArcs(data || [])
    } catch (error) {
      console.error('Error loading arcs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category')
        .eq('project_id', projectId)
        .eq('category', 'characters')
        .order('name')

      if (error) throw error
      setCharacters(data || [])
    } catch (error) {
      console.error('Error loading characters:', error)
    }
  }

  const loadChapters = async () => {
    try {
      // First try to load from project_chapters table
      let { data, error } = await supabase
        .from('project_chapters')
        .select('id, title, chapter_number')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })

      if (error) {
        // Fallback to world_elements table
        const fallbackResult = await supabase
          .from('world_elements')
          .select('id, name, description, category, attributes')
          .eq('project_id', projectId)
          .eq('category', 'chapters')
          .order('name')
        
        if (fallbackResult.error) {
          throw fallbackResult.error
        }
        
        setChapters(fallbackResult.data?.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          description: chapter.description || '',
          category: 'chapters' as const,
          order: chapter.attributes?.order || 0
        })) || [])
        return
      }

      setChapters(data?.map(chapter => ({
        id: chapter.id,
        name: chapter.title,
        description: '', // No description field in project_chapters table
        category: 'chapters' as const,
        order: chapter.chapter_number || 0
      })) || [])
    } catch (error) {
      console.error('Error loading chapters:', error)
    }
  }

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category')
        .eq('project_id', projectId)
        .eq('category', 'locations')
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const loadTimelineEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category, attributes')
        .eq('project_id', projectId)
        .eq('category', 'timeline')
        .order('name')

      if (error) throw error
      setTimelineEvents(data?.map(event => ({
        ...event,
        date: event.attributes?.date || ''
      })) || [])
    } catch (error) {
      console.error('Error loading timeline events:', error)
    }
  }

  const loadRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('id, name, description, category')
        .eq('project_id', projectId)
        .eq('category', 'relationships')
        .order('name')

      if (error) throw error
      setRelationships(data || [])
    } catch (error) {
      console.error('Error loading relationships:', error)
    }
  }

  const populateFormData = (arc: Arc) => {
    setFormData({
      name: arc.name,
      description: arc.description,
      type: arc.attributes?.type || '',
      status: arc.attributes?.status || 'planned',
      priority: arc.attributes?.priority || 3,
      progress: arc.attributes?.progress || 0,
      start_chapter: arc.attributes?.start_chapter || '',
      end_chapter: arc.attributes?.end_chapter || '',
      character_ids: arc.attributes?.character_ids || [],
      location_ids: arc.attributes?.location_ids || [],
      chapter_ids: arc.attributes?.chapter_ids || [],
      timeline_event_ids: arc.attributes?.timeline_event_ids || [],
      relationship_ids: arc.attributes?.relationship_ids || [],
      parent_arc_id: arc.attributes?.parent_arc_id || 'none',
      color: arc.attributes?.color || ARC_COLORS[0],
      themes: arc.attributes?.themes || [],
      moods: arc.attributes?.moods || [],
      conflicts: arc.attributes?.conflicts || [],
      resolution: arc.attributes?.resolution || '',
      notes: arc.attributes?.notes || '',
      tags: arc.tags || [],
      milestones: arc.attributes?.milestones || []
    })
  }

  const filteredArcs = arcs.filter(arc => {
    const matchesSearch = !searchTerm || 
      arc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arc.attributes?.themes?.some((theme: string) => 
        theme.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      arc.tags?.some((tag: string) => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesType = selectedType === 'all' || !selectedType || arc.attributes?.type === selectedType
    const matchesStatus = selectedStatus === 'all' || !selectedStatus || arc.attributes?.status === selectedStatus
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => arc.tags?.includes(tag))

    const matchesParent = filterByParent === 'all' || 
      (filterByParent === 'main' && !arc.attributes?.parent_arc_id) ||
      (filterByParent === 'sub' && arc.attributes?.parent_arc_id) ||
      arc.attributes?.parent_arc_id === filterByParent
    
    return matchesSearch && matchesType && matchesStatus && matchesTags && matchesParent
  })

  // Sort arcs
  const sortedArcs = [...filteredArcs].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'type':
        aValue = a.attributes?.type || ''
        bValue = b.attributes?.type || ''
        break
      case 'status':
        aValue = a.attributes?.status || ''
        bValue = b.attributes?.status || ''
        break
      case 'priority':
        aValue = a.attributes?.priority || 0
        bValue = b.attributes?.priority || 0
        break
      case 'progress':
        aValue = a.attributes?.progress || 0
        bValue = b.attributes?.progress || 0
        break
      case 'updated_at':
      default:
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
        break
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleCreateArc = async () => {
    try {
      const selectedCharacters = characters.filter(c => formData.character_ids.includes(c.id))
      const selectedLocations = locations.filter(l => formData.location_ids.includes(l.id))
      const selectedChapters = chapters.filter(c => formData.chapter_ids.includes(c.id))
      const selectedTimelineEvents = timelineEvents.filter(t => formData.timeline_event_ids.includes(t.id))
      const selectedRelationships = relationships.filter(r => formData.relationship_ids.includes(r.id))
      
      const arcData = {
        project_id: projectId,
        category: 'arcs',
        name: formData.name,
        description: formData.description,
        attributes: {
          type: formData.type,
          status: formData.status,
          priority: formData.priority,
          progress: formData.progress,
          start_chapter: formData.start_chapter,
          end_chapter: formData.end_chapter,
          character_ids: formData.character_ids,
          character_names: selectedCharacters.map(c => c.name),
          location_ids: formData.location_ids,
          location_names: selectedLocations.map(l => l.name),
          chapter_ids: formData.chapter_ids,
          chapter_names: selectedChapters.map(c => c.name),
          timeline_event_ids: formData.timeline_event_ids,
          relationship_ids: formData.relationship_ids,
          parent_arc_id: formData.parent_arc_id === 'none' ? null : formData.parent_arc_id,
          color: formData.color,
          themes: formData.themes,
          moods: formData.moods,
          conflicts: formData.conflicts,
          resolution: formData.resolution,
          notes: formData.notes,
          milestones: formData.milestones
        },
        tags: formData.tags
      }

      let result: Arc
      if (editingArc) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...arcData, updated_at: new Date().toISOString() })
          .eq('id', editingArc.id)
          .select()
          .single()

        if (error) throw error
        result = data as Arc

        setArcs(prev => prev.map(a => a.id === editingArc.id ? result : a))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(arcData)
          .select()
          .single()

        if (error) throw error
        result = data as Arc

        setArcs(prev => [result, ...prev])

        // If this is a sub-arc, update the parent's sub_arc_ids
        if (formData.parent_arc_id && formData.parent_arc_id !== 'none') {
          const parentArc = arcs.find(a => a.id === formData.parent_arc_id)
          if (parentArc) {
            const updatedSubArcIds = [...(parentArc.attributes?.sub_arc_ids || []), result.id]
            await supabase
              .from('world_elements')
              .update({
                attributes: {
                  ...parentArc.attributes,
                  sub_arc_ids: updatedSubArcIds
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', formData.parent_arc_id)
          }
        }
      }

      // Broadcast change
      window.dispatchEvent(new CustomEvent('arcCreated', { 
        detail: { arc: result, projectId } 
      }))

      setShowCreateDialog(false)
      setEditingArc(null)
      resetForm()
      onArcsChange?.()
    } catch (error) {
      console.error('Error creating/updating arc:', error)
    }
  }

  const handleDeleteArc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this arc?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setArcs(prev => prev.filter(a => a.id !== id))
      onArcsChange?.()
    } catch (error) {
      console.error('Error deleting arc:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      status: 'planned',
      priority: 3,
      progress: 0,
      start_chapter: '',
      end_chapter: '',
      character_ids: [],
      location_ids: [],
      chapter_ids: [],
      timeline_event_ids: [],
      relationship_ids: [],
      parent_arc_id: 'none',
      color: ARC_COLORS[0],
      themes: [],
      moods: [],
      conflicts: [],
      resolution: '',
      notes: '',
      tags: [],
      milestones: []
    })
  }

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      chapter: '',
      completed: false,
      order: formData.milestones.length + 1,
      beat_type: 'custom',
      character_growth: '',
      mood: '',
      theme: ''
    }
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }))
  }

  const updateMilestone = (id: string, updates: Partial<typeof formData.milestones[0]>) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    }))
  }

  const removeMilestone = (id: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }))
  }

  const getArcTypeIcon = (type: string) => {
    const arcType = ARC_TYPES.find(t => t.value === type)
    return arcType ? arcType.icon : Target
  }

  const getArcTypeColor = (type: string) => {
    const arcType = ARC_TYPES.find(t => t.value === type)
    return arcType ? arcType.color : 'gray'
  }

  const getStatusColor = (status: string) => {
    const statusObj = ARC_STATUS.find(s => s.value === status)
    return statusObj ? statusObj.color : 'gray'
  }

  const toggleArcExpansion = (arcId: string) => {
    setExpandedArcs(prev => 
      prev.includes(arcId) 
        ? prev.filter(id => id !== arcId)
        : [...prev, arcId]
    )
  }

  if (loading) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Detail View Component
  if (showDetailView && selectedArc) {
    const TypeIcon = getArcTypeIcon(selectedArc.attributes?.type || '')
    const typeColor = getArcTypeColor(selectedArc.attributes?.type || '')
    const statusColor = getStatusColor(selectedArc.attributes?.status || 'planned')
    const progress = selectedArc.attributes?.progress || 0

    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDetailView(false)
                    setSelectedArc(null)
                    onClearSelection?.()
                  }}
                  className="p-2 hover:bg-gray-100"
                >
                  <ArrowRight className="w-5 h-5 rotate-180 text-gray-600" />
                </Button>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: selectedArc.attributes?.color || ARC_COLORS[0]
                    }}
                  />
                  <TypeIcon className={`w-6 h-6 text-${typeColor}-500`} />
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{selectedArc.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                        {ARC_STATUS.find(s => s.value === selectedArc.attributes?.status)?.label || 'Planned'}
                      </span>
                      {selectedArc.attributes?.priority && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Priority: {selectedArc.attributes.priority}/5
                        </span>
                      )}
                      {selectedArc.attributes?.parent_arc_id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Sub-arc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingArc(selectedArc)
                    populateFormData(selectedArc)
                    setShowCreateDialog(true)
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Arc
                </Button>
                <Button
                  onClick={() => {
                    // Create sub-arc
                    setFormData(prev => ({ ...prev, parent_arc_id: selectedArc.id }))
                    setShowCreateDialog(true)
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Add Sub-arc
                </Button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {/* Progress Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Progress & Status</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {selectedArc.attributes?.start_chapter && selectedArc.attributes?.end_chapter && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Chapter</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedArc.attributes.start_chapter}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Chapter</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedArc.attributes.end_chapter}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedArc.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedArc.description}</p>
              </div>
            )}

            {/* Connected Elements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Characters */}
              {selectedArc.attributes?.character_names && selectedArc.attributes.character_names.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-gray-900">Characters ({selectedArc.attributes.character_names.length})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArc.attributes.character_names.map((name: string) => (
                      <span key={name} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {selectedArc.attributes?.location_names && selectedArc.attributes.location_names.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <h3 className="text-base font-semibold text-gray-900">Locations ({selectedArc.attributes.location_names.length})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArc.attributes.location_names.map((name: string) => (
                      <span key={name} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapters */}
              {selectedArc.attributes?.chapter_names && selectedArc.attributes.chapter_names.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <h3 className="text-base font-semibold text-gray-900">Chapters ({selectedArc.attributes.chapter_names.length})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArc.attributes.chapter_names.map((name: string) => (
                      <span key={name} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {selectedArc.attributes?.themes && selectedArc.attributes.themes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <h3 className="text-base font-semibold text-gray-900">Themes ({selectedArc.attributes.themes.length})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArc.attributes.themes.map((theme: string) => (
                      <span key={theme} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 capitalize">
                        {theme.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Milestones */}
            {selectedArc.attributes?.milestones && selectedArc.attributes.milestones.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Flag className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Milestones ({selectedArc.attributes.milestones.length})</h2>
                </div>
                <div className="space-y-4">
                  {selectedArc.attributes.milestones.map((milestone: any, index: number) => (
                    <div key={milestone.id} className="relative">
                      {index > 0 && <div className="absolute top-0 left-2.5 w-0.5 h-6 bg-gray-200 -translate-y-6"></div>}
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-shrink-0 mt-0.5">
                          {milestone.completed ? 
                            <CheckCircle className="w-5 h-5 text-green-500" /> :
                            <Circle className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-sm font-medium ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {milestone.title}
                            </h4>
                            {milestone.beat_type && milestone.beat_type !== 'custom' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                {BEAT_TYPES.find(b => b.value === milestone.beat_type)?.label}
                              </span>
                            )}
                            {milestone.chapter && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Ch. {milestone.chapter}
                              </span>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                          )}
                          {milestone.character_growth && (
                            <p className="text-sm text-blue-600">
                              <span className="font-medium">Character Growth:</span> {milestone.character_growth}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution */}
            {selectedArc.attributes?.resolution && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Arc Resolution</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedArc.attributes.resolution}</p>
              </div>
            )}

            {/* Notes */}
            {selectedArc.attributes?.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedArc.attributes.notes}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedArc.tags && selectedArc.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedArc.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Target className="w-7 h-7 text-amber-500" />
                Story Arcs
              </h2>
              <p className="text-gray-600 mt-1">Plan character development and plot progression throughout your story</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {VIEW_MODES.map(mode => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setViewMode(mode.value)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode.value 
                          ? 'bg-white text-amber-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {mode.label}
                    </button>
                  )
                })}
              </div>
              <Button
                onClick={() => {
                  setEditingArc(null)
                  resetForm()
                  setShowCreateDialog(true)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Arc
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search arcs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500 transition-colors duration-200">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white animate-in fade-in-0 zoom-in-95 duration-200">
                  <SelectItem value="all">All Types</SelectItem>
                  {ARC_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500 transition-colors duration-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white animate-in fade-in-0 zoom-in-95 duration-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ARC_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value} className="hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${status.color}-500`}></div>
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filterByParent} onValueChange={setFilterByParent}>
                <SelectTrigger className="w-48 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500 transition-colors duration-200">
                  <SelectValue placeholder="Arc hierarchy" />
                </SelectTrigger>
                <SelectContent className="bg-white animate-in fade-in-0 zoom-in-95 duration-200">
                  <SelectItem value="all" className="hover:bg-gray-50 transition-colors duration-150">All Arcs</SelectItem>
                  <SelectItem value="main" className="hover:bg-gray-50 transition-colors duration-150">Main Arcs Only</SelectItem>
                  <SelectItem value="sub" className="hover:bg-gray-50 transition-colors duration-150">Sub-arcs Only</SelectItem>
                  {arcs.filter(arc => !arc.attributes?.parent_arc_id).map(arc => (
                    <SelectItem key={arc.id} value={arc.id} className="hover:bg-gray-50 transition-colors duration-150">
                      Sub-arcs of {arc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500 transition-colors duration-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white animate-in fade-in-0 zoom-in-95 duration-200">
                  <SelectItem value="updated_at" className="hover:bg-gray-50 transition-colors duration-150">Last Updated</SelectItem>
                  <SelectItem value="name" className="hover:bg-gray-50 transition-colors duration-150">Name</SelectItem>
                  <SelectItem value="type" className="hover:bg-gray-50 transition-colors duration-150">Type</SelectItem>
                  <SelectItem value="status" className="hover:bg-gray-50 transition-colors duration-150">Status</SelectItem>
                  <SelectItem value="priority" className="hover:bg-gray-50 transition-colors duration-150">Priority</SelectItem>
                  <SelectItem value="progress" className="hover:bg-gray-50 transition-colors duration-150">Progress</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>

              {/* Tag filter chips */}
              <div className="flex items-center gap-2">
                {Array.from(new Set(arcs.flatMap(arc => arc.tags || []))).slice(0, 5).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {sortedArcs.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No story arcs yet</h3>
            <p className="text-gray-600 mb-6">
              Create arcs to track character development and plot progression throughout your story.
            </p>
            <Button 
              onClick={() => {
                setEditingArc(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Arc
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Arc Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Arcs</p>
                    <p className="text-2xl font-bold text-gray-900">{arcs.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {arcs.filter(arc => arc.attributes?.status === 'active').length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {arcs.filter(arc => arc.attributes?.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(arcs.reduce((sum, arc) => sum + (arc.attributes?.progress || 0), 0) / arcs.length || 0)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* View Mode Content */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {sortedArcs.map(arc => {
                  const TypeIcon = getArcTypeIcon(arc.attributes?.type || '')
                  const typeColor = getArcTypeColor(arc.attributes?.type || '')
                  const statusColor = getStatusColor(arc.attributes?.status || 'planned')
                  const isExpanded = expandedArcs.includes(arc.id)
                  const progress = arc.attributes?.progress || 0
                  const isSubArc = !!arc.attributes?.parent_arc_id
                  
                  return (
                    <div key={arc.id} className={`bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow ${
                      isSubArc ? 'ml-8 border-l-4 border-l-amber-300' : ''
                    }`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleArcExpansion(arc.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {isExpanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                            </button>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ 
                                backgroundColor: arc.attributes?.color || ARC_COLORS[0]
                              }}
                            />
                            <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <button
                                  onClick={() => {
                                    setSelectedArc(arc)
                                    setShowDetailView(true)
                                    onSelectArc?.(arc)
                                  }}
                                  className="text-lg font-semibold text-gray-900 hover:text-amber-600 transition-colors cursor-pointer text-left"
                                >
                                  {arc.name}
                                </button>
                                {isSubArc && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    Sub-arc
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                                  {ARC_STATUS.find(s => s.value === arc.attributes?.status)?.label || 'Planned'}
                                </span>
                                {arc.attributes?.priority && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Priority: {arc.attributes.priority}/5
                                  </span>
                                )}
                                {arc.attributes?.character_names && arc.attributes.character_names.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {arc.attributes.character_names.length} character{arc.attributes.character_names.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {arc.tags && arc.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {arc.tags.slice(0, 2).map(tag => (
                                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {tag}
                                      </span>
                                    ))}
                                    {arc.tags.length > 2 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        +{arc.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Progress bar */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Progress</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{progress}%</span>
                              </div>
                              {arc.description && (
                                <p className="text-gray-600 text-sm mt-3">{arc.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingArc(arc)
                                populateFormData(arc)
                                setShowCreateDialog(true)
                              }}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteArc(arc.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          <div className="space-y-4">
                            {/* Linked Elements */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Characters */}
                              {arc.attributes?.character_names && arc.attributes.character_names.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    Characters
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {arc.attributes.character_names.map((name: string) => (
                                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Locations */}
                              {arc.attributes?.location_names && arc.attributes.location_names.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    Locations
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {arc.attributes.location_names.map((name: string) => (
                                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Chapters */}
                              {arc.attributes?.chapter_names && arc.attributes.chapter_names.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    Chapters
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {arc.attributes.chapter_names.map((name: string) => (
                                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Themes */}
                              {arc.attributes?.themes && arc.attributes.themes.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    Themes
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {arc.attributes.themes.map((theme: string) => (
                                      <span key={theme} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">
                                        {theme}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sub-arcs */}
                            {arc.attributes?.sub_arc_ids && arc.attributes.sub_arc_ids.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                  <GitBranch className="w-4 h-4" />
                                  Sub-arcs
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {arc.attributes.sub_arc_ids.map((subArcId: string) => {
                                    const subArc = arcs.find(a => a.id === subArcId)
                                    return subArc ? (
                                      <span key={subArcId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                        {subArc.name}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Milestones */}
                            {arc.attributes?.milestones && arc.attributes.milestones.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                                  <Flag className="w-4 h-4" />
                                  Milestones
                                </h4>
                                <div className="space-y-2">
                                  {arc.attributes.milestones.slice(0, 3).map((milestone: any) => (
                                    <div key={milestone.id} className="flex items-center gap-2 text-sm">
                                      {milestone.completed ? 
                                        <CheckCircle className="w-4 h-4 text-green-500" /> :
                                        <Circle className="w-4 h-4 text-gray-400" />
                                      }
                                      <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                                        {milestone.title}
                                      </span>
                                      {milestone.beat_type && milestone.beat_type !== 'custom' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          {BEAT_TYPES.find(b => b.value === milestone.beat_type)?.label}
                                        </span>
                                      )}
                                      {milestone.chapter && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          Ch. {milestone.chapter}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingArc(arc)
                                    populateFormData(arc)
                                    setShowCreateDialog(true)
                                  }}
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Create sub-arc
                                    setFormData(prev => ({ ...prev, parent_arc_id: arc.id }))
                                    setShowCreateDialog(true)
                                  }}
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <GitBranch className="w-4 h-4 mr-1" />
                                  Add Sub-arc
                                </Button>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(arc.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Timeline View Placeholder */}
            {viewMode === 'timeline' && (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline View</h3>
                <p className="text-gray-600 mb-2">
                  Interactive timeline visualization showing arc progression across chapters.
                </p>
                <p className="text-sm text-amber-600 font-medium">Coming soon!</p>
              </div>
            )}

            {/* Graph View Placeholder */}
            {viewMode === 'graph' && (
              <div className="text-center py-12">
                <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Graph View</h3>
                <p className="text-gray-600 mb-2">
                  Network diagram showing relationships between arcs, characters, and plot points.
                </p>
                <p className="text-sm text-amber-600 font-medium">Coming soon!</p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setEditingArc(null)
            resetForm()
            onClearSelection?.()
          }
        }}>
          <DialogContent className="max-w-7xl w-[95vw] sm:max-w-7xl md:max-w-7xl lg:max-w-7xl xl:max-w-7xl max-h-[95vh] bg-white border border-gray-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 -m-6 mb-0">
              <DialogHeader className="text-white">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  {editingArc ? 'Edit Arc' : 'Create New Arc'}
                </DialogTitle>
                <DialogDescription className="text-amber-100 text-sm mt-1">
                  Define a story arc to track character development and plot progression throughout your narrative.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-8">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Basic Information */}
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-amber-500" />
                      Basic Information
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Arc Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter arc name..."
                          className="border-gray-300 focus:border-amber-500 focus:ring-amber-500 text-base py-3"
                        />
                      </div>

                      <div>
                        <Label htmlFor="type" className="text-sm font-semibold text-gray-700 mb-2 block">Arc Type</Label>
                        <Select value={formData.type} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }>
                          <SelectTrigger className="border-gray-300 focus:border-amber-500 py-3 text-base">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-xl">
                            {ARC_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value} className="hover:bg-amber-50 py-3">
                                <div className="flex items-center gap-3">
                                  <type.icon className="w-5 h-5" />
                                  <span className="text-base">{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe this arc..."
                          rows={4}
                          className="border-gray-300 focus:border-amber-500 focus:ring-amber-500 text-base resize-none"
                        />
                      </div>

                      {/* Parent Arc Selection */}
                      <div>
                        <Label htmlFor="parent_arc" className="text-sm font-semibold text-gray-700 mb-2 block">Parent Arc</Label>
                        <p className="text-xs text-gray-500 mb-3">Create a sub-arc under another arc</p>
                        <Select 
                          value={formData.parent_arc_id} 
                          onValueChange={(value) => 
                            setFormData(prev => ({ ...prev, parent_arc_id: value }))
                          }
                        >
                          <SelectTrigger className="border-gray-300 focus:border-amber-500 py-3 text-base">
                            <SelectValue placeholder="Select parent arc (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-xl">
                            <SelectItem value="none" className="hover:bg-amber-50 py-3">
                              <span className="text-base">None (Main Arc)</span>
                            </SelectItem>
                            {arcs.filter(arc => !arc.attributes?.parent_arc_id && arc.id !== editingArc?.id).map(arc => (
                              <SelectItem key={arc.id} value={arc.id} className="hover:bg-amber-50 py-3">
                                <span className="text-base">{arc.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Arc Color</Label>
                        <p className="text-xs text-gray-500 mb-4">Choose a color for visual organization</p>
                        <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                          {ARC_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, color }))}
                              className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 shadow-md ${
                                formData.color === color 
                                  ? 'border-gray-900 shadow-xl scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                              title={`Select ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Status & Progress */}
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                    <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                      Status & Progress
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="status" className="text-sm font-semibold text-gray-700 mb-2 block">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 py-3 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-xl">
                            {ARC_STATUS.map(status => (
                              <SelectItem key={status.value} value={status.value} className="hover:bg-blue-50 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full bg-${status.color}-500`}></div>
                                  <span className="text-base">{status.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-sm font-semibold text-gray-700 mb-2 block">Priority</Label>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <Input
                            id="priority"
                            type="range"
                            min="1"
                            max="5"
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                            className="w-full h-3"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-3">
                            <span className="font-medium">Low</span>
                            <span className="font-bold text-blue-600 text-lg">{formData.priority}/5</span>
                            <span className="font-medium">High</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="progress" className="text-sm font-semibold text-gray-700 mb-2 block">Progress</Label>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <Input
                            id="progress"
                            type="range"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                            className="w-full h-3"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-3 mb-3">
                            <span className="font-medium">0%</span>
                            <span className="font-bold text-blue-600 text-lg">{formData.progress}%</span>
                            <span className="font-medium">100%</span>
                          </div>
                          <Progress value={formData.progress} className="h-3" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_chapter" className="text-sm font-semibold text-gray-700 mb-2 block">Start Chapter</Label>
                          <Input
                            id="start_chapter"
                            value={formData.start_chapter}
                            onChange={(e) => setFormData(prev => ({ ...prev, start_chapter: e.target.value }))}
                            placeholder="e.g., 1"
                            className="border-gray-300 focus:border-blue-500 text-base py-3"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_chapter" className="text-sm font-semibold text-gray-700 mb-2 block">End Chapter</Label>
                          <Input
                            id="end_chapter"
                            value={formData.end_chapter}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_chapter: e.target.value }))}
                            placeholder="e.g., 10"
                            className="border-gray-300 focus:border-blue-500 text-base py-3"
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Tags</Label>
                        <p className="text-xs text-gray-500 mb-3">Separate tags with commas</p>
                        <Input
                          placeholder="adventure, mystery, romance..."
                          value={formData.tags.join(', ')}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          }))}
                          className="border-gray-300 focus:border-blue-500 text-base py-3"
                        />
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 p-3 bg-white rounded-xl border border-gray-200">
                            {formData.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Connections */}
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                    <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                      <Link className="w-6 h-6 text-green-500" />
                      Connections
                    </h3>

                    <div className="space-y-6">
                      {/* Character Selection */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Characters
                        </Label>
                        <div className="max-h-32 overflow-y-auto bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
                          {characters.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4">No characters available</p>
                          ) : (
                            <div className="space-y-2">
                              {characters.map(character => (
                                <label key={character.id} className="flex items-center space-x-3 text-sm hover:bg-green-50 p-2 rounded-lg cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.character_ids.includes(character.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          character_ids: [...prev.character_ids, character.id] 
                                        }))
                                      } else {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          character_ids: prev.character_ids.filter(id => id !== character.id) 
                                        }))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                  />
                                  <span className="font-medium">{character.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location Selection */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Locations
                        </Label>
                        <div className="max-h-28 overflow-y-auto bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
                          {locations.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4">No locations available</p>
                          ) : (
                            <div className="space-y-2">
                              {locations.map(location => (
                                <label key={location.id} className="flex items-center space-x-3 text-sm hover:bg-green-50 p-2 rounded-lg cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.location_ids.includes(location.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          location_ids: [...prev.location_ids, location.id] 
                                        }))
                                      } else {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          location_ids: prev.location_ids.filter(id => id !== location.id) 
                                        }))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                  />
                                  <span className="font-medium">{location.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chapter Selection */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Chapters
                        </Label>
                        <div className="max-h-28 overflow-y-auto bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
                          {chapters.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4">No chapters available</p>
                          ) : (
                            <div className="space-y-2">
                              {chapters.map(chapter => (
                                <label key={chapter.id} className="flex items-center space-x-3 text-sm hover:bg-green-50 p-2 rounded-lg cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.chapter_ids.includes(chapter.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          chapter_ids: [...prev.chapter_ids, chapter.id] 
                                        }))
                                      } else {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          chapter_ids: prev.chapter_ids.filter(id => id !== chapter.id) 
                                        }))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                  />
                                  <span className="font-medium">{chapter.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Themes & Notes Section - Full Width */}
              <div className="mt-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border border-purple-200 shadow-sm">
                <h3 className="font-bold text-2xl text-gray-900 mb-8 flex items-center gap-3">
                  <Heart className="w-7 h-7 text-purple-500" />
                  Themes & Additional Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div>
                    <Label className="text-lg font-bold text-gray-700 mb-4 block">Themes</Label>
                    <p className="text-sm text-gray-500 mb-6">Select themes that appear in this arc</p>
                    <div className="max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        {COMMON_THEMES.map(theme => (
                          <label key={theme} className="flex items-center space-x-3 text-sm hover:bg-purple-50 p-3 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.themes.includes(theme)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    themes: [...prev.themes, theme] 
                                  }))
                                } else {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    themes: prev.themes.filter(t => t !== theme) 
                                  }))
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                            />
                            <span className="capitalize font-semibold">{theme.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-lg font-bold text-gray-700 mb-4 block">Additional Notes</Label>
                    <p className="text-sm text-gray-500 mb-6">Any additional context, ideas, or development notes</p>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes about this arc's development, key scenes, character motivations, plot twists, or other important details..."
                      rows={10}
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-base resize-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

            {/* Milestones Section */}
            <div className="space-y-6 pt-8 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-xl font-bold text-gray-700 mb-2 block">Arc Milestones</Label>
                  <p className="text-sm text-gray-500">Define key story beats and character development moments</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={addMilestone}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Milestone
                </Button>
              </div>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {formData.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Input
                          placeholder="Milestone title..."
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                          className="text-base py-3"
                        />
                        <Select 
                          value={milestone.beat_type || 'custom'} 
                          onValueChange={(value) => updateMilestone(milestone.id, { beat_type: value })}
                        >
                          <SelectTrigger className="py-3 text-base">
                            <SelectValue placeholder="Beat type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BEAT_TYPES.map(beat => (
                              <SelectItem key={beat.value} value={beat.value} className="py-3">
                                <span className="text-base">{beat.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Chapter"
                          value={milestone.chapter || ''}
                          onChange={(e) => updateMilestone(milestone.id, { chapter: e.target.value })}
                          className="text-base py-3"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
                        className="ml-4"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Milestone description..."
                      value={milestone.description}
                      onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                      rows={3}
                      className="mb-4 text-base resize-none"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        placeholder="Character growth..."
                        value={milestone.character_growth || ''}
                        onChange={(e) => updateMilestone(milestone.id, { character_growth: e.target.value })}
                        className="text-base py-3"
                      />
                      <Input
                        placeholder="Mood..."
                        value={milestone.mood || ''}
                        onChange={(e) => updateMilestone(milestone.id, { mood: e.target.value })}
                        className="text-base py-3"
                      />
                      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-gray-300">
                        <label className="flex items-center space-x-3 text-base font-medium">
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={(e) => updateMilestone(milestone.id, { completed: e.target.checked })}
                            className="rounded border-gray-300 w-5 h-5"
                          />
                          <span>Completed</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="pt-8 border-t border-gray-200">
              <Label htmlFor="resolution" className="text-xl font-bold text-gray-700 mb-4 block">Arc Resolution</Label>
              <p className="text-sm text-gray-500 mb-4">Describe how this arc concludes and its impact on the story</p>
              <Textarea
                id="resolution"
                value={formData.resolution}
                onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="How does this arc resolve? What is the outcome for the characters and story?"
                rows={4}
                className="text-base resize-none"
              />
            </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-8 py-6 mt-6">
              <div className="flex justify-between items-center">
                <div className="text-lg text-gray-600 font-medium">
                  {editingArc ? 'Updating existing arc' : 'Creating new story arc'}
                </div>
                <div className="flex space-x-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setEditingArc(null)
                      resetForm()
                      onClearSelection?.()
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-4 text-lg font-medium"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateArc} 
                    disabled={!formData.name.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg disabled:from-gray-400 disabled:to-gray-400 px-10 py-4 text-lg font-bold"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {editingArc ? 'Update Arc' : 'Create Arc'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}