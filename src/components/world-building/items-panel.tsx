'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, Gem, Search, Trash2, Edit3, Copy, Eye, X, Filter, Grid3x3, List as ListIcon, MoreVertical, Download, Tag, Sparkles, GripVertical, Image as ImageIcon, Link2, BarChart3, Settings, Undo2, CheckSquare, Square, Archive, Loader2, MapPin, Users, Package, ArrowUpDown, SlidersHorizontal, FileJson, FileSpreadsheet, ArrowLeft } from 'lucide-react'
import * as ReactWindow from 'react-window'
const { FixedSizeList } = ReactWindow as any
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'

// Types
type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
type ViewMode = 'grid' | 'list'
type SortMode = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'rarity_desc'

interface PropertyItem {
  id: string
  title: string
  details?: string
  power?: number
}

interface LinkRef {
  type: 'character' | 'location' | 'faction' | 'item'
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  description?: string
  attributes: {
    type?: string
    rarity?: Rarity
    value?: number
    weight?: number
    properties?: PropertyItem[]
    history?: string
    images?: string[]
    stats?: Record<string, number>
    links?: LinkRef[]
    custom?: Record<string, string | number>
    __deleted?: boolean
  }
  tags?: string[]
  project_id: string
  created_at: string
  updated_at: string
  deleted_at?: string
  category: string
}

interface FilterState {
  types: string[]
  rarities: Rarity[]
  tags: string[]
}

interface UndoSnapshot {
  action: 'delete' | 'tag' | 'rarity'
  items: Item[]
  description: string
}

// Helper: Get rarity color
function getRarityColor(rarity?: Rarity): string {
  if (!rarity) return 'text-gray-500 bg-gray-100'
  switch (rarity) {
    case 'Common': return 'text-gray-700 bg-gray-100'
    case 'Uncommon': return 'text-green-700 bg-green-100'
    case 'Rare': return 'text-blue-700 bg-blue-100'
    case 'Epic': return 'text-purple-700 bg-purple-100'
    case 'Legendary': return 'text-orange-700 bg-orange-100'
    case 'Mythic': return 'text-pink-700 bg-pink-100'
    default: return 'text-gray-500 bg-gray-100'
  }
}

// Helper: Relative date formatting
function relativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

// Helper: Apply search, sort, and filter
function applySearchSortFilter(
  items: Item[],
  options: { query: string; sort: SortMode; filters: FilterState }
): Item[] {
  const { query, sort, filters } = options
  let filtered = items

  // Exclude soft-deleted items
  filtered = filtered.filter(item => item.attributes.__deleted !== true)

  // Apply search query
  if (query.trim()) {
    const q = query.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.attributes.type?.toLowerCase().includes(q) ||
      item.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }

  // Apply filters
  if (filters.types.length > 0) {
    filtered = filtered.filter(item => 
      item.attributes.type && filters.types.includes(item.attributes.type)
    )
  }

  if (filters.rarities.length > 0) {
    filtered = filtered.filter(item => 
      item.attributes.rarity && filters.rarities.includes(item.attributes.rarity)
    )
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter(item =>
      item.tags?.some(tag => filters.tags.includes(tag))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'rarity_desc': {
        const rarityOrder: Record<string, number> = {
          'Mythic': 6, 'Legendary': 5, 'Epic': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1
        }
        const aVal = rarityOrder[a.attributes.rarity || ''] || 0
        const bVal = rarityOrder[b.attributes.rarity || ''] || 0
        return bVal - aVal
      }
      default:
        return 0
    }
  })

  return filtered
}

// STEP 5: ItemQuickView Component
interface ItemQuickViewProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (item: Item) => void
  onDuplicate: (item: Item) => void
  onDelete: (item: Item) => void
}

