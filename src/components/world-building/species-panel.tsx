'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Edit3, X, MoreVertical, Filter, Grid3x3, List, Download, Upload, 
  Zap, Heart, Leaf, Bird, Fish, Bug, Users, Skull, Flame, Sparkles, Cog, Sun, Asterisk,
  Clock, Lightbulb, Copy, FileDown, Keyboard, Eye, ChevronDown, ArrowLeft, Brain, MapPin,
  Globe, Crown, Check, Code, FileText, Table, Image as ImageIcon, Camera, PencilLine,
  TreePine, ChartBar, Network
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((chip, index) => (
          <Badge key={index} className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 rounded-lg px-2 py-1 text-xs font-medium hover:from-orange-200 hover:to-red-200 transition-all duration-200">
            {chip}
            <button
              onClick={() => removeChip(index)}
              className="ml-1.5 text-orange-600 hover:text-orange-800 transition-colors duration-200"
            >
              <X className="w-2.5 h-2.5" />
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
          className="flex-1 border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        <Button 
          onClick={addChip} 
          variant="outline" 
          size="sm"
          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 rounded-lg px-3 text-sm font-medium transition-all duration-200"
        >
          Add
        </Button>
      </div>
    </div>
  )
}

const SpeciesCard = ({ species, onEdit, viewMode = 'grid' }: {
  species: Species
  onEdit: () => void
  viewMode?: 'grid' | 'list'
}) => {
  const speciesType = SPECIES_TYPES.find(t => t.value === species.attributes.type)
  const Icon = speciesType?.icon || Heart

  if (viewMode === 'list') {
    return (
      <Card 
        className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:border-orange-300 hover:bg-gradient-to-r hover:from-white hover:to-orange-50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer" 
        onClick={(e) => {
          // Prevent click if clicking on dropdown menu
          if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
          onEdit();
        }}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* Enhanced Icon with Gradient Background */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center border border-orange-100 group-hover:shadow-md transition-shadow">
                  <Icon className={`w-6 h-6 ${speciesType?.color || 'text-orange-600'}`} />
                </div>
                {species.attributes.intelligence === 'Sapient' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-orange-700 transition-colors">
                    {species.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200 text-xs font-medium px-2 py-1"
                    >
                      {speciesType?.label || 'Unknown'}
                    </Badge>
                    {species.attributes.size && (
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                        {species.attributes.size}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  {stripHtmlTags(species.description) || 'No description provided'}
                </p>
                
                {/* Enhanced Info Row */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {species.attributes.intelligence && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 border border-purple-100">
                      <Brain className="w-3 h-3 text-purple-600" />
                      <span className="font-medium text-purple-700">{species.attributes.intelligence}</span>
                    </div>
                  )}
                  {species.attributes.habitat && species.attributes.habitat.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-100">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-700">
                        {species.attributes.habitat.slice(0, 2).join(', ')}
                        {species.attributes.habitat.length > 2 && ` +${species.attributes.habitat.length - 2}`}
                      </span>
                    </div>
                  )}
                  {species.attributes.temperament && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-100">
                      <Heart className="w-3 h-3 text-blue-600" />
                      <span className="font-medium text-blue-700">{species.attributes.temperament}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Tags */}
              {species.tags && species.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                  {species.tags.slice(0, 2).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200 text-xs font-medium hover:from-orange-100 hover:to-red-100 transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {species.tags.length > 2 && (
                    <Badge 
                      key="more-tags"
                      variant="outline" 
                      className="text-xs text-gray-500 border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      +{species.tags.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="dropdown-trigger h-9 w-9 p-0 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-xl rounded-lg">
                <DropdownMenuItem onClick={onEdit} className="rounded-md hover:bg-orange-50 transition-colors">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Species
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md hover:bg-orange-50 transition-colors">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Enhanced Grid View
  return (
    <Card 
      className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:border-orange-300 hover:bg-gradient-to-br hover:from-white hover:to-orange-50 transition-all duration-300 transform hover:-translate-y-3 hover:scale-[1.08] overflow-hidden cursor-pointer"
      onClick={(e) => {
        // Prevent click if clicking on dropdown menu
        if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
        onEdit();
      }}
    >
      {/* Header with Gradient and Glow Effect */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4 group-hover:bg-gradient-to-r group-hover:from-orange-50 group-hover:to-red-50 group-hover:shadow-inner group-hover:border-orange-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center border border-orange-100 group-hover:shadow-md transition-shadow">
                <Icon className={`w-5 h-5 ${speciesType?.color || 'text-orange-600'}`} />
              </div>
              {species.attributes.intelligence === 'Sapient' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Crown className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-orange-700 transition-colors">
                {species.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200 text-xs font-medium"
                >
                  {speciesType?.label || 'Unknown'}
                </Badge>
                {species.attributes.size && (
                  <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                    {species.attributes.size}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="dropdown-trigger h-8 w-8 p-0 rounded-lg hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-xl rounded-lg">
              <DropdownMenuItem onClick={onEdit} className="rounded-md hover:bg-orange-50 transition-colors">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Species
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md hover:bg-orange-50 transition-colors">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {species.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {stripHtmlTags(species.description)}
          </p>
        )}
      </div>
      
      {/* Body Content with Shimmer Effect */}
      <CardContent className="p-4 space-y-4 group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-orange-25 transition-all duration-300">
        {/* Enhanced Attribute Cards */}
        <div className="grid grid-cols-1 gap-2">
          {species.attributes.intelligence && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 group-hover:from-purple-100 group-hover:to-indigo-100 group-hover:border-purple-200 group-hover:shadow-sm transition-all duration-200">
              <Brain className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
              <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">Intelligence:</span>
              <span className="text-sm text-purple-600 group-hover:text-purple-700">{species.attributes.intelligence}</span>
            </div>
          )}
          
          {species.attributes.habitat && species.attributes.habitat.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 group-hover:from-green-100 group-hover:to-emerald-100 group-hover:border-green-200 group-hover:shadow-sm transition-all duration-200">
              <MapPin className="w-4 h-4 text-green-600 group-hover:text-green-700" />
              <span className="text-sm font-medium text-green-700 group-hover:text-green-800">Habitat:</span>
              <span className="text-sm text-green-600 group-hover:text-green-700">
                {species.attributes.habitat.slice(0, 2).join(', ')}
                {species.attributes.habitat.length > 2 && ` +${species.attributes.habitat.length - 2}`}
              </span>
            </div>
          )}
          
          {species.attributes.temperament && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 group-hover:from-blue-100 group-hover:to-cyan-100 group-hover:border-blue-200 group-hover:shadow-sm transition-all duration-200">
              <Heart className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
              <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">Temperament:</span>
              <span className="text-sm text-blue-600 group-hover:text-blue-700">{species.attributes.temperament}</span>
            </div>
          )}
        </div>
        
        {/* Enhanced Tags Section */}
        {species.tags && species.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {species.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200 text-xs font-medium hover:from-orange-100 hover:to-red-100 transition-colors"
                >
                  #{tag}
                </Badge>
              ))}
              {species.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-gray-500 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  +{species.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const EmptyState = ({ onCreateFirst }: { onCreateFirst: () => void }) => (
  <Card className="rounded-xl border border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50">
    <CardContent className="flex flex-col items-center justify-center py-16 px-6">
      <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-10 rounded-2xl mb-6 border border-orange-100 shadow-inner">
        <Heart className="w-20 h-20 text-orange-400 mx-auto" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Species Created Yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-8 leading-relaxed">
        Bring your world to life with diverse flora, fauna, and sapient species. Each creature adds depth and richness to your story.
      </p>
      <Button 
        onClick={onCreateFirst}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 rounded-xl font-medium"
      >
        <Plus className="w-5 h-5 mr-2" />
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

  // Export state and handler function
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'csv' | 'docx'>('json')
  const [exportingSpecies, setExportingSpecies] = useState<Species | null>(null)

  function handleExport(species: Species) {
    setExportingSpecies(species)
    setShowExportModal(true)
  }

  async function handleExportDownload() {
    if (!exportingSpecies) return

    let dataStr: string
    let fileName: string
    let mimeType: string

    switch (exportFormat) {
      case 'json':
        dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportingSpecies, null, 2))
        fileName = `${exportingSpecies.name || 'species'}.json`
        break
      case 'txt':
        // Create a text format with organized sections
        const textContent = [
          `Species: ${exportingSpecies.name}`,
          `Type: ${exportingSpecies.attributes.type}`,
          `Size: ${exportingSpecies.attributes.size}`,
          `Intelligence: ${exportingSpecies.attributes.intelligence}`,
          `Description: ${exportingSpecies.description}`,
          '',
          'Physical Traits:',
          ...exportingSpecies.attributes.physical_traits.map(trait => `- ${trait}`),
          '',
          'Abilities:',
          ...exportingSpecies.attributes.abilities.map(ability => `- ${ability}`),
          '',
          'Habitat: ' + exportingSpecies.attributes.habitat.join(', '),
          'Climate: ' + exportingSpecies.attributes.climate,
          '',
          'Cultural Information:',
          `Technology Level: ${exportingSpecies.attributes.technology}`,
          `Languages: ${exportingSpecies.attributes.languages.join(', ')}`,
          `Customs: ${exportingSpecies.attributes.customs}`,
          `Beliefs: ${exportingSpecies.attributes.beliefs}`,
          '',
          'Tags: ' + exportingSpecies.tags.join(', ')
        ].join('\n')
        dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent)
        fileName = `${exportingSpecies.name || 'species'}.txt`
        break
      case 'csv':
        // Create a CSV with core attributes
        const csvContent = [
          'Name,Type,Size,Intelligence,Diet,Climate,Temperament,Communication',
          `"${exportingSpecies.name}","${exportingSpecies.attributes.type}","${exportingSpecies.attributes.size}","${exportingSpecies.attributes.intelligence}","${exportingSpecies.attributes.diet}","${exportingSpecies.attributes.climate}","${exportingSpecies.attributes.temperament}","${exportingSpecies.attributes.communication}"`
        ].join('\n')
        dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
        fileName = `${exportingSpecies.name || 'species'}.csv`
        mimeType = 'text/csv'
        break
      case 'docx':
        try {
          const response = await fetch('/api/export-species-docx', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportingSpecies)
          })
          
          if (!response.ok) throw new Error('Failed to generate Word document')
          
          const blob = await response.blob()
          dataStr = URL.createObjectURL(blob)
          fileName = `${exportingSpecies.name || 'species'}.docx`
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } catch (error) {
          console.error('Error generating Word document:', error)
          // Show error toast or notification here
          return
        }
        break
    }

    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    setShowExportModal(false)
  }

  // Export Modal Component
  const ExportModal = () => (
    <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
      <DialogContent className="bg-white rounded-xl border-0 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Export Species Data</DialogTitle>
          <DialogDescription className="text-gray-600">
            Choose your preferred format for exporting the species data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'json', label: 'JSON', icon: Code, description: 'Complete data in JSON format' },
              { value: 'docx', label: 'Word', icon: FileText, description: 'Microsoft Word document' },
              { value: 'txt', label: 'Text', icon: FileText, description: 'Plain text document' },
              { value: 'csv', label: 'CSV', icon: Table, description: 'Spreadsheet-compatible format' }
            ].map(format => (
              <button
                key={format.value}
                onClick={() => setExportFormat(format.value as 'json' | 'txt' | 'csv')}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                  exportFormat === format.value 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <format.icon className={`w-6 h-6 ${
                  exportFormat === format.value ? 'text-orange-500' : 'text-gray-500'
                }`} />
                <span className={`text-sm font-medium ${
                  exportFormat === format.value ? 'text-orange-700' : 'text-gray-700'
                }`}>
                  {format.label}
                </span>
                {exportFormat === format.value && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Format Details</div>
            <p className="text-sm text-gray-600">
              {exportFormat === 'json' && 'Complete species data in structured JSON format. Best for importing or programmatic use.'}
              {exportFormat === 'docx' && 'Professional Word document with formatted sections, headings, and styling. Perfect for documentation and sharing.'}
              {exportFormat === 'txt' && 'Simple plain text document with organized sections. Ideal for quick reference or reading.'}
              {exportFormat === 'csv' && 'Core attributes in CSV format. Perfect for spreadsheet analysis or bulk editing.'}
            </p>
          </div>
        </div>
        
        <DialogFooter className="border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowExportModal(false)}
            className="border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportDownload}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

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
        <ExportModal />
        {/* Compact Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl px-3 py-1.5 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </Button>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {isCreating ? 'Create New Species' : `Edit ${editingSpecies?.name}`}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {isCreating ? 'Define a new species for your world.' : 'Modify the details of this species.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingSpecies && !isCreating && (
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-colors mr-2"
                    onClick={() => handleExport(editingSpecies)}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl px-3 py-1.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!editingSpecies?.name.trim() || saving}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-1.5 text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
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
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <X className="w-4 h-4" />
                  <span className="font-medium text-sm">Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}
            
            <div className="px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="mb-6 bg-gray-100/60 p-1 rounded-xl border border-gray-200/50">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="biology" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Biology
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habitat" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Habitat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="behavior" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Behavior
                  </TabsTrigger>
                  <TabsTrigger 
                    value="culture" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Culture
                  </TabsTrigger>
                  <TabsTrigger 
                    value="relations" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    Relations
                  </TabsTrigger>
                </TabsList>            <TabsContent value="overview" className="space-y-6 pb-6">
              {/* Primary Information Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Heart className="w-2.5 h-2.5 text-white" />
                    </div>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Species Name *</Label>
                      <Input
                        id="name"
                        value={editingSpecies.name}
                        onChange={(e) => setEditingSpecies({ ...editingSpecies, name: e.target.value })}
                        placeholder="Enter species name..."
                        className="font-medium border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700">Primary Type</Label>
                      <Select
                        value={editingSpecies.attributes.type}
                        onValueChange={(value) => updateSpeciesAttribute('type', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select primary type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {SPECIES_TYPES.map(type => {
                            const Icon = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value} className="rounded-md mx-1 my-0.5">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-3.5 h-3.5 ${type.color}`} />
                                  <span className="font-medium text-sm">{type.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={editingSpecies.description}
                      onChange={(e) => setEditingSpecies({ ...editingSpecies, description: e.target.value })}
                      placeholder="Provide a detailed description of this species, including appearance, characteristics, and notable features..."
                      rows={3}
                      className="resize-none border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Tags and Quick Stats in one row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Tags Card */}
                <div className="lg:col-span-2">
                  <Card className="rounded-xl border border-gray-200 shadow-sm bg-white h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Classification</Label>
                          <ChipInput
                            value={editingSpecies.tags || []}
                            onChange={(value: string[]) => setEditingSpecies({ ...editingSpecies, tags: value })}
                            placeholder="Add tag..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Descriptive</Label>
                          <ChipInput
                            value={editingSpecies.attributes.tags || []}
                            onChange={(value: string[]) => updateSpeciesAttribute('tags', value)}
                            placeholder="Add tag..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Quick Stats Preview */}
                <Card className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-white" />
                      </div>
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center p-2 bg-white/50 rounded-lg border border-white/20">
                        <div className="text-xs font-medium text-gray-600 mb-1">Size</div>
                        <div className="font-semibold text-gray-900 text-sm">{editingSpecies.attributes.size || 'Not set'}</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded-lg border border-white/20">
                        <div className="text-xs font-medium text-gray-600 mb-1">Intelligence</div>
                        <div className="font-semibold text-gray-900 text-sm">{editingSpecies.attributes.intelligence || 'Not set'}</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded-lg border border-white/20">
                        <div className="text-xs font-medium text-gray-600 mb-1">Diet</div>
                        <div className="font-semibold text-gray-900 text-sm">{editingSpecies.attributes.diet || 'Not set'}</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded-lg border border-white/20">
                        <div className="text-xs font-medium text-gray-600 mb-1">Type</div>
                        <div className="font-semibold text-gray-900 text-sm">{SPECIES_TYPES.find(t => t.value === editingSpecies.attributes.type)?.label || 'Not set'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="biology" className="space-y-4 pb-6">
              {/* Basic Biology Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Leaf className="w-2.5 h-2.5 text-white" />
                    </div>
                    Basic Biology
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="size" className="text-sm font-medium text-gray-700">Size</Label>
                      <Select
                        value={editingSpecies.attributes.size}
                        onValueChange={(value) => updateSpeciesAttribute('size', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {SIZES.map(size => (
                            <SelectItem key={size} value={size} className="rounded-md mx-1 my-0.5">{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="intelligence" className="text-sm font-medium text-gray-700">Intelligence</Label>
                      <Select
                        value={editingSpecies.attributes.intelligence}
                        onValueChange={(value) => updateSpeciesAttribute('intelligence', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select intelligence" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {INTELLIGENCE_LEVELS.map(level => (
                            <SelectItem key={level} value={level} className="rounded-md mx-1 my-0.5">{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="diet" className="text-sm font-medium text-gray-700">Diet</Label>
                      <Select
                        value={editingSpecies.attributes.diet}
                        onValueChange={(value) => updateSpeciesAttribute('diet', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {DIET_TYPES.map(diet => (
                            <SelectItem key={diet} value={diet} className="rounded-md mx-1 my-0.5">{diet}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Traits & Abilities Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-white" />
                    </div>
                    Traits & Abilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Physical Traits</Label>
                        <ChipInput
                          value={editingSpecies.attributes.physical_traits || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('physical_traits', value)}
                          placeholder="Add physical trait..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Abilities</Label>
                        <ChipInput
                          value={editingSpecies.attributes.abilities || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('abilities', value)}
                          placeholder="Add ability..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Weaknesses</Label>
                        <ChipInput
                          value={editingSpecies.attributes.weaknesses || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('weaknesses', value)}
                          placeholder="Add weakness..."
                        />
                      </div>
                      
                      <div className="space-y-2">
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
            
            <TabsContent value="habitat" className="space-y-4 pb-6">
              {/* Environmental Conditions & Habitats Combined */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Globe className="w-2.5 h-2.5 text-white" />
                    </div>
                    Environmental Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="climate" className="text-sm font-medium text-gray-700">Preferred Climate</Label>
                    <Select
                      value={editingSpecies.attributes.climate}
                      onValueChange={(value) => updateSpeciesAttribute('climate', value)}
                    >
                      <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Select climate" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                        {CLIMATES.map(climate => (
                          <SelectItem key={climate} value={climate} className="rounded-md mx-1 my-0.5">{climate}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Primary Habitats</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {HABITATS.map(habitat => (
                          <label key={habitat} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white rounded-md transition-all duration-200">
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
                            <span className="text-xs font-medium text-gray-700">{habitat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Biomes</Label>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {BIOMES.map(biome => (
                          <label key={biome} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white rounded-md transition-all duration-200">
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
                            <span className="text-xs font-medium text-gray-700">{biome}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="behavior" className="space-y-4 pb-6">
              {/* Social Behavior Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </div>
                    Social Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="temperament" className="text-sm font-medium text-gray-700">Temperament</Label>
                      <Select
                        value={editingSpecies.attributes.temperament}
                        onValueChange={(value) => updateSpeciesAttribute('temperament', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select temperament" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {TEMPERAMENTS.map(temp => (
                            <SelectItem key={temp} value={temp} className="rounded-md mx-1 my-0.5">{temp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="communication" className="text-sm font-medium text-gray-700">Communication</Label>
                      <Select
                        value={editingSpecies.attributes.communication}
                        onValueChange={(value) => updateSpeciesAttribute('communication', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select communication" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {COMMUNICATION_TYPES.map(comm => (
                            <SelectItem key={comm} value={comm} className="rounded-md mx-1 my-0.5">{comm}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="behavior" className="text-sm font-medium text-gray-700">Behavioral Notes</Label>
                    <Textarea
                      id="behavior"
                      value={editingSpecies.attributes.behavior}
                      onChange={(e) => updateSpeciesAttribute('behavior', e.target.value)}
                      placeholder="Describe behavioral patterns, social structure, mating habits, daily routines, and other notable behaviors..."
                      rows={4}
                      className="resize-none border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="culture" className="space-y-4 pb-6">
              {/* Combined Culture Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Cog className="w-2.5 h-2.5 text-white" />
                    </div>
                    Cultural Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="technology" className="text-sm font-medium text-gray-700">Technology Level</Label>
                      <Select
                        value={editingSpecies.attributes.technology}
                        onValueChange={(value) => updateSpeciesAttribute('technology', value)}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select technology level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg">
                          {TECHNOLOGY_LEVELS.map(tech => (
                            <SelectItem key={tech} value={tech} className="rounded-md mx-1 my-0.5">{tech}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Languages</Label>
                      <ChipInput
                        value={editingSpecies.attributes.languages || []}
                        onChange={(value: string[]) => updateSpeciesAttribute('languages', value)}
                        placeholder="Add language..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="customs" className="text-sm font-medium text-gray-700">Customs & Traditions</Label>
                      <Textarea
                        id="customs"
                        value={editingSpecies.attributes.customs}
                        onChange={(e) => updateSpeciesAttribute('customs', e.target.value)}
                        placeholder="Describe cultural practices, rituals, ceremonies, festivals, and traditional customs..."
                        rows={3}
                        className="resize-none border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="beliefs" className="text-sm font-medium text-gray-700">Beliefs & Religion</Label>
                      <Textarea
                        id="beliefs"
                        value={editingSpecies.attributes.beliefs}
                        onChange={(e) => updateSpeciesAttribute('beliefs', e.target.value)}
                        placeholder="Describe religious beliefs, mythology, spiritual practices, and worldview..."
                        rows={3}
                        className="resize-none border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="relations" className="space-y-4 pb-6">
              {/* Species Interactions Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                      <Heart className="w-2.5 h-2.5 text-white" />
                    </div>
                    Species Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Predators</Label>
                        <p className="text-xs text-gray-500">Species that hunt or prey upon this species</p>
                        <ChipInput
                          value={editingSpecies.attributes.predators || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('predators', value)}
                          placeholder="Add predator..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Prey</Label>
                        <p className="text-xs text-gray-500">Species that this species hunts or feeds upon</p>
                        <ChipInput
                          value={editingSpecies.attributes.prey || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('prey', value)}
                          placeholder="Add prey..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Symbiotic Relationships</Label>
                        <p className="text-xs text-gray-500">Species with mutually beneficial relationships</p>
                        <ChipInput
                          value={editingSpecies.attributes.symbiosis || []}
                          onChange={(value: string[]) => updateSpeciesAttribute('symbiosis', value)}
                          placeholder="Add symbiotic partner..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Rivals</Label>
                        <p className="text-xs text-gray-500">Species in competition or conflict</p>
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
              <Card className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Leaf className="w-2.5 h-2.5 text-white" />
                    </div>
                    Ecosystem Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Understanding how this species fits into the broader ecosystem helps create realistic food webs and environmental interactions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="font-semibold text-green-700 mb-1 text-sm">Producers</div>
                      <div className="text-xs text-gray-600">Plants, algae</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="font-semibold text-blue-700 mb-1 text-sm">Consumers</div>
                      <div className="text-xs text-gray-600">Herbivores, carnivores</div>
                    </div>
                    <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="font-semibold text-purple-700 mb-1 text-sm">Decomposers</div>
                      <div className="text-xs text-gray-600">Fungi, bacteria</div>
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
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Species & Races</h1>
                <p className="text-sm text-gray-600">Manage the flora, fauna, and sapient species of your world</p>
              </div>
            </div>
            
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2.5 font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Species
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Compact Search and Filters */}
        <Card className="rounded-xl border border-gray-200 shadow-sm bg-white mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search species by name, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
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
                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md px-2.5 py-1.5 text-sm transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'hover:bg-white/60 text-gray-600'
                    }`}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-md px-2.5 py-1.5 text-sm transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'hover:bg-white/60 text-gray-600'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
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
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-3'
          }>
            {filteredSpecies.map(s => (
              <SpeciesCard
                key={s.id}
                species={s}
                viewMode={viewMode}
                onEdit={() => handleEdit(s)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}