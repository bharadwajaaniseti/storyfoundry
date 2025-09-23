'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Target, Search, Trash2, Edit3, BookOpen,
  TrendingUp, Users, Calendar, MapPin, User, Heart,
  ArrowLeft, CheckCircle, Circle, AlertTriangle, Star, BarChart3,
  GitBranch, Layers, Activity, Grid, List, FileText,
  Palette, Tag, MessageSquare, SlidersHorizontal, Save, X, Eye, ChevronDown, Check
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
import { cn } from '@/lib/utils'

// Enhanced Range Slider Styles
const rangeSliderStyles = `
  .enhanced-range-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  .enhanced-range-slider:focus {
    outline: none;
  }
  
  .enhanced-range-slider::-webkit-slider-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
  }
  
  .enhanced-range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #f97316;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .enhanced-range-slider::-webkit-slider-thumb:hover {
    background: #ea580c;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .enhanced-range-slider::-moz-range-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
    border: none;
  }
  
  .enhanced-range-slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #f97316;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .enhanced-range-slider::-moz-range-thumb:hover {
    background: #ea580c;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = rangeSliderStyles
  document.head.appendChild(styleElement)
}

// Enhanced Custom Components
const EnhancedSelect = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className,
  triggerClassName,
  contentClassName,
  customDisplay,
  ...props 
}: any) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      onOpenChange={setIsOpen}
      {...props}
    >
      <SelectTrigger 
        className={cn(
          "relative bg-white border-2 border-gray-200 rounded-xl shadow-sm px-5 py-4",
          "hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100",
          "transition-all duration-300 ease-out text-left overflow-hidden",
          "data-[state=open]:border-orange-500 data-[state=open]:ring-2 data-[state=open]:ring-orange-100",
          "data-[state=open]:shadow-lg",
          "[&>svg]:hidden", // Hide the default chevron
          triggerClassName,
          className
        )}
      >
        <div className="flex-1 pr-8 min-w-0 overflow-hidden">
          {customDisplay ? (
            <span className="text-base font-medium block truncate w-full text-left text-gray-900">
              {customDisplay}
            </span>
          ) : (
            <SelectValue 
              placeholder={placeholder} 
              className="text-base font-medium block truncate w-full text-left" 
            />
          )}
        </div>
        <ChevronDown 
          className={cn(
            "absolute right-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 flex-shrink-0",
            "transition-transform duration-200 pointer-events-none",
            isOpen && "rotate-180"
          )} 
        />
      </SelectTrigger>
      <SelectContent 
        className={cn(
          "bg-white border-2 border-gray-200 rounded-xl shadow-xl p-3 min-w-[300px]",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "backdrop-blur-sm max-h-[400px] overflow-y-auto",
          contentClassName
        )}
        sideOffset={6}
      >
        {children}
      </SelectContent>
    </Select>
  )
}

const EnhancedSelectItem = ({ children, className, ...props }: any) => {
  return (
    <SelectItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-5 py-4 mx-1 my-1.5",
        "text-base outline-none transition-all duration-200",
        "hover:bg-orange-50 hover:text-orange-900 focus:bg-orange-50 focus:text-orange-900",
        "data-[state=checked]:bg-orange-500 data-[state=checked]:text-white",
        "data-[state=checked]:shadow-md min-h-[56px]",
        className
      )}
      {...props}
    >
      <span className="absolute right-4 flex h-5 w-5 items-center justify-center">
        <Check className="h-4 w-4 opacity-0 data-[state=checked]:opacity-100 transition-opacity duration-200" />
      </span>
      <div className="flex-1 pr-8">
        {children}
      </div>
    </SelectItem>
  )
}

const EnhancedProgress = ({ value, className, showLabel = true, label, ...props }: any) => {
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label || 'Progress'}</span>
          <span className="font-medium text-orange-600">{value}%</span>
        </div>
      )}
      <div className={cn(
        "relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner",
        className
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            "bg-gradient-to-r from-orange-400 to-orange-500",
            "shadow-sm relative overflow-hidden"
          )}
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  )
}

const EnhancedCheckbox = ({ 
  checked, 
  onChange, 
  label, 
  className,
  checkboxClassName,
  ...props 
}: any) => {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 transition-all duration-200 cursor-pointer",
            "flex items-center justify-center",
            checked 
              ? "bg-orange-500 border-orange-500 shadow-md" 
              : "bg-white border-gray-300 hover:border-orange-300",
            "hover:shadow-sm",
            checkboxClassName
          )}
          onClick={() => onChange?.({ target: { checked: !checked } })}
        >
          <Check 
            className={cn(
              "w-3 h-3 text-white transition-all duration-200",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )} 
          />
        </div>
      </div>
      {label && (
        <label 
          className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          onClick={() => onChange?.({ target: { checked: !checked } })}
        >
          {label}
        </label>
      )}
    </div>
  )
}

const EnhancedRangeSlider = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  label,
  showValue = true,
  className,
  ...props 
}: any) => {
  return (
    <div className={cn("space-y-3", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showValue && <span className="text-sm font-semibold text-orange-600">{value}%</span>}
        </div>
      )}
      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="enhanced-range-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
          style={{
            background: `linear-gradient(to right, #f97316 0%, #f97316 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
          }}
          {...props}
        />
      </div>
    </div>
  )
}

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
  attributes?: Record<string, unknown>
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
  selectedElement?: {
    id: string
    name: string
    description: string
    category: string
    attributes: Record<string, unknown>
  }
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

