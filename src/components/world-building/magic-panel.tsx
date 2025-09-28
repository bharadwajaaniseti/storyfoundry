'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Plus, Search, MoreVertical, Trash2, Edit3, BookOpen,
  Star, Sun, Eye, Save, X, Wand2, Shield, Clock, Sparkles, Crown,
  Link, User, MapPin, Package, Globe, Heart, Brain, Copy,
  ChevronDown, ChevronUp, Grid3x3, List, Zap
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DeleteModal from '@/components/ui/delete-modal'
import { useToast } from '@/components/ui/toast'

// Safe color classes to prevent Tailwind purging
const COLOR_CLASSES = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200', border: 'border-gray-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200', border: 'border-green-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200', border: 'border-purple-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200', border: 'border-amber-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200', border: 'border-red-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200', border: 'border-cyan-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200', border: 'border-violet-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200', border: 'border-orange-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-200', border: 'border-yellow-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', ring: 'ring-pink-200', border: 'border-pink-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200', border: 'border-indigo-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-200', border: 'border-teal-200' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200', border: 'border-rose-200' }
}

// Utility functions
const getColorClasses = (colorName: string) => {
  return COLOR_CLASSES[colorName as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.gray
}





// Custom Field Interface
interface CustomField {
  id: string
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'richtext' | 'json' | 'tags'
  options?: string[]
  group?: 'mechanics' | 'lore' | 'costs' | 'components'
  showInCard?: boolean
}

// Version Interface
interface Version {
  id: string
  at: string
  by: string
  changes: string
}

interface MagicElement {
  id: string
  name: string
  description: string
  attributes: {
    // Legacy fields for backward compatibility
    type?: string
    school?: string
    level?: number
    casting_time?: string
    duration?: string
    range?: string
    area_of_effect?: string
    requirements?: string[]
    costs?: { id: string; name: string; description: string }[]
    limitations?: { id: string; name: string; description: string }[]
    components?: { id: string; name: string; description: string }[]
    effects?: { id: string; name: string; description: string }[]
    side_effects?: string[]
    history?: string
    practitioners?: string[]
    cost?: string
    // New flexible schema system
    __schema?: CustomField[]
    __values?: Record<string, any>
    __versions?: Version[]
    [key: string]: any
  }
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
  onNavigateToElement?: (elementId: string, category: string) => void
}

const MAGIC_TYPES = [
  { value: 'system', label: 'Magic System', icon: Crown, color: 'purple' },
  { value: 'spell', label: 'Spell', icon: Sparkles, color: 'blue' },
  { value: 'artifact', label: 'Magical Artifact', icon: Star, color: 'amber' },
  { value: 'school', label: 'School of Magic', icon: BookOpen, color: 'green' },
  { value: 'creature', label: 'Magical Creature', icon: Eye, color: 'red' },
  { value: 'phenomenon', label: 'Magical Phenomenon', icon: Wand2, color: 'cyan' },
  { value: 'ritual', label: 'Ritual', icon: Sun, color: 'orange' },
  { value: 'enchantment', label: 'Enchantment', icon: Shield, color: 'violet' },
  { value: 'material', label: 'Magical Material', icon: Package, color: 'teal' },
  { value: 'plane', label: 'Magical Plane/Realm', icon: Globe, color: 'indigo' },
  { value: 'law', label: 'Magical Law/Rule', icon: BookOpen, color: 'rose' },
  { value: 'energy', label: 'Magical Energy/Force', icon: Zap, color: 'yellow' },
  { value: 'tradition', label: 'Magical Tradition', icon: Crown, color: 'pink' }
]

// World Element Types Configuration for linking
const WORLD_ELEMENT_TYPES = {
  characters: { label: 'Characters', icon: User, emoji: '👤' },
  locations: { label: 'Locations', icon: MapPin, emoji: '📍' },
  timeline: { label: 'Timeline', icon: Clock, emoji: '📅' },
  research: { label: 'Research', icon: BookOpen, emoji: '📄' },
  maps: { label: 'Maps', icon: Globe, emoji: '🗺️' },
  species: { label: 'Species', icon: Zap, emoji: '🧬' },
  cultures: { label: 'Cultures', icon: Crown, emoji: '👑' },
  items: { label: 'Items', icon: Package, emoji: '⚔️' },
  systems: { label: 'Systems', icon: Globe, emoji: '🌍' },
  languages: { label: 'Languages', icon: Shield, emoji: '🗣️' },
  religions: { label: 'Religions', icon: Heart, emoji: '⛪' },
  philosophies: { label: 'Philosophies', icon: Brain, emoji: '🧠' },
  encyclopedia: { label: 'Encyclopedia', icon: BookOpen, emoji: '📚' },
  magic: { label: 'Magic', icon: Sparkles, emoji: '✨' },
  arcs: { label: 'Arcs', icon: Star, emoji: '⭐' }
}

export default function MagicPanel({ 
  projectId, 
  selectedElement, 
  onMagicChange,
  onClearSelection,
  onNavigateToElement
}: MagicPanelProps) {
  const [magicElements, setMagicElements] = useState<MagicElement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingElement, setEditingElement] = useState<MagicElement | null>(null)
  
  // Panel management state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    history: true,
    costs: true,
    limitations: true,
    components: true,
    effects: true,
    links: true
  })
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [panelColors, setPanelColors] = useState<{[key: string]: string}>({
    overview: '',
    history: '',
    costs: '',
    limitations: '',
    components: '',
    effects: '',
    links: ''
  })
  const [customColors, setCustomColors] = useState<{[key: string]: string}>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  
  // Enhanced features state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'type' | 'created'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [collapsedPanels, setCollapsedPanels] = useState<{[key: string]: boolean}>({})
  const [showTooltips, setShowTooltips] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  
  // Rich text and linking state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('all')
  const [allWorldElements, setAllWorldElements] = useState<any[]>([])
  const [cursorPosition, setCursorPosition] = useState<{ field: string; position: number }>({ field: '', position: 0 })
  const activeTextAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    elementId: string
    elementName: string
  }>({
    isOpen: false,
    elementId: '',
    elementName: ''
  })

  // Toast notifications
  const { addToast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    school: '',
    level: 1,
    casting_time: '',
    duration: '',
    range: '',
    area_of_effect: '',
    requirements: [] as string[],
    costs: [] as { id: string; name: string; description: string }[],
    limitations: [] as { id: string; name: string; description: string }[],
    components: [] as { id: string; name: string; description: string }[],
    effects: [] as { id: string; name: string; description: string }[],
    side_effects: [] as string[],
    history: '',
    practitioners: [] as string[],
    cost: '',
    __schema: [] as CustomField[],
    __values: {} as Record<string, any>
  })

  const supabase = createSupabaseClient()

  // Load saved panel colors
  useEffect(() => {
    const savedColors = localStorage.getItem(`magic_panel_colors:${projectId}`)
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors)
        setPanelColors(parsed.panelColors || panelColors)
        setCustomColors(parsed.customColors || {})
      } catch (e) {
        // Ignore invalid saved colors
      }
    }
  }, [projectId])

  useEffect(() => {
    loadMagicElements()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'magic') {
      setEditingElement(selectedElement)
      setIsCreating(true)
      // Load panel colors if available
      if (selectedElement.attributes?.panel_colors) {
        setPanelColors(selectedElement.attributes.panel_colors)
      }
      if (selectedElement.attributes?.custom_colors) {
        setCustomColors(selectedElement.attributes.custom_colors)
      }
    }
  }, [selectedElement])

  // Load world elements for linking
  useEffect(() => {
    const loadWorldElements = async () => {
      if (!projectId) return
      
      try {
        const { data, error } = await supabase
          .from('world_elements')
          .select('id, name, category')
          .eq('project_id', projectId)
          .neq('category', 'magic')
        
        if (error) throw error
        setAllWorldElements(data || [])
      } catch (error) {
        console.error('Error loading world elements for linking:', error)
      }
    }

    if (isCreating) {
      loadWorldElements()
    }
  }, [projectId, isCreating])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            if (!isCreating && !editingElement) {
              setEditingElement({
                id: '',
                name: 'New Magic System',
                description: '',
                attributes: {},
                project_id: projectId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                category: 'magic'
              })
              setIsCreating(true)
            }
            break
          case 's':
            e.preventDefault()
            if (editingElement) {
              handleSaveElement()
            }
            break
          case 'Escape':
            if (isCreating || editingElement) {
              resetForm()
              onClearSelection?.()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isCreating, editingElement, projectId])

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

  const populateEditingElement = (element: MagicElement) => {
    setEditingElement({
      ...element,
      attributes: {
        ...element.attributes,
        overview: element.attributes?.overview || element.description || '',
        history: element.attributes?.history || '',
        costs: element.attributes?.costs || [],
        limitations: element.attributes?.limitations || [],
        components: element.attributes?.components || [],
        effects: element.attributes?.effects || [],
        links: element.attributes?.links || []
      }
    })
  }

  const filteredAndSortedElements = useMemo(() => {
    let filtered = magicElements.filter(element => {
      const matchesSearch = !searchTerm || 
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.attributes?.type?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = selectedType === 'all' || !selectedType || element.attributes?.type === selectedType
      
      return matchesSearch && matchesType
    })

    // Sort elements
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'type':
          aVal = a.attributes?.type || ''
          bVal = b.attributes?.type || ''
          break
        case 'created':
          aVal = new Date(a.created_at)
          bVal = new Date(b.created_at)
          break
        case 'updated':
        default:
          aVal = new Date(a.updated_at)
          bVal = new Date(b.updated_at)
          break
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [magicElements, searchTerm, selectedType, sortBy, sortOrder])

  const handleSaveElement = async () => {
    if (!editingElement) return
    
    setSaving(true)
    setError(null)
    
    try {
      const elementData = {
        project_id: projectId,
        category: 'magic',
        name: editingElement.name,
        description: editingElement.attributes?.overview || editingElement.description,
        attributes: {
          ...editingElement.attributes,
          panel_colors: panelColors,
          custom_colors: customColors,
          __versions: [
            ...(editingElement.attributes?.__versions || []),
            {
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
              by: 'local',
              changes: `Updated magic element`
            }
            ].slice(-10)
        }
      }

      let result: MagicElement
      if (editingElement.id) {
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

      // Save panel colors to localStorage
      const colorData = { panelColors, customColors }
      localStorage.setItem(`magic_panel_colors:${projectId}`, JSON.stringify(colorData))

      window.dispatchEvent(new CustomEvent('magicCreated', { 
        detail: { magic: result, projectId } 
      }))

      onMagicChange?.()
    } catch (error) {
      console.error('Error saving magic element:', error)
      setError('Failed to save magic element')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteElement = async (id: string) => {
    const element = magicElements.find(e => e.id === id)
    if (!element) return

    setDeleteModal({
      isOpen: true,
      elementId: id,
      elementName: element.name
    })
  }

  const confirmDelete = async () => {
    const { elementId, elementName } = deleteModal
    if (!elementId) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', elementId)

      if (error) throw error

      setMagicElements(prev => prev.filter(e => e.id !== elementId))
      onMagicChange?.()
      addToast({
        type: 'success',
        title: 'Magic Element Deleted',
        message: `Successfully deleted "${elementName}"`
      })
    } catch (error) {
      console.error('Error deleting magic element:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete magic element'
      })
    } finally {
      setDeleteModal({ isOpen: false, elementId: '', elementName: '' })
    }
  }

  const resetForm = () => {
    setEditingElement(null)
    setIsCreating(false)
    setPanelColors({
      overview: '',
      history: '',
      costs: '',
      limitations: '',
      components: '',
      effects: '',
      links: ''
    })
    setCustomColors({})
  }

  const handleDuplicate = async (element: MagicElement) => {
    const duplicateData = {
      ...element,
      id: '', // Clear ID for new element
      name: `${element.name} (Copy)`,
    }
    
    populateEditingElement(duplicateData)
    setIsCreating(true)
    addToast({
      type: 'info',
      title: 'Element Duplicated',
      message: `Created a copy of "${element.name}" for editing`
    })
  }

  // Panel management functions
  const toggleDropdown = (section: string) => {
    setActiveDropdown(activeDropdown === section ? null : section)
  }

  const handleMenuAction = (action: string, section: string) => {
    if (action === 'setColor') {
      setShowColorPicker(section)
    } else if (action === 'delete') {
      // Handle panel deletion
      // Panel deletion functionality could be added here if needed
    }
    setActiveDropdown(null)
  }

  const handleColorSelect = (section: string, color: string) => {
    setPanelColors(prev => ({
      ...prev,
      [section]: color
    }))
    setShowColorPicker(null)
  }

  const handleCustomColorChange = (section: string, color: string) => {
    setCustomColors(prev => ({
      ...prev,
      [section]: color
    }))
  }

  // Panel styling functions
  const predefinedColors = [
    { name: 'Default', value: '', class: 'bg-white border-gray-200' },
    { name: 'Orange', value: 'bg-orange-50 border-orange-200', class: 'bg-orange-100' },
    { name: 'Blue', value: 'bg-blue-50 border-blue-200', class: 'bg-blue-100' },
    { name: 'Green', value: 'bg-green-50 border-green-200', class: 'bg-green-100' },
    { name: 'Purple', value: 'bg-purple-50 border-purple-200', class: 'bg-purple-100' },
    { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200', class: 'bg-yellow-100' },
    { name: 'Pink', value: 'bg-pink-50 border-pink-200', class: 'bg-pink-100' },
    { name: 'Gray', value: 'bg-gray-50 border-gray-300', class: 'bg-gray-100' }
  ]

  const getPanelStyle = (section: string) => {
    const customColor = customColors[section]
    
    if (customColor) {
      return {
        backgroundColor: customColor,
        borderColor: customColor,
        borderWidth: '1px'
      }
    }
    
    return {}
  }

  const getPanelClassName = (section: string) => {
    const customColor = customColors[section]
    const predefinedColor = panelColors[section]
    
    if (customColor) {
      return 'rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200'
    }
    
    return `rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 ${predefinedColor || 'bg-white border-gray-200'}`
  }

  const getMagicTypeIcon = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType ? magicType.icon : Zap
  }

  const getMagicTypeColor = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType?.color || 'gray'
  }

  // Content manipulation functions
  const addCostItem = () => {
    if (!editingElement) return
    
    const newCost = { id: crypto.randomUUID(), name: 'New Item Name', description: 'Add a description...' }
    const currentCosts = editingElement.attributes?.costs || []
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        costs: [...currentCosts, newCost]
      }
    })
  }

  const addLimitationItem = () => {
    if (!editingElement) return
    
    const newLimitation = { id: crypto.randomUUID(), name: 'New Item Name', description: 'Add a description...' }
    const currentLimitations = editingElement.attributes?.limitations || []
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        limitations: [...currentLimitations, newLimitation]
      }
    })
  }

  const addComponentItem = () => {
    if (!editingElement) return
    
    const newComponent = { id: crypto.randomUUID(), name: 'New Component', description: 'Add a description...' }
    const currentComponents = editingElement.attributes?.components || []
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        components: [...currentComponents, newComponent]
      }
    })
  }

  const addEffectItem = () => {
    if (!editingElement) return
    
    const newEffect = { id: crypto.randomUUID(), name: 'New Effect', description: 'Add a description...' }
    const currentEffects = editingElement.attributes?.effects || []
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        effects: [...currentEffects, newEffect]
      }
    })
  }

  const updateListItem = (type: 'costs' | 'limitations' | 'components' | 'effects', index: number, field: 'name' | 'description', value: string) => {
    if (!editingElement) return
    
    const currentItems = editingElement.attributes?.[type] || []
    const updatedItems = [...currentItems]
    
    // Ensure we're working with objects that have the expected structure
    if (updatedItems[index] && typeof updatedItems[index] === 'object') {
      updatedItems[index] = { ...updatedItems[index] as any, [field]: value }
    } else {
      // Create new item if it doesn't exist or is not an object
      updatedItems[index] = { id: crypto.randomUUID(), name: '', description: '', [field]: value }
    }
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        [type]: updatedItems
      }
    })
  }

  const removeListItem = (type: 'costs' | 'limitations' | 'components' | 'effects', index: number) => {
    if (!editingElement) return
    
    const currentItems = editingElement.attributes?.[type] || []
    const updatedItems = currentItems.filter((_: any, i: number) => i !== index)
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        [type]: updatedItems
      }
    })
  }

  const handleAddLink = (linkedElement: any) => {
    if (!editingElement) return
    
    const newLink = {
      id: linkedElement.id,
      name: linkedElement.name,
      category: linkedElement.category,
      relationship: 'related' // Default relationship type
    }
    
    const currentLinks = editingElement.attributes?.links || []
    
    // Check if link already exists
    if (currentLinks.some((link: any) => link.id === linkedElement.id)) {
      return // Link already exists
    }
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        links: [...currentLinks, newLink]
      }
    })
  }

  const removeLinkItem = (index: number) => {
    if (!editingElement) return
    
    const currentLinks = editingElement.attributes?.links || []
    const updatedLinks = currentLinks.filter((_: any, i: number) => i !== index)
    
    setEditingElement({
      ...editingElement,
      attributes: {
        ...editingElement.attributes,
        links: updatedLinks
      }
    })
  }

  // Enhanced features functions
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedElements.length} magic elements?`)) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .in('id', selectedElements)

      if (error) throw error

      setMagicElements(prev => prev.filter(e => !selectedElements.includes(e.id)))
      setSelectedElements([])
      setShowBulkActions(false)
      onMagicChange?.()
    } catch (error) {
      console.error('Error bulk deleting elements:', error)
    }
  }

  const handleExportElements = () => {
    const elementsToExport = selectedElements.length > 0 
      ? magicElements.filter(e => selectedElements.includes(e.id))
      : magicElements
    
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      elements: elementsToExport
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `magic-elements-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  const togglePanelCollapse = (panelName: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }))
  }

  const toggleElementSelection = (elementId: string) => {
    setSelectedElements(prev => 
      prev.includes(elementId) 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    )
  }

  const selectAllElements = () => {
    if (selectedElements.length === filteredAndSortedElements.length) {
      setSelectedElements([])
    } else {
      setSelectedElements(filteredAndSortedElements.map(e => e.id))
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show element list if not creating/editing
  if (!isCreating && !editingElement) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                Magic System
              </h1>
              <p className="text-gray-600 leading-relaxed">Create and manage magic elements with flexible panel system</p>
            </div>
            
            <Button
              onClick={() => {
                setEditingElement({
                  id: '',
                  name: 'New Magic System',
                  description: '',
                  attributes: {},
                  project_id: projectId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  category: 'magic'
                })
                setIsCreating(true)
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Magic Element
            </Button>
          </div>

          {/* Enhanced Search and Controls */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            {/* Top Row - Search and Primary Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search magic elements, descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-56 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-xl">
                    <SelectItem value="all" className="font-medium">All Types</SelectItem>
                    {MAGIC_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4 text-gray-600" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={handleExportElements}
                  variant="outline"
                  className="border-gray-300 hover:border-yellow-500"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Bottom Row - View Controls and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Bulk Selection */}
                {selectedElements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {selectedElements.length} selected
                    </Badge>
                    <Button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      variant="outline"
                      size="sm"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      Bulk Actions
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Sort Controls */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 border-gray-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  className="border-gray-300"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                
                <div className="text-sm text-gray-500">
                  {filteredAndSortedElements.length} of {magicElements.length}
                </div>
              </div>
            </div>
            
            {/* Bulk Actions Panel */}
            {showBulkActions && selectedElements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={selectAllElements}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    {selectedElements.length === filteredAndSortedElements.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    onClick={handleExportElements}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Elements Grid */}
          {filteredAndSortedElements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-2xl mb-6">
                <Sparkles className="w-20 h-20 text-yellow-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No magic elements yet</h3>
              <p className="text-gray-600 text-center max-w-md mb-8 leading-relaxed">
                Start building your magic system with flexible panels and custom fields.
              </p>
              <Button 
                onClick={() => {
                  setEditingElement({
                    id: '',
                    name: 'New Magic System',
                    description: '',
                    attributes: {},
                    project_id: projectId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    category: 'magic'
                  })
                  setIsCreating(true)
                }}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Magic Element
              </Button>
            </div>
          ) : (
            filteredAndSortedElements.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Sparkles className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No magic elements found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first magic element</p>
              <Button
                onClick={() => {
                  setEditingElement({
                    id: '',
                    name: 'New Magic System',
                    description: '',
                    attributes: {},
                    project_id: projectId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    category: 'magic'
                  })
                  setIsCreating(true)
                }}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Magic Element
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4' : 'space-y-2'}>
              {filteredAndSortedElements.map(element => {
                const TypeIcon = getMagicTypeIcon(element.attributes?.type || '')
                const typeColorName = getMagicTypeColor(element.attributes?.type || '')
                const typeColor = getColorClasses(typeColorName)
                
                return (
                  <Card 
                    key={element.id} 
                    className={`group relative overflow-visible border border-gray-200/60 rounded-xl shadow-sm hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer bg-white/90 backdrop-blur-sm hover:bg-white hover:border-yellow-400/60 hover:scale-[1.03] hover:-translate-y-2 ${
                      viewMode === 'list' 
                        ? 'flex items-center p-4' 
                        : 'h-64 flex flex-col'
                    }`}
                    onClick={(e) => {
                      // Don't navigate if clicking on interactive elements
                      const target = e.target as HTMLElement
                      if (target.closest('button') || 
                          target.closest('[data-radix-collection-item]') ||
                          target.tagName === 'BUTTON' ||
                          (target.closest('svg') && target.closest('button'))) {
                        e.stopPropagation();
                        return;
                      }
                      populateEditingElement(element);
                      setIsCreating(true);
                    }}
                  >
                    {/* Enhanced gradient overlay with glow effect - lower z-index */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/0 via-amber-50/0 to-orange-50/0 group-hover:from-yellow-50/40 group-hover:via-amber-50/30 group-hover:to-orange-50/20 transition-all duration-500 rounded-xl z-0" style={{ pointerEvents: 'none' }} />
                    {/* Subtle glow ring on hover - lower z-index */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 ring-1 ring-yellow-400/20 group-hover:ring-yellow-400/40 z-0" style={{ pointerEvents: 'none' }} />
                    {viewMode === 'list' ? (
                      /* Compact List View with Left/Right Layout */
                      <div className="flex items-center justify-between w-full overflow-hidden">
                        {/* Left Side - Element Info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2 max-w-2xl overflow-hidden">
                          <div className={`p-1.5 rounded-lg ${typeColor.bg} flex-shrink-0`}>
                            <TypeIcon className={`w-4 h-4 ${typeColor.text}`} />
                          </div>
                          <div className="min-w-0 flex-1 max-w-xs">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">{element.name}</h3>
                            <p className="text-xs text-gray-600 truncate max-w-full">
                              {element.description && element.description.length > 60 
                                ? `${element.description.slice(0, 60)}...` 
                                : element.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Side - Ultra Compact Columns */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Type Badge Column - Only on larger screens */}
                          <div className="w-12 flex justify-start hidden lg:flex">
                            {element.attributes?.type && (
                              <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 px-1 py-0">
                                {MAGIC_TYPES.find(t => t.value === element.attributes?.type)?.label?.slice(0, 2) || element.attributes.type.slice(0, 2)}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Combined Stats Column - Always visible */}
                          <div className="w-10 flex justify-center">
                            <div className="flex items-center text-xs text-gray-500">
                              {element.attributes?.links && element.attributes.links.length > 0 ? (
                                <span className="flex items-center">
                                  <Link className="w-3 h-3" />
                                  <span className="ml-0.5">{element.attributes.links.length}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          
                          {/* Action Buttons Column - Minimal */}
                          <div className="w-12 flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                populateEditingElement(element)
                                setIsCreating(true)
                              }}
                              className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors p-0.5 h-5 w-5"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Compact & Modern Grid View */
                      <>
                        {/* Compact Header */}
                        <div className="p-4 pb-2 relative z-10" style={{ pointerEvents: 'auto' }}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColor.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg transition-all duration-400 transform-gpu`}>
                              <TypeIcon className={`w-5 h-5 ${typeColor.text} group-hover:scale-110 transition-all duration-300`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 truncate group-hover:text-gray-800 group-hover:scale-105 transition-all duration-300 origin-left">
                                {element.name}
                              </h3>
                              <div className="flex gap-1.5 flex-wrap">
                                {element.attributes?.type && (
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full group-hover:bg-yellow-200 group-hover:scale-105 group-hover:shadow-md transition-all duration-300"
                                  >
                                    {MAGIC_TYPES.find(t => t.value === element.attributes?.type)?.label.slice(0, 8) || element.attributes.type.slice(0, 8)}
                                  </Badge>
                                )}
                                {element.attributes?.links && element.attributes.links.length > 0 && (
                                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs group-hover:bg-green-100 group-hover:scale-105 group-hover:shadow-md transition-all duration-300 delay-100">
                                    <Link className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                                    <span>{element.attributes.links.length}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content Area */}
                        <div className="px-4 pb-4 flex-1 flex flex-col relative z-10">
                          {/* Description */}
                          {element.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-3 flex-1 group-hover:text-gray-700 group-hover:scale-[1.02] transition-all duration-300 line-clamp-3 origin-top">
                              {element.description.length > 60 ? `${element.description.slice(0, 60)}...` : element.description}
                            </p>
                          )}

                          {/* Bottom Actions */}
                          <div 
                            className="flex justify-between items-center pt-2 border-t border-gray-100 group-hover:border-gray-200 mt-auto transition-all duration-300" 
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(element);
                              }}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 h-7 text-xs rounded-md transition-all duration-300 hover:scale-110 hover:shadow-md group-hover:translate-x-1"
                            >
                              <Copy className="w-3 h-3 mr-1 group-hover:animate-pulse" />
                              Copy
                            </Button>
                            
                            <span className="text-xs text-gray-400 group-hover:text-gray-500 group-hover:scale-105 transition-all duration-300">
                              {new Date(element.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                )
              })}
            </div>
          )
        )}
      </div>
    )
  }

  // Show panel-based editor if creating/editing
  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              resetForm()
              onClearSelection?.()
            }}
            className="hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingElement?.id ? 'Edit' : 'Create'} Magic Element
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`border-gray-300 hover:border-yellow-500 ${isPreviewMode ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : ''}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Export current element
              if (editingElement) {
                const exportData = {
                  version: '1.0',
                  exported_at: new Date().toISOString(),
                  element: editingElement
                }
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${editingElement.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-magic-element.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }
            }}
            className="border-gray-300 hover:border-yellow-500"
          >
            <Copy className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button 
            onClick={handleSaveElement}
            disabled={saving || !editingElement?.name}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Name Field */}
      <div className="mb-6">
        {isPreviewMode ? (
          <div className="text-xl font-semibold text-gray-900 border-b-2 border-gray-200 pb-2">
            {editingElement?.name || 'Untitled Magic Element'}
          </div>
        ) : (
          <Input
            value={editingElement?.name || ''}
            onChange={(e) => setEditingElement(prev => prev ? {...prev, name: e.target.value} : null)}
            placeholder="Enter magic element name..."
            className="text-xl font-semibold border-0 border-b-2 border-gray-200 rounded-none px-0 focus:border-yellow-500 focus:ring-0 bg-transparent"
          />
        )}
      </div>

      {/* Panel Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Overview Panel */}
          <div className={`${getPanelClassName('overview')} max-h-[567px] flex flex-col`} style={getPanelStyle('overview')}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePanelCollapse('overview')}
                  className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-1 transition-all duration-200"
                >
                  {collapsedPanels.overview ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
                <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
                {showTooltips && (
                  <div className="group relative">
                    <div className="text-gray-400 hover:text-gray-600 cursor-help">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Main description and notes
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('overview')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'overview' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'overview')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'overview' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.overview || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('overview', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('overview', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.overview === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!collapsedPanels.overview && (
              isPreviewMode ? (
                <div className="flex-1 text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {editingElement?.attributes?.overview || editingElement?.description ? (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {editingElement?.attributes?.overview || editingElement?.description}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic text-center py-8">
                      No overview content yet
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  value={editingElement?.attributes?.overview || editingElement?.description || ''}
                  onChange={(e) => setEditingElement(prev => prev ? {
                    ...prev,
                    attributes: { ...prev.attributes, overview: e.target.value }
                  } : null)}
                  placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                  className="flex-1 resize-none border-0 p-0 focus:ring-0 text-gray-700"
                  rows={15}
                />
              )
            )}
          </div>

          {/* History Panel */}
          <div className={getPanelClassName('history')} style={getPanelStyle('history')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">History</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('history')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'history' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'history')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'history' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.history || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('history', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('history', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.history === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {isPreviewMode ? (
              <div className="text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {editingElement?.attributes?.history ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {editingElement.attributes.history}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center py-8">
                    No history content yet
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={editingElement?.attributes?.history || ''}
                onChange={(e) => setEditingElement(prev => prev ? {
                  ...prev,
                  attributes: { ...prev.attributes, history: e.target.value }
                } : null)}
                placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                className="resize-none border-0 p-0 focus:ring-0 text-gray-700"
                rows={12}
              />
            )}
          </div>

          {/* Costs Panel */}
          <div className={getPanelClassName('costs')} style={getPanelStyle('costs')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Costs</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('costs')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'costs' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'costs')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'costs' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.costs || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('costs', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('costs', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.costs === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {isPreviewMode ? (
                editingElement?.attributes?.costs && editingElement.attributes.costs.length > 0 ? (
                  editingElement.attributes.costs.map((cost: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900 mb-2">{cost.name || 'Unnamed Cost'}</div>
                      <div className="text-gray-700 text-sm leading-relaxed">{cost.description || 'No description'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    No costs defined yet
                  </div>
                )
              ) : (
                <>
                  {editingElement?.attributes?.costs?.map((cost: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="New Item Name"
                          value={cost.name}
                          onChange={(e) => updateListItem('costs', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={cost.description}
                          onChange={(e) => updateListItem('costs', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={() => removeListItem('costs', index)}
                        className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCostItem}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Cost Item</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Limitations Panel */}
          <div className={getPanelClassName('limitations')} style={getPanelStyle('limitations')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Limitations</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('limitations')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'limitations' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'limitations')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'limitations' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.limitations || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('limitations', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('limitations', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.limitations === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {isPreviewMode ? (
                editingElement?.attributes?.limitations && editingElement.attributes.limitations.length > 0 ? (
                  editingElement.attributes.limitations.map((limitation: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900 mb-2">{limitation.name || 'Unnamed Limitation'}</div>
                      <div className="text-gray-700 text-sm leading-relaxed">{limitation.description || 'No description'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    No limitations defined yet
                  </div>
                )
              ) : (
                <>
                  {editingElement?.attributes?.limitations?.map((limitation: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="New Item Name"
                          value={limitation.name}
                          onChange={(e) => updateListItem('limitations', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={limitation.description}
                          onChange={(e) => updateListItem('limitations', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={() => removeListItem('limitations', index)}
                        className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addLimitationItem}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Limitation</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Links Panel */}
          <div className={getPanelClassName('links')} style={getPanelStyle('links')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Magical People & Places</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                    title="Add Link"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('links')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'links' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'links')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'links' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.links || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('links', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('links', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.links === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {isPreviewMode ? (
                editingElement?.attributes?.links && editingElement.attributes.links.length > 0 ? (
                  <div className="space-y-2">
                    {editingElement.attributes.links.map((link: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="text-lg">
                          {WORLD_ELEMENT_TYPES[link.category as keyof typeof WORLD_ELEMENT_TYPES]?.emoji || '📝'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{link.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{link.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    No links defined yet
                  </div>
                )
              ) : (
                <>
                  {/* Display existing links */}
                  {editingElement?.attributes?.links && editingElement.attributes.links.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {editingElement.attributes.links.map((link: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {WORLD_ELEMENT_TYPES[link.category as keyof typeof WORLD_ELEMENT_TYPES]?.emoji || '📝'}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{link.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{link.category}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeLinkItem(index)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-all duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    Links connect {editingElement?.name || 'New Magic System'} with any other elements within Campfire.
                  </p>
                  <p className="text-sm text-gray-600">
                    Click <Plus className="inline w-3 h-3 mx-1" /> <strong>Add Link</strong> below to add a link to an existing element.
                  </p>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-300 hover:text-yellow-600 transition-colors mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Link</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Components Panel */}
          <div className={getPanelClassName('components')} style={getPanelStyle('components')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Components</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('components')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'components' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'components')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'components' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.components || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('components', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('components', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.components === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {isPreviewMode ? (
                editingElement?.attributes?.components && editingElement.attributes.components.length > 0 ? (
                  editingElement.attributes.components.map((component: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900 mb-2">{component.name || 'Unnamed Component'}</div>
                      <div className="text-gray-700 text-sm leading-relaxed">{component.description || 'No description'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    No components defined yet
                  </div>
                )
              ) : (
                <>
                  {editingElement?.attributes?.components?.map((component: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Component Name"
                          value={component.name}
                          onChange={(e) => updateListItem('components', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={component.description}
                          onChange={(e) => updateListItem('components', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={() => removeListItem('components', index)}
                        className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addComponentItem}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Component</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Effects Panel */}
          <div className={getPanelClassName('effects')} style={getPanelStyle('effects')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Effects</h3>
              <div className="flex items-center gap-2 relative">
                {!isPreviewMode && (
                  <button
                    onClick={() => toggleDropdown('effects')}
                    className="text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg p-2 transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                )}
                {activeDropdown === 'effects' && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleMenuAction('setColor', 'effects')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Set Panel Color
                    </button>
                  </div>
                )}
                {showColorPicker === 'effects' && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                    
                    {/* Custom Color Picker */}
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColors.effects || '#ffffff'}
                          onChange={(e) => handleCustomColorChange('effects', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Pick any color</span>
                      </div>
                    </div>

                    {/* Predefined Colors */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorSelect('effects', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.effects === color.value ? 'ring-2 ring-yellow-500' : 'border-gray-300'}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {isPreviewMode ? (
                editingElement?.attributes?.effects && editingElement.attributes.effects.length > 0 ? (
                  editingElement.attributes.effects.map((effect: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900 mb-2">{effect.name || 'Unnamed Effect'}</div>
                      <div className="text-gray-700 text-sm leading-relaxed">{effect.description || 'No description'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    No effects defined yet
                  </div>
                )
              ) : (
                <>
                  {editingElement?.attributes?.effects?.map((effect: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Effect Name"
                          value={effect.name}
                          onChange={(e) => updateListItem('effects', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={effect.description}
                          onChange={(e) => updateListItem('effects', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={() => removeListItem('effects', index)}
                        className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addEffectItem}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Effect</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      {/* Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Add Link to Element</DialogTitle>
            <DialogDescription>
              Choose an element to link to your magic system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search elements..."
                value={linkSearchTerm}
                onChange={(e) => setLinkSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {allWorldElements
                .filter(element => 
                  element.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                  element.category.toLowerCase().includes(linkSearchTerm.toLowerCase())
                )
                .slice(0, 20)
                .map(element => (
                  <div key={element.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">
                        {WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]?.emoji || '📝'}
                      </div>
                      <div>
                        <div className="font-medium">{element.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAddLink(element)
                        setShowLinkModal(false)
                      }}
                    >
                      Link
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600">
          <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
          <div className="space-y-1">
            <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+N</kbd> New Element</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+S</kbd> Save</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> Cancel</div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, elementId: '', elementName: '' })}
        onConfirm={confirmDelete}
        title="Delete Magic Element"
        itemName={deleteModal.elementName}
        type="element"
      />
    </div>
  )
}
