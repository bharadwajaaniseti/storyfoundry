'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, BookOpen, Users, Save, Settings, Eye, FileText, Map, Clock, 
  Target, MapPin, User, Calendar, Search, Bookmark, Plus, Edit3, Trash2, 
  ChevronDown, ChevronRight, Folder, Edit, Palette, Globe, Shield, Heart, 
  Brain, Zap, Upload, Crown, Download, Copy, ExternalLink, AlertCircle,
  Check, Sparkles, MessageSquare, LogOut, TrendingUp
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
import RelationshipsPanel from '@/components/world-building/relationships-panel'
import ArcsPanel from '@/components/world-building/arcs-panel'
import MagicPanel from '@/components/world-building/magic-panel'
import SpeciesPanel from '@/components/world-building/species-panel'
import CulturesPanel from '@/components/world-building/cultures-panel'
import ItemsPanel from '@/components/world-building/items-panel'
import SystemsPanel from '@/components/world-building/systems-panel'
import LanguagesPanel from '@/components/world-building/languages-panel'
import ReligionsPanel from '@/components/world-building/religions-panel'
import PhilosophiesPanel from '@/components/world-building/philosophies-panel'
import NovelSettingsModal from '@/components/novel-settings-modal'
import InputModal from '@/components/ui/input-modal'
import DeleteModal from '@/components/ui/delete-modal'
import ProjectCollaborationButton from '@/components/project-collaboration-button'
import ProjectCollaborators from '@/components/project-collaborators'
import ProjectHistory from '@/components/project-history'
import ApprovedWorkflow from '@/components/approved-workflow'
import ProjectComments from '@/components/project-comments'
import SendMessageModal from '@/components/send-message-modal'
import EditCollaboratorModal from '@/components/edit-collaborator-modal'
import EditInvitationModal from '@/components/edit-invitation-modal'
import { useProjectCollaborators } from '@/hooks/useCollaboration'
import { getCollaboratorPermissions } from '@/lib/collaboration-utils'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import RoleTag from '@/components/role-tag'
import UserAvatar from '@/components/user-avatar'
import NotificationBell from '@/components/notification-bell'

// Type definitions
interface Project {
  id: string
  title: string
  logline: string
  synopsis?: string | null
  format: string
  genre: string | null
  subgenre?: string | null
  word_count?: number | null
  cast_size?: number | null
  language?: string
  visibility: 'private' | 'preview' | 'public'
  buzz_score?: number
  owner_id: string
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

function NovelPageInner() {
  const router = useRouter()
  const params = useParams()
  
  // Core state
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<string>('dashboard')
  const [activeTab, setActiveTab] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isProjectOwner, setIsProjectOwner] = useState(false)
  
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
  const [triggerNewResearchFile, setTriggerNewResearchFile] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
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

