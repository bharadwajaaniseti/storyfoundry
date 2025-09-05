'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, BookOpen, Users, Save, Settings, Eye, FileText, Map, Clock, 
  Target, MapPin, User, Calendar, Search, Bookmark, Plus, Edit3, Trash2, 
  ChevronDown, ChevronRight, Folder, Edit, Palette, Globe, Shield, Heart, 
  Brain, Zap, Upload, Crown, Download, Copy, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import CharactersPanel from '@/components/world-building/characters-panel'
import LocationsPanel from '@/components/world-building/locations-panel'
import ChaptersPanel from '@/components/world-building/chapters-panel'
import ResearchPanel from '@/components/world-building/research-panel'
import MapsPanel from '@/components/world-building/maps-panel'
import TimelinePanel from '@/components/world-building/timeline-panel'
import CalendarPanel from '@/components/world-building/calendar-panel'
import EncyclopediaPanel from '@/components/world-building/encyclopedia-panel'
import InputModal from '@/components/ui/input-modal'
import DeleteModal from '@/components/ui/delete-modal'

// Type definitions
interface Project {
  id: string
  title: string
  description: string
  synopsis?: string
  format: string
  genre: string
  subgenre?: string
  word_count?: number
  cast_size?: number
  language?: string
  visibility: string
  buzz_score?: number
  created_at: string
  updated_at: string
  owner?: {
    display_name: string
    avatar_url?: string
  }
}

interface WorldElement {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: Record<string, any>
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
  is_folder?: boolean
  parent_folder_id?: string
  sort_order?: number
  icon_color?: string
}

interface Chapter {
  id: string
  project_id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  target_word_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  created_at: string
  updated_at: string
  parent_folder_id?: string
  sort_order?: number
  category: string
  icon_color?: string
}

interface Character {
  id?: string
  name: string
  description: string
  image_url?: string
  sections: any[]
  created_at?: string
  updated_at?: string
}

// Sidebar navigation options
const SIDEBAR_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: Target, hasAdd: false, color: 'slate', description: 'Project overview and statistics' },
  { id: 'characters', label: 'Characters', icon: Users, hasAdd: true, color: 'blue', description: 'Create and develop story characters' },
  { id: 'chapters', label: 'Chapters', icon: FileText, hasAdd: true, color: 'orange', description: 'Write and organize your story chapters' },
  { id: 'locations', label: 'Locations', icon: MapPin, hasAdd: true, color: 'green', description: 'Define places in your story world' },
  { id: 'maps', label: 'Maps', icon: Map, hasAdd: true, color: 'cyan', description: 'Create visual world representations' },
  { id: 'research', label: 'Research', icon: Search, hasAdd: true, color: 'purple', description: 'Gather reference materials' },
  { id: 'timeline', label: 'Timeline', icon: Clock, hasAdd: true, color: 'indigo', description: 'Track story events chronologically' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, hasAdd: true, color: 'amber', description: 'Manage dates and seasons' },
  { id: 'arcs', label: 'Arcs', icon: Target, hasAdd: true, color: 'amber', description: 'Plan character development and plot progression throughout your story.' },
  { id: 'relationships', label: 'Relationships', icon: Heart, hasAdd: true, color: 'rose', description: 'Map connections, conflicts, and bonds between characters.' },
  { id: 'encyclopedia', label: 'Encyclopedia', icon: Bookmark, hasAdd: true, color: 'emerald', description: 'Document important facts, terms, and knowledge in your world.' },
  { id: 'magic', label: 'Magic', icon: Zap, hasAdd: true, color: 'yellow', description: 'Define magical systems, spells, and supernatural elements.' },
  { id: 'species', label: 'Species', icon: Zap, hasAdd: true, color: 'yellow', description: 'Create different races, creatures, and beings in your world.' },
  { id: 'cultures', label: 'Cultures', icon: Crown, hasAdd: true, color: 'pink', description: 'Culture permeates every aspect of a society. Define the cultures of your world here.' },
  { id: 'items', label: 'Items', icon: Palette, hasAdd: true, color: 'indigo', description: 'Catalog important objects, artifacts, and possessions in your story.' },
  { id: 'systems', label: 'Systems', icon: Globe, hasAdd: true, color: 'teal', description: 'Define political, economic, and social structures that govern your world.' },
  { id: 'languages', label: 'Languages', icon: Shield, hasAdd: true, color: 'red', description: 'Create languages, dialects, and communication systems for your cultures.' },
  { id: 'religions', label: 'Religions', icon: Heart, hasAdd: true, color: 'rose', description: 'Develop belief systems, deities, and spiritual practices.' },
  { id: 'philosophies', label: 'Philosophies', icon: Brain, hasAdd: true, color: 'violet', description: 'Explore the underlying principles and worldviews that shape your story.' },
]