function ItemQuickView({ item, open, onOpenChange, onEdit, onDuplicate, onDelete }: ItemQuickViewProps) {
  if (!item) return null

  const images = item.attributes?.images || []
  const properties = item.attributes?.properties || []
  const links = item.attributes?.links || []
  const stats = item.attributes?.stats || {}
  const history = item.attributes?.history
  const hasAbilities = properties.length > 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background sm:max-w-2xl">
        <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DrawerClose>

        <DrawerHeader>
          <DrawerTitle className="text-2xl flex items-center gap-3">
            {item.attributes?.rarity && (
              <Badge className={getRarityColor(item.attributes.rarity)}>
                {item.attributes.rarity}
              </Badge>
            )}
            {item.name}
          </DrawerTitle>
          <DrawerDescription>
            {item.attributes?.type && (
              <span className="text-sm text-muted-foreground">{item.attributes.type}</span>
            )}
          </DrawerDescription>
        </DrawerHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 px-6 pb-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onEdit(item)
              onOpenChange(false)
            }}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDuplicate(item)
              onOpenChange(false)
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDelete(item)
              onOpenChange(false)
            }}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Content Sections */}
        <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          {/* Overview */}
          {item.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-md overflow-hidden bg-gray-100 hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <img
                      src={url}
                      alt={`${item.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilities & Magical Properties */}
          {hasAbilities && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Abilities & Magical Properties
              </h3>
              <ul className="space-y-2">
                {properties.map((prop) => (
                  <li
                    key={prop.id}
                    className="text-sm border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="font-medium">{prop.title}</div>
                    {prop.details && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {prop.details}
                      </div>
                    )}
                    {prop.power !== undefined && (
                      <div className="text-xs text-indigo-600 mt-1">
                        Power Level: {prop.power}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History */}
          {history && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Archive className="w-4 h-4" />
                History
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {history}
              </p>
            </div>
          )}

          {/* Item Stats */}
          {Object.keys(stats).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Item Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                  >
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related People & Places */}
          {links.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Related People & Places
              </h3>
              <div className="flex flex-wrap gap-2">
                {links.map((link) => {
                  const Icon =
                    link.type === 'character' ? Users :
                    link.type === 'location' ? MapPin :
                    link.type === 'faction' ? Users :
                    Package
                  
                  return (
                    <Badge
                      key={link.id}
                      variant="outline"
                      className="flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <Icon className="w-3 h-3" />
                      {link.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Created {relativeDate(item.created_at)}</span>
              <span>Updated {relativeDate(item.updated_at)}</span>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// STEP 6: ItemEditorDialog Component
interface ItemEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Item | null
  onSave: (item: Partial<Item> & { name: string }) => Promise<void>
  onDelete?: (item: Item) => void
  onDuplicate?: (item: Item) => void
  projectId: string
  inline?: boolean // If true, renders without Dialog wrapper for full-page mode
}

// Sortable Property Item for drag-and-drop
function SortablePropertyItem({ 
  property, 
  onEdit, 
  onRemove 
}: { 
  property: PropertyItem
  onEdit: (property: PropertyItem) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: property.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
    >
      <button
        type="button"
        className="mt-1 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{property.title}</div>
        {property.details && (
          <div className="text-xs text-muted-foreground mt-0.5">{property.details}</div>
        )}
        {property.power !== undefined && (
          <div className="text-xs text-indigo-600 mt-0.5">Power: {property.power}</div>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(property)}
          className="h-8 w-8 p-0"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(property.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// STEP 7: Item Presets
interface ItemPreset {
  name: string
  type: string
  rarity: Rarity
  description: string
  properties: Array<{ title: string; details: string; power?: number }>
  tags: string[]
  stats?: Record<string, number>
}

const ITEM_PRESETS: Record<string, ItemPreset> = {
  weapon: {
    name: 'Weapon',
    type: 'weapon',
    rarity: 'Common',
    description: 'A weapon used for combat and defense.',
    properties: [
      { title: 'Attack Bonus', details: 'Increases chance to hit in combat', power: 5 },
      { title: 'Damage', details: 'Base damage dealt on successful hit', power: 3 }
    ],
    tags: ['weapon', 'combat', 'equipment'],
    stats: { damage: 10, accuracy: 5, durability: 100 }
  },
  relic: {
    name: 'Relic',
    type: 'relic',
    rarity: 'Rare',
    description: 'An ancient artifact with historical significance and mysterious properties.',
    properties: [
      { title: 'Ancient Power', details: 'Channels energy from ages past', power: 7 },
      { title: 'Historical Resonance', details: 'Connects wielder to historical events' }
    ],
    tags: ['relic', 'ancient', 'historical', 'mystery'],
    stats: { magic_power: 15, wisdom: 8 }
  },
  magical_focus: {
    name: 'Magical Focus',
    type: 'magical focus',
    rarity: 'Uncommon',
    description: 'A tool used to channel and amplify magical energies.',
    properties: [
      { title: 'Spell Amplification', details: 'Increases the power of cast spells', power: 6 },
      { title: 'Mana Efficiency', details: 'Reduces the cost of magical abilities', power: 4 }
    ],
    tags: ['magic', 'focus', 'spellcasting', 'equipment'],
    stats: { magic_power: 12, mana_efficiency: 8 }
  },
  consumable: {
    name: 'Consumable',
    type: 'consumable',
    rarity: 'Common',
    description: 'A single-use item that provides temporary benefits or effects.',
    properties: [
      { title: 'Instant Effect', details: 'Takes effect immediately upon use' },
      { title: 'Single Use', details: 'Consumed after one use' }
    ],
    tags: ['consumable', 'temporary', 'single-use'],
    stats: { uses: 1, effect_duration: 60 }
  },
  artifact: {
    name: 'Artifact',
    type: 'artifact',
    rarity: 'Legendary',
    description: 'A legendary item of immense power and significance, often with world-altering capabilities.',
    properties: [
      { title: 'Legendary Power', details: 'Possesses extraordinary abilities beyond normal items', power: 10 },
      { title: 'Reality Manipulation', details: 'Can alter fundamental aspects of reality', power: 9 },
      { title: 'Sentience', details: 'The artifact has its own consciousness and will' }
    ],
    tags: ['artifact', 'legendary', 'powerful', 'unique', 'sentient'],
    stats: { power_level: 100, magic_power: 25, influence: 20 }
  }
}

function ItemEditorDialog({ open, onOpenChange, initial, onSave, onDelete, onDuplicate, projectId, inline = false }: ItemEditorDialogProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')
  const [rarity, setRarity] = useState<Rarity>('Common')
  const [value, setValue] = useState('')
  const [weight, setWeight] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null)
  const [propertyForm, setPropertyForm] = useState({ title: '', details: '', power: '' })
  
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [coverIndex, setCoverIndex] = useState(0)
  
  const [history, setHistory] = useState('')
  const [originYear, setOriginYear] = useState('')
  
  const [links, setLinks] = useState<LinkRef[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [statKey, setStatKey] = useState('')
  const [statValue, setStatValue] = useState('')
  
  const [customFields, setCustomFields] = useState<Record<string, string | number>>({})
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [customType, setCustomType] = useState<'text' | 'number'>('text')

  // DnD sensors for properties
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize form when dialog opens or initial changes
  useEffect(() => {
    if (open && initial) {
      setName(initial.name)
      setDescription(initial.description || '')
      setType(initial.attributes?.type || '')
      setRarity(initial.attributes?.rarity || 'Common')
      setValue(initial.attributes?.value?.toString() || '')
      setWeight(initial.attributes?.weight?.toString() || '')
      setTags(initial.tags || [])
      setProperties(initial.attributes?.properties || [])
      setImages(initial.attributes?.images || [])
      setHistory(initial.attributes?.history || '')
      setOriginYear(initial.attributes?.custom?.year?.toString() || '')
      setLinks(initial.attributes?.links || [])
      setStats(initial.attributes?.stats || {})
      const { year, ...otherCustom } = initial.attributes?.custom || {}
      setCustomFields(otherCustom as Record<string, string | number>)
    } else if (open && !initial) {
      // Reset for new item
      setName('')
      setDescription('')
      setType('')
      setRarity('Common')
      setValue('')
      setWeight('')
      setTags([])
      setProperties([])
      setImages([])
      setHistory('')
      setOriginYear('')
      setLinks([])
      setStats({})
      setCustomFields({})
    }
    setActiveTab('basic')
  }, [open, initial])

  // Handle property drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setProperties((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Add/Edit property
  const handleSaveProperty = () => {
    if (!propertyForm.title.trim()) return

    const newProperty: PropertyItem = {
      id: editingProperty?.id || `prop_${Date.now()}`,
      title: propertyForm.title,
      details: propertyForm.details || undefined,
      power: propertyForm.power ? parseFloat(propertyForm.power) : undefined
    }

    if (editingProperty) {
      setProperties(prev => prev.map(p => p.id === editingProperty.id ? newProperty : p))
    } else {
      setProperties(prev => [...prev, newProperty])
    }

    setPropertyForm({ title: '', details: '', power: '' })
    setEditingProperty(null)
  }

  // Add image
  const handleAddImage = () => {
    if (!imageInput.trim()) return
    setImages(prev => [...prev, imageInput.trim()])
    setImageInput('')
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    if (coverIndex >= images.length - 1) {
      setCoverIndex(Math.max(0, images.length - 2))
    }
  }

  // Add tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags(prev => [...prev, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  // Add stat
  const handleAddStat = () => {
    if (!statKey.trim() || !statValue) return
    const numValue = parseFloat(statValue)
    if (isNaN(numValue)) return
    setStats(prev => ({ ...prev, [statKey]: numValue }))
    setStatKey('')
    setStatValue('')
  }

  // Add custom field
  const handleAddCustomField = () => {
    if (!customKey.trim() || !customValue.trim()) return
    const finalValue = customType === 'number' ? parseFloat(customValue) : customValue
    if (customType === 'number' && isNaN(finalValue as number)) return
    setCustomFields(prev => ({ ...prev, [customKey]: finalValue }))
    setCustomKey('')
    setCustomValue('')
  }

  // STEP 7: Apply preset
  const handleApplyPreset = (presetKey: string) => {
    const preset = ITEM_PRESETS[presetKey]
    if (!preset) return

    // Only overwrite empty fields
    if (!type.trim()) setType(preset.type)
    if (rarity === 'Common' && preset.rarity !== 'Common') setRarity(preset.rarity)
    if (!description.trim()) setDescription(preset.description)
    
    // Add preset properties if none exist
    if (properties.length === 0) {
      const newProperties = preset.properties.map((prop, idx) => ({
        id: `prop_${Date.now()}_${idx}`,
        title: prop.title,
        details: prop.details,
        power: prop.power
      }))
      setProperties(newProperties)
    }
    
    // Add preset tags (merge with existing)
    const newTags = [...new Set([...tags, ...preset.tags])]
    setTags(newTags)
    
    // Add preset stats if none exist
    if (Object.keys(stats).length === 0 && preset.stats) {
      setStats(preset.stats)
    }

    setPresetPopoverOpen(false)
    toast.success(`Applied ${preset.name} preset`)
  }

  // Save handler
  const handleSave = async (closeAfter: boolean = false) => {
    if (!name.trim()) {
      toast.error('Item name is required')
      setActiveTab('basic')
      return
    }

    setSaving(true)
    try {
      const itemData: Partial<Item> & { name: string } = {
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        attributes: {
          type: type.trim() || undefined,
          rarity,
          value: value ? parseFloat(value) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          properties: properties.length > 0 ? properties : undefined,
          images: images.length > 0 ? images : undefined,
          history: history.trim() || undefined,
          stats: Object.keys(stats).length > 0 ? stats : undefined,
          links: links.length > 0 ? links : undefined,
          custom: {
            ...customFields,
            ...(originYear ? { year: parseFloat(originYear) } : {})
          }
        }
      }

      if (initial?.id) {
        itemData.id = initial.id
      }

      await onSave(itemData)
      toast.success(initial ? 'Item updated' : 'Item created')
      
      if (closeAfter) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const rarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']

  // Render form content
  const formContent = (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-auto py-0">
            <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="abilities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Abilities
            </TabsTrigger>
            <TabsTrigger value="images" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Images
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              History
            </TabsTrigger>
            <TabsTrigger value="links" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Related
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Stats
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500">
              Custom
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-6">
              {/* Tab 1: Basic Info */}
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter item name..."
                    className="mt-1.5"
                  />
                </div>

                {/* STEP 7: Apply Preset Button */}
                {!initial && (
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-indigo-900">Quick Start with a Preset</div>
                      <div className="text-xs text-indigo-700">Apply sensible defaults for common item types</div>
                    </div>
                    <Popover open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-white hover:bg-indigo-50 border-indigo-300"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Apply Preset
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" align="end">
                        <div className="space-y-1">
                          <div className="text-sm font-medium mb-2 px-2">Choose a Preset</div>
                          {Object.entries(ITEM_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleApplyPreset(key)}
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{preset.name}</span>
                                <Badge className={getRarityColor(preset.rarity)} variant="secondary">
                                  {preset.rarity}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {preset.description}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {preset.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="text-xs px-1.5 py-0.5 bg-muted rounded">
                                    {tag}
                                  </span>
                                ))}
                                {preset.tags.length > 3 && (
                                  <span className="text-xs px-1.5 py-0.5 text-muted-foreground">
                                    +{preset.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-3 px-2 pt-2 border-t">
                          Presets only fill empty fields. Your existing data won't be overwritten.
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    <Input
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="e.g., weapon, armor, tool"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rarity" className="text-sm font-medium">Rarity</Label>
                    <Select value={rarity} onValueChange={(val) => setRarity(val as Rarity)}>
                      <SelectTrigger id="rarity" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rarities.map((r) => (
                          <SelectItem key={r} value={r}>
                            <div className="flex items-center gap-2">
                              <Badge className={getRarityColor(r)} variant="secondary">
                                {r}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="value" className="text-sm font-medium">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="text-sm font-medium">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type tag and press Enter..."
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Overview */}
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this item in detail..."
                    rows={12}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Provide a detailed description of the item's appearance, purpose, and significance.
                  </p>
                </div>
              </TabsContent>

              {/* Tab 3: Abilities & Magical Properties */}
              <TabsContent value="abilities" className="mt-0 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Abilities & Magical Properties</Label>
                  
                  {/* Property Form */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg mb-4">
                    <Input
                      placeholder="Ability title..."
                      value={propertyForm.title}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Details (optional)..."
                      value={propertyForm.details}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, details: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Power level (optional)"
                        value={propertyForm.power}
                        onChange={(e) => setPropertyForm(prev => ({ ...prev, power: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleSaveProperty}
                        disabled={!propertyForm.title.trim()}
                        size="sm"
                      >
                        {editingProperty ? 'Update' : 'Add'} Property
                      </Button>
                      {editingProperty && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingProperty(null)
                            setPropertyForm({ title: '', details: '', power: '' })
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Properties List */}
                  {properties.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={properties.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {properties.map((property) => (
                            <SortablePropertyItem
                              key={property.id}
                              property={property}
                              onEdit={(prop) => {
                                setEditingProperty(prop)
                                setPropertyForm({
                                  title: prop.title,
                                  details: prop.details || '',
                                  power: prop.power?.toString() || ''
                                })
                              }}
                              onRemove={(id) => setProperties(prev => prev.filter(p => p.id !== id))}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No abilities added yet. Add magical properties or special abilities above.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 4: Images */}
              <TabsContent value="images" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-medium">Add Image URL</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="imageUrl"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      onClick={handleAddImage}
                      disabled={!imageInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {images.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Images</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {images.map((url, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 group ${
                            idx === coverIndex ? 'ring-2 ring-indigo-500' : ''
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setCoverIndex(idx)}
                            >
                              {idx === coverIndex ? 'Cover' : 'Set Cover'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveImage(idx)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 5: History & Origins */}
              <TabsContent value="history" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="history" className="text-sm font-medium">History & Origins</Label>
                  <Textarea
                    id="history"
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Describe the item's history, origins, and past owners..."
                    rows={10}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="originYear" className="text-sm font-medium">Origin Year (optional)</Label>
                  <Input
                    id="originYear"
                    type="number"
                    value={originYear}
                    onChange={(e) => setOriginYear(e.target.value)}
                    placeholder="e.g., 1247"
                    className="mt-1.5"
                  />
                </div>
              </TabsContent>

              {/* Tab 6: Related People & Places */}
              <TabsContent value="links" className="mt-0 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Related People & Places</Label>
                  {links.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {links.map((link) => {
                        const Icon =
                          link.type === 'character' ? Users :
                          link.type === 'location' ? MapPin :
                          link.type === 'faction' ? Users :
                          Package
                        return (
                          <Badge key={link.id} variant="outline" className="gap-1.5">
                            <Icon className="w-3 h-3" />
                            {link.name}
                            <button
                              type="button"
                              onClick={() => setLinks(prev => prev.filter(l => l.id !== link.id))}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No related entities yet. Link this item to characters, locations, or other items.
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Note: Entity picker will be implemented in a future update. For now, links can be added programmatically.
                  </p>
                </div>
              </TabsContent>

              {/* Tab 7: Item Stats */}
              <TabsContent value="stats" className="mt-0 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Item Stats</Label>
                  
                  {/* Add Stat Form */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Stat name..."
                      value={statKey}
                      onChange={(e) => setStatKey(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Value..."
                      value={statValue}
                      onChange={(e) => setStatValue(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      onClick={handleAddStat}
                      disabled={!statKey.trim() || !statValue}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Stats List */}
                  {Object.keys(stats).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(stats).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-indigo-600">{val}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const { [key]: _, ...rest } = stats
                                setStats(rest)
                              }}
                              className="h-6 w-6 p-0 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No stats added yet. Add numerical attributes like damage, defense, speed, etc.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 8: Custom Fields */}
              <TabsContent value="custom" className="mt-0 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Custom Fields</Label>
                  
                  {/* Add Custom Field Form */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg mb-4">
                    <Input
                      placeholder="Field name..."
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Value..."
                        type={customType === 'number' ? 'number' : 'text'}
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={customType} onValueChange={(val) => setCustomType(val as 'text' | 'number')}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddCustomField}
                        disabled={!customKey.trim() || !customValue.trim()}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Custom Fields List */}
                  {Object.keys(customFields).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(customFields).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium">{key}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof val === 'number' ? 'Number' : 'Text'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{val}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const { [key]: _, ...rest } = customFields
                                setCustomFields(rest)
                              }}
                              className="h-6 w-6 p-0 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No custom fields yet. Add any additional metadata specific to your world.
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <div className="flex gap-2">
            {initial && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onDelete(initial)
                  onOpenChange(false)
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            {initial && onDuplicate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onDuplicate(initial)
                  onOpenChange(false)
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving || !name.trim()}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !name.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save & Close
            </Button>
          </div>
        </div>
    </>
  )

  // Conditionally wrap in Dialog or render inline
  if (inline) {
    return formContent
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-background p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            {initial ? 'Edit Item' : 'Create New Item'}
          </DialogTitle>
          <DialogDescription>
            {initial ? 'Update item details and properties' : 'Add a new item to your world'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}

// STEP 9: BulkActionsBar Component
interface BulkActionsBarProps {
  selectedCount: number
  onAddTag: () => void
  onSetRarity: () => void
  onExportJSON: () => void
  onExportCSV: () => void
  onDelete: () => void
  onClearSelection: () => void
}

function BulkActionsBar({
  selectedCount,
  onAddTag,
  onSetRarity,
  onExportJSON,
  onExportCSV,
  onDelete,
  onClearSelection
}: BulkActionsBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-6 bg-indigo-400" />
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddTag}
                className="text-white hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-label={`Add tag to ${selectedCount} selected items`}
              >
                <Tag className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onSetRarity}
                className="text-white hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-label={`Set rarity for ${selectedCount} selected items`}
              >
                <Gem className="w-4 h-4 mr-2" />
                Set Rarity
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportJSON}
                className="text-white hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-label={`Export ${selectedCount} selected items as JSON`}
              >
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportCSV}
                className="text-white hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-label={`Export ${selectedCount} selected items as CSV`}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-white hover:bg-red-600 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
                aria-label={`Delete ${selectedCount} selected items`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-white hover:bg-indigo-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  )
}

// STEP 2: ItemsToolbar Component
interface ItemsToolbarProps {
  query: string
  onQuery: (query: string) => void
  sort: SortMode
  onSort: (sort: SortMode) => void
  filters: FilterState
  onFilters: (filters: FilterState) => void
  view: ViewMode
  onView: (view: ViewMode) => void
  bulkMode: boolean
  onBulkMode: (enabled: boolean) => void
  selectionCount: number
  onClearFilters: () => void
  availableTypes: string[]
  availableTags: string[]
}

function ItemsToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilters,
  view,
  onView,
  bulkMode,
  onBulkMode,
  selectionCount,
  onClearFilters,
  availableTypes,
  availableTags
}: ItemsToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  
  const allRarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']
  
  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Active filter count
  const activeFilterCount = filters.types.length + filters.rarities.length + filters.tags.length
  
  // Toggle filter handlers
  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFilters({ ...filters, types: newTypes })
  }
  
  const toggleRarity = (rarity: Rarity) => {
    const newRarities = filters.rarities.includes(rarity)
      ? filters.rarities.filter(r => r !== rarity)
      : [...filters.rarities, rarity]
    onFilters({ ...filters, rarities: newRarities })
  }
  
  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFilters({ ...filters, tags: newTags })
  }
  
  const removeFilter = (category: 'types' | 'rarities' | 'tags', value: string) => {
    onFilters({
      ...filters,
      [category]: filters[category].filter(v => v !== value)
    })
  }

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="p-4 space-y-3">
        {/* Main toolbar row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search items... (Press '/' to focus)"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          {/* Sort */}
          <Select value={sort} onValueChange={(value) => onSort(value as SortMode)}>
            <SelectTrigger className="w-[180px] bg-background">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="name_asc">Name A→Z</SelectItem>
              <SelectItem value="name_desc">Name Z→A</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rarity_desc">Rarity (High→Low)</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Filters */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-background focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 bg-background rounded-2xl shadow-lg" align="start">
              <Command className="bg-background">
                <CommandInput placeholder="Search filters..." className="bg-background" />
                <CommandList>
                  <CommandEmpty>No filters found.</CommandEmpty>
                  
                  {/* Types */}
                  {availableTypes.length > 0 && (
                    <>
                      <CommandGroup heading="Type">
                        {availableTypes.map(type => (
                          <CommandItem
                            key={type}
                            onSelect={() => toggleType(type)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Checkbox
                                checked={filters.types.includes(type)}
                                onCheckedChange={() => toggleType(type)}
                              />
                              <span className="flex-1">{type}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}
                  
                  {/* Rarities */}
                  <CommandGroup heading="Rarity">
                    {allRarities.map(rarity => (
                      <CommandItem
                        key={rarity}
                        onSelect={() => toggleRarity(rarity)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Checkbox
                            checked={filters.rarities.includes(rarity)}
                            onCheckedChange={() => toggleRarity(rarity)}
                          />
                          <Badge className={getRarityColor(rarity)}>{rarity}</Badge>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  
                  {/* Tags */}
                  {availableTags.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Tags">
                        {availableTags.map(tag => (
                          <CommandItem
                            key={tag}
                            onSelect={() => toggleTag(tag)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Checkbox
                                checked={filters.tags.includes(tag)}
                                onCheckedChange={() => toggleTag(tag)}
                              />
                              <Tag className="h-3 w-3" />
                              <span className="flex-1">{tag}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* View toggle */}
          <ToggleGroup type="single" value={view} onValueChange={(val: string) => val && onView(val as ViewMode)}>
            <ToggleGroupItem value="grid" aria-label="Grid view" className="bg-background">
              <Grid3x3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="bg-background">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          {/* Bulk mode */}
          <Button
            variant={bulkMode ? "default" : "outline"}
            onClick={() => onBulkMode(!bulkMode)}
            className="bg-background focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={bulkMode ? `Bulk mode active${selectionCount > 0 ? ` (${selectionCount} selected)` : ''}` : 'Enable bulk mode'}
            aria-pressed={bulkMode}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Bulk
            {bulkMode && selectionCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {selectionCount}
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.types.map(type => (
              <Badge key={`type-${type}`} variant="secondary" className="gap-1">
                <Package className="h-3 w-3" />
                {type}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter('types', type)}
                />
              </Badge>
            ))}
            
            {filters.rarities.map(rarity => (
              <Badge key={`rarity-${rarity}`} className={`${getRarityColor(rarity)} gap-1`}>
                {rarity}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter('rarities', rarity)}
                />
              </Badge>
            ))}
            
            {filters.tags.map(tag => (
              <Badge key={`tag-${tag}`} variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter('tags', tag)}
                />
              </Badge>
            ))}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// STEP 4: Polished Grid View Component
interface ItemsGridProps {
  items: Item[]
  bulkMode: boolean
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onQuickView: (item: Item) => void
  onEdit: (item: Item) => void
  onDuplicate: (item: Item) => void
  onDelete: (item: Item) => void
}

function ItemsGrid({
  items,
  bulkMode,
  selectedIds,
  onSelect,
  onQuickView,
  onEdit,
  onDuplicate,
  onDelete
}: ItemsGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => {
          const isSelected = selectedIds.has(item.id)
          const coverImage = item.attributes?.images?.[0]
          
          return (
            <Card 
              key={item.id} 
              className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-indigo-200'
              }`}
            >
              {/* Cover Image or Placeholder */}
              <div 
                className={`relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center ${
                  bulkMode ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => !bulkMode && onQuickView(item)}
              >
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover blur-[0px] transition-all duration-300"
                    style={{ backgroundColor: '#e0e7ff' }}
                  />
                ) : (
                  <Gem className="w-16 h-16 text-indigo-300" />
                )}
                
                {/* Checkbox overlay (bulk mode) */}
                {bulkMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white shadow-md border-2"
                    />
                  </div>
                )}
                
                {/* Hover actions overlay */}
                {!bulkMode && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button 
                      size="sm"
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); onQuickView(item) }}
                      className="bg-white/90 hover:bg-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      aria-label={`View ${item.name}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm"
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                      className="bg-white/90 hover:bg-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4 space-y-3">
                {/* Header: Name + Rarity */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 
                      className="font-semibold text-base leading-tight line-clamp-2 flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => onQuickView(item)}
                    >
                      {item.name}
                    </h3>
                    
                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 -mt-1 -mr-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          aria-label={`Actions for ${item.name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background rounded-2xl shadow-lg w-48">
                        <DropdownMenuItem onClick={() => onQuickView(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(item)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(item.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Rarity badge */}
                  {item.attributes?.rarity && (
                    <Badge className={`${getRarityColor(item.attributes.rarity)} text-xs font-medium`}>
                      {item.attributes.rarity}
                    </Badge>
                  )}
                </div>
                
                {/* Description */}
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
                
                {/* Key Facts */}
                <div className="space-y-1.5 text-sm">
                  {item.attributes?.type && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.attributes.type}</span>
                    </div>
                  )}
                  {item.attributes?.value !== undefined && item.attributes?.value !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.attributes.value} gp</span>
                    </div>
                  )}
                  {item.attributes?.weight !== undefined && item.attributes?.weight !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.attributes.weight} lbs</span>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs font-normal">
                        <Tag className="w-2.5 h-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{item.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Footer */}
                <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Updated {relativeDate(item.updated_at)}
                  </span>
                  {item.attributes?.properties && item.attributes.properties.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {item.attributes.properties.length} {item.attributes.properties.length === 1 ? 'property' : 'properties'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{items.find(i => i.id === deleteConfirm)?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                const item = items.find(i => i.id === deleteConfirm)
                if (item) onDelete(item)
                setDeleteConfirm(null)
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// STEP 4: Polished List/Table View Component
interface ItemsTableProps {
  items: Item[]
  bulkMode: boolean
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onQuickView: (item: Item) => void
  onEdit: (item: Item) => void
  onDuplicate: (item: Item) => void
  onDelete: (item: Item) => void
}

function ItemsTable({
  items,
  bulkMode,
  selectedIds,
  onSelect,
  onSelectAll,
  onQuickView,
  onEdit,
  onDuplicate,
  onDelete
}: ItemsTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const allSelected = items.length > 0 && items.every(item => selectedIds.has(item.id))
  const someSelected = items.some(item => selectedIds.has(item.id)) && !allSelected
  
  // STEP 10: Virtualization - Row renderer for large datasets
  const renderRow = (item: Item) => {
    const isSelected = selectedIds.has(item.id)
    const coverImage = item.attributes?.images?.[0]
    
    return (
      <TableRow 
        key={item.id}
        className={`group transition-colors ${
          isSelected 
            ? 'bg-indigo-50 hover:bg-indigo-100/70' 
            : 'hover:bg-muted/50'
        }`}
      >
        {bulkMode && (
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
            />
          </TableCell>
        )}
        
        {/* Icon/Image */}
        <TableCell>
          <button 
            className="w-10 h-10 rounded-md overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => onQuickView(item)}
            aria-label={`View ${item.name}`}
          >
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ backgroundColor: '#e0e7ff' }}
              />
            ) : (
              <Gem className="w-5 h-5 text-indigo-400" />
            )}
          </button>
        </TableCell>
        
        {/* Name & Description */}
        <TableCell 
          className="cursor-pointer"
          onClick={() => onQuickView(item)}
        >
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="font-semibold text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
              {item.name}
            </span>
            {item.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        </TableCell>
        
        {/* Type */}
        <TableCell className="hidden md:table-cell">
          {item.attributes?.type ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm">{item.attributes.type}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        
        {/* Rarity */}
        <TableCell className="hidden lg:table-cell">
          {item.attributes?.rarity ? (
            <Badge className={`${getRarityColor(item.attributes.rarity)} font-medium`}>
              {item.attributes.rarity}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        
        {/* Value */}
        <TableCell className="hidden lg:table-cell">
          {item.attributes?.value !== undefined && item.attributes?.value !== null ? (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-medium">{item.attributes.value} gp</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        
        {/* Tags */}
        <TableCell className="hidden xl:table-cell">
          {item.tags && item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {item.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs font-normal">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        
        {/* Updated */}
        <TableCell className="hidden sm:table-cell">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {relativeDate(item.updated_at)}
            </span>
            {item.attributes?.weight !== undefined && item.attributes?.weight !== null && (
              <span className="text-xs text-muted-foreground">
                {item.attributes.weight} lbs
              </span>
            )}
          </div>
        </TableCell>
        
        {/* Actions */}
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 data-[state=open]:bg-muted focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={`Actions for ${item.name}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background w-48 rounded-2xl shadow-lg">
              <DropdownMenuItem onClick={() => onQuickView(item)}>
                <Eye className="w-4 h-4 mr-2" />
                Quick View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteConfirm(item.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }
  
  // STEP 10: Use virtualization for large datasets (>100 items)
  const useVirtualization = items.length > 100
  const ROW_HEIGHT = 72 // Approximate height of each table row
  
  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {bulkMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                  />
                </TableHead>
              )}
              <TableHead className="w-16">Icon</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Type</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Rarity</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Value</TableHead>
              <TableHead className="hidden xl:table-cell font-semibold">Tags</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">Updated</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {useVirtualization ? (
              <tr>
                <td colSpan={bulkMode ? 9 : 8} className="p-0">
                  <FixedSizeList
                    height={Math.min(600, items.length * ROW_HEIGHT)}
                    itemCount={items.length}
                    itemSize={ROW_HEIGHT}
                    width="100%"
                  >
                    {({ index, style }: { index: number; style: React.CSSProperties }) => (
                      <div style={style}>
                        {renderRow(items[index])}
                      </div>
                    )}
                  </FixedSizeList>
                </td>
              </tr>
            ) : (
              items.map(item => renderRow(item))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-background rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{items.find(i => i.id === deleteConfirm)?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm(null)}
              className="focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                const item = items.find(i => i.id === deleteConfirm)
                if (item) onDelete(item)
                setDeleteConfirm(null)
              }}
              className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ItemsPanelProps {
  projectId: string
  selectedElement?: any
  onItemsChange?: () => void
  onClearSelection?: () => void
}

export default function ItemsPanel({ projectId, selectedElement, onItemsChange, onClearSelection }: ItemsPanelProps) {
  const supabase = createSupabaseClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  // STEP 10: Focus restoration
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Core data state
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  
  // View & interaction state (STEP 1 - Required state)
  const [view, setView] = useState<ViewMode>('grid')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('name_asc')
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    rarities: [],
    tags: []
  })
  
  // Modal/drawer state (STEP 1 - Required state)
  const [quickItem, setQuickItem] = useState<Item | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // STEP 9: Bulk actions state
  const [showAddTagDialog, setShowAddTagDialog] = useState(false)
  const [showSetRarityDialog, setShowSetRarityDialog] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [bulkRarity, setBulkRarity] = useState<Rarity>('Common')
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null)
  
  // Legacy state (to be refactored)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<any>({
    name: '', description: '', type: '', rarity: 'common',
    value: '', weight: '', properties: [], history: '', location: '', owner: ''
  })
  
  // Computed: Apply search, sort, and filter (STEP 1 - Using helper)
  const processedItems = useMemo(() => 
    applySearchSortFilter(items, { query, sort, filters }),
    [items, query, sort, filters]
  )
  
  // Computed: Available filter options from data
  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    items.forEach(item => {
      if (item.attributes.type) types.add(item.attributes.type)
    })
    return Array.from(types).sort()
  }, [items])
  
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [items])
  
  // Computed: Active filter count
  const activeFilterCount = useMemo(() => 
    filters.types.length + filters.rarities.length + filters.tags.length,
    [filters]
  )
  
  // Handlers for toolbar
  const handleClearFilters = useCallback(() => {
    setFilters({ types: [], rarities: [], tags: [] })
  }, [])
  
  // STEP 3: Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(processedItems.map(item => item.id)))
    } else {
      setSelectedIds(new Set())
    }
  }, [processedItems])
  
  // STEP 3: Item action handlers
  const handleQuickView = useCallback((item: Item) => {
    setQuickItem(item)
  }, [])
  
  const handleEdit = useCallback((item: Item) => {
    setEditing(item)
    setIsCreating(false)
    setEditorOpen(false) // Use full-page view instead of drawer
  }, [])
  
  // STEP 8: Enhanced Save handler with optimistic updates
  const handleSaveItem = useCallback(async (itemData: Partial<Item> & { name: string }) => {
    const supabase = createSupabaseClient()
    
    if (itemData.id) {
      // UPDATE existing item with optimistic update
      const optimisticItem: Item = {
        ...items.find(i => i.id === itemData.id)!,
        ...itemData,
        updated_at: new Date().toISOString()
      } as Item
      
      // Optimistic update
      setItems(prev => prev.map(item => 
        item.id === itemData.id ? optimisticItem : item
      ))
      
      try {
        // Let Supabase set updated_at timestamp
        const { data, error } = await supabase
          .from('world_elements')
          .update({
            name: itemData.name,
            description: itemData.description,
            tags: itemData.tags,
            attributes: itemData.attributes
          })
          .eq('id', itemData.id)
          .select()
          .single()
        
        if (error) throw error
        
        // Update with server-provided timestamp
        if (data) {
          setItems(prev => prev.map(item => 
            item.id === itemData.id ? (data as Item) : item
          ))
        }
        
        onItemsChange?.()
      } catch (error) {
        // Rollback on error
        setItems(prev => prev.map(item => 
          item.id === itemData.id 
            ? items.find(i => i.id === itemData.id)! 
            : item
        ))
        throw error
      }
    } else {
      // CREATE new item with optimistic insert
      const tempId = `temp_${Date.now()}`
      const optimisticItem: Item = {
        id: tempId,
        name: itemData.name,
        description: itemData.description,
        tags: itemData.tags,
        attributes: itemData.attributes || {},
        project_id: projectId,
        category: 'item',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Item
      
      // Optimistic insert at beginning of list
      setItems(prev => [optimisticItem, ...prev])
      
      try {
        const { data, error } = await supabase
          .from('world_elements')
          .insert({
            name: itemData.name,
            description: itemData.description,
            tags: itemData.tags,
            attributes: itemData.attributes || {},
            project_id: projectId,
            category: 'item'
          })
          .select()
          .single()
        
        if (error) throw error
        
        // Replace temp item with real item from DB
        if (data) {
          setItems(prev => prev.map(item => 
            item.id === tempId ? (data as Item) : item
          ))
        }
        
        onItemsChange?.()
      } catch (error) {
        // Rollback: remove optimistic item
        setItems(prev => prev.filter(item => item.id !== tempId))
        throw error
      }
    }
  }, [items, projectId, onItemsChange])
  
  // STEP 9: Undo handler
  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return
    
    // Restore items from snapshot
    setItems(undoSnapshot.items)
    setUndoSnapshot(null)
    toast.success('Action undone')
    onItemsChange?.()
  }, [undoSnapshot, onItemsChange])
  
  // STEP 9: Bulk Add Tag handler
  const handleBulkAddTag = useCallback(async () => {
    if (!bulkTagInput.trim() || selectedIds.size === 0) return
    
    const supabase = createSupabaseClient()
    const newTag = bulkTagInput.trim()
    const selectedItems = items.filter(i => selectedIds.has(i.id))
    
    // Create snapshot for undo
    setUndoSnapshot({
      action: 'tag',
      items: [...items],
      description: `Added tag "${newTag}" to ${selectedIds.size} items`
    })
    
    // Optimistic update: add tag to selected items (unique merge)
    const updatedItems = items.map(item => {
      if (selectedIds.has(item.id)) {
        const existingTags = item.tags || []
        const newTags = existingTags.includes(newTag) 
          ? existingTags 
          : [...existingTags, newTag]
        return { ...item, tags: newTags }
      }
      return item
    })
    setItems(updatedItems)
    
    try {
      // Update database for each selected item
      for (const item of selectedItems) {
        const existingTags = item.tags || []
        const newTags = existingTags.includes(newTag) 
          ? existingTags 
          : [...existingTags, newTag]
        
        const { error } = await supabase
          .from('world_elements')
          .update({ tags: newTags })
          .eq('id', item.id)
        
        if (error) throw error
      }
      
      toast.success(`Added tag "${newTag}" to ${selectedIds.size} items`, {
        action: {
          label: 'Undo',
          onClick: handleUndo
        },
        duration: 5000
      })
      setShowAddTagDialog(false)
      setBulkTagInput('')
      setSelectedIds(new Set())
      onItemsChange?.()
    } catch (error) {
      // Rollback
      setItems(undoSnapshot?.items || items)
      console.error('Error adding tags:', error)
      toast.error('Failed to add tags')
      setUndoSnapshot(null)
    }
  }, [bulkTagInput, selectedIds, items, handleUndo, onItemsChange])
  
  // STEP 9: Bulk Set Rarity handler
  const handleBulkSetRarity = useCallback(async () => {
    if (selectedIds.size === 0) return
    
    const supabase = createSupabaseClient()
    const selectedItems = items.filter(i => selectedIds.has(i.id))
    
    // Create snapshot for undo
    setUndoSnapshot({
      action: 'rarity',
      items: [...items],
      description: `Set rarity to ${bulkRarity} for ${selectedIds.size} items`
    })
    
    // Optimistic update: set rarity for selected items
    const updatedItems = items.map(item => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          attributes: {
            ...item.attributes,
            rarity: bulkRarity
          }
        }
      }
      return item
    })
    setItems(updatedItems)
    
    try {
      // Update database for each selected item
      for (const item of selectedItems) {
        const { error } = await supabase
          .from('world_elements')
          .update({
            attributes: {
              ...item.attributes,
              rarity: bulkRarity
            }
          })
          .eq('id', item.id)
        
        if (error) throw error
      }
      
      toast.success(`Set rarity to ${bulkRarity} for ${selectedIds.size} items`, {
        action: {
          label: 'Undo',
          onClick: handleUndo
        },
        duration: 5000
      })
      setShowSetRarityDialog(false)
      setSelectedIds(new Set())
      onItemsChange?.()
    } catch (error) {
      // Rollback
      setItems(undoSnapshot?.items || items)
      console.error('Error setting rarity:', error)
      toast.error('Failed to set rarity')
      setUndoSnapshot(null)
    }
  }, [bulkRarity, selectedIds, items, handleUndo, onItemsChange])
  
  // STEP 9: Export JSON handler
  const handleExportJSON = useCallback(() => {
    const itemsToExport = selectedIds.size > 0 
      ? items.filter(i => selectedIds.has(i.id))
      : processedItems
    
    const json = JSON.stringify(itemsToExport, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `items-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Exported ${itemsToExport.length} items to JSON`)
  }, [selectedIds, items, processedItems])
  
  // STEP 9: Export CSV handler
  const handleExportCSV = useCallback(() => {
    const itemsToExport = selectedIds.size > 0 
      ? items.filter(i => selectedIds.has(i.id))
      : processedItems
    
    // Build CSV headers
    const headers = ['ID', 'Name', 'Type', 'Rarity', 'Value', 'Weight', 'Description', 'Tags', 'Created', 'Updated']
    
    // Build CSV rows
    const rows = itemsToExport.map(item => [
      item.id,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.attributes.type || '',
      item.attributes.rarity || '',
      item.attributes.value || '',
      item.attributes.weight || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.tags || []).join(', ')}"`,
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.updated_at).toLocaleDateString()
    ])
    
    // Combine into CSV string
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `items-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Exported ${itemsToExport.length} items to CSV`)
  }, [selectedIds, items, processedItems])
  
  // STEP 8: Enhanced Duplicate handler with optimistic update
  const handleDuplicate = useCallback(async (item: Item) => {
    const supabase = createSupabaseClient()
    const tempId = `temp_${Date.now()}`
    
    // Create optimistic duplicate
    const optimisticDuplicate: Item = {
      ...item,
      id: tempId,
      name: `${item.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Optimistic insert at beginning
    setItems(prev => [optimisticDuplicate, ...prev])
    toast.success('Duplicating item...')
    
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'item',
          name: optimisticDuplicate.name,
          description: item.description,
          attributes: item.attributes,
          tags: item.tags || []
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Replace temp item with real item from DB
      if (data) {
        setItems(prev => prev.map(i => 
          i.id === tempId ? (data as Item) : i
        ))
        toast.success('Item duplicated successfully')
      }
      
      onItemsChange?.()
    } catch (error) {
      // Rollback: remove optimistic duplicate
      setItems(prev => prev.filter(i => i.id !== tempId))
      console.error('Error duplicating item:', error)
      toast.error('Failed to duplicate item')
    }
  }, [projectId, onItemsChange])
  
  // STEP 8: Soft Delete handler (default behavior)
  const handleSoftDelete = useCallback(async (item: Item) => {
    const supabase = createSupabaseClient()
    
    // Optimistic soft delete (remove from UI immediately)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(item.id)
      return newSet
    })
    
    try {
      const { error } = await supabase
        .from('world_elements')
        .update({
          attributes: {
            ...item.attributes,
            __deleted: true
          },
          deleted_at: new Date().toISOString()
        })
        .eq('id', item.id)
      
      if (error) throw error
      
      toast.success('Item moved to trash')
      onItemsChange?.()
    } catch (error) {
      // Rollback: restore item to list
      setItems(prev => [item, ...prev])
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }, [onItemsChange])

  // STEP 8: Bulk Soft Delete handler
  const handleBulkSoftDelete = useCallback(async (itemIds: string[]) => {
    const supabase = createSupabaseClient()
    const itemsToDelete = items.filter(i => itemIds.includes(i.id))
    
    // Optimistic bulk soft delete
    setItems(prev => prev.filter(i => !itemIds.includes(i.id)))
    setSelectedIds(new Set())
    
    try {
      // Update all items in bulk
      const updates = itemsToDelete.map(item => ({
        id: item.id,
        attributes: {
          ...item.attributes,
          __deleted: true
        },
        deleted_at: new Date().toISOString()
      }))
      
      for (const update of updates) {
        const { error } = await supabase
          .from('world_elements')
          .update({
            attributes: update.attributes,
            deleted_at: update.deleted_at
          })
          .eq('id', update.id)
        
        if (error) throw error
      }
      
      toast.success(`${itemIds.length} items moved to trash`)
      onItemsChange?.()
    } catch (error) {
      // Rollback: restore all items
      setItems(prev => [...itemsToDelete, ...prev])
      console.error('Error bulk deleting items:', error)
      toast.error('Failed to delete items')
    }
  }, [items, onItemsChange])

  // STEP 8: Hard Delete handler (permanent deletion with confirmation)
  const handleHardDelete = useCallback(async (item: Item) => {
    const supabase = createSupabaseClient()
    
    // Use Dialog for confirmation instead of native confirm
    if (!confirm(`Permanently delete "${item.name}"? This action CANNOT be undone.`)) {
      return
    }
    
    // Optimistic delete
    setItems(prev => prev.filter(i => i.id !== item.id))
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(item.id)
      return newSet
    })
    
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', item.id)
      
      if (error) throw error
      
      toast.success('Item permanently deleted')
      onItemsChange?.()
    } catch (error) {
      // Rollback: restore item
      setItems(prev => [item, ...prev])
      console.error('Error permanently deleting item:', error)
      toast.error('Failed to permanently delete item')
    }
  }, [onItemsChange])

  // STEP 8: Main delete handler (uses soft delete by default)
  const handleDelete = useCallback(async (item: Item) => {
    await handleSoftDelete(item)
  }, [handleSoftDelete])

  useEffect(() => { loadItems() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'items') {
      setEditingItem(selectedElement)
      setFormData({
        name: selectedElement.name, description: selectedElement.description,
        type: selectedElement.attributes?.type || '', rarity: selectedElement.attributes?.rarity || 'common',
        value: selectedElement.attributes?.value || '', weight: selectedElement.attributes?.weight || '',
        properties: selectedElement.attributes?.properties || [], history: selectedElement.attributes?.history || '',
        location: selectedElement.attributes?.location || '', owner: selectedElement.attributes?.owner || ''
      })
      setShowCreateDialog(true)
    }
  }, [selectedElement])
  
  // Handle new item creation
  const handleNewItem = useCallback(() => {
    setEditing({
      id: '',
      name: '',
      description: '',
      attributes: {
        type: '',
        rarity: 'Common',
        value: 0,
        weight: 0,
        properties: [],
        images: []
      },
      tags: [],
      project_id: projectId,
      category: 'item',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    setIsCreating(true)
    setEditorOpen(false)
  }, [projectId])

  const resetForm = useCallback(() => {
    setEditing(null)
    setIsCreating(false)
    setEditorOpen(false)
  }, [])
  
  // STEP 10: Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      // '/' - Focus search
      if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      
      // 'n' - Open new item dialog
      if (e.key === 'n' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleNewItem()
        return
      }
      
      // 'Esc' - Close dialogs/drawer
      if (e.key === 'Escape') {
        if (editorOpen) {
          setEditorOpen(false)
        } else if (quickItem) {
          setQuickItem(null)
        } else if (showAddTagDialog) {
          setShowAddTagDialog(false)
        } else if (showSetRarityDialog) {
          setShowSetRarityDialog(false)
        }
        return
      }
      
      // 'a' - Select all in bulk mode
      if (e.key === 'a' && bulkMode && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (selectedIds.size === processedItems.length) {
          setSelectedIds(new Set()) // Deselect all if all selected
        } else {
          handleSelectAll(true)
        }
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bulkMode, editorOpen, quickItem, showAddTagDialog, showSetRarityDialog, selectedIds.size, processedItems.length, handleSelectAll, handleNewItem])

  // STEP 10: Focus restoration - Save focus when opening dialogs/drawer
  useEffect(() => {
    if (editorOpen || quickItem || showAddTagDialog || showSetRarityDialog) {
      // Save the currently focused element before opening
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [editorOpen, quickItem, showAddTagDialog, showSetRarityDialog])

  // STEP 10: Focus restoration - Restore focus when closing dialogs/drawer
  useEffect(() => {
    if (!editorOpen && !quickItem && !showAddTagDialog && !showSetRarityDialog) {
      // Restore focus after all dialogs/drawer are closed
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        // Use setTimeout to ensure the dialog/drawer has fully closed
        setTimeout(() => {
          previousFocusRef.current?.focus()
        }, 100)
      }
    }
  }, [editorOpen, quickItem, showAddTagDialog, showSetRarityDialog])

  // STEP 8: Load items with soft-delete filtering
  const loadItems = async () => {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'item')
        .is('deleted_at', null) // Filter soft-deleted at DB level
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Additional client-side filter as belt-and-suspenders
      const activeItems = (data || []).filter(item => 
        item.attributes?.__deleted !== true && !item.deleted_at
      )
      
      setItems(activeItems as Item[])
    } catch (error: any) {
      console.error('Error loading items:', error)
      toast.error(error?.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    try {
      const itemData = { project_id: projectId, category: 'items', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: Item
      if (editingItem) {
        const { data, error } = await supabase.from('world_elements').update({ ...itemData, updated_at: new Date().toISOString() }).eq('id', editingItem.id).select().single()
        if (error) throw error
        result = data as Item
        setItems(prev => prev.map(i => i.id === editingItem.id ? result : i))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(itemData).select().single()
        if (error) throw error
        result = data as Item
        setItems(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('itemCreated', { detail: { item: result, projectId } }))
      setShowCreateDialog(false)
      setEditingItem(null)
      setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' })
      onItemsChange?.()
    } catch (error) {
      console.error('Error creating/updating item:', error)
    }
  }

  const filteredItems = items.filter(i => !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || (i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false))

  if (loading) {
    return (
      <div className="h-full bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
          </div>
        </div>
      </div>
    )
  }

  // Full-page editor view (like Species panel)
  if (isCreating || (editing && !editorOpen && !quickItem)) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100">
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
                    {isCreating ? 'Create New Item' : `Edit ${editing?.name || 'Item'}`}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {isCreating ? 'Add a new item to your world.' : 'Modify the details of this item.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content - Embedded directly */}
        <div className="flex-1 overflow-y-auto">
          <ItemEditorDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) resetForm()
            }}
            initial={editing}
            onSave={async (savedItem) => {
              if (isCreating) {
                setItems(prev => [savedItem as Item, ...prev])
              } else {
                setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem as Item : i))
              }
              resetForm()
              onItemsChange?.()
            }}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            projectId={projectId}
            inline={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-500" />
              Items & Artifacts
            </h2>
            <p className="text-sm text-gray-500">Catalog important objects, artifacts, and possessions</p>
          </div>
          <Button 
            onClick={handleNewItem}
            className="bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Create new item (Press N)"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      {/* STEP 9: BulkActionsBar - Shown when items are selected */}
      {bulkMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onAddTag={() => setShowAddTagDialog(true)}
          onSetRarity={() => setShowSetRarityDialog(true)}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onDelete={() => {
            const idsToDelete = Array.from(selectedIds)
            handleBulkSoftDelete(idsToDelete)
          }}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* STEP 2: ItemsToolbar - Sticky under header */}
      <ItemsToolbar
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        filters={filters}
        onFilters={setFilters}
        view={view}
        onView={setView}
        bulkMode={bulkMode}
        onBulkMode={setBulkMode}
        selectionCount={selectedIds.size}
        onClearFilters={handleClearFilters}
        availableTypes={availableTypes}
        availableTags={availableTags}
      />

      {/* STEP 3: Main content area with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Bulk selection banner */}
          {bulkMode && processedItems.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === processedItems.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <span className="text-sm font-medium text-indigo-900">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} of ${processedItems.length} items selected`
                    : `Select all ${processedItems.length} items on this page`
                  }
                </span>
              </div>
              
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const idsToDelete = Array.from(selectedIds)
                      handleBulkSoftDelete(idsToDelete)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {processedItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {query || activeFilterCount > 0 ? 'No items match your filters' : 'No items yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                  {query || activeFilterCount > 0 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                    : 'Start building your world by creating items, artifacts, and objects that make your story unique.'}
                </p>
                {!query && activeFilterCount === 0 && (
                  <Button 
                    onClick={() => { 
                      setEditing(null)
                      setEditorOpen(true)
                    }} 
                    className="bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            /* STEP 3: Grid or List view */
            view === 'grid' ? (
              <ItemsGrid
                items={processedItems}
                bulkMode={bulkMode}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onQuickView={handleQuickView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ) : (
              <ItemsTable
                items={processedItems}
                bulkMode={bulkMode}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onQuickView={handleQuickView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      </div>

      {/* Legacy Dialog - to be refactored */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); onClearSelection?.() } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            <DialogDescription>Define an important object or artifact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))} placeholder="Item name..." />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))} placeholder="Describe this item..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={formData.type} onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))} placeholder="e.g., weapon, armor, tool" />
              </div>
              <div>
                <Label htmlFor="rarity">Rarity</Label>
                <Input id="rarity" value={formData.rarity} onChange={(e) => setFormData((prev: any) => ({ ...prev, rarity: e.target.value }))} placeholder="common, rare, legendary" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); onClearSelection?.() }}>Cancel</Button>
            <Button onClick={handleCreateItem} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={!formData.name.trim()}>
              {editingItem ? 'Update' : 'Create'} Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 5: Quick View Drawer */}
      <ItemQuickView
        item={quickItem}
        open={!!quickItem}
        onOpenChange={(open) => !open && setQuickItem(null)}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      {/* STEP 6: Item Editor Dialog */}
      <ItemEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editing}
        onSave={handleSaveItem}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        projectId={projectId}
      />

      {/* STEP 9: Add Tag Dialog */}
      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-background">
          <DialogHeader>
            <DialogTitle>Add Tag to Selected Items</DialogTitle>
            <DialogDescription>
              Enter a tag to add to all {selectedIds.size} selected items. If the tag already exists on an item, it will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulkTag" className="text-sm font-medium">Tag Name</Label>
              <Input
                id="bulkTag"
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                placeholder="e.g., magical, quest-item, legendary"
                className="mt-1.5"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && bulkTagInput.trim()) {
                    e.preventDefault()
                    handleBulkAddTag()
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Press Enter to add, or click the button below
              </p>
            </div>
            
            {availableTags.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Common Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-300"
                      onClick={() => setBulkTagInput(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTagDialog(false)
                setBulkTagInput('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAddTag}
              disabled={!bulkTagInput.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Tag className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STEP 9: Set Rarity Dialog */}
      <Dialog open={showSetRarityDialog} onOpenChange={setShowSetRarityDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-background">
          <DialogHeader>
            <DialogTitle>Set Rarity for Selected Items</DialogTitle>
            <DialogDescription>
              Choose a rarity level to apply to all {selectedIds.size} selected items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulkRarity" className="text-sm font-medium mb-3 block">Rarity Level</Label>
              <div className="space-y-2">
                {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as Rarity[]).map(rarity => (
                  <div
                    key={rarity}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${bulkRarity === rarity 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                    onClick={() => setBulkRarity(rarity)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        bulkRarity === rarity ? 'bg-indigo-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium">{rarity}</span>
                        <Badge className={getRarityColor(rarity)}>
                          {rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSetRarityDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSetRarity}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Gem className="w-4 h-4 mr-2" />
              Set Rarity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}