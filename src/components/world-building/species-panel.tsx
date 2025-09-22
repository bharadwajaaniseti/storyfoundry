'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Zap, Search, Trash2, Edit3, Users, Eye, Heart, Shield,
  Crown, Star, Mountain, TreePine, Fish, Bird, Bug, Skull
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

interface Species {
  id: string
  name: string
  description: string
  attributes: {
    type?: string // humanoid, beast, dragon, elemental, etc.
    size?: string // tiny, small, medium, large, huge, gargantuan
    intelligence?: string // low, average, high, genius
    lifespan?: string
    habitat?: string[]
    diet?: string // carnivore, herbivore, omnivore
    alignment?: string
    abilities?: string[]
    weaknesses?: string[]
    physical_traits?: string[]
    social_structure?: string
    culture_level?: string
    languages?: string[]
    reproduction?: string
    notable_individuals?: string[]
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface SpeciesPanelProps {
  projectId: string
  selectedElement?: any
  onSpeciesChange?: () => void
  onClearSelection?: () => void
}

const SPECIES_TYPES = [
  { value: 'humanoid', label: 'Humanoid', icon: Users, color: 'blue' },
  { value: 'beast', label: 'Beast', icon: Heart, color: 'green' },
  { value: 'dragon', label: 'Dragon', icon: Crown, color: 'red' },
  { value: 'elemental', label: 'Elemental', icon: Star, color: 'purple' },
  { value: 'fey', label: 'Fey', icon: TreePine, color: 'pink' },
  { value: 'fiend', label: 'Fiend', icon: Skull, color: 'red' },
  { value: 'celestial', label: 'Celestial', icon: Star, color: 'amber' },
  { value: 'undead', label: 'Undead', icon: Skull, color: 'gray' },
  { value: 'construct', label: 'Construct', icon: Shield, color: 'cyan' },
  { value: 'plant', label: 'Plant', icon: TreePine, color: 'green' },
  { value: 'aquatic', label: 'Aquatic', icon: Fish, color: 'blue' },
  { value: 'avian', label: 'Avian', icon: Bird, color: 'sky' },
  { value: 'insectoid', label: 'Insectoid', icon: Bug, color: 'orange' }
]

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const INTELLIGENCE_LEVELS = ['Mindless', 'Animal', 'Low', 'Average', 'High', 'Genius', 'Cosmic']
const DIET_TYPES = ['Carnivore', 'Herbivore', 'Omnivore', 'Energy', 'Magic', 'Other']

export default function SpeciesPanel({ projectId, selectedElement, onSpeciesChange, onClearSelection }: SpeciesPanelProps) {
  const [species, setSpecies] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null)

  const [formData, setFormData] = useState({
    name: '', description: '', type: '', size: 'Medium', intelligence: 'Average',
    lifespan: '', habitat: [] as string[], diet: '', alignment: '',
    abilities: [] as string[], weaknesses: [] as string[], physical_traits: [] as string[],
    social_structure: '', culture_level: '', languages: [] as string[], reproduction: ''
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadSpecies()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'species') {
      setEditingSpecies(selectedElement)
      populateFormData(selectedElement)
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'species')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSpecies(data || [])
    } catch (error) {
      console.error('Error loading species:', error)
    } finally {
      setLoading(false)
    }
  }

  const populateFormData = (species: Species) => {
    setFormData({
      name: species.name,
      description: species.description,
      type: species.attributes?.type || '',
      size: species.attributes?.size || 'Medium',
      intelligence: species.attributes?.intelligence || 'Average',
      lifespan: species.attributes?.lifespan || '',
      habitat: species.attributes?.habitat || [],
      diet: species.attributes?.diet || '',
      alignment: species.attributes?.alignment || '',
      abilities: species.attributes?.abilities || [],
      weaknesses: species.attributes?.weaknesses || [],
      physical_traits: species.attributes?.physical_traits || [],
      social_structure: species.attributes?.social_structure || '',
      culture_level: species.attributes?.culture_level || '',
      languages: species.attributes?.languages || [],
      reproduction: species.attributes?.reproduction || ''
    })
  }

  const handleCreateSpecies = async () => {
    try {
      const speciesData = {
        project_id: projectId,
        category: 'species',
        name: formData.name,
        description: formData.description,
        attributes: { ...formData },
        tags: []
      }

      let result: Species
      if (editingSpecies) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...speciesData, updated_at: new Date().toISOString() })
          .eq('id', editingSpecies.id)
          .select()
          .single()

        if (error) throw error
        result = data as Species
        setSpecies(prev => prev.map(s => s.id === editingSpecies.id ? result : s))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(speciesData)
          .select()
          .single()