export default function NovelPage() {
  const router = useRouter()
  const params = useParams()
  
  // Core state
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<string>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Data state
  const [worldElements, setWorldElements] = useState<WorldElement[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showCharacterEditor, setShowCharacterEditor] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<WorldElement | null>(null)
  const [triggerNewChapter, setTriggerNewChapter] = useState(false)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    categoryId: string
    categoryLabel: string
  } | null>(null)
  
  const [elementContextMenu, setElementContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    type: 'folder' | 'element' | 'chapter'
    item: WorldElement | Chapter | null
    category: string
  } | null>(null)

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    id: string
    type: 'element' | 'folder' | 'chapter'
    category: string
  } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null)

  // Color picker state
  const [colorPickerModal, setColorPickerModal] = useState<{
    visible: boolean
    item: WorldElement | Chapter | null
    type: 'element' | 'chapter'
  } | null>(null)
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [colorInputs, setColorInputs] = useState({ hex: '4E2AE4', r: 78, g: 42, b: 228 })

  // Input modal state
  const [inputModal, setInputModal] = useState<{
    isOpen: boolean
    type: 'folder' | 'rename'
    title: string
    description?: string
    placeholder?: string
    defaultValue?: string
    onConfirm: (value: string) => void
  }>({
    isOpen: false,
    type: 'folder',
    title: '',
    onConfirm: () => {}
  })

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'folder' | 'element' | 'chapter'
    title: string
    itemName?: string
    onConfirm: () => void
  }>({
    isOpen: false,
    type: 'element',
    title: '',
    onConfirm: () => {}
  })

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const projectId = params.id as string
        if (!projectId) return
        
        // Fetch project
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            setProject(null)
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const projectData = await response.json()
        setProject(projectData)
        
        // Load world elements and chapters
        await Promise.all([
          loadWorldElements(projectId),
          loadChapters(projectId)
        ])
        
      } catch (error) {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [params])

  // Data loading functions
  const loadWorldElements = async (projectId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('parent_folder_id', { ascending: true, nullsFirst: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setWorldElements(data || [])
    } catch (error) {
    }
  }

  const loadChapters = async (projectId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error
      
      // Ensure chapters have category field
      const chaptersWithCategory = (data || []).map(chapter => ({
        ...chapter,
        category: chapter.category || 'chapters'
      }))
      
      setChapters(chaptersWithCategory)
    } catch (error) {
    }
  }

  // World element functions
  const createWorldElement = async (category: string, name: string, parentFolderId?: string) => {
    if (!project) return
    
    try {
      const supabase = createSupabaseClient()
      const newElement = {
        project_id: project.id,
        category,
        name,
        description: '',
        attributes: getDefaultAttributes(category),
        tags: [],
        parent_folder_id: parentFolderId || null,
        sort_order: 0
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error
      
      setWorldElements(prev => [...prev, data])
      setSelectedElement(data)
      setIsCreating(false)
    } catch (error) {
    }
  }

  const updateWorldElement = async (elementId: string, updates: Partial<WorldElement>) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', elementId)
        .select()
        .single()

      if (error) throw error

      setWorldElements(prev => prev.map(el => el.id === elementId ? data : el))
      if (selectedElement?.id === elementId) {
        setSelectedElement(data)
      }
    } catch (error) {
    }
  }

  const deleteWorldElement = async (elementId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', elementId)

      if (error) throw error

      setWorldElements(prev => prev.filter(el => el.id !== elementId))
      if (selectedElement?.id === elementId) {
        setSelectedElement(null)
      }
    } catch (error) {
    }
  }

  // Character editor functions
  const handleShowCharacterEditor = (character?: WorldElement) => {
    setEditingCharacter(character || null)
    setShowCharacterEditor(true)
  }

  const handleCharacterSave = async (character: Character) => {
    if (!project) return
    
    try {
      const supabase = createSupabaseClient()
      
      // Convert character data to world element format
      const elementData = {
        project_id: project.id,
        category: 'characters',
        name: character.name,
        description: character.description,
        attributes: {
          sections: character.sections,
          image_url: character.image_url
        },
        tags: []
      }

      if (editingCharacter) {
        // Update existing character
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...elementData, updated_at: new Date().toISOString() })
          .eq('id', editingCharacter.id)
          .select()
          .single()

        if (error) throw error
        
        setWorldElements(prev => prev.map(el => el.id === editingCharacter.id ? data : el))
        setSelectedElement(data)
      } else {
        // Create new character
        const { data, error } = await supabase
          .from('world_elements')
          .insert(elementData)
          .select()
          .single()

        if (error) throw error
        
        setWorldElements(prev => [...prev, data])
        setSelectedElement(data)
      }

      setShowCharacterEditor(false)
      setEditingCharacter(null)
    } catch (error) {
      console.error('Error saving character:', error)
    }
  }

  const handleCharacterCancel = () => {
    setShowCharacterEditor(false)
    setEditingCharacter(null)
  }

  const convertWorldElementToCharacter = (element: WorldElement): Character => {
    return {
      id: element.id,
      name: element.name,
      description: element.description,
      image_url: element.attributes?.image_url,
      sections: element.attributes?.sections || [],
      created_at: element.created_at,
      updated_at: element.updated_at
    }
  }

  const createFolder = async (category: string, name: string, parentFolderId?: string) => {
    if (!project) return
    
    try {
      const supabase = createSupabaseClient()
      const newFolder = {
        project_id: project.id,
        category,
        name,
        description: '',
        attributes: {},
        tags: [],
        is_folder: true,
        parent_folder_id: parentFolderId || null,
        sort_order: 0
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newFolder)
        .select()
        .single()

      if (error) throw error
      
      setWorldElements(prev => [...prev, data])
      setExpandedFolders(prev => [...prev, data.id])
    } catch (error) {
    }
  }

  // Chapter functions
  const createChapter = async () => {
    if (!project) return
    
    try {
      const supabase = createSupabaseClient()
      const nextChapterNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1
      const nextSortOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.sort_order || 0)) + 10 : 10
      
      const newChapter = {
        project_id: project.id,
        chapter_number: nextChapterNumber,
        title: `Chapter ${nextChapterNumber}`,
        content: '',
        status: 'draft' as const,
        notes: '',
        target_word_count: 2000,
        word_count: 0,
        sort_order: nextSortOrder,
        parent_folder_id: null,
        category: 'chapters'
      }

      const { data, error } = await supabase
        .from('project_chapters')
        .insert(newChapter)
        .select()
        .single()

      if (error) throw error
      
      setChapters(prev => [...prev, data])
      setSelectedChapter(data)
    } catch (error) {
    }
  }

  const updateChapter = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const supabase = createSupabaseClient()
      
      // Calculate word count if content is being updated
      if (updates.content !== undefined) {
        updates.word_count = updates.content.split(/\s+/).filter(word => word.length > 0).length
      }
      
      const { data, error } = await supabase
        .from('project_chapters')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', chapterId)
        .select()
        .single()

      if (error) throw error

      setChapters(prev => prev.map(ch => ch.id === chapterId ? data : ch))
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(data)
      }
    } catch (error) {
    }
  }

  const deleteChapter = async (chapterId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('project_chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error

      setChapters(prev => prev.filter(ch => ch.id !== chapterId))
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null)
      }
    } catch (error) {
    }
  }

  // Color management functions
  const availableColors = [
    { name: 'Blue', value: 'blue', hex: '#3B82F6', class: 'text-blue-500' },
    { name: 'Red', value: 'red', hex: '#EF4444', class: 'text-red-500' },
    { name: 'Green', value: 'green', hex: '#10B981', class: 'text-green-500' },
    { name: 'Purple', value: 'purple', hex: '#8B5CF6', class: 'text-purple-500' },
    { name: 'Yellow', value: 'yellow', hex: '#F59E0B', class: 'text-yellow-500' },
    { name: 'Pink', value: 'pink', hex: '#EC4899', class: 'text-pink-500' },
    { name: 'Indigo', value: 'indigo', hex: '#6366F1', class: 'text-indigo-500' },
    { name: 'Orange', value: 'orange', hex: '#F97316', class: 'text-orange-500' },
    { name: 'Teal', value: 'teal', hex: '#14B8A6', class: 'text-teal-500' },
    { name: 'Gray', value: 'gray', hex: '#6B7280', class: 'text-gray-500' },
    { name: 'Cyan', value: 'cyan', hex: '#06B6D4', class: 'text-cyan-500' },
    { name: 'Lime', value: 'lime', hex: '#84CC16', class: 'text-lime-500' },
    { name: 'Rose', value: 'rose', hex: '#F43F5E', class: 'text-rose-500' },
    { name: 'Violet', value: 'violet', hex: '#7C3AED', class: 'text-violet-500' },
    { name: 'Amber', value: 'amber', hex: '#F59E0B', class: 'text-amber-500' },
    { name: 'Emerald', value: 'emerald', hex: '#059669', class: 'text-emerald-500' },
  ]

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const updateElementColor = async (elementId: string, color: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .update({ icon_color: color })
        .eq('id', elementId)
        .select()
        .single()

      if (error) throw error

      setWorldElements(prev => prev.map(el => el.id === elementId ? { ...el, icon_color: color } : el))
      if (selectedElement?.id === elementId) {
        setSelectedElement(prev => prev ? { ...prev, icon_color: color } : null)
      }
    } catch (error) {
    }
  }

  const updateChapterColor = async (chapterId: string, color: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .update({ icon_color: color })
        .eq('id', chapterId)
        .select()
        .single()

      if (error) throw error

      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, icon_color: color } : ch))
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(prev => prev ? { ...prev, icon_color: color } : null)
      }
    } catch (error) {
    }
  }

  const getColorClass = (color: string) => {
    // If it's a hex color, return a style object instead
    if (color?.startsWith('#')) {
      return color
    }
    
    const colorMap: Record<string, string> = {
      blue: '#3B82F6',
      red: '#EF4444',
      green: '#10B981',
      purple: '#8B5CF6',
      yellow: '#F59E0B',
      pink: '#EC4899',
      indigo: '#6366F1',
      orange: '#F97316',
      teal: '#14B8A6',
      gray: '#6B7280',
      cyan: '#06B6D4',
      lime: '#84CC16',
      rose: '#F43F5E',
      violet: '#7C3AED',
      amber: '#F59E0B',
      emerald: '#059669',
      slate: '#64748B'
    }
    
    return colorMap[color] || colorMap.blue
  }

  // Handle color change for both chapters and world elements
  const handleColorChange = async (color: string) => {
    if (!colorPickerModal?.item) return
    
    try {
      if (colorPickerModal.type === 'chapter') {
        await updateChapterColor(colorPickerModal.item.id, color)
      } else {
        await updateElementColor(colorPickerModal.item.id, color)
      }
      
      // Close the modal
      setColorPickerModal(null)
    } catch (error) {
    }
  }

  const handleHexChange = (hex: string) => {
    // Remove # if present
    const cleanHex = hex.replace('#', '')
    
    // Only update if valid hex (6 characters, 0-9 a-f)
    if (/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      const rgb = hexToRgb('#' + cleanHex)
      if (rgb) {
        setColorInputs({ hex: cleanHex, r: rgb.r, g: rgb.g, b: rgb.b })
        setSelectedColor('#' + cleanHex)
      }
    } else if (cleanHex.length <= 6) {
      // Allow partial input
      setColorInputs(prev => ({ ...prev, hex: cleanHex }))
    }
  }

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...colorInputs, [component]: Math.max(0, Math.min(255, value)) }
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setColorInputs({ ...newRgb, hex: hex.slice(1) })
    setSelectedColor(hex)
  }

  const openColorPicker = (item: WorldElement | Chapter, type: 'element' | 'chapter') => {
    const currentColor = item.icon_color || 'blue'
    let initialHex = '#3B82F6'
    
    // Check if it's already a hex color
    if (currentColor.startsWith('#')) {
      initialHex = currentColor
    } else {
      // Find predefined color
      const colorData = availableColors.find(c => c.value === currentColor)
      initialHex = colorData?.hex || '#3B82F6'
    }
    
    const rgb = hexToRgb(initialHex)
    if (rgb) {
      setColorInputs({ hex: initialHex.slice(1), r: rgb.r, g: rgb.g, b: rgb.b })
      setSelectedColor(initialHex)
    }
    
    setColorPickerModal({ visible: true, item, type })
  }

  // Helper functions
  const getDefaultAttributes = (category: string): Record<string, any> => {
    const attributeMap: Record<string, Record<string, any>> = {
      characters: {
        age: '',
        appearance: '',
        personality: '',
        background: '',
        motivations: '',
        relationships: ''
      },
      locations: {
        geography: '',
        climate: '',
        population: '',
        culture: '',
        notable_features: '',
        history: ''
      },
      maps: {
        scale: '',
        legend: '',
        coordinates: '',
        boundaries: ''
      },
      research: {
        source: '',
        relevance: '',
        notes: '',
        references: ''
      },
      timeline: {
        date: '',
        duration: '',
        participants: '',
        consequences: ''
      },
      calendar: {
        date_system: '',
        seasons: '',
        holidays: '',
        events: ''
      },
      encyclopedia: {
        definition: '',
        etymology: '',
        usage: '',
        related_terms: ''
      }
    }
    
    return attributeMap[category] || {}
  }

  const getElementsForCategory = useCallback((category: string): (WorldElement | Chapter)[] => {
    if (category === 'chapters') {
      return chapters
    }
    return worldElements.filter(el => el.category === category && !el.is_folder)
  }, [chapters, worldElements])

  const getTotalItemsForCategory = (category: string): number => {
    if (category === 'chapters') {
      const chapterFolders = worldElements.filter(el => el.category === category && el.is_folder).length
      return chapterFolders + chapters.length
    }
    return worldElements.filter(el => el.category === category).length
  }

  const getFoldersForCategory = (category: string): WorldElement[] => {
    return worldElements.filter(el => el.category === category && el.is_folder)
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // Event handlers
  const handleBack = () => {
    router.push('/app/projects')
  }

  const clearSelectedElement = () => {
    setSelectedElement(null)
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  // Handle drag and drop
  // Function to cleanup and normalize sort_order values
  const normalizeSortOrders = async () => {
    const supabase = createSupabaseClient()
    
    // Group chapters by parent_folder_id
    const chapterGroups = chapters.reduce((groups, chapter) => {
      const key = chapter.parent_folder_id || 'root'
      if (!groups[key]) groups[key] = []
      groups[key].push(chapter)
      return groups
    }, {} as Record<string, Chapter[]>)
    
    
    // Normalize each group
    for (const [groupKey, groupChapters] of Object.entries(chapterGroups)) {
      
      // Sort by current sort_order, then by title as fallback
      const sorted = groupChapters.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return (a.sort_order || 0) - (b.sort_order || 0)
        }
        return a.title.localeCompare(b.title)
      })
      
      // Assign sequential sort_order values
      const updates: { id: string, sort_order: number, title: string }[] = []
      sorted.forEach((chapter, index) => {
        const newSortOrder = index + 1
        if (chapter.sort_order !== newSortOrder) {
          updates.push({
            id: chapter.id,
            sort_order: newSortOrder,
            title: chapter.title
          })
        }
      })
      
      if (updates.length > 0) {
        // Update database
        for (const update of updates) {
          const { error } = await supabase
            .from('project_chapters')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id)
            
          if (error) {
            console.error('Error updating sort_order for:', update.title, error)
          }
        }
        
        // Update local state
        setChapters(prev => {
          const updated = prev.map(ch => {
            const update = updates.find(u => u.id === ch.id)
            return update ? { ...ch, sort_order: update.sort_order } : ch
          })
          return updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        })
      } else {
        console.log(`No updates needed for group ${groupKey}`)
      }
    }
    
  }

  const handleMoveToRoot = async (categoryId: string) => {
    if (!draggedItem) {
      return
    }


    try {
      const supabase = createSupabaseClient()

      if (draggedItem.type === 'chapter') {
        // Move chapter to root level
        const { error } = await supabase
          .from('project_chapters')
          .update({ parent_folder_id: null })
          .eq('id', draggedItem.id)

        if (error) throw error

        setChapters(prev => prev.map(ch => 
          ch.id === draggedItem.id 
            ? { ...ch, parent_folder_id: undefined }
            : ch
        ))
      } else if (draggedItem.type === 'element') {
        // Move element to root level
        const { error } = await supabase
          .from('world_elements')
          .update({ parent_folder_id: null })
          .eq('id', draggedItem.id)

        if (error) throw error

        setWorldElements(prev => prev.map(el => 
          el.id === draggedItem.id 
            ? { ...el, parent_folder_id: undefined }
            : el
        ))
      }
    } catch (error) {
      console.error('Error moving item to root:', error)
    }
  }

  const handleDrop = async (targetId: string, targetType: 'folder' | 'element' | 'chapter') => {
    if (!draggedItem || draggedItem.id === targetId) {
      return
    }

    console.log('Handling drop:', { draggedItem, targetId, targetType })

    try {
      const supabase = createSupabaseClient()

      if (draggedItem.type === 'chapter' && targetType === 'folder') {
        // Move chapter to folder
        const { error } = await supabase
          .from('project_chapters')
          .update({ parent_folder_id: targetId })
          .eq('id', draggedItem.id)

        if (error) throw error

        setChapters(prev => prev.map(ch => 
          ch.id === draggedItem.id 
            ? { ...ch, parent_folder_id: targetId }
            : ch
        ))
      } else if (draggedItem.type === 'element' && targetType === 'folder') {
        // Move element to folder
        const { error } = await supabase
          .from('world_elements')
          .update({ parent_folder_id: targetId })
          .eq('id', draggedItem.id)

        if (error) throw error

        setWorldElements(prev => prev.map(el => 
          el.id === draggedItem.id 
            ? { ...el, parent_folder_id: targetId }
            : el
        ))
      } else if (draggedItem.type === 'chapter' && targetType === 'chapter') {
        // Reorder chapters - proper insertion logic
        
        const draggedChapter = chapters.find(ch => ch.id === draggedItem.id)
        const targetChapter = chapters.find(ch => ch.id === targetId)
        
        
        if (draggedChapter && targetChapter) {
          // Get all chapters in the same parent context (same folder or root level)
          const sameContext = chapters.filter(ch => 
            ch.parent_folder_id === draggedChapter.parent_folder_id
          ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          
          sameContext.forEach(ch => console.log(`  ${ch.title}: sort_order ${ch.sort_order}`))
          
          // Remove dragged item from list
          const withoutDragged = sameContext.filter(ch => ch.id !== draggedItem.id)
          withoutDragged.forEach(ch => console.log(`  ${ch.title}: sort_order ${ch.sort_order}`))
          
          // Find insertion point (insert BEFORE the target)
          const targetIndex = withoutDragged.findIndex(ch => ch.id === targetId)
          
          // Insert dragged item BEFORE the target position
          const newOrder = [...withoutDragged]
          newOrder.splice(targetIndex, 0, draggedChapter)
          
          newOrder.forEach((ch, idx) => console.log(`  ${idx}: ${ch.title} (was sort_order ${ch.sort_order})`))
          
          // Calculate new sort orders
          const updates: { id: string, sort_order: number, title: string }[] = []
          
          newOrder.forEach((chapter, index) => {
            const newSortOrder = index + 1
            if (chapter.sort_order !== newSortOrder) {
              updates.push({ 
                id: chapter.id, 
                sort_order: newSortOrder,
                title: chapter.title 
              })
            }
          })
          
          updates.forEach(update => console.log(`  ${update.title}: ${update.sort_order}`))
          
          if (updates.length > 0) {
            // Update database
            for (const update of updates) {
              const { error } = await supabase
                .from('project_chapters')
                .update({ sort_order: update.sort_order })
                .eq('id', update.id)
                
              if (error) {
                console.error('Database update error for chapter:', update.title, error)
                throw error
              }
            }

            // Update local state with new sort orders
            setChapters(prev => {
              const updated = prev.map(ch => {
                const update = updates.find(u => u.id === ch.id)
                return update ? { ...ch, sort_order: update.sort_order } : ch
              })
              // Re-sort by sort_order to reflect the change in UI
              const sorted = updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
             
              sorted.forEach(ch => console.log(`  ${ch.title}: sort_order ${ch.sort_order}`))
              return sorted
            })
            
          } else {
            console.log('No updates needed - items already in correct order')
          }
        }
      } else if (draggedItem.type === 'element' && targetType === 'element') {
        // Reorder elements - proper insertion logic
        const draggedElement = worldElements.find(el => el.id === draggedItem.id)
        const targetElement = worldElements.find(el => el.id === targetId)
        
        if (draggedElement && targetElement && draggedElement.category === targetElement.category) {
          const draggedSortOrder = draggedElement.sort_order || 0
          const targetSortOrder = targetElement.sort_order || 0
          
          
          // Get all elements in the same category and parent context
          const sameContext = worldElements.filter(el => 
            el.category === draggedElement.category && 
            el.parent_folder_id === draggedElement.parent_folder_id &&
            !el.is_folder
          ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          
          // Calculate new sort orders for proper insertion
          const updates: { id: string, sort_order: number }[] = []
          
          // Remove dragged item from list
          const withoutDragged = sameContext.filter(el => el.id !== draggedItem.id)
          
          // Find insertion point
          const targetIndex = withoutDragged.findIndex(el => el.id === targetId)
          
          // Insert dragged item at the target position
          let newOrder = [...withoutDragged]
          newOrder.splice(targetIndex, 0, draggedElement)
          
          // Assign new sort orders
          newOrder.forEach((element, index) => {
            const newSortOrder = index + 1
            if (element.sort_order !== newSortOrder) {
              updates.push({ id: element.id, sort_order: newSortOrder })
            }
          })
          
          
          // Update database
          for (const update of updates) {
            const { error } = await supabase
              .from('world_elements')
              .update({ sort_order: update.sort_order })
              .eq('id', update.id)
              
            if (error) {
              throw error
            }
          }

          // Update local state with new sort orders
          setWorldElements(prev => {
            const updated = prev.map(el => {
              const update = updates.find(u => u.id === el.id)
              return update ? { ...el, sort_order: update.sort_order } : el
            })
            // Re-sort by sort_order to reflect the change in UI
            return updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          })
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  // Helper function to render hierarchy with folders
  const renderCategoryHierarchy = (categoryId: string) => {
    if (categoryId === 'chapters') {
      // Render folders for chapters
      const folders = worldElements.filter(el => el.category === categoryId && el.is_folder && !el.parent_folder_id)
      const rootChapters = chapters.filter(ch => !ch.parent_folder_id)
      
      return (
        <>
          {folders.map(folder => (
            <div key={folder.id}>
              <button
                draggable
                onDragStart={() => setDraggedItem({ id: folder.id, type: 'folder', category: categoryId })}
                onDragEnd={() => setDraggedItem(null)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverItem(folder.id)
                }}
                onDragLeave={() => setDragOverItem(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (draggedItem) {
                    handleDrop(folder.id, 'folder')
                  }
                  setDragOverItem(null)
                }}
                onClick={() => toggleFolderExpansion(folder.id)}
                onContextMenu={(e) => handleElementContextMenu(e, 'folder', folder, categoryId)}
                className={`w-full text-left p-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                  dragOverItem === folder.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {expandedFolders.includes(folder.id) ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                  <Folder 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: getColorClass(folder.icon_color || 'blue') }}
                  />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
              
              {expandedFolders.includes(folder.id) && (
                <div className="ml-4 space-y-1">
                  {chapters.filter(ch => ch.parent_folder_id === folder.id).map(chapter => (
                    <button
                      key={chapter.id}
                      draggable
                      onDragStart={() => {
                  setDraggedItem({ id: chapter.id, type: 'chapter', category: categoryId })
                }}
                      onDragEnd={() => setDraggedItem(null)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverItem(chapter.id)
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault()
                        setDragOverItem(chapter.id)
                      }}
                      onDragLeave={() => setDragOverItem(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (draggedItem) {
                          handleDrop(chapter.id, 'chapter')
                        }
                        setDragOverItem(null)
                      }}
                      onClick={() => {
                        setSelectedChapter(chapter)
                        setActivePanel('chapters')
                      }}
                      onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter, categoryId)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedChapter?.id === chapter.id
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      } ${dragOverItem === chapter.id ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3" />
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{chapter.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {rootChapters.map(chapter => (
            <button
              key={chapter.id}
              draggable
              onDragStart={() => setDraggedItem({ id: chapter.id, type: 'chapter', category: categoryId })}
              onDragEnd={() => setDraggedItem(null)}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDragOverItem(chapter.id)
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                setDragOverItem(chapter.id)
              }}
              onDragLeave={() => setDragOverItem(null)}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (draggedItem) {
                  handleDrop(chapter.id, 'chapter')
                }
                setDragOverItem(null)
              }}
              onClick={() => {
                setSelectedChapter(chapter)
                setActivePanel('chapters')
              }}
              onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter, categoryId)}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                selectedChapter?.id === chapter.id
                  ? 'bg-orange-100 text-orange-800'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${dragOverItem === chapter.id ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <FileText 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ color: getColorClass(chapter.icon_color || 'blue') }}
                />
                <span className="truncate">{chapter.title}</span>
              </div>
            </button>
          ))}
        </>
      )
    } else {
      // Render folders for world elements
      const folders = worldElements.filter(el => el.category === categoryId && el.is_folder && !el.parent_folder_id)
      const rootElements = worldElements.filter(el => el.category === categoryId && !el.is_folder && !el.parent_folder_id)
      
      return (
        <>
          {folders.map(folder => (
            <div key={folder.id}>
              <button
                draggable
                onDragStart={() => setDraggedItem({ id: folder.id, type: 'folder', category: categoryId })}
                onDragEnd={() => setDraggedItem(null)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverItem(folder.id)
                }}
                onDragLeave={() => setDragOverItem(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (draggedItem) {
                    handleDrop(folder.id, 'folder')
                  }
                  setDragOverItem(null)
                }}
                onClick={() => toggleFolderExpansion(folder.id)}
                onContextMenu={(e) => handleElementContextMenu(e, 'folder', folder, categoryId)}
                className={`w-full text-left p-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                  dragOverItem === folder.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {expandedFolders.includes(folder.id) ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                  <Folder 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: getColorClass(folder.icon_color || 'blue') }}
                  />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
              
              {expandedFolders.includes(folder.id) && (
                <div className="ml-4 space-y-1">
                  {worldElements.filter(el => el.category === categoryId && !el.is_folder && el.parent_folder_id === folder.id).map(element => (
                    <button
                      key={element.id}
                      draggable
                      onDragStart={() => setDraggedItem({ id: element.id, type: 'element', category: categoryId })}
                      onDragEnd={() => setDraggedItem(null)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverItem(element.id)
                      }}
                      onDragLeave={() => setDragOverItem(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedItem) {
                          handleDrop(element.id, 'element')
                        }
                        setDragOverItem(null)
                      }}
                      onClick={() => {
                        setSelectedElement(element)
                        setActivePanel(categoryId)
                      }}
                      onContextMenu={(e) => handleElementContextMenu(e, 'element', element, categoryId)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedElement?.id === element.id
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      } ${dragOverItem === element.id ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3" />
                        <FileText 
                          className="w-4 h-4 flex-shrink-0" 
                          style={{ color: getColorClass(element.icon_color || 'blue') }}
                        />
                        <span className="truncate">{element.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {rootElements.map(element => (
            <button
              key={element.id}
              draggable
              onDragStart={() => setDraggedItem({ id: element.id, type: 'element', category: categoryId })}
              onDragEnd={() => setDraggedItem(null)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverItem(element.id)
              }}
              onDragLeave={() => setDragOverItem(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedItem) {
                  handleDrop(element.id, 'element')
                }
                setDragOverItem(null)
              }}
              onClick={() => {
                setSelectedElement(element)
                setActivePanel(categoryId)
              }}
              onContextMenu={(e) => handleElementContextMenu(e, 'element', element, categoryId)}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                selectedElement?.id === element.id
                  ? 'bg-orange-100 text-orange-800'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${dragOverItem === element.id ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <FileText 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ color: getColorClass(element.icon_color || 'blue') }}
                />
                <span className="truncate">{element.name}</span>
              </div>
            </button>
          ))}
        </>
      )
    }
  }

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, categoryId: string, categoryLabel: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      categoryId,
      categoryLabel
    })
  }

  const handleElementContextMenu = (e: React.MouseEvent, type: 'folder' | 'element' | 'chapter', item: WorldElement | Chapter, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setElementContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      item,
      category
    })
  }

  const closeContextMenus = () => {
    setContextMenu(null)
    setElementContextMenu(null)
    // Don't close color picker here - let it manage its own state
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    if (action === 'newItem') {
      // Set the active panel to show the new component interface
      setActivePanel(contextMenu.categoryId)
      // The component will handle the creation UI internally
    } else if (action === 'newFolder') {
      setInputModal({
        isOpen: true,
        type: 'folder',
        title: 'Create New Folder',
        description: 'Enter a name for the new folder to organize your elements.',
        placeholder: 'Enter folder name...',
        defaultValue: '',
        onConfirm: (name) => {
          createFolder(contextMenu.categoryId, name)
        }
      })
    }

    closeContextMenus()
  }

  // Click outside to close context menus
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenus()
    }

    if (contextMenu || elementContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu, elementContextMenu])

  // Navigate to a world element from chapter links
  const navigateToWorldElement = useCallback((elementId: string, category: string) => {
    // Switch to the appropriate panel
    setActivePanel(category)
    
    // Find and select the element
    const element = worldElements.find(el => el.id === elementId)
    if (element) {
      setSelectedElement(element)
    }
  }, [worldElements])

  const handleCharactersChange = useCallback(() => {
    if (project) {
      loadWorldElements(project.id)
    }
  }, [project])

  const handleChaptersChange = useCallback(() => {
    if (project) {
      loadChapters(project.id)
    }
  }, [project])

  const renderPanelContent = useCallback(() => {
    if (!project) return null

    switch (activePanel) {
      case 'dashboard':
        return (
          <div className="h-full bg-white p-6">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Dashboard</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Project Stats */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Chapters</h4>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {chapters.reduce((total, ch) => total + ch.word_count, 0).toLocaleString()} words
                  </div>
                  <div className="text-sm text-gray-600">
                    {chapters.length} chapters • Target: 50,000 words
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Characters</h4>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {getElementsForCategory('characters').length}
                  </div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Locations</h4>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {getElementsForCategory('locations').length}
                  </div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chapters.slice(0, 3).map(chapter => (
                      <div key={chapter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{chapter.title}</p>
                          <p className="text-sm text-gray-500">
                            {chapter.word_count} words • {chapter.status}
                          </p>
                        </div>
                        <Badge variant="secondary">{chapter.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'characters':
        return (
          <CharactersPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onCharactersChange={handleCharactersChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'locations':
        return (
          <LocationsPanel 
            projectId={project.id}
          />
        )

      case 'chapters':
        return (
          <ChaptersPanel 
            projectId={project.id}
            selectedChapter={selectedChapter}
            onChapterSelect={(chapter) => setSelectedChapter(chapter)}
            onNavigateToElement={navigateToWorldElement}
            triggerNewChapter={triggerNewChapter}
            onChaptersChange={handleChaptersChange}
          />
        )

      case 'research':
        return (
          <ResearchPanel 
            projectId={project.id}
          />
        )

      case 'maps':
        return (
          <MapsPanel 
            projectId={project.id}
          />
        )

      case 'timeline':
        return (
          <TimelinePanel 
            projectId={project.id}
          />
        )

      case 'calendar':
        return (
          <CalendarPanel 
            projectId={project.id}
          />
        )

      case 'encyclopedia':
        return (
          <EncyclopediaPanel 
            projectId={project.id}
          />
        )

      default:
        return (
          <div className="h-full bg-white p-6">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">Feature Coming Soon</h3>
              <p>This section is under development.</p>
            </div>
          </div>
        )
    }
  }, [activePanel, project, getElementsForCategory, chapters, worldElements.length, navigateToWorldElement, selectedElement, clearSelectedElement, handleCharactersChange, handleChaptersChange, triggerNewChapter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading novel...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Novel not found</h2>
          <p className="text-gray-600 mb-6">
            The novel you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Button onClick={handleBack} className="bg-orange-500 hover:bg-orange-600 text-white">
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col max-h-screen`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 truncate">
                  {project.title}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  {project.genre} • {project.format}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {SIDEBAR_OPTIONS.map((option) => {
            const IconComponent = option.icon
            const totalItems = getTotalItemsForCategory(option.id)
            const isExpanded = expandedCategories.includes(option.id)
            const canExpand = option.hasAdd && totalItems > 0
            
            return (
              <div key={option.id} className="group">
                <div className={`flex items-center rounded-lg transition-all duration-200 ${
                  (canExpand && isExpanded) || (!canExpand && activePanel === option.id)
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <button
                    onClick={() => {
                      if (canExpand) {
                        toggleCategoryExpansion(option.id)
                      } else {
                        if (option.id === 'characters') {
                          clearSelectedElement() // Clear selected element when navigating to characters panel
                        }
                        setActivePanel(option.id)
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, option.id, option.label)}
                    className="flex-1 flex items-center gap-3 px-3 py-2 text-left transition-colors"
                    title={sidebarOpen ? undefined : option.label}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 text-${option.color}-500`} />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{option.label}</span>
                    )}
                    {sidebarOpen && totalItems > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {totalItems}
                      </Badge>
                    )}
                  </button>
                  
                  {sidebarOpen && (
                    <div className="flex items-center gap-1 pr-2">
                      {option.hasAdd && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            // Clear selected element if navigating to characters
                            if (option.id === 'characters') {
                              clearSelectedElement()
                            }
                            // Set the active panel to show the new component interface
                            setActivePanel(option.id)
                            
                            // For chapters, trigger creation modal
                            if (option.id === 'chapters') {
                              setTriggerNewChapter(true)
                              // Reset trigger after a brief moment
                              setTimeout(() => setTriggerNewChapter(false), 100)
                            }
                            
                            // The component will handle the creation UI internally
                          }}
                          className="p-1 text-gray-600 hover:text-green-600 rounded transition-colors"
                          title={`Add new ${option.label.slice(0, -1).toLowerCase()}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                      {canExpand && (
                        <div className="p-1">
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-600" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Category Elements */}
                {sidebarOpen && option.hasAdd && totalItems > 0 && isExpanded && (
                  <div 
                    className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-1 min-h-[60px] relative"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (draggedItem && draggedItem.category === option.id) {
                        handleMoveToRoot(option.id)
                      }
                      setDragOverItem(null)
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none text-xs text-gray-400 italic flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      Drop here to move out of folders
                    </div>
                    {renderCategoryHierarchy(option.id)}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
                
                <div className="h-6 w-px bg-gray-300" />
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {project.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {SIDEBAR_OPTIONS.find(p => p.id === activePanel)?.label || 'Novel Editor'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Panel Content */}
        <main className="flex-1 overflow-hidden">
          {renderPanelContent()}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => handleContextMenuAction('newItem')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New {contextMenu.categoryLabel.slice(0, -1)}
          </button>
          <button
            onClick={() => handleContextMenuAction('newFolder')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            New Folder
          </button>
        </div>
      )}
      
      {/* Element Context Menu */}
      {elementContextMenu?.visible && elementContextMenu.item && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48"
          style={{
            left: elementContextMenu.x,
            top: elementContextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {elementContextMenu.type === 'folder' ? (
            // Folder context menu
            <>
              <button
                onClick={() => {
                  if (elementContextMenu.category === 'characters') {
                    // Set active panel to characters to show the new component interface
                    setActivePanel('characters')
                  } else if (elementContextMenu.category === 'chapters') {
                    // Set active panel to chapters and trigger new chapter modal  
                    setActivePanel('chapters')
                    setTriggerNewChapter(true)
                    // Reset trigger after a brief moment
                    setTimeout(() => setTriggerNewChapter(false), 100)
                  } else {
                    // Set active panel to the respective category to show the new component interface
                    setActivePanel(elementContextMenu.category)
                  }
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New {
                  elementContextMenu.category === 'chapters' ? 'Chapter' : 
                  elementContextMenu.category === 'characters' ? 'Character' : 
                  elementContextMenu.category.slice(0, -1)
                }
              </button>
              
              <button
                onClick={() => {
                  setInputModal({
                    isOpen: true,
                    type: 'folder',
                    title: 'Create New Folder',
                    description: 'Enter a name for the new folder to organize your elements.',
                    placeholder: 'Enter folder name...',
                    defaultValue: '',
                    onConfirm: (name) => {
                      createFolder(elementContextMenu.category, name)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  setInputModal({
                    isOpen: true,
                    type: 'rename',
                    title: 'Rename Folder',
                    description: 'Enter a new name for this folder.',
                    placeholder: 'Enter folder name...',
                    defaultValue: element.name,
                    onConfirm: (newName) => {
                      if (newName !== element.name) {
                        updateWorldElement(element.id, { name: newName })
                      }
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Folder
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus() // Close context menu first
                  openColorPicker(elementContextMenu.item!, 'element')
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus()
                  // Export functionality would go here
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Elements
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  setDeleteModal({
                    isOpen: true,
                    type: 'folder',
                    title: 'Delete Folder',
                    itemName: element.name,
                    onConfirm: () => {
                      deleteWorldElement(element.id)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : elementContextMenu.type === 'chapter' ? (
            // Chapter context menu
            <>
              <button
                onClick={() => {
                  // Set active panel to chapters and trigger new chapter modal
                  setActivePanel('chapters')
                  setTriggerNewChapter(true)
                  // Reset trigger after a brief moment
                  setTimeout(() => setTriggerNewChapter(false), 100)
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chapter
              </button>
              
              <button
                onClick={() => {
                  setInputModal({
                    isOpen: true,
                    type: 'folder',
                    title: 'Create New Folder',
                    description: 'Enter a name for the new folder to organize your elements.',
                    placeholder: 'Enter folder name...',
                    defaultValue: '',
                    onConfirm: (name) => {
                      createFolder(elementContextMenu.category, name)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  setInputModal({
                    isOpen: true,
                    type: 'rename',
                    title: 'Rename Element',
                    description: 'Enter a new name for this element.',
                    placeholder: 'Enter new name...',
                    defaultValue: chapter.title,
                    onConfirm: (newTitle) => {
                      if (newTitle !== chapter.title) {
                        updateChapter(chapter.id, { title: newTitle })
                      }
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Element
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus() // Close context menu first
                  openColorPicker(elementContextMenu.item!, 'chapter')
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  // Duplicate chapter logic would go here
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate Element
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus()
                  // Export functionality would go here
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Element
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  window.open(`/novels/${chapter.project_id}/chapters/${chapter.id}`, '_blank')
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open In New Tab
              </button>
              
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  setDeleteModal({
                    isOpen: true,
                    type: 'chapter',
                    title: 'Delete Chapter',
                    itemName: chapter.title,
                    onConfirm: () => {
                      deleteChapter(chapter.id)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Element
              </button>
            </>
          ) : (
            // Element (character, location, etc.) context menu
            <>
              <button
                onClick={() => {
                  // Set active panel to the respective category to show the new component interface
                  setActivePanel(elementContextMenu.category)
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {elementContextMenu.category === 'characters' ? 'New Character' : `New ${elementContextMenu.category.slice(0, -1)}`}
              </button>
              
              <button
                onClick={() => {
                  setInputModal({
                    isOpen: true,
                    type: 'folder',
                    title: 'Create New Folder',
                    description: 'Enter a name for the new folder to organize your elements.',
                    placeholder: 'Enter folder name...',
                    defaultValue: '',
                    onConfirm: (name) => {
                      createFolder(elementContextMenu.category, name)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  setInputModal({
                    isOpen: true,
                    type: 'rename',
                    title: 'Rename Element',
                    description: 'Enter a new name for this element.',
                    placeholder: 'Enter new name...',
                    defaultValue: element.name,
                    onConfirm: (newName) => {
                      if (newName !== element.name) {
                        updateWorldElement(element.id, { name: newName })
                      }
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Element
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus() // Close context menu first
                  openColorPicker(elementContextMenu.item!, 'element')
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  // Duplicate element logic would go here
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate Element
              </button>
              
              <button
                onClick={() => {
                  closeContextMenus()
                  // Export functionality would go here
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Element
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  window.open(`/novels/${element.project_id}/elements/${element.id}`, '_blank')
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open In New Tab
              </button>
              
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  setDeleteModal({
                    isOpen: true,
                    type: 'element',
                    title: 'Delete Element',
                    itemName: element.name,
                    onConfirm: () => {
                      deleteWorldElement(element.id)
                    }
                  })
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Element
              </button>
            </>
          )}
        </div>
      )}

      {/* Color Picker Modal */}
      {colorPickerModal?.visible && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Choose Icon Color
                </h3>
                <button
                  onClick={() => setColorPickerModal(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Color Preview */}
              <div className="relative">
                <div 
                  className="w-full h-24 rounded-xl shadow-inner border border-gray-200/50 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}e6 50%, ${selectedColor}cc 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"></div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-md">
                    <span className="text-white text-xs font-mono">{selectedColor}</span>
                  </div>
                </div>
              </div>
              
              {/* Color Swatches */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Quick Colors</p>
                <div className="grid grid-cols-8 gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => {
                        const rgb = hexToRgb(color.hex)
                        if (rgb) {
                          setColorInputs({ hex: color.hex.slice(1), r: rgb.r, g: rgb.g, b: rgb.b })
                          setSelectedColor(color.hex)
                        }
                      }}
                      className={`group relative w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                        selectedColor === color.hex 
                          ? 'border-gray-900 shadow-lg scale-105' 
                          : 'border-gray-200/60 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.hex && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Inputs */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Custom Color</p>
                
                {/* Hex Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hex Code</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-mono">#</div>
                    <Input
                      type="text"
                      value={colorInputs.hex}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="pl-8 font-mono uppercase bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      maxLength={6}
                      placeholder="4E2AE4"
                    />
                  </div>
                </div>

                {/* RGB Inputs */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">RGB Values</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Red</div>
                      <Input
                        type="number"
                        value={colorInputs.r}
                        onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                        min="0"
                        max="255"
                        className="text-center font-mono bg-red-50/50 border-red-200 focus:bg-white"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Green</div>
                      <Input
                        type="number"
                        value={colorInputs.g}
                        onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                        min="0"
                        max="255"
                        className="text-center font-mono bg-green-50/50 border-green-200 focus:bg-white"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Blue</div>
                      <Input
                        type="number"
                        value={colorInputs.b}
                        onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                        min="0"
                        max="255"
                        className="text-center font-mono bg-blue-50/50 border-blue-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setColorPickerModal(null)}
                className="flex-1 bg-white hover:bg-gray-50 border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleColorChange(selectedColor)
                }}
                className="flex-1 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                style={{ 
                  background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}dd 100%)`,
                }}
              >
                Apply Color
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Modal */}
      <InputModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={inputModal.onConfirm}
        title={inputModal.title}
        description={inputModal.description}
        placeholder={inputModal.placeholder}
        defaultValue={inputModal.defaultValue}
        type={inputModal.type}
        confirmText={inputModal.type === 'folder' ? 'Create Folder' : 'Rename'}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        type={deleteModal.type}
        confirmText={deleteModal.type === 'folder' ? 'Delete Folder' : deleteModal.type === 'chapter' ? 'Delete Chapter' : 'Delete Element'}
      />
    </div>
  )
}
