'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  Calendar,
  BookOpen,
  Map,
  Zap,
  Crown,
  Palette,
  Globe,
  Shield,
  Heart,
  Brain,
  Star,
  Flame,
  Copy
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import TimelinePanel from './world-building/timeline-panel'
import NewCharacter from './new-character'
import NewLocation from './new-location'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

interface WorldBuildingSidebarProps {
  projectId: string
  isOpen: boolean
  onToggle: () => void
  onShowCharacterEditor?: (character?: WorldElement) => void
  onElementSelect?: (element: WorldElement) => void
  onNavigateToPanel?: (panel: string) => void
}

const CATEGORIES = [
  { key: 'characters', label: 'Characters', icon: Users, color: 'blue' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: 'rose' },
  { key: 'locations', label: 'Locations', icon: MapPin, color: 'green' },
  { key: 'timeline', label: 'Timeline', icon: Clock, color: 'purple' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, color: 'orange' },
  { key: 'encyclopedia', label: 'Encyclopedia', icon: BookOpen, color: 'orange' },
  { key: 'research', label: 'Research', icon: BookOpen, color: 'amber' },
  { key: 'maps', label: 'Maps', icon: Map, color: 'cyan' },
  { key: 'species', label: 'Species', icon: Zap, color: 'yellow' },
  { key: 'cultures', label: 'Cultures', icon: Crown, color: 'pink' },
  { key: 'items', label: 'Items', icon: Palette, color: 'indigo' },
  { key: 'systems', label: 'Systems', icon: Globe, color: 'teal' },
  { key: 'languages', label: 'Languages', icon: Shield, color: 'red' },
  { key: 'religions', label: 'Religions', icon: Heart, color: 'rose' },
  { key: 'philosophies', label: 'Philosophies', icon: Brain, color: 'violet' }
]

