'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Target, Search, MoreVertical, Trash2, Edit3, BookOpen,
  TrendingUp, Users, Clock, Flag, ChevronDown, ChevronRight,
  Save, X, Calendar, MapPin, User, Zap, Heart, Crown, Eye, EyeOff,
  ArrowRight, ArrowLeft, CheckCircle, Circle, AlertTriangle, Star, BarChart3,
  GitBranch, Layers, Activity, Grid, List, Download, FileText,
  Filter, SortAsc, Palette, Tag, Link, MessageSquare, History, SlidersHorizontal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface Arc {
  id: string
  name: string
  description: string
  attributes: {
    type?: string
    status?: string
    priority?: number
    progress?: number
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
    parent_arc_id?: string
    sub_arc_ids?: string[]
    color?: string
    
    // Enhanced features
    milestones?: Array<{
      id: string
      title: string
      description: string
      chapter?: string
      scene?: string
      completed: boolean
      order: number
      beat_type?: string
      character_growth?: string
      emotional_impact?: number
      tension_level?: number
      mood?: string
      theme?: string
      pacing_notes?: string
      dependencies?: string[]
      estimated_word_count?: number
      actual_word_count?: number
      completion_date?: string
    }>
    
    dependencies?: Array<{
      arc_id: string
      relationship_type: string
      description?: string
      strength?: number
    }>
    
    character_development?: Array<{
      character_id: string
      character_name: string
      growth_arc: string
      starting_state: string
      ending_state: string
      key_moments: Array<{
        milestone_id: string
        growth_description: string
        emotional_state: string
        relationship_changes?: Array<{
          with_character: string
          change_type: string
          description: string
        }>
      }>
      screen_time_percentage?: number
    }>
    
    chapter_breakdown?: Array<{
      chapter_id: string
      chapter_name: string
      chapter_order: number
      scenes?: Array<{
        scene_id: string
        scene_name: string
        scene_order: number
        arc_prominence: number
        plot_beats: string[]
        character_moments: string[]
        tension_level: number
        emotional_tone: string
      }>
      arc_prominence: number
      key_events: string[]
      setup_elements: string[]
      payoff_elements: string[]
    }>
    
    pacing_profile?: Array<{
      chapter_number: number
      intensity_level: number
      screen_time_percentage: number
      plot_advancement: number
      character_development: number
      tension_curve: number
    }>
    
    template?: {
      type: string
      structure_beats: Array<{
        beat_name: string
        target_percentage: number
        actual_percentage?: number
        milestone_id?: string
        completed: boolean
      }>
    }
    
    themes?: string[]
    motifs?: Array<{
      name: string
      description: string
      appearances: Array<{
        chapter: string
        scene?: string
        context: string
      }>
      significance: string
    }>
    
    conflicts?: Array<{
      type: string
      description: string
      stakes: string
      resolution_type?: string
      escalation_points: Array<{
        chapter: string
        description: string
        intensity: number
      }>
    }>
    
    manuscript_integration?: {
      word_count_target: number
      actual_word_count: number
      scenes_written: number
      scenes_total: number
      draft_status: string
      last_writing_session?: string
    }
    
    notes?: string
    tags?: string[]
    created_at?: string
    updated_at?: string
  }
}

interface Character {
  id: string
  name: string
  description?: string
  attributes?: any
}

interface Location {
  id: string
  name: string
  description?: string
  attributes?: any
}

interface Chapter {
  id: string
  title: string
  chapter_number?: number
  sort_order?: number
  content?: string
  project_id: string
  created_at?: string
  updated_at?: string
}

interface ArcsManagerProps {
  projectId: string
  selectedElement?: any
  onArcsChange?: () => void
  onClearSelection?: () => void
}

// Constants
const ARC_TYPES = [
  { value: 'character', label: 'Character Arc', icon: User, color: 'blue' },
  { value: 'plot', label: 'Plot Arc', icon: BookOpen, color: 'green' },
  { value: 'theme', label: 'Theme Arc', icon: Heart, color: 'purple' },
  { value: 'relationship', label: 'Relationship Arc', icon: Users, color: 'pink' },
  { value: 'world', label: 'World Building Arc', icon: MapPin, color: 'yellow' },
  { value: 'subplot', label: 'Subplot', icon: GitBranch, color: 'gray' }
]

const ARC_STATUS = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'active', label: 'Active', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'abandoned', label: 'Abandoned', color: 'red' },
  { value: 'on_hold', label: 'On Hold', color: 'yellow' }
]

const ARC_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#F97316', '#06B6D4', '#84CC16']

const STORY_TEMPLATES = [
  { value: 'three_act', label: 'Three-Act Structure', description: 'Classic beginning, middle, end' },
  { value: 'heros_journey', label: "Hero's Journey", description: 'Joseph Campbell\'s monomyth' },
  { value: 'freytag', label: 'Freytag\'s Pyramid', description: 'Five-act dramatic structure' },
  { value: 'seven_point', label: 'Seven-Point Story', description: 'Dan Wells\' story structure' },
  { value: 'save_the_cat', label: 'Save the Cat', description: 'Blake Snyder\'s beat sheet' },
  { value: 'custom', label: 'Custom Structure', description: 'Define your own beats' }
]

const RELATIONSHIP_TYPES = [
  { value: 'prerequisite', label: 'Prerequisite', color: 'red', description: 'Must complete before this arc' },
  { value: 'parallel', label: 'Parallel', color: 'blue', description: 'Runs alongside this arc' },
  { value: 'consequence', label: 'Consequence', color: 'green', description: 'Results from this arc' },
  { value: 'conflict', label: 'Conflict', color: 'orange', description: 'Competes with this arc' },
  { value: 'support', label: 'Support', color: 'purple', description: 'Enhances this arc' }
]

