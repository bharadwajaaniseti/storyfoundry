'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Zap, Search, MoreVertical, Trash2, Edit3, BookOpen,
  Star, Flame, Wind, Droplets, Mountain, Sun, Moon, Eye,
  Save, X, Wand2, Shield, Target, Clock, Sparkles, Crown
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

interface MagicElement {
  id: string
  name: string
  description: string
  attributes: {
    type?: string // system, spell, artifact, school, creature, phenomenon
    school?: string // evocation, transmutation, etc.
    level?: number // 1-10 power level
    rarity?: string // common, uncommon, rare, legendary
    components?: string[] // verbal, somatic, material, etc.
    casting_time?: string
    duration?: string
    range?: string
    area_of_effect?: string
    requirements?: string[]
    limitations?: string[]
    side_effects?: string[]
    history?: string
    practitioners?: string[]
    related_elements?: string[]
    cost?: string
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface MagicPanelProps {
  projectId: string
  selectedElement?: any
  onMagicChange?: () => void
  onClearSelection?: () => void
}

const MAGIC_TYPES = [
  { value: 'system', label: 'Magic System', icon: Crown, color: 'purple' },
  { value: 'spell', label: 'Spell', icon: Sparkles, color: 'blue' },
  { value: 'artifact', label: 'Magical Artifact', icon: Star, color: 'amber' },
  { value: 'school', label: 'School of Magic', icon: BookOpen, color: 'green' },
  { value: 'creature', label: 'Magical Creature', icon: Eye, color: 'red' },
  { value: 'phenomenon', label: 'Magical Phenomenon', icon: Wand2, color: 'cyan' },
  { value: 'ritual', label: 'Ritual', icon: Sun, color: 'orange' },
  { value: 'enchantment', label: 'Enchantment', icon: Shield, color: 'violet' }
]

const MAGIC_SCHOOLS = [
  'Evocation', 'Transmutation', 'Illusion', 'Enchantment', 'Divination',
  'Necromancy', 'Abjuration', 'Conjuration', 'Elementalism', 'Healing',
  'Warding', 'Mind Magic', 'Time Magic', 'Space Magic', 'Nature Magic'
]

const MAGIC_RARITY = [
  { value: 'common', label: 'Common', color: 'gray' },
  { value: 'uncommon', label: 'Uncommon', color: 'green' },
  { value: 'rare', label: 'Rare', color: 'blue' },
  { value: 'epic', label: 'Epic', color: 'purple' },
  { value: 'legendary', label: 'Legendary', color: 'amber' },
  { value: 'mythic', label: 'Mythic', color: 'red' }
]

const MAGIC_COMPONENTS = [
  'verbal', 'somatic', 'material', 'focus', 'divine_focus', 'arcane_focus',
  'blood', 'sacrifice', 'meditation', 'ritual_circle', 'components'
]

const CASTING_TIMES = [
  'instant', '1 action', '1 bonus action', '1 reaction', '1 minute', 
  '10 minutes', '1 hour', '8 hours', '24 hours', 'ritual'
]

const DURATIONS = [
  'instantaneous', '1 round', '1 minute', '10 minutes', '1 hour', 
  '8 hours', '24 hours', 'permanent', 'concentration'
]

export default function MagicPanel({ 
  projectId, 
  selectedElement, 
  onMagicChange,
  onClearSelection 
}: MagicPanelProps) {
  const [magicElements, setMagicElements] = useState<MagicElement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingElement, setEditingElement] = useState<MagicElement | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    school: '',
    level: 1,
    rarity: 'common',
    components: [] as string[],
    casting_time: '',
    duration: '',
    range: '',
    area_of_effect: '',
    requirements: [] as string[],
    limitations: [] as string[],
    side_effects: [] as string[],
    history: '',
    practitioners: [] as string[],
    cost: ''
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadMagicElements()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'magic') {
      setEditingElement(selectedElement)
      populateFormData(selectedElement)
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadMagicElements = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'magic')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMagicElements(data || [])
    } catch (error) {
      console.error('Error loading magic elements:', error)
    } finally {
      setLoading(false)
    }
  }

  const populateFormData = (element: MagicElement) => {
    setFormData({
      name: element.name,
      description: element.description,
      type: element.attributes?.type || '',
      school: element.attributes?.school || '',
      level: element.attributes?.level || 1,
      rarity: element.attributes?.rarity || 'common',
      components: element.attributes?.components || [],
      casting_time: element.attributes?.casting_time || '',
      duration: element.attributes?.duration || '',
      range: element.attributes?.range || '',
      area_of_effect: element.attributes?.area_of_effect || '',
      requirements: element.attributes?.requirements || [],
      limitations: element.attributes?.limitations || [],
      side_effects: element.attributes?.side_effects || [],
      history: element.attributes?.history || '',
      practitioners: element.attributes?.practitioners || [],
      cost: element.attributes?.cost || ''
    })
  }

  const filteredElements = magicElements.filter(element => {
    const matchesSearch = !searchTerm || 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.attributes?.school?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || !selectedType || element.attributes?.type === selectedType
    const matchesSchool = selectedSchool === 'all' || !selectedSchool || element.attributes?.school === selectedSchool
    const matchesRarity = selectedRarity === 'all' || !selectedRarity || element.attributes?.rarity === selectedRarity
    
    return matchesSearch && matchesType && matchesSchool && matchesRarity
  })

  const handleCreateElement = async () => {
    try {
      const elementData = {
        project_id: projectId,
        category: 'magic',
        name: formData.name,
        description: formData.description,
        attributes: {
          type: formData.type,
          school: formData.school,
          level: formData.level,
          rarity: formData.rarity,
          components: formData.components,
          casting_time: formData.casting_time,
          duration: formData.duration,
          range: formData.range,
          area_of_effect: formData.area_of_effect,
          requirements: formData.requirements,
          limitations: formData.limitations,
          side_effects: formData.side_effects,
          history: formData.history,
          practitioners: formData.practitioners,
          cost: formData.cost
        },
        tags: []
      }

      let result: MagicElement
      if (editingElement) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...elementData, updated_at: new Date().toISOString() })
          .eq('id', editingElement.id)
          .select()
          .single()

        if (error) throw error
        result = data as MagicElement

        setMagicElements(prev => prev.map(e => e.id === editingElement.id ? result : e))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(elementData)
          .select()
          .single()

        if (error) throw error
        result = data as MagicElement

        setMagicElements(prev => [result, ...prev])
      }

      // Broadcast change
      window.dispatchEvent(new CustomEvent('magicCreated', { 
        detail: { magic: result, projectId } 
      }))

      setShowCreateDialog(false)
      setEditingElement(null)
      resetForm()
      onMagicChange?.()
    } catch (error) {
      console.error('Error creating/updating magic element:', error)
    }
  }

  const handleDeleteElement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this magic element?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMagicElements(prev => prev.filter(e => e.id !== id))
      onMagicChange?.()
    } catch (error) {
      console.error('Error deleting magic element:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      school: '',
      level: 1,
      rarity: 'common',
      components: [],
      casting_time: '',
      duration: '',
      range: '',
      area_of_effect: '',
      requirements: [],
      limitations: [],
      side_effects: [],
      history: '',
      practitioners: [],
      cost: ''
    })
  }

  const getMagicTypeIcon = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType ? magicType.icon : Zap
  }

  const getMagicTypeColor = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType ? magicType.color : 'gray'
  }

  const getRarityColor = (rarity: string) => {
    const rarityObj = MAGIC_RARITY.find(r => r.value === rarity)
    return rarityObj ? rarityObj.color : 'gray'
  }

  const addToStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
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
              <Zap className="w-7 h-7 text-yellow-500" />
              Magic System
            </h2>
            <p className="text-sm text-gray-500">Define magical systems, spells, and supernatural elements</p>
          </div>
          <Button
            onClick={() => {
              setEditingElement(null)
              resetForm()
              setShowCreateDialog(true)
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Magic Element
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search magic elements..."
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
              {MAGIC_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {MAGIC_SCHOOLS.map(school => (
                <SelectItem key={school} value={school}>
                  {school}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              {MAGIC_RARITY.map(rarity => (
                <SelectItem key={rarity.value} value={rarity.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${rarity.color}-500`}></div>
                    {rarity.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {filteredElements.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No magic elements yet</p>
            <p className="text-gray-500 mb-6">
              Start building your magic system by defining spells, artifacts, and magical phenomena.
            </p>
            <Button 
              onClick={() => {
                setEditingElement(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Magic Element
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElements.map(element => {
              const TypeIcon = getMagicTypeIcon(element.attributes?.type || '')
              const typeColor = getMagicTypeColor(element.attributes?.type || '')
              const rarityColor = getRarityColor(element.attributes?.rarity || 'common')
              
              return (
                <Card key={element.id} className="hover:shadow-md transition-shadow border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
                        <div>
                          <CardTitle className="text-lg font-semibold truncate">
                            {element.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`bg-${rarityColor}-100 text-${rarityColor}-700`}
                            >
                              {MAGIC_RARITY.find(r => r.value === element.attributes?.rarity)?.label || 'Common'}
                            </Badge>
                            {element.attributes?.level && (
                              <Badge variant="outline">
                                Level {element.attributes.level}
                              </Badge>
                            )}
                            {element.attributes?.school && (
                              <Badge variant="outline">
                                {element.attributes.school}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteElement(element.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Description */}
                      {element.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {element.description}
                        </p>
                      )}

                      {/* Magic Details */}
                      <div className="space-y-2 text-sm">
                        {element.attributes?.casting_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Casting Time:</span>
                            <span>{element.attributes.casting_time}</span>
                          </div>
                        )}
                        {element.attributes?.duration && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Duration:</span>
                            <span>{element.attributes.duration}</span>
                          </div>
                        )}
                        {element.attributes?.range && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Range:</span>
                            <span>{element.attributes.range}</span>
                          </div>
                        )}
                      </div>

                      {/* Components */}
                      {element.attributes?.components && element.attributes.components.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Components:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {element.attributes.components.slice(0, 3).map((component: string) => (
                              <Badge key={component} variant="outline" className="text-xs">
                                {component.replace('_', ' ')}
                              </Badge>
                            ))}
                            {element.attributes.components.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{element.attributes.components.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingElement(element)
                            populateFormData(element)
                            setShowCreateDialog(true)
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <span className="text-xs text-gray-500">
                          {new Date(element.updated_at).toLocaleDateString()}
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
            setEditingElement(null)
            resetForm()
            onClearSelection?.()
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingElement ? 'Edit Magic Element' : 'Create New Magic Element'}
              </DialogTitle>
              <DialogDescription>
                Define a magical element for your world's magic system.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name..."
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAGIC_TYPES.map(type => (
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
                  placeholder="Describe this magic element..."
                  rows={3}
                />
              </div>

              {/* Magic Properties */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="school">School</Label>
                  <Select value={formData.school} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, school: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAGIC_SCHOOLS.map(school => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level (1-10)</Label>
                  <Input
                    id="level"
                    type="range"
                    min="1"
                    max="10"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                  />
                  <div className="text-center text-sm text-gray-500 mt-1">{formData.level}/10</div>
                </div>
                <div>
                  <Label htmlFor="rarity">Rarity</Label>
                  <Select value={formData.rarity} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, rarity: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAGIC_RARITY.map(rarity => (
                        <SelectItem key={rarity.value} value={rarity.value}>
                          {rarity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Spell Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="casting_time">Casting Time</Label>
                  <Select value={formData.casting_time} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, casting_time: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select casting time" />
                    </SelectTrigger>
                    <SelectContent>
                      {CASTING_TIMES.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={formData.duration} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, duration: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(duration => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="range">Range</Label>
                  <Input
                    id="range"
                    value={formData.range}
                    onChange={(e) => setFormData(prev => ({ ...prev, range: e.target.value }))}
                    placeholder="e.g., 30 feet, Touch, Self"
                  />
                </div>
              </div>

              {/* Components */}
              <div>
                <Label>Components</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {MAGIC_COMPONENTS.map(component => (
                    <label key={component} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.components.includes(component)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              components: [...prev.components, component] 
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              components: prev.components.filter(c => c !== component) 
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">{component.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div>
                <Label htmlFor="area_of_effect">Area of Effect</Label>
                <Input
                  id="area_of_effect"
                  value={formData.area_of_effect}
                  onChange={(e) => setFormData(prev => ({ ...prev, area_of_effect: e.target.value }))}
                  placeholder="e.g., 20-foot radius sphere"
                />
              </div>

              <div>
                <Label htmlFor="cost">Cost/Price</Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="e.g., 50 gold pieces, rare component"
                />
              </div>

              <div>
                <Label htmlFor="history">History</Label>
                <Textarea
                  id="history"
                  value={formData.history}
                  onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
                  placeholder="History and origin of this magic element..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingElement(null)
                  resetForm()
                  onClearSelection?.()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateElement}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={!formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingElement ? 'Update' : 'Create'} Magic Element
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}