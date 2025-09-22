'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Target, Search, MoreVertical, Trash2, Edit3, BookOpen,
  TrendingUp, Users, Clock, Flag, ChevronDown, ChevronRight,
  Save, X, Calendar, MapPin, User, Zap, Heart, Crown, Eye, EyeOff,
  ArrowRight, CheckCircle, Circle, AlertTriangle, Star
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
    type?: string // character, plot, theme, relationship
    status?: string // planned, active, completed, abandoned
    priority?: number // 1-5 scale
    progress?: number // 0-100 percentage
    start_chapter?: string
    end_chapter?: string
    character_ids?: string[]
    character_names?: string[]
    milestones?: Array<{
      id: string
      title: string
      description: string
      chapter?: string
      completed: boolean
      order: number
    }>
    themes?: string[]
    conflicts?: string[]
    resolution?: string
    notes?: string
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

interface ArcsPanelProps {
  projectId: string
  selectedElement?: any
  onArcsChange?: () => void
  onClearSelection?: () => void
}

const ARC_TYPES = [
  { value: 'character', label: 'Character Arc', icon: User, color: 'blue' },
  { value: 'plot', label: 'Plot Arc', icon: BookOpen, color: 'green' },
  { value: 'theme', label: 'Thematic Arc', icon: Heart, color: 'purple' },
  { value: 'relationship', label: 'Relationship Arc', icon: Users, color: 'pink' },
  { value: 'world', label: 'World Arc', icon: Crown, color: 'amber' },
  { value: 'mystery', label: 'Mystery Arc', icon: Eye, color: 'indigo' }
]

const ARC_STATUS = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'active', label: 'Active', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'on_hold', label: 'On Hold', color: 'yellow' },
  { value: 'abandoned', label: 'Abandoned', color: 'red' }
]

const COMMON_THEMES = [
  'redemption', 'coming_of_age', 'sacrifice', 'love', 'betrayal', 'power', 'justice',
  'family', 'friendship', 'revenge', 'discovery', 'transformation', 'loss', 'hope'
]

