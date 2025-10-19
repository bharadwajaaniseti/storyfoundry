'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save,
  Download,
  Share2,
  Settings,
  Users,
  Film,
  FileText,
  Clock,
  ChevronDown,
  Type,
  MessageSquare,
  AlignLeft,
  Plus,
  Trash2,
  Copy,
  Eye,
  Zap,
  BarChart3,
  Calendar,
  Timer,
  MapPin,
  Lightbulb,
  BookOpen,
  Sparkles,
  Grid3x3,
  List,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Layout,
  Printer
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Project {
  id: string
  title: string
  logline: string
  synopsis?: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  owner_id: string
  created_at: string
  updated_at: string
}

interface Scene {
  id: string
  scene_number: number
  heading: string
  content: string
  page_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  characters: string[]
  location: string
  time_of_day: string
  estimated_duration: number // in seconds
  color_tag?: string
  created_at: string
  updated_at: string
}

interface ScreenplayEditorProps {
  projectId: string
  initialProject?: Project
  userRole?: 'owner' | 'collaborator' | 'viewer'
  permissions?: {
    canEdit: boolean
    canComment: boolean
    canApprove: boolean
  }
  onAddElementCallback?: (callback: (type: string) => void) => void
  onStatsUpdate?: (stats: any) => void
  onPreviewModeChange?: (callback: (isPreview: boolean) => void) => void
  hideSidebar?: boolean
}

type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'

interface ScreenplayElement {
  id: string
  type: ElementType
  content: string
  sceneId?: string
  metadata?: {
    characterName?: string
    mood?: string
    emphasis?: string
  }
}

interface SceneCard {
  id: string
  sceneNumber: number
  heading: string
  description: string
  characters: string[]
  location: string
  timeOfDay: string
  duration: number
  status: 'draft' | 'review' | 'locked'
  colorTag?: string
  notes?: string
}