export default function WorldBuildingSidebar({ 
  projectId, 
  isOpen, 
  onToggle, 
  onShowCharacterEditor, 
  onElementSelect,
  onNavigateToPanel 
}: WorldBuildingSidebarProps) {
  console.log('🚀 SIDEBAR COMPONENT LOADED! isOpen:', isOpen, 'projectId:', projectId)
  
  const [elements, setElements] = useState<WorldElement[]>([])
  const [selectedCategory, setSelectedCategory] = useState('characters')
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['characters'])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('elements')
  const [showNewCharacter, setShowNewCharacter] = useState(false)
  const [showNewLocation, setShowNewLocation] = useState(false)
  const [showResearchDialog, setShowResearchDialog] = useState(false)
  const [researchFileName, setResearchFileName] = useState('')
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    element: WorldElement
  } | null>(null)

  // Hook for dynamic context menu dimensions
  const useContextMenuDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 200, height: 136 })
    
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

  const { dimensions, measureMenu } = useContextMenuDimensions()

  useEffect(() => {
    // Always load elements for accurate counts, regardless of sidebar state
    loadElements()
  }, [projectId])

  // Add real-time subscription for instant updates (always active for count updates)
  useEffect(() => {
    if (!projectId) return;

    const supabase = createSupabaseClient();
    const channel = supabase
      .channel(`world-elements-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'world_elements',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log('Real-time world element update in sidebar:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('🚨 REALTIME INSERT:', payload.new.name, 'Category:', payload.new.category)
            // Add new element to the list
            setElements((prev) => {
              // Check if element already exists to avoid duplicates
              const exists = prev.some(el => el.id === payload.new.id);
              if (exists) {
                console.log('🚨 REALTIME: Element already exists, skipping')
                return prev;
              }
              console.log('🚨 REALTIME: Adding new element to sidebar')
              return [...prev, payload.new as WorldElement];
            });
          } else if (payload.eventType === 'UPDATE') {
            // Update existing element
            setElements((prev) => 
              prev.map(el => 
                el.id === payload.new.id 
                  ? { ...el, ...payload.new } as WorldElement
                  : el
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted element
            setElements((prev) => 
              prev.filter(el => el.id !== payload.old.id)
            );
            // Clear selection if the deleted element was selected
            if (selectedElement?.id === payload.old.id) {
              setSelectedElement(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, selectedElement?.id]); // Added selectedElement?.id to dependencies

  // Add custom event listeners as fallback for cross-component communication
  useEffect(() => {
    console.log('Setting up sidebar event listeners for project:', projectId)
    
    const handleLocationCreated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const location = event.detail.location;
      setElements((prev) => {
        const exists = prev.some(el => el.id === location.id);
        if (exists) return prev;
        return [...prev, location];
      });
    };

    const handleLocationUpdated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const location = event.detail.location;
      setElements((prev) => 
        prev.map(el => 
          el.id === location.id ? location : el
        )
      );
    };

    const handleLocationDeleted = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const locationId = event.detail.locationId;
      setElements((prev) => prev.filter(el => el.id !== locationId));
      if (selectedElement?.id === locationId) {
        setSelectedElement(null);
      }
    };

    window.addEventListener('locationCreated', handleLocationCreated as EventListener);
    window.addEventListener('locationUpdated', handleLocationUpdated as EventListener);
    window.addEventListener('locationDeleted', handleLocationDeleted as EventListener);

    // Handle timeline creation events
    const handleTimelineCreated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const timeline = event.detail.timeline;
      setElements((prev) => {
        const exists = prev.some(el => el.id === timeline.id);
        if (exists) return prev;
        return [...prev, timeline];
      });
    };

    const handleTimelineUpdated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const timeline = event.detail.timeline;
      setElements((prev) => 
        prev.map(el => 
          el.id === timeline.id ? timeline : el
        )
      );
    };

    const handleTimelineDeleted = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const timelineId = event.detail.timelineId;
      setElements((prev) => prev.filter(el => el.id !== timelineId));
      if (selectedElement?.id === timelineId) {
        setSelectedElement(null);
      }
    };

    window.addEventListener('timelineCreated', handleTimelineCreated as EventListener);
    window.addEventListener('timelineUpdated', handleTimelineUpdated as EventListener);
    window.addEventListener('timelineDeleted', handleTimelineDeleted as EventListener);

    // Handle map creation events
    const handleMapCreated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const map = event.detail.map;
      setElements((prev) => {
        const exists = prev.some(el => el.id === map.id);
        if (exists) return prev;
        return [...prev, map];
      });
    };

    window.addEventListener('mapCreated', handleMapCreated as EventListener);

    // Handle research file creation events
    const handleResearchFileCreated = (event: CustomEvent) => {
      console.log('Sidebar received researchFileCreated event:', event.detail)
      console.log('Current sidebar projectId:', projectId)
      if (event.detail.projectId !== projectId) {
        console.log('Project ID mismatch, ignoring event')
        return;
      }
      const researchFile = event.detail.researchFile;
      console.log('Adding research file to sidebar:', researchFile)
      setElements((prev) => {
        const exists = prev.some(el => el.id === researchFile.id);
        if (exists) {
          console.log('Research file already exists in sidebar')
          return prev;
        }
        console.log('Adding new research file to sidebar, current count:', prev.length)
        const newElements = [...prev, researchFile];
        console.log('New elements count:', newElements.length)
        return newElements;
      });
    };

    // Handle sidebar reload requests
    const handleSidebarReload = (event: CustomEvent) => {
      console.log('Sidebar received reload request')
      if (event.detail.projectId !== projectId) return;
      console.log('Reloading sidebar elements')
      loadElements();
    };

    // Test event handler
    const handleTestEvent = (event: CustomEvent) => {
      console.log('Sidebar received test event:', event.detail)
    };

    window.addEventListener('researchFileCreated', handleResearchFileCreated as EventListener);
    window.addEventListener('reloadSidebar', handleSidebarReload as EventListener);
    window.addEventListener('testEvent', handleTestEvent as EventListener);

    // Handle relationship creation events
    const handleRelationshipCreated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const relationship = event.detail.relationship;
      setElements((prev) => {
        const exists = prev.some(el => el.id === relationship.id);
        if (exists) return prev;
        return [...prev, relationship];
      });
    };

    const handleRelationshipUpdated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const relationship = event.detail.relationship;
      setElements((prev) => 
        prev.map(el => 
          el.id === relationship.id ? relationship : el
        )
      );
    };

    const handleRelationshipDeleted = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const relationshipId = event.detail.relationshipId;
      setElements((prev) => prev.filter(el => el.id !== relationshipId));
      if (selectedElement?.id === relationshipId) {
        setSelectedElement(null);
      }
    };

    window.addEventListener('relationshipCreated', handleRelationshipCreated as EventListener);
    window.addEventListener('relationshipUpdated', handleRelationshipUpdated as EventListener);
    window.addEventListener('relationshipDeleted', handleRelationshipDeleted as EventListener);
    
    // Handle encyclopedia events
    const handleEncyclopediaCreated = (event: CustomEvent) => {
      console.log('🔥 SIDEBAR: Received encyclopediaCreated event:', event.detail)
      if (event.detail.projectId !== projectId) {
        console.log('🔥 SIDEBAR: Project ID mismatch, ignoring event')
        return;
      }
      const encyclopedia = event.detail.encyclopedia;
      console.log('🔥 SIDEBAR: Adding encyclopedia to elements:', encyclopedia.name, encyclopedia.id)
      setElements((prev) => {
        const exists = prev.some(el => el.id === encyclopedia.id);
        if (exists) {
          console.log('🔥 SIDEBAR: Encyclopedia already exists, skipping')
          return prev;
        }
        console.log('🔥 SIDEBAR: Adding new encyclopedia, current count:', prev.length)
        const newElements = [...prev, encyclopedia];
        console.log('🔥 SIDEBAR: New elements count:', newElements.length)
        return newElements;
      });
    };

    const handleEncyclopediaUpdated = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const encyclopedia = event.detail.encyclopedia;
      setElements((prev) => 
        prev.map(el => 
          el.id === encyclopedia.id ? encyclopedia : el
        )
      );
    };

    const handleEncyclopediaDeleted = (event: CustomEvent) => {
      if (event.detail.projectId !== projectId) return;
      const encyclopediaId = event.detail.encyclopediaId;
      setElements((prev) => prev.filter(el => el.id !== encyclopediaId));
      if (selectedElement?.id === encyclopediaId) {
        setSelectedElement(null);
      }
    };

    window.addEventListener('encyclopediaCreated', handleEncyclopediaCreated as EventListener);
    window.addEventListener('encyclopediaUpdated', handleEncyclopediaUpdated as EventListener);
    window.addEventListener('encyclopediaDeleted', handleEncyclopediaDeleted as EventListener);
    
    console.log('Sidebar event listeners registered for project:', projectId)

    return () => {
      console.log('Removing sidebar event listeners for project:', projectId)
      window.removeEventListener('locationCreated', handleLocationCreated as EventListener);
      window.removeEventListener('locationUpdated', handleLocationUpdated as EventListener);
      window.removeEventListener('locationDeleted', handleLocationDeleted as EventListener);
      window.removeEventListener('timelineCreated', handleTimelineCreated as EventListener);
      window.removeEventListener('timelineUpdated', handleTimelineUpdated as EventListener);
      window.removeEventListener('timelineDeleted', handleTimelineDeleted as EventListener);
      window.removeEventListener('mapCreated', handleMapCreated as EventListener);
      window.removeEventListener('researchFileCreated', handleResearchFileCreated as EventListener);
      window.removeEventListener('reloadSidebar', handleSidebarReload as EventListener);
      window.removeEventListener('testEvent', handleTestEvent as EventListener);
      window.removeEventListener('relationshipCreated', handleRelationshipCreated as EventListener);
      window.removeEventListener('relationshipUpdated', handleRelationshipUpdated as EventListener);
      window.removeEventListener('relationshipDeleted', handleRelationshipDeleted as EventListener);
      window.removeEventListener('encyclopediaCreated', handleEncyclopediaCreated as EventListener);
      window.removeEventListener('encyclopediaUpdated', handleEncyclopediaUpdated as EventListener);
      window.removeEventListener('encyclopediaDeleted', handleEncyclopediaDeleted as EventListener);
    };
  }, [projectId, selectedElement?.id]);

  // Click outside to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu()
    }

    if (contextMenu?.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu?.visible])

  const loadElements = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      
      setElements(data || [])
      
      // Debug encyclopedia specifically  
      const encyclopediaElements = data?.filter(el => el.category === 'encyclopedia') || []
      console.log('🔍 SIDEBAR LOAD: Encyclopedia entries found:', encyclopediaElements.length)
      console.log('🔍 Encyclopedia entries data:', encyclopediaElements.map(e => ({ id: e.id, name: e.name, category: e.category })))
      
      // Debug calendar systems specifically
      const calendarSystems = data?.filter(el => el.category === 'calendar_system') || []
      console.log('🎯 SIDEBAR LOAD: Calendar systems found:', calendarSystems.length)
      console.log('🎯 Calendar systems data:', calendarSystems.map(cs => ({ id: cs.id, name: cs.name, category: cs.category })))
      
      // Debug research elements
      const researchElements = data?.filter(el => el.category === 'research') || []
      const researchFiles = researchElements.filter(el => el.attributes?.research_type === 'file')
      const researchContent = researchElements.filter(el => el.attributes?.research_type === 'content')
      const researchProblematic = researchElements.filter(el => !el.attributes?.research_type)
      
      console.log('🔍 RESEARCH DEBUG: Starting research elements analysis...')
      console.log('Research elements breakdown:')
      console.log('- Total research elements:', researchElements.length)
      console.log('- Research files (should show in sidebar):', researchFiles.length)
      console.log('- Research content (should NOT show in sidebar):', researchContent.length)
      console.log('- Problematic research elements (no research_type):', researchProblematic.length)
      
      if (researchProblematic.length > 0) {
        console.log('Problematic research elements:', researchProblematic.map(el => ({ 
          id: el.id, 
          name: el.name, 
          attributes: el.attributes 
        })))
      }
      
      // Additional debug for research content items
      if (researchContent.length > 0) {
        console.log('Research content items (should be hidden from sidebar):', researchContent.map(el => ({
          id: el.id,
          name: el.name,
          research_type: el.attributes?.research_type,
          research_file_id: el.attributes?.research_file_id
        })))
      }
      
      setElements(data || [])
    } catch (error) {
      console.error('Error loading world elements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createElement = async (category: string, name: string) => {
    try {
      const supabase = createSupabaseClient()
      const newElement = {
        project_id: projectId,
        category,
        name,
        description: '',
        attributes: getDefaultAttributes(category),
        tags: []
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
      if (selectedElement?.id === elementId) {
        setSelectedElement(null)
      }
    } catch (error) {
      console.error('Error deleting element:', error)
    }
  }

  const handleNewCharacterSave = async (characterData: { name: string; description: string }) => {
    try {
      const supabase = createSupabaseClient()
      const newElement = {
        project_id: projectId,
        category: 'characters',
        name: characterData.name,
        description: characterData.description,
        attributes: getDefaultAttributes('characters'),
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error
      
      setElements([...elements, data])
      setSelectedElement(data)
      setShowNewCharacter(false)
    } catch (error) {
      console.error('Error creating character:', error)
    }
  }

  const handleNewCharacterCancel = () => {
    setShowNewCharacter(false)
  }

  const handleNewLocationSave = async (locationData: { name: string; description: string }) => {
    try {
      const supabase = createSupabaseClient()
      const newElement = {
        project_id: projectId,
        category: 'locations',
        name: locationData.name,
        description: locationData.description,
        attributes: getDefaultAttributes('locations'),
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error

      setElements([...elements, data])
      setSelectedElement(data)
      setShowNewLocation(false)
    } catch (error) {
      console.error('Error creating location:', error)
    }
  }

  const handleNewLocationCancel = () => {
    setShowNewLocation(false)
  }

  // Enhanced context menu handler with improved smart positioning
  const handleElementContextMenu = (e: React.MouseEvent, element: WorldElement) => {
    console.log('🔥 SIDEBAR Context menu triggered for:', element.name)
    
    // Prevent default context menu
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.preventDefault()
    e.nativeEvent.stopPropagation()
    
    // Get exact mouse coordinates
    const mouseX = e.clientX
    const mouseY = e.clientY
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Use measured dimensions or fallback to defaults
    const menuWidth = dimensions.width || 200
    const menuHeight = dimensions.height || 136
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
    
    console.log('🔥 Smart positioning result:', {
      mouse: { x: mouseX, y: mouseY },
      viewport: { width: viewportWidth, height: viewportHeight },
      menu: { width: menuWidth, height: menuHeight },
      space: { right: spaceRight, left: spaceLeft, below: spaceBelow, above: spaceAbove },
      finalPosition: { x, y },
      positioning: {
        horizontal: x > mouseX ? 'right' : x < mouseX ? 'left' : 'centered',
        vertical: y > mouseY ? 'below' : y < mouseX ? 'above' : 'centered'
      }
    })
    
    setContextMenu({
      visible: true,
      x,
      y,
      element
    })
    
    return false
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    const element = contextMenu.element

    if (action === 'edit') {
      if (element.category === 'characters' && onShowCharacterEditor) {
        onShowCharacterEditor(element)
      } else {
        setSelectedElement(element)
        if (onElementSelect) {
          onElementSelect(element)
        }
      }
    } else if (action === 'delete') {
      if (confirm(`Delete "${element.name}"?`)) {
        deleteElement(element.id)
      }
    } else if (action === 'duplicate') {
      // Create a duplicate element
      const duplicateName = `${element.name} (Copy)`
      createElement(element.category, duplicateName)
    }

    closeContextMenu()
  }

  const getDefaultAttributes = (category: string) => {
    switch (category) {
      case 'characters':
        return {
          age: '',
          occupation: '',
          personality: '',
          background: '',
          goals: '',
          conflicts: '',
          relationships: []
        }
      case 'locations':
        return {
          type: '',
          climate: '',
          population: '',
          government: '',
          economy: '',
          notable_features: '',
          history: ''
        }
      case 'timeline':
        return {
          date: '',
          event_type: '',
          participants: [],
          consequences: '',
          importance: 'low'
        }
      case 'species':
        return {
          origin: '',
          lifespan: '',
          abilities: '',
          culture: '',
          society: '',
          weaknesses: ''
        }
      case 'cultures':
        return {
          values: '',
          traditions: '',
          social_structure: '',
          religion: '',
          technology_level: '',
          art_forms: ''
        }
      case 'research':
        return {
          research_type: 'file',
          tags: [],
          status: 'draft',
          priority: 'medium'
        }
      default:
        return {}
    }
  }

  const getElementsByCategory = (category: string) => {
    // Special handling for calendar category - calendar systems are stored as 'calendar_system'
    const actualCategory = category === 'calendar' ? 'calendar_system' : category
    
    // Debug logging for calendar specifically
    if (category === 'calendar') {
      console.log('🎯 SIDEBAR: Filtering calendar systems')
      console.log('🎯 Original category:', category)
      console.log('🎯 Actual category (mapped):', actualCategory)
      console.log('🎯 Total elements loaded:', elements.length)
      console.log('🎯 Elements with calendar_system category:', elements.filter(el => el.category === 'calendar_system'))
      console.log('🎯 All element categories:', [...new Set(elements.map(el => el.category))])
    }
    
    // Special handling for research category - only show research files, not content
    if (category === 'research') {
      return elements.filter(el => 
        el.category === actualCategory && 
        !(el as any).is_folder && 
        el.attributes && 
        (el.attributes as any).research_type === 'file' &&
        (searchTerm === '' || 
         el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         el.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    const filtered = elements.filter(el => 
      el.category === actualCategory && 
      (searchTerm === '' || 
       el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       el.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    
    // Debug logging for calendar filtering result
    if (category === 'calendar') {
      console.log('🎯 SIDEBAR: Filtered calendar systems result:', filtered)
      console.log('🎯 Filtered count:', filtered.length)
    }
    
    return filtered
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.key === category)
    return categoryData?.icon || BookOpen
  }

  const getCategoryColor = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.key === category)
    return categoryData?.color || 'gray'
  }

  if (!isOpen) {
    console.log('🚪 SIDEBAR IS CLOSED - showing toggle button')
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white p-3 rounded-r-lg shadow-lg hover:bg-purple-700 transition-colors z-40"
      >
        <Globe className="w-5 h-5" />
      </button>
    )
  }

  console.log('🚪 SIDEBAR IS OPEN - rendering full sidebar')

  // Show NewCharacter or NewLocation component when creating
  if (showNewCharacter) {
    return (
      <div className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-200 shadow-lg z-50">
        <NewCharacter
          projectId={projectId}
          onSave={handleNewCharacterSave}
          onCancel={handleNewCharacterCancel}
        />
      </div>
    )
  }

  if (showNewLocation) {
    return (
      <div className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-200 shadow-lg z-50">
        <NewLocation
          projectId={projectId}
          onSave={handleNewLocationSave}
          onCancel={handleNewLocationCancel}
        />
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">World Building</h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elements" className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="research" className="mt-3">
            <div className="text-center text-sm text-gray-600">
              Research tools and references
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsContent value="elements" className="flex-1 overflow-y-auto m-0">
          {/* Categories List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-2">
              {CATEGORIES.map(category => {
                const Icon = category.icon
                const categoryElements = getElementsByCategory(category.key)
                const isExpanded = expandedCategories.includes(category.key)
                
                console.log(`🏷️ Rendering category ${category.key}:`, categoryElements.length, 'elements')
                if (categoryElements.length > 0) {
                  console.log(`Elements in ${category.key}:`, categoryElements.map(e => e.name))
                }
                
                return (
                  <div key={category.key} className="mb-2">
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        {isExpanded ? 
                          <ChevronDown className="w-4 h-4 mr-2" /> : 
                          <ChevronRight className="w-4 h-4 mr-2" />
                        }
                        <Icon className={`w-4 h-4 mr-2 text-${category.color}-500`} />
                        <span className="font-medium">{category.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {categoryElements.length}
                      </Badge>
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {categoryElements.map(element => {
                          console.log(`🎯 Rendering element: ${element.name} in category ${category.key} with context menu handler`)
                          
                          // Debug logging for timeline specifically
                          if (category.key === 'timeline') {
                            console.log('Rendering timeline element:', element.name, element.id)
                          }
                          
                          return (
                            <button
                              key={element.id}
                              onClick={(e) => {
                                console.log('🎯 BUTTON CLICKED:', element.name, element.category)
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Element clicked:', element.name, 'Category:', element.category)
                                
                                if (element.category === 'characters' && onShowCharacterEditor) {
                                  onShowCharacterEditor(element)
                                } else if (element.category === 'relationships') {
                                  // Always open canvas for relationships
                                  console.log('🎯 SIDEBAR RELATIONSHIP CLICKED:', element.name)
                                  window.dispatchEvent(new CustomEvent('openRelationshipCanvas', {
                                    detail: {
                                      relationship: element,
                                      projectId: projectId
                                    }
                                  }))
                                } else if (element.category === 'timeline') {
                                  // Handle timeline selection
                                  setSelectedElement(element)
                                  
                                  // Dispatch timeline selection event for TimelinePanel
                                  window.dispatchEvent(new CustomEvent('timelineSelected', {
                                    detail: {
                                      projectId: projectId,
                                      timelineId: element.id
                                    }
                                  }))
                                  console.log('🎯 SIDEBAR: Event dispatched successfully')
                                  
                                  if (onElementSelect) {
                                    console.log('Calling onElementSelect for timeline')
                                    onElementSelect(element)
                                  }
                                  if (onNavigateToPanel) {
                                    console.log('Calling onNavigateToPanel for timeline')
                                    onNavigateToPanel('timeline')
                                  }
                                } else {
                                  setSelectedElement(element)
                                  if (onElementSelect) {
                                    onElementSelect(element)
                                  }
                                }
                              }}
                              onContextMenu={(e) => {
                                console.log('🔥 RIGHT CLICK on element:', element.name, element.category)
                                handleElementContextMenu(e, element)
                              }}
                              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                selectedElement?.id === element.id
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-medium truncate">{element.name}</div>
                              {element.description && (
                                <div className="text-gray-500 text-xs truncate mt-1">
                                  {element.description}
                                </div>
                              )}
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => {
                            if (category.key === 'characters') {
                              setShowNewCharacter(true)
                            } else if (category.key === 'locations') {
                              // always open the full-page Locations create editor
                              window.dispatchEvent(new CustomEvent('openLocationsCreate', { detail: { projectId } }))
                            } else {
                              const name = prompt(`New ${category.label.slice(0, -1)} name:`)
                              if (name) createElement(category.key, name)
                            }
                          }}
                          className="w-full text-left p-2 rounded text-sm text-purple-600 hover:bg-purple-50 flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add {category.label.slice(0, -1)}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="flex-1 m-0 p-4">
          <TimelinePanel projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="research" className="flex-1 m-0 p-4">
          {/* Research Files List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Add Research File Button */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <button
                  onClick={() => setShowResearchDialog(true)}
                  className="w-full text-left p-2 rounded text-sm text-purple-600 hover:bg-purple-50 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Research File
                </button>
              </div>

              {elements
                .filter(el => {
                  // Only show research elements that are explicitly marked as files
                  // This excludes content items and any research elements without proper attributes
                  if (el.category !== 'research') return false;
                  if (!el.attributes) return false;
                  
                  const researchType = el.attributes.research_type;
                  const shouldShow = researchType === 'file';
                  
                  // Debug log for each research element
                  if (el.category === 'research') {
                    console.log(`🔍 Research element "${el.name}": research_type="${researchType}", shouldShow=${shouldShow}`);
                  }
                  
                  // Only show if explicitly marked as 'file'
                  // This excludes 'content' items and anything else
                  return shouldShow;
                })
                .map((researchFile) => (
                  <button
                    key={researchFile.id}
                    onClick={() => {
                      setSelectedElement(researchFile)
                      if (onElementSelect) {
                        onElementSelect(researchFile)
                      }
                      if (onNavigateToPanel) {
                        onNavigateToPanel('research')
                      }
                    }}
                    onContextMenu={(e) => handleElementContextMenu(e, researchFile)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      selectedElement?.id === researchFile.id
                        ? 'bg-purple-100 text-purple-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{researchFile.name}</div>
                        {researchFile.description && (
                          <div className="text-gray-500 text-xs truncate mt-1">
                            {researchFile.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Updated {new Date(researchFile.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              
              {elements.filter(el => {
                // Only show research elements that are explicitly marked as files
                if (el.category !== 'research') return false;
                if (!el.attributes) return false;
                const researchType = el.attributes.research_type;
                return researchType === 'file';
              }).length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No research files yet</p>
                  <p className="text-gray-400 text-xs mt-1">Create files in the Research panel</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Element Details Panel */}
      {selectedElement && activeTab === 'elements' && (
        <div className="absolute right-0 top-0 w-96 h-screen bg-white border-l border-gray-200 shadow-lg">
          <ElementDetailsPanel
            element={selectedElement}
            onUpdate={updateElement}
            onDelete={deleteElement}
            onClose={() => setSelectedElement(null)}
          />
        </div>
      )}

      {/* Research File Creation Dialog */}
      {showResearchDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Research File</h3>
            <div className="mb-4">
              <label htmlFor="research-name" className="block text-sm font-medium text-gray-700 mb-2">
                Research File Name
              </label>
              <input
                id="research-name"
                type="text"
                value={researchFileName}
                onChange={(e) => setResearchFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter research file name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && researchFileName.trim()) {
                    createElement('research', researchFileName.trim())
                    setShowResearchDialog(false)
                    setResearchFileName('')
                  } else if (e.key === 'Escape') {
                    setShowResearchDialog(false)
                    setResearchFileName('')
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResearchDialog(false)
                  setResearchFileName('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (researchFileName.trim()) {
                    createElement('research', researchFileName.trim())
                    setShowResearchDialog(false)
                    setResearchFileName('')
                  }
                }}
                disabled={!researchFileName.trim()}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Smart Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={measureMenu}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-xl py-1 z-[9999]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextMenuAction('edit')}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Edit3 className="w-4 h-4 flex-shrink-0" />
            <span>Edit {contextMenu.element.category === 'characters' ? 'Character' : 
                  contextMenu.element.category === 'locations' ? 'Location' :
                  contextMenu.element.category === 'research' ? 'Research File' :
                  contextMenu.element.category.slice(0, -1)}</span>
          </button>
          
          <button
            onClick={() => handleContextMenuAction('duplicate')}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Copy className="w-4 h-4 flex-shrink-0" />
            <span>Duplicate</span>
          </button>
          
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface ElementDetailsPanelProps {
  element: WorldElement
  onUpdate: (id: string, updates: Partial<WorldElement>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function ElementDetailsPanel({ element, onUpdate, onDelete, onClose }: ElementDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedElement, setEditedElement] = useState(element)

  const handleSave = () => {
    onUpdate(element.id, editedElement)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedElement(element)
    setIsEditing(false)
  }

  const renderAttributeField = (key: string, value: any) => {
    if (typeof value === 'string') {
      return (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-gray-700 capitalize">
            {key.replace('_', ' ')}
          </label>
          {isEditing ? (
            <Textarea
              value={value}
              onChange={(e) => setEditedElement({
                ...editedElement,
                attributes: { ...editedElement.attributes, [key]: e.target.value }
              })}
              className="text-sm"
            />
          ) : (
            <p className="text-sm text-gray-600">{value || 'Not specified'}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{element.name}</h3>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm">Save</Button>
                <Button onClick={handleCancel} size="sm" variant="outline">Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm('Delete this element?')) onDelete(element.id)
                  }} 
                  size="sm" 
                  variant="outline"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
            <Button onClick={onClose} size="sm" variant="ghost">
              ×
            </Button>
          </div>
        </div>
        
        <Badge className="text-purple-600 bg-purple-100">
          {element.category}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          {isEditing ? (
            <Textarea
              value={editedElement.description}
              onChange={(e) => setEditedElement({ ...editedElement, description: e.target.value })}
              placeholder="Describe this element..."
            />
          ) : (
            <p className="text-sm text-gray-600">
              {element.description || 'No description yet.'}
            </p>
          )}
        </div>

        {/* Attributes */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Details</h4>
          {Object.entries(element.attributes || {}).map(([key, value]) =>
            renderAttributeField(key, value)
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Tags</label>
          <div className="flex flex-wrap gap-1">
            {element.tags?.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(!element.tags || element.tags.length === 0) && (
              <span className="text-xs text-gray-500">No tags</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}