'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Edit3, Trash2, X, MoreVertical, Filter, Grid3x3, List, Download, Upload, 
  Zap, Heart, Leaf, Bird, Fish, Bug, Users, Skull, Flame, Sparkles, Cog, Sun, Asterisk,
  Clock, Lightbulb, Copy, FileDown, Keyboard, Eye, ChevronDown, ArrowLeft, Brain, MapPin,
  Globe, Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'

interface Species {
  id: string
  name: string
  description: string
  attributes: {
    type: string
    size: string
    intelligence: string
    diet: string
    tags: string[]
    physical_traits: string[]
    abilities: string[]
    weaknesses: string[]
    habitat: string[]
    biome: string[]
    climate: string
    behavior: string
    communication: string
    temperament: string
    languages: string[]
    customs: string
    beliefs: string
    technology: string
    predators: string[]
    prey: string[]
    symbiosis: string[]
    rivals: string[]
    variants: string[]
    custom_fields: Array<{
      key: string
      type: 'text' | 'multiline' | 'number' | 'chip-list' | 'select'
      value: string | string[]
    }>
  }
  project_id: string
  category: string
  created_at: string
  updated_at: string
  tags: string[]
}

interface SpeciesPanelProps {
  projectId: string
  selectedElement?: Species | null
  onSpeciesChange?: () => void
  onClearSelection?: () => void
}

// Constants
const SPECIES_TYPES = [
  { value: 'humanoid', label: 'Humanoid', icon: Users, color: 'text-blue-600' },
  { value: 'beast', label: 'Beast', icon: Heart, color: 'text-red-600' },
  { value: 'plant', label: 'Plant', icon: Leaf, color: 'text-green-600' },
  { value: 'dragon', label: 'Dragon', icon: Flame, color: 'text-orange-600' },
  { value: 'elemental', label: 'Elemental', icon: Sparkles, color: 'text-purple-600' },
  { value: 'fey', label: 'Fey', icon: Sun, color: 'text-yellow-600' },
  { value: 'fiend', label: 'Fiend', icon: Skull, color: 'text-gray-600' },
  { value: 'celestial', label: 'Celestial', icon: Lightbulb, color: 'text-amber-600' },
  { value: 'undead', label: 'Undead', icon: Skull, color: 'text-gray-700' },
  { value: 'aberration', label: 'Aberration', icon: Eye, color: 'text-indigo-600' },
  { value: 'construct', label: 'Construct', icon: Cog, color: 'text-cyan-600' },
  { value: 'ooze', label: 'Ooze', icon: Asterisk, color: 'text-pink-600' }
]

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const INTELLIGENCE_LEVELS = ['Mindless', 'Animal', 'Low', 'Average', 'High', 'Genius', 'Cosmic']
const DIET_TYPES = ['Carnivore', 'Herbivore', 'Omnivore', 'Energy', 'Magic', 'Photosynthesis', 'Other']
const HABITATS = ['Forest', 'Plains', 'Mountains', 'Desert', 'Swamp', 'Ocean', 'Underground', 'Urban', 'Arctic', 'Jungle', 'Coastal']
const BIOMES = ['Temperate Forest', 'Tropical Rainforest', 'Grassland', 'Desert', 'Tundra', 'Taiga', 'Wetlands', 'Marine', 'Freshwater']
const CLIMATES = ['Tropical', 'Arid', 'Temperate', 'Continental', 'Polar', 'Mediterranean', 'Oceanic', 'Subarctic']
const TEMPERAMENTS = ['Peaceful', 'Aggressive', 'Neutral', 'Curious', 'Territorial', 'Social', 'Solitary', 'Unpredictable']
const COMMUNICATION_TYPES = ['Verbal', 'Telepathic', 'Gestural', 'Chemical', 'Visual', 'Musical', 'Empathic', 'None']
const TECHNOLOGY_LEVELS = ['Stone Age', 'Bronze Age', 'Iron Age', 'Medieval', 'Renaissance', 'Industrial', 'Modern', 'Advanced', 'Magical']

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'A-Z' },
  { value: 'name_desc', label: 'Z-A' },
  { value: 'created_at', label: 'Recently Added' },
  { value: 'updated_at', label: 'Recently Updated' }
]