export default function ScreenplayEditor({ 
  projectId, 
  initialProject,
  userRole = 'owner',
  permissions = { canEdit: true, canComment: true, canApprove: true },
  onAddElementCallback,
  onStatsUpdate,
  onPreviewModeChange,
  hideSidebar = false
}: ScreenplayEditorProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(initialProject || null)
  const [activeTab, setActiveTab] = useState('write')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentScene, setCurrentScene] = useState(1)
  const [elements, setElements] = useState<ScreenplayElement[]>([
    { id: '1', type: 'scene_heading', content: 'INT. COFFEE SHOP - DAY' }
  ])
  const [currentElement, setCurrentElement] = useState<ElementType>('action')
  const [sceneCards, setSceneCards] = useState<SceneCard[]>([])
  const [viewMode, setViewMode] = useState<'write' | 'cards' | 'outline'>('write')
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSceneCard, setSelectedSceneCard] = useState<string | null>(null)
  const [showFormatting, setShowFormatting] = useState(!hideSidebar)
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null)
  const [focusedElementIndex, setFocusedElementIndex] = useState<number | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Load screenplay from database
  useEffect(() => {
    const loadScreenplay = async () => {
      try {
        const supabase = createSupabaseClient()
        
        // Try loading from new screenplay_elements table first
        const { data: elementsData, error: elementsError } = await supabase
          .from('screenplay_elements')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true })
        
        if (elementsData && elementsData.length > 0) {
          // Convert database format to component format
          const loadedElements = elementsData.map(el => ({
            id: el.id,
            type: el.element_type as ElementType,
            content: el.content,
            metadata: el.metadata
          }))
          setElements(loadedElements)
        } else {
          // Fallback: try loading from project_content (JSON format)
          const { data: contentData } = await supabase
            .from('project_content')
            .select('content')
            .eq('project_id', projectId)
            .single()
          
          if (contentData?.content) {
            try {
              const parsedElements = JSON.parse(contentData.content)
              if (Array.isArray(parsedElements) && parsedElements.length > 0) {
                setElements(parsedElements)
              }
            } catch (e) {
              console.error('Error parsing screenplay content:', e)
            }
          }
        }
      } catch (error) {
        console.error('Error loading screenplay:', error)
      }
    }

    loadScreenplay()
  }, [projectId])

  // Auto-resize all textareas when elements change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea')
      textareas.forEach(textarea => {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      })
    }, 0)
  }, [elements])

  // Handle Ctrl+S / Cmd+S to save (prevent browser default)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault() // Prevent browser's save dialog
        if (permissions.canEdit) {
          handleSave()
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [permissions.canEdit, elements]) // Include elements so handleSave has latest data

  // Navigate to scene in Write tab
  const navigateToScene = useCallback((sceneId: string, sceneNumber: number) => {
    // Switch to write tab
    setActiveTab('write')
    
    // Find the scene heading element by the scene card ID (which is now the element ID)
    const targetScene = elements.find(el => el.id === sceneId)
    
    if (targetScene) {
      // Highlight the scene
      setHighlightedElementId(targetScene.id)
      
      // Scroll to the element after a short delay to ensure tab switch completes
      setTimeout(() => {
        const elementRef = elementRefs.current[targetScene.id]
        if (elementRef) {
          elementRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedElementId(null)
          }, 3000)
        }
      }, 100)
    }
  }, [elements])

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (permissions.canEdit) {
        handleSave()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSave)
  }, [elements, permissions.canEdit])

  const handleSave = async () => {
    if (!permissions.canEdit) return

    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      
      // Prepare elements for database (with sortOrder)
      const elementsToSave = elements.map((el, index) => ({
        type: el.type,
        content: el.content,
        characterName: el.type === 'character' ? el.content : null,
        metadata: el.metadata || {},
        sortOrder: index
      }))
      
      console.log('Saving screenplay elements:', {
        projectId,
        elementCount: elementsToSave.length,
        sample: elementsToSave[0]
      })
      
      // Try saving using the new screenplay_elements table
      const { data, error } = await supabase.rpc('save_screenplay_elements', {
        p_project_id: projectId,
        p_elements: elementsToSave
      })

      if (error) {
        console.error('Error saving to screenplay_elements:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Fallback: save to project_content as JSON (backward compatibility)
        console.log('Falling back to project_content (JSON storage)...')
        const { error: fallbackError } = await supabase
          .from('project_content')
          .upsert({
            project_id: projectId,
            content: JSON.stringify(elements),
            updated_at: new Date().toISOString()
          })
        
        if (fallbackError) {
          console.error('Fallback save also failed:', fallbackError)
          throw fallbackError
        } else {
          console.log('Saved to project_content successfully (fallback)')
        }
      } else {
        console.log('Saved to screenplay_elements successfully:', data)
      }
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving screenplay:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addElement = useCallback((type: ElementType) => {
    // If there's a focused element, change its type instead of adding new
    if (focusedElementIndex !== null) {
      setElements(prev => {
        if (prev[focusedElementIndex]) {
          const newElements = [...prev]
          newElements[focusedElementIndex].type = type
          
          // Keep focus on the element
          setTimeout(() => {
            const elementId = prev[focusedElementIndex].id
            const elementDiv = elementRefs.current[elementId]
            if (elementDiv) {
              const textarea = elementDiv.querySelector('textarea')
              if (textarea) {
                textarea.focus()
              }
            }
          }, 50)
          
          return newElements
        }
        return prev
      })
      setCurrentElement(type)
    } else {
      // No focused element, add new one
      const newElement: ScreenplayElement = {
        id: generateId(),
        type,
        content: ''
      }
      setElements(prev => [...prev, newElement])
      setCurrentElement(type)
      
      // Focus the new element after it's rendered
      setTimeout(() => {
        const newElementDiv = elementRefs.current[newElement.id]
        if (newElementDiv) {
          const textarea = newElementDiv.querySelector('textarea')
          if (textarea) {
            textarea.focus()
          }
        }
      }, 50)
    }
  }, [focusedElementIndex])

  const updateElement = (index: number, content: string) => {
    const newElements = [...elements]
    newElements[index].content = content
    setElements(newElements)
  }

  const getElementStyle = (type: ElementType) => {
    switch (type) {
      case 'scene_heading':
        return 'font-bold uppercase tracking-wide'
      case 'action':
        return 'text-left'
      case 'character':
        return 'text-center font-semibold uppercase tracking-wide mt-4'
      case 'dialogue':
        return 'text-center max-w-md mx-auto'
      case 'parenthetical':
        return 'text-center italic text-gray-600 max-w-sm mx-auto'
      case 'transition':
        return 'text-right font-semibold uppercase tracking-wide'
      default:
        return ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number, currentType: ElementType) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Determine next element type based on current type
      let nextType: ElementType = 'action'
      
      if (currentType === 'scene_heading') {
        nextType = 'action'
      } else if (currentType === 'action') {
        // Check if content looks like a character name (all caps)
        nextType = 'character'
      } else if (currentType === 'character') {
        nextType = 'dialogue'
      } else if (currentType === 'dialogue') {
        nextType = 'action'
      }

      // Insert new element after current one
      const newElements = [...elements]
      newElements.splice(index + 1, 0, { 
        id: generateId(),
        type: nextType, 
        content: '' 
      })
      setElements(newElements)
      
      // Focus on the new element
      setTimeout(() => {
        const inputs = document.querySelectorAll('textarea')
        if (inputs[index + 1]) {
          (inputs[index + 1] as HTMLTextAreaElement).focus()
        }
      }, 0)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      
      // Cycle through element types
      const types: ElementType[] = ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition']
      const currentIndex = types.indexOf(currentType)
      const nextIndex = (currentIndex + 1) % types.length
      
      const newElements = [...elements]
      newElements[index].type = types[nextIndex]
      setElements(newElements)
    }
  }

  const exportScreenplay = () => {
    // Create a formatted screenplay document
    const screenplayText = elements.map(el => {
      switch (el.type) {
        case 'scene_heading':
          return `\n${el.content.toUpperCase()}\n`
        case 'action':
          return `\n${el.content}\n`
        case 'character':
          return `\n                    ${el.content.toUpperCase()}\n`
        case 'dialogue':
          return `              ${el.content}\n`
        case 'parenthetical':
          return `                (${el.content})\n`
        case 'transition':
          return `\n                                        ${el.content.toUpperCase()}\n`
        default:
          return el.content
      }
    }).join('')

    // Download as text file
    const blob = new Blob([screenplayText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.title?.replace(/\s+/g, '_') || 'screenplay'}_screenplay.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Extract scenes from elements
  const extractScenes = useCallback(() => {
    const scenes: SceneCard[] = []
    let currentSceneElements: ScreenplayElement[] = []
    let sceneNumber = 0

    elements.forEach((el, index) => {
      if (el.type === 'scene_heading') {
        // Save previous scene if it exists
        if (currentSceneElements.length > 0) {
          scenes.push(createSceneCard(currentSceneElements, sceneNumber))
          sceneNumber++
        }
        // Start new scene
        currentSceneElements = [el]
        if (sceneNumber === 0) sceneNumber = 1 // First scene
      } else {
        currentSceneElements.push(el)
      }
    })

    // Add last scene
    if (currentSceneElements.length > 0) {
      scenes.push(createSceneCard(currentSceneElements, sceneNumber))
    }

    setSceneCards(scenes)
  }, [elements])

  // Create scene card from elements
  const createSceneCard = (sceneElements: ScreenplayElement[], number: number): SceneCard => {
    const heading = sceneElements.find(el => el.type === 'scene_heading')?.content || 'Untitled Scene'
    const sceneHeadingElement = sceneElements.find(el => el.type === 'scene_heading')
    
    const characters = Array.from(new Set(
      sceneElements
        .filter(el => el.type === 'character')
        .map(el => el.content.trim())
        .filter(c => c.length > 0)
    ))
    
    const description = sceneElements
      .filter(el => el.type === 'action')
      .map(el => el.content)
      .join(' ')
      .substring(0, 150) + (sceneElements.filter(el => el.type === 'action').length > 0 ? '...' : '')

    // Extract location and time from heading (e.g., "INT. COFFEE SHOP - DAY")
    const headingParts = heading.split('-')
    const locationPart = headingParts[0]?.trim() || ''
    const timeOfDay = headingParts[1]?.trim() || 'DAY'
    const location = locationPart.replace(/^(INT\.|EXT\.)\s*/, '').trim()

    // Estimate duration (1 page ≈ 1 minute, ~8 elements ≈ 1 page)
    const duration = Math.ceil((sceneElements.length / 8) * 60)

    return {
      id: sceneHeadingElement?.id || generateId(), // Use the actual scene heading element ID
      sceneNumber: number + 1,
      heading,
      description,
      characters,
      location,
      timeOfDay,
      duration,
      status: 'draft'
    }
  }

  // Update scenes when elements change
  useEffect(() => {
    extractScenes()
  }, [elements, extractScenes])

  // Calculate screenplay statistics
  const stats = {
    scenes: elements.filter(e => e.type === 'scene_heading').length,
    pages: Math.ceil(elements.length / 8),
    characters: Array.from(new Set(
      elements
        .filter(e => e.type === 'character')
        .map(e => e.content.trim())
        .filter(c => c.length > 0)
    )).length,
    dialogueLines: elements.filter(e => e.type === 'dialogue').length,
    actionLines: elements.filter(e => e.type === 'action').length,
    estimatedRuntime: Math.ceil(elements.filter(e => e.type === 'scene_heading').length * 1.5), // rough estimate
    wordCount: elements.reduce((acc, el) => acc + el.content.split(' ').filter(w => w.length > 0).length, 0)
  }

  // Keep a ref to the latest addElement function
  const addElementRef = useRef(addElement)
  useEffect(() => {
    addElementRef.current = addElement
  }, [addElement])

  // Expose addElement callback to parent component (only once)
  useEffect(() => {
    if (onAddElementCallback) {
      const wrappedAddElement = (type: string) => {
        // Use the ref to get the latest addElement function
        addElementRef.current(type as ElementType)
      }
      onAddElementCallback(wrappedAddElement)
    }
    // Only run once when component mounts
  }, [onAddElementCallback])

  // Expose preview mode toggle to parent component
  useEffect(() => {
    if (onPreviewModeChange) {
      const togglePreview = (isPreview: boolean) => {
        setIsPreviewMode(isPreview)
      }
      onPreviewModeChange(togglePreview)
    }
  }, [onPreviewModeChange])

  // Send stats updates to parent component
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(stats)
    }
  }, [stats.scenes, stats.pages, stats.characters, stats.estimatedRuntime, stats.wordCount, onStatsUpdate])

  // Delete element
  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id))
  }

  // Duplicate element
  const duplicateElement = (id: string) => {
    const index = elements.findIndex(el => el.id === id)
    if (index !== -1) {
      const newElement = { ...elements[index], id: generateId() }
      const newElements = [...elements]
      newElements.splice(index + 1, 0, newElement)
      setElements(newElements)
    }
  }

  // Duplicate scene
  const duplicateScene = (sceneNumber: number) => {
    const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
    const currentSceneIndex = elements.findIndex(el => el.id === sceneHeadings[sceneNumber - 1]?.id)
    
    if (currentSceneIndex === -1) return
    
    // Find all elements in this scene (until next scene heading or end)
    const sceneElements: ScreenplayElement[] = []
    for (let i = currentSceneIndex; i < elements.length; i++) {
      if (i > currentSceneIndex && elements[i].type === 'scene_heading') break
      sceneElements.push({ ...elements[i], id: generateId() })
    }
    
    // Insert duplicated scene after current scene
    const newElements = [...elements]
    newElements.splice(currentSceneIndex + sceneElements.length, 0, ...sceneElements)
    setElements(newElements)
  }

  // Delete scene
  const deleteScene = (sceneNumber: number) => {
    const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
    const currentSceneIndex = elements.findIndex(el => el.id === sceneHeadings[sceneNumber - 1]?.id)
    
    if (currentSceneIndex === -1) return
    
    // Find all elements in this scene
    const elementsToDelete: string[] = []
    for (let i = currentSceneIndex; i < elements.length; i++) {
      if (i > currentSceneIndex && elements[i].type === 'scene_heading') break
      elementsToDelete.push(elements[i].id)
    }
    
    // Remove all scene elements
    setElements(elements.filter(el => !elementsToDelete.includes(el.id)))
  }

  // Edit scene heading
  const editSceneHeading = (sceneNumber: number, newHeading: string) => {
    const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
    const sceneElement = sceneHeadings[sceneNumber - 1]
    
    if (sceneElement) {
      const index = elements.findIndex(el => el.id === sceneElement.id)
      const newElements = [...elements]
      newElements[index] = { ...newElements[index], content: newHeading }
      setElements(newElements)
    }
  }

  // Move scene up
  const moveSceneUp = (sceneNumber: number) => {
    if (sceneNumber <= 1) return // Can't move first scene up
    
    const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
    if (sceneNumber > sceneHeadings.length) return
    
    // Get the indices of the current and previous scene headings
    const currentSceneHeadingId = sceneHeadings[sceneNumber - 1].id
    const prevSceneHeadingId = sceneHeadings[sceneNumber - 2].id
    
    const currentSceneStartIndex = elements.findIndex(el => el.id === currentSceneHeadingId)
    const prevSceneStartIndex = elements.findIndex(el => el.id === prevSceneHeadingId)
    
    // Find where current scene ends (next scene heading or end of array)
    let currentSceneEndIndex = elements.length
    for (let i = currentSceneStartIndex + 1; i < elements.length; i++) {
      if (elements[i].type === 'scene_heading') {
        currentSceneEndIndex = i
        break
      }
    }
    
    // Get all elements for both scenes
    const currentSceneElements = elements.slice(currentSceneStartIndex, currentSceneEndIndex)
    const prevSceneElements = elements.slice(prevSceneStartIndex, currentSceneStartIndex)
    
    // Create new elements array with swapped scenes
    const newElements = [
      ...elements.slice(0, prevSceneStartIndex),
      ...currentSceneElements,
      ...prevSceneElements,
      ...elements.slice(currentSceneEndIndex)
    ]
    
    setElements(newElements)
  }

  // Move scene down
  const moveSceneDown = (sceneNumber: number) => {
    const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
    if (sceneNumber >= sceneHeadings.length) return // Can't move last scene down
    
    // Get the indices of the current and next scene headings
    const currentSceneHeadingId = sceneHeadings[sceneNumber - 1].id
    const nextSceneHeadingId = sceneHeadings[sceneNumber].id
    
    const currentSceneStartIndex = elements.findIndex(el => el.id === currentSceneHeadingId)
    const nextSceneStartIndex = elements.findIndex(el => el.id === nextSceneHeadingId)
    
    // Find where next scene ends (scene after next or end of array)
    let nextSceneEndIndex = elements.length
    for (let i = nextSceneStartIndex + 1; i < elements.length; i++) {
      if (elements[i].type === 'scene_heading') {
        nextSceneEndIndex = i
        break
      }
    }
    
    // Get all elements for both scenes
    const currentSceneElements = elements.slice(currentSceneStartIndex, nextSceneStartIndex)
    const nextSceneElements = elements.slice(nextSceneStartIndex, nextSceneEndIndex)
    
    // Create new elements array with swapped scenes
    const newElements = [
      ...elements.slice(0, currentSceneStartIndex),
      ...nextSceneElements,
      ...currentSceneElements,
      ...elements.slice(nextSceneEndIndex)
    ]
    
    setElements(newElements)
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={containerRef}>
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/app/projects')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{project?.title || 'Untitled Screenplay'}</h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="secondary" className="text-xs">
                      {project?.format || 'Screenplay'}
                    </Badge>
                    {project?.genre && (
                      <Badge variant="outline" className="text-xs">
                        {project.genre}
                      </Badge>
                    )}
                    <span>•</span>
                    <span>{stats.scenes} scenes</span>
                    <span>•</span>
                    <span>{stats.pages} pages</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section - Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{stats.wordCount}</span>
                  <span className="text-blue-600 text-xs">words</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                  <Timer className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">{stats.estimatedRuntime}</span>
                  <span className="text-green-600 text-xs">min</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">{stats.characters}</span>
                  <span className="text-purple-600 text-xs">cast</span>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              
              {permissions.canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="border-gray-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportScreenplay}
                className="border-gray-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm" className="border-gray-300">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="mt-3 flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="write" className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Write</span>
                </TabsTrigger>
                <TabsTrigger value="cards" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  <span>Scene Cards</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{sceneCards.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="outline" className="gap-2">
                  <List className="w-4 h-4" />
                  <span>Outline</span>
                </TabsTrigger>
                <TabsTrigger value="characters" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span>Characters</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{stats.characters}</Badge>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Enhanced Sidebar - Screenplay Tools - Hidden in Preview Mode */}
          {showFormatting && !isPreviewMode && (
            <div className="col-span-3 space-y-4">
              {/* Screenplay Elements */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Screenplay Elements
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Click to add or use Tab key</p>
                </div>
                
                <div className="p-3 space-y-1.5">
                  <button
                    onClick={() => addElement('scene_heading')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-transparent hover:border-blue-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Film className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Scene Heading</div>
                        <div className="text-xs text-gray-500">INT./EXT. LOCATION</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElement('action')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 border border-transparent hover:border-green-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <AlignLeft className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Action</div>
                        <div className="text-xs text-gray-500">Scene description</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElement('character')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 border border-transparent hover:border-purple-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Character</div>
                        <div className="text-xs text-gray-500">Character name</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElement('dialogue')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 transition-all duration-200 border border-transparent hover:border-amber-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Dialogue</div>
                        <div className="text-xs text-gray-500">Character speech</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElement('parenthetical')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 transition-all duration-200 border border-transparent hover:border-pink-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Type className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Parenthetical</div>
                        <div className="text-xs text-gray-500">(wryly)</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElement('transition')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 transition-all duration-200 border border-transparent hover:border-indigo-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">Transition</div>
                        <div className="text-xs text-gray-500">CUT TO:</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-blue-500" />
                    Quick Actions
                  </h4>
                </div>
                <div className="p-3 space-y-1.5">
                  <button
                    onClick={exportScreenplay}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-3"
                  >
                    <Download className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Export Script</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('outline')}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-3"
                  >
                    <Layout className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">View Outline</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-3"
                  >
                    <Printer className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Print Script</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Keyboard Shortcuts
                  </h4>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Tab</span>
                    <span className="text-xs font-medium text-gray-800">Change Type</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Enter</span>
                    <span className="text-xs font-medium text-gray-800">New Element</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Ctrl+S</span>
                    <span className="text-xs font-medium text-gray-800">Save</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Ctrl+D</span>
                    <span className="text-xs font-medium text-gray-800">Duplicate</span>
                  </div>
                </div>
              </div>

              {/* Live Statistics */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-lg border border-orange-200 shadow-sm sticky top-32">
                <div className="p-4 border-b border-orange-200">
                  <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    Live Statistics
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <Film className="w-4 h-4 text-blue-500" /> Scenes
                    </span>
                    <span className="font-bold text-gray-900 text-lg">{stats.scenes}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" /> Pages
                    </span>
                    <span className="font-bold text-gray-900 text-lg">~{stats.pages}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" /> Characters
                    </span>
                    <span className="font-bold text-gray-900 text-lg">{stats.characters}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-orange-500" /> Runtime
                    </span>
                    <span className="font-bold text-gray-900 text-lg">~{stats.estimatedRuntime}m</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <Type className="w-4 h-4 text-amber-500" /> Words
                    </span>
                    <span className="font-bold text-gray-900 text-lg">{stats.wordCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className={(showFormatting && !isPreviewMode) ? 'col-span-9' : 'col-span-12'}>
            <Tabs value={activeTab} className="space-y-6">
              <TabsContent value="write" className="space-y-0">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* Screenplay Page */}
                  <div className="p-12 max-w-4xl mx-auto min-h-[11in] bg-white" style={{ fontFamily: 'Courier, monospace', fontSize: '12pt', lineHeight: '1.5' }}>
                    <div className="space-y-4">
                      {elements.map((element, index) => (
                        <div 
                          key={element.id} 
                          ref={(el) => { elementRefs.current[element.id] = el }}
                          className={`group relative ${getElementStyle(element.type)} ${
                            highlightedElementId === element.id 
                              ? 'bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 -m-2 animate-pulse' 
                              : ''
                          }`}
                        >
                          {/* Element Action Buttons (appear on hover) - Only in Edit Mode */}
                          {permissions.canEdit && !isPreviewMode && (
                            <div className="absolute -left-16 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => duplicateElement(element.id)}
                                className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-colors"
                                title="Duplicate element"
                              >
                                <Copy className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteElement(element.id)}
                                className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-red-50 hover:border-red-400 transition-colors"
                                title="Delete element"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                            </div>
                          )}
                          
                          {/* Element Type Badge (appears on hover) - Only in Edit Mode */}
                          {!isPreviewMode && (
                            <div className="absolute -top-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {element.type?.replace('_', ' ') || 'unknown'}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Preview Mode - Static Text */}
                          {isPreviewMode ? (
                            <div className={`${getElementStyle(element.type)} whitespace-pre-wrap`}>
                              {element.content || ' '}
                            </div>
                          ) : (
                            /* Edit Mode - Textarea */
                            <textarea
                              value={element.content}
                              onChange={(e) => {
                                updateElement(index, e.target.value)
                                // Auto-resize textarea
                                e.target.style.height = 'auto'
                                e.target.style.height = e.target.scrollHeight + 'px'
                              }}
                              onFocus={() => setFocusedElementIndex(index)}
                              onBlur={() => setFocusedElementIndex(null)}
                              onKeyDown={(e) => handleKeyDown(e, index, element.type)}
                              placeholder={`${element.type?.replace('_', ' ')?.toUpperCase() || 'TEXT'}...`}
                              className={`w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none overflow-hidden group-hover:bg-gray-50/50 transition-colors rounded px-2 -mx-2 ${getElementStyle(element.type)}`}
                              style={{ minHeight: '24px' }}
                              disabled={!permissions.canEdit}
                            />
                          )}
                        </div>
                      ))}
                      
                      {permissions.canEdit && !isPreviewMode && (
                        <div className="pt-8 flex items-center justify-center">
                          <button
                            onClick={() => addElement('action')}
                            className="px-4 py-2 text-gray-400 hover:text-orange-600 text-sm font-medium hover:bg-orange-50 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-orange-300 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add element (or use sidebar / keyboard shortcuts)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Enhanced Scene Cards View */}
              <TabsContent value="cards" className="space-y-0">
                <div className="space-y-4">
                  {/* Search and Filter Bar */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search scenes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addElement('scene_heading')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          New Scene
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scene Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sceneCards
                      .filter(scene => 
                        searchQuery === '' || 
                        scene.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        scene.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((scene) => (
                      <Card 
                        key={scene.id}
                        className={`group relative overflow-hidden transition-all duration-200 ${
                          selectedSceneCard === scene.id 
                            ? 'border-2 border-orange-500 shadow-lg ring-2 ring-orange-200' 
                            : 'border border-gray-200 hover:border-orange-300 hover:shadow-md'
                        }`}
                      >
                        {/* Gradient accent bar at top */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          selectedSceneCard === scene.id 
                            ? 'from-orange-500 to-amber-500' 
                            : 'from-gray-300 to-gray-400 group-hover:from-orange-400 group-hover:to-amber-400'
                        } transition-all`} />
                        
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs font-semibold ${
                                  selectedSceneCard === scene.id 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                Scene {scene.sceneNumber}
                              </Badge>
                              {scene.colorTag && (
                                <div 
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: scene.colorTag }}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigateToScene(scene.id, scene.sceneNumber)
                                }}
                                title="Edit scene"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigateToScene(scene.id, scene.sceneNumber)
                                    }}
                                    className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit Scene
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      duplicateScene(scene.sceneNumber)
                                    }}
                                    className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate Scene
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-200" />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      moveSceneUp(scene.sceneNumber)
                                    }}
                                    disabled={scene.sceneNumber === 1}
                                    className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <ChevronLeft className="w-4 h-4 mr-2 rotate-90" />
                                    Move Up
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      moveSceneDown(scene.sceneNumber)
                                    }}
                                    disabled={scene.sceneNumber === sceneCards.length}
                                    className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <ChevronRight className="w-4 h-4 mr-2 rotate-90" />
                                    Move Down
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-200" />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Delete Scene ${scene.sceneNumber}: ${scene.heading}?`)) {
                                        deleteScene(scene.sceneNumber)
                                      }
                                    }}
                                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Scene
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedSceneCard(scene.id)
                              navigateToScene(scene.id, scene.sceneNumber)
                            }}
                          >
                            <CardTitle className="text-sm font-bold line-clamp-2 hover:text-orange-600 transition-colors">
                              {scene.heading}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-2 mt-1.5">
                              {scene.description || 'No description yet...'}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* Location and Time */}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-medium">{scene.location || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span className="font-medium">{scene.timeOfDay}</span>
                              </div>
                            </div>

                            {/* Characters */}
                            {scene.characters.length > 0 && (
                              <div className="flex items-start gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {scene.characters.slice(0, 3).map((char, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-2 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                      {char}
                                    </Badge>
                                  ))}
                                  {scene.characters.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-2 py-0 bg-gray-50 text-gray-600">
                                      +{scene.characters.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Duration and Status */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Timer className="w-3.5 h-3.5 text-green-500" />
                                <span className="font-medium">~{scene.duration}s</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={scene.status === 'locked' ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    scene.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                    scene.status === 'review' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    'bg-green-100 text-green-700 border-green-300'
                                  }`}
                                >
                                  {scene.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Jump to Scene Button */}
                            <div className="pt-2 border-t border-gray-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`w-full text-xs h-8 transition-all ${
                                  selectedSceneCard === scene.id
                                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 hover:from-orange-100 hover:to-amber-100 font-medium'
                                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigateToScene(scene.id, scene.sceneNumber)
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Jump to Scene
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {sceneCards.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Film className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No scenes yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Start writing to create your first scene</p>
                        <Button onClick={() => {
                          setActiveTab('write')
                          addElement('scene_heading')
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Scene
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Outline View */}
              <TabsContent value="outline" className="space-y-0">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Screenplay Outline</CardTitle>
                    <CardDescription>
                      A structured overview of your screenplay scenes and beats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sceneCards.map((scene, index) => (
                        <div 
                          key={scene.id}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                          onClick={() => {
                            setSelectedSceneCard(scene.id)
                            navigateToScene(scene.id, scene.sceneNumber)
                          }}
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            {scene.sceneNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">{scene.heading}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{scene.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {scene.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {scene.timeOfDay}
                              </span>
                              {scene.characters.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {scene.characters.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="outline">{scene.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Existing Scenes Tab - Now for legacy compatibility */}
              <TabsContent value="scenes">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Scene Overview</h2>
                  <div className="space-y-3">
                    {elements
                      .filter(e => e.type === 'scene_heading')
                      .map((scene, index) => (
                        <div key={scene.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{scene.content}</span>
                              <p className="text-sm text-gray-600 mt-1">Scene {index + 1}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="characters">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Character List</h2>
                  <div className="space-y-3">
                    {Array.from(new Set(elements
                      .filter(e => e.type === 'character')
                      .map(e => e.content.trim())
                      .filter(c => c.length > 0)
                    )).map((character, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900">{character}</div>
                        <p className="text-sm text-gray-600 mt-1">
                          {elements.filter(e => e.type === 'character' && e.content.trim() === character).length} dialogue scenes
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-0">
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-blue-700">Total Scenes</CardDescription>
                        <CardTitle className="text-3xl font-bold text-blue-900">{stats.scenes}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Film className="w-4 h-4" />
                          <span>{(stats.scenes / (stats.pages || 1) * 100).toFixed(0)}% scene density</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-green-700">Page Count</CardDescription>
                        <CardTitle className="text-3xl font-bold text-green-900">{stats.pages}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <BookOpen className="w-4 h-4" />
                          <span>~{stats.estimatedRuntime} min runtime</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-purple-700">Characters</CardDescription>
                        <CardTitle className="text-3xl font-bold text-purple-900">{stats.characters}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                          <Users className="w-4 h-4" />
                          <span>Cast members</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-orange-700">Word Count</CardDescription>
                        <CardTitle className="text-3xl font-bold text-orange-900">{stats.wordCount.toLocaleString()}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <Type className="w-4 h-4" />
                          <span>Total words</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Content Breakdown */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Content Breakdown</CardTitle>
                      <CardDescription>Analysis of screenplay elements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Dialogue vs Action</span>
                            <span className="text-sm text-gray-500">
                              {stats.dialogueLines + stats.actionLines} total
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500"
                                  style={{ 
                                    width: `${((stats.dialogueLines / (stats.dialogueLines + stats.actionLines)) * 100) || 0}%` 
                                  }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Dialogue: {stats.dialogueLines} ({((stats.dialogueLines / (stats.dialogueLines + stats.actionLines)) * 100).toFixed(0)}%)
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 bg-green-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500"
                                  style={{ 
                                    width: `${((stats.actionLines / (stats.dialogueLines + stats.actionLines)) * 100) || 0}%` 
                                  }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Action: {stats.actionLines} ({((stats.actionLines / (stats.dialogueLines + stats.actionLines)) * 100).toFixed(0)}%)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{stats.scenes}</div>
                            <div className="text-xs text-gray-600 mt-1">Scene Headings</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{elements.filter(e => e.type === 'parenthetical').length}</div>
                            <div className="text-xs text-gray-600 mt-1">Parentheticals</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{elements.filter(e => e.type === 'transition').length}</div>
                            <div className="text-xs text-gray-600 mt-1">Transitions</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Writing Progress */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Writing Progress</CardTitle>
                      <CardDescription>Track your screenplay completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Standard Feature Length</span>
                            <span className="text-sm text-gray-500">{stats.pages} / 90-120 pages</span>
                          </div>
                          <Progress value={(stats.pages / 110) * 100} className="h-3" />
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.pages < 90 ? `${90 - stats.pages} pages to minimum length` : 
                             stats.pages > 120 ? 'Above standard length' : 
                             'Within standard range'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-semibold text-blue-900">Act 1</div>
                            <div className="text-xs text-blue-600 mt-1">~{Math.ceil(stats.scenes * 0.25)} scenes</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-semibold text-green-900">Act 2</div>
                            <div className="text-xs text-green-600 mt-1">~{Math.ceil(stats.scenes * 0.50)} scenes</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-sm font-semibold text-purple-900">Act 3</div>
                            <div className="text-xs text-purple-600 mt-1">~{Math.ceil(stats.scenes * 0.25)} scenes</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Screenplay Notes</h2>
                  <textarea
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Add notes about your screenplay, character motivations, plot points, etc."
                    disabled={!permissions.canEdit}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
