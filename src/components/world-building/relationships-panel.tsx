'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Heart, Search, MoreVertical, Trash2, Edit3, Users, 
  ArrowRight, Eye, EyeOff, Filter, X, ChevronDown, ChevronRight,
  Link2, Target, Zap, Crown, Shield, MessageCircle, Flame,
  Save, User, AlertTriangle, CheckCircle, Clock, Calendar
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

interface Relationship {
  id: string
  name: string
  description: string
  attributes: {
    type?: string // romantic, familial, friendship, rivalry, professional, etc.
    strength?: number // 1-10 scale
    status?: string // active, former, complicated, unknown
    dynamics?: string[] // mutual_respect, one_sided, toxic, supportive, etc.
    history?: string
    current_state?: string
    character_1_id?: string
    character_1_name?: string
    character_2_id?: string
    character_2_name?: string
    notes?: string
    timeline_events?: Array<{
      date: string
      event: string
      description: string
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

interface RelationshipsPanelProps {
  projectId: string
  selectedElement?: any
  onRelationshipsChange?: () => void
  onClearSelection?: () => void
}

const RELATIONSHIP_TYPES = [
  { value: 'romantic', label: 'Romantic', icon: Heart, color: 'rose' },
  { value: 'familial', label: 'Family', icon: Users, color: 'blue' },
  { value: 'friendship', label: 'Friendship', icon: User, color: 'green' },
  { value: 'rivalry', label: 'Rivalry', icon: Flame, color: 'red' },
  { value: 'professional', label: 'Professional', icon: Shield, color: 'purple' },
  { value: 'mentorship', label: 'Mentorship', icon: Target, color: 'amber' },
  { value: 'alliance', label: 'Alliance', icon: Link2, color: 'cyan' },
  { value: 'conflict', label: 'Conflict', icon: Zap, color: 'orange' },
  { value: 'hierarchy', label: 'Hierarchy', icon: Crown, color: 'violet' },
  { value: 'other', label: 'Other', icon: MessageCircle, color: 'gray' }
]

const RELATIONSHIP_STATUS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'former', label: 'Former', color: 'gray' },
  { value: 'complicated', label: 'Complicated', color: 'yellow' },
  { value: 'unknown', label: 'Unknown', color: 'slate' },
  { value: 'developing', label: 'Developing', color: 'blue' },
  { value: 'strained', label: 'Strained', color: 'orange' },
  { value: 'broken', label: 'Broken', color: 'red' }
]

const RELATIONSHIP_DYNAMICS = [
  'mutual_respect', 'one_sided', 'toxic', 'supportive', 'competitive',
  'protective', 'dependent', 'manipulative', 'inspiring', 'challenging',
  'nurturing', 'conflicted', 'secretive', 'open', 'balanced'
]

export default function RelationshipsPanel({ 
  projectId, 
  selectedElement, 
  onRelationshipsChange,
  onClearSelection 
}: RelationshipsPanelProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid')

  // Form state for creating/editing relationships
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    strength: 5,
    status: 'active',
    character_1_id: '',
    character_2_id: '',
    dynamics: [] as string[],
    history: '',
    current_state: '',
    notes: ''
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadRelationships()
    loadCharacters()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'relationships') {
      setEditingRelationship(selectedElement)
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'relationships')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRelationships(data || [])
    } catch (error) {
      console.error('Error loading relationships:', error)
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

  const filteredRelationships = relationships.filter(relationship => {
    const matchesSearch = !searchTerm || 
      relationship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.attributes?.character_1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relationship.attributes?.character_2_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || !selectedType || relationship.attributes?.type === selectedType
    const matchesStatus = selectedStatus === 'all' || !selectedStatus || relationship.attributes?.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateRelationship = async () => {
    try {
      const character1 = characters.find(c => c.id === formData.character_1_id)
      const character2 = characters.find(c => c.id === formData.character_2_id)

      if (!character1 || !character2) {
        alert('Please select both characters for the relationship')
        return
      }

      const relationshipData = {
        project_id: projectId,
        category: 'relationships',
        name: formData.name || `${character1.name} & ${character2.name}`,
        description: formData.description,
        attributes: {
          type: formData.type,
          strength: formData.strength,
          status: formData.status,
          character_1_id: formData.character_1_id,
          character_1_name: character1.name,
          character_2_id: formData.character_2_id,
          character_2_name: character2.name,
          dynamics: formData.dynamics,
          history: formData.history,
          current_state: formData.current_state,
          notes: formData.notes,
          timeline_events: []
        },
        tags: []
      }

      let result: Relationship
      if (editingRelationship) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...relationshipData, updated_at: new Date().toISOString() })
          .eq('id', editingRelationship.id)
          .select()
          .single()

        if (error) throw error
        result = data as Relationship

        setRelationships(prev => prev.map(r => r.id === editingRelationship.id ? result : r))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(relationshipData)
          .select()
          .single()

        if (error) throw error
        result = data as Relationship

        setRelationships(prev => [result, ...prev])
      }

      // Broadcast change
      window.dispatchEvent(new CustomEvent('relationshipCreated', { 
        detail: { relationship: result, projectId } 
      }))

      setShowCreateDialog(false)
      setEditingRelationship(null)
      resetForm()
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error creating/updating relationship:', error)
    }
  }

  const handleDeleteRelationship = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRelationships(prev => prev.filter(r => r.id !== id))
      onRelationshipsChange?.()
    } catch (error) {
      console.error('Error deleting relationship:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      strength: 5,
      status: 'active',
      character_1_id: '',
      character_2_id: '',
      dynamics: [],
      history: '',
      current_state: '',
      notes: ''
    })
  }

  const getRelationshipTypeIcon = (type: string) => {
    const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === type)
    return relationshipType ? relationshipType.icon : Heart
  }

  const getRelationshipTypeColor = (type: string) => {
    const relationshipType = RELATIONSHIP_TYPES.find(t => t.value === type)
    return relationshipType ? relationshipType.color : 'gray'
  }

  const getStatusColor = (status: string) => {
    const statusObj = RELATIONSHIP_STATUS.find(s => s.value === status)
    return statusObj ? statusObj.color : 'gray'
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
              <Heart className="w-7 h-7 text-rose-500" />
              Relationships
            </h2>
            <p className="text-sm text-gray-500">Map connections, conflicts, and bonds between characters</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'network' : 'grid')}
            >
              {viewMode === 'grid' ? 'Network View' : 'Grid View'}
            </Button>
            <Button
              onClick={() => {
                setEditingRelationship(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Relationship
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search relationships..."
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
              {RELATIONSHIP_TYPES.map(type => (
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
              {RELATIONSHIP_STATUS.map(status => (
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
        {filteredRelationships.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No relationships yet</p>
            <p className="text-gray-500 mb-6">
              Start mapping the connections between your characters to bring depth to your story.
            </p>
            <Button 
              onClick={() => {
                setEditingRelationship(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Relationship
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRelationships.map(relationship => {
              const TypeIcon = getRelationshipTypeIcon(relationship.attributes?.type || '')
              const typeColor = getRelationshipTypeColor(relationship.attributes?.type || '')
              const statusColor = getStatusColor(relationship.attributes?.status || 'active')
              
              return (
                <Card key={relationship.id} className="hover:shadow-md transition-shadow border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
                        <div>
                          <CardTitle className="text-lg font-semibold truncate">
                            {relationship.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={`bg-${statusColor}-100 text-${statusColor}-700`}
                            >
                              {RELATIONSHIP_STATUS.find(s => s.value === relationship.attributes?.status)?.label || 'Active'}
                            </Badge>
                            {relationship.attributes?.strength && (
                              <Badge variant="outline">
                                Strength: {relationship.attributes.strength}/10
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRelationship(relationship.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Characters */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">
                          {relationship.attributes?.character_1_name || 'Character 1'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-blue-600">
                          {relationship.attributes?.character_2_name || 'Character 2'}
                        </span>
                      </div>

                      {/* Description */}
                      {relationship.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {relationship.description}
                        </p>
                      )}

                      {/* Dynamics */}
                      {relationship.attributes?.dynamics && relationship.attributes.dynamics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {relationship.attributes.dynamics.slice(0, 3).map((dynamic: string) => (
                            <Badge key={dynamic} variant="outline" className="text-xs">
                              {dynamic.replace('_', ' ')}
                            </Badge>
                          ))}
                          {relationship.attributes.dynamics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{relationship.attributes.dynamics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRelationship(relationship)
                            // Populate form with existing data
                            setFormData({
                              name: relationship.name,
                              description: relationship.description,
                              type: relationship.attributes?.type || '',
                              strength: relationship.attributes?.strength || 5,
                              status: relationship.attributes?.status || 'active',
                              character_1_id: relationship.attributes?.character_1_id || '',
                              character_2_id: relationship.attributes?.character_2_id || '',
                              dynamics: relationship.attributes?.dynamics || [],
                              history: relationship.attributes?.history || '',
                              current_state: relationship.attributes?.current_state || '',
                              notes: relationship.attributes?.notes || ''
                            })
                            setShowCreateDialog(true)
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <span className="text-xs text-gray-500">
                          {new Date(relationship.updated_at).toLocaleDateString()}
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
            setEditingRelationship(null)
            resetForm()
            onClearSelection?.()
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRelationship ? 'Edit Relationship' : 'Create New Relationship'}
              </DialogTitle>
              <DialogDescription>
                Define the connection between two characters in your story.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Character Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="character_1">First Character</Label>
                  <Select value={formData.character_1_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, character_1_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map(character => (
                        <SelectItem key={character.id} value={character.id}>
                          {character.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="character_2">Second Character</Label>
                  <Select value={formData.character_2_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, character_2_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map(character => (
                        <SelectItem key={character.id} value={character.id}>
                          {character.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <Label htmlFor="name">Relationship Name (Optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Auto-generated if left blank"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the nature of this relationship..."
                  rows={3}
                />
              </div>

              {/* Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Relationship Type</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map(type => (
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
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_STATUS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strength */}
              <div>
                <Label htmlFor="strength">Relationship Strength (1-10)</Label>
                <Input
                  id="strength"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.strength}
                  onChange={(e) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Weak</span>
                  <span className="font-medium">{formData.strength}/10</span>
                  <span>Strong</span>
                </div>
              </div>

              {/* Dynamics */}
              <div>
                <Label>Relationship Dynamics</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {RELATIONSHIP_DYNAMICS.map(dynamic => (
                    <label key={dynamic} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.dynamics.includes(dynamic)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              dynamics: [...prev.dynamics, dynamic] 
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              dynamics: prev.dynamics.filter(d => d !== dynamic) 
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span>{dynamic.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div>
                <Label htmlFor="history">Relationship History</Label>
                <Textarea
                  id="history"
                  value={formData.history}
                  onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
                  placeholder="How did this relationship develop over time?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="current_state">Current State</Label>
                <Textarea
                  id="current_state"
                  value={formData.current_state}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_state: e.target.value }))}
                  placeholder="What's the current state of this relationship?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any other notes about this relationship..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingRelationship(null)
                  resetForm()
                  onClearSelection?.()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRelationship}
                className="bg-rose-500 hover:bg-rose-600 text-white"
                disabled={!formData.character_1_id || !formData.character_2_id}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingRelationship ? 'Update' : 'Create'} Relationship
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}