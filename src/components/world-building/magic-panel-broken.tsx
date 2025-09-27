'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { 
  Plus, Zap, Search, MoreVertical, Trash2, Edit3, BookOpen,
  Star, Flame, Wind, Droplets, Mountain, Sun, Moon, Eye,
  Save, X, Wand2, Shield, Target, Clock, Sparkles, Crown,
  Link, Image as ImageIcon, TableIcon, Bold, Italic, Underline,
  User, MapPin, Package, Calendar, Globe, Cog, Heart, Brain,
  Copy, Settings, History, ChevronDown, ChevronUp, Grid3x3,
  Network, Filter, Columns, Bookmark, Tag, GripVertical,
  FileText, Hash, ToggleLeft, List, Type, Code, Palette
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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

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

const get = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const diffAttributes = (prev: any, next: any): string => {
  const changes: string[] = []
  
  // Compare all keys from both objects
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])
  
  for (const key of allKeys) {
    const prevVal = prev?.[key]
    const nextVal = next?.[key]
    
    if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
      if (prevVal === undefined) {
        changes.push(`+ Added ${key}: ${JSON.stringify(nextVal)}`)
      } else if (nextVal === undefined) {
        changes.push(`- Removed ${key}`)
      } else {
        changes.push(`~ Changed ${key}: ${JSON.stringify(prevVal)} → ${JSON.stringify(nextVal)}`)
      }
    }
  }
  
  return changes.length ? changes.join('\n') : 'No changes detected'
}

const buildDefaultTemplate = (kind: 'hard' | 'soft' | 'spell' | 'ritual' | 'artifact'): Partial<MagicElement['attributes']> => {
  const templates = {
    hard: {
      type: 'system',
      __schema: [
        { id: '1', key: 'power_source', label: 'Power Source', type: 'select' as const, options: ['Mana', 'Life Force', 'Divine', 'Elemental'], group: 'mechanics' as const, showInCard: true },
        { id: '2', key: 'cost_type', label: 'Cost Type', type: 'select' as const, options: ['Fixed', 'Scaling', 'Resource'], group: 'costs' as const, showInCard: true },
        { id: '3', key: 'restrictions', label: 'System Restrictions', type: 'tags' as const, group: 'costs' as const, showInCard: false }
      ],
      __values: { power_source: 'Mana', cost_type: 'Fixed', restrictions: [] }
    },
    soft: {
      type: 'system',
      __schema: [
        { id: '1', key: 'philosophy', label: 'Magical Philosophy', type: 'richtext' as const, group: 'lore' as const, showInCard: false },
        { id: '2', key: 'manifestation', label: 'How Magic Manifests', type: 'richtext' as const, group: 'mechanics' as const, showInCard: false },
        { id: '3', key: 'cultural_role', label: 'Role in Society', type: 'text' as const, group: 'lore' as const, showInCard: true }
      ],
      __values: { philosophy: '', manifestation: '', cultural_role: '' }
    },
    spell: {
      type: 'spell',
      school: 'Evocation',
      level: 3,
      casting_time: '1 action',
      duration: 'instantaneous',
      __schema: [
        { id: '1', key: 'verbal_component', label: 'Verbal Component Required', type: 'boolean' as const, group: 'components' as const, showInCard: true },
        { id: '2', key: 'somatic_component', label: 'Somatic Component Required', type: 'boolean' as const, group: 'components' as const, showInCard: true },
        { id: '3', key: 'material_focus', label: 'Material Focus', type: 'text' as const, group: 'components' as const, showInCard: false }
      ],
      __values: { verbal_component: true, somatic_component: false, material_focus: '' }
    },
    ritual: {
      type: 'ritual',
      casting_time: '1 hour',
      duration: 'permanent',
      __schema: [
        { id: '1', key: 'participants_required', label: 'Number of Participants', type: 'number' as const, group: 'mechanics' as const, showInCard: true },
        { id: '2', key: 'ritual_components', label: 'Special Components', type: 'tags' as const, group: 'components' as const, showInCard: false },
        { id: '3', key: 'preparation_time', label: 'Preparation Time', type: 'text' as const, group: 'mechanics' as const, showInCard: true }
      ],
      __values: { participants_required: 3, ritual_components: [], preparation_time: '24 hours' }
    },
    artifact: {
      type: 'artifact',
      rarity: 'legendary',
      __schema: [
        { id: '1', key: 'attunement_required', label: 'Requires Attunement', type: 'boolean' as const, group: 'mechanics' as const, showInCard: true },
        { id: '2', key: 'charges', label: 'Number of Charges', type: 'number' as const, group: 'mechanics' as const, showInCard: true },
        { id: '3', key: 'recharge_condition', label: 'Recharge Condition', type: 'text' as const, group: 'mechanics' as const, showInCard: false }
      ],
      __values: { attunement_required: true, charges: 3, recharge_condition: 'Dawn' }
    }
  }
  
  return templates[kind] || {}
}

const applyTemplateToForm = (templateAttrs: any, setFormData: any) => {
  setFormData((prev: any) => ({
    ...prev,
    ...templateAttrs,
    // Merge schemas instead of replacing
    __schema: [...(prev.__schema || []), ...(templateAttrs.__schema || [])],
    __values: { ...(prev.__values || {}), ...(templateAttrs.__values || {}) }
  }))
}

const useGraphData = (elements: MagicElement[]) => {
  return useMemo(() => {
    const nodes = elements.map((element, index) => ({
      id: element.id,
      data: { 
        label: element.name, 
        type: element.attributes?.type || 'unknown',
        element 
      },
      position: { 
        x: (index % 3) * 200 + 100, 
        y: Math.floor(index / 3) * 150 + 100 
      }
    }))

    const edges: any[] = []
    
    // Build edges from [[links]] in descriptions and custom richtext fields
    elements.forEach(element => {
      const linkRegex = /\[\[([^\]]+)\]\]/g
      const textFields = [
        element.description,
        element.attributes?.history,
        ...(element.attributes?.__schema || [])
          .filter(field => field.type === 'richtext')
          .map(field => element.attributes?.__values?.[field.key])
          .filter(Boolean)
      ].filter(Boolean)
      
      textFields.forEach(text => {
        let match
        while ((match = linkRegex.exec(text)) !== null) {
          const targetName = match[1]
          const targetElement = elements.find(el => el.name.toLowerCase() === targetName.toLowerCase())
          if (targetElement && targetElement.id !== element.id) {
            edges.push({
              id: `${element.id}-${targetElement.id}`,
              source: element.id,
              target: targetElement.id,
              type: 'default'
            })
          }
        }
      })
    })

    return { nodes, edges }
  }, [elements])
}

