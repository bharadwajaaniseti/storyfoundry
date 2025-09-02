'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Users, Save, Settings, Eye, FileText, Map, Clock, Target, Lightbulb, MapPin, User, Calendar, Search, Bookmark, Image, Upload, ZoomIn, ZoomOut, Ruler, Edit, Plus, Edit3, Trash2, ChevronDown, ChevronRight, Crown, Palette, Globe, Shield, Heart, Brain, Zap, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ResearchManager from '@/components/research-manager'
import TimelineManager from '@/components/timeline-manager'
import { createSupabaseClient } from '@/lib/auth'

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
  parent_folder_id?: string  // New: for organizing elements in folders
  is_folder?: boolean        // New: to identify folder elements
  sort_order?: number        // New: for ordering items within folders
}

interface Folder {
  id: string
  project_id: string
  category: string
  name: string
  parent_folder_id?: string
  created_at: string
  updated_at: string
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
  parent_folder_id?: string  // New: for organizing chapters in folders
  sort_order?: number        // New: for ordering chapters within folders
  category: string           // New: category field (always 'chapters' for chapters)
}

export default function NovelPage({ params }: NovelPageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<string>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // World building state
  const [elements, setElements] = useState<WorldElement[]>([])
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['characters', 'locations', 'magic', 'chapters'])
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]) // Track expanded folders

  // Chapters state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    categoryId: string
    categoryLabel: string
  } | null>(null)

  // Element/Folder context menu state
  const [elementContextMenu, setElementContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    type: 'folder' | 'element' | 'chapter'
    item: WorldElement | Chapter | null
    category: string
  } | null>(null)

  // Modal state
  const [iconColorModal, setIconColorModal] = useState<{
    visible: boolean
    item: WorldElement | Chapter | null
    type: 'folder' | 'element' | 'chapter'
  } | null>(null)

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean
    item: WorldElement | Chapter | null
    type: 'folder' | 'element' | 'chapter'
    title: string
    message: string
  } | null>(null)

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    id: string
    type: 'element' | 'folder' | 'chapter'
    category: string
  } | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null)

  // Comprehensive sidebar navigation options with colors from world-building sidebar
  const sidebarOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: Target, hasAdd: false, color: 'slate', description: '' },
    { id: 'characters', label: 'Characters', icon: Users, hasAdd: true, color: 'blue', description: 'Create and develop the people who inhabit your story world.' },
    { id: 'locations', label: 'Locations', icon: MapPin, hasAdd: true, color: 'green', description: 'Define the places where your story unfolds, from cities to hidden realms.' },
    { id: 'maps', label: 'Maps', icon: Map, hasAdd: true, color: 'cyan', description: 'Create visual representations of your world\'s geography and layout.' },
    { id: 'research', label: 'Research', icon: Search, hasAdd: true, color: 'orange', description: 'Gather and organize reference materials for your story.' },
    { id: 'timeline', label: 'Timeline', icon: Clock, hasAdd: true, hasCustomIcon: true, color: 'purple', description: 'Track events and their chronological order in your story.' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, hasAdd: true, color: 'indigo', description: 'Manage dates, seasons, and temporal elements of your world.' },
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

  useEffect(() => {
    const loadProject = async () => {
      try {
        const resolvedParams = await params
        
        console.log('Loading project with ID:', resolvedParams.id)
        
        // Fetch from API
        const response = await fetch(`/api/projects/${resolvedParams.id}`)
        
        if (!response.ok) {
          console.error('API response not ok:', response.status, response.statusText)
          if (response.status === 404) {
            console.log('Project not found')
            setProject(null)
            return
          }
          if (response.status === 403) {
            console.log('Access denied to project')
            setProject(null)
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const projectData = await response.json()
        console.log('Successfully loaded project from API:', projectData)
        setProject(projectData)
        
        // Load world elements
        await loadElements(resolvedParams.id)
        
        // Load chapters
        await loadChapters(resolvedParams.id)
        
      } catch (error) {
        console.error('Error loading project:', error)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [params])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        handleCloseContextMenu()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [contextMenu])

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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: { id: string, type: 'element' | 'folder' | 'chapter', category: string }) => {
    console.log('🎯 Drag started:', item)
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id) // Required for Firefox and better compatibility
    
    // Add a class to body to show we're dragging
    document.body.classList.add('dragging')
  }

  const handleDragOver = (e: React.DragEvent, targetId: string, targetType: 'folder' | 'element' | 'chapter' = 'element') => {
    e.preventDefault()
    e.stopPropagation()
    
    e.dataTransfer.dropEffect = 'move'
    console.log('🎯 Drag over:', targetId, targetType)
    setDragOverItem(targetId)
    
    // Calculate drop position based on mouse position within the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseY = e.clientY
    const elementTop = rect.top
    const elementHeight = rect.height
    const relativeY = mouseY - elementTop
    
    if (targetType === 'folder') {
      // For folders, prefer dropping inside
      setDropPosition('inside')
    } else {
      // For elements and chapters, determine if dropping before or after
      const threshold = elementHeight / 2
      if (relativeY < threshold) {
        setDropPosition('before')
        console.log('🎯 Drop position: before')
      } else {
        setDropPosition('after')
        console.log('🎯 Drop position: after')
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire element, not just a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const { clientX, clientY } = e
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      console.log('🎯 Drag leave')
      setDragOverItem(null)
      setDropPosition(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string, targetType: 'folder' | 'root' | 'element' | 'chapter') => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🎯 Drop:', { draggedItem, targetId, targetType, dropPosition })
    
    // Remove dragging class from body
    document.body.classList.remove('dragging')
    
    setDragOverItem(null)
    setDropPosition(null)
    
    if (!draggedItem || !project || draggedItem.id === targetId) {
      console.log('🎯 Drop cancelled: invalid conditions')
      setDraggedItem(null)
      return
    }
    
    try {
      const supabase = createSupabaseClient()
      
      if (draggedItem.type === 'chapter') {
        console.log('🎯 Processing chapter drag-drop with folder support')
        
        // Get current chapters and find the dragged one
        const draggedChapter = chapters.find(ch => ch.id === draggedItem.id)
        if (!draggedChapter) {
          console.error('🎯 Error: Dragged chapter not found')
          setDraggedItem(null)
          return
        }
        
        // Handle different drop targets
        let newParentFolderId: string | null = null
        let newSortOrder: number = 0
        let useChapterNumber = false
        
        if (targetType === 'folder') {
          // Moving chapter into a folder
          console.log('🎯 Moving chapter into folder:', targetId)
          newParentFolderId = targetId
          
          // Get chapters already in this folder and calculate new sort order
          const chaptersInFolder = chapters.filter(ch => 
            ch.parent_folder_id === targetId
          ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          
          newSortOrder = chaptersInFolder.length > 0 ? 
            Math.max(...chaptersInFolder.map(ch => ch.sort_order || 0)) + 10 : 10
            
        } else if (targetType === 'root' || targetId === 'root-chapters') {
          // Moving to root level
          console.log('🎯 Moving chapter to root level')
          newParentFolderId = null
          
          // For root level chapters, we use chapter_number for ordering
          useChapterNumber = true
          const newPosition = chapters.filter(ch => !ch.parent_folder_id).length + 1
          
          try {
            const { error: chapterError } = await supabase
              .from('project_chapters')
              .update({ 
                parent_folder_id: newParentFolderId,
                chapter_number: newPosition,
                updated_at: new Date().toISOString()
              })
              .eq('id', draggedChapter.id)
            
            if (chapterError) {
              throw new Error(`Failed to move chapter to root: ${chapterError.message}`)
            }
            
            console.log('🎯 Chapter moved to root successfully')
            await loadChapters(project.id)
            setDraggedItem(null)
            return
            
          } catch (error) {
            console.error('🎯 Error moving chapter to root:', error)
            alert(`Failed to move chapter: ${error instanceof Error ? error.message : 'Unknown error'}`)
            setDraggedItem(null)
            return
          }
            
        } else if (targetType === 'chapter') {
          // Moving relative to another chapter
          console.log('🎯 Moving chapter relative to another chapter')
          const targetChapter = chapters.find(ch => ch.id === targetId)
          if (targetChapter) {
            newParentFolderId = targetChapter.parent_folder_id || null
            
            if (newParentFolderId) {
              // Both chapters are in folders - use sort_order
              const siblings = chapters.filter(ch => 
                ch.parent_folder_id === newParentFolderId &&
                ch.id !== draggedChapter.id
              ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              
              const targetIndex = siblings.findIndex(ch => ch.id === targetId)
              
              if (dropPosition === 'before') {
                newSortOrder = targetIndex > 0 ? 
                  siblings[targetIndex - 1].sort_order! + 5 : 5
              } else {
                newSortOrder = targetIndex < siblings.length - 1 ? 
                  siblings[targetIndex].sort_order! + 5 : siblings[targetIndex].sort_order! + 10
              }
            } else {
              // Both chapters are at root level - use chapter_number
              useChapterNumber = true
              let newPosition = 1
              
              if (dropPosition === 'before') {
                newPosition = targetChapter.chapter_number
              } else if (dropPosition === 'after') {
                newPosition = targetChapter.chapter_number + 1
              }
              
              // Handle chapter reordering at root level
              try {
                const tempNumber = 9999
                console.log(`🎯 Reordering chapters at root level to position ${newPosition}`)
                
                // Move dragged chapter to temporary position
                const { error: tempError } = await supabase
                  .from('project_chapters')
                  .update({ chapter_number: tempNumber })
                  .eq('id', draggedChapter.id)
                
                if (tempError) {
                  throw new Error(`Failed to set temporary position: ${tempError.message}`)
                }
                
                // Get remaining chapters at root level sorted by chapter_number
                const remainingChapters = chapters
                  .filter(ch => ch.id !== draggedChapter.id && !ch.parent_folder_id)
                  .sort((a, b) => a.chapter_number - b.chapter_number)
                
                // Reorder remaining chapters to make space
                for (let i = 0; i < remainingChapters.length; i++) {
                  const chapter = remainingChapters[i]
                  let finalNumber
                  
                  if (i + 1 < newPosition) {
                    finalNumber = i + 1
                  } else {
                    finalNumber = i + 2
                  }
                  
                  if (chapter.chapter_number !== finalNumber) {
                    const { error } = await supabase
                      .from('project_chapters')
                      .update({ chapter_number: finalNumber })
                      .eq('id', chapter.id)
                    
                    if (error) {
                      throw new Error(`Failed to update chapter ${chapter.title}: ${error.message}`)
                    }
                  }
                }
                
                // Move dragged chapter to final position
                const { error: finalError } = await supabase
                  .from('project_chapters')
                  .update({ 
                    chapter_number: newPosition,
                    parent_folder_id: newParentFolderId
                  })
                  .eq('id', draggedChapter.id)
                
                if (finalError) {
                  throw new Error(`Failed to set final position: ${finalError.message}`)
                }
                
                console.log('🎯 Chapter reordering completed successfully')
                await loadChapters(project.id)
                setDraggedItem(null)
                return
                
              } catch (error) {
                console.error('🎯 Error reordering chapters:', error)
                alert(`Failed to reorder chapters: ${error instanceof Error ? error.message : 'Unknown error'}`)
                setDraggedItem(null)
                return
              }
            }
          }
        }
        
        // For folder-based chapters, update with sort_order
        if (!useChapterNumber) {
          try {
            const { error } = await supabase
              .from('project_chapters')
              .update({ 
                parent_folder_id: newParentFolderId,
                sort_order: newSortOrder,
                updated_at: new Date().toISOString()
              })
              .eq('id', draggedChapter.id)
            
            if (error) {
              throw new Error(`Failed to move chapter: ${error.message}`)
            }
            
            console.log('🎯 Chapter moved successfully')
            await loadChapters(project.id)
            
          } catch (error) {
            console.error('🎯 Error moving chapter:', error)
            alert(`Failed to move chapter: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        
        setDraggedItem(null)
        return
      }
      
      let newParentId: string | null = null
      let insertPosition: number | null = null
      
      if (targetType === 'folder') {
        // Moving into a folder
        newParentId = targetId
      } else if (targetType === 'root') {
        // Moving to root level
        newParentId = null
      } else if (targetType === 'element' || targetType === 'chapter') {
        // Moving relative to another element - need to determine the parent and position
        const targetElement = elements.find(el => el.id === targetId)
        if (targetElement) {
          newParentId = targetElement.parent_folder_id || null
          
          // Get all siblings in the same parent
          const siblings = elements.filter(el => 
            el.category === draggedItem.category && 
            el.parent_folder_id === newParentId &&
            el.id !== draggedItem.id
          ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          
          const targetIndex = siblings.findIndex(el => el.id === targetId)
          
          if (dropPosition === 'before') {
            insertPosition = targetIndex
          } else if (dropPosition === 'after') {
            insertPosition = targetIndex + 1
          }
        }
      }
      
      // Update the parent_folder_id and sort_order
      const updates: any = { 
        parent_folder_id: newParentId,
        updated_at: new Date().toISOString()
      }
      
      // If we have a specific position, update sort orders
      if (insertPosition !== null) {
        // Get all siblings and update their sort orders
        const siblings = elements.filter(el => 
          el.category === draggedItem.category && 
          el.parent_folder_id === newParentId &&
          el.id !== draggedItem.id
        ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        
        // Insert the dragged item at the specified position
        siblings.splice(insertPosition, 0, { ...elements.find(el => el.id === draggedItem.id)! })
        
        // Update sort orders for all affected items
        for (let i = 0; i < siblings.length; i++) {
          const item = siblings[i]
          const newSortOrder = i * 10 // Leave gaps for future insertions
          
          await supabase
            .from('world_elements')
            .update({ sort_order: newSortOrder })
            .eq('id', item.id)
        }
      }
      
      const { error } = await supabase
        .from('world_elements')
        .update(updates)
        .eq('id', draggedItem.id)
      
      if (error) {
        console.error('Error moving item:', error)
        return
      }
      
      // Refresh the elements
      await loadElements(project.id)
      console.log(`✅ Moved ${draggedItem.type} to ${targetType === 'folder' ? 'folder' : targetType === 'root' ? 'root' : 'position'}`)
      
    } catch (error) {
      console.error('Error in drag and drop:', error)
    } finally {
      setDraggedItem(null)
      document.body.classList.remove('dragging')
    }
  }

  const handleDragEnd = () => {
    console.log('🎯 Drag ended')
    setDraggedItem(null)
    setDragOverItem(null)
    setDropPosition(null)
    document.body.classList.remove('dragging')
  }

  // Context menu handlers
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

  const closeElementContextMenu = () => {
    setElementContextMenu(null)
  }

  // Click outside to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      closeElementContextMenu()
    }
    
    if (elementContextMenu?.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [elementContextMenu?.visible])

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteModal?.visible) {
          closeDeleteModal()
        } else if (iconColorModal?.visible) {
          closeIconColorModal()
        }
      }
    }

    if (deleteModal?.visible || iconColorModal?.visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteModal?.visible, iconColorModal?.visible])

  // Context menu actions
  const handleRenameFolder = (folder: WorldElement) => {
    const newName = prompt('Enter new folder name:', folder.name)
    if (newName && newName !== folder.name) {
      updateElement(folder.id, { name: newName })
    }
    closeElementContextMenu()
  }

  const handleRenameElement = (element: WorldElement) => {
    const newName = prompt('Enter new element name:', element.name)
    if (newName && newName !== element.name) {
      updateElement(element.id, { name: newName })
    }
    closeElementContextMenu()
  }

  const handleDeleteFolder = async (folder: WorldElement) => {
    setDeleteModal({
      visible: true,
      item: folder,
      type: 'folder',
      title: 'Delete Folder',
      message: `Are you sure you want to delete the folder "${folder.name}" and all its contents? This action cannot be undone.`
    })
    closeElementContextMenu()
  }

  const handleDeleteElement = async (element: WorldElement) => {
    setDeleteModal({
      visible: true,
      item: element,
      type: 'element',
      title: 'Delete Element',
      message: `Are you sure you want to delete "${element.name}"? This action cannot be undone.`
    })
    closeElementContextMenu()
  }

  const handleDeleteChapter = async (chapter: Chapter) => {
    setDeleteModal({
      visible: true,
      item: chapter,
      type: 'chapter',
      title: 'Delete Chapter',
      message: `Are you sure you want to delete "${chapter.title}"? This action cannot be undone.`
    })
    closeElementContextMenu()
  }

  const closeDeleteModal = () => {
    setDeleteModal(null)
  }

  const confirmDelete = async () => {
    if (!deleteModal?.item) return

    try {
      const supabase = createSupabaseClient()
      
      if (deleteModal.type === 'chapter') {
        const chapter = deleteModal.item as Chapter
        await supabase.from('project_chapters').delete().eq('id', chapter.id)
        await loadChapters(project!.id)
        
        // Clear selected chapter if it was deleted
        if (selectedChapter?.id === chapter.id) {
          setSelectedChapter(null)
        }
      } else {
        // For world elements (folders and elements)
        const element = deleteModal.item as WorldElement
        await supabase.from('world_elements').delete().eq('id', element.id)
        await loadElements(project!.id)
      }
      
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  const handleRenameChapter = async (chapter: Chapter) => {
    const newTitle = prompt('Enter new chapter title:', chapter.title)
    if (newTitle && newTitle !== chapter.title) {
      try {
        const supabase = createSupabaseClient()
        const { error } = await supabase
          .from('project_chapters')
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq('id', chapter.id)
        
        if (error) throw error
        
        await loadChapters(project!.id)
        
        // Update selected chapter if it was the one being renamed
        if (selectedChapter?.id === chapter.id) {
          setSelectedChapter({ ...chapter, title: newTitle })
        }
      } catch (error) {
        console.error('Error renaming chapter:', error)
      }
    }
    closeElementContextMenu()
  }

  const handleDuplicateChapter = async (chapter: Chapter) => {
    try {
      const supabase = createSupabaseClient()
      const duplicatedChapter = {
        project_id: chapter.project_id,
        title: `${chapter.title} (Copy)`,
        content: chapter.content,
        notes: chapter.notes,
        chapter_number: chapters.length + 1,
        status: 'draft',
        word_count: chapter.word_count,
        target_word_count: chapter.target_word_count,
        parent_folder_id: chapter.parent_folder_id,
        sort_order: chapter.sort_order ? chapter.sort_order + 1 : null
      }
      
      const { data, error } = await supabase
        .from('project_chapters')
        .insert(duplicatedChapter)
        .select()
        .single()

      if (error) throw error
      
      await loadChapters(project!.id)
    } catch (error) {
      console.error('Error duplicating chapter:', error)
    }
    closeElementContextMenu()
  }

  const handleDuplicateElement = async (element: WorldElement) => {
    try {
      const supabase = createSupabaseClient()
      const duplicatedElement = {
        ...element,
        id: undefined,
        name: `${element.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined
      }
      
      const { data, error } = await supabase
        .from('world_elements')
        .insert(duplicatedElement)
        .select()
        .single()

      if (error) throw error
      
      await loadElements(project!.id)
    } catch (error) {
      console.error('Error duplicating element:', error)
    }
    closeElementContextMenu()
  }

  // Additional context menu handlers
  const handleCreateNewElement = async (category: string) => {
    const name = prompt(`Enter ${category.slice(0, -1)} name:`)
    if (name) {
      await createElement(category, name)
    }
    closeElementContextMenu()
  }

  const handleCreateNewFolder = async (category: string, parentElementId?: string) => {
    const name = prompt('Enter folder name:')
    if (name) {
      await createFolder(category, name, parentElementId)
    }
    closeElementContextMenu()
  }

  const handleIconColorChange = (element: WorldElement) => {
    setIconColorModal({
      visible: true,
      item: element,
      type: 'element'
    })
    closeElementContextMenu()
  }

  const handleIconColorChangeFolder = (folder: WorldElement) => {
    setIconColorModal({
      visible: true,
      item: folder,
      type: 'folder'
    })
    closeElementContextMenu()
  }

  const handleIconColorChangeChapter = (chapter: Chapter) => {
    setIconColorModal({
      visible: true,
      item: chapter,
      type: 'chapter'
    })
    closeElementContextMenu()
  }

  const closeIconColorModal = () => {
    setIconColorModal(null)
  }

  const handleColorSelection = async (color: string) => {
    if (!iconColorModal?.item) return

    try {
      const supabase = createSupabaseClient()
      
      if (iconColorModal.type === 'chapter') {
        // For chapters, we could store color in metadata or a separate field
        // For now, we'll add it to the notes as metadata
        const chapter = iconColorModal.item as Chapter
        const updatedNotes = chapter.notes ? `${chapter.notes}\n[Color: ${color}]` : `[Color: ${color}]`
        
        const { error } = await supabase
          .from('project_chapters')
          .update({ 
            notes: updatedNotes,
            updated_at: new Date().toISOString() 
          })
          .eq('id', chapter.id)
        
        if (error) throw error
        await loadChapters(project!.id)
      } else {
        // For world elements (folders and elements)
        const element = iconColorModal.item as WorldElement
        const updatedAttributes = {
          ...element.attributes,
          iconColor: color
        }
        
        const { error } = await supabase
          .from('world_elements')
          .update({ 
            attributes: updatedAttributes,
            updated_at: new Date().toISOString() 
          })
          .eq('id', element.id)
        
        if (error) throw error
        await loadElements(project!.id)
      }
      
      closeIconColorModal()
    } catch (error) {
      console.error('Error updating icon color:', error)
      alert('Failed to update icon color')
    }
  }

  const handleExportElement = (element: WorldElement) => {
    try {
      const exportData = {
        name: element.name,
        description: element.description,
        attributes: element.attributes,
        tags: element.tags,
        category: element.category,
        exportedAt: new Date().toISOString()
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${element.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error exporting element:', error)
      alert('Failed to export element')
    }
    closeElementContextMenu()
  }

  const handleExportFolder = (folder: WorldElement) => {
    try {
      // Get all elements in this folder
      const folderElements = elements.filter(el => el.parent_folder_id === folder.id)
      
      const exportData = {
        folder: {
          name: folder.name,
          description: folder.description,
          category: folder.category
        },
        elements: folderElements.map(el => ({
          name: el.name,
          description: el.description,
          attributes: el.attributes,
          tags: el.tags,
          category: el.category
        })),
        exportedAt: new Date().toISOString()
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${folder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_folder.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error exporting folder:', error)
      alert('Failed to export folder')
    }
    closeElementContextMenu()
  }

  const handleOpenInNewTab = (element: WorldElement) => {
    // Open the element in a new tab/window
    const url = `/app/novels/${project?.id}?element=${element.id}&category=${element.category}`
    window.open(url, '_blank')
    closeElementContextMenu()
  }

  const createFolder = async (category: string, name: string, parentFolderId?: string) => {
    if (!project) return
    
    console.log('🗂️ Creating folder:', { category, name, parentFolderId, projectId: project.id })
    
    try {
      const supabase = createSupabaseClient()
      const newFolder = {
        project_id: project.id,
        category,
        name,
        description: '',
        attributes: {},
        tags: [],
        parent_folder_id: parentFolderId,
        is_folder: true
      }

      console.log('🗂️ Folder data to insert:', newFolder)

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newFolder)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating folder:', error)
        throw error
      }

      console.log('✅ Folder created successfully:', data)

      if (data) {
        console.log('📁 Adding folder to state. Current elements:', elements.length)
        setElements(prev => {
          const newElements = [...prev, data]
          console.log('📁 New elements state will have:', newElements.length, 'items')
          console.log('📁 Folder in new state:', newElements.find(el => el.id === data.id))
          return newElements
        })
        // Auto-expand the new folder
        setExpandedFolders(prev => {
          const newExpanded = [...prev, data.id]
          console.log('📁 Expanded folders:', newExpanded)
          return newExpanded
        })
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder. Please check the console for details.')
    }
  }

  // World building functions
  const loadElements = async (projectId: string) => {
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
      console.log('🗂️ Loaded elements from database:', data)
      console.log('🗂️ Elements by category:', data?.reduce((acc, el) => {
        acc[el.category] = (acc[el.category] || 0) + 1
        return acc
      }, {} as Record<string, number>))
      console.log('🗂️ Folders found:', data?.filter(el => el.is_folder).map(f => ({ name: f.name, category: f.category })))
      console.log('🗂️ Non-folders found:', data?.filter(el => !el.is_folder).map(f => ({ name: f.name, category: f.category })))
      setElements(data || [])
    } catch (error) {
      console.error('Error loading world elements:', error)
    }
  }

  const createElement = async (category: string, name: string, parentFolderId?: string) => {
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
        parent_folder_id: parentFolderId
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error
      
      setElements([...elements, data])
      setSelectedElement(data)
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating element:', error)
    }
  }

  const updateElement = async (elementId: string, updates: Partial<WorldElement>) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .update(updates)
        .eq('id', elementId)
        .select()
        .single()

      if (error) throw error

      setElements(elements.map(el => el.id === elementId ? data : el))
      setSelectedElement(data)
    } catch (error) {
      console.error('Error updating element:', error)
    }
  }

  const deleteElement = async (elementId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', elementId)

      if (error) throw error

      setElements(elements.filter(el => el.id !== elementId))
      setSelectedElement(null)
    } catch (error) {
      console.error('Error deleting element:', error)
    }
  }

  const getDefaultAttributes = (category: string) => {
    switch (category) {
      case 'characters':
        return { age: '', occupation: '', personality: '', backstory: '' }
      case 'locations':
        return { climate: '', population: '', government: '', notable_features: '' }
      case 'species':
        return { lifespan: '', abilities: '', culture: '', habitat: '' }
      case 'cultures':
        return { values: '', traditions: '', government: '', religion: '' }
      case 'items':
        return { type: '', power: '', origin: '', significance: '' }
      case 'magic':
        return { type: '', cost: '', limitations: '', effects: '' }
      case 'systems':
        return { type: '', rules: '', purpose: '', influence: '' }
      case 'languages':
        return { speakers: '', writing_system: '', grammar: '', vocabulary: '' }
      case 'religions':
        return { deity: '', beliefs: '', practices: '', followers: '' }
      case 'philosophies':
        return { core_beliefs: '', followers: '', practices: '', influence: '' }
      default:
        return {}
    }
  }

  // Chapters functions
  const loadChapters = async (projectId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('parent_folder_id', { ascending: true, nullsFirst: true })
        .order('sort_order', { ascending: true })
        .order('chapter_number', { ascending: true })

      if (error) throw error
      
      // Ensure all chapters have the category field set
      const chaptersWithCategory = (data || []).map(chapter => ({
        ...chapter,
        category: chapter.category || 'chapters' // Fallback if category is missing
      }))
      
      console.log('📚 Loaded chapters from database:', chaptersWithCategory)
      console.log('📚 Chapter categories:', chaptersWithCategory.map(ch => ({ title: ch.title, category: ch.category })))
      setChapters(chaptersWithCategory)
    } catch (error) {
      console.error('Error loading chapters:', error)
    }
  }

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
      
      setChapters([...chapters, data])
      setSelectedChapter(data)
    } catch (error) {
      console.error('Error creating chapter:', error)
    }
  }

  const updateChapter = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .update(updates)
        .eq('id', chapterId)
        .select()
        .single()

      if (error) throw error

      setChapters(chapters.map(ch => ch.id === chapterId ? data : ch))
      setSelectedChapter(data)
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

      setChapters(chapters.filter(ch => ch.id !== chapterId))
      setSelectedChapter(null)
    } catch (error) {
      console.error('Error deleting chapter:', error)
    }
  }

  const getElementsForCategory = (category: string): WorldElement[] => {
    // Only return actual elements, not folders
    return elements.filter(el => el.category === category && !el.is_folder)
  }

  // Get total count including folders and elements for category
  const getTotalItemsForCategory = (category: string): number => {
    if (category === 'chapters') {
      // For chapters, count chapters + chapter folders
      const chapterFolders = elements.filter(el => el.category === category && el.is_folder).length
      const chapterCount = chapters.length
      const total = chapterFolders + chapterCount
      console.log(`🗂️ Total items for ${category}:`, total, 'chapters:', chapterCount, 'folders:', chapterFolders)
      return total
    } else {
      // Count both folders and elements for world building categories
      const total = elements.filter(el => el.category === category).length
      console.log(`🗂️ Total items for ${category}:`, total, 'elements:', elements.filter(el => el.category === category))
      return total
    }
  }

  // Helper functions for folder functionality
  const getFoldersForCategory = (category: string): WorldElement[] => {
    return elements.filter(el => el.category === category && el.is_folder)
  }

  const getElementsInFolder = (folderId: string): WorldElement[] => {
    return elements.filter(el => el.parent_folder_id === folderId && !el.is_folder)
  }

  const getRootElementsForCategory = (category: string): WorldElement[] => {
    return elements.filter(el => el.category === category && !el.parent_folder_id && !el.is_folder)
  }

  const renderFolderHierarchy = (category: string, parentFolderId?: string, depth: number = 0): React.ReactElement[] => {
    const items: React.ReactElement[] = []
    
    console.log(`🗂️ Rendering hierarchy for category: ${category}, parentFolderId: ${parentFolderId}, depth: ${depth}`)
    
    // STEP 1: Get folders for this category only
    const folders = elements.filter(el => 
      el.category === category && 
      el.is_folder && 
      (el.parent_folder_id === parentFolderId || (el.parent_folder_id === null && parentFolderId === undefined))
    )
    
    console.log(`🗂️ Found ${folders.length} folders for category ${category}:`, folders.map(f => f.name))
    
    // STEP 2: Get items for this category - STRICT SEPARATION
    let itemsAtLevel: (WorldElement | Chapter)[] = []
    
    if (category === 'chapters') {
      // ONLY for chapters category: get chapters
      itemsAtLevel = chapters.filter(ch => 
        (ch.parent_folder_id === parentFolderId || (ch.parent_folder_id === null && parentFolderId === undefined))
      )
      console.log(`� Chapters for category ${category}:`, itemsAtLevel.map(c => (c as Chapter).title))
    } else {
      // ONLY for non-chapters categories: get world elements (NEVER chapters)
      itemsAtLevel = elements.filter(el => 
        el.category === category && 
        !el.is_folder && 
        (el.parent_folder_id === parentFolderId || (el.parent_folder_id === null && parentFolderId === undefined))
      )
      console.log(`🌍 Elements for category ${category}:`, itemsAtLevel.map(e => (e as WorldElement).name))
      
      // SAFETY CHECK: Log if we're somehow getting chapters in non-chapter categories
      if (itemsAtLevel.some(item => 'chapter_number' in item)) {
        console.error(`🚨 ERROR: Found chapters in non-chapter category ${category}!`, itemsAtLevel.filter(item => 'chapter_number' in item))
      }
    }
    
    // Add folders first
    folders.forEach((folder, index) => {
      const isFolderExpanded = expandedFolders.includes(folder.id)
      const isDraggedOver = dragOverItem === folder.id
      
      items.push(
        <div key={folder.id}>
          {/* Drop indicator before folder */}
          {draggedItem && dragOverItem === folder.id && dropPosition === 'before' && (
            <div className="drop-indicator mb-1" />
          )}
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, { id: folder.id, type: 'folder', category: folder.category })}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, folder.id, 'folder')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id, 'folder')}
            className={`transition-colors ${
              isDraggedOver && dropPosition === 'inside' ? 'bg-blue-50 border-2 border-blue-300' : ''
            }`}
          >
            <button
              onClick={() => toggleFolderExpansion(folder.id)}
              onContextMenu={(e) => handleElementContextMenu(e, 'folder', folder, folder.category)}
              style={{ 
                paddingLeft: `${depth * 16 + 8}px`
              }}
              className={`w-full flex items-center gap-2 pr-2 py-1 text-left text-sm transition-colors ${
                draggedItem?.id === folder.id 
                  ? 'opacity-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isFolderExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
              <Folder className="w-3 h-3 text-amber-500" />
              <span className="font-medium">{folder.name}</span>
            </button>
          </div>
          
          {/* Drop indicator after folder */}
          {draggedItem && dragOverItem === folder.id && dropPosition === 'after' && (
            <div className="drop-indicator mt-1 mb-1" />
          )}
          
          {isFolderExpanded && (
            <div
              onDragOver={(e) => handleDragOver(e, folder.id, 'folder')}
              onDrop={(e) => handleDrop(e, folder.id, 'folder')}
              onDragLeave={handleDragLeave}
              className={`${isDraggedOver && dropPosition === 'inside' ? 'bg-blue-25 border-l-2 border-blue-300' : ''}`}
            >
              {renderFolderHierarchy(category, folder.id, depth + 1)}
            </div>
          )}
        </div>
      )
    })
    
    // STEP 3: Render items - STRICT TYPE CHECKING
    itemsAtLevel.forEach((item, index) => {
      const isChapter = 'chapter_number' in item
      
      // ABSOLUTE SAFETY CHECK: Only render chapters in chapters category
      if (isChapter && category !== 'chapters') {
        console.error(`🚨 BLOCKING: Attempted to render chapter "${(item as Chapter).title}" in category "${category}" - BLOCKED!`)
        return // Skip this item completely
      }
      
      // ABSOLUTE SAFETY CHECK: Only render world elements in non-chapters categories  
      if (!isChapter && category === 'chapters') {
        console.error(`🚨 BLOCKING: Attempted to render world element "${(item as WorldElement).name}" in chapters category - BLOCKED!`)
        return // Skip this item completely
      }
      
      if (isChapter && category === 'chapters') {
        const chapter = item as Chapter
        items.push(
          <div key={`chapter-${chapter.id}`}>
            {/* Drop indicator before chapter */}
            {draggedItem && dragOverItem === chapter.id && dropPosition === 'before' && (
              <div className="drop-indicator mb-1" />
            )}
            
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, { id: chapter.id, type: 'chapter', category: 'chapters' })}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, chapter.id, 'chapter')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, chapter.id, 'chapter')}
              className={`transition-colors ${
                draggedItem?.id === chapter.id ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => setSelectedChapter(chapter)}
                onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter as any, 'chapters')}
                style={{ 
                  paddingLeft: `${depth * 16 + 8}px`
                }}
                className={`w-full flex items-center gap-2 pr-2 py-1 text-left text-sm ${
                  selectedChapter?.id === chapter.id
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3" /> {/* Spacer for alignment */}
                <div className="flex-1">
                  <div className="truncate font-medium">{chapter.title}</div>
                  <div className="text-xs text-gray-500">
                    {chapter.word_count}/{chapter.target_word_count} words • {chapter.status}
                  </div>
                </div>
              </button>
            </div>
            
            {/* Drop indicator after chapter */}
            {draggedItem && dragOverItem === chapter.id && dropPosition === 'after' && (
              <div className="drop-indicator mt-1 mb-1" />
            )}
          </div>
        )
      } else {
        const element = item as WorldElement
        items.push(
          <div key={element.id}>
            {/* Drop indicator before element */}
            {draggedItem && dragOverItem === element.id && dropPosition === 'before' && (
              <div className="drop-indicator mb-1" />
            )}
            
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, { id: element.id, type: 'element', category: element.category })}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, element.id, 'element')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, element.id, 'element')}
              className={`transition-colors ${
                draggedItem?.id === element.id ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => setSelectedElement(element)}
                onContextMenu={(e) => handleElementContextMenu(e, 'element', element, element.category)}
                style={{ 
                  paddingLeft: `${depth * 16 + 8}px`
                }}
                className={`w-full flex items-center gap-2 pr-2 py-1 text-left text-sm ${
                  selectedElement?.id === element.id
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3" /> {/* Spacer for alignment */}
                <span>{element.name}</span>
              </button>
            </div>
            
            {/* Drop indicator after element */}
            {draggedItem && dragOverItem === element.id && dropPosition === 'after' && (
              <div className="drop-indicator mt-1 mb-1" />
            )}
          </div>
        )
      }
    })
    
    return items
  }

  const filteredElements = elements.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                  <div className="text-2xl font-bold text-gray-900 mb-1">0 words</div>
                  <div className="text-sm text-gray-600">Target: 50,000 words</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Characters</h4>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Locations</h4>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button onClick={() => setActivePanel('chapters')} className="bg-orange-500 hover:bg-orange-600 text-white justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Start Writing
                  </Button>
                  <Button onClick={() => setActivePanel('characters')} variant="outline" className="justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Add Character
                  </Button>
                  <Button onClick={() => setActivePanel('locations')} variant="outline" className="justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                  <Button onClick={() => setActivePanel('timeline')} variant="outline" className="justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Plan Timeline
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'chapters':
        return (
          <div className="h-full bg-white flex flex-col">
            {/* chpaters Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                <div className="text-sm text-gray-500">
                  Chapter 1
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  Words: 0 | Characters: 0
                </div>
                <Button variant="outline" size="sm">
                  Save Draft
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </div>
            
            {/* Writing Area */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto h-full">
                <textarea 
                  className="w-full h-full border-none outline-none resize-none text-lg leading-relaxed font-serif text-gray-900 placeholder-gray-400"
                  placeholder="Start writing your story here..."
                  defaultValue={project.description || ''}
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.8',
                    fontSize: '18px'
                  }}
                />
              </div>
            </div>
          </div>
        )
      
      case 'characters':
      case 'chapters':
      case 'locations':
      case 'encyclopedia':
      case 'species':
      case 'cultures':
      case 'items':
      case 'magic':
      case 'systems':
      case 'languages':
      case 'religions':
      case 'philosophies':
        const categoryElements = activePanel === 'chapters' ? [] : getElementsForCategory(activePanel)
        return (
          <div className="h-full bg-white">
            <div className="flex h-full">
              {/* Element List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {sidebarOptions.find(opt => opt.id === activePanel)?.label}
                    </h3>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (activePanel === 'chapters') {
                          createChapter()
                        } else {
                          const name = prompt(`Enter ${activePanel.slice(0, -1)} name:`)
                          if (name) createElement(activePanel, name)
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
                  {activePanel === 'chapters' ? (
                    // Chapters rendering in main panel
                    chapters.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="mb-2">No chapters yet</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={createChapter}
                        >
                          Create first chapter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {chapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            onClick={() => setSelectedChapter(chapter)}
                            onContextMenu={(e) => handleElementContextMenu(e, 'chapter', chapter, 'chapters')}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedChapter?.id === chapter.id
                                ? 'bg-orange-50 border-orange-200 text-orange-800'
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="font-medium">{chapter.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Chapter {chapter.chapter_number} • {chapter.word_count}/{chapter.target_word_count} words • {chapter.status}
                            </div>
                            {chapter.notes && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {chapter.notes}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    // World elements rendering in main panel
                    categoryElements.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="mb-2">No {activePanel} yet</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const name = prompt(`Enter ${activePanel.slice(0, -1)} name:`)
                            if (name) createElement(activePanel, name)
                          }}
                        >
                          Create first {activePanel.slice(0, -1)}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {categoryElements.map((element) => (
                          <button
                            key={element.id}
                            onClick={() => setSelectedElement(element)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedElement?.id === element.id
                                ? 'bg-orange-50 border-orange-200 text-orange-800'
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="font-medium">{element.name}</div>
                            {element.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {element.description}
                              </div>
                            )}
                            {element.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {element.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
              
              {/* Element/Chapter Details */}
              <div className="flex-1 flex flex-col">
                {activePanel === 'chapters' && selectedChapter ? (
                  // Chapter details panel
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
                ) : selectedElement ? (
                  // World element details panel
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
                              updateElement(selectedElement.id, { name: newName })
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
                              deleteElement(selectedElement.id)
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
                          onChange={(e) => updateElement(selectedElement.id, { description: e.target.value })}
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
                            updateElement(selectedElement.id, { tags })
                          }}
                          placeholder="Enter tags separated by commas..."
                          className="w-full"
                        />
                      </div>
                      
                      {/* Attributes based on category */}
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
                                updateElement(selectedElement.id, { attributes: newAttributes })
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
                        {React.createElement(sidebarOptions.find(opt => opt.id === activePanel)?.icon || Target, { 
                          className: `w-16 h-16 mx-auto text-${sidebarOptions.find(opt => opt.id === activePanel)?.color}-300` 
                        })}
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
      
      case 'timeline':
        return (
          <div className="h-full">
            <TimelineManager projectId={project.id} />
          </div>
        )
      
      case 'research':
        return (
          <div className="h-full">
            <ResearchManager projectId={project.id} />
          </div>
        )

      case 'calendar':
        return (
          <div className="h-full bg-white p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Story Calendar</h3>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Add Event
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Calendar View</h4>
                <p className="text-gray-600">Track story events, character birthdays, and world holidays</p>
              </div>
            </div>
          </div>
        )

      case 'arcs':
        return (
          <div className="h-full bg-white p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Story Arcs</h3>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create Arc
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Story Arcs</h4>
                <p className="text-gray-600">Plan and track character arcs and plot threads</p>
              </div>
            </div>
          </div>
        )

      case 'relationships':
        return (
          <div className="h-full bg-white p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Relationships</h3>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Add Relationship
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Character Relationships</h4>
                <p className="text-gray-600">Map connections between characters</p>
              </div>
            </div>
          </div>
        )
      
      case 'maps':
        return (
          <div className="h-full bg-gray-50 flex flex-col">
            {/* Maps Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Maps & Geography</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Map
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                    Create New Map
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Maps Content */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                {/* Map Display Area */}
                <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">World Map</h4>
                    <div className="flex gap-1">
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <ZoomOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-[calc(100%-48px)] bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Map className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">No map uploaded</p>
                      <p className="text-sm">Upload an image or create a new map to get started</p>
                    </div>
                  </div>
                </div>
                
                {/* Map Controls & Info */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Map Layers</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-500" defaultChecked />
                        <span className="text-sm">Political Boundaries</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-500" defaultChecked />
                        <span className="text-sm">Cities & Towns</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-500" />
                        <span className="text-sm">Trade Routes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-orange-500" />
                        <span className="text-sm">Terrain Features</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Notes</h4>
                    <textarea 
                      className="w-full h-24 text-sm border border-gray-200 rounded p-2 resize-none"
                      placeholder="Add notes about geography, climate, or important locations..."
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Map Tools</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <MapPin className="w-4 h-4 mr-2" />
                        Add Location
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Ruler className="w-4 h-4 mr-2" />
                        Measure Distance
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Edit className="w-4 h-4 mr-2" />
                        Add Annotation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-full bg-white p-6">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {sidebarOptions.find(p => p.id === activePanel)?.label || 'Coming Soon'}
              </h3>
              <p className="text-gray-600">This panel is under development</p>
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your novel...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
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

  // Context menu functions
  const handleContextMenu = (e: React.MouseEvent, categoryId: string, categoryLabel: string, hasAdd: boolean) => {
    e.preventDefault()
    if (!hasAdd) return // Only show context menu for expandable categories
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      categoryId,
      categoryLabel
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    console.log('🖱️ Context menu action:', action, 'for category:', contextMenu.categoryId)

    if (action === 'newItem') {
      if (contextMenu.categoryId === 'chapters') {
        createChapter()
      } else {
        const name = prompt(`Enter ${contextMenu.categoryLabel.slice(0, -1)} name:`)
        if (name) {
          createElement(contextMenu.categoryId, name)
        }
      }
    } else if (action === 'newFolder') {
      const name = prompt(`Enter folder name:`)
      console.log('📝 User entered folder name:', name)
      if (name) {
        createFolder(contextMenu.categoryId, name)
      }
    }

    handleCloseContextMenu()
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
                  {project?.title || 'Novel Project'}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  {project?.genre} • {project?.format}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation - Scrollable */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          {sidebarOptions.map((option) => {
            const IconComponent = option.icon
            const categoryElements = getElementsForCategory(option.id)
            const totalItems = getTotalItemsForCategory(option.id)
            const elementsCount = totalItems // Show total count of folders + elements
            const isExpanded = expandedCategories.includes(option.id)
            const canExpand = option.hasAdd && totalItems > 0 // Only expand if can add AND has items
            
            return (
              <div key={option.id} className="group">
                <div className={`flex items-center rounded-lg transition-all duration-200 ${
                  (canExpand && isExpanded) || (!canExpand && activePanel === option.id)
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${canExpand ? 'hover:shadow-sm' : ''}`}>
                  <button
                    onClick={() => {
                      if (canExpand) {
                        // Toggle expand/collapse for categories that can have elements
                        setExpandedCategories(prev => 
                          isExpanded 
                            ? prev.filter(cat => cat !== option.id)
                            : [...prev, option.id]
                        )
                      } else {
                        // For categories without expandable content, set as active panel
                        setActivePanel(option.id)
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, option.id, option.label, option.hasAdd)}
                    className="flex-1 flex items-center gap-3 px-3 py-2 text-left transition-colors"
                    title={sidebarOpen ? undefined : option.label}
                  >
                    <IconComponent className={`w-5 h-5 flex-shrink-0 text-${option.color}-500 transition-colors`} />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{option.label}</span>
                    )}
                    {sidebarOpen && elementsCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {elementsCount}
                      </Badge>
                    )}
                  </button>
                  
                  {sidebarOpen && (
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity pr-2">
                      {option.hasCustomIcon && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle custom icon click
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <Target className="w-3 h-3" />
                        </button>
                      )}
                      {option.hasAdd && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            if (option.id === 'chapters') {
                              createChapter()
                            } else {
                              const name = prompt(`Enter ${option.label.slice(0, -1)} name:`)
                              if (name) {
                                createElement(option.id, name)
                              }
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
                            <ChevronDown className="w-3 h-3 text-gray-600 transform transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-600 transform transition-transform duration-200" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Category Elements with Smooth Animation */}
                {sidebarOpen && option.hasAdd && totalItems > 0 && (
                  <div 
                    className={`ml-8 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded 
                        ? 'max-h-96 opacity-100' 
                        : 'max-h-0 opacity-0'
                    }`}
                    style={{
                      transitionProperty: 'max-height, opacity, padding',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className={`transition-transform duration-300 ease-in-out ${
                      isExpanded ? 'translate-y-0' : '-translate-y-2'
                    }`}>
                      {/* Category Description - only show when category is empty */}
                      {option.description && totalItems === 0 && (
                        <div className="px-4 py-2 mb-2">
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      )}
                      
                      {/* World elements rendering with folder hierarchy */}
                      <div 
                        className="space-y-0.5"
                        onDragOver={(e) => {
                          e.preventDefault()
                          handleDragOver(e, `root-${option.id}`)
                        }}
                        onDrop={(e) => handleDrop(e, option.id, 'root')}
                        onDragLeave={handleDragLeave}
                      >
                        {renderFolderHierarchy(option.id)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {sidebarOpen ? '←' : '→'}
          </Button>
        </div>
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
                    {project?.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {sidebarOptions.find(p => p.id === activePanel)?.label || 'Novel Editor'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                  <Users className="w-4 h-4 mr-2" />
                  Share
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
      
      {/* Element/Folder Context Menu */}
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
                onClick={() => handleCreateNewElement(elementContextMenu.category)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New {elementContextMenu.category.slice(0, -1)}
              </button>
              <button
                onClick={() => handleCreateNewFolder(elementContextMenu.category, elementContextMenu.item?.id)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleRenameFolder(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Folder
              </button>
              <button
                onClick={() => handleIconColorChangeFolder(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleExportFolder(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Export Elements
              </button>
              <button
                onClick={() => handleDeleteFolder(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete from project
              </button>
            </>
          ) : elementContextMenu.type === 'chapter' ? (
            // Chapter context menu
            <>
              <button
                onClick={() => createChapter()}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chapter
              </button>
              <button
                onClick={() => handleCreateNewFolder('chapters')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleRenameChapter(elementContextMenu.item as Chapter)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Chapter
              </button>
              <button
                onClick={() => handleIconColorChangeChapter(elementContextMenu.item as Chapter)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              <button
                onClick={() => handleDuplicateChapter(elementContextMenu.item as Chapter)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Duplicate Chapter
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  // Export chapter as text/markdown
                  const chapter = elementContextMenu.item as Chapter
                  const exportData = `# ${chapter.title}\n\n${chapter.content || ''}\n\n---\n\nNotes: ${chapter.notes || 'None'}\nWord Count: ${chapter.word_count}/${chapter.target_word_count}\nStatus: ${chapter.status}`
                  
                  const dataBlob = new Blob([exportData], { type: 'text/markdown' })
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(dataBlob)
                  link.download = `${chapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
                  link.click()
                  URL.revokeObjectURL(link.href)
                  closeElementContextMenu()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Export Chapter
              </button>
              <button
                onClick={() => {
                  const chapter = elementContextMenu.item as Chapter
                  const url = `/app/novels/${project?.id}?chapter=${chapter.id}`
                  window.open(url, '_blank')
                  closeElementContextMenu()
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Open In New Tab
              </button>
              <button
                onClick={() => handleDeleteChapter(elementContextMenu.item as Chapter)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete from project
              </button>
            </>
          ) : (
            // Element context menu
            <>
              <button
                onClick={() => handleCreateNewElement(elementContextMenu.category)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New {elementContextMenu.category.slice(0, -1)}
              </button>
              <button
                onClick={() => handleCreateNewFolder(elementContextMenu.category)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                New Folder
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleRenameElement(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Rename Element
              </button>
              <button
                onClick={() => handleIconColorChange(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Icon Color
              </button>
              <button
                onClick={() => handleDuplicateElement(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Duplicate Element
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleExportElement(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Export Element
              </button>
              <button
                onClick={() => handleOpenInNewTab(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Open In New Tab
              </button>
              <button
                onClick={() => handleDeleteElement(elementContextMenu.item as WorldElement)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete from project
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Icon Color Modal */}
      {iconColorModal?.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose Icon Color
              </h3>
              <button
                onClick={closeIconColorModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Select a color for{' '}
                <span className="font-medium">
                  {iconColorModal.type === 'chapter' 
                    ? (iconColorModal.item as Chapter)?.title
                    : (iconColorModal.item as WorldElement)?.name
                  }
                </span>
              </p>
              
              <div className="grid grid-cols-6 gap-3">
                {[
                  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
                  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
                  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
                  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
                  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
                  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
                  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
                  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
                  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
                  { name: 'Cyan', value: '#06B6D4', bg: 'bg-cyan-500' },
                  { name: 'Emerald', value: '#059669', bg: 'bg-emerald-500' },
                  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelection(color.value)}
                    className={`w-10 h-10 rounded-lg ${color.bg} hover:scale-110 transition-transform border-2 border-gray-200 hover:border-gray-400`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeIconColorModal}
                className="text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleColorSelection('#6B7280')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModal?.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                {deleteModal.title}
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium mb-1">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-gray-600">
                    {deleteModal.message}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Drag and Drop Styles */}
      <style jsx>{`
        [draggable="true"] {
          cursor: grab;
        }
        [draggable="true"]:active {
          cursor: grabbing;
        }
        .bg-blue-25 {
          background-color: rgb(239 246 255 / 0.5);
        }
        .dragging {
          cursor: grabbing !important;
        }
        .dragging * {
          cursor: grabbing !important;
        }
        .drop-indicator {
          height: 2px !important;
          background-color: #3b82f6 !important;
          border-radius: 9999px !important;
          transition: all 0.2s ease !important;
        }
      `}</style>
    </div>
  )
}