// Helper functions for rich text
const renderFormattedText = (htmlContent: string) => {
  if (!htmlContent) return null
  
  return (
    <div 
      className="prose prose-sm max-w-none leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

const stripHtmlTags = (html: string) => {
  if (!html) return ''
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  return (tempDiv.textContent || tempDiv.innerText || '').trim()
}

// Helper components
const ChipInput = ({ value, onChange, placeholder }: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}) => {
  const [inputValue, setInputValue] = useState('')

  const addChip = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()])
      setInputValue('')
    }
  }

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map((chip, index) => (
          <Badge key={index} className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 rounded-xl px-3 py-1.5 font-medium hover:from-orange-200 hover:to-red-200 transition-all duration-200">
            {chip}
            <button
              onClick={() => removeChip(index)}
              className="ml-2 text-orange-600 hover:text-orange-800 transition-colors duration-200"
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
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addChip()
            }
          }}
          className="flex-1 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        <Button 
          onClick={addChip} 
          variant="outline" 
          size="sm"
          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 rounded-xl px-4 font-medium transition-all duration-200"
        >
          Add
        </Button>
      </div>
    </div>
  )
}

const SpeciesCard = ({ species, onEdit, onDelete, viewMode = 'grid' }: {
  species: Species
  onEdit: () => void
  onDelete: () => void
  viewMode?: 'grid' | 'list'
}) => {
  const speciesType = SPECIES_TYPES.find(t => t.value === species.attributes.type)
  const Icon = speciesType?.icon || Heart

  if (viewMode === 'list') {
    return (
      <Card className="rounded-lg border bg-card hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${speciesType?.color || 'text-orange-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-card-foreground truncate">
                    {species.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {speciesType?.label || 'Unknown'} • {species.attributes.size || 'Medium'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {stripHtmlTags(species.description) || 'No description'}
                </p>
              </div>
              {species.tags && species.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {species.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {species.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{species.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${speciesType?.color || 'text-orange-600'}`} />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-card-foreground">
                {species.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {speciesType?.label || 'Unknown'} • {species.attributes.size || 'Medium'}
              </p>
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
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {stripHtmlTags(species.description)}
          </p>
        )}
        
        {/* Additional info badges */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {species.attributes.intelligence && (
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {species.attributes.intelligence}
            </span>
          )}
          {species.attributes.habitat && species.attributes.habitat.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {species.attributes.habitat.slice(0, 2).join(', ')}
              {species.attributes.habitat.length > 2 && ` +${species.attributes.habitat.length - 2}`}
            </span>
          )}
        </div>
      </CardHeader>
      
      {species.tags && species.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {species.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                {tag}
              </Badge>
            ))}
            {species.tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{species.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

const EmptyState = ({ onCreateFirst }: { onCreateFirst: () => void }) => (
  <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
    <CardContent className="flex flex-col items-center justify-center py-20 px-6">
      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-12 rounded-3xl mb-8 border border-orange-100">
        <Heart className="w-24 h-24 text-orange-400 mx-auto" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No species yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-10 leading-relaxed text-lg">
        The flora and fauna of your world can add depth and richness to your story. Start by creating your first species.
      </p>
      <Button 
        onClick={onCreateFirst}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-10 py-4 rounded-2xl font-medium text-lg"
      >
        <Plus className="w-6 h-6 mr-3" />
        Create Your First Species
      </Button>
    </CardContent>
  </Card>
)

export default function SpeciesPanel({ 
  projectId, 
  selectedElement, 
  onSpeciesChange, 
  onClearSelection 
}: SpeciesPanelProps) {
  const [species, setSpecies] = useState<Species[]>([])  
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [habitatFilter, setHabitatFilter] = useState('all')
  const [dietFilter, setDietFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name_asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createSupabaseClient()

  // Load species
  useEffect(() => {
    loadSpecies()
  }, [projectId])

  // Handle selected element
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'species') {
      setEditingSpecies(selectedElement)
      setActiveTab('overview')
      setIsCreating(false)
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

  // Filter and sort species
  const filteredSpecies = useMemo(() => {
    let filtered = species.filter(s => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!s.name.toLowerCase().includes(searchLower) && 
            !s.description.toLowerCase().includes(searchLower) &&
            !s.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false
        }
      }
      
      if (typeFilter !== 'all' && s.attributes.type !== typeFilter) return false
      if (habitatFilter !== 'all' && 
          (!s.attributes.habitat || !s.attributes.habitat.includes(habitatFilter))) return false
      if (dietFilter !== 'all' && s.attributes.diet !== dietFilter) return false
      
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [species, searchTerm, typeFilter, habitatFilter, dietFilter, sortBy])

  // Create handlers
  const handleCreateNew = () => {
    setEditingSpecies({
      id: '',
      name: 'New Species',
      description: '',
      attributes: {
        type: 'humanoid',
        size: 'Medium',
        intelligence: 'Average',
        diet: 'Omnivore',
        tags: [],
        physical_traits: [],
        abilities: [],
        weaknesses: [],
        habitat: [],
        biome: [],
        climate: '',
        behavior: '',
        communication: '',
        temperament: '',
        languages: [],
        customs: '',
        beliefs: '',
        technology: '',
        predators: [],
        prey: [],
        symbiosis: [],
        rivals: [],
        variants: [],
        custom_fields: []
      },
      project_id: projectId,
      category: 'species',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: []
    })
    setIsCreating(true)
    setActiveTab('overview')
  }

  const handleEdit = (speciesItem: Species) => {
    setEditingSpecies(speciesItem)
    setIsCreating(false)
    setActiveTab('overview')
  }

  const handleSave = async () => {
    if (!editingSpecies) return
    
    setSaving(true)
    setError(null)
    
    try {
      const speciesData = {
        project_id: projectId,
        category: 'species' as const,
        name: editingSpecies.name,
        description: editingSpecies.description,
        attributes: editingSpecies.attributes,
        tags: editingSpecies.tags || []
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
      
      resetForm()
      onSpeciesChange?.()
    } catch (error) {
      console.error('Error saving species:', error)
      setError('Failed to save species')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const speciesItem = species.find(s => s.id === id)
    const speciesName = speciesItem?.name || 'this species'
    
    if (!confirm(`Are you sure you want to delete "${speciesName}"? This action cannot be undone.`)) {
      return
    }
    
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

  const resetForm = () => {
    setEditingSpecies(null)
    setIsCreating(false)
    setActiveTab('overview')
    setError(null)
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

  // Loading state
  if (loading) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
          
          {/* Search and filters skeleton */}
          <div className="flex gap-4">
            <div className="h-10 bg-gray-100 rounded-lg flex-1 max-w-md animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-40 animate-pulse"></div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded mt-3"></div>
                  <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Editing view
  if (isCreating || editingSpecies) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        {/* Modern Header with gradient background */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl px-3 py-2 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back to Species</span>
                </Button>
                <div className="w-px h-8 bg-gray-200" />
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {isCreating ? 'Create New Species' : `Edit ${editingSpecies?.name}`}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    {isCreating ? 'Define a new species for your world.' : 'Modify the details of this species.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl px-4 py-2 font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!editingSpecies?.name.trim() || saving}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2 font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    isCreating ? 'Create Species' : 'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {editingSpecies && (
          <>
            {error && (
              <div className="mx-8 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-2 text-red-700">
                  <X className="w-4 h-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}
            
            <div className="px-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="mb-8 bg-gray-100/60 p-1.5 rounded-2xl border border-gray-200/50">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="biology" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Biology
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habitat" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Habitat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="behavior" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Behavior
                  </TabsTrigger>
                  <TabsTrigger 
                    value="culture" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Culture
                  </TabsTrigger>
                  <TabsTrigger 
                    value="relations" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                  >
                    Relations
                  </TabsTrigger>
                </TabsList>            <TabsContent value="overview" className="space-y-8 pb-8">
              {/* Primary Information Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Species Name *</Label>
                      <Input
                        id="name"
                        value={editingSpecies.name}
                        onChange={(e) => setEditingSpecies({ ...editingSpecies, name: e.target.value })}
                        placeholder="Enter species name..."
                        className="font-medium border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700">Primary Type</Label>
                      <Select
                        value={editingSpecies.attributes.type}
                        onValueChange={(value) => updateSpeciesAttribute('type', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select primary type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {SPECIES_TYPES.map(type => {
                            const Icon = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value} className="rounded-lg mx-1 my-0.5">
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-4 h-4 ${type.color}`} />
                                  <span className="font-medium">{type.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={editingSpecies.description}
                      onChange={(e) => setEditingSpecies({ ...editingSpecies, description: e.target.value })}
                      placeholder="Provide a detailed description of this species, including appearance, characteristics, and notable features..."
                      rows={5}
                      className="resize-none border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Tags Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    Classification & Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Classification Tags</Label>
                        <p className="text-xs text-gray-500 mt-1">Tags help categorize and search for this species</p>
                      </div>
                      <ChipInput
                        value={editingSpecies.tags || []}
                        onChange={(value: string[]) => setEditingSpecies({ ...editingSpecies, tags: value })}
                        placeholder="Add classification tag..."
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">General Tags</Label>
                        <p className="text-xs text-gray-500 mt-1">Additional descriptive tags</p>
                      </div>
                      <ChipInput
                        value={editingSpecies.attributes.tags || []}
                        onChange={(value: string[]) => updateSpeciesAttribute('tags', value)}
                        placeholder="Add descriptive tag..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Stats Preview */}
              <Card className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    Quick Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/50 rounded-xl border border-white/20">
                      <div className="text-xs font-medium text-gray-600 mb-1">Size</div>
                      <div className="font-semibold text-gray-900">{editingSpecies.attributes.size || 'Not set'}</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-xl border border-white/20">
                      <div className="text-xs font-medium text-gray-600 mb-1">Intelligence</div>
                      <div className="font-semibold text-gray-900">{editingSpecies.attributes.intelligence || 'Not set'}</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-xl border border-white/20">
                      <div className="text-xs font-medium text-gray-600 mb-1">Diet</div>
                      <div className="font-semibold text-gray-900">{editingSpecies.attributes.diet || 'Not set'}</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-xl border border-white/20">
                      <div className="text-xs font-medium text-gray-600 mb-1">Type</div>
                      <div className="font-semibold text-gray-900">{SPECIES_TYPES.find(t => t.value === editingSpecies.attributes.type)?.label || 'Not set'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="biology" className="space-y-8 pb-8">
              {/* Basic Biology Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Leaf className="w-3 h-3 text-white" />
                    </div>
                    Basic Biology
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-medium text-gray-700">Size</Label>
                      <Select
                        value={editingSpecies.attributes.size}
                        onValueChange={(value) => updateSpeciesAttribute('size', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {SIZES.map(size => (
                            <SelectItem key={size} value={size} className="rounded-lg mx-1 my-0.5">{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intelligence" className="text-sm font-medium text-gray-700">Intelligence</Label>
                      <Select
                        value={editingSpecies.attributes.intelligence}
                        onValueChange={(value) => updateSpeciesAttribute('intelligence', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select intelligence" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {INTELLIGENCE_LEVELS.map(level => (
                            <SelectItem key={level} value={level} className="rounded-lg mx-1 my-0.5">{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diet" className="text-sm font-medium text-gray-700">Diet</Label>
                      <Select
                        value={editingSpecies.attributes.diet}
                        onValueChange={(value) => updateSpeciesAttribute('diet', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {DIET_TYPES.map(diet => (
                            <SelectItem key={diet} value={diet} className="rounded-lg mx-1 my-0.5">{diet}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Traits & Abilities Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    Traits & Abilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Physical Traits</Label>
                        <ChipInput
                          value={editingSpecies.attributes.physical_traits || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('physical_traits', value)}
                          placeholder="Add physical trait..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Abilities</Label>
                        <ChipInput
                          value={editingSpecies.attributes.abilities || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('abilities', value)}
                          placeholder="Add ability..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Weaknesses</Label>
                        <ChipInput
                          value={editingSpecies.attributes.weaknesses || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('weaknesses', value)}
                          placeholder="Add weakness..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Variants</Label>
                        <ChipInput
                          value={editingSpecies.attributes.variants || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('variants', value)}
                          placeholder="Add variant..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="habitat" className="space-y-8 pb-8">
              {/* Environmental Conditions Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    Environmental Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="climate" className="text-sm font-medium text-gray-700">Preferred Climate</Label>
                      <Select
                        value={editingSpecies.attributes.climate}
                        onValueChange={(value) => updateSpeciesAttribute('climate', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select climate" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {CLIMATES.map(climate => (
                            <SelectItem key={climate} value={climate} className="rounded-lg mx-1 my-0.5">{climate}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Habitats & Biomes Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    Habitats & Biomes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Primary Habitats</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {HABITATS.map(habitat => (
                        <label key={habitat} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-all duration-200">
                          <Checkbox
                            checked={(editingSpecies.attributes.habitat || []).includes(habitat)}
                            onCheckedChange={(checked) => {
                              const currentHabitats = editingSpecies.attributes.habitat || []
                              if (checked) {
                                updateSpeciesAttribute('habitat', [...currentHabitats, habitat])
                              } else {
                                updateSpeciesAttribute('habitat', currentHabitats.filter(h => h !== habitat))
                              }
                            }}
                            className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{habitat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Biomes</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {BIOMES.map(biome => (
                        <label key={biome} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-all duration-200">
                          <Checkbox
                            checked={(editingSpecies.attributes.biome || []).includes(biome)}
                            onCheckedChange={(checked) => {
                              const currentBiomes = editingSpecies.attributes.biome || []
                              if (checked) {
                                updateSpeciesAttribute('biome', [...currentBiomes, biome])
                              } else {
                                updateSpeciesAttribute('biome', currentBiomes.filter(b => b !== biome))
                              }
                            }}
                            className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{biome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="behavior" className="space-y-8 pb-8">
              {/* Social Behavior Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    Social Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="temperament" className="text-sm font-medium text-gray-700">Temperament</Label>
                      <Select
                        value={editingSpecies.attributes.temperament}
                        onValueChange={(value) => updateSpeciesAttribute('temperament', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select temperament" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {TEMPERAMENTS.map(temp => (
                            <SelectItem key={temp} value={temp} className="rounded-lg mx-1 my-0.5">{temp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="communication" className="text-sm font-medium text-gray-700">Communication</Label>
                      <Select
                        value={editingSpecies.attributes.communication}
                        onValueChange={(value) => updateSpeciesAttribute('communication', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select communication" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {COMMUNICATION_TYPES.map(comm => (
                            <SelectItem key={comm} value={comm} className="rounded-lg mx-1 my-0.5">{comm}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Behavioral Notes Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    Behavioral Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="behavior" className="text-sm font-medium text-gray-700">Behavioral Notes</Label>
                    <Textarea
                      id="behavior"
                      value={editingSpecies.attributes.behavior}
                      onChange={(e) => updateSpeciesAttribute('behavior', e.target.value)}
                      placeholder="Describe behavioral patterns, social structure, mating habits, daily routines, and other notable behaviors..."
                      rows={6}
                      className="resize-none border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="culture" className="space-y-8 pb-8">
              {/* Technology & Language Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Cog className="w-3 h-3 text-white" />
                    </div>
                    Technology & Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="technology" className="text-sm font-medium text-gray-700">Technology Level</Label>
                      <Select
                        value={editingSpecies.attributes.technology}
                        onValueChange={(value) => updateSpeciesAttribute('technology', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select technology level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                          {TECHNOLOGY_LEVELS.map(tech => (
                            <SelectItem key={tech} value={tech} className="rounded-lg mx-1 my-0.5">{tech}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Languages</Label>
                      <ChipInput
                        value={editingSpecies.attributes.languages || []}
                        onChange={(value: string[]) => updateSpeciesAttribute('languages', value)}
                        placeholder="Add language..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Cultural Practices Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                    Cultural Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customs" className="text-sm font-medium text-gray-700">Customs & Traditions</Label>
                      <Textarea
                        id="customs"
                        value={editingSpecies.attributes.customs}
                        onChange={(e) => updateSpeciesAttribute('customs', e.target.value)}
                        placeholder="Describe cultural practices, rituals, ceremonies, festivals, and traditional customs..."
                        rows={4}
                        className="resize-none border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="beliefs" className="text-sm font-medium text-gray-700">Beliefs & Religion</Label>
                      <Textarea
                        id="beliefs"
                        value={editingSpecies.attributes.beliefs}
                        onChange={(e) => updateSpeciesAttribute('beliefs', e.target.value)}
                        placeholder="Describe religious beliefs, mythology, spiritual practices, and worldview..."
                        rows={4}
                        className="resize-none border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="relations" className="space-y-8 pb-8">
              {/* Species Interactions Card */}
              <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    Species Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Predators</Label>
                        <p className="text-xs text-gray-500 mb-2">Species that hunt or prey upon this species</p>
                        <ChipInput
                          value={editingSpecies.attributes.predators || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('predators', value)}
                          placeholder="Add predator..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Prey</Label>
                        <p className="text-xs text-gray-500 mb-2">Species that this species hunts or feeds upon</p>
                        <ChipInput
                          value={editingSpecies.attributes.prey || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('prey', value)}
                          placeholder="Add prey..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Symbiotic Relationships</Label>
                        <p className="text-xs text-gray-500 mb-2">Species with mutually beneficial relationships</p>
                        <ChipInput
                          value={editingSpecies.attributes.symbiosis || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('symbiosis', value)}
                          placeholder="Add symbiotic partner..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Rivals</Label>
                        <p className="text-xs text-gray-500 mb-2">Species in competition or conflict</p>
                        <ChipInput
                          value={editingSpecies.attributes.rivals || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('rivals', value)}
                          placeholder="Add rival species..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ecosystem Role Card */}
              <Card className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Leaf className="w-3 h-3 text-white" />
                    </div>
                    Ecosystem Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Understanding how this species fits into the broader ecosystem helps create realistic food webs and environmental interactions. Consider their role in nutrient cycling, population control, and habitat modification.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/60 rounded-xl border border-white/40">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="font-semibold text-green-700 mb-1">Producers</div>
                      <div className="text-xs text-gray-600">Plants, algae, autotrophs</div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-xl border border-white/40">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="font-semibold text-blue-700 mb-1">Consumers</div>
                      <div className="text-xs text-gray-600">Herbivores, carnivores, omnivores</div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-xl border border-white/40">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="font-semibold text-purple-700 mb-1">Decomposers</div>
                      <div className="text-xs text-gray-600">Fungi, bacteria, detritivores</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
      {/* Modern Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div>Species & Races</div>
                  <p className="text-base font-normal text-gray-600 mt-1">Manage the flora, fauna, and sapient species of your world</p>
                </div>
              </h1>
            </div>
            
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl px-8 py-3 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Species
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Modern Search and Filters */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search species by name, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                {/* Enhanced Filters */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                    <SelectItem value="all" className="rounded-lg mx-1 my-0.5">All Types</SelectItem>
                    {SPECIES_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value} className="rounded-lg mx-1 my-0.5">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${type.color}`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}\n                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value} className="rounded-lg mx-1 my-0.5">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Enhanced View Toggle */}
                <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'hover:bg-white/60 text-gray-600'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'hover:bg-white/60 text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {species.length === 0 ? (
          <EmptyState onCreateFirst={handleCreateNew} />
        ) : filteredSpecies.length === 0 ? (
          <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
            <CardContent className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No species found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your search criteria or filters</p>
              <Button 
                onClick={() => { 
                  setSearchTerm(''); 
                  setTypeFilter('all'); 
                  setHabitatFilter('all'); 
                  setDietFilter('all'); 
                }} 
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 rounded-xl px-6 py-2 font-medium"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredSpecies.map(s => (
              <SpeciesCard
                key={s.id}
                species={s}
                viewMode={viewMode}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}