const CONFLICT_TYPES = [
  { value: 'internal', label: 'Internal', description: 'Character vs. self' },
  { value: 'external', label: 'External', description: 'Character vs. external force' },
  { value: 'interpersonal', label: 'Interpersonal', description: 'Character vs. character' },
  { value: 'societal', label: 'Societal', description: 'Character vs. society' },
  { value: 'nature', label: 'Nature', description: 'Character vs. nature' },
  { value: 'technology', label: 'Technology', description: 'Character vs. technology' }
]

const TENSION_LEVELS = [
  { value: 1, label: 'Very Low', color: '#10B981' },
  { value: 2, label: 'Low', color: '#84CC16' },
  { value: 3, label: 'Moderate', color: '#F59E0B' },
  { value: 4, label: 'High', color: '#EF4444' },
  { value: 5, label: 'Very High', color: '#DC2626' }
]

const COMMON_THEMES = [
  'Love', 'Redemption', 'Coming of Age', 'Good vs Evil', 'Sacrifice', 'Identity',
  'Family', 'Friendship', 'Power', 'Justice', 'Freedom', 'Hope', 'Betrayal',
  'Forgiveness', 'Loyalty', 'Survival', 'Truth', 'Change', 'Loss', 'Growth'
]

const COMMON_MOODS = [
  'Adventurous', 'Dark', 'Hopeful', 'Melancholic', 'Mysterious', 'Romantic',
  'Suspenseful', 'Uplifting', 'Tense', 'Peaceful', 'Dramatic', 'Humorous',
  'Nostalgic', 'Ominous', 'Inspiring', 'Tragic', 'Whimsical', 'Intense'
]

// Helper function for status badge styling
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'planned':
      return 'border-gray-300 text-gray-700 bg-gray-50'
    case 'active':
      return 'border-orange-300 text-orange-700 bg-orange-50'
    case 'completed':
      return 'border-green-300 text-green-700 bg-green-50'
    case 'abandoned':
      return 'border-red-300 text-red-700 bg-red-50'
    case 'on_hold':
      return 'border-yellow-300 text-yellow-700 bg-yellow-50'
    default:
      return 'border-gray-300 text-gray-700 bg-gray-50'
  }
}