  // Hook for dynamic context menu dimensions
  const useContextMenuDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 200, height: 300 })
    
    const measureMenu = useCallback((menuElement: HTMLElement | null) => {
      if (menuElement) {
        const rect = menuElement.getBoundingClientRect()
        setDimensions({
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height)
        })
      }
    }, [])
    
    return { dimensions, measureMenu }
  }

  const { dimensions: contextMenuDimensions, measureMenu: measureContextMenu } = useContextMenuDimensions()

  // Second hook for category context menu dimensions
  const useCategoryContextMenuDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 200, height: 100 })
    
    const measureMenu = useCallback((menuElement: HTMLElement | null) => {
      if (menuElement) {
        const rect = menuElement.getBoundingClientRect()
        setDimensions({
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height)
        })
      }
    }, [])
    
    return { dimensions, measureMenu }
  }

  const { dimensions: categoryMenuDimensions, measureMenu: measureCategoryMenu } = useCategoryContextMenuDimensions()

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

  const [forceOpenLocationsCreate, setForceOpenLocationsCreate] = useState(false)

  // Message and collaborator modal states
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    display_name: string | null
    avatar_url: string | null
    role: string
  } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<any>(null)
  const [showEditInvitationModal, setShowEditInvitationModal] = useState(false)
  const [editingInvitation, setEditingInvitation] = useState<any>(null)

  // Collaboration data
  const { collaborators, pendingInvitations, loading: collaboratorsLoading, error: collaboratorsError, refresh: refreshCollaborators, updateCollaborator, removeCollaborator } = useProjectCollaborators(project?.id || '')
  const toast = useToast()
  const { getAllRoleNames, userRole } = useRoleBasedUI(project?.id || '', currentUser?.id)

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const projectId = params.id as string
        if (!projectId) return
        
        // Check user authentication and permissions
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setCurrentUser(user)
          // also fetch the user's profile (display_name, first/last name, avatar)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, display_name, avatar_url, role')
              .eq('id', user.id)
              .single()
            if (profile) setUserProfile(profile)
          } catch (e) {
            // ignore profile fetch errors here
            console.warn('Failed to load user profile', e)
          }
        }
        
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
        
        // Check if user is the owner or an active collaborator with write permission
        if (!user) {
          router.push(`/novels/${projectId}/read`)
          return
        }

        const isOwner = projectData.owner_id === user.id
        setIsProjectOwner(isOwner)
        if (isOwner) {
          setProject(projectData)
        } else {
          try {
            // Check if the current user is an active collaborator with write permission
            const supabase = createSupabaseClient()
            const { data: collabRow, error: collabErr } = await supabase
              .from('project_collaborators')
              .select(`*, profiles!project_collaborators_user_id_fkey(id, display_name, avatar_url, verified_pro)`)
              .eq('project_id', projectId)
              .eq('user_id', user.id)
              .eq('status', 'active')
              .single()

            console.log('Collaborator check:', { collabRow, collabErr })
            if (!collabErr && collabRow) {
              const perms = getCollaboratorPermissions(collabRow as any)
              console.log('Collaborator permissions:', perms)
              if (perms.write || perms.read) {
                // Allow collaborators with write (or at least read) to access the editor page
                setProject(projectData)
              } else {
                router.push(`/novels/${projectId}/read`)
                return
              }
            } else {
              // Not a collaborator -> redirect to read-only
              router.push(`/novels/${projectId}/read`)
              return
            }
          } catch (e) {
            console.error('Error checking collaborator permissions', e)
            router.push(`/novels/${projectId}/read`)
            return
          }
        }
        
        // Load world elements and chapters
        console.log('Loading world data for project:', projectId)
        await Promise.all([
          loadWorldElements(projectId),
          loadChapters(projectId)
        ])
        console.log('World data loading completed')
        
      } catch (error) {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [params, router])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (!params?.id) return
      // only respond for this project
      if (e.detail?.projectId !== params.id) return
      setActivePanel('locations')
      setForceOpenLocationsCreate(true)
      // reset after a short tick so the prop can be consumed by LocationsPanel
      setTimeout(() => setForceOpenLocationsCreate(false), 100)
      // also dispatch a direct 'startLocationsCreate' event after a short delay
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('startLocationsCreate', { detail: { projectId: params.id } }))
        } catch (err) {
          console.warn('Failed to dispatch startLocationsCreate', err)
        }
      }, 120)
    }

    window.addEventListener('openLocationsCreate', handler as EventListener)
    return () => window.removeEventListener('openLocationsCreate', handler as EventListener)
  }, [params])

  // Listen for map creation events to refresh world elements
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (!params?.id) return
      // only respond for this project
      if (e.detail?.projectId !== params.id) return
      // Refresh world elements when a new map is created
      loadWorldElements(params.id)
    }

    window.addEventListener('mapCreated', handler as EventListener)
    return () => window.removeEventListener('mapCreated', handler as EventListener)
  }, [params])

  // Add event listener for research file creation
  useEffect(() => {
    if (!params?.id) return
    
    const handleResearchFileCreated = (e: CustomEvent) => {
      console.log('Main page received researchFileCreated event:', e.detail)
      if (e.detail?.projectId !== params.id) return
      
      const researchFile = e.detail.researchFile
      console.log('Adding research file to main page worldElements:', researchFile)
      
      setWorldElements((prev) => {
        const exists = prev.some(el => el.id === researchFile.id)
        if (exists) {
          console.log('Research file already exists in worldElements')
          return prev
        }
        console.log('Adding new research file to worldElements, current count:', prev.length)
        const newElements = [...prev, researchFile]
        console.log('New worldElements count:', newElements.length)
        return newElements
      })
    }

    const handleSidebarReload = (e: CustomEvent) => {
      console.log('Main page received sidebar reload request')
      if (e.detail?.projectId !== params.id) return
      console.log('Reloading world elements from main page')
      loadWorldElements(params.id)
    }

    const handleTimelineCreated = (e: CustomEvent) => {
      console.log('Main page received timeline created event')
      if (e.detail?.projectId !== params.id) return
      console.log('Adding new timeline to worldElements')
      const timeline = e.detail?.timeline
      if (timeline) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === timeline.id)
          if (exists) return prev
          return [...prev, timeline]
        })
      }
    }

    const handleCalendarSystemCreated = (e: CustomEvent) => {
      console.log('Main page received calendarSystemCreated event')
      if (e.detail?.projectId !== params.id) return
      console.log('Adding new calendar system to worldElements')
      const calendarSystem = e.detail?.calendarSystem
      if (calendarSystem) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === calendarSystem.id)
          if (exists) return prev
          return [...prev, calendarSystem]
        })
      }
    }

    const handleRelationshipCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const relationship = e.detail?.relationship
      if (relationship) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === relationship.id)
          if (exists) return prev
          return [...prev, relationship]
        })
      }
    }

    const handleArcCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const arc = e.detail?.arc
      if (arc) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === arc.id)
          if (exists) return prev
          return [...prev, arc]
        })
      }
    }

    const handleMagicCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const magic = e.detail?.magic
      if (magic) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === magic.id)
          if (exists) return prev
          return [...prev, magic]
        })
      }
    }

    const handleSpeciesCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const species = e.detail?.species
      if (species) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === species.id)
          if (exists) return prev
          return [...prev, species]
        })
      }
    }

    const handleCultureCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const culture = e.detail?.culture
      if (culture) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === culture.id)
          if (exists) return prev
          return [...prev, culture]
        })
      }
    }

    const handleItemCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const item = e.detail?.item
      if (item) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === item.id)
          if (exists) return prev
          return [...prev, item]
        })
      }
    }

    const handleSystemCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const system = e.detail?.system
      if (system) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === system.id)
          if (exists) return prev
          return [...prev, system]
        })
      }
    }

    const handleLanguageCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const language = e.detail?.language
      if (language) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === language.id)
          if (exists) return prev
          return [...prev, language]
        })
      }
    }

    const handleReligionCreated = (e: CustomEvent) => {
      console.log('religionCreated event received:', {
        eventProjectId: e.detail?.projectId,
        currentProjectId: params.id,
        match: String(e.detail?.projectId) === String(params.id),
        religion: e.detail?.religion
      })
      
      if (String(e.detail?.projectId) !== String(params.id)) return
      const religion = e.detail?.religion
      if (religion) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === religion.id)
          if (exists) {
            console.log('Religion already exists in sidebar, skipping')
            return prev
          }
          console.log('Adding religion to sidebar:', religion.name)
          return [...prev, religion]
        })
      }
    }

    const handleReligionUpdated = (e: CustomEvent) => {
      console.log('religionUpdated event received:', {
        eventProjectId: e.detail?.projectId,
        currentProjectId: params.id,
        match: String(e.detail?.projectId) === String(params.id)
      })
      
      if (String(e.detail?.projectId) !== String(params.id)) return
      const religion = e.detail?.religion
      if (religion) {
        setWorldElements(prev => {
          console.log('Updating religion in sidebar:', religion.name)
          return prev.map(el => el.id === religion.id ? religion : el)
        })
      }
    }

    const handleReligionDeleted = (e: CustomEvent) => {
      console.log('religionDeleted event received:', {
        eventProjectId: e.detail?.projectId,
        currentProjectId: params.id,
        match: String(e.detail?.projectId) === String(params.id),
        religionId: e.detail?.religionId
      })
      
      if (String(e.detail?.projectId) !== String(params.id)) return
      const religionId = e.detail?.religionId
      if (religionId) {
        setWorldElements(prev => {
          console.log('Removing religion from sidebar:', religionId)
          return prev.filter(el => el.id !== religionId)
        })
      }
    }

    const handlePhilosophyCreated = (e: CustomEvent) => {
      if (e.detail?.projectId !== params.id) return
      const philosophy = e.detail?.philosophy
      if (philosophy) {
        setWorldElements(prev => {
          const exists = prev.some(el => el.id === philosophy.id)
          if (exists) return prev
          return [...prev, philosophy]
        })
      }
    }

    window.addEventListener('researchFileCreated', handleResearchFileCreated as EventListener)
    window.addEventListener('reloadSidebar', handleSidebarReload as EventListener)
    window.addEventListener('timelineCreated', handleTimelineCreated as EventListener)
    window.addEventListener('calendarSystemCreated', handleCalendarSystemCreated as EventListener)
    window.addEventListener('relationshipCreated', handleRelationshipCreated as EventListener)
    window.addEventListener('arcCreated', handleArcCreated as EventListener)
    window.addEventListener('magicCreated', handleMagicCreated as EventListener)
    window.addEventListener('speciesCreated', handleSpeciesCreated as EventListener)
    window.addEventListener('cultureCreated', handleCultureCreated as EventListener)
    window.addEventListener('itemCreated', handleItemCreated as EventListener)
    window.addEventListener('systemCreated', handleSystemCreated as EventListener)
    window.addEventListener('languageCreated', handleLanguageCreated as EventListener)
    window.addEventListener('religionCreated', handleReligionCreated as EventListener)
    window.addEventListener('religionUpdated', handleReligionUpdated as EventListener)
    window.addEventListener('religionDeleted', handleReligionDeleted as EventListener)
    window.addEventListener('philosophyCreated', handlePhilosophyCreated as EventListener)
    
    console.log('Main page event listeners registered for project:', params.id)
    
    return () => {
      console.log('Removing main page event listeners for project:', params.id)
      window.removeEventListener('researchFileCreated', handleResearchFileCreated as EventListener)
      window.removeEventListener('reloadSidebar', handleSidebarReload as EventListener)
      window.removeEventListener('timelineCreated', handleTimelineCreated as EventListener)
      window.removeEventListener('calendarSystemCreated', handleCalendarSystemCreated as EventListener)
      window.removeEventListener('relationshipCreated', handleRelationshipCreated as EventListener)
      window.removeEventListener('arcCreated', handleArcCreated as EventListener)
      window.removeEventListener('magicCreated', handleMagicCreated as EventListener)
      window.removeEventListener('speciesCreated', handleSpeciesCreated as EventListener)
      window.removeEventListener('cultureCreated', handleCultureCreated as EventListener)
      window.removeEventListener('itemCreated', handleItemCreated as EventListener)
      window.removeEventListener('systemCreated', handleSystemCreated as EventListener)
      window.removeEventListener('languageCreated', handleLanguageCreated as EventListener)
      window.removeEventListener('religionCreated', handleReligionCreated as EventListener)
      window.removeEventListener('religionUpdated', handleReligionUpdated as EventListener)
      window.removeEventListener('religionDeleted', handleReligionDeleted as EventListener)
      window.removeEventListener('philosophyCreated', handlePhilosophyCreated as EventListener)
    }
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

      if (error) {
        console.error('Error loading world elements:', error)
        throw error
      }
      console.log('Loaded world elements:', data?.length || 0, 'items')
      setWorldElements(data || [])
    } catch (error) {
      console.error('Failed to load world elements:', error)
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

      if (error) {
        console.error('Error loading chapters:', error)
        throw error
      }
      
      // Ensure chapters have category field
      const chaptersWithCategory = (data || []).map(chapter => ({
        ...chapter,
        category: chapter.category || 'chapters'
      }))
      
      console.log('Loaded chapters:', chaptersWithCategory.length, 'items')
      setChapters(chaptersWithCategory)
    } catch (error) {
      console.error('Failed to load chapters:', error)
    }
  }

  // Project settings handlers
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  const handleProjectDelete = () => {
    router.push('/projects')
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
    
    // Special handling for research category - only include research files, not content
    if (category === 'research') {
      return worldElements.filter(el => 
        el.category === category && 
        !el.is_folder && 
        el.attributes && 
        el.attributes.research_type === 'file'
      )
    }
    
    // Special handling for calendar category - calendar systems are stored as 'calendar_system'
    if (category === 'calendar') {
      return worldElements.filter(el => el.category === 'calendar_system' && !el.is_folder)
    }
    
    return worldElements.filter(el => el.category === category && !el.is_folder)
  }, [chapters, worldElements])

  const getTotalItemsForCategory = (category: string): number => {
    if (category === 'chapters') {
      const chapterFolders = worldElements.filter(el => el.category === category && el.is_folder).length
      return chapterFolders + chapters.length
    }
    
    // Special handling for research category - only count research files, not content
    if (category === 'research') {
      return worldElements.filter(el => 
        el.category === category && 
        el.attributes && 
        el.attributes.research_type === 'file'
      ).length
    }
    
    // Special handling for calendar category - calendar systems are stored as 'calendar_system'
    if (category === 'calendar') {
      return worldElements.filter(el => el.category === 'calendar_system').length
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
      // Special handling for calendar category - calendar systems are stored as 'calendar_system'
      const actualCategory = categoryId === 'calendar' ? 'calendar_system' : categoryId
      
      const folders = worldElements.filter(el => el.category === actualCategory && el.is_folder && !el.parent_folder_id)
      const rootElements = worldElements.filter(el => {
        const matchesCategory = el.category === actualCategory && !el.is_folder && !el.parent_folder_id
        if (categoryId === 'research' && el.attributes?.research_type) {
          return matchesCategory && el.attributes.research_type === 'file'
        }
        return matchesCategory
      })
      
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
                  {worldElements.filter(el => {
                    const matchesFolder = el.category === actualCategory && !el.is_folder && el.parent_folder_id === folder.id
                    if (categoryId === 'research' && el.attributes?.research_type) {
                      return matchesFolder && el.attributes.research_type === 'file'
                    }
                    return matchesFolder
                  }).map(element => (
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
                
                // Handle timeline selection - dispatch event for TimelinePanel
                if (categoryId === 'timeline') {
                  // Add a small delay to ensure TimelinePanel event listeners are registered
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('timelineSelected', {
                      detail: {
                        projectId: params?.id,
                        timelineId: element.id
                      }
                    }))
                  }, 100)
                }
                
                // Handle calendar system selection - dispatch event for CalendarPanel
                if (categoryId === 'calendar') {
                  // Add a small delay to ensure CalendarPanel event listeners are registered
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('calendarSystemSelected', {
                      detail: {
                        projectId: params?.id,
                        calendarSystemId: element.id,
                        calendarSystem: element
                      }
                    }))
                  }, 100)
                }
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
    
    // Get exact mouse coordinates
    const mouseX = e.clientX
    const mouseY = e.clientY
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Use measured dimensions or fallback to defaults
    const menuWidth = categoryMenuDimensions.width || 200
    const menuHeight = categoryMenuDimensions.height || 100
    const margin = 8
    
    // Calculate available space in all directions
    const spaceRight = viewportWidth - mouseX
    const spaceLeft = mouseX
    const spaceBelow = viewportHeight - mouseY
    const spaceAbove = mouseY
    
    // Determine horizontal position with improved logic
    let x: number
    if (spaceRight >= menuWidth + margin) {
      // Show to the right (default)
      x = mouseX + 4
    } else if (spaceLeft >= menuWidth + margin) {
      // Show to the left
      x = mouseX - menuWidth - 4
    } else {
      // Center horizontally if neither side has enough space
      x = Math.max(margin, Math.min(
        mouseX - menuWidth / 2,
        viewportWidth - menuWidth - margin
      ))
    }
    
    // Determine vertical position with improved logic
    let y: number
    if (spaceBelow >= menuHeight + margin) {
      // Show below (default)
      y = mouseY + 4
    } else if (spaceAbove >= menuHeight + margin) {
      // Show above - this is the key fix for bottom screen items
      y = mouseY - menuHeight - 4
    } else {
      // If neither above nor below has enough space, position optimally
      if (spaceAbove > spaceBelow) {
        // More space above, position at top of available space
        y = Math.max(margin, mouseY - menuHeight - 4)
      } else {
        // More space below, position at bottom of available space
        y = Math.min(mouseY + 4, viewportHeight - menuHeight - margin)
      }
    }
    
    // Final viewport clamping for absolute safety
    x = Math.max(margin, Math.min(x, viewportWidth - menuWidth - margin))
    y = Math.max(margin, Math.min(y, viewportHeight - menuHeight - margin))
    
    setContextMenu({
      visible: true,
      x,
      y,
      categoryId,
      categoryLabel
    })
  }

  const handleElementContextMenu = (e: React.MouseEvent, type: 'folder' | 'element' | 'chapter', item: WorldElement | Chapter, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get exact mouse coordinates
    const mouseX = e.clientX
    const mouseY = e.clientY
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Use measured dimensions or fallback to defaults
    const menuWidth = contextMenuDimensions.width || 200
    const menuHeight = contextMenuDimensions.height || 300
    const margin = 8
    
    // Calculate available space in all directions
    const spaceRight = viewportWidth - mouseX
    const spaceLeft = mouseX
    const spaceBelow = viewportHeight - mouseY
    const spaceAbove = mouseY
    
    // Determine horizontal position with improved logic
    let x: number
    if (spaceRight >= menuWidth + margin) {
      // Show to the right (default)
      x = mouseX + 4
    } else if (spaceLeft >= menuWidth + margin) {
      // Show to the left
      x = mouseX - menuWidth - 4
    } else {
      // Center horizontally if neither side has enough space
      x = Math.max(margin, Math.min(
        mouseX - menuWidth / 2,
        viewportWidth - menuWidth - margin
      ))
    }
    
    // Determine vertical position with improved logic
    let y: number
    if (spaceBelow >= menuHeight + margin) {
      // Show below (default)
      y = mouseY + 4
    } else if (spaceAbove >= menuHeight + margin) {
      // Show above - this is the key fix for bottom screen items
      y = mouseY - menuHeight - 4
    } else {
      // If neither above nor below has enough space, position optimally
      if (spaceAbove > spaceBelow) {
        // More space above, position at top of available space
        y = Math.max(margin, mouseY - menuHeight - 4)
      } else {
        // More space below, position at bottom of available space
        y = Math.min(mouseY + 4, viewportHeight - menuHeight - margin)
      }
    }
    
    // Final viewport clamping for absolute safety
    x = Math.max(margin, Math.min(x, viewportWidth - menuWidth - margin))
    y = Math.max(margin, Math.min(y, viewportHeight - menuHeight - margin))
    
    setElementContextMenu({
      visible: true,
      x,
      y,
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

  const handleLocationsChange = useCallback(() => {
    if (project) {
      loadWorldElements(project.id)
    }
  }, [project])

  const handleChaptersChange = useCallback(() => {
    if (project) {
      loadChapters(project.id)
    }
  }, [project])

  // Collaboration handler functions
  const handleSendMessage = (userId: string, displayName: string | null, avatarUrl: string | null, role: string) => {
    setMessageRecipient({
      id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      role: role
    })
    setShowMessageModal(true)
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/collaborations/invitations/${invitationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh the collaborators list to update the UI
        refreshCollaborators()
      } else {
        console.error('Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error canceling invitation:', error)
    }
  }

  const handleEditInvitation = (invitation: any) => {
    setEditingInvitation(invitation)
    setShowEditInvitationModal(true)
  }

  const handleUpdateInvitation = async (invitationId: string, updates: { role?: string; royalty_split?: number }) => {
    try {
      const response = await fetch(`/api/collaborations/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
  // Refresh the collaborators list to update the UI
  await refreshCollaborators()
  try { window.dispatchEvent(new CustomEvent('collaborators:updated', { detail: { projectId: project?.id } })) } catch (e) { }
  toast.addToast?.({ type: 'success', title: 'Invitation Updated', message: 'Invitation updated successfully' })
        setShowEditInvitationModal(false)
        setEditingInvitation(null)
      } else {
        const errorData = await response.text()
        console.error('Failed to update invitation:', response.status, errorData)
        toast.addToast?.({ type: 'error', title: 'Update Failed', message: errorData || 'Failed to update invitation' })
      }
    } catch (error) {
      console.error('Error updating invitation:', error)
      toast.addToast?.({ type: 'error', title: 'Update Failed', message: error instanceof Error ? error.message : 'Error updating invitation' })
    }
  }

  const renderPanelContent = useCallback(() => {
    if (!project) return null

    // Show collaboration content if any collaboration tab is active
    if (activeTab) {
      switch (activeTab) {
        case 'collaborators':
          return (
            <div className="h-full bg-gray-50 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Collaborators</h2>
                        <p className="text-gray-600">Manage who can contribute to your project</p>
                        {process.env.NODE_ENV === 'development' && collaborators.length > 0 && collaborators[0]?.id?.startsWith('mock-') && (
                          <div className="mt-3 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              🧪 <strong>Development Mode:</strong> Showing mock collaboration data because database is unavailable
                            </p>
                          </div>
                        )}
                      </div>
                      {isProjectOwner && (
                        <ProjectCollaborationButton 
                          projectId={project.id}
                          projectTitle={project.title}
                          isOwner={isProjectOwner}
                          currentCollaborators={collaborators}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          onInvitationSent={refreshCollaborators}
                        />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    {collaboratorsLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading collaborators...</p>
                      </div>
                    ) : collaboratorsError ? (
                      <div className="text-center py-16">
                        <div className="relative mx-auto mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Oops! Something went wrong</h3>
                        <p className="text-gray-600 mb-2">We couldn't load your collaborators right now.</p>
                        <p className="text-sm text-red-600 mb-6 font-mono bg-red-50 px-3 py-2 rounded-lg inline-block">{collaboratorsError}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Try Again
                          </button>
                          <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-orange-300 hover:text-orange-700 transition-colors">
                            Contact Support
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                          Don't worry - your collaborators are still there! This is just a temporary loading issue.
                        </p>
                      </div>
                    ) : (collaborators.length === 0 && pendingInvitations.length === 0) ? (
                      /* Empty State */
                      <div className="text-center py-20">
                        {/* Animated Icon Container */}
                        <div className="relative mx-auto mb-8">
                          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                            <Users className="w-12 h-12 text-orange-600" />
                          </div>
                          {/* Floating Elements */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce delay-300">
                            <MessageSquare className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>

                        {isProjectOwner ? (
                          // Owner empty state - can invite collaborators
                          <>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                              Ready to build your dream team? ✨
                            </h3>
                            <p className="text-lg text-gray-700 mb-3 max-w-lg mx-auto">
                              Great stories are born from collaboration! 
                            </p>
                            <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                              Invite talented writers, skilled editors, creative translators, and experienced producers to join your project. 
                              Share revenue, combine expertise, and create something amazing together.
                            </p>

                            {/* Feature Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Find Your Tribe</h4>
                                <p className="text-sm text-gray-600">Connect with writers, editors, and creators who share your vision</p>
                              </div>
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <Sparkles className="w-6 h-6 text-green-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Share Revenue</h4>
                                <p className="text-sm text-gray-600">Set up fair revenue sharing and build a sustainable creative partnership</p>
                              </div>
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Grow Together</h4>
                                <p className="text-sm text-gray-600">Track contributions and watch your project flourish with diverse skills</p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                              <ProjectCollaborationButton 
                                projectId={project.id}
                                projectTitle={project.title}
                                isOwner={isProjectOwner}
                                currentCollaborators={collaborators}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                onInvitationSent={refreshCollaborators}
                              />
                              <button className="px-6 py-3 border-2 border-orange-200 text-orange-700 font-medium rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Learn About Collaboration</span>
                              </button>
                            </div>

                            {/* Encouraging Note */}
                            <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 max-w-md mx-auto">
                              <p className="text-sm text-orange-800">
                                💡 <strong>Pro tip:</strong> The best collaborations start with clear communication and shared goals. 
                                Take time to discuss roles and expectations with your team!
                              </p>
                            </div>
                          </>
                        ) : (
                          // Non-owner empty state - readonly view
                          <>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                              No collaborators yet 🤝
                            </h3>
                            <p className="text-lg text-gray-700 mb-3 max-w-lg mx-auto">
                              This project doesn't have any collaborators at the moment.
                            </p>
                            <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                              When the project owner invites team members, you'll be able to see who's working on this project and their roles.
                            </p>

                            {/* Read-only Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <Eye className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">View Team</h4>
                                <p className="text-sm text-gray-600">See who's working on this project and their contributions</p>
                              </div>
                              <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <MessageSquare className="w-6 h-6 text-green-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Stay Updated</h4>
                                <p className="text-sm text-gray-600">Get notified when new team members join the project</p>
                              </div>
                            </div>

                            {/* Info Note */}
                            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 max-w-md mx-auto">
                              <p className="text-sm text-blue-800">
                                ℹ️ Only project owners can invite and manage collaborators. 
                                You can view team information and track project progress here.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Collaborators List */
                      <div className="space-y-6">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-blue-600 font-medium">Total Collaborators</p>
                                <p className="text-2xl font-bold text-blue-900">{collaborators.length + pendingInvitations.length}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-green-600 font-medium">Active Members</p>
                                <p className="text-2xl font-bold text-green-900">
                                  {collaborators.filter(c => c.status === 'active').length}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-purple-600 font-medium">Revenue Share</p>
                                <p className="text-2xl font-bold text-purple-900">
                                  {collaborators.reduce((total, c) => total + (c.royalty_split || 0), 0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Active Collaborators */}
                        {collaborators.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Collaborators</h4>
                            <div className="grid gap-4">
                              {collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900">{collaborator.profiles?.display_name || 'Unknown User'}</h5>
                                        <div className="flex items-center space-x-3 mt-1">
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            collaborator.role === 'coauthor' ? 'bg-yellow-100 text-yellow-800' :
                                            collaborator.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                            collaborator.role === 'translator' ? 'bg-green-100 text-green-800' :
                                            collaborator.role === 'producer' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {collaborator.role}
                                          </span>
                                          {collaborator.royalty_split && collaborator.royalty_split > 0 && (
                                            <span className="text-xs text-gray-600">
                                              {collaborator.royalty_split}% revenue share
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button 
                                        onClick={() => {
                                          setMessageRecipient({
                                            id: collaborator.user_id,
                                            display_name: collaborator.profiles?.display_name || null,
                                            avatar_url: collaborator.profiles?.avatar_url || null,
                                            role: collaborator.role
                                          })
                                          setShowMessageModal(true)
                                        }}
                                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Send Message"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                      {isProjectOwner && (
                                        <button 
                                          onClick={() => {
                                            setEditingCollaborator(collaborator)
                                            setShowEditModal(true)
                                          }}
                                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                          title="Edit Role & Permissions"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Invitations */}
                        {pendingInvitations.length > 0 && (
                          <div className="space-y-4 mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                              <Clock className="w-5 h-5 text-orange-500" />
                              <span>Pending Invitations ({pendingInvitations.length})</span>
                            </h3>
                            {pendingInvitations.map((invitation) => (
                              <div key={invitation.id} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative">
                                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                          {invitation.profiles?.display_name?.slice(0, 2).toUpperCase() || invitation.invitee?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <Clock className="w-3 h-3 text-white" />
                                      </div>
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-1">
                                        <h4 className="font-semibold text-gray-900">
                                          {invitation.profiles?.display_name || invitation.invitee?.display_name || 'Unknown User'}
                                        </h4>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                          {invitation.role?.toUpperCase()}
                                        </span>
                                        {invitation.royalty_split && invitation.royalty_split > 0 && (
                                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                            {invitation.royalty_split}% revenue
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <span className="flex items-center space-x-1">
                                          <Clock className="w-4 h-4" />
                                          <span>Invited {new Date(invitation.created_at).toLocaleDateString()}</span>
                                        </span>
                                        <span className="flex items-center space-x-1 text-orange-600">
                                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                          <span>Pending Response</span>
                                        </span>
                                      </div>
                                      {invitation.message && (
                                        <p className="text-sm text-gray-600 mt-2 italic">
                                          "{invitation.message}"
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => handleSendMessage(
                                        invitation.invitee_id, 
                                        invitation.profiles?.display_name || invitation.invitee?.display_name || null,
                                        invitation.profiles?.avatar_url || invitation.invitee?.avatar_url || null,
                                        invitation.role
                                      )}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Send Message"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    {isProjectOwner && (
                                      <button 
                                        onClick={() => handleEditInvitation(invitation)}
                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit Invitation"
                                      >
                                        <Settings className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Project Comments */}
                        <div className="mt-8">
                          <ProjectComments
                            projectId={project.id}
                            userId={currentUser?.id}
                          />
                        </div>

                        {/* Action Footer */}
                        <div className="pt-6 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Manage collaboration permissions and revenue sharing for your team
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        case 'history':
          return <ProjectHistory projectId={project.id} />
        case 'approved-workflow':
          return (
            <ApprovedWorkflow
              projectId={project.id}
              project={project}
              currentUser={currentUser}
              userId={currentUser?.id}
              userRole={userRole}
            />
          )
        default:
          break
      }
    }

    switch (activePanel) {
      case 'dashboard':
        return (
          <div className="h-full bg-gray-50 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white">
                <h3 className="text-3xl font-bold mb-2">Welcome back, Writer!</h3>
                <p className="text-orange-100 text-lg">Your creative journey continues with "{project.title}"</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">{project.genre}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">{project.format}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {new Date(project.created_at).toLocaleDateString()} started
                  </span>
                </div>
              </div>

              {/* Writing Progress & Goals */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Total Words */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Total Words</h4>
                      <p className="text-sm text-gray-500">Your progress</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {chapters.reduce((total, ch) => total + ch.word_count, 0).toLocaleString()}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (chapters.reduce((total, ch) => total + ch.word_count, 0) / 50000) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {Math.round((chapters.reduce((total, ch) => total + ch.word_count, 0) / 50000) * 100)}% to 50K goal
                  </p>
                </div>

                {/* Chapters Completed */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Chapters</h4>
                      <p className="text-sm text-gray-500">Story structure</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {chapters.length}
                  </div>
                  <p className="text-sm text-gray-600">
                    {chapters.filter(ch => ch.status === 'completed').length} completed
                  </p>
                </div>

                {/* Characters */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Characters</h4>
                      <p className="text-sm text-gray-500">Cast members</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {getElementsForCategory('characters').length}
                  </div>
                  <p className="text-sm text-gray-600">
                    Bringing life to your story
                  </p>
                </div>

                {/* World Elements */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">World Building</h4>
                      <p className="text-sm text-gray-500">Universe depth</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {worldElements.length}
                  </div>
                  <p className="text-sm text-gray-600">
                    Locations, items & lore
                  </p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Writing Insights & Progress */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Daily Writing Goal */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        Daily Writing Goal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Today's Progress</span>
                          <span className="text-sm text-gray-500">0 / 500 words</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Keep the momentum going! Even 100 words brings you closer to your dreams.
                        </p>
                        <Button 
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                          onClick={() => setActivePanel('chapters')}
                        >
                          Start Writing Today
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity & Chapter Status */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        Chapter Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {chapters.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h4 className="font-medium text-gray-900 mb-2">Ready to begin your story?</h4>
                            <p className="text-sm text-gray-500 mb-4">Every great novel starts with a single chapter.</p>
                            <Button 
                              onClick={() => {
                                setActivePanel('chapters')
                                setTriggerNewChapter(true)
                                setTimeout(() => setTriggerNewChapter(false), 100)
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Chapter
                            </Button>
                          </div>
                        ) : (
                          chapters.slice(0, 5).map(chapter => (
                            <div key={chapter.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                 onClick={() => {
                                   setSelectedChapter(chapter)
                                   setActivePanel('chapters')
                                 }}>
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                chapter.status === 'completed' ? 'bg-green-100 text-green-600' :
                                chapter.status === 'in_review' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{chapter.title}</h5>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>{chapter.word_count} words</span>
                                  <span>•</span>
                                  <span className="capitalize">{chapter.status.replace('_', ' ')}</span>
                                  {chapter.target_word_count > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{Math.round((chapter.word_count / chapter.target_word_count) * 100)}% complete</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge variant={
                                chapter.status === 'completed' ? 'default' :
                                chapter.status === 'in_review' ? 'secondary' :
                                'outline'
                              }>
                                {chapter.status === 'completed' ? 'Done' :
                                 chapter.status === 'in_review' ? 'Review' :
                                 'Draft'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* World Building Overview */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        Your Story Universe
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Locations', count: getElementsForCategory('locations').length, icon: MapPin, color: 'green' },
                          { label: 'Research', count: getElementsForCategory('research').length, icon: Search, color: 'purple' },
                          { label: 'Timeline', count: getElementsForCategory('timeline').length, icon: Clock, color: 'indigo' },
                          { label: 'Magic/Items', count: getElementsForCategory('magic').length + getElementsForCategory('items').length, icon: Zap, color: 'yellow' }
                        ].map(item => (
                          <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                               onClick={() => {
                                 setActivePanel(item.label.toLowerCase())
                                 if (item.label === 'Locations') {
                                   try {
                                     window.dispatchEvent(new CustomEvent('openLocationsCreate', { detail: { projectId: params?.id } }))
                                   } catch (err) {
                                     console.warn('Failed to dispatch openLocationsCreate', err)
                                   }
                                 }
                               }}>
                            <item.icon className={`w-8 h-8 text-${item.color}-500 mx-auto mb-2`} />
                            <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                            <div className="text-sm text-gray-600">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Writer's Toolkit */}
                <div className="space-y-6">
                  {/* Writer's Inspiration */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <Brain className="w-5 h-5" />
                        Daily Inspiration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <blockquote className="text-sm italic text-gray-700 border-l-4 border-purple-300 pl-4">
                          "The first draft of anything is shit."
                        </blockquote>
                        <p className="text-xs text-gray-600">— Ernest Hemingway</p>
                        <p className="text-sm text-gray-600">
                          Remember: every bestselling author started with an imperfect first draft. Your story matters.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Writing Tips */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Writer's Tip
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">Show, Don't Tell</h5>
                        <p className="text-sm text-gray-600">
                          Instead of "She was angry," try "Her knuckles whitened around the coffee mug." 
                          Let readers feel emotions through actions and details.
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          More Writing Tips
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            clearSelectedElement()
                            setActivePanel('characters')
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Create New Character
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            clearSelectedElement()
                            setActivePanel('locations')
                            try {
                              window.dispatchEvent(new CustomEvent('openLocationsCreate', { detail: { projectId: params?.id } }))
                            } catch (err) {
                              console.warn('Failed to dispatch openLocationsCreate from Quick Actions', err)
                            }
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Add Location
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setActivePanel('timeline')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Plot Timeline Event
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setActivePanel('research')}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Save Research
                        </Button>
                        
                        {/* Collaboration Quick Action */}
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            Collaboration
                          </p>
                          <ProjectCollaborationButton 
                            projectId={project.id}
                            projectTitle={project.title}
                            isOwner={true}
                            currentCollaborators={[]}
                            className="w-full justify-start text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Writing Statistics */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Your Writing Journey
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Days writing</span>
                          <span className="font-semibold">
                            {Math.floor((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg words/chapter</span>
                          <span className="font-semibold">
                            {chapters.length > 0 ? Math.round(chapters.reduce((total, ch) => total + ch.word_count, 0) / chapters.length) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Story completeness</span>
                          <span className="font-semibold">
                            {Math.round((chapters.filter(ch => ch.status === 'completed').length / Math.max(chapters.length, 1)) * 100)}%
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 text-center">
                            Keep going! Every word counts toward your masterpiece.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
        {
          const elementsForLocations = getElementsForCategory('locations')
          const worldItemsForLocations = elementsForLocations.filter((e): e is WorldElement => (e as Chapter).chapter_number === undefined)
          const foldersForLocations = getFoldersForCategory('locations')
              return (
                <LocationsPanel 
                  projectId={project.id}
                  selectedElement={selectedElement}
                  onLocationsChange={handleLocationsChange}
                  onClearSelection={() => setSelectedElement(null)}
                  openCreateOnOpen={forceOpenLocationsCreate || (foldersForLocations.length === 0 && worldItemsForLocations.length === 0)}
                />
              )
        }

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
            selectedElement={selectedElement}
            triggerCreateFile={triggerNewResearchFile}
          />
        )

      case 'maps':
        return (
          <MapsPanel 
            projectId={project.id}
            mapId={selectedElement?.id}
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
            selectedElement={selectedElement}
            onEncyclopediaChange={handleLocationsChange}
            onNavigateToElement={navigateToWorldElement}
          />
        )

      case 'relationships':
        return (
          <RelationshipsPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onRelationshipsChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'arcs':
        return (
          <ArcsPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onArcsChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'magic':
        return (
          <MagicPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onMagicChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
            onNavigateToElement={navigateToWorldElement}
          />
        )

      case 'species':
        return (
          <SpeciesPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onSpeciesChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'cultures':
        return (
          <CulturesPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onCulturesChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'items':
        return (
          <ItemsPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onItemsChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'systems':
        return (
          <SystemsPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onSystemsChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'languages':
        return (
          <LanguagesPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onLanguagesChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'religions':
        return (
          <ReligionsPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onReligionsChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      case 'philosophies':
        return (
          <PhilosophiesPanel 
            projectId={project.id}
            selectedElement={selectedElement}
            onPhilosophiesChange={handleLocationsChange}
            onClearSelection={clearSelectedElement}
          />
        )

      default:
        // Render a generic world-elements panel for categories that don't
        // have a dedicated panel component yet (e.g., arcs, magic, items...).
        const categoryLabel = SIDEBAR_OPTIONS.find(o => o.id === activePanel)?.label || activePanel
  const elements = getElementsForCategory(activePanel)
  // Only keep WorldElement items here (filter out Chapter objects)
  const worldItems = elements.filter((e): e is WorldElement => (e as Chapter).chapter_number === undefined)
  const folders = getFoldersForCategory(activePanel)

        return (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{categoryLabel}</h2>
                  <p className="text-sm text-gray-500">Manage your {categoryLabel.toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      // Open the create flow for this category
                      if (activePanel === 'chapters') {
                        setActivePanel('chapters')
                        setTriggerNewChapter(true)
                        setTimeout(() => setTriggerNewChapter(false), 100)
                      } else if (activePanel === 'characters') {
                        handleShowCharacterEditor()
                      } else {
                        // Create a generic world element
                        createWorldElement(activePanel, `New ${categoryLabel.slice(0, -1)}`)
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New {categoryLabel.slice(0, -1)}
                  </Button>
                </div>
              </div>

              {folders.length === 0 && worldItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No {categoryLabel.toLowerCase()} yet.</p>
                  <div className="mt-4">
                    <Button onClick={() => createWorldElement(activePanel, `New ${categoryLabel.slice(0, -1)}`)} className="bg-orange-500 hover:bg-orange-600 text-white">
                      Create First {categoryLabel.slice(0, -1)}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Folders */}
                  {folders.map(folder => (
                    <div key={folder.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">{folder.name}</div>
                            <div className="text-xs text-gray-500">Folder</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleFolderExpansion(folder.id)} className="text-sm text-gray-600 hover:text-gray-800">Open</button>
                          <button onClick={() => {
                            setInputModal({
                              isOpen: true,
                              type: 'rename',
                              title: 'Rename Folder',
                              defaultValue: folder.name,
                              onConfirm: (newName) => updateWorldElement(folder.id, { name: newName })
                            })
                          }} className="text-sm text-gray-600 hover:text-gray-800">Rename</button>
                        </div>
                      </div>

                      {expandedFolders.includes(folder.id) && (
                        <div className="mt-3 ml-6 space-y-2">
                          {worldElements.filter(el => el.parent_folder_id === folder.id && el.category === activePanel && !el.is_folder).map(el => (
                            <div key={el.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <div className="truncate">
                                  <div className="font-medium text-gray-800">{el.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{el.description}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <button onClick={() => { setSelectedElement(el); setActivePanel(activePanel) }} className="mr-3">Open</button>
                                <button onClick={() => { setDeleteModal({ isOpen: true, type: 'element', title: 'Delete Element', itemName: el.name, onConfirm: () => deleteWorldElement(el.id) }) }}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Root Elements */}
                  {worldItems.filter(el => !el.is_folder).map(el => (
                    <div key={el.id} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{el.name}</div>
                          <div className="text-xs text-gray-500 truncate" style={{ maxWidth: 500 }}>{el.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedElement(el); setActivePanel(activePanel) }}>Open</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setDeleteModal({ isOpen: true, type: 'element', title: 'Delete Element', itemName: el.name, onConfirm: () => deleteWorldElement(el.id) }) }}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
    }
  }, [activePanel, activeTab, project, getElementsForCategory, chapters, worldElements.length, navigateToWorldElement, selectedElement, clearSelectedElement, handleCharactersChange, handleChaptersChange, triggerNewChapter])

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
                      // Ensure any active tab or selection is cleared so panel navigation wins
                      setSidebarOpen(true)
                      clearSelectedElement()
                      setActiveTab('')

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
                            
                            // For timeline, trigger timeline creation
                            if (option.id === 'timeline') {
                              // Ensure we're on the timeline panel
                              setActivePanel('timeline')
                              // Trigger timeline creation form
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('triggerTimelineCreation', { 
                                  detail: { projectId: params?.id } 
                                }))
                              }, 100)
                            }
                            
                            // For research, trigger file creation directly
                            if (option.id === 'research') {
                              // Ensure we're on the research panel
                              setActivePanel('research')
                              // Clear any selected research element to ensure clean state
                              setSelectedElement(null)
                              // Trigger the research file creation
                              setTriggerNewResearchFile(true)
                              // Reset trigger after a brief moment
                              setTimeout(() => setTriggerNewResearchFile(false), 100)
                            }
                            
                            // For calendar, trigger the choose calendar type screen
                            if (option.id === 'calendar') {
                              // Ensure we're on the calendar panel
                              setActivePanel('calendar')
                              // Trigger the calendar type selection (black screen with two buttons)
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('openCalendarTypeSelection', { 
                                  detail: { projectId: params?.id } 
                                }))
                              }, 100)
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
                  
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isProjectOwner && (
                  <ProjectCollaborationButton 
                    projectId={project.id}
                    projectTitle={project.title}
                    isOwner={isProjectOwner}
                    currentCollaborators={[]}
                    className="text-sm"
                  />
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={() => window.open(`/novels/${project.id}/read`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100" onClick={() => setShowSettingsModal(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
                {/* Notifications and User Menu */}
                <div className="flex items-center space-x-4">
                  <NotificationBell />

                  {currentUser ? (
                    <div className="relative group">
                      <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <UserAvatar
                          user={{
                            avatar_url: userProfile?.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.avatar_url || null,
                            display_name: userProfile?.display_name || currentUser?.user_metadata?.full_name || currentUser?.display_name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')
                          }}
                          size="sm"
                        />
                        <div className="hidden sm:flex flex-col items-start space-y-1">
                          <span className="text-sm font-medium text-gray-700">
                            {userProfile?.display_name || currentUser?.user_metadata?.full_name || currentUser?.display_name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}
                          </span>
                          <div>
                            <RoleTag role={userRole ? (userRole as string) : ((getAllRoleNames && getAllRoleNames()[0]) || 'Viewer')} />
                          </div>
                        </div>
                      </button>

                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-2">
                          <a
                            href="/app/settings"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </a>
                          <button
                            onClick={async () => {
                              try {
                                const supabase = createSupabaseClient()
                                await supabase.auth.signOut()
                                window.location.href = '/'
                              } catch (err) {
                                console.error('Sign out error:', err)
                              }
                            }}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">
                  {activeTab ? 
                    (activeTab === 'collaborators' ? 'Collaborators' : 
                     SIDEBAR_OPTIONS.find(p => p.id === activePanel)?.label || 'Novel Editor') :
                    (SIDEBAR_OPTIONS.find(p => p.id === activePanel)?.label || 'Novel Editor')
                  }
                </p>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('collaborators')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'collaborators'
                      ? 'text-orange-600 border-orange-500 hover:text-orange-700'
                      : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  Collaborators
                </button>
                {activeTab && (
                  <button
                    onClick={() => setActiveTab('')}
                    className="ml-4 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
                  >
                    Back to Editor
                  </button>
                )}
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
          ref={measureCategoryMenu}
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
          ref={measureContextMenu}
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

      {/* Novel Settings Modal */}
      <NovelSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        project={project}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
      />

      {/* Send Message Modal */}
      {showMessageModal && messageRecipient && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false)
            setMessageRecipient(null)
          }}
          recipient={messageRecipient}
        />
      )}

      {/* Edit Collaborator Modal */}
      {showEditModal && editingCollaborator && (
        <EditCollaboratorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingCollaborator(null)
          }}
          collaborator={editingCollaborator}
            onSave={async (updates) => {
            try {
              if (updateCollaborator && editingCollaborator?.id) {
                await updateCollaborator(editingCollaborator.id, updates)
              }
            } catch (err) {
              console.error('Failed to update collaborator:', err)
                toast.addToast?.({ type: 'error', title: 'Update Failed', message: err instanceof Error ? err.message : 'Failed to update collaborator' })
              } finally {
                await refreshCollaborators()
                // Notify other components (ApprovedWorkflow) that collaborators changed
                try { window.dispatchEvent(new CustomEvent('collaborators:updated', { detail: { projectId: project?.id } })) } catch (e) { }
                toast.addToast?.({ type: 'success', title: 'Updated', message: 'Collaborator updated' })
                setShowEditModal(false)
                setEditingCollaborator(null)
              }
          }}
          onRemove={async () => {
            try {
              if (removeCollaborator && editingCollaborator?.id) {
                await removeCollaborator(editingCollaborator.id)
              }
            } catch (err) {
              console.error('Failed to remove collaborator:', err)
              toast.addToast?.({ type: 'error', title: 'Remove Failed', message: err instanceof Error ? err.message : 'Failed to remove collaborator' })
            } finally {
              await refreshCollaborators()
              try { window.dispatchEvent(new CustomEvent('collaborators:updated', { detail: { projectId: project?.id } })) } catch (e) { }
              toast.addToast?.({ type: 'success', title: 'Removed', message: 'Collaborator removed' })
              setShowEditModal(false)
              setEditingCollaborator(null)
            }
          }}
          currentTotalSplit={collaborators.reduce((total, c) => total + (c.royalty_split || 0), 0)}
        />
      )}

      {/* Edit Invitation Modal */}
      {showEditInvitationModal && editingInvitation && (
        <EditInvitationModal
          isOpen={showEditInvitationModal}
          onClose={() => {
            setShowEditInvitationModal(false)
            setEditingInvitation(null)
          }}
          invitation={editingInvitation}
          onSave={async (updates) => {
            await handleUpdateInvitation(editingInvitation.id, updates)
          }}
          onCancel={async () => {
            await handleCancelInvitation(editingInvitation.id)
            setShowEditInvitationModal(false)
            setEditingInvitation(null)
          }}
          currentTotalSplit={collaborators.reduce((total, c) => total + (c.royalty_split || 0), 0)}
        />
      )}
    </div>
  )
}

export default function NovelPage() {
  return (
    <ToastProvider>
      <NovelPageInner />
    </ToastProvider>
  )
}