const COMMON_THEMES = [
  'Love', 'Redemption', 'Coming of Age', 'Good vs Evil', 'Sacrifice', 'Identity',
  'Family', 'Friendship', 'Power', 'Justice', 'Freedom', 'Hope', 'Betrayal',
  'Forgiveness', 'Loyalty', 'Survival', 'Truth', 'Change', 'Loss', 'Growth'
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
      structure_beats: [] as Array<{
        beat_name: string
        target_percentage: number
        actual_percentage?: number
        milestone_id?: string
        completed: boolean
      }>
    },
    dependencies: [] as Array<{
      arc_id: string
      relationship_type: string
      description?: string
      strength?: number
    }>,
    character_development: [] as Array<{
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
    }>,
    chapter_breakdown: [] as Array<{
      chapter_id: string
      chapter_name: string
      chapter_order: number
      arc_prominence: number
      key_events: string[]
      setup_elements: string[]
      payoff_elements: string[]
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
    }>,
    pacing_profile: [] as Array<{
      chapter_number: number
      intensity_level: number
      screen_time_percentage: number
      plot_advancement: number
      character_development: number
      tension_curve: number
    }>,
    themes: [] as string[],
    motifs: [] as Array<{
      name: string
      description: string
      appearances: Array<{
        chapter: string
        scene?: string
        context: string
      }>
      significance: string
    }>,
    conflicts: [] as Array<{
      type: string
      description: string
      stakes: string
      resolution_type?: string
      escalation_points: Array<{
        chapter: string
        description: string
        intensity: number
      }>
    }>,
    manuscript_integration: {
      word_count_target: 0,
      actual_word_count: 0,
      scenes_written: 0,
      scenes_total: 0,
      draft_status: 'outline'
    }
  })

  const loadData = useCallback(async () => {
    try {
      const supabase = createSupabaseClient()
      
      const [arcsResult, charactersResult, chaptersResult] = await Promise.all([
        supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'arcs'),
        supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'characters'),
        supabase.from('project_chapters').select('*').eq('project_id', projectId).order('sort_order')
      ])

      if (arcsResult.data) setArcs(arcsResult.data)
      if (charactersResult.data) setCharacters(charactersResult.data)
      if (chaptersResult.data) setChapters(chaptersResult.data)
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle selectedElement from sidebar clicks
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'arcs') {
      const arc: Arc = {
        id: selectedElement.id,
        name: selectedElement.name,
        description: selectedElement.description,
        attributes: {
          ...selectedElement.attributes,
          type: (selectedElement.attributes?.type as string) || '',
          status: (selectedElement.attributes?.status as string) || 'planned',
          priority: (selectedElement.attributes?.priority as number) || 1,
          progress: (selectedElement.attributes?.progress as number) || 0,
          color: (selectedElement.attributes?.color as string) || ARC_COLORS[0],
          character_ids: (selectedElement.attributes?.character_ids as string[]) || [],
          location_ids: (selectedElement.attributes?.location_ids as string[]) || [],
          chapter_ids: (selectedElement.attributes?.chapter_ids as string[]) || [],
          tags: (selectedElement.attributes?.tags as string[]) || [],
          notes: (selectedElement.attributes?.notes as string) || '',
          template: (selectedElement.attributes?.template as typeof formData.template) || {
            type: 'three_act',
            structure_beats: []
          },
          dependencies: (selectedElement.attributes?.dependencies as typeof formData.dependencies) || [],
          character_development: (selectedElement.attributes?.character_development as typeof formData.character_development) || [],
          chapter_breakdown: (selectedElement.attributes?.chapter_breakdown as typeof formData.chapter_breakdown) || [],
          pacing_profile: (selectedElement.attributes?.pacing_profile as typeof formData.pacing_profile) || [],
          themes: (selectedElement.attributes?.themes as string[]) || [],
          motifs: (selectedElement.attributes?.motifs as typeof formData.motifs) || [],
          conflicts: (selectedElement.attributes?.conflicts as typeof formData.conflicts) || []
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
            
            <EnhancedSelect 
              value={filterType} 
              onValueChange={setFilterType}
              placeholder="All Types"
              className="w-48"
            >
              <EnhancedSelectItem value="all">All Types</EnhancedSelectItem>
              {ARC_TYPES.map(type => (
                <EnhancedSelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </EnhancedSelectItem>
              ))}
            </EnhancedSelect>
            
            <EnhancedSelect 
              value={filterStatus} 
              onValueChange={setFilterStatus}
              placeholder="All Statuses"
              className="w-48"
            >
              <EnhancedSelectItem value="all">All Statuses</EnhancedSelectItem>
              {ARC_STATUS.map(status => (
                <EnhancedSelectItem key={status.value} value={status.value}>
                  {status.label}
                </EnhancedSelectItem>
              ))}
            </EnhancedSelect>

            <div className="flex items-center gap-2">
              <EnhancedSelect 
                value="all"
                placeholder="All Arcs"
                className="w-32"
              >
                <EnhancedSelectItem value="all">All Arcs</EnhancedSelectItem>
              </EnhancedSelect>

              <EnhancedSelect 
                value="updated"
                placeholder="Last Updated"
                className="w-40"
              >
                <EnhancedSelectItem value="updated">Last Updated</EnhancedSelectItem>
                <EnhancedSelectItem value="created">Date Created</EnhancedSelectItem>
                <EnhancedSelectItem value="name">Name</EnhancedSelectItem>
              </EnhancedSelect>

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
        /* Enhanced Detailed Arc View */
        <div className="space-y-0">
          {/* Modern Header with Hero Section */}
          <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
              }}></div>
            </div>
            
            <div className="relative p-8">
              <div className="flex items-start justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewingArc(null)
                    onClearSelection?.()
                  }}
                  className="text-white hover:bg-white/20 border border-white/30 backdrop-blur-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Arcs
                </Button>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (viewingArc) {
                        handleEdit(viewingArc)
                        setViewingArc(null)
                      }
                    }}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Arc
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (viewingArc && confirm('Are you sure you want to delete this arc?')) {
                        handleDelete(viewingArc.id)
                        setViewingArc(null)
                      }
                    }}
                    className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/40 backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl shadow-xl border-4 border-white/30 flex items-center justify-center"
                  style={{ backgroundColor: viewingArc.attributes.color || ARC_COLORS[0] }}
                >
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{viewingArc.name}</h1>
                  <div className="flex items-center gap-3">
                    {viewingArc.attributes.type && (
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {ARC_TYPES.find(t => t.value === viewingArc.attributes.type)?.label || viewingArc.attributes.type}
                      </Badge>
                    )}
                    {viewingArc.attributes.status && (
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {ARC_STATUS.find(s => s.value === viewingArc.attributes.status)?.label || viewingArc.attributes.status}
                      </Badge>
                    )}
                    {viewingArc.attributes.priority && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < (viewingArc.attributes.priority || 0) ? 'fill-white text-white' : 'text-white/40'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Section in Header */}
              {viewingArc.attributes.progress !== undefined && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Arc Progress</span>
                    <span className="text-2xl font-bold text-white">{viewingArc.attributes.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-white rounded-full h-3 transition-all duration-500 shadow-lg"
                      style={{ width: `${viewingArc.attributes.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-white/80 mt-2">
                    <span>Started</span>
                    <span>In Progress</span>
                    <span>Complete</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
            {/* Main Content - 3 columns */}
            <div className="xl:col-span-3 space-y-8">
              {/* Story Description with Better Typography */}
              <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Story Description</h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {viewingArc.description || 'No description provided for this arc. Click edit to add one.'}
                  </p>
                </div>
              </Card>

              {/* Enhanced Chapter Timeline */}
              <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Chapter Timeline</h2>
                  </div>
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    {viewingArc.attributes.chapter_ids?.length || 0} chapters
                  </Badge>
                </div>
                
                {viewingArc.attributes.chapter_ids && viewingArc.attributes.chapter_ids.length > 0 ? (
                  <div className="space-y-4">
                    {viewingArc.attributes.chapter_ids.map((id, index) => {
                      const chapter = chapters.find(c => c.id === id)
                      return (
                        <div key={id} className="group relative">
                          {/* Timeline connector */}
                          {index < (viewingArc.attributes.chapter_ids?.length || 0) - 1 && (
                            <div className="absolute left-6 top-16 w-0.5 h-6 bg-gradient-to-b from-green-300 to-green-200"></div>
                          )}
                          
                          <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-lg">
                              {chapter?.chapter_number || index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {chapter ? stripHtmlTags(chapter.title) : `Chapter ${index + 1}`}
                              </h3>
                              {chapter?.content && (
                                <p className="text-gray-600 leading-relaxed">
                                  {stripHtmlTags(chapter.content).substring(0, 150)}...
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              Chapter {chapter?.chapter_number || '?'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="p-4 bg-gray-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No chapters assigned</h3>
                    <p className="text-gray-500">Assign chapters to this arc to see them in the timeline</p>
                  </div>
                )}
              </Card>

              {/* Enhanced Notes Section */}
              {viewingArc.attributes.notes && (
                <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Notes & Ideas</h2>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-purple-200">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">{viewingArc.attributes.notes}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Enhanced Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Quick Stats Card */}
              <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="p-1 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  Quick Stats
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-700">Characters</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{viewingArc.attributes.character_ids?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-700">Locations</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{viewingArc.attributes.location_ids?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <span className="font-medium text-gray-700">Chapters</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{viewingArc.attributes.chapter_ids?.length || 0}</span>
                  </div>
                </div>
              </Card>

              {/* Characters Card */}
              {viewingArc.attributes.character_ids && viewingArc.attributes.character_ids.length > 0 && (
                <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Characters
                  </h3>
                  <div className="space-y-3">
                    {viewingArc.attributes.character_ids.slice(0, 5).map((id, index) => (
                      <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">Character {index + 1}</span>
                      </div>
                    ))}
                    {viewingArc.attributes.character_ids.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        +{viewingArc.attributes.character_ids.length - 5} more characters
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Locations Card */}
              {viewingArc.attributes.location_ids && viewingArc.attributes.location_ids.length > 0 && (
                <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    Locations
                  </h3>
                  <div className="space-y-3">
                    {viewingArc.attributes.location_ids.slice(0, 5).map((id, index) => (
                      <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-700">Location {index + 1}</span>
                      </div>
                    ))}
                    {viewingArc.attributes.location_ids.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        +{viewingArc.attributes.location_ids.length - 5} more locations
                      </div>
                    )}
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
                      <EnhancedProgress 
                        value={arc.attributes.progress} 
                        label="Progress"
                        showLabel={true}
                      />
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
        <DialogContent className="!w-[98vw] !max-w-[1600px] !h-[95vh] overflow-hidden bg-white border-0 shadow-2xl rounded-2xl flex flex-col">
          {/* Compact Header */}
          <DialogHeader className="relative border-b border-gray-200 pb-4 bg-gradient-to-r from-orange-50 to-amber-50 -m-6 mb-0 p-6 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {editingArc ? 'Edit Arc' : 'Create New Arc'}
                  </span>
                  {editingArc && (
                    <span className="text-sm font-normal text-orange-600 ml-2">
                      • {editingArc.name}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm mt-1">
                  {editingArc ? 'Modify arc details and structure' : 'Build a comprehensive story arc with narrative tools'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Compact Tab Navigation */}
            <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 rounded-lg shadow-sm p-1 h-12 mb-4 flex-shrink-0">
              <TabsTrigger 
                value="basic" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dependencies" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <GitBranch className="w-3 h-3" />
                <span className="hidden sm:inline">Dependencies</span>
              </TabsTrigger>
              <TabsTrigger 
                value="characters" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">Characters</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chapters" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Chapters</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pacing" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">Pacing</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="flex items-center justify-center gap-1 text-xs font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
              >
                <Star className="w-3 h-3" />
                <span className="hidden sm:inline">Advanced</span>
              </TabsTrigger>
            </TabsList>

            {/* Maximized Content Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-inner p-6 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100 min-h-0">
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
                          <EnhancedSelect 
                            value={formData.type} 
                            onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value }))}
                            placeholder="Select type"
                            className="h-14"
                          >
                            {ARC_TYPES.map(type => (
                              <EnhancedSelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-4 h-4" />
                                  <span>{type.label}</span>
                                </div>
                              </EnhancedSelectItem>
                            ))}
                          </EnhancedSelect>
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
                            <EnhancedSelect 
                              value={formData.status} 
                              onValueChange={(value: string) => setFormData(prev => ({ ...prev, status: value }))}
                              className="h-14"
                            >
                              {ARC_STATUS.map(status => (
                                <EnhancedSelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </EnhancedSelectItem>
                              ))}
                            </EnhancedSelect>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block text-gray-700">Priority</Label>
                            <EnhancedSelect 
                              value={formData.priority.toString()} 
                              onValueChange={(value: string) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                              className="h-14"
                            >
                              {[1, 2, 3, 4, 5].map(num => (
                                <EnhancedSelectItem key={num} value={num.toString()}>
                                  Priority {num}
                                </EnhancedSelectItem>
                              ))}
                            </EnhancedSelect>
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
                          <EnhancedSelect 
                            value={formData.template.type} 
                            onValueChange={(value: string) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                template: { ...prev.template, type: value }
                              }))
                            }
                            placeholder="Select template"
                            className="h-14 w-full text-base"
                            customDisplay={
                              formData.template.type ? 
                                (() => {
                                  const template = STORY_TEMPLATES.find(t => t.value === formData.template.type);
                                  return template ? `${template.label} - ${template.description}` : undefined;
                                })()
                                : undefined
                            }
                          >
                            {STORY_TEMPLATES.map(template => (
                              <EnhancedSelectItem key={template.value} value={template.value}>
                                <div className="w-full">
                                  <div className="font-semibold text-gray-900 text-base leading-tight">{template.label}</div>
                                  <div className="text-sm text-gray-600 leading-relaxed line-clamp-2 mt-1">{template.description}</div>
                                </div>
                              </EnhancedSelectItem>
                            ))}
                          </EnhancedSelect>
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
                          <EnhancedRangeSlider
                            value={formData.progress}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                            label="Arc Progress"
                            showValue={true}
                            min={0}
                            max={100}
                          />
                          <div className="mt-3">
                            <EnhancedProgress 
                              value={formData.progress} 
                              label="Completion"
                              showLabel={true}
                            />
                          </div>
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
                      <EnhancedSelect onValueChange={(arcId: string) => {
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
                      }}
                      placeholder="Select arc to add dependency..."
                      className="flex-1"
                      >
                        {arcs.filter(arc => arc.id !== editingArc?.id && !formData.dependencies.some(dep => dep.arc_id === arc.id)).map(arc => (
                          <EnhancedSelectItem key={arc.id} value={arc.id}>{arc.name}</EnhancedSelectItem>
                        ))}
                      </EnhancedSelect>
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
                            <EnhancedSelect 
                              value={dep.relationship_type} 
                              onValueChange={(value: string) => {
                                const updated = [...formData.dependencies]
                                updated[index].relationship_type = value
                                setFormData(prev => ({ ...prev, dependencies: updated }))
                              }}
                              customDisplay={
                                dep.relationship_type ? 
                                  (() => {
                                    const rel = RELATIONSHIP_TYPES.find(r => r.value === dep.relationship_type);
                                    return rel ? `${rel.label} - ${rel.description}` : undefined;
                                  })()
                                  : undefined
                              }
                            >
                              {RELATIONSHIP_TYPES.map(rel => (
                                <EnhancedSelectItem key={rel.value} value={rel.value}>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                                      <div className={`w-3 h-3 rounded-full bg-${rel.color}-500`}></div>
                                      {rel.label}
                                    </div>
                                    <div className="text-sm text-gray-600 leading-relaxed">{rel.description}</div>
                                  </div>
                                </EnhancedSelectItem>
                              ))}
                            </EnhancedSelect>
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
                      <EnhancedSelect onValueChange={(characterId: string) => {
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
                      }}
                      placeholder="Add character to this arc..."
                      className="flex-1"
                      >
                        {characters.filter(char => !formData.character_development.some(dev => dev.character_id === char.id)).map(character => (
                          <EnhancedSelectItem key={character.id} value={character.id}>{character.name}</EnhancedSelectItem>
                        ))}
                      </EnhancedSelect>
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
                              <div key={chapter.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                <EnhancedCheckbox
                                  checked={formData.chapter_ids?.includes(chapter.id) || false}
                                  onChange={(e: any) => {
                                    const isChecked = e.target.checked
                                    setFormData(prev => ({
                                      ...prev,
                                      chapter_ids: isChecked
                                        ? [...(prev.chapter_ids || []), chapter.id]
                                        : (prev.chapter_ids || []).filter((id: string) => id !== chapter.id)
                                    }))
                                  }}
                                  label={
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
                                  }
                                  className="items-start"
                                />
                              </div>
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
                          <EnhancedSelect onValueChange={(chapterId: string) => {
                            const selectedChapter = chapters.find(ch => ch.id === chapterId)
                            if (selectedChapter && !formData.pacing_profile.some(p => p.chapter_number === selectedChapter.chapter_number)) {
                              const newProfile = {
                                chapter_number: selectedChapter.chapter_number || chapters.indexOf(selectedChapter) + 1,
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
                            }
                          }}
                          placeholder="Add Chapter"
                          className="w-48"
                          >
                            {chapters
                              .filter(chapter => !formData.pacing_profile.some(p => p.chapter_number === chapter.chapter_number))
                              .map(chapter => (
                                <EnhancedSelectItem key={chapter.id} value={chapter.id}>
                                  Chapter {chapter.chapter_number || '?'}: {stripHtmlTags(chapter.title).substring(0, 30)}...
                                </EnhancedSelectItem>
                              ))
                            }
                            {chapters.filter(chapter => !formData.pacing_profile.some(p => p.chapter_number === chapter.chapter_number)).length === 0 && (
                              <EnhancedSelectItem value="" disabled>All chapters already added</EnhancedSelectItem>
                            )}
                          </EnhancedSelect>
                        </div>

                        {formData.pacing_profile.map((profile, index) => {
                          const chapter = chapters.find(ch => ch.chapter_number === profile.chapter_number)
                          return (
                          <Card key={index} className="p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium">Chapter {profile.chapter_number}</h5>
                                {chapter && (
                                  <p className="text-sm text-gray-600">{stripHtmlTags(chapter.title)}</p>
                                )}
                              </div>
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
                          )
                        })}

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
                          <EnhancedSelect onValueChange={(theme: string) => {
                            if (theme && !formData.themes.includes(theme)) {
                              setFormData(prev => ({
                                ...prev,
                                themes: [...prev.themes, theme]
                              }))
                            }
                          }}
                          placeholder="Add a theme..."
                          className="flex-1"
                          >
                            {COMMON_THEMES.filter(theme => !formData.themes.includes(theme)).map(theme => (
                              <EnhancedSelectItem key={theme} value={theme}>{theme}</EnhancedSelectItem>
                            ))}
                          </EnhancedSelect>
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
                              <EnhancedSelect
                                value={conflict.type}
                                onValueChange={(value: string) => {
                                  const updated = [...formData.conflicts]
                                  updated[index].type = value
                                  setFormData(prev => ({ ...prev, conflicts: updated }))
                                }}
                                className="w-100"
                                customDisplay={
                                  conflict.type ? 
                                    (() => {
                                      const type = CONFLICT_TYPES.find(t => t.value === conflict.type);
                                      return type ? `${type.label} - ${type.description}` : undefined;
                                    })()
                                    : undefined
                                }
                              >
                                {CONFLICT_TYPES.map(type => (
                                  <EnhancedSelectItem key={type.value} value={type.value}>
                                    <div className="space-y-2">
                                      <div className="font-semibold text-gray-900 text-base">{type.label}</div>
                                      <div className="text-sm text-gray-600 leading-relaxed line-clamp-2">{type.description}</div>
                                    </div>
                                  </EnhancedSelectItem>
                                ))}
                              </EnhancedSelect>
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

          {/* Enhanced Footer */}
          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white -m-8 mt-8 p-8 rounded-b-2xl flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="px-6 py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium rounded-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
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