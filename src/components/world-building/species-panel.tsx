'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Edit3, Trash2, X, MoreVertical, Filter, Grid3x3, List, Download, Upload, 
  Zap, Heart, Leaf, Bird, Fish, Bug, Users, Skull, Flame, Sparkles, Cog, Sun, Asterisk,
  Clock, Lightbulb, Copy, FileDown, Keyboard, Eye, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'

// Types
interface Species {
  id: string
  project_id: string
  category: 'species'
  name: string
  description: string
  tags: string[]
  attributes: {
    // Core attributes
    type?: string
    size?: string
    intelligence?: string
    diet?: string
    lifespan?: string
    endangered?: boolean
    
    // Habitat
    habitat?: string[]
    biome?: string[]
    
    // Biology
    physical_traits?: string[]
    anatomy?: string
    weaknesses?: string[]
    abilities?: string[]
    
    // Behavior
    temperament?: string
    reproduction?: string
    lifecycle?: string
    behavior_notes?: string
    
    // Culture (sapients only)
    social_structure?: string
    culture_level?: string
    languages?: string[]
    
    // Relations
    predators?: string[]
    prey?: string[]
    symbiosis?: string[]
    rivals?: string[]
    
    // Variants
    variants?: Array<{
      name: string
      notes?: string
      diff?: Record<string, any>
    }>
    
    // Gallery
    gallery?: string[]
    
    // Custom fields
    custom_fields?: Array<{
      key: string
      type: 'text' | 'multiline' | 'number' | 'chip-list' | 'select'
      value: any
      options?: string[]
    }>
    
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

interface SpeciesPanelProps {
  projectId: string
  selectedElement?: any
  onSpeciesChange?: () => void
  onClearSelection?: () => void
}

// Constants
const SPECIES_TYPES = [
  { value: 'beast', label: 'Beast', icon: Heart, color: 'text-green-600' },
  { value: 'plant', label: 'Flora', icon: Leaf, color: 'text-green-600' },
  { value: 'humanoid', label: 'Humanoid', icon: Users, color: 'text-blue-600' },
  { value: 'avian', label: 'Avian', icon: Bird, color: 'text-sky-600' },
  { value: 'aquatic', label: 'Aquatic', icon: Fish, color: 'text-blue-600' },
  { value: 'insectoid', label: 'Insectoid', icon: Bug, color: 'text-orange-600' },
  { value: 'dragon', label: 'Dragon', icon: Flame, color: 'text-red-600' },
  { value: 'elemental', label: 'Elemental', icon: Zap, color: 'text-purple-600' },
  { value: 'fey', label: 'Fey', icon: Sparkles, color: 'text-pink-600' },
  { value: 'fiend', label: 'Fiend', icon: Flame, color: 'text-red-600' },
  { value: 'celestial', label: 'Celestial', icon: Sun, color: 'text-amber-600' },
  { value: 'undead', label: 'Undead', icon: Skull, color: 'text-gray-600' },
  { value: 'construct', label: 'Construct', icon: Cog, color: 'text-cyan-600' },
  { value: 'other', label: 'Other', icon: Asterisk, color: 'text-gray-600' }
]

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const INTELLIGENCE_LEVELS = ['Mindless', 'Animal', 'Low', 'Average', 'High', 'Genius', 'Cosmic']
const DIET_TYPES = ['Carnivore', 'Herbivore', 'Omnivore', 'Energy', 'Magic', 'Photosynthesis', 'Other']
const HABITATS = ['Forest', 'Plains', 'Mountains', 'Desert', 'Swamp', 'Ocean', 'Underground', 'Urban', 'Arctic', 'Jungle', 'Coastal']
const BIOMES = ['Temperate', 'Tropical', 'Arctic', 'Desert', 'Aquatic', 'Subterranean', 'Aerial', 'Magical', 'Otherworldly']

const TEMPLATES = {
  beast: {
    name: 'Forest Wolf',
    description: 'A pack-hunting predator known for its loyalty and intelligence.',
    type: 'beast',
    size: 'Medium',
    intelligence: 'Animal',
    diet: 'Carnivore',
    lifespan: '12-15 years',
    habitat: ['Forest'],
    biome: ['Temperate'],
    abilities: ['Pack Tactics', 'Keen Hearing', 'Night Vision'],
    temperament: 'Territorial but loyal to pack'
  },
  plant: {
    name: 'Moonbloom Tree',
    description: 'A mystical tree that glows softly under moonlight.',
    type: 'plant',
    size: 'Large',
    intelligence: 'Mindless',
    diet: 'Photosynthesis',
    lifespan: '200-500 years',
    habitat: ['Forest'],
    biome: ['Magical'],
    abilities: ['Bioluminescence', 'Healing Sap'],
    behavior_notes: 'Responds to lunar cycles'
  },
  humanoid: {
    name: 'Mountain Folk',
    description: 'Hardy people adapted to high-altitude living.',
    type: 'humanoid',
    size: 'Medium',
    intelligence: 'Average',
    diet: 'Omnivore',
    lifespan: '80-120 years',
    habitat: ['Mountains'],
    biome: ['Temperate'],
    social_structure: 'Clan-based',
    culture_level: 'Medieval',
    languages: ['Common', 'Mountain Tongue']
  }
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'updated_at', label: 'Recently Updated' },
  { value: 'type', label: 'Type' },
  { value: 'endangered', label: 'Endangered' }
]

// Components
const ChipInput: React.FC<{
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}> = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('')
  