// Simple Graph component (fallback instead of ReactFlow)
const SimpleGraph = ({ nodes, edges, onNodeClick }: { nodes: any[]; edges: any[]; onNodeClick: (nodeId: string) => void }) => (
  <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 p-4 relative overflow-hidden">
    <div className="text-center text-gray-500 text-sm mb-4">Magic Element Connections</div>
    <div className="grid grid-cols-3 gap-4 h-full">
      {nodes.slice(0, 9).map((node, i) => (
        <button
          key={node.id}
          onClick={() => onNodeClick(node.id)}
          className="bg-white rounded-lg border p-3 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center h-full"
        >
          <div className={`w-8 h-8 rounded-full mb-2 ${getColorClasses(node.data.type).bg}`}></div>
          <div className="text-xs font-medium truncate w-full">{node.data.label}</div>
          <div className="text-xs text-gray-500">{node.data.type}</div>
        </button>
      ))}
    </div>
    {nodes.length > 9 && (
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        +{nodes.length - 9} more elements
      </div>
    )}
  </div>
)

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
    type?: string // system, spell, artifact, school, creature, phenomenon
    school?: string // evocation, transmutation, etc.
    level?: number // 1-10 power level
    rarity?: string // common, uncommon, rare, legendary
    components?: string[] // verbal, somatic, material, etc.
    casting_time?: string
    duration?: string
    range?: string
    area_of_effect?: string
    requirements?: string[]
    limitations?: string[]
    side_effects?: string[]
    history?: string
    practitioners?: string[]
    related_elements?: string[]
    cost?: string
    // New flexible schema system
    __schema?: CustomField[]
    __values?: Record<string, any>
    __versions?: Version[]
    [key: string]: any
  }
  tags: string[]
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
  { value: 'enchantment', label: 'Enchantment', icon: Shield, color: 'violet' }
]

const MAGIC_SCHOOLS = [
  'Evocation', 'Transmutation', 'Illusion', 'Enchantment', 'Divination',
  'Necromancy', 'Abjuration', 'Conjuration', 'Elementalism', 'Healing',
  'Warding', 'Mind Magic', 'Time Magic', 'Space Magic', 'Nature Magic'
]

const MAGIC_RARITY = [
  { value: 'common', label: 'Common', color: 'gray' },
  { value: 'uncommon', label: 'Uncommon', color: 'green' },
  { value: 'rare', label: 'Rare', color: 'blue' },
  { value: 'epic', label: 'Epic', color: 'purple' },
  { value: 'legendary', label: 'Legendary', color: 'amber' },
  { value: 'mythic', label: 'Mythic', color: 'red' }
]

const MAGIC_COMPONENTS = [
  'verbal', 'somatic', 'material', 'focus', 'divine_focus', 'arcane_focus',
  'blood', 'sacrifice', 'meditation', 'ritual_circle', 'components'
]

const CASTING_TIMES = [
  'instant', '1 action', '1 bonus action', '1 reaction', '1 minute', 
  '10 minutes', '1 hour', '8 hours', '24 hours', 'ritual'
]