        if (error) throw error
        result = data as Species
        setSpecies(prev => [result, ...prev])
      }

      window.dispatchEvent(new CustomEvent('speciesCreated', { detail: { species: result, projectId } }))
      setShowCreateDialog(false)
      setEditingSpecies(null)
      resetForm()
      onSpeciesChange?.()
    } catch (error) {
      console.error('Error creating/updating species:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', description: '', type: '', size: 'Medium', intelligence: 'Average',
      lifespan: '', habitat: [], diet: '', alignment: '', abilities: [], weaknesses: [],
      physical_traits: [], social_structure: '', culture_level: '', languages: [], reproduction: ''
    })
  }

  const filteredSpecies = species.filter(s => {
    const matchesSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || !selectedType || s.attributes?.type === selectedType
    return matchesSearch && matchesType
  })

  if (loading) {
    return <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
        </div>
      </div>
    </div>
  }

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-7 h-7 text-yellow-500" />
              Species & Races
            </h2>
            <p className="text-sm text-gray-500">Create different races, creatures, and beings in your world</p>
          </div>
          <Button onClick={() => { setEditingSpecies(null); resetForm(); setShowCreateDialog(true) }} className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Species
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <Input placeholder="Search species..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SPECIES_TYPES.map(type => (
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

        {filteredSpecies.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No species yet</p>
            <p className="text-gray-500 mb-6">Create the different races and creatures that inhabit your world.</p>
            <Button onClick={() => { setEditingSpecies(null); resetForm(); setShowCreateDialog(true) }} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create First Species
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map(species => {
              const TypeIcon = SPECIES_TYPES.find(t => t.value === species.attributes?.type)?.icon || Users
              const typeColor = SPECIES_TYPES.find(t => t.value === species.attributes?.type)?.color || 'gray'
              
              return (
                <Card key={species.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 text-${typeColor}-500`} />
                        <div>
                          <CardTitle className="text-lg font-semibold">{species.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{species.attributes?.type || 'Unknown'}</Badge>
                            {species.attributes?.size && <Badge variant="outline">{species.attributes.size}</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSpecies(prev => prev.filter(s => s.id !== species.id))}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {species.description && <p className="text-sm text-gray-600 line-clamp-3">{species.description}</p>}
                      
                      <div className="text-sm space-y-1">
                        {species.attributes?.intelligence && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Intelligence:</span>
                            <span>{species.attributes.intelligence}</span>
                          </div>
                        )}
                        {species.attributes?.lifespan && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Lifespan:</span>
                            <span>{species.attributes.lifespan}</span>
                          </div>
                        )}
                        {species.attributes?.diet && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Diet:</span>
                            <span>{species.attributes.diet}</span>
                          </div>
                        )}
                      </div>

                      {species.attributes?.abilities && species.attributes.abilities.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Abilities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {species.attributes.abilities.slice(0, 3).map((ability: string) => (
                              <Badge key={ability} variant="outline" className="text-xs">{ability}</Badge>
                            ))}
                            {species.attributes.abilities.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{species.attributes.abilities.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingSpecies(species); populateFormData(species); setShowCreateDialog(true) }}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <span className="text-xs text-gray-500">{new Date(species.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) { setEditingSpecies(null); resetForm(); onClearSelection?.() }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSpecies ? 'Edit Species' : 'Create New Species'}</DialogTitle>
              <DialogDescription>Define a new species or race for your world.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Species name..." />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_TYPES.map(type => (
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
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this species..." rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Size</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Intelligence</Label>
                  <Select value={formData.intelligence} onValueChange={(value) => setFormData(prev => ({ ...prev, intelligence: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTELLIGENCE_LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Diet</Label>
                  <Select value={formData.diet} onValueChange={(value) => setFormData(prev => ({ ...prev, diet: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diet" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIET_TYPES.map(diet => <SelectItem key={diet} value={diet}>{diet}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lifespan">Lifespan</Label>
                  <Input id="lifespan" value={formData.lifespan} onChange={(e) => setFormData(prev => ({ ...prev, lifespan: e.target.value }))} placeholder="e.g., 80 years, immortal" />
                </div>
                <div>
                  <Label htmlFor="social_structure">Social Structure</Label>
                  <Input id="social_structure" value={formData.social_structure} onChange={(e) => setFormData(prev => ({ ...prev, social_structure: e.target.value }))} placeholder="e.g., tribal, monarchy, democratic" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingSpecies(null); resetForm(); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateSpecies} className="bg-yellow-500 hover:bg-yellow-600 text-white" disabled={!formData.name.trim()}>
                {editingSpecies ? 'Update' : 'Create'} Species
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}