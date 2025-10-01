'use client'

// TEMP: Add Species type to resolve errors (replace with real type or import as needed)
type Species = any;

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
import { STORAGE_BUCKETS } from '@/lib/storage-config'

interface SpeciesImage {
  id: string;
  url: string;
  caption: string;
  category: 'portrait' | 'anatomy' | 'habitat' | 'artifact' | 'other';
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface SpeciesPanelProps {
  projectId: string;
  selectedElement?: Species | null;
  onSpeciesChange?: () => void;
  onClearSelection?: () => void;
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

// Image Upload Component
const ImageUpload = ({ 
  images,
  onImagesChange,
  category = 'other',
  speciesId
}: {
  images: SpeciesImage[];
  onImagesChange: (images: SpeciesImage[]) => void;
  category?: SpeciesImage['category'];
  speciesId: string;
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const newImages: SpeciesImage[] = []
    const supabase = createSupabaseClient()
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      try {
        // Generate a unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`
        const filePath = `${speciesId}/${category}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKETS.SPECIES_IMAGES)
          .upload(filePath, file)

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.SPECIES_IMAGES)
          .getPublicUrl(filePath)

        newImages.push({
          id: Math.random().toString(36).substring(7),
          url: publicUrl,
          caption: '',
          category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: []
        })
      } catch (error) {
        console.error('Error uploading image:', error)
        // You might want to show an error toast here
      }
    }

    onImagesChange([...images, ...newImages])
  }

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id)
    onImagesChange(updatedImages)
  }

  return (
    <div>
      {/* Render images */}
      {images.map((image: SpeciesImage) => (
        <div key={image.id}>
          <img src={image.url} alt={image.caption} />
          <button onClick={() => removeImage(image.id)}>Remove</button>
        </div>
      ))}
      {/* File input and drag/drop area */}
      <input type="file" multiple onChange={handleFileChange} />
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{ border: dragActive ? '2px solid orange' : '2px dashed gray', padding: '20px', marginTop: '10px' }}
      >
        Drag and drop images here
      </div>
    </div>
  );
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
        className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-orange-400/50 transition-all duration-300 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-orange-500/0 before:via-orange-500/5 before:to-red-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300" 
        onClick={(e) => {
          // Prevent click if clicking on dropdown menu
          if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
          onEdit();
        }}
      >
        <CardContent className="p-3.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Enhanced Icon with Gradient Background and Glow Effect */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-orange-50 via-orange-50 to-red-50 flex items-center justify-center border border-orange-200/60 group-hover:border-orange-300 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <Icon className={`w-5 h-5 ${speciesType?.color || 'text-orange-600'} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                {species.attributes.intelligence === 'Sapient' && (
                  <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ring-2 ring-white">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-orange-700 transition-colors duration-300">
                    {species.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/80 text-xs font-medium px-2 py-0.5 group-hover:border-orange-200 group-hover:from-orange-50 group-hover:to-orange-50/50 transition-all duration-300"
                    >
                      {speciesType?.label || 'Unknown'}
                    </Badge>
                    {species.attributes.size && (
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 px-2 py-0.5 group-hover:border-orange-300 group-hover:text-orange-700 transition-all duration-300">
                        {species.attributes.size}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-1 mb-1.5 leading-snug group-hover:text-gray-700 transition-colors duration-300">
                  {stripHtmlTags(species.description) || 'No description provided'}
                </p>
                
                {/* Enhanced Info Row with Icons */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {species.attributes.diet && (
                    <span className="flex items-center gap-1.5 group-hover:text-orange-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 group-hover:bg-orange-500 group-hover:shadow-sm group-hover:shadow-orange-300 transition-all duration-300"></span>
                      <span className="font-medium">{species.attributes.diet}</span>
                    </span>
                  )}
                  {species.attributes.habitat && (
                    <span className="flex items-center gap-1.5 group-hover:text-green-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:bg-green-500 group-hover:shadow-sm group-hover:shadow-green-300 transition-all duration-300"></span>
                      <span className="font-medium">{species.attributes.habitat}</span>
                    </span>
                  )}
                  {species.attributes.population?.total && (
                    <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-600 transition-colors duration-300">
                      <Users className="w-3 h-3" />
                      <span className="font-medium">{species.attributes.population.total.toLocaleString()}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Enhanced Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-shrink-0 opacity-60 group-hover:opacity-100 text-gray-400 hover:text-orange-600 hover:bg-orange-50/80 rounded-lg transition-all duration-300 group-hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        
        {/* Animated Bottom Border on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
      </Card>
    )
  }
  
  // Grid view (default)
  return (
    <Card 
      className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-orange-400/50 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-500/0 before:via-orange-500/5 before:to-red-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300" 
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
        onEdit();
      }}
    >
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          {/* Enhanced Icon with Gradient Background and Glow Effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 via-orange-50 to-red-50 flex items-center justify-center border border-orange-200/60 group-hover:border-orange-300 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
              <Icon className={`w-6 h-6 ${speciesType?.color || 'text-orange-600'} group-hover:scale-110 transition-transform duration-300`} />
            </div>
            {species.attributes.intelligence === 'Sapient' && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 ring-2 ring-white">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-orange-700 transition-colors duration-300 mb-1.5">
              {species.name}
            </h3>
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/80 text-xs font-medium px-2 py-0.5 group-hover:border-orange-200 group-hover:from-orange-50 group-hover:to-orange-50/50 transition-all duration-300"
            >
              {speciesType?.label || 'Unknown'}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {stripHtmlTags(species.description) || 'No description provided'}
        </p>
        
        {/* Enhanced Info Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {species.attributes.size && (
              <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 px-2 py-0.5 group-hover:border-orange-300 group-hover:text-orange-700 transition-all duration-300">
                {species.attributes.size}
              </Badge>
            )}
            {species.attributes.diet && (
              <span className="flex items-center gap-1 text-gray-500 group-hover:text-orange-600 transition-colors duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 group-hover:bg-orange-500 group-hover:shadow-sm group-hover:shadow-orange-300 transition-all duration-300"></span>
                <span className="font-medium">{species.attributes.diet}</span>
              </span>
            )}
            {species.attributes.population?.total && (
              <span className="flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors duration-300">
                <Users className="w-3 h-3" />
                <span className="font-medium">{species.attributes.population.total.toLocaleString()}</span>
              </span>
            )}
          </div>
          
          {/* Enhanced Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-orange-600 hover:bg-orange-50/80 h-8 w-8 p-0 rounded-lg transition-all duration-300 group-hover:scale-105"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
      
      {/* Animated Bottom Border on Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
    </Card>
  )
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white">
      <CardContent className="text-center py-16">
        <div className="text-gray-400 mb-4">
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
  );
}

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
  const [regionDistribution, setRegionDistribution] = useState<{[key: string]: number}>({})
  const [unallocatedPopulation, setUnallocatedPopulation] = useState(0)

  // Recalculate unallocated population whenever total or region populations change
  useEffect(() => {
    if (!editingSpecies) return;
    const total = editingSpecies.attributes.population?.total || 0;
    const regionDistribution = editingSpecies.attributes.population?.distribution || {};
    const climateDistribution = editingSpecies.attributes.climatePopulation || {};
  const allocatedRegions = Object.values(regionDistribution).reduce((sum, n) => Number(sum) + (Number(n) || 0), 0 as number);
  const allocatedClimates = Object.values(climateDistribution).reduce((sum, n) => Number(sum) + (Number(n) || 0), 0 as number);
  setUnallocatedPopulation(Math.max(0, total - Number(allocatedRegions) - Number(allocatedClimates)));
  }, [editingSpecies?.attributes.population?.total, editingSpecies?.attributes.population?.distribution, editingSpecies?.attributes.climatePopulation]);
  
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
            !s.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))) {
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
        custom_fields: [],
        // New fields with default values
        images: [] as SpeciesImage[],
        population: {
          total: 0,
          distribution: {},
          trend: 'stable'
        },
        geographicRange: {
          regions: [],
          primary: '',
          secondary: []
        },
        climateAdaptation: {},
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
          ...exportingSpecies.attributes.physical_traits.map((trait: string) => `- ${trait}`),
          '',
          'Abilities:',
          ...exportingSpecies.attributes.abilities.map((ability: string) => `- ${ability}`),
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
                <TabsList className="mb-6 bg-gray-100/60 p-1 rounded-xl border border-gray-200/50 flex flex-wrap gap-1">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="gallery" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Gallery
                  </TabsTrigger>
                  <TabsTrigger 
                    value="biology" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    Biology
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habitat" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Habitat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="behavior" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    Behavior
                  </TabsTrigger>
                  <TabsTrigger 
                    value="culture" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Culture
                  </TabsTrigger>
                  <TabsTrigger 
                    value="relations" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Relations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="family-tree" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <TreePine className="w-3.5 h-3.5" />
                    Family Tree
                  </TabsTrigger>
                  <TabsTrigger 
                    value="statistics" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <ChartBar className="w-3.5 h-3.5" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Network className="w-3.5 h-3.5" />
                    Analysis
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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

            <TabsContent value="gallery" className="space-y-4 pb-6">
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <ImageIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                    Images & Visual References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="portrait" className="w-full">
                    <TabsList className="mb-4 inline-flex bg-gray-100/60 p-1 rounded-lg border border-gray-200/50">
                      <TabsTrigger 
                        value="portrait" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      >
                        Portraits
                      </TabsTrigger>
                      <TabsTrigger 
                        value="anatomy" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      >
                        Anatomy
                      </TabsTrigger>
                      <TabsTrigger 
                        value="habitat" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      >
                        Habitat
                      </TabsTrigger>
                      <TabsTrigger 
                        value="artifact" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      >
                        Artifacts
                      </TabsTrigger>
                      <TabsTrigger 
                        value="other" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      >
                        Other
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="portrait">
                      <ImageUpload
                        images={(editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category === 'portrait')}
                        onImagesChange={(images) => {
                          const otherImages = (editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category !== 'portrait')
                          updateSpeciesAttribute('images', [...otherImages, ...images])
                        }}
                        category="portrait"
                        speciesId={editingSpecies.id}
                      />
                    </TabsContent>

                    <TabsContent value="anatomy">
                      <ImageUpload
                        images={(editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category === 'anatomy')}
                        onImagesChange={(images) => {
                          const otherImages = (editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category !== 'anatomy')
                          updateSpeciesAttribute('images', [...otherImages, ...images])
                        }}
                        category="anatomy"
                        speciesId={editingSpecies.id}
                      />
                    </TabsContent>

                    <TabsContent value="habitat">
                      <ImageUpload
                        images={(editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category === 'habitat')}
                        onImagesChange={(images) => {
                          const otherImages = (editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category !== 'habitat')
                          updateSpeciesAttribute('images', [...otherImages, ...images])
                        }}
                        category="habitat"
                        speciesId={editingSpecies.id}
                      />
                    </TabsContent>

                    <TabsContent value="artifact">
                      <ImageUpload
                        images={(editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category === 'artifact')}
                        onImagesChange={(images) => {
                          const otherImages = (editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category !== 'artifact')
                          updateSpeciesAttribute('images', [...otherImages, ...images])
                        }}
                        category="artifact"
                        speciesId={editingSpecies.id}
                      />
                    </TabsContent>

                    <TabsContent value="other">
                      <ImageUpload
                        images={(editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category === 'other')}
                        onImagesChange={(images) => {
                          const otherImages = (editingSpecies.attributes.images || []).filter((img: SpeciesImage) => img.category !== 'other')
                          updateSpeciesAttribute('images', [...otherImages, ...images])
                        }}
                        category="other"
                        speciesId={editingSpecies.id}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                                  updateSpeciesAttribute('habitat', currentHabitats.filter((h: string) => h !== habitat))
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
                                  updateSpeciesAttribute('biome', currentBiomes.filter((b: string) => b !== biome))
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
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
            
            <TabsContent value="family-tree" className="space-y-4 pb-6">
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <TreePine className="w-2.5 h-2.5 text-white" />
                    </div>
                    Species Evolution & Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parent Species Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Parent Species</Label>
                    <Select
                      value={editingSpecies.attributes.parentSpecies || 'none'}
                      onValueChange={(value) => updateSpeciesAttribute('parentSpecies', value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Select parent species" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                        <SelectItem value="none" className="rounded-md mx-1 my-0.5">None (Root Species)</SelectItem>
                        {species
                          .filter(s => s.id !== editingSpecies.id)
                          .map(s => (
                            <SelectItem key={s.id} value={s.id} className="rounded-md mx-1 my-0.5">
                              {s.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Select the species this evolved from or descended from</p>
                  </div>

                  {/* Subspecies Management */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Known Subspecies</Label>
                    <ChipInput
                      value={editingSpecies.attributes.subspecies || []}
                      onChange={(value) => updateSpeciesAttribute('subspecies', value)}
                      placeholder="Add subspecies variant..."
                    />
                    <p className="text-xs text-gray-500">Add known variants or subspecies that evolved from this species</p>
                  </div>

                  {/* Family Tree Visualization */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-sm font-medium text-green-800 mb-3">Evolutionary Tree</div>
                    <div className="relative">
                      {/* Parent */}
                      {editingSpecies.attributes.parentSpecies && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="w-px h-8 bg-gradient-to-b from-transparent to-green-200" />
                        </div>
                      )}
                      
                      {/* Current Species */}
                      <div className="flex justify-center mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-3">
                          <div className="text-sm font-semibold text-gray-900">{editingSpecies.name}</div>
                          <div className="text-xs text-gray-500">{editingSpecies.attributes.type}</div>
                        </div>
                      </div>
                      
                      {/* Subspecies */}
                      {editingSpecies.attributes.subspecies && editingSpecies.attributes.subspecies.length > 0 && (
                        <>
                          <div className="w-px h-8 bg-gradient-to-b from-green-200 to-transparent mx-auto" />
                          <div className="flex flex-wrap justify-center gap-4">
                            {editingSpecies.attributes.subspecies.map((subspecies: string, index: number) => (
                              <div key={index} className="text-center">
                                <div className="w-px h-8 bg-green-200 mx-auto" />
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-green-100 p-2">
                                  <div className="text-sm font-medium text-gray-800">{subspecies}</div>
                                  <div className="text-xs text-gray-500">Subspecies</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4 pb-6">
              {/* Population & Distribution Card */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <ChartBar className="w-2.5 h-2.5 text-white" />
                    </div>
                    Population & Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Population Stats */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Total Population</Label>
                      <Input
                        type="number"
                        value={editingSpecies.attributes.population?.total || 0}
                        min="0"
                        onChange={(e) => {
                          const total = parseInt(e.target.value) || 0;
                          const currentDistribution: Record<string, number> = editingSpecies.attributes.population?.distribution || {};
                          
                          // Calculate unallocated population immediately
                          const allocated = Object.values(currentDistribution).reduce((sum, n) => Number(sum) + (Number(n) || 0), 0 as number);
                          setUnallocatedPopulation(Math.max(0, total - Number(allocated)));
                          
                          // Update total without changing distribution
                          updateSpeciesAttribute('population', {
                            ...editingSpecies.attributes.population,
                            total,
                            distribution: currentDistribution,
                            trend: editingSpecies.attributes.population?.trend || 'stable'
                          });
                        }}
                        className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                      {unallocatedPopulation > 0 ? (
                        <div className="text-sm text-amber-600 mt-1">
                          {unallocatedPopulation.toLocaleString()} unallocated population available
                        </div>
                      ) : unallocatedPopulation === 0 && (editingSpecies.attributes.population?.total || 0) > 0 ? (
                        <div className="text-sm text-green-600 mt-1 font-medium">
                          ✓ All population allocated!
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">Population Trend</Label>
                      <Select
                        value={editingSpecies.attributes.population?.trend || 'stable'}
                        onValueChange={(value: 'increasing' | 'stable' | 'decreasing') => updateSpeciesAttribute('population', {
                          ...editingSpecies.attributes.population,
                          trend: value
                        })}
                      >
                        <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                          <SelectValue placeholder="Select trend" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                          <SelectItem value="increasing" className="rounded-md mx-1 my-0.5">Increasing</SelectItem>
                          <SelectItem value="stable" className="rounded-md mx-1 my-0.5">Stable</SelectItem>
                          <SelectItem value="decreasing" className="rounded-md mx-1 my-0.5">Decreasing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Climate Adaptation Population Tracking */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Climate Adaptation Population</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {CLIMATES.map(climate => (
                        <div key={climate} className="space-y-1.5">
                          <div className="text-xs font-medium text-gray-600 mb-1">{climate}</div>
                          <Input
                            type="number"
                            min="0"
                            max={(editingSpecies.attributes.population?.total || 0) - Object.entries(editingSpecies.attributes.climatePopulation || {}).filter(([key]) => key !== climate).reduce((sum, [, val]) => sum + (Number(val) || 0), 0) + (Number(editingSpecies.attributes.climatePopulation?.[climate]) || 0)}
                            value={editingSpecies.attributes.climatePopulation?.[climate] || 0}
                            onChange={(e) => {
                              const inputValue = parseInt(e.target.value) || 0;
                              const totalPopulation = editingSpecies.attributes.population?.total || 0;
                              
                              // Calculate currently allocated climate population (excluding this field)
                              const currentClimatePopulation = editingSpecies.attributes.climatePopulation || {};
                              const otherAllocated = Object.entries(currentClimatePopulation)
                                .filter(([key]) => key !== climate)
                                .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);
                              
                              // Cap the value to not exceed remaining available population
                              const maxAllowable = Math.max(0, totalPopulation - otherAllocated);
                              const value = Math.min(inputValue, maxAllowable);
                              
                              const newClimatePopulation = {
                                ...editingSpecies.attributes.climatePopulation,
                                [climate]: value
                              };
                              updateSpeciesAttribute('climatePopulation', newClimatePopulation);
                            }}
                            className="border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Allocate population to each climate zone. Unallocated population will update above.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Distribution Analysis */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                      <ChartBar className="w-2.5 h-2.5 text-white" />
                    </div>
                    Climate Distribution Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Climate Distribution Bars */}
                  {(() => {
                    const totalPop = editingSpecies.attributes.population?.total || 0;
                    const climateData = editingSpecies.attributes.climatePopulation || {};
                    const allocatedTotal = Object.values(climateData).reduce((sum, val) => Number(sum) + (Number(val) || 0), 0 as number);
                    
                    return (
                      <div className="space-y-3">
                        {CLIMATES.map(climate => {
                          const value = Number(climateData[climate]) || 0;
                          const percentage = totalPop > 0 ? (value / totalPop) * 100 : 0;
                          
                          return (
                            <div key={climate} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-700">{climate}</span>
                                <span className="text-gray-500">
                                  {value.toLocaleString()} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Summary Stats */}
                        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Total</div>
                              <div className="text-lg font-bold text-purple-700">{totalPop.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Allocated</div>
                              <div className="text-lg font-bold text-pink-700">{Number(allocatedTotal).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Coverage</div>
                              <div className="text-lg font-bold text-indigo-700">
                                {totalPop > 0 ? ((Number(allocatedTotal) / totalPop) * 100).toFixed(0) : 0}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Population Demographics */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </div>
                    Population Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Age Groups */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Age Distribution</Label>
                      <div className="space-y-2">
                        {[
                          { label: 'Young (0-20%)', key: 'young', color: 'from-green-400 to-emerald-400' },
                          { label: 'Adult (20-80%)', key: 'adult', color: 'from-blue-400 to-cyan-400' },
                          { label: 'Elder (80-100%)', key: 'elder', color: 'from-purple-400 to-pink-400' }
                        ].map(({ label, key, color }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingSpecies.attributes.demographics?.[key] || 33}
                              onChange={(e) => {
                                const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                updateSpeciesAttribute('demographics', {
                                  ...editingSpecies.attributes.demographics,
                                  [key]: value
                                });
                              }}
                              className="w-20 text-sm"
                            />
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">{label}</div>
                              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${color} transition-all duration-300`}
                                  style={{ width: `${editingSpecies.attributes.demographics?.[key] || 33}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gender Ratio */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Gender Ratio</Label>
                      <div className="space-y-2">
                        {[
                          { label: 'Male', key: 'male', color: 'from-blue-500 to-indigo-500' },
                          { label: 'Female', key: 'female', color: 'from-pink-500 to-rose-500' },
                          { label: 'Other', key: 'other', color: 'from-purple-500 to-violet-500' }
                        ].map(({ label, key, color }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingSpecies.attributes.genderRatio?.[key] || 33}
                              onChange={(e) => {
                                const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                updateSpeciesAttribute('genderRatio', {
                                  ...editingSpecies.attributes.genderRatio,
                                  [key]: value
                                });
                              }}
                              className="w-20 text-sm"
                            />
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">{label}</div>
                              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${color} transition-all duration-300`}
                                  style={{ width: `${editingSpecies.attributes.genderRatio?.[key] || 33}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Projections */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                    Growth Rate & Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Annual Growth Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editingSpecies.attributes.growthRate || 0}
                        onChange={(e) => updateSpeciesAttribute('growthRate', parseFloat(e.target.value) || 0)}
                        className="border-gray-200 rounded-lg"
                        placeholder="e.g., 2.5 or -1.2"
                      />
                      <p className="text-xs text-gray-500">Positive for growth, negative for decline</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Reproduction Rate</Label>
                      <Select
                        value={editingSpecies.attributes.reproductionRate || 'moderate'}
                        onValueChange={(value) => updateSpeciesAttribute('reproductionRate', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                          <SelectItem value="very-low" className="rounded-md mx-1 my-0.5">Very Low (1-2 offspring)</SelectItem>
                          <SelectItem value="low" className="rounded-md mx-1 my-0.5">Low (2-4 offspring)</SelectItem>
                          <SelectItem value="moderate" className="rounded-md mx-1 my-0.5">Moderate (4-8 offspring)</SelectItem>
                          <SelectItem value="high" className="rounded-md mx-1 my-0.5">High (8-15 offspring)</SelectItem>
                          <SelectItem value="very-high" className="rounded-md mx-1 my-0.5">Very High (15+ offspring)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Population Projections */}
                  {(() => {
                    const currentPop = editingSpecies.attributes.population?.total || 0;
                    const growthRate = editingSpecies.attributes.growthRate || 0;
                    const trend = editingSpecies.attributes.population?.trend || 'stable';
                    
                    // Calculate projections for 5, 10, 20 years
                    const projections = [5, 10, 20].map(years => {
                      const projection = currentPop * Math.pow(1 + (growthRate / 100), years);
                      return { years, population: Math.round(projection) };
                    });

                    return (
                      <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                        <div className="text-sm font-medium text-amber-900 mb-3">Population Projections</div>
                        <div className="grid grid-cols-3 gap-3">
                          {projections.map(({ years, population }) => (
                            <div key={years} className="text-center p-3 bg-white/60 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">{years} Years</div>
                              <div className="text-lg font-bold text-amber-700">
                                {population.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {currentPop > 0 ? ((population / currentPop - 1) * 100).toFixed(1) : 0}%
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                          Based on {growthRate}% annual growth rate. 
                          Current trend: <span className="font-medium">{trend}</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 pb-6">
              {/* Species Comparison */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Network className="w-2.5 h-2.5 text-white" />
                    </div>
                    Species Analysis & Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Species Comparison */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Compare With Other Species</Label>
                    <Select
                      value={editingSpecies.attributes.comparisonSpecies || ''}
                      onValueChange={(value) => updateSpeciesAttribute('comparisonSpecies', value)}
                    >
                      <SelectTrigger className="border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Select species to compare" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                        {species
                          .filter(s => s.id !== editingSpecies.id)
                          .map(s => (
                            <SelectItem key={s.id} value={s.id} className="rounded-md mx-1 my-0.5">
                              {s.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>

                    {/* Comparison Matrix */}
                    {(() => {
                      const comparedSpecies = species.find(s => s.id === editingSpecies.attributes.comparisonSpecies);
                      if (!comparedSpecies) {
                        return (
                          <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center">
                            <Network className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-500">Select a species above to see detailed comparison analysis</p>
                          </div>
                        );
                      }

                      // Calculate similarity scores
                      const calculateSimilarity = (attr1: any, attr2: any) => {
                        if (!attr1 || !attr2) return 0;
                        if (typeof attr1 === 'string' && typeof attr2 === 'string') {
                          return attr1.toLowerCase() === attr2.toLowerCase() ? 100 : 0;
                        }
                        return 50; // Default similarity
                      };

                      const physicalMatch = calculateSimilarity(editingSpecies.attributes.type, comparedSpecies.attributes.type);
                      const habitatOverlap = (() => {
                        const h1 = editingSpecies.attributes.habitat || [];
                        const h2 = comparedSpecies.attributes.habitat || [];
                        const overlap = h1.filter((h: string) => h2.includes(h)).length;
                        const total = new Set([...h1, ...h2]).size;
                        return total > 0 ? (overlap / total) * 100 : 0;
                      })();
                      const dietMatch = calculateSimilarity(editingSpecies.attributes.diet, comparedSpecies.attributes.diet);
                      const intelligenceMatch = (() => {
                        const i1 = editingSpecies.attributes.intelligence || 'average';
                        const i2 = comparedSpecies.attributes.intelligence || 'average';
                        const levels = ['primitive', 'low', 'average', 'high', 'exceptional'];
                        const diff = Math.abs(levels.indexOf(i1) - levels.indexOf(i2));
                        return Math.max(0, 100 - (diff * 25));
                      })();

                      return (
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                            <div className="text-sm font-medium text-indigo-800 mb-3">
                              Comparing with: <span className="font-bold">{comparedSpecies.name}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                { label: 'Physical Type Match', value: physicalMatch, color: 'from-blue-500 to-cyan-500' },
                                { label: 'Habitat Overlap', value: habitatOverlap, color: 'from-green-500 to-emerald-500' },
                                { label: 'Diet Compatibility', value: dietMatch, color: 'from-amber-500 to-orange-500' },
                                { label: 'Intelligence Similarity', value: intelligenceMatch, color: 'from-purple-500 to-pink-500' }
                              ].map(({ label, value, color }) => (
                                <div key={label} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium text-gray-700">{label}</div>
                                    <div className="text-xs font-bold text-indigo-700">{value.toFixed(0)}%</div>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-white/60">
                                    <div 
                                      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                                      style={{ width: `${value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Overall Similarity Score */}
                            <div className="mt-4 pt-4 border-t border-indigo-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-indigo-900">Overall Similarity</span>
                                <span className="text-2xl font-bold text-indigo-700">
                                  {((physicalMatch + habitatOverlap + dietMatch + intelligenceMatch) / 4).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Comparison Table */}
                          <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-gray-700">Attribute</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-700">{editingSpecies.name}</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-700">{comparedSpecies.name}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {[
                                  { label: 'Type', key: 'type' },
                                  { label: 'Diet', key: 'diet' },
                                  { label: 'Intelligence', key: 'intelligence' },
                                  { label: 'Lifespan', key: 'lifespan' },
                                  { label: 'Population', key: 'population', nested: 'total' }
                                ].map(({ label, key, nested }) => (
                                  <tr key={key} className="bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {nested 
                                        ? (editingSpecies.attributes[key]?.[nested]?.toLocaleString() || 'N/A')
                                        : (editingSpecies.attributes[key] || 'N/A')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {nested
                                        ? (comparedSpecies.attributes[key]?.[nested]?.toLocaleString() || 'N/A')
                                        : (comparedSpecies.attributes[key] || 'N/A')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Ecosystem Impact Analysis */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Leaf className="w-2.5 h-2.5 text-white" />
                    </div>
                    Ecosystem Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    // Calculate ecosystem impact scores
                    const population = editingSpecies.attributes.population?.total || 0;
                    const habitats = editingSpecies.attributes.habitat?.length || 0;
                    const predators = editingSpecies.attributes.predators?.length || 0;
                    const prey = editingSpecies.attributes.prey?.length || 0;
                    const symbiosis = editingSpecies.attributes.symbiosis?.length || 0;
                    
                    // Impact scores (0-100)
                    const populationImpact = Math.min(100, (population / 10000) * 100);
                    const foodWebImpact = Math.min(100, ((predators + prey) / 10) * 100);
                    const biodiversityImpact = Math.min(100, ((habitats + symbiosis) / 8) * 100);
                    const overallImpact = (populationImpact + foodWebImpact + biodiversityImpact) / 3;

                    return (
                      <div className="space-y-4">
                        {/* Impact Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { 
                              label: 'Population Impact',
                              value: populationImpact,
                              desc: 'Based on total population size',
                              color: 'from-blue-500 to-indigo-500',
                              icon: Users
                            },
                            { 
                              label: 'Food Web Impact',
                              value: foodWebImpact,
                              desc: 'Predator-prey relationships',
                              color: 'from-red-500 to-pink-500',
                              icon: Network
                            },
                            { 
                              label: 'Biodiversity Impact',
                              value: biodiversityImpact,
                              desc: 'Habitat and symbiotic diversity',
                              color: 'from-green-500 to-emerald-500',
                              icon: Leaf
                            }
                          ].map(({ label, value, desc, color, icon: Icon }) => (
                            <div key={label} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-gray-600" />
                                <div className="text-xs font-medium text-gray-700">{label}</div>
                              </div>
                              <div className="text-2xl font-bold text-gray-900 mb-2">
                                {value.toFixed(0)}/100
                              </div>
                              <div className="h-2 rounded-full bg-gray-100 mb-2">
                                <div 
                                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                          ))}
                        </div>

                        {/* Overall Impact Score */}
                        <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-sm font-medium text-emerald-900 mb-1">Overall Ecosystem Impact</div>
                              <p className="text-xs text-emerald-700">Combined impact across all categories</p>
                            </div>
                            <div className="text-4xl font-bold text-emerald-700">
                              {overallImpact.toFixed(0)}
                            </div>
                          </div>
                          <div className="h-3 rounded-full bg-white/60">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${overallImpact}%` }}
                            />
                          </div>
                          
                          {/* Impact Level Badge */}
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs text-emerald-800">Impact Level:</span>
                            <Badge className={`
                              ${overallImpact < 25 ? 'bg-gray-500' : ''}
                              ${overallImpact >= 25 && overallImpact < 50 ? 'bg-blue-500' : ''}
                              ${overallImpact >= 50 && overallImpact < 75 ? 'bg-amber-500' : ''}
                              ${overallImpact >= 75 ? 'bg-red-500' : ''}
                            `}>
                              {overallImpact < 25 ? 'Minimal' : overallImpact < 50 ? 'Moderate' : overallImpact < 75 ? 'Significant' : 'Critical'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Threat Assessment */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                      <Skull className="w-2.5 h-2.5 text-white" />
                    </div>
                    Threat & Vulnerability Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Threat Level */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Conservation Status</Label>
                      <Select
                        value={editingSpecies.attributes.conservationStatus || 'least-concern'}
                        onValueChange={(value) => updateSpeciesAttribute('conservationStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                          <SelectItem value="least-concern" className="rounded-md mx-1 my-0.5">Least Concern</SelectItem>
                          <SelectItem value="near-threatened" className="rounded-md mx-1 my-0.5">Near Threatened</SelectItem>
                          <SelectItem value="vulnerable" className="rounded-md mx-1 my-0.5">Vulnerable</SelectItem>
                          <SelectItem value="endangered" className="rounded-md mx-1 my-0.5">Endangered</SelectItem>
                          <SelectItem value="critically-endangered" className="rounded-md mx-1 my-0.5">Critically Endangered</SelectItem>
                          <SelectItem value="extinct-wild" className="rounded-md mx-1 my-0.5">Extinct in the Wild</SelectItem>
                          <SelectItem value="extinct" className="rounded-md mx-1 my-0.5">Extinct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vulnerability Score */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Vulnerability Score (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editingSpecies.attributes.vulnerabilityScore || 50}
                        onChange={(e) => updateSpeciesAttribute('vulnerabilityScore', parseInt(e.target.value) || 50)}
                      />
                    </div>
                  </div>

                  {/* Threat Factors */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Primary Threats</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Habitat Loss',
                        'Climate Change',
                        'Overhunting',
                        'Disease',
                        'Pollution',
                        'Invasive Species',
                        'Human Conflict',
                        'Limited Range'
                      ].map(threat => (
                        <label key={threat} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <Checkbox
                            checked={(editingSpecies.attributes.threats || []).includes(threat)}
                            onCheckedChange={(checked) => {
                              const threats = editingSpecies.attributes.threats || [];
                              updateSpeciesAttribute('threats', 
                                checked 
                                  ? [...threats, threat]
                                  : threats.filter((t: string) => t !== threat)
                              );
                            }}
                          />
                          <span className="text-sm text-gray-700">{threat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Threat Summary */}
                  {(() => {
                    const threatCount = editingSpecies.attributes.threats?.length || 0;
                    const vulnerabilityScore = editingSpecies.attributes.vulnerabilityScore || 50;
                    const riskLevel = vulnerabilityScore < 25 ? 'Low' : vulnerabilityScore < 50 ? 'Moderate' : vulnerabilityScore < 75 ? 'High' : 'Critical';
                    const riskColor = vulnerabilityScore < 25 ? 'green' : vulnerabilityScore < 50 ? 'blue' : vulnerabilityScore < 75 ? 'amber' : 'red';

                    return (
                      <div className={`p-4 bg-gradient-to-br from-${riskColor}-50 to-${riskColor}-100 rounded-xl border border-${riskColor}-200`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-900">Risk Assessment Summary</div>
                          <Badge className={`bg-${riskColor}-500`}>{riskLevel} Risk</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Active Threats</div>
                            <div className="text-2xl font-bold text-gray-900">{threatCount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Vulnerability</div>
                            <div className="text-2xl font-bold text-gray-900">{vulnerabilityScore}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Risk Level</div>
                            <div className="text-2xl font-bold text-gray-900">{riskLevel}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Relationship Network Visualization */}
              <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                      <Network className="w-2.5 h-2.5 text-white" />
                    </div>
                    Species Relationship Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const predators = editingSpecies.attributes.predators || [];
                    const prey = editingSpecies.attributes.prey || [];
                    const symbiosis = editingSpecies.attributes.symbiosis || [];
                    const rivals = editingSpecies.attributes.rivals || [];
                    
                    const totalRelationships = predators.length + prey.length + symbiosis.length + rivals.length;

                    if (totalRelationships === 0) {
                      return (
                        <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <Network className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm text-gray-500">No species relationships defined yet</p>
                          <p className="text-xs text-gray-400 mt-1">Add relationships in the Relations tab</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Predators', count: predators.length, color: 'red', icon: Skull },
                            { label: 'Prey', count: prey.length, color: 'orange', icon: Fish },
                            { label: 'Symbiotic', count: symbiosis.length, color: 'green', icon: Heart },
                            { label: 'Rivals', count: rivals.length, color: 'purple', icon: Flame }
                          ].map(({ label, count, color, icon: Icon }) => (
                            <div key={label} className={`p-3 bg-${color}-50 rounded-lg border border-${color}-200`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                                <span className="text-xs font-medium text-gray-700">{label}</span>
                              </div>
                              <div className={`text-2xl font-bold text-${color}-700`}>{count}</div>
                            </div>
                          ))}
                        </div>

                        {/* Relationship Complexity */}
                        <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                          <div className="text-sm font-medium text-violet-900 mb-3">Network Complexity</div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Total Connections</span>
                            <span className="text-lg font-bold text-violet-700">{totalRelationships}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-white/60">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                              style={{ width: `${Math.min(100, (totalRelationships / 20) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {totalRelationships < 5 ? 'Simple ecosystem role' :
                             totalRelationships < 10 ? 'Moderate ecological integration' :
                             totalRelationships < 15 ? 'Complex ecosystem interactions' :
                             'Highly interconnected keystone species'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
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
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-50">
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
                  <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-50">
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