  const addChip = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
    }
  }
  
  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addChip()
    }
  }
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((chip, index) => (
          <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {chip}
            <button
              onClick={() => removeChip(index)}
              className="ml-1 text-orange-500 hover:text-orange-700"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={addChip}
          disabled={!inputValue.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

const SpeciesCard: React.FC<{ species: Species; onEdit: () => void; onDelete: () => void }> = ({ 
  species, onEdit, onDelete 
}) => {
  const typeInfo = SPECIES_TYPES.find(t => t.value === species.attributes.type) || SPECIES_TYPES[0]
  const TypeIcon = typeInfo.icon
  
  return (
    <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{species.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeInfo.label}
                </Badge>
                {species.attributes.size && (
                  <Badge variant="outline" className="text-xs">
                    {species.attributes.size}
                  </Badge>
                )}
                {species.attributes.endangered && (
                  <Badge variant="destructive" className="text-xs">
                    Endangered
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {species.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {species.description}
          </p>
        )}
        
        <div className="space-y-2 text-xs">
          {species.attributes.intelligence && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intelligence:</span>
              <span>{species.attributes.intelligence}</span>
            </div>
          )}
          {species.attributes.diet && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diet:</span>
              <span>{species.attributes.diet}</span>
            </div>
          )}
          {species.attributes.lifespan && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lifespan:</span>
              <span>{species.attributes.lifespan}</span>
            </div>
          )}
        </div>
        
        {species.attributes.abilities && species.attributes.abilities.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">Abilities</div>
            <div className="flex flex-wrap gap-1">
              {species.attributes.abilities.slice(0, 3).map((ability, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {ability}
                </Badge>
              ))}
              {species.attributes.abilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{species.attributes.abilities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const EmptyState: React.FC<{ onCreateFirst: () => void }> = ({ onCreateFirst }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Zap className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No species yet</h3>
    <p className="text-muted-foreground mb-6">
      The flora and fauna of your world can add a lot to a story. Create them here.
    </p>
    <Button onClick={onCreateFirst} className="bg-orange-500 hover:bg-orange-600">
      <Plus className="w-4 h-4 mr-2" />
      Create First Species
    </Button>
  </div>
)

export default function SpeciesPanel({ projectId, selectedElement, onSpeciesChange, onClearSelection }: SpeciesPanelProps) {
  // State
  const [species, setSpecies] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [habitatFilter, setHabitatFilter] = useState<string>('all')
  const [dietFilter, setDietFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('updated_at')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  
  const supabase = createSupabaseClient()
  
  // Computed
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    species.forEach(s => s.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [species])
  
  const filteredSpecies = useMemo(() => {
    let filtered = species.filter(s => {
      // Search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!s.name.toLowerCase().includes(searchLower) && 
            !s.description.toLowerCase().includes(searchLower) &&
            !s.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false
        }
      }
      
      // Type filter
      if (typeFilter !== 'all' && s.attributes.type !== typeFilter) {
        return false
      }
      
      // Habitat filter
      if (habitatFilter !== 'all' && 
          (!s.attributes.habitat || !s.attributes.habitat.includes(habitatFilter))) {
        return false
      }
      
      // Diet filter
      if (dietFilter !== 'all' && s.attributes.diet !== dietFilter) {
        return false
      }
      
      // Tag filter
      if (tagFilter.length > 0 && !tagFilter.some(tag => s.tags.includes(tag))) {
        return false
      }
      
      return true
    })
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'type':
          return (a.attributes.type || '').localeCompare(b.attributes.type || '')
        case 'endangered':
          if (a.attributes.endangered && !b.attributes.endangered) return -1
          if (!a.attributes.endangered && b.attributes.endangered) return 1
          return 0
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
    
    return filtered
  }, [species, searchTerm, typeFilter, habitatFilter, dietFilter, tagFilter, sortBy])
  
  // Effects
  useEffect(() => {
    loadSpecies()
  }, [projectId])
  
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'species') {
      setEditingSpecies(selectedElement)
      setActiveTab('overview')
      setShowCreateDialog(true)
      setIsCreating(false)
    }
  }, [selectedElement])
  
  useEffect(() => {
    // Load view preference
    const saved = localStorage.getItem('species-view-mode')
    if (saved === 'list' || saved === 'grid') {
      setViewMode(saved)
    }
  }, [])
  
  useEffect(() => {
    // Save view preference
    localStorage.setItem('species-view-mode', viewMode)
  }, [viewMode])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCreateDialog) return
      
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleCreateNew()
      } else if (e.key === '/' && e.target === document.body) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showCreateDialog])
  
  // Functions
  const loadSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'species')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setSpecies(data || [])
    } catch (error) {
      console.error('Error loading species:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateNew = () => {
    setEditingSpecies({
      id: '',
      project_id: projectId,
      category: 'species',
      name: '',
      description: '',
      tags: [],
      attributes: {},
      created_at: '',
      updated_at: ''
    })
    setIsCreating(true)
    setActiveTab('overview')
    setShowCreateDialog(true)
    onClearSelection?.()
  }
  
  const handleUseTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey]
    setEditingSpecies({
      id: '',
      project_id: projectId,
      category: 'species',
      name: template.name,
      description: template.description,
      tags: [],
      attributes: { ...template },
      created_at: '',
      updated_at: ''
    })
    setIsCreating(true)
    setActiveTab('overview')
    setShowCreateDialog(true)
    onClearSelection?.()
  }
  
  const handleSave = async () => {
    if (!editingSpecies || !editingSpecies.name.trim()) {
      return
    }
    
    try {
      const speciesData = {
        project_id: projectId,
        category: 'species' as const,
        name: editingSpecies.name,
        description: editingSpecies.description,
        attributes: editingSpecies.attributes,
        tags: editingSpecies.tags
      }
      
      if (isCreating) {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(speciesData)
          .select()
          .single()
        
        if (error) throw error
        setSpecies(prev => [data, ...prev])
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...speciesData, updated_at: new Date().toISOString() })
          .eq('id', editingSpecies.id)
          .select()
          .single()
        
        if (error) throw error
        setSpecies(prev => prev.map(s => s.id === editingSpecies.id ? data : s))
      }
      
      setShowCreateDialog(false)
      setEditingSpecies(null)
      setIsCreating(false)
      onSpeciesChange?.()
    } catch (error) {
      console.error('Error saving species:', error)
    }
  }
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setSpecies(prev => prev.filter(s => s.id !== id))
      onSpeciesChange?.()
    } catch (error) {
      console.error('Error deleting species:', error)
    }
  }
  
  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setEditingSpecies(null)
    setIsCreating(false)
    onClearSelection?.()
  }
  
  const updateSpeciesAttribute = (key: string, value: any) => {
    if (!editingSpecies) return
    setEditingSpecies({
      ...editingSpecies,
      attributes: {
        ...editingSpecies.attributes,
        [key]: value
      }
    })
  }
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading species...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Species & Races
            </h1>
            <p className="text-sm text-muted-foreground">
              The flora and fauna of your world can add a lot to a story. Create them here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Use Template
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border shadow-lg">
                <DropdownMenuItem onClick={() => handleUseTemplate('beast')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Fauna (Beast)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUseTemplate('plant')}>
                  <Leaf className="w-4 h-4 mr-2" />
                  Flora (Plant)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUseTemplate('humanoid')}>
                  <Users className="w-4 h-4 mr-2" />
                  Sapient Race
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleCreateNew} size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              New Species
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search species... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filters */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                <SelectItem value="all">All Types</SelectItem>
                {SPECIES_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={habitatFilter} onValueChange={setHabitatFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Habitat" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                <SelectItem value="all">All Habitats</SelectItem>
                {HABITATS.map(habitat => (
                  <SelectItem key={habitat} value={habitat}>
                    {habitat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dietFilter} onValueChange={setDietFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Diet" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                <SelectItem value="all">All Diets</SelectItem>
                {DIET_TYPES.map(diet => (
                  <SelectItem key={diet} value={diet}>
                    {diet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg">
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* View Toggle */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Import/Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border shadow-lg">
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Import JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-6 md:px-8 py-6 overflow-auto">
        {filteredSpecies.length === 0 ? (
          <EmptyState onCreateFirst={handleCreateNew} />
        ) : (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : 
            "space-y-4"
          }>
            {filteredSpecies.map(s => (
              <SpeciesCard
                key={s.id}
                species={s}
                onEdit={() => {
                  setEditingSpecies(s)
                  setIsCreating(false)
                  setActiveTab('overview')
                  setShowCreateDialog(true)
                }}
                onDelete={() => setShowConfirmDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl md:max-w-5xl h-[90vh] flex flex-col bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New Species' : `Edit ${editingSpecies?.name}`}
            </DialogTitle>
            <DialogDescription>
              {isCreating ? 'Define a new species for your world.' : 'Modify the details of this species.'}
            </DialogDescription>
          </DialogHeader>
          
          {editingSpecies && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="sticky top-0 z-10 bg-white border-b">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="biology">Biology</TabsTrigger>
                <TabsTrigger value="habitat">Habitat</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                {(editingSpecies.attributes.type === 'humanoid' || 
                  (editingSpecies.attributes.intelligence && ['High', 'Genius', 'Cosmic'].includes(editingSpecies.attributes.intelligence))) && (
                  <TabsTrigger value="culture">Culture</TabsTrigger>
                )}
                <TabsTrigger value="relations">Relations</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto py-4">
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={editingSpecies.name}
                        onChange={(e) => setEditingSpecies({ ...editingSpecies, name: e.target.value })}
                        placeholder="Species name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select 
                        value={editingSpecies.attributes.type || ''} 
                        onValueChange={(value) => updateSpeciesAttribute('type', value)}
                      >
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
                    <Textarea
                      id="description"
                      value={editingSpecies.description}
                      onChange={(e) => setEditingSpecies({ ...editingSpecies, description: e.target.value })}
                      placeholder="Describe this species..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <ChipInput
                      value={editingSpecies.tags}
                      onChange={(value: string[]) => setEditingSpecies({ ...editingSpecies, tags: value })}
                      placeholder="Add tags..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="biology" className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Size</Label>
                      <Select 
                        value={editingSpecies.attributes.size || ''} 
                        onValueChange={(value) => updateSpeciesAttribute('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg">
                          {SIZES.map(size => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Intelligence</Label>
                      <Select 
                        value={editingSpecies.attributes.intelligence || ''} 
                        onValueChange={(value) => updateSpeciesAttribute('intelligence', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg">
                          {INTELLIGENCE_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Diet</Label>
                      <Select 
                        value={editingSpecies.attributes.diet || ''} 
                        onValueChange={(value) => updateSpeciesAttribute('diet', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg">
                          {DIET_TYPES.map(diet => (
                            <SelectItem key={diet} value={diet}>
                              {diet}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Lifespan</Label>
                      <Input
                        value={editingSpecies.attributes.lifespan || ''}
                        onChange={(e) => updateSpeciesAttribute('lifespan', e.target.value)}
                        placeholder="e.g., 80 years, immortal"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingSpecies.attributes.endangered || false}
                        onCheckedChange={(checked) => updateSpeciesAttribute('endangered', checked)}
                      />
                      <Label>Endangered species</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Physical Traits</Label>
                    <ChipInput
                      value={editingSpecies.attributes.physical_traits || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('physical_traits', value)}
                      placeholder="Add physical traits..."
                    />
                  </div>
                  
                  <div>
                    <Label>Abilities</Label>
                    <ChipInput
                      value={editingSpecies.attributes.abilities || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('abilities', value)}
                      placeholder="Add abilities..."
                    />
                  </div>
                  
                  <div>
                    <Label>Weaknesses</Label>
                    <ChipInput
                      value={editingSpecies.attributes.weaknesses || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('weaknesses', value)}
                      placeholder="Add weaknesses..."
                    />
                  </div>
                  
                  <div>
                    <Label>Anatomy</Label>
                    <Textarea
                      value={editingSpecies.attributes.anatomy || ''}
                      onChange={(e) => updateSpeciesAttribute('anatomy', e.target.value)}
                      placeholder="Describe the anatomy..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="habitat" className="space-y-6">
                  <div>
                    <Label>Habitat</Label>
                    <ChipInput
                      value={editingSpecies.attributes.habitat || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('habitat', value)}
                      placeholder="Add habitats..."
                    />
                  </div>
                  
                  <div>
                    <Label>Biome</Label>
                    <ChipInput
                      value={editingSpecies.attributes.biome || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('biome', value)}
                      placeholder="Add biomes..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="behavior" className="space-y-6">
                  <div>
                    <Label>Temperament</Label>
                    <Input
                      value={editingSpecies.attributes.temperament || ''}
                      onChange={(e) => updateSpeciesAttribute('temperament', e.target.value)}
                      placeholder="e.g., Aggressive, Docile, Territorial"
                    />
                  </div>
                  
                  <div>
                    <Label>Reproduction</Label>
                    <Input
                      value={editingSpecies.attributes.reproduction || ''}
                      onChange={(e) => updateSpeciesAttribute('reproduction', e.target.value)}
                      placeholder="e.g., Sexual, Asexual, Spores"
                    />
                  </div>
                  
                  <div>
                    <Label>Lifecycle</Label>
                    <Input
                      value={editingSpecies.attributes.lifecycle || ''}
                      onChange={(e) => updateSpeciesAttribute('lifecycle', e.target.value)}
                      placeholder="e.g., Egg → Larva → Adult"
                    />
                  </div>
                  
                  <div>
                    <Label>Behavior Notes</Label>
                    <Textarea
                      value={editingSpecies.attributes.behavior_notes || ''}
                      onChange={(e) => updateSpeciesAttribute('behavior_notes', e.target.value)}
                      placeholder="Additional behavioral information..."
                      rows={4}
                    />
                  </div>
                </TabsContent>
                
                {(editingSpecies.attributes.type === 'humanoid' || 
                  (editingSpecies.attributes.intelligence && ['High', 'Genius', 'Cosmic'].includes(editingSpecies.attributes.intelligence))) && (
                  <TabsContent value="culture" className="space-y-6">
                    <div>
                      <Label>Social Structure</Label>
                      <Input
                        value={editingSpecies.attributes.social_structure || ''}
                        onChange={(e) => updateSpeciesAttribute('social_structure', e.target.value)}
                        placeholder="e.g., Tribal, Hierarchical, Democratic"
                      />
                    </div>
                    
                    <div>
                      <Label>Culture Level</Label>
                      <Input
                        value={editingSpecies.attributes.culture_level || ''}
                        onChange={(e) => updateSpeciesAttribute('culture_level', e.target.value)}
                        placeholder="e.g., Stone Age, Medieval, Modern"
                      />
                    </div>
                    
                    <div>
                      <Label>Languages</Label>
                      <ChipInput
                        value={editingSpecies.attributes.languages || []}
                        onChange={(value: string[]) => updateSpeciesAttribute('languages', value)}
                        placeholder="Add languages..."
                      />
                    </div>
                  </TabsContent>
                )}
                
                <TabsContent value="relations" className="space-y-6">
                  <div>
                    <Label>Predators</Label>
                    <ChipInput
                      value={editingSpecies.attributes.predators || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('predators', value)}
                      placeholder="What hunts this species..."
                    />
                  </div>
                  
                  <div>
                    <Label>Prey</Label>
                    <ChipInput
                      value={editingSpecies.attributes.prey || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('prey', value)}
                      placeholder="What this species hunts..."
                    />
                  </div>
                  
                  <div>
                    <Label>Symbiotic Relationships</Label>
                    <ChipInput
                      value={editingSpecies.attributes.symbiosis || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('symbiosis', value)}
                      placeholder="Mutualistic relationships..."
                    />
                  </div>
                  
                  <div>
                    <Label>Rivals</Label>
                    <ChipInput
                      value={editingSpecies.attributes.rivals || []}
                      onChange={(value: string[]) => updateSpeciesAttribute('rivals', value)}
                      placeholder="Competing species..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="variants" className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    Define subspecies or regional variants of this species.
                  </div>
                  
                  {(editingSpecies.attributes.variants || []).map((variant, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...(editingSpecies.attributes.variants || [])]
                            newVariants[index] = { ...variant, name: e.target.value }
                            updateSpeciesAttribute('variants', newVariants)
                          }}
                          placeholder="Variant name"
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newVariants = editingSpecies.attributes.variants?.filter((_, i) => i !== index) || []
                            updateSpeciesAttribute('variants', newVariants)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={variant.notes || ''}
                        onChange={(e) => {
                          const newVariants = [...(editingSpecies.attributes.variants || [])]
                          newVariants[index] = { ...variant, notes: e.target.value }
                          updateSpeciesAttribute('variants', newVariants)
                        }}
                        placeholder="Variant notes and differences..."
                        rows={2}
                      />
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newVariants = [...(editingSpecies.attributes.variants || []), { name: '', notes: '' }]
                      updateSpeciesAttribute('variants', newVariants)
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>
                </TabsContent>
                
                <TabsContent value="gallery" className="space-y-6">
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Image gallery coming soon</p>
                    <Button variant="outline" disabled>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Images
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    Add custom fields specific to your world's needs.
                  </div>
                  
                  {(editingSpecies.attributes.custom_fields || []).map((field, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={field.key}
                            onChange={(e) => {
                              const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                              newFields[index] = { ...field, key: e.target.value }
                              updateSpeciesAttribute('custom_fields', newFields)
                            }}
                            placeholder="Field name"
                            className="flex-1"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value: any) => {
                              const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                              newFields[index] = { ...field, type: value }
                              updateSpeciesAttribute('custom_fields', newFields)
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-lg">
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="multiline">Multiline</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="chip-list">Chip List</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFields = editingSpecies.attributes.custom_fields?.filter((_, i) => i !== index) || []
                            updateSpeciesAttribute('custom_fields', newFields)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {field.type === 'text' && (
                        <Input
                          value={field.value || ''}
                          onChange={(e) => {
                            const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                            newFields[index] = { ...field, value: e.target.value }
                            updateSpeciesAttribute('custom_fields', newFields)
                          }}
                          placeholder="Value"
                        />
                      )}
                      
                      {field.type === 'multiline' && (
                        <Textarea
                          value={field.value || ''}
                          onChange={(e) => {
                            const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                            newFields[index] = { ...field, value: e.target.value }
                            updateSpeciesAttribute('custom_fields', newFields)
                          }}
                          placeholder="Value"
                          rows={2}
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <Input
                          type="number"
                          value={field.value || ''}
                          onChange={(e) => {
                            const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                            newFields[index] = { ...field, value: e.target.value }
                            updateSpeciesAttribute('custom_fields', newFields)
                          }}
                          placeholder="Value"
                        />
                      )}
                      
                      {field.type === 'chip-list' && (
                        <ChipInput
                          value={field.value || []}
                          onChange={(value: string[]) => {
                            const newFields = [...(editingSpecies.attributes.custom_fields || [])]
                            newFields[index] = { ...field, value }
                            updateSpeciesAttribute('custom_fields', newFields)
                          }}
                          placeholder="Add values..."
                        />
                      )}
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newFields = [...(editingSpecies.attributes.custom_fields || []), 
                        { key: '', type: 'text' as const, value: '' }]
                      updateSpeciesAttribute('custom_fields', newFields)
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Field
                  </Button>
                </TabsContent>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!editingSpecies.name.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isCreating ? 'Create Species' : 'Save Changes'}
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={!!showConfirmDelete} onOpenChange={() => setShowConfirmDelete(null)}>
        <DialogContent className="bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Species</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this species? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (showConfirmDelete) {
                  handleDelete(showConfirmDelete)
                  setShowConfirmDelete(null)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}