const DURATIONS = [
  'instantaneous', '1 round', '1 minute', '10 minutes', '1 hour', 
  '8 hours', '24 hours', 'permanent', 'concentration'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingElement, setEditingElement] = useState<MagicElement | null>(null)
  
  // New view management
  const [view, setView] = useState<'cards' | 'table' | 'graph'>('cards')
  const [tableColumns, setTableColumns] = useState<string[]>(['name', 'attributes.type', 'attributes.rarity', 'attributes.school', 'attributes.level'])
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  // Custom fields management
  const [schemaDraft, setSchemaDraft] = useState<CustomField[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Rich text and linking state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('all')
  const [allWorldElements, setAllWorldElements] = useState<any[]>([])
  const [cursorPosition, setCursorPosition] = useState<{ field: string; position: number }>({ field: '', position: 0 })
  const activeTextAreaRef = useRef<HTMLTextAreaElement | null>(null)

  // Form state - enhanced with flexible schema
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    school: '',
    level: 1,
    rarity: 'common',
    components: [] as string[],
    casting_time: '',
    duration: '',
    range: '',
    area_of_effect: '',
    requirements: [] as string[],
    limitations: [] as string[],
    side_effects: [] as string[],
    history: '',
    practitioners: [] as string[],
    cost: '',
    tags: [] as string[],
    // Flexible schema support
    __schema: [] as CustomField[],
    __values: {} as Record<string, any>
  })

  const supabase = createSupabaseClient()
  const graphData = useGraphData(magicElements)

  // Load saved view preferences
  useEffect(() => {
    const savedView = localStorage.getItem(`magic_views:${projectId}`)
    if (savedView) {
      try {
        const parsed = JSON.parse(savedView)
        setView(parsed.view || 'cards')
        setTableColumns(parsed.tableColumns || tableColumns)
      } catch (e) {
        // Ignore invalid saved views
      }
    }
  }, [projectId])

  // Save view preferences
  const saveViewPreferences = useCallback(() => {
    const viewData = { view, tableColumns }
    localStorage.setItem(`magic_views:${projectId}`, JSON.stringify(viewData))
  }, [view, tableColumns, projectId])

  useEffect(() => {
    saveViewPreferences()
  }, [saveViewPreferences])

  useEffect(() => {
    loadMagicElements()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'magic') {
      setEditingElement(selectedElement)
      populateFormData(selectedElement)
      setShowCreateDialog(true)
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
          .neq('category', 'magic') // Exclude magic elements to avoid self-reference
        
        if (error) throw error
        setAllWorldElements(data || [])
      } catch (error) {
        console.error('Error loading world elements for linking:', error)
      }
    }

    if (showCreateDialog) {
      loadWorldElements()
    }
  }, [projectId, showCreateDialog])

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

  const populateFormData = (element: MagicElement) => {
    setFormData({
      name: element.name,
      description: element.description,
      type: element.attributes?.type || '',
      school: element.attributes?.school || '',
      level: element.attributes?.level || 1,
      rarity: element.attributes?.rarity || 'common',
      components: element.attributes?.components || [],
      casting_time: element.attributes?.casting_time || '',
      duration: element.attributes?.duration || '',
      range: element.attributes?.range || '',
      area_of_effect: element.attributes?.area_of_effect || '',
      requirements: element.attributes?.requirements || [],
      limitations: element.attributes?.limitations || [],
      side_effects: element.attributes?.side_effects || [],
      history: element.attributes?.history || '',
      practitioners: element.attributes?.practitioners || [],
      cost: element.attributes?.cost || '',
      tags: element.tags || [],
      __schema: element.attributes?.__schema || [],
      __values: element.attributes?.__values || {}
    })
    setSchemaDraft(element.attributes?.__schema || [])
  }

  const filteredElements = magicElements.filter(element => {
    const matchesSearch = !searchTerm || 
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.attributes?.school?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || !selectedType || element.attributes?.type === selectedType
    const matchesSchool = selectedSchool === 'all' || !selectedSchool || element.attributes?.school === selectedSchool
    const matchesRarity = selectedRarity === 'all' || !selectedRarity || element.attributes?.rarity === selectedRarity
    
    return matchesSearch && matchesType && matchesSchool && matchesRarity
  })

  const handleCreateElement = async () => {
    try {
      const previousAttributes = editingElement?.attributes || {}
      
      // Build new attributes without versions first
      const baseAttributes = {
        type: formData.type,
        school: formData.school,
        level: formData.level,
        rarity: formData.rarity,
        components: formData.components,
        casting_time: formData.casting_time,
        duration: formData.duration,
        range: formData.range,
        area_of_effect: formData.area_of_effect,
        requirements: formData.requirements,
        limitations: formData.limitations,
        side_effects: formData.side_effects,
        history: formData.history,
        practitioners: formData.practitioners,
        cost: formData.cost,
        __schema: schemaDraft,
        __values: { ...formData.__values }
      }
      
      // Add versioning
      const newAttributes = {
        ...baseAttributes,
        __versions: [
          ...(previousAttributes.__versions || []),
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            by: 'local',
            changes: diffAttributes(previousAttributes, baseAttributes)
          }
        ].slice(-10) // Keep last 10 versions
      }

      const elementData = {
        project_id: projectId,
        category: 'magic',
        name: formData.name,
        description: formData.description,
        attributes: newAttributes,
        tags: formData.tags
      }

      let result: MagicElement
      if (editingElement) {
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

      // Broadcast change
      window.dispatchEvent(new CustomEvent('magicCreated', { 
        detail: { magic: result, projectId } 
      }))

      setShowCreateDialog(false)
      setEditingElement(null)
      resetForm()
      onMagicChange?.()
    } catch (error) {
      console.error('Error creating/updating magic element:', error)
    }
  }

  const handleDeleteElement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this magic element?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMagicElements(prev => prev.filter(e => e.id !== id))
      onMagicChange?.()
    } catch (error) {
      console.error('Error deleting magic element:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      school: '',
      level: 1,
      rarity: 'common',
      components: [],
      casting_time: '',
      duration: '',
      range: '',
      area_of_effect: '',
      requirements: [],
      limitations: [],
      side_effects: [],
      history: '',
      practitioners: [],
      cost: '',
      tags: [],
      __schema: [],
      __values: {}
    })
    setSchemaDraft([])
  }

  const getRarityColor = (rarity: string) => {
    const rarityObj = MAGIC_RARITY.find(r => r.value === rarity)
    return rarityObj?.color || 'gray'
  }

  const addToStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }))
  }

  // Element linking functions
  const handleInsertElementLink = (element: any) => {
    if (!activeTextAreaRef.current) return

    const textarea = activeTextAreaRef.current
    const { selectionStart, selectionEnd } = textarea
    const currentValue = textarea.value
    const linkText = `[[${element.name}]]`
    
    const newValue = currentValue.slice(0, selectionStart) + linkText + currentValue.slice(selectionEnd)
    
    // Update form data based on which field is active
    const fieldName = textarea.getAttribute('data-field')
    if (fieldName) {
      setFormData(prev => ({ ...prev, [fieldName]: newValue }))
    }
    
    setShowLinkModal(false)
    
    // Set cursor position after the inserted link
    setTimeout(() => {
      const newPosition = selectionStart + linkText.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const handleOpenLinkModal = (field: string) => {
    if (activeTextAreaRef.current) {
      setCursorPosition({ field, position: activeTextAreaRef.current.selectionStart })
    }
    setShowLinkModal(true)
  }

  // Element link rendering
  const ElementLink = ({ element, onNavigate }: { element: { id: string; name: string; category: string }; onNavigate?: (id: string, category: string) => void }) => {
    const config = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]
    const Icon = config?.icon || BookOpen
    const colorClasses = getColorClasses(element.category)

    return (
      <button
        onClick={() => onNavigate?.(element.id, element.category)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors hover:shadow-sm ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
      >
        <Icon className="w-3 h-3" />
        {element.name}
      </button>
    )
  }

  const processTextForElementLinks = (text: string) => {
    if (!text) return text

    const linkRegex = /\[\[([^\]]+)\]\]/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Find the referenced element
      const elementName = match[1]
      const referencedElement = allWorldElements.find(el => 
        el.name.toLowerCase() === elementName.toLowerCase()
      )

      if (referencedElement) {
        parts.push(
          <ElementLink 
            key={`${referencedElement.id}-${match.index}`}
            element={referencedElement} 
            onNavigate={onNavigateToElement}
          />
        )
      } else {
        // If element not found, show as regular text with styling
        parts.push(
          <span key={match.index} className="text-gray-500 italic">
            [[{elementName}]]
          </span>
        )
      }

      lastIndex = linkRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 1 ? (
      <div className="space-y-1">
        {parts.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    ) : parts[0] || text
  }

  const handleFormatText = (format: string) => {
    if (!activeTextAreaRef.current) return

    const textarea = activeTextAreaRef.current
    const { selectionStart, selectionEnd } = textarea
    const selectedText = textarea.value.slice(selectionStart, selectionEnd)
    
    if (!selectedText) return

    let formattedText = selectedText
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
    }

    const newValue = textarea.value.slice(0, selectionStart) + formattedText + textarea.value.slice(selectionEnd)
    
    // Update form data based on which field is active
    const fieldName = textarea.getAttribute('data-field')
    if (fieldName) {
      setFormData(prev => ({ ...prev, [fieldName]: newValue }))
    }

    // Set cursor position after the formatted text
    setTimeout(() => {
      const newPosition = selectionStart + formattedText.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  // Rich Text Toolbar Component
  const RichTextToolbar = ({ onAddLink, onFormatText }: { onAddLink: () => void; onFormatText: (format: string) => void }) => (
    <div className="flex items-center gap-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onFormatText('bold')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('italic')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('underline')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
      </div>
      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      <button
        type="button"
        onClick={onAddLink}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm rounded-lg transition-all duration-200 font-medium"
        title="Link Worldbuilding Element"
      >
        <div className="flex items-center gap-1.5">
          <Link className="w-4 h-4" />
          <span className="text-sm">Link Element</span>
        </div>
      </button>
    </div>
  )

  // Enhanced TextArea with Rich Text support
  const EnhancedTextArea = ({ 
    value, 
    onChange, 
    placeholder, 
    rows = 3, 
    fieldName,
    showToolbar = true 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string; 
    rows?: number; 
    fieldName: string;
    showToolbar?: boolean;
  }) => (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all duration-200">
      {showToolbar && (
        <RichTextToolbar 
          onAddLink={() => handleOpenLinkModal(fieldName)}
          onFormatText={handleFormatText}
        />
      )}
      <Textarea
        ref={activeTextAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          activeTextAreaRef.current = e.target as HTMLTextAreaElement
        }}
        placeholder={placeholder}
        rows={rows}
        data-field={fieldName}
        className="border-0 focus:ring-0 resize-none bg-white"
      />
    </div>
  )
    const duplicateData = {
      ...element,
      id: undefined,
      name: `${element.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    }
    
    setEditingElement(null)
    populateFormData(duplicateData as MagicElement)
    setShowCreateDialog(true)
  }

  const handleTemplateSelect = (templateKind: string) => {
    if (templateKind && templateKind !== '') {
      const template = buildDefaultTemplate(templateKind as any)
      applyTemplateToForm(template, setFormData)
      setSchemaDraft(prev => [...prev, ...(template.__schema || [])])
      setSelectedTemplate('')
    }
  }

  const getMagicTypeIcon = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType ? magicType.icon : Zap
  }

  const getMagicTypeColor = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType?.color || 'gray'
  }

  // Field Builder Component
  const FieldBuilder = ({ fields, onChange }: { fields: CustomField[]; onChange: (fields: CustomField[]) => void }) => {
    const addField = () => {
      const newField: CustomField = {
        id: crypto.randomUUID(),
        key: `field_${fields.length + 1}`,
        label: 'New Field',
        type: 'text',
        group: 'mechanics',
        showInCard: false
      }
      onChange([...fields, newField])
    }

    const updateField = (id: string, updates: Partial<CustomField>) => {
      onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const removeField = (id: string) => {
      onChange(fields.filter(f => f.id !== id))
    }

    const moveField = (id: string, direction: 'up' | 'down') => {
      const index = fields.findIndex(f => f.id === id)
      if (index === -1) return
      
      const newFields = [...fields]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      if (targetIndex >= 0 && targetIndex < fields.length) {
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
        onChange(newFields)
      }
    }

    const FIELD_TYPES = [
      { value: 'text', label: 'Text', icon: Type },
      { value: 'richtext', label: 'Rich Text', icon: FileText },
      { value: 'number', label: 'Number', icon: Hash },
      { value: 'select', label: 'Select', icon: List },
      { value: 'multiselect', label: 'Multi-select', icon: Columns },
      { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
      { value: 'tags', label: 'Tags', icon: Tag },
      { value: 'json', label: 'JSON', icon: Code }
    ]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Custom Fields</h4>
          <Button onClick={addField} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Field
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveField(field.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveField(field.id, 'down')}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Field label"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="text-sm"
                  />
                  <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value as any })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={field.group || 'mechanics'} onValueChange={(value) => updateField(field.id, { group: value as any })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mechanics">Mechanics</SelectItem>
                      <SelectItem value="lore">Lore</SelectItem>
                      <SelectItem value="costs">Costs</SelectItem>
                      <SelectItem value="components">Components</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => removeField(field.id)} 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {(field.type === 'select' || field.type === 'multiselect') && (
                <div className="mt-2">
                  <Label className="text-xs text-gray-600">Options (comma-separated)</Label>
                  <Input
                    placeholder="Option 1, Option 2, Option 3"
                    value={field.options?.join(', ') || ''}
                    onChange={(e) => updateField(field.id, { 
                      options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                    })}
                    className="text-sm mt-1"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <Checkbox
                    checked={field.showInCard || false}
                    onCheckedChange={(checked) => updateField(field.id, { showInCard: !!checked })}
                  />
                  Show in card view
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const addToStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromStringArray = (field: 'requirements' | 'limitations' | 'side_effects' | 'practitioners', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Element linking functions
  const handleInsertElementLink = (element: any) => {
    if (!activeTextAreaRef.current) return

    const textarea = activeTextAreaRef.current
    const { selectionStart, selectionEnd } = textarea
    const currentValue = textarea.value
    const linkText = `[[${element.name}]]`
    
    const newValue = currentValue.slice(0, selectionStart) + linkText + currentValue.slice(selectionEnd)
    
    // Update form data based on which field is active
    const fieldName = textarea.getAttribute('data-field')
    if (fieldName) {
      setFormData(prev => ({ ...prev, [fieldName]: newValue }))
    }
    
    setShowLinkModal(false)
    
    // Set cursor position after the inserted link
    setTimeout(() => {
      const newPosition = selectionStart + linkText.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const handleOpenLinkModal = (field: string) => {
    if (activeTextAreaRef.current) {
      setCursorPosition({ field, position: activeTextAreaRef.current.selectionStart })
    }
    setShowLinkModal(true)
  }

  // Element link rendering
  const ElementLink = ({ element, onNavigate }: { element: { id: string; name: string; category: string }; onNavigate?: (id: string, category: string) => void }) => {
    const config = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]
    const Icon = config?.icon || BookOpen
    const colorClass = {
      characters: 'bg-green-100 text-green-800 border-green-200',
      locations: 'bg-purple-100 text-purple-800 border-purple-200', 
      timeline: 'bg-orange-100 text-orange-800 border-orange-200',
      research: 'bg-gray-100 text-gray-800 border-gray-200',
      maps: 'bg-teal-100 text-teal-800 border-teal-200',
      species: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cultures: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      items: 'bg-red-100 text-red-800 border-red-200',
      systems: 'bg-blue-100 text-blue-800 border-blue-200',
      languages: 'bg-pink-100 text-pink-800 border-pink-200',
      religions: 'bg-rose-100 text-rose-800 border-rose-200',
      philosophies: 'bg-violet-100 text-violet-800 border-violet-200',
      encyclopedia: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      arcs: 'bg-amber-100 text-amber-800 border-amber-200'
    }[element.category] || 'bg-gray-100 text-gray-800 border-gray-200'

    return (
      <button
        onClick={() => onNavigate?.(element.id, element.category)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors hover:shadow-sm ${colorClass}`}
      >
        <Icon className="w-3 h-3" />
        {element.name}
      </button>
    )
  }

  const processTextForElementLinks = (text: string) => {
    if (!text) return text

    const linkRegex = /\[\[([^\]]+)\]\]/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Find the referenced element
      const elementName = match[1]
      const referencedElement = allWorldElements.find(el => 
        el.name.toLowerCase() === elementName.toLowerCase()
      )

      if (referencedElement) {
        parts.push(
          <ElementLink 
            key={`${referencedElement.id}-${match.index}`}
            element={referencedElement} 
            onNavigate={onNavigateToElement}
          />
        )
      } else {
        // If element not found, show as regular text with styling
        parts.push(
          <span key={match.index} className="text-gray-500 italic">
            [[{elementName}]]
          </span>
        )
      }

      lastIndex = linkRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 1 ? (
      <div className="space-y-1">
        {parts.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    ) : parts[0] || text
  }

  // Rich Text Toolbar Component
  const RichTextToolbar = ({ onAddLink, onFormatText }: { onAddLink: () => void; onFormatText: (format: string) => void }) => (
    <div className="flex items-center gap-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onFormatText('bold')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('italic')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('underline')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
      </div>
      <div className="w-px h-6 bg-gray-300 mx-2"></div>
      <button
        type="button"
        onClick={onAddLink}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm rounded-lg transition-all duration-200 font-medium"
        title="Link Worldbuilding Element"
      >
        <div className="flex items-center gap-1.5">
          <Link className="w-4 h-4" />
          <span className="text-sm">Link Element</span>
        </div>
      </button>
    </div>
  )

  const handleFormatText = (format: string) => {
    if (!activeTextAreaRef.current) return

    const textarea = activeTextAreaRef.current
    const { selectionStart, selectionEnd } = textarea
    const selectedText = textarea.value.slice(selectionStart, selectionEnd)
    
    if (!selectedText) return

    let formattedText = selectedText
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
    }

    const newValue = textarea.value.slice(0, selectionStart) + formattedText + textarea.value.slice(selectionEnd)
    
    // Update form data based on which field is active
    const fieldName = textarea.getAttribute('data-field')
    if (fieldName) {
      setFormData(prev => ({ ...prev, [fieldName]: newValue }))
    }

    // Set cursor position after the formatted text
    setTimeout(() => {
      const newPosition = selectionStart + formattedText.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  // Enhanced TextArea with Rich Text support
  const EnhancedTextArea = ({ 
    value, 
    onChange, 
    placeholder, 
    rows = 3, 
    fieldName,
    showToolbar = true 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string; 
    rows?: number; 
    fieldName: string;
    showToolbar?: boolean;
  }) => (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all duration-200">
      {showToolbar && (
        <RichTextToolbar 
          onAddLink={() => handleOpenLinkModal(fieldName)}
          onFormatText={handleFormatText}
        />
      )}
      <Textarea
        ref={activeTextAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          activeTextAreaRef.current = e.target as HTMLTextAreaElement
        }}
        placeholder={placeholder}
        rows={rows}
        data-field={fieldName}
        className="border-0 focus:ring-0 resize-none bg-white"
      />
    </div>
  )

  // Add missing helper functions
  const handleDuplicate = async (element: MagicElement) => {
    const duplicateData = {
      ...element,
      name: `${element.name} (Copy)`,
    }
    
    setEditingElement(null)
    populateFormData(duplicateData as MagicElement)
    setShowCreateDialog(true)
  }

  const handleTemplateSelect = (templateKind: string) => {
    if (templateKind && templateKind !== '') {
      const template = buildDefaultTemplate(templateKind as any)
      applyTemplateToForm(template, setFormData)
      setSchemaDraft(prev => [...prev, ...(template.__schema || [])])
      setSelectedTemplate('')
    }
  }

  const getMagicTypeIcon = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType ? magicType.icon : Zap
  }

  const getMagicTypeColor = (type: string) => {
    const magicType = MAGIC_TYPES.find(t => t.value === type)
    return magicType?.color || 'gray'
  }

  if (loading) {
    return (
      <div className="h-full bg-white p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              Magic System
            </h1>
            <p className="text-gray-600 leading-relaxed">Create flexible magic systems with custom fields and templates</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('cards')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-4 h-4 mr-1.5" />
                Cards
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-4 h-4 mr-1.5" />
                Table
              </button>
              <button
                onClick={() => setView('graph')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'graph' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-4 h-4 mr-1.5" />
                Graph
              </button>
            </div>

            {view === 'table' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnPicker(true)}
              >
                <Columns className="w-4 h-4 mr-1.5" />
                Columns
              </Button>
            )}

            <Button
              onClick={() => {
                setEditingElement(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Magic Element
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search magic elements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                />
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
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-full sm:w-56 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                  <SelectValue placeholder="Filter by school" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-xl">
                  <SelectItem value="all" className="font-medium">All Schools</SelectItem>
                  {MAGIC_SCHOOLS.map(school => (
                    <SelectItem key={school} value={school}>
                      <span className="font-medium">{school}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-full sm:w-56 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                  <SelectValue placeholder="Filter by rarity" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-xl">
                  <SelectItem value="all" className="font-medium">All Rarities</SelectItem>
                  {MAGIC_RARITY.map(rarity => (
                    <SelectItem key={rarity.value} value={rarity.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${rarity.color}-500 ring-2 ring-${rarity.color}-200`}></div>
                        <span className="font-medium">{rarity.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'table' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {tableColumns.map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col.replace('attributes.', '').replace('_', ' ')}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredElements.map(element => (
                    <tr key={element.id} className="hover:bg-gray-50 cursor-pointer" 
                        onClick={() => {
                          setEditingElement(element)
                          populateFormData(element)
                          setShowCreateDialog(true)
                        }}>
                      {tableColumns.map(col => (
                        <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {get(element, col) || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(element)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteElement(element.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'graph' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <SimpleGraph 
              nodes={graphData.nodes} 
              edges={graphData.edges} 
              onNodeClick={(nodeId) => {
                const element = magicElements.find(e => e.id === nodeId)
                if (element) {
                  setEditingElement(element)
                  populateFormData(element)
                  setShowCreateDialog(true)
                }
              }}
            />
          </div>
        )}

        {view === 'cards' && filteredElements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-2xl mb-6">
              <Sparkles className="w-20 h-20 text-yellow-400 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No magic elements yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-8 leading-relaxed">
              Start building your magic system by defining spells, artifacts, and magical phenomena that bring your world to life.
            </p>
            <Button 
              onClick={() => {
                setEditingElement(null)
                resetForm()
                setShowCreateDialog(true)
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Magic Element
            </Button>
          </div>
        )}

        {view === 'cards' && filteredElements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElements.map(element => {
              const TypeIcon = getMagicTypeIcon(element.attributes?.type || '')
              const typeColorName = getMagicTypeColor(element.attributes?.type || '')
              const typeColor = getColorClasses(typeColorName)
              const rarityColorName = element.attributes?.rarity || 'common'
              const rarityColor = getColorClasses(rarityColorName)
              
              return (
                <Card key={element.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-yellow-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-yellow-50/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl ${typeColor.bg} ${typeColor.ring}`}>
                          <TypeIcon className={`w-5 h-5 ${typeColor.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-yellow-700 transition-colors">
                            {element.name}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge 
                              className={`${rarityColor.bg} ${rarityColor.text} ${rarityColor.border} font-semibold`}
                            >
                              {MAGIC_RARITY.find(r => r.value === element.attributes?.rarity)?.label || 'Common'}
                            </Badge>
                            {element.attributes?.level && (
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                Level {element.attributes.level}
                              </Badge>
                            )}
                            {element.attributes?.school && (
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                {element.attributes.school}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteElement(element.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Description */}
                      {element.description && (
                        <div className="text-sm text-gray-700 line-clamp-3 rich-content leading-relaxed">
                          {processTextForElementLinks(element.description)}
                        </div>
                      )}

                      {/* Magic Details */}
                      {(element.attributes?.casting_time || element.attributes?.duration || element.attributes?.range) && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {element.attributes?.casting_time && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 font-medium">Casting Time:</span>
                              <span className="text-gray-900 font-semibold">{element.attributes.casting_time}</span>
                            </div>
                          )}
                          {element.attributes?.duration && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 font-medium">Duration:</span>
                              <span className="text-gray-900 font-semibold">{element.attributes.duration}</span>
                            </div>
                          )}
                          {element.attributes?.range && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 font-medium">Range:</span>
                              <span className="text-gray-900 font-semibold">{element.attributes.range}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Components */}
                      {element.attributes?.components && element.attributes.components.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Components</div>
                          <div className="flex flex-wrap gap-1.5">
                            {element.attributes.components.slice(0, 3).map((component: string) => (
                              <Badge key={component} variant="outline" className="text-xs bg-white border-gray-300">
                                {component.replace('_', ' ')}
                              </Badge>
                            ))}
                            {element.attributes.components.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                                +{element.attributes.components.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingElement(element)
                              populateFormData(element)
                              setShowCreateDialog(true)
                            }}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-medium"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(element)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {new Date(element.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setEditingElement(null)
            resetForm()
            onClearSelection?.()
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
            <DialogHeader className="bg-white border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    {editingElement ? 'Edit Magic Element' : 'Create New Magic Element'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-base leading-relaxed mt-2">
                    Define a magical element with custom fields, templates, and rich descriptions.
                  </DialogDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Template Selector */}
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="w-48 bg-white">
                      <SelectValue placeholder="Use Template" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="hard">Hard System</SelectItem>
                      <SelectItem value="soft">Soft System</SelectItem>
                      <SelectItem value="spell">D&D-Style Spell</SelectItem>
                      <SelectItem value="ritual">Ritual</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Version History */}
                  {editingElement && editingElement.attributes?.__versions?.length && (
                    <Button variant="outline" onClick={() => setShowVersions(true)}>
                      <History className="w-4 h-4 mr-2" />
                      Versions ({editingElement.attributes.__versions.length})
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white">
              <TabsList className="grid w-full grid-cols-7 bg-gray-100">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
                <TabsTrigger value="costs">Costs & Limits</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="lore">Lore</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="custom">Custom Fields</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter magic element name..."
                        className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-semibold text-gray-700">Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-xl">
                          {MAGIC_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value} className="bg-white hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-sm font-semibold text-gray-700">School</Label>
                      <Select value={formData.school} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, school: value }))
                      }>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-xl">
                          {MAGIC_SCHOOLS.map(school => (
                            <SelectItem key={school} value={school} className="bg-white hover:bg-gray-50">
                              <span className="font-medium">{school}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-sm font-semibold text-gray-700">Power Level</Label>
                      <div className="space-y-2">
                        <Input
                          id="level"
                          type="range"
                          min="1"
                          max="10"
                          value={formData.level}
                          onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                          className="w-full accent-yellow-500"
                        />
                        <div className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                            Level {formData.level}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rarity" className="text-sm font-semibold text-gray-700">Rarity</Label>
                      <Select value={formData.rarity} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, rarity: value }))
                      }>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-xl">
                          {MAGIC_RARITY.map(rarity => (
                            <SelectItem key={rarity.value} value={rarity.value} className="bg-white hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getColorClasses(rarity.color).bg}`}></div>
                                <span className="font-medium">{rarity.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                    <EnhancedTextArea
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Describe this magic element..."
                      rows={4}
                      fieldName="description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              tags: prev.tags.filter((_, i) => i !== index) 
                            }))}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add tags (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newTag = e.currentTarget.value.trim()
                          if (!formData.tags.includes(newTag)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }))
                          }
                          e.currentTarget.value = ''
                        }
                      }}
                      className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="mechanics" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="casting_time" className="text-sm font-semibold text-gray-700">Casting Time</Label>
                      <Select value={formData.casting_time} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, casting_time: value }))
                      }>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                          <SelectValue placeholder="Select casting time" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-xl">
                          {CASTING_TIMES.map(time => (
                            <SelectItem key={time} value={time} className="bg-white hover:bg-gray-50">
                              <span className="font-medium">{time}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-semibold text-gray-700">Duration</Label>
                      <Select value={formData.duration} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, duration: value }))
                      }>
                        <SelectTrigger className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-xl">
                          {DURATIONS.map(duration => (
                            <SelectItem key={duration} value={duration} className="bg-white hover:bg-gray-50">
                              <span className="font-medium">{duration}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="range" className="text-sm font-semibold text-gray-700">Range</Label>
                      <Input
                        id="range"
                        value={formData.range}
                        onChange={(e) => setFormData(prev => ({ ...prev, range: e.target.value }))}
                        placeholder="e.g., 30 feet, Touch, Self"
                        className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area_of_effect" className="text-sm font-semibold text-gray-700">Area of Effect</Label>
                    <Input
                      id="area_of_effect"
                      value={formData.area_of_effect}
                      onChange={(e) => setFormData(prev => ({ ...prev, area_of_effect: e.target.value }))}
                      placeholder="e.g., 20-foot radius sphere"
                      className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                  
                  {/* Custom fields for mechanics group */}
                  {schemaDraft.filter(field => field.group === 'mechanics').map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">{field.label}</Label>
                      {field.type === 'text' && (
                        <Input
                          value={formData.__values[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            __values: { ...prev.__values, [field.key]: e.target.value }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                        />
                      )}
                      {field.type === 'number' && (
                        <Input
                          type="number"
                          value={formData.__values[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            __values: { ...prev.__values, [field.key]: Number(e.target.value) }
                          }))}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                        />
                      )}
                      {field.type === 'boolean' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.__values[field.key] || false}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              __values: { ...prev.__values, [field.key]: !!checked }
                            }))}
                          />
                          <Label className="text-sm">{field.label}</Label>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="costs" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-sm font-semibold text-gray-700">Cost/Price</Label>
                    <Input
                      id="cost"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="e.g., 50 gold pieces, rare component"
                      className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Requirements</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.requirements.map((req, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {req}
                            <button
                              onClick={() => removeFromStringArray('requirements', index)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Add requirement (press Enter)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addToStringArray('requirements', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                        className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Limitations</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.limitations.map((limit, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {limit}
                            <button
                              onClick={() => removeFromStringArray('limitations', index)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Add limitation (press Enter)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addToStringArray('limitations', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                        className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Side Effects</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.side_effects.map((effect, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {effect}
                            <button
                              onClick={() => removeFromStringArray('side_effects', index)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Add side effect (press Enter)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addToStringArray('side_effects', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                        className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="components" className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Magic Components</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {MAGIC_COMPONENTS.map(component => (
                        <label key={component} className="flex items-center space-x-2 text-sm cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors bg-white">
                          <Checkbox
                            checked={formData.components.includes(component)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  components: [...prev.components, component] 
                                }))
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  components: prev.components.filter(c => c !== component) 
                                }))
                              }
                            }}
                          />
                          <span className="capitalize font-medium">{component.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Custom Components</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(formData.__values.components_extra as string[] || []).map((comp, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {comp}
                          <button
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              __values: { 
                                ...prev.__values, 
                                components_extra: (prev.__values.components_extra as string[] || []).filter((_, i) => i !== index) 
                              }
                            }))}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add custom component (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newComp = e.currentTarget.value.trim()
                          setFormData(prev => ({ 
                            ...prev, 
                            __values: { 
                              ...prev.__values, 
                              components_extra: [...(prev.__values.components_extra as string[] || []), newComp] 
                            }
                          }))
                          e.currentTarget.value = ''
                        }
                      }}
                      className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="lore" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="history" className="text-sm font-semibold text-gray-700">History</Label>
                    <EnhancedTextArea
                      value={formData.history}
                      onChange={(value) => setFormData(prev => ({ ...prev, history: value }))}
                      placeholder="History and origin of this magic element..."
                      rows={4}
                      fieldName="history"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Practitioners</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.practitioners.map((practitioner, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {practitioner}
                          <button
                            onClick={() => removeFromStringArray('practitioners', index)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add practitioner (press Enter)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addToStringArray('practitioners', e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="bg-white border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="links" className="space-y-6">
                  <div className="text-sm text-gray-600">
                    Use the rich text editor in other tabs to create links to world elements with [[Element Name]] syntax.
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Outbound Links</h4>
                      <div className="space-y-2">
                        {(() => {
                          const outboundLinks: string[] = []
                          const linkRegex = /\[\[([^\]]+)\]\]/g
                          const textFields = [formData.description, formData.history]
                          
                          textFields.forEach(text => {
                            let match
                            while ((match = linkRegex.exec(text)) !== null) {
                              if (!outboundLinks.includes(match[1])) {
                                outboundLinks.push(match[1])
                              }
                            }
                          })
                          
                          return outboundLinks.length > 0 ? outboundLinks.map(link => (
                            <div key={link} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <Link className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{link}</span>
                            </div>
                          )) : <div className="text-sm text-gray-500">No outbound links found</div>
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Inbound Links</h4>
                      <div className="space-y-2">
                        {(() => {
                          const inboundLinks = magicElements.filter(el => {
                            if (el.id === editingElement?.id) return false
                            const text = `${el.description} ${el.attributes?.history || ''}`
                            return text.includes(`[[${formData.name}]]`)
                          })
                          
                          return inboundLinks.length > 0 ? inboundLinks.map(el => (
                            <button
                              key={el.id}
                              onClick={() => onNavigateToElement?.(el.id, 'magic')}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors w-full text-left"
                            >
                              <Sparkles className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{el.name}</span>
                            </button>
                          )) : <div className="text-sm text-gray-500">No inbound links found</div>
                        })()}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-6">
                  <FieldBuilder 
                    fields={schemaDraft} 
                    onChange={setSchemaDraft} 
                  />
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 bg-white">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingElement(null)
                  resetForm()
                  onClearSelection?.()
                }}
                className="px-6 bg-white border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateElement}
                disabled={!formData.name.trim()}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingElement ? 'Update' : 'Create'} Magic Element
              </Button>
            </div>
          </DialogContent>
        </Dialog>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 bg-white">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingElement(null)
                  resetForm()
                  onClearSelection?.()
                }}
                className="px-6 bg-white border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateElement}
                disabled={!formData.name.trim()}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingElement ? 'Update' : 'Create'} Magic Element
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Column Picker Modal */}
        <Dialog open={showColumnPicker} onOpenChange={setShowColumnPicker}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Choose Table Columns</DialogTitle>
              <DialogDescription>Select which columns to display in the table view</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {[
                { key: 'name', label: 'Name' },
                { key: 'attributes.type', label: 'Type' },
                { key: 'attributes.rarity', label: 'Rarity' },
                { key: 'attributes.school', label: 'School' },
                { key: 'attributes.level', label: 'Level' },
                { key: 'attributes.casting_time', label: 'Casting Time' },
                { key: 'attributes.duration', label: 'Duration' },
                { key: 'attributes.range', label: 'Range' },
                ...schemaDraft.filter(f => f.showInCard).map(f => ({
                  key: `attributes.__values.${f.key}`,
                  label: f.label
                }))
              ].map(col => (
                <label key={col.key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={tableColumns.includes(col.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTableColumns(prev => [...prev, col.key])
                      } else {
                        setTableColumns(prev => prev.filter(c => c !== col.key))
                      }
                    }}
                  />
                  <span className="text-sm font-medium">{col.label}</span>
                </label>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Element Link Modal */}
        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent className="max-w-3xl bg-white border border-gray-200 shadow-2xl">
            <DialogHeader className="bg-white border-b border-gray-200 pb-6">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Link className="w-5 h-5 text-white" />
                </div>
                Link Worldbuilding Element
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Choose an element to link in your magic description for easy navigation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6 bg-white">
              <div className="flex flex-col sm:flex-row gap-4 bg-white">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search elements..."
                    value={linkSearchTerm}
                    onChange={(e) => setLinkSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={linkCategoryFilter} onValueChange={setLinkCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-56 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-xl">
                    <SelectItem value="all" className="font-semibold bg-white hover:bg-gray-50">All Categories</SelectItem>
                    {/* Dynamic category options */}
                    {(() => {
                      const categoryCounts = allWorldElements.reduce((acc, element) => {
                        acc[element.category] = (acc[element.category] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)

                      return Object.entries(categoryCounts).map(([category, count]) => {
                        const config = WORLD_ELEMENT_TYPES[category as keyof typeof WORLD_ELEMENT_TYPES]
                        return (
                          <SelectItem key={category} value={category} className="bg-white hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span>{config?.emoji || '📄'}</span>
                              <span className="font-medium">{config?.label || category}</span>
                              <span className="text-gray-500 font-normal">({count as number})</span>
                            </div>
                          </SelectItem>
                        )
                      })
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                {allWorldElements
                  .filter(element => {
                    const matchesSearch = !linkSearchTerm || 
                      element.name.toLowerCase().includes(linkSearchTerm.toLowerCase())
                    const matchesCategory = linkCategoryFilter === 'all' || 
                      element.category === linkCategoryFilter
                    return matchesSearch && matchesCategory
                  })
                  .map((element, index) => {
                    // Get element type configuration
                    const config = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]
                    const Icon = config?.icon || BookOpen
                    const label = config?.label || element.category.charAt(0).toUpperCase() + element.category.slice(1)
                    
                    return (
                      <button
                        key={`${element.category}-${element.id}`}
                        onClick={() => handleInsertElementLink(element)}
                        className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{element.name}</div>
                            <div className="text-sm text-gray-500">{label}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Version History Modal */}
        <Dialog open={showVersions} onOpenChange={setShowVersions}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>View and restore previous versions of this magic element</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {editingElement?.attributes?.__versions?.slice().reverse().map((version, index) => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {new Date(version.at).toLocaleString()}
                      </span>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index === 0 ? 'Current' : `Version ${(editingElement?.attributes?.__versions?.length || 0) - index}`}
                      </Badge>
                    </div>
                    {index !== 0 && (
                      <Button variant="outline" size="sm">
                        Restore
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                    {version.changes || 'No changes recorded'}
                  </div>
                </div>
              )) || []}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}