export default function ArcsManager({ projectId, selectedElement, onArcsChange, onClearSelection }: ArcsManagerProps) {
  const [arcs, setArcs] = useState<Arc[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArc, setEditingArc] = useState<Arc | null>(null)
  const [viewingArc, setViewingArc] = useState<Arc | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    status: 'planned',
    priority: 1,
    progress: 0,
    color: ARC_COLORS[0],
    character_ids: [] as string[],
    location_ids: [] as string[],
    chapter_ids: [] as string[],
    tags: [] as string[],
    notes: '',
    
    // Enhanced fields
    template: {
      type: 'three_act',
      structure_beats: [] as any[]
    },
    dependencies: [] as any[],
    character_development: [] as any[],
    chapter_breakdown: [] as any[],
    pacing_profile: [] as any[],
    themes: [] as string[],
    motifs: [] as any[],
    conflicts: [] as any[],
    manuscript_integration: {
      word_count_target: 0,
      actual_word_count: 0,
      scenes_written: 0,
      scenes_total: 0,
      draft_status: 'outline'
    }
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      const [arcsResult, charactersResult, locationsResult, chaptersResult] = await Promise.all([
        supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'arcs'),
        supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'characters'),
        supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'locations'),
        supabase.from('project_chapters').select('*').eq('project_id', projectId).order('sort_order')
      ])

      if (arcsResult.data) setArcs(arcsResult.data)
      if (charactersResult.data) setCharacters(charactersResult.data)
      if (locationsResult.data) setLocations(locationsResult.data)
      if (chaptersResult.data) setChapters(chaptersResult.data)
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle selectedElement from sidebar clicks
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'arcs') {
      const arc: Arc = {
        id: selectedElement.id,
        name: selectedElement.name,
        description: selectedElement.description,
        attributes: {
          ...selectedElement.attributes,
          type: selectedElement.attributes?.type || '',
          status: selectedElement.attributes?.status || 'planned',
          priority: selectedElement.attributes?.priority || 1,
          progress: selectedElement.attributes?.progress || 0,
          color: selectedElement.attributes?.color || ARC_COLORS[0],
          character_ids: selectedElement.attributes?.character_ids || [],
          location_ids: selectedElement.attributes?.location_ids || [],
          chapter_ids: selectedElement.attributes?.chapter_ids || [],
          tags: selectedElement.attributes?.tags || [],
          notes: selectedElement.attributes?.notes || '',
          template: selectedElement.attributes?.template || {
            type: 'three_act',
            structure_beats: []
          },
          dependencies: selectedElement.attributes?.dependencies || [],
          character_development: selectedElement.attributes?.character_development || [],
          chapter_breakdown: selectedElement.attributes?.chapter_breakdown || [],
          pacing_profile: selectedElement.attributes?.pacing_profile || {
            tension_curve: 'rising',
            emotional_beats: [],
            pacing_notes: ''
          },
          themes: selectedElement.attributes?.themes || [],
          motifs: selectedElement.attributes?.motifs || [],
          conflicts: selectedElement.attributes?.conflicts || []
        }
      }
      
      setViewingArc(arc)
      // Don't clear selection immediately - let the view handle it
    }
  }, [selectedElement])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      status: 'planned',
      priority: 1,
      progress: 0,
      color: ARC_COLORS[0],
      character_ids: [],
      location_ids: [],
      chapter_ids: [],
      tags: [],
      notes: '',
      template: {
        type: 'three_act',
        structure_beats: []
      },
      dependencies: [],
      character_development: [],
      chapter_breakdown: [],
      pacing_profile: [],
      themes: [],
      motifs: [],
      conflicts: [],
      manuscript_integration: {
        word_count_target: 0,
        actual_word_count: 0,
        scenes_written: 0,
        scenes_total: 0,
        draft_status: 'outline'
      }
    })
  }

  const handleSave = async () => {
    try {
      const supabase = createSupabaseClient()
      
      const arcData = {
        name: formData.name,
        description: formData.description,
        project_id: projectId,
        category: 'arcs',
        attributes: {
          type: formData.type,
          status: formData.status,
          priority: formData.priority,
          progress: formData.progress,
          color: formData.color,
          character_ids: formData.character_ids,
          location_ids: formData.location_ids,
          chapter_ids: formData.chapter_ids,
          tags: formData.tags,
          notes: formData.notes,
          template: formData.template,
          dependencies: formData.dependencies,
          character_development: formData.character_development,
          chapter_breakdown: formData.chapter_breakdown,
          pacing_profile: formData.pacing_profile,
          themes: formData.themes,
          motifs: formData.motifs,
          conflicts: formData.conflicts,
          manuscript_integration: formData.manuscript_integration
        }
      }

      let result
      if (editingArc) {
        result = await supabase
          .from('world_elements')
          .update(arcData)
          .eq('id', editingArc.id)
          .select()
      } else {
        result = await supabase
          .from('world_elements')
          .insert(arcData)
          .select()
      }

      if (result.error) throw result.error

      await loadData()
      onArcsChange?.() // Notify parent component to refresh
      setShowCreateDialog(false)
      setEditingArc(null)
      resetForm()
      
    } catch (error) {
      console.error('Error saving arc:', error)
    }
  }

  const handleEdit = (arc: Arc) => {
    setEditingArc(arc)
    setFormData({
      name: arc.name,
      description: arc.description,
      type: arc.attributes.type || '',
      status: arc.attributes.status || 'planned',
      priority: arc.attributes.priority || 1,
      progress: arc.attributes.progress || 0,
      color: arc.attributes.color || ARC_COLORS[0],
      character_ids: arc.attributes.character_ids || [],
      location_ids: arc.attributes.location_ids || [],
      chapter_ids: arc.attributes.chapter_ids || [],
      tags: arc.attributes.tags || [],
      notes: arc.attributes.notes || '',
      template: arc.attributes.template || { type: 'three_act', structure_beats: [] },
      dependencies: arc.attributes.dependencies || [],
      character_development: arc.attributes.character_development || [],
      chapter_breakdown: arc.attributes.chapter_breakdown || [],
      pacing_profile: arc.attributes.pacing_profile || [],
      themes: arc.attributes.themes || [],
      motifs: arc.attributes.motifs || [],
      conflicts: arc.attributes.conflicts || [],
      manuscript_integration: arc.attributes.manuscript_integration || {
        word_count_target: 0,
        actual_word_count: 0,
        scenes_written: 0,
        scenes_total: 0,
        draft_status: 'outline'
      }
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (arcId: string) => {
    if (!confirm('Are you sure you want to delete this arc?')) return
    
    try {
      const supabase = createSupabaseClient()
      await supabase.from('world_elements').delete().eq('id', arcId)
      await loadData()
    } catch (error) {
      console.error('Error deleting arc:', error)
    }
  }

  const filteredArcs = arcs.filter(arc => {
    const matchesSearch = arc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         arc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || filterType === 'all' || arc.attributes.type === filterType
    const matchesStatus = !filterStatus || filterStatus === 'all' || arc.attributes.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header - Hidden when viewing an arc */}
      {!viewingArc && (
        <>
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl shadow-sm border border-orange-200">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Story Arcs</h2>
                <p className="text-sm text-gray-600">Plan character development and plot progression throughout your story</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={() => {
                  resetForm()
                  setEditingArc(null)
                  setShowCreateDialog(true)
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Arc
              </Button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant="ghost"
              size="sm"
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Timeline View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Graph View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
            >
              <Grid className="w-4 h-4 mr-2" />
              Heatmap View
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search arcs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 border-gray-300 focus:border-orange-500">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Types</SelectItem>
                {ARC_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 border-gray-300 focus:border-orange-500">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">All Statuses</SelectItem>
                {ARC_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value="all">
                <SelectTrigger className="w-32 border-gray-300 focus:border-orange-500">
                  <SelectValue placeholder="All Arcs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Arcs</SelectItem>
                </SelectContent>
              </Select>

              <Select value="updated">
                <SelectTrigger className="w-40 border-gray-300 focus:border-orange-500">
                  <SelectValue placeholder="Last Updated" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="px-3">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>

              <Button variant="outline" size="sm" className="px-3">
                <Eye className="w-4 h-4" />
                Entry
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Arcs</p>
                  <p className="text-2xl font-bold text-gray-900">{arcs.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {arcs.filter(arc => arc.attributes.status === 'in_progress').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {arcs.filter(arc => arc.attributes.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {arcs.length > 0 ? Math.round(arcs.reduce((sum, arc) => sum + (arc.attributes.progress || 0), 0) / arcs.length) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      {viewingArc ? (
        /* Detailed Arc View */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewingArc(null)
                    onClearSelection?.()
                  }}
                  className="text-white hover:bg-white/20 border-white/30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full shadow-lg border-2 border-white/30"
                    style={{ backgroundColor: viewingArc.attributes.color || ARC_COLORS[0] }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold">{viewingArc.name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                      {viewingArc.attributes.type && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          {ARC_TYPES.find(t => t.value === viewingArc.attributes.type)?.label || viewingArc.attributes.type}
                        </span>
                      )}
                      {viewingArc.attributes.status && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          {ARC_STATUS.find(s => s.value === viewingArc.attributes.status)?.label || viewingArc.attributes.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEdit(viewingArc)
                    setViewingArc(null)
                  }}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this arc?')) {
                      handleDelete(viewingArc.id)
                      setViewingArc(null)
                    }
                  }}
                  className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          {viewingArc.attributes.progress !== undefined && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-green-800">Progress Overview</h3>
                <span className="text-2xl font-bold text-green-600">{viewingArc.attributes.progress}%</span>
              </div>
              <Progress value={viewingArc.attributes.progress} className="h-3 bg-green-100" />
              <div className="flex justify-between text-sm text-green-700 mt-2">
                <span>Started</span>
                <span>In Progress</span>
                <span>Complete</span>
              </div>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Story Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Description */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Story Description
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {viewingArc.description || 'No description provided for this arc.'}
                  </p>
                </div>
              </Card>

              {/* Chapters Timeline */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  Chapter Timeline
                  <Badge variant="outline" className="ml-2">
                    {viewingArc.attributes.chapter_ids?.length || 0} chapters
                  </Badge>
                </h3>
                {viewingArc.attributes.chapter_ids && viewingArc.attributes.chapter_ids.length > 0 ? (
                  <div className="space-y-3">
                    {viewingArc.attributes.chapter_ids.map((id, index) => {
                      const chapter = chapters.find(c => c.id === id)
                      return (
                        <div key={id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-medium">
                            {chapter?.chapter_number || index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {chapter ? stripHtmlTags(chapter.title) : `Chapter ${index + 1}`}
                            </h4>
                            {chapter?.content && (
                              <p className="text-sm text-gray-600 mt-1">
                                {stripHtmlTags(chapter.content).substring(0, 100)}...
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Chapter {chapter?.chapter_number || '?'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No chapters assigned to this arc</p>
                  </div>
                )}
              </Card>

              {/* Notes */}
              {viewingArc.attributes.notes && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    Notes & Ideas
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingArc.attributes.notes}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar Info */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Priority</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < (viewingArc.attributes.priority || 1) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Characters</span>
                    <span className="font-medium">{viewingArc.attributes.character_ids?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Locations</span>
                    <span className="font-medium">{viewingArc.attributes.location_ids?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Chapters</span>
                    <span className="font-medium">{viewingArc.attributes.chapter_ids?.length || 0}</span>
                  </div>
                </div>
              </Card>

              {/* Characters */}
              {viewingArc.attributes.character_ids && viewingArc.attributes.character_ids.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Characters
                  </h3>
                  <div className="space-y-2">
                    {viewingArc.attributes.character_ids.map((id, index) => {
                      const character = characters.find(c => c.id === id)
                      return (
                        <div key={id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-900">
                            {character?.name || `Character ${index + 1}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Locations */}
              {viewingArc.attributes.location_ids && viewingArc.attributes.location_ids.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Locations
                  </h3>
                  <div className="space-y-2">
                    {viewingArc.attributes.location_ids.map((id, index) => {
                      const location = locations.find(l => l.id === id)
                      return (
                        <div key={id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-900">
                            {location?.name || `Location ${index + 1}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Tags */}
              {viewingArc.attributes.tags && viewingArc.attributes.tags.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-500" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingArc.attributes.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Arcs Grid/List */
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
        {filteredArcs.map((arc) => (
          <Card 
            key={arc.id} 
            className={`hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white/80 backdrop-blur-sm cursor-pointer ${
              viewMode === 'list' 
                ? 'hover:scale-[1.01] flex items-center p-4' 
                : 'hover:scale-[1.02]'
            }`}
            onClick={() => setViewingArc(arc)}
          >
            {viewMode === 'list' ? (
              /* Compact List View with Left/Right Layout and Consistent Columns */
              <div className="flex items-center justify-between w-full py-2">
                {/* Left Side - Arc Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-6">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                    style={{ backgroundColor: arc.attributes.color || ARC_COLORS[0] }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{arc.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {arc.description}
                    </p>
                  </div>
                </div>
                
                {/* Right Side - Consistent Columns */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Type Badge Column */}
                  <div className="w-28 flex justify-start">
                    {arc.attributes.type && (
                      <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {ARC_TYPES.find(t => t.value === arc.attributes.type)?.label || arc.attributes.type}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Status Badge Column */}
                  <div className="w-20 flex justify-start">
                    {arc.attributes.status && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusBadgeClass(arc.attributes.status)}`}
                      >
                        {ARC_STATUS.find(s => s.value === arc.attributes.status)?.label || arc.attributes.status}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Column */}
                  <div className="w-24 flex items-center gap-2">
                    {arc.attributes.progress !== undefined && (
                      <>
                        <div className="w-14 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-300"
                            style={{ width: `${arc.attributes.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{arc.attributes.progress}%</span>
                      </>
                    )}
                  </div>
                  
                  {/* Character Count Column */}
                  <div className="w-8 flex justify-center">
                    {arc.attributes.character_ids && arc.attributes.character_ids.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {arc.attributes.character_ids.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Chapter Count Column */}
                  <div className="w-8 flex justify-center">
                    {arc.attributes.chapter_ids && arc.attributes.chapter_ids.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <BookOpen className="w-3 h-3" />
                        {arc.attributes.chapter_ids.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons Column */}
                  <div className="w-16 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(arc)
                      }}
                      className="hover:bg-orange-50 hover:text-orange-600 transition-colors p-1"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(arc.id)
                      }}
                      className="hover:bg-red-50 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Original Grid View */
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: arc.attributes.color || ARC_COLORS[0] }}
                      />
                      <div>
                        <CardTitle className="text-lg text-gray-900">{arc.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {arc.attributes.type && (
                            <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              {ARC_TYPES.find(t => t.value === arc.attributes.type)?.label || arc.attributes.type}
                            </Badge>
                          )}
                          {arc.attributes.status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusBadgeClass(arc.attributes.status)}`}
                            >
                              {ARC_STATUS.find(s => s.value === arc.attributes.status)?.label || arc.attributes.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(arc)
                        }}
                        className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(arc.id)
                        }}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {arc.description}
                  </p>
                  
                  {arc.attributes.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Progress</span>
                        <span>{arc.attributes.progress}%</span>
                      </div>
                      <Progress value={arc.attributes.progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      {arc.attributes.character_ids && arc.attributes.character_ids.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {arc.attributes.character_ids.length}
                        </span>
                      )}
                      {arc.attributes.chapter_ids && arc.attributes.chapter_ids.length > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {arc.attributes.chapter_ids.length}
                        </span>
                      )}
                    </div>
                    
                    {arc.attributes.priority && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {arc.attributes.priority}
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
        </div>
      )}

      {filteredArcs.length === 0 && !viewingArc && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="p-4 bg-orange-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Target className="w-12 h-12 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No arcs found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || filterType || filterStatus 
              ? 'Try adjusting your search or filters to find the arcs you\'re looking for.'
              : 'Get started by creating your first story arc to organize your narrative structure.'
            }
          </p>
          {!searchQuery && !filterType && !filterStatus && (
            <Button
              onClick={() => {
                resetForm()
                setEditingArc(null)
                setShowCreateDialog(true)
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Arc
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) {
          setEditingArc(null)
          resetForm()
        }
      }}>
        <DialogContent className="!w-[95vw] !max-w-[1400px] !h-[90vh] overflow-hidden bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl flex flex-col">
          <DialogHeader className="border-b border-orange-100 pb-6 bg-gradient-to-r from-orange-50 to-amber-50 -m-6 mb-0 p-6 rounded-t-lg flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {editingArc ? 'Edit Arc' : 'Create New Arc'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {editingArc ? 'Modify the arc details and structure below.' : 'Create a comprehensive story arc with advanced narrative features.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 mt-6">
            <TabsList className="grid w-full grid-cols-6 mb-6 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-lg shadow-sm flex-shrink-0">
              <TabsTrigger value="basic" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Basic Info</TabsTrigger>
              <TabsTrigger value="dependencies" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Dependencies</TabsTrigger>
              <TabsTrigger value="characters" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Characters</TabsTrigger>
              <TabsTrigger value="chapters" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Chapters</TabsTrigger>
              <TabsTrigger value="pacing" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Pacing</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Advanced</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm rounded-lg p-6 min-h-0">
              <TabsContent value="basic" className="space-y-6 mt-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-orange-500" />
                        Basic Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium mb-2 block text-gray-700">Arc Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter arc name..."
                            className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <Label htmlFor="type" className="text-sm font-medium mb-2 block text-gray-700">Arc Type</Label>
                          <Select value={formData.type} onValueChange={(value) => 
                            setFormData(prev => ({ ...prev, type: value }))
                          }>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {ARC_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="w-4 h-4" />
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-sm font-medium mb-2 block text-gray-700">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe this arc..."
                            rows={4}
                            className="resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-gray-700">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => 
                              setFormData(prev => ({ ...prev, status: value }))
                            }>
                              <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {ARC_STATUS.map(status => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block text-gray-700">Priority</Label>
                            <Select value={formData.priority.toString()} onValueChange={(value) => 
                              setFormData(prev => ({ ...prev, priority: parseInt(value) }))
                            }>
                              <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {[1, 2, 3, 4, 5].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    Priority {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Template & Color */}
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-orange-500" />
                        Visual & Structure
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block text-gray-700">Story Template</Label>
                          <Select 
                            value={formData.template.type} 
                            onValueChange={(value) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                template: { ...prev.template, type: value }
                              }))
                            }
                          >
                            <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {STORY_TEMPLATES.map(template => (
                                <SelectItem key={template.value} value={template.value}>
                                  <div>
                                    <div className="font-medium">{template.label}</div>
                                    <div className="text-xs text-gray-500">{template.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block text-gray-700">Arc Color</Label>
                          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-300">
                            {ARC_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 shadow-sm ${
                                  formData.color === color 
                                    ? 'border-orange-400 scale-110 shadow-md' 
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block text-gray-700">Progress: {formData.progress}%</Label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <Progress value={formData.progress} className="mt-3 h-3 bg-gray-200" />
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block text-gray-700">Notes</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes..."
                            rows={4}
                            className="resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-6">
                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GitBranch className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      Arc Dependencies
                    </span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Select onValueChange={(arcId) => {
                        const newDep = {
                          arc_id: arcId,
                          relationship_type: 'prerequisite',
                          strength: 1,
                          description: ''
                        }
                        setFormData(prev => ({
                          ...prev,
                          dependencies: [...prev.dependencies, newDep]
                        }))
                      }}>
                        <SelectTrigger className="flex-1 border-gray-300 focus:border-orange-500">
                          <SelectValue placeholder="Select arc to add dependency..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {arcs.filter(arc => arc.id !== editingArc?.id && !formData.dependencies.some(dep => dep.arc_id === arc.id)).map(arc => (
                            <SelectItem key={arc.id} value={arc.id}>{arc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.dependencies.map((dep, index) => {
                      const arc = arcs.find(a => a.id === dep.arc_id)
                      return (
                        <Card key={index} className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 border border-purple-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{arc?.name || 'Unknown Arc'}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                dependencies: prev.dependencies.filter((_, i) => i !== index)
                              }))}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Select 
                              value={dep.relationship_type} 
                              onValueChange={(value) => {
                                const updated = [...formData.dependencies]
                                updated[index].relationship_type = value
                                setFormData(prev => ({ ...prev, dependencies: updated }))
                              }}
                            >
                              <SelectTrigger className="border-gray-300 focus:border-orange-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {RELATIONSHIP_TYPES.map(rel => (
                                  <SelectItem key={rel.value} value={rel.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full bg-${rel.color}-500`}></div>
                                      {rel.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div>
                              <Label className="text-sm text-gray-700">Strength: {dep.strength}</Label>
                              <Input
                                type="range"
                                min="1"
                                max="5"
                                value={dep.strength}
                                onChange={(e) => {
                                  const updated = [...formData.dependencies]
                                  updated[index].strength = parseInt(e.target.value)
                                  setFormData(prev => ({ ...prev, dependencies: updated }))
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Textarea
                            placeholder="Describe the relationship..."
                            value={dep.description || ''}
                            onChange={(e) => {
                              const updated = [...formData.dependencies]
                              updated[index].description = e.target.value
                              setFormData(prev => ({ ...prev, dependencies: updated }))
                            }}
                            className="mt-3 border-gray-300 focus:border-orange-500"
                            rows={2}
                          />
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="characters" className="space-y-6">
                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Character Development
                    </span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Select onValueChange={(characterId) => {
                        const character = characters.find(c => c.id === characterId)
                        if (character) {
                          const newDev = {
                            character_id: characterId,
                            character_name: character.name,
                            growth_arc: '',
                            starting_state: '',
                            ending_state: '',
                            key_moments: [],
                            screen_time_percentage: 0
                          }
                          setFormData(prev => ({
                            ...prev,
                            character_development: [...prev.character_development, newDev]
                          }))
                        }
                      }}>
                        <SelectTrigger className="flex-1 border-gray-300 focus:border-orange-500">
                          <SelectValue placeholder="Add character to this arc..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {characters.filter(char => !formData.character_development.some(dev => dev.character_id === char.id)).map(character => (
                            <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.character_development.map((dev, index) => (
                      <Card key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg text-gray-900">{dev.character_name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              character_development: prev.character_development.filter((_, i) => i !== index)
                            }))}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Growth Arc Type</Label>
                            <Input
                              placeholder="e.g., Hero's Journey, Fall from Grace..."
                              value={dev.growth_arc}
                              onChange={(e) => {
                                const updated = [...formData.character_development]
                                updated[index].growth_arc = e.target.value
                                setFormData(prev => ({ ...prev, character_development: updated }))
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Screen Time: {dev.screen_time_percentage}%</Label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={dev.screen_time_percentage}
                              onChange={(e) => {
                                const updated = [...formData.character_development]
                                updated[index].screen_time_percentage = parseInt(e.target.value)
                                setFormData(prev => ({ ...prev, character_development: updated }))
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Starting State</Label>
                            <Textarea
                              placeholder="How does this character begin this arc?"
                              value={dev.starting_state}
                              onChange={(e) => {
                                const updated = [...formData.character_development]
                                updated[index].starting_state = e.target.value
                                setFormData(prev => ({ ...prev, character_development: updated }))
                              }}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Ending State</Label>
                            <Textarea
                              placeholder="How does this character end this arc?"
                              value={dev.ending_state}
                              onChange={(e) => {
                                const updated = [...formData.character_development]
                                updated[index].ending_state = e.target.value
                                setFormData(prev => ({ ...prev, character_development: updated }))
                              }}
                              rows={3}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                    {formData.character_development.length === 0 && (
                      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
                        <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Users className="w-10 h-10 text-blue-500" />
                        </div>
                        <p className="text-gray-700 font-medium mb-2">No characters assigned to this arc yet.</p>
                        <p className="text-sm text-gray-600">Add characters to track their development through this story arc.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chapters" className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                  <div className="space-y-6">
                    {/* Existing Chapters Section */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        Chapter Integration
                      </h4>
                      
                      {chapters.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 mb-4">
                            Select which chapters this arc spans across:
                          </p>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {chapters.map((chapter) => (
                              <label key={chapter.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.chapter_ids?.includes(chapter.id) || false}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked
                                    setFormData(prev => ({
                                      ...prev,
                                      chapter_ids: isChecked
                                        ? [...(prev.chapter_ids || []), chapter.id]
                                        : (prev.chapter_ids || []).filter((id: string) => id !== chapter.id)
                                    }))
                                  }}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="font-medium text-gray-900 text-xs leading-tight truncate">
                                    {chapter.chapter_number ? `Ch ${chapter.chapter_number}` : 'Ch'}: {stripHtmlTags(chapter.title) || 'Untitled'}
                                  </div>
                                  {chapter.content && (
                                    <div className="text-xs text-gray-500 mt-0.5 overflow-hidden" style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: 'vertical'
                                    }}>
                                      {stripHtmlTags(chapter.content).substring(0, 40)}...
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                          
                          {formData.chapter_ids && formData.chapter_ids.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm font-medium text-green-800">
                                Arc spans {formData.chapter_ids.length} chapter(s)
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-700 font-medium mb-2">No chapters found in this project.</p>
                          <p className="text-sm text-gray-600">Create chapters first to assign this arc to them.</p>
                        </div>
                      )}
                    </Card>

                    {/* Chapter Breakdown */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Layers className="w-5 h-5 text-green-600" />
                          Chapter Breakdown
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newChapter = {
                              chapter_id: `temp-${Date.now()}`,
                              chapter_name: `Chapter ${formData.chapter_breakdown.length + 1}`,
                              chapter_order: formData.chapter_breakdown.length + 1,
                              arc_prominence: 5,
                              key_events: [],
                              setup_elements: [],
                              payoff_elements: [],
                              scenes: []
                            }
                            setFormData(prev => ({
                              ...prev,
                              chapter_breakdown: [...prev.chapter_breakdown, newChapter]
                            }))
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Chapter
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.chapter_breakdown.map((chapter, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Input
                                  value={chapter.chapter_name}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].chapter_name = e.target.value
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                  className="font-semibold text-lg w-64"
                                />
                                <Badge variant="secondary">Order: {chapter.chapter_order}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  chapter_breakdown: prev.chapter_breakdown.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Arc Prominence: {chapter.arc_prominence}/10</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={chapter.arc_prominence}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].arc_prominence = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Chapter Order</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={chapter.chapter_order}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].chapter_order = parseInt(e.target.value) || 1
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Key Events</Label>
                                <Textarea
                                  placeholder="Major plot points in this chapter..."
                                  value={chapter.key_events.join('\n')}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].key_events = e.target.value.split('\n').filter(item => item.trim())
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Setup Elements</Label>
                                <Textarea
                                  placeholder="What gets set up for later..."
                                  value={chapter.setup_elements.join('\n')}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].setup_elements = e.target.value.split('\n').filter(item => item.trim())
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Payoff Elements</Label>
                                <Textarea
                                  placeholder="What gets resolved or revealed..."
                                  value={chapter.payoff_elements.join('\n')}
                                  onChange={(e) => {
                                    const updated = [...formData.chapter_breakdown]
                                    updated[index].payoff_elements = e.target.value.split('\n').filter(item => item.trim())
                                    setFormData(prev => ({ ...prev, chapter_breakdown: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}

                        {formData.chapter_breakdown.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No chapters defined for this arc yet.</p>
                            <p className="text-sm">Add chapters to plan how this arc unfolds through your story.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pacing" className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                    <Activity className="w-6 h-6 text-orange-500" />
                    Pacing & Structure
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Story Structure Template Beats */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        Story Structure Beats ({formData.template.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                      </h4>
                      
                      <div className="space-y-3">
                        {formData.template.structure_beats.length === 0 && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              let defaultBeats = []
                              if (formData.template.type === 'three_act') {
                                defaultBeats = [
                                  { beat_name: 'Inciting Incident', target_percentage: 12, completed: false },
                                  { beat_name: 'Plot Point 1', target_percentage: 25, completed: false },
                                  { beat_name: 'Midpoint', target_percentage: 50, completed: false },
                                  { beat_name: 'Plot Point 2', target_percentage: 75, completed: false },
                                  { beat_name: 'Climax', target_percentage: 88, completed: false },
                                  { beat_name: 'Resolution', target_percentage: 95, completed: false }
                                ]
                              } else if (formData.template.type === 'heros_journey') {
                                defaultBeats = [
                                  { beat_name: 'Call to Adventure', target_percentage: 10, completed: false },
                                  { beat_name: 'Crossing the Threshold', target_percentage: 20, completed: false },
                                  { beat_name: 'Tests and Trials', target_percentage: 35, completed: false },
                                  { beat_name: 'Ordeal', target_percentage: 50, completed: false },
                                  { beat_name: 'Reward', target_percentage: 65, completed: false },
                                  { beat_name: 'The Road Back', target_percentage: 80, completed: false },
                                  { beat_name: 'Return Transformed', target_percentage: 95, completed: false }
                                ]
                              } else {
                                defaultBeats = [
                                  { beat_name: 'Opening', target_percentage: 5, completed: false },
                                  { beat_name: 'Inciting Incident', target_percentage: 15, completed: false },
                                  { beat_name: 'Rising Action', target_percentage: 40, completed: false },
                                  { beat_name: 'Climax', target_percentage: 70, completed: false },
                                  { beat_name: 'Falling Action', target_percentage: 85, completed: false },
                                  { beat_name: 'Resolution', target_percentage: 95, completed: false }
                                ]
                              }
                              setFormData(prev => ({
                                ...prev,
                                template: {
                                  ...prev.template,
                                  structure_beats: defaultBeats
                                }
                              }))
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Default Structure Beats
                          </Button>
                        )}

                        {formData.template.structure_beats.map((beat, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = [...formData.template.structure_beats]
                                updated[index].completed = !updated[index].completed
                                setFormData(prev => ({
                                  ...prev,
                                  template: {
                                    ...prev.template,
                                    structure_beats: updated
                                  }
                                }))
                              }}
                            >
                              {beat.completed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-400" />}
                            </Button>
                            <div className="flex-1">
                              <Input
                                value={beat.beat_name}
                                onChange={(e) => {
                                  const updated = [...formData.template.structure_beats]
                                  updated[index].beat_name = e.target.value
                                  setFormData(prev => ({
                                    ...prev,
                                    template: {
                                      ...prev.template,
                                      structure_beats: updated
                                    }
                                  }))
                                }}
                                className="font-medium"
                              />
                            </div>
                            <div className="w-24">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={beat.target_percentage}
                                onChange={(e) => {
                                  const updated = [...formData.template.structure_beats]
                                  updated[index].target_percentage = parseInt(e.target.value) || 0
                                  setFormData(prev => ({
                                    ...prev,
                                    template: {
                                      ...prev.template,
                                      structure_beats: updated
                                    }
                                  }))
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                template: {
                                  ...prev.template,
                                  structure_beats: prev.template.structure_beats.filter((_, i) => i !== index)
                                }
                              }))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {formData.template.structure_beats.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              template: {
                                ...prev.template,
                                structure_beats: [...prev.template.structure_beats, {
                                  beat_name: 'New Beat',
                                  target_percentage: 50,
                                  completed: false
                                }]
                              }
                            }))}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Custom Beat
                          </Button>
                        )}
                      </div>
                    </Card>

                    {/* Pacing Profile */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        Pacing Profile
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">Track intensity and development across chapters</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newProfile = {
                                chapter_number: formData.pacing_profile.length + 1,
                                intensity_level: 5,
                                screen_time_percentage: 10,
                                plot_advancement: 5,
                                character_development: 5,
                                tension_curve: 5
                              }
                              setFormData(prev => ({
                                ...prev,
                                pacing_profile: [...prev.pacing_profile, newProfile]
                              }))
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Chapter
                          </Button>
                        </div>

                        {formData.pacing_profile.map((profile, index) => (
                          <Card key={index} className="p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">Chapter {profile.chapter_number}</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  pacing_profile: prev.pacing_profile.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Intensity Level: {profile.intensity_level}/10</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={profile.intensity_level}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].intensity_level = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Screen Time: {profile.screen_time_percentage}%</Label>
                                <Input
                                  type="range"
                                  min="0"
                                  max="50"
                                  value={profile.screen_time_percentage}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].screen_time_percentage = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Plot Advancement: {profile.plot_advancement}/10</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={profile.plot_advancement}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].plot_advancement = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Character Development: {profile.character_development}/10</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={profile.character_development}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].character_development = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Tension Curve: {profile.tension_curve}/10</Label>
                                <Input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={profile.tension_curve}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].tension_curve = parseInt(e.target.value)
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Chapter Number</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={profile.chapter_number}
                                  onChange={(e) => {
                                    const updated = [...formData.pacing_profile]
                                    updated[index].chapter_number = parseInt(e.target.value) || 1
                                    setFormData(prev => ({ ...prev, pacing_profile: updated }))
                                  }}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}

                        {formData.pacing_profile.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No pacing profile defined yet.</p>
                            <p className="text-sm">Add chapters to track pacing and intensity throughout your arc.</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
                  <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Advanced Features
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Themes */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" />
                        Themes
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Select onValueChange={(theme) => {
                            if (theme && !formData.themes.includes(theme)) {
                              setFormData(prev => ({
                                ...prev,
                                themes: [...prev.themes, theme]
                              }))
                            }
                          }}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Add a theme..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                              {COMMON_THEMES.filter(theme => !formData.themes.includes(theme)).map(theme => (
                                <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {formData.themes.map((theme, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {theme}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  themes: prev.themes.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>

                        {formData.themes.length === 0 && (
                          <p className="text-sm text-gray-500">No themes selected. Choose from common themes or add custom ones.</p>
                        )}
                      </div>
                    </Card>

                    {/* Conflicts */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Conflicts
                      </h4>
                      
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newConflict = {
                              type: 'internal',
                              description: '',
                              stakes: '',
                              resolution_type: '',
                              escalation_points: []
                            }
                            setFormData(prev => ({
                              ...prev,
                              conflicts: [...prev.conflicts, newConflict]
                            }))
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Conflict
                        </Button>

                        {formData.conflicts.map((conflict, index) => (
                          <Card key={index} className="p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <Select
                                value={conflict.type}
                                onValueChange={(value) => {
                                  const updated = [...formData.conflicts]
                                  updated[index].type = value
                                  setFormData(prev => ({ ...prev, conflicts: updated }))
                                }}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                  {CONFLICT_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div>
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-sm text-gray-500">{type.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  conflicts: prev.conflicts.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Description</Label>
                                <Textarea
                                  placeholder="Describe the conflict..."
                                  value={conflict.description}
                                  onChange={(e) => {
                                    const updated = [...formData.conflicts]
                                    updated[index].description = e.target.value
                                    setFormData(prev => ({ ...prev, conflicts: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Stakes</Label>
                                <Textarea
                                  placeholder="What's at risk if this conflict isn't resolved?"
                                  value={conflict.stakes}
                                  onChange={(e) => {
                                    const updated = [...formData.conflicts]
                                    updated[index].stakes = e.target.value
                                    setFormData(prev => ({ ...prev, conflicts: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <Label className="text-sm font-medium mb-2 block">Resolution Type</Label>
                              <Input
                                placeholder="How will this conflict be resolved?"
                                value={conflict.resolution_type || ''}
                                onChange={(e) => {
                                  const updated = [...formData.conflicts]
                                  updated[index].resolution_type = e.target.value
                                  setFormData(prev => ({ ...prev, conflicts: updated }))
                                }}
                              />
                            </div>
                          </Card>
                        ))}

                        {formData.conflicts.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No conflicts defined yet. Add conflicts to create tension and drive your story.</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Motifs */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-red-600" />
                        Motifs & Symbolism
                      </h4>
                      
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMotif = {
                              name: '',
                              description: '',
                              significance: '',
                              appearances: []
                            }
                            setFormData(prev => ({
                              ...prev,
                              motifs: [...prev.motifs, newMotif]
                            }))
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Motif
                        </Button>

                        {formData.motifs.map((motif, index) => (
                          <Card key={index} className="p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <Input
                                placeholder="Motif name (e.g., 'Birds', 'Mirrors', 'Red roses')"
                                value={motif.name}
                                onChange={(e) => {
                                  const updated = [...formData.motifs]
                                  updated[index].name = e.target.value
                                  setFormData(prev => ({ ...prev, motifs: updated }))
                                }}
                                className="font-medium flex-1 mr-3"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  motifs: prev.motifs.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Description</Label>
                                <Textarea
                                  placeholder="Describe the motif and how it appears..."
                                  value={motif.description}
                                  onChange={(e) => {
                                    const updated = [...formData.motifs]
                                    updated[index].description = e.target.value
                                    setFormData(prev => ({ ...prev, motifs: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Significance</Label>
                                <Textarea
                                  placeholder="What does this motif represent or symbolize?"
                                  value={motif.significance}
                                  onChange={(e) => {
                                    const updated = [...formData.motifs]
                                    updated[index].significance = e.target.value
                                    setFormData(prev => ({ ...prev, motifs: updated }))
                                  }}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}

                        {formData.motifs.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No motifs defined yet. Add recurring symbols or themes to enrich your storytelling.</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Notes & Additional Information */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-red-600" />
                        Additional Notes
                      </h4>
                      
                      <Textarea
                        placeholder="Any additional notes, ideas, or reminders for this arc..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={6}
                        className="resize-none"
                      />
                    </Card>

                    {/* Tags */}
                    <Card className="p-4 bg-white/80">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-red-600" />
                        Tags
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = e.currentTarget.value.trim()
                                if (value && !formData.tags.includes(value)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, value]
                                  }))
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, i) => i !== index)
                                }))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>

                        {formData.tags.length === 0 && (
                          <p className="text-sm text-gray-500">No tags added. Use tags to organize and categorize your arcs.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t border-orange-100 bg-gradient-to-r from-orange-50/50 to-amber-50/50 -m-6 mt-6 p-6 rounded-b-lg">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingArc ? 'Update Arc' : 'Create Arc'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}