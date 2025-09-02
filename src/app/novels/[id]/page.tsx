'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, BookOpen, Users, Save, Settings, Eye, FileText, Map, Clock, 
  Target, MapPin, User, Calendar, Search, Bookmark, Plus, Edit3, Trash2, 
  ChevronDown, ChevronRight, Folder, Edit, Palette, Globe, Shield, Heart, 
  Brain, Zap, Upload, Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'

// Type definitions
interface NovelPageProps {
  params: Promise<{
    id: string
  }>
}

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

export default function NovelPage({ params }: NovelPageProps) {
  const router = useRouter()
  
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['characters', 'chapters', 'locations'])
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
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

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const resolvedParams = await params
        console.log('Loading project with ID:', resolvedParams.id)
        
        // Fetch project
        const response = await fetch(`/api/projects/${resolvedParams.id}`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            setProject(null)
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const projectData = await response.json()
        console.log('Successfully loaded project:', projectData)
        setProject(projectData)
        
        // Load world elements and chapters
        await Promise.all([
          loadWorldElements(resolvedParams.id),
          loadChapters(resolvedParams.id)
        ])
        
      } catch (error) {
        console.error('Error loading project:', error)
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
      console.log('Loaded world elements:', data)
      setWorldElements(data || [])
    } catch (error) {
      console.error('Error loading world elements:', error)
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
      console.log('Loaded chapters:', data)
      
      // Ensure chapters have category field
      const chaptersWithCategory = (data || []).map(chapter => ({
        ...chapter,
        category: chapter.category || 'chapters'
      }))
      
      setChapters(chaptersWithCategory)
    } catch (error) {
      console.error('Error loading chapters:', error)
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
      console.error('Error creating world element:', error)
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
      console.error('Error updating world element:', error)
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
      console.error('Error deleting world element:', error)
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
      console.error('Error creating folder:', error)
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
      console.error('Error creating chapter:', error)
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
      console.error('Error updating chapter:', error)
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
      console.error('Error deleting chapter:', error)
    }
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

  const getElementsForCategory = (category: string): (WorldElement | Chapter)[] => {
    if (category === 'chapters') {
      return chapters
    }
    return worldElements.filter(el => el.category === category && !el.is_folder)
  }

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

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
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
                onClick={() => toggleFolderExpansion(folder.id)}
                onContextMenu={(e) => handleElementContextMenu(e, 'folder', folder, categoryId)}
                className="w-full text-left p-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedFolders.includes(folder.id) ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
              
              {expandedFolders.includes(folder.id) && (
                <div className="ml-4 space-y-1">
                  {chapters.filter(ch => ch.parent_folder_id === folder.id).map(chapter => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setSelectedChapter(chapter)
                        setActivePanel('chapters')
                      }}
                      onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter, categoryId)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedChapter?.id === chapter.id
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
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
              onClick={() => {
                setSelectedChapter(chapter)
                setActivePanel('chapters')
              }}
              onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter, categoryId)}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                selectedChapter?.id === chapter.id
                  ? 'bg-orange-100 text-orange-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" />
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
                onClick={() => toggleFolderExpansion(folder.id)}
                onContextMenu={(e) => handleElementContextMenu(e, 'folder', folder, categoryId)}
                className="w-full text-left p-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedFolders.includes(folder.id) ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
              
              {expandedFolders.includes(folder.id) && (
                <div className="ml-4 space-y-1">
                  {worldElements.filter(el => el.category === categoryId && !el.is_folder && el.parent_folder_id === folder.id).map(element => (
                    <button
                      key={element.id}
                      onClick={() => {
                        setSelectedElement(element)
                        setActivePanel(categoryId)
                      }}
                      onContextMenu={(e) => handleElementContextMenu(e, 'element', element, categoryId)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedElement?.id === element.id
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3" />
                        <FileText className="w-4 h-4 flex-shrink-0" />
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
              onClick={() => {
                setSelectedElement(element)
                setActivePanel(categoryId)
              }}
              onContextMenu={(e) => handleElementContextMenu(e, 'element', element, categoryId)}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                selectedElement?.id === element.id
                  ? 'bg-orange-100 text-orange-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" />
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
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    if (action === 'newItem') {
      if (contextMenu.categoryId === 'chapters') {
        createChapter()
      } else {
        const name = prompt(`Enter ${contextMenu.categoryLabel.slice(0, -1)} name:`)
        if (name) {
          createWorldElement(contextMenu.categoryId, name)
        }
      }
    } else if (action === 'newFolder') {
      const name = prompt('Enter folder name:')
      if (name) {
        createFolder(contextMenu.categoryId, name)
      }
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

  const renderPanelContent = () => {
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

      case 'chapters':
      case 'characters':
      case 'locations':
      case 'maps':
      case 'research':
      case 'timeline':
      case 'calendar':
      case 'encyclopedia':
        const categoryElements = getElementsForCategory(activePanel)
        return (
          <div className="h-full bg-white">
            <div className="flex h-full">
              {/* Element List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {SIDEBAR_OPTIONS.find(opt => opt.id === activePanel)?.label}
                    </h3>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (activePanel === 'chapters') {
                          createChapter()
                        } else {
                          const name = prompt(`Enter ${activePanel.slice(0, -1)} name:`)
                          if (name) createWorldElement(activePanel, name)
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {categoryElements.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="mb-2">No {activePanel} yet</div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (activePanel === 'chapters') {
                            createChapter()
                          } else {
                            const name = prompt(`Enter ${activePanel.slice(0, -1)} name:`)
                            if (name) createWorldElement(activePanel, name)
                          }
                        }}
                      >
                        Create first {activePanel.slice(0, -1)}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {categoryElements
                        .filter(item => {
                          const searchText = searchTerm.toLowerCase()
                          if ('chapter_number' in item) {
                            const chapter = item as Chapter
                            return chapter.title.toLowerCase().includes(searchText) ||
                                   chapter.content.toLowerCase().includes(searchText)
                          } else {
                            const element = item as WorldElement
                            return element.name.toLowerCase().includes(searchText) ||
                                   element.description.toLowerCase().includes(searchText)
                          }
                        })
                        .map((item) => {
                          const isChapter = 'chapter_number' in item
                          const isSelected = isChapter 
                            ? selectedChapter?.id === item.id
                            : selectedElement?.id === item.id
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (isChapter) {
                                  setSelectedChapter(item as Chapter)
                                  setSelectedElement(null)
                                } else {
                                  setSelectedElement(item as WorldElement)
                                  setSelectedChapter(null)
                                }
                              }}
                              onContextMenu={(e) => handleElementContextMenu(e, isChapter ? 'chapter' : 'element', item, activePanel)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="font-medium">
                                {isChapter ? (item as Chapter).title : (item as WorldElement).name}
                              </div>
                              {isChapter ? (
                                <div className="text-sm text-gray-500 mt-1">
                                  Chapter {(item as Chapter).chapter_number} • {(item as Chapter).word_count}/{(item as Chapter).target_word_count} words • {(item as Chapter).status}
                                </div>
                              ) : (
                                (item as WorldElement).description && (
                                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {(item as WorldElement).description}
                                  </div>
                                )
                              )}
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details Panel */}
              <div className="flex-1 flex flex-col">
                {selectedChapter && activePanel === 'chapters' ? (
                  // Chapter details
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedChapter.title}</h2>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newTitle = prompt('Edit title:', selectedChapter.title)
                            if (newTitle && newTitle !== selectedChapter.title) {
                              updateChapter(selectedChapter.id, { title: newTitle })
                            }
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit Title
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${selectedChapter.title}?`)) {
                              deleteChapter(selectedChapter.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Number
                          </label>
                          <Input
                            type="number"
                            value={selectedChapter.chapter_number}
                            onChange={(e) => updateChapter(selectedChapter.id, { chapter_number: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Words
                          </label>
                          <Input
                            type="number"
                            value={selectedChapter.target_word_count}
                            onChange={(e) => updateChapter(selectedChapter.id, { target_word_count: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={selectedChapter.status}
                            onChange={(e) => updateChapter(selectedChapter.id, { status: e.target.value as Chapter['status'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content
                        </label>
                        <Textarea
                          value={selectedChapter.content}
                          onChange={(e) => updateChapter(selectedChapter.id, { content: e.target.value })}
                          placeholder="Write your chapter content here..."
                          className="w-full h-64 font-mono"
                        />
                        <div className="text-sm text-gray-500 mt-2">
                          Current word count: {selectedChapter.word_count} / Target: {selectedChapter.target_word_count}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <Textarea
                          value={selectedChapter.notes}
                          onChange={(e) => updateChapter(selectedChapter.id, { notes: e.target.value })}
                          placeholder="Chapter notes, plot points, reminders..."
                          className="w-full h-24"
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedElement && activePanel !== 'chapters' ? (
                  // World element details
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedElement.name}</h2>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newName = prompt('Edit name:', selectedElement.name)
                            if (newName && newName !== selectedElement.name) {
                              updateWorldElement(selectedElement.id, { name: newName })
                            }
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete ${selectedElement.name}?`)) {
                              deleteWorldElement(selectedElement.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <Textarea
                          value={selectedElement.description}
                          onChange={(e) => updateWorldElement(selectedElement.id, { description: e.target.value })}
                          placeholder="Enter description..."
                          className="w-full h-24"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <Input
                          value={selectedElement.tags.join(', ')}
                          onChange={(e) => {
                            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            updateWorldElement(selectedElement.id, { tags })
                          }}
                          placeholder="Enter tags separated by commas..."
                          className="w-full"
                        />
                      </div>
                      
                      {/* Attributes */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Attributes</h3>
                        {Object.entries(selectedElement.attributes).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                              {key.replace(/_/g, ' ')}
                            </label>
                            <Textarea
                              value={value as string}
                              onChange={(e) => {
                                const newAttributes = {
                                  ...selectedElement.attributes,
                                  [key]: e.target.value
                                }
                                updateWorldElement(selectedElement.id, { attributes: newAttributes })
                              }}
                              placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                              className="w-full h-20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="mb-4">
                        <FileText className="w-16 h-16 mx-auto text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        No {activePanel === 'chapters' ? 'chapter' : activePanel.slice(0, -1)} selected
                      </h3>
                      <p className="text-sm">
                        Select a {activePanel === 'chapters' ? 'chapter' : activePanel.slice(0, -1)} from the list to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
  }

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
                            if (option.id === 'chapters') {
                              createChapter()
                            } else {
                              const name = prompt(`Enter ${option.label.slice(0, -1)} name:`)
                              if (name) createWorldElement(option.id, name)
                            }
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
                  <div className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-1">
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
          {elementContextMenu.type === 'chapter' ? (
            <>
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  setSelectedChapter(chapter)
                  setActivePanel('chapters')
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Chapter
              </button>
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  if (confirm(`Delete ${chapter.title}?`)) {
                    deleteChapter(chapter.id)
                  }
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Chapter
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  const newName = prompt('Edit name:', element.name)
                  if (newName && newName !== element.name) {
                    updateWorldElement(element.id, { name: newName })
                  }
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={() => {
                  const element = elementContextMenu.item as WorldElement
                  if (confirm(`Delete ${element.name}?`)) {
                    deleteWorldElement(element.id)
                  }
                  closeContextMenus()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