export default function ArcsPanel({ 
  projectId, 
  selectedElement, 
  onArcsChange,
  onClearSelection 
}: ArcsPanelProps) {
  const [arcs, setArcs] = useState<Arc[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArc, setEditingArc] = useState<Arc | null>(null)
  const [expandedArcs, setExpandedArcs] = useState<string[]>([])

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
    themes: [] as string[],
    conflicts: [] as string[],
    resolution: '',
    notes: '',
    milestones: [] as Array<{
      id: string
      title: string
      description: string
      chapter?: string
      completed: boolean
      order: number
    }>
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadArcs()
    loadCharacters()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'arcs') {
      setEditingArc(selectedElement)
      populateFormData(selectedElement)
      setShowCreateDialog(true)
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
      themes: arc.attributes?.themes || [],
      conflicts: arc.attributes?.conflicts || [],
      resolution: arc.attributes?.resolution || '',
      notes: arc.attributes?.notes || '',
      milestones: arc.attributes?.milestones || []
    })
  }

  const filteredArcs = arcs.filter(arc => {
    const matchesSearch = !searchTerm || 
      arc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arc.attributes?.themes?.some((theme: string) => 
        theme.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesType = selectedType === 'all' || !selectedType || arc.attributes?.type === selectedType
    const matchesStatus = selectedStatus === 'all' || !selectedStatus || arc.attributes?.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateArc = async () => {
    try {
      const selectedCharacters = characters.filter(c => formData.character_ids.includes(c.id))
      
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
          themes: formData.themes,
          conflicts: formData.conflicts,
          resolution: formData.resolution,
          notes: formData.notes,
          milestones: formData.milestones
        },
        tags: []
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
      themes: [],
      conflicts: [],
      resolution: '',
      notes: '',
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
      order: formData.milestones.length + 1
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

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-amber-500" />
              Story Arcs
            </h2>
            <p className="text-sm text-gray-500">Plan character development and plot progression throughout your story</p>
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search arcs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
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
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ARC_STATUS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${status.color}-500`}></div>
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {filteredArcs.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No story arcs yet</p>
            <p className="text-gray-500 mb-6">
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
          <div className="space-y-4">
            {filteredArcs.map(arc => {
              const TypeIcon = getArcTypeIcon(arc.attributes?.type || '')
              const typeColor = getArcTypeColor(arc.attributes?.type || '')
              const statusColor = getStatusColor(arc.attributes?.status || 'planned')
              const isExpanded = expandedArcs.includes(arc.id)
              const progress = arc.attributes?.progress || 0
              
              return (
                <Card key={arc.id} className="hover:shadow-md transition-shadow border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleArcExpansion(arc.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold truncate">
                            {arc.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`bg-${statusColor}-100 text-${statusColor}-700`}
                            >
                              {ARC_STATUS.find(s => s.value === arc.attributes?.status)?.label || 'Planned'}
                            </Badge>
                            {arc.attributes?.priority && (
                              <Badge variant="outline">
                                Priority: {arc.attributes.priority}/5
                              </Badge>
                            )}
                            {arc.attributes?.character_names && arc.attributes.character_names.length > 0 && (
                              <Badge variant="outline">
                                {arc.attributes.character_names.length} character{arc.attributes.character_names.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArc(arc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Description */}
                      {arc.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {arc.description}
                        </p>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t">
                          {/* Characters */}
                          {arc.attributes?.character_names && arc.attributes.character_names.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Characters</h4>
                              <div className="flex flex-wrap gap-1">
                                {arc.attributes.character_names.map((name: string) => (
                                  <Badge key={name} variant="outline" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Themes */}
                          {arc.attributes?.themes && arc.attributes.themes.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Themes</h4>
                              <div className="flex flex-wrap gap-1">
                                {arc.attributes.themes.map((theme: string) => (
                                  <Badge key={theme} variant="secondary" className="text-xs">
                                    {theme}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Milestones */}
                          {arc.attributes?.milestones && arc.attributes.milestones.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Milestones</h4>
                              <div className="space-y-2">
                                {arc.attributes.milestones.map((milestone: any) => (
                                  <div key={milestone.id} className="flex items-center gap-2 text-sm">
                                    {milestone.completed ? 
                                      <CheckCircle className="w-4 h-4 text-green-500" /> :
                                      <Circle className="w-4 h-4 text-gray-400" />
                                    }
                                    <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                                      {milestone.title}
                                    </span>
                                    {milestone.chapter && (
                                      <Badge variant="outline" className="text-xs">
                                        Ch. {milestone.chapter}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingArc(arc)
                            populateFormData(arc)
                            setShowCreateDialog(true)
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <span className="text-xs text-gray-500">
                          {new Date(arc.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArc ? 'Edit Arc' : 'Create New Arc'}
              </DialogTitle>
              <DialogDescription>
                Define a story arc to track character development and plot progression.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Arc Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter arc name..."
                  />
                </div>
                <div>
                  <Label htmlFor="type">Arc Type</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this arc..."
                  rows={3}
                />
              </div>

              {/* Status and Progress */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARC_STATUS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-5)</Label>
                  <Input
                    id="priority"
                    type="range"
                    min="1"
                    max="5"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  />
                  <div className="text-center text-sm text-gray-500 mt-1">{formData.priority}/5</div>
                </div>
                <div>
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  />
                  <div className="text-center text-sm text-gray-500 mt-1">{formData.progress}%</div>
                </div>
              </div>

              {/* Character Selection */}
              <div>
                <Label>Associated Characters</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {characters.map(character => (
                    <label key={character.id} className="flex items-center space-x-2 text-sm">
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
                        className="rounded border-gray-300"
                      />
                      <span>{character.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <Label>Themes</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {COMMON_THEMES.map(theme => (
                    <label key={theme} className="flex items-center space-x-2 text-sm">
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
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">{theme.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Milestones</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addMilestone}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {formData.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <Input
                          placeholder="Milestone title..."
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                          className="flex-1 mr-2"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(milestone.id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Milestone description..."
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                        rows={2}
                        className="mb-2"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Chapter"
                          value={milestone.chapter || ''}
                          onChange={(e) => updateMilestone(milestone.id, { chapter: e.target.value })}
                          className="w-24"
                        />
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={(e) => updateMilestone(milestone.id, { completed: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span>Completed</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  value={formData.resolution}
                  onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                  placeholder="How does this arc resolve?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this arc..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingArc(null)
                  resetForm()
                  onClearSelection?.()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateArc}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingArc ? 'Update' : 'Create'} Arc
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}