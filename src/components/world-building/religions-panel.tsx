'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Church, Search, Trash2, Edit3, Edit, Trash, BarChart, Grid3x3, List, SlidersHorizontal, X, Check, Copy, MoreVertical, BookOpen, Users, ScrollText, Sparkles, Building2, MapPin, Heart, Calendar, Globe, Link as LinkIcon, BarChart3, Image as ImageIcon, Download, Upload, GripVertical, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ========== DATA MODEL ==========
type Deity = {
  id: string
  name: string
  domain?: string
  symbol?: string
  description?: string
  relationships?: string[]
}

type Scripture = {
  id: string
  title: string
  excerpt?: string
  significance?: string
  date?: string
}

type Practice = {
  id: string
  name: string
  cadence?: 'daily' | 'weekly' | 'seasonal' | 'annual' | 'lifecycle'
  details?: string
}

type Organization = {
  id: string
  role: string
  name?: string
  hierarchy?: string
  description?: string
}

type Place = {
  id: string
  name: string
  location?: string
  importance?: string
  image?: string
}

type Metric = {
  key: string
  value: number
}

type LinkRef = {
  type: 'character' | 'location' | 'faction' | 'item' | 'system' | 'language' | 'religion'
  id: string
  name: string
}

interface ReligionForm {
  id?: string
  name: string
  description?: string
  type?: string
  origin_country?: string
  followers_estimate?: number
  openness?: number
  dogmatism?: number
  propagation?: string
  pantheon: Deity[]
  scriptures: Scripture[]
  practices: Practice[]
  organization: Organization[]
  worship_places: Place[]
  theology?: string
  values?: string
  daily_life?: string
  history?: string
  demographics?: string
  links?: LinkRef[]
  tags?: string[]
  stats?: Metric[]
  images?: string[]
  cover_image?: string
  status?: 'active' | 'defunct' | 'underground'
}

// ========== HELPERS ==========
const relativeTime = (dateISO: string): string => {
  const date = new Date(dateISO)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 4) return `${diffWeek}w ago`
  if (diffMonth < 12) return `${diffMonth}mo ago`
  return `${diffYear}y ago`
}

const applySearchSortFilter = <T extends { name: string; description?: string; tags?: string[]; status?: string }>(
  list: T[],
  options: {
    query?: string
    sort?: 'name' | 'newest' | 'oldest' | 'updated'
    filters?: { status?: string; type?: string }
  }
): T[] => {
  let result = [...list]

  // Search filter
  if (options.query) {
    const q = options.query.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }

  // Status filter
  if (options.filters?.status && options.filters) {
    result = result.filter(item => item.status === options.filters!.status)
  }

  // Type filter
  if (options.filters?.type && options.filters) {
    result = result.filter(item => (item as any).type === options.filters!.type)
  }

  // Sort
  if (options.sort === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  } else if (options.sort === 'newest') {
    result.sort((a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime())
  } else if (options.sort === 'oldest') {
    result.sort((a, b) => new Date((a as any).created_at).getTime() - new Date((b as any).created_at).getTime())
  } else if (options.sort === 'updated') {
    result.sort((a, b) => new Date((b as any).updated_at).getTime() - new Date((a as any).updated_at).getTime())
  }

  return result
}

const pillColor = (type: string, value?: string): string => {
  // Status colors
  if (type === 'status') {
    if (value === 'active') return 'bg-green-100 text-green-700 border-green-200'
    if (value === 'defunct') return 'bg-gray-100 text-gray-700 border-gray-200'
    if (value === 'underground') return 'bg-orange-100 text-orange-700 border-orange-200'
  }

  // Religion type colors
  if (type === 'religion') {
    if (value === 'monotheistic') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (value === 'polytheistic') return 'bg-purple-100 text-purple-700 border-purple-200'
    if (value === 'pantheistic') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (value === 'animistic') return 'bg-teal-100 text-teal-700 border-teal-200'
    if (value === 'atheistic') return 'bg-slate-100 text-slate-700 border-slate-200'
    if (value === 'philosophical') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    if (value === 'nature-based') return 'bg-lime-100 text-lime-700 border-lime-200'
    if (value === 'ancestral') return 'bg-amber-100 text-amber-700 border-amber-200'
  }

  // Default
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

const numberClamp = (value: number, min = 0, max = 100): number => {
  return Math.max(min, Math.min(max, value))
}

const INITIAL_RELIGION: ReligionForm = {
  name: '',
  description: '',
  type: '',
  origin_country: '',
  followers_estimate: 0,
  openness: 50,
  dogmatism: 50,
  propagation: '',
  pantheon: [],
  scriptures: [],
  practices: [],
  organization: [],
  worship_places: [],
  theology: '',
  values: '',
  daily_life: '',
  history: '',
  demographics: '',
  links: [],
  tags: [],
  stats: [],
  images: [],
  status: 'active'
}

// ========== GRID VIEW COMPONENT ==========
interface ReligionsGridProps {
  religions: any[]
  onEdit: (religion: any) => void
  onDuplicate: (religion: any) => void
  onDelete: (religion: any, hard?: boolean) => void
}

function ReligionsGrid({ religions, onEdit, onDuplicate, onDelete }: ReligionsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {religions.map(religion => (
        <Card
          key={religion.id}
          className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-purple-300 bg-white overflow-hidden"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <Church className="w-5 h-5 text-white" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => onEdit(religion)} className="cursor-pointer">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(religion)} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(religion, false)} className="cursor-pointer text-amber-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Move to Trash
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(religion, true)} className="cursor-pointer text-red-600">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
              {religion.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {religion.attributes?.type && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${pillColor('religion', religion.attributes.type)}`}>
                  {religion.attributes.type}
                </span>
              )}
              {religion.attributes?.status && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${pillColor('status', religion.attributes.status)}`}>
                  {religion.attributes.status}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {religion.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{religion.description}</p>
            )}
            
            {/* Quick Facts */}
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
              {religion.attributes?.followers_estimate && (
                <span>{religion.attributes.followers_estimate.toLocaleString()} followers</span>
              )}
              {religion.attributes?.followers_estimate && religion.attributes?.origin_country && (
                <span>•</span>
              )}
              {religion.attributes?.origin_country && (
                <span>{religion.attributes.origin_country}</span>
              )}
            </div>

            {/* Tags */}
            {religion.tags && religion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {religion.tags.slice(0, 2).map((tag: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs">
                    {tag}
                  </span>
                ))}
                {religion.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{religion.tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Updated • {relativeTime(religion.updated_at)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ========== TABLE VIEW COMPONENT ==========
interface ReligionsTableProps {
  religions: any[]
  onEdit: (religion: any) => void
  onDuplicate: (religion: any) => void
  onDelete: (religion: any, hard?: boolean) => void
}

function ReligionsTable({ religions, onEdit, onDuplicate, onDelete }: ReligionsTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-900">Name</TableHead>
            <TableHead className="font-semibold text-gray-900">Type</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Followers</TableHead>
            <TableHead className="font-semibold text-gray-900">Updated</TableHead>
            <TableHead className="font-semibold text-gray-900 w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {religions.map(religion => (
            <TableRow key={religion.id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Church className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{religion.name}</div>
                    {religion.attributes?.origin_country && (
                      <div className="text-xs text-gray-500">{religion.attributes.origin_country}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {religion.attributes?.type && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${pillColor('religion', religion.attributes.type)}`}>
                    {religion.attributes.type}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {religion.attributes?.status && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${pillColor('status', religion.attributes.status)}`}>
                    {religion.attributes.status}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {religion.attributes?.followers_estimate ? (
                  <span className="text-sm text-gray-700">
                    {religion.attributes.followers_estimate.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">{relativeTime(religion.updated_at)}</span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem onClick={() => onEdit(religion)} className="cursor-pointer">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(religion)} className="cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(religion, false)} className="cursor-pointer text-amber-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Move to Trash
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(religion, true)} className="cursor-pointer text-red-600">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ========== RELIGION WORKSPACE COMPONENT ==========
interface ReligionWorkspaceProps {
  mode: 'create' | 'edit'
  form: ReligionForm
  onChange: (patch: Partial<ReligionForm>) => void
  onSave: () => void
  onCancel: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  saving: boolean
}

function ReligionWorkspace({ mode, form, onChange, onSave, onCancel, onDuplicate, onDelete, saving }: ReligionWorkspaceProps) {
  const religionTypes = ['monotheistic', 'polytheistic', 'pantheistic', 'animistic', 'atheistic', 'philosophical', 'nature-based', 'ancestral']
  const [tagInput, setTagInput] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaving, setIsSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [draggedDeityIndex, setDraggedDeityIndex] = useState<number | null>(null)
  const [domainFilter, setDomainFilter] = useState('')
  const [editingScriptureId, setEditingScriptureId] = useState<string | null>(null)
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null)
  const [draggedScriptureIndex, setDraggedScriptureIndex] = useState<number | null>(null)
  const [draggedPracticeIndex, setDraggedPracticeIndex] = useState<number | null>(null)
  const [tempScriptureData, setTempScriptureData] = useState<Scripture | null>(null)
  const [tempPracticeData, setTempPracticeData] = useState<Practice | null>(null)
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null)
  const [draggedOrganizationIndex, setDraggedOrganizationIndex] = useState<number | null>(null)
  const [draggedPlaceIndex, setDraggedPlaceIndex] = useState<number | null>(null)
  const [tempOrganizationData, setTempOrganizationData] = useState<Organization | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [festivalInput, setFestivalInput] = useState('')
  const [tenetInput, setTenetInput] = useState('')
  const [relationshipSearch, setRelationshipSearch] = useState('')
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false)
  const [metricKey, setMetricKey] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [editingMetricIndex, setEditingMetricIndex] = useState<number | null>(null)

  // Autosave with 600ms debounce (edit mode only)
  const debouncedSave = useCallback((patch: Partial<ReligionForm>) => {
    if (mode !== 'edit') return
    
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
    
    autosaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const supabase = createSupabaseClient()
        const { error } = await supabase
          .from('religions')
          .update({ attributes: { ...form, ...patch } })
          .eq('id', form.id)
        
        if (error) {
          console.error('Autosave failed:', error)
          // Rollback on error - onChange will handle this
        }
      } catch (err) {
        console.error('Autosave error:', err)
      } finally {
        setIsSaving(false)
      }
    }, 600)
  }, [mode, form])

  // Handle change with autosave
  const handleChange = (patch: Partial<ReligionForm>) => {
    onChange(patch) // Optimistic update
    debouncedSave(patch) // Debounced save
  }

  // Helper: Get entity type color
  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      character: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      location: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      faction: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      item: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      system: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      language: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
      religion: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    }
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  }

  // Mock entities for picker (in production, fetch from Supabase)
  const mockEntities = [
    { id: '1', name: 'Prophet Elara', type: 'character' },
    { id: '2', name: 'Sacred Temple of Light', type: 'location' },
    { id: '3', name: 'Order of the Dawn', type: 'faction' },
    { id: '4', name: 'Holy Relic', type: 'item' },
    { id: '5', name: 'Magic System', type: 'system' },
    { id: '6', name: 'Ancient Tongue', type: 'language' },
    { id: '7', name: 'Rival Faith', type: 'religion' },
  ]

  // Filter entities by search
  const filteredEntities = mockEntities.filter(entity =>
    entity.name.toLowerCase().includes(relationshipSearch.toLowerCase()) ||
    entity.type.toLowerCase().includes(relationshipSearch.toLowerCase())
  )

  // Add relationship
  const handleAddRelationship = (entity: { id: string; name: string; type: string }) => {
    const newLink: LinkRef = {
      id: entity.id,
      name: entity.name,
      type: entity.type as 'character' | 'location' | 'faction' | 'item' | 'system' | 'language' | 'religion',
    }
    const newLinks = [...(form.links || []), newLink]
    handleChange({ links: newLinks })
    setRelationshipSearch('')
    setShowRelationshipPicker(false)
  }

  // Remove relationship
  const handleRemoveRelationship = (index: number) => {
    const newLinks = form.links?.filter((_, i) => i !== index)
    handleChange({ links: newLinks })
  }

  // Add/Edit metric
  const handleSaveMetric = () => {
    if (!metricKey.trim()) return
    
    const newMetric: Metric = {
      key: metricKey.trim(),
      value: parseFloat(metricValue) || 0,
    }

    let newStats = [...(form.stats || [])]
    if (editingMetricIndex !== null) {
      newStats[editingMetricIndex] = newMetric
    } else {
      newStats.push(newMetric)
    }

    handleChange({ stats: newStats })
    setMetricKey('')
    setMetricValue('')
    setEditingMetricIndex(null)
  }

  // Delete metric
  const handleDeleteMetric = (index: number) => {
    const newStats = form.stats?.filter((_, i) => i !== index)
    handleChange({ stats: newStats })
  }

  // Edit metric
  const handleEditMetric = (index: number) => {
    const metric = form.stats?.[index]
    if (metric) {
      setMetricKey(metric.key)
      setMetricValue(metric.value.toString())
      setEditingMetricIndex(index)
    }
  }

  // Handle image upload for gallery
  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      const newImages = [...(form.images || []), base64]
      handleChange({ images: newImages })
    }
    reader.readAsDataURL(file)
  }

  // Remove gallery image
  const handleRemoveGalleryImage = (index: number) => {
    const newImages = form.images?.filter((_, i) => i !== index)
    handleChange({ images: newImages })
  }

  // Set cover image
  const handleSetCoverImage = (image: string) => {
    handleChange({ cover_image: image })
  }

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTags = [...(form.tags || []), tagInput.trim()]
      handleChange({ tags: newTags })
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    const newTags = (form.tags || []).filter((_, i) => i !== index)
    handleChange({ tags: newTags })
  }

  // Drag and drop handlers for deities
  const handleDragStart = (index: number) => {
    setDraggedDeityIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedDeityIndex === null || draggedDeityIndex === index) return

    const newPantheon = [...form.pantheon]
    const draggedItem = newPantheon[draggedDeityIndex]
    newPantheon.splice(draggedDeityIndex, 1)
    newPantheon.splice(index, 0, draggedItem)
    
    handleChange({ pantheon: newPantheon })
    setDraggedDeityIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedDeityIndex(null)
  }

  // Import/Export JSON handlers for pantheon
  const handleExportPantheon = () => {
    const json = JSON.stringify(form.pantheon, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name || 'religion'}-pantheon.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportPantheon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          handleChange({ pantheon: imported })
        }
      } catch (error) {
        console.error('Failed to import pantheon:', error)
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  // Scriptures import/export
  const handleExportScriptures = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const json = JSON.stringify(form.scriptures, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name || 'religion'}-scriptures.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const headers = ['Title', 'Excerpt', 'Significance', 'Date']
      const rows = form.scriptures.map(s => [
        s.title,
        s.excerpt || '',
        s.significance || '',
        s.date || ''
      ])
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name || 'religion'}-scriptures.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImportScriptures = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          handleChange({ scriptures: imported })
        }
      } catch (error) {
        console.error('Failed to import scriptures:', error)
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Practices import/export
  const handleExportPractices = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const json = JSON.stringify(form.practices, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name || 'religion'}-practices.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const headers = ['Name', 'Cadence', 'Details']
      const rows = form.practices.map(p => [
        p.name,
        p.cadence || '',
        p.details || ''
      ])
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name || 'religion'}-practices.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImportPractices = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          handleChange({ practices: imported })
        }
      } catch (error) {
        console.error('Failed to import practices:', error)
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Organization import/export
  const handleExportOrganization = () => {
    const json = JSON.stringify(form.organization, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name || 'religion'}-organization.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportOrganization = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          handleChange({ organization: imported })
        }
      } catch (error) {
        console.error('Failed to import organization:', error)
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Places import/export
  const handleExportPlaces = () => {
    const json = JSON.stringify(form.worship_places, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name || 'religion'}-places.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportPlaces = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          handleChange({ worship_places: imported })
        }
      } catch (error) {
        console.error('Failed to import places:', error)
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // CREATE MODE - Simple form without tabs
  if (mode === 'create') {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        {/* Header with Back button */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl px-3 py-1.5 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                  <span className="font-medium">Back</span>
                </Button>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Create New Religion
                  </h1>
                  <p className="text-xs text-gray-600">
                    Define a new belief system for your world.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={saving}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl px-3 py-1.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={saving || !form.name?.trim()}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-1.5 text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Create Religion'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Editor Content */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Basics Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Church className="w-4 h-4 text-purple-600" />
            </div>
            Basics
          </h2>

          <div className="space-y-6">
            {/* Row 1: Name and Type */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Religion Name *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="Enter religion name..."
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                  Type
                </Label>
                <Select value={form.type} onValueChange={(value) => onChange({ type: value })}>
                  <SelectTrigger className="bg-background border-gray-300 focus:border-purple-500 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {religionTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Status and Origin Country */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                  Status
                </Label>
                <Select value={form.status} onValueChange={(value: any) => onChange({ status: value })}>
                  <SelectTrigger className="bg-background border-gray-300 focus:border-purple-500 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="defunct">Defunct</SelectItem>
                    <SelectItem value="underground">Underground</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin_country" className="text-sm font-semibold text-gray-700">
                  Origin Country
                </Label>
                <Input
                  id="origin_country"
                  value={form.origin_country}
                  onChange={(e) => onChange({ origin_country: e.target.value })}
                  placeholder="Country of origin..."
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Row 3: Followers */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="followers_estimate" className="text-sm font-semibold text-gray-700">
                  Followers Estimate
                </Label>
                <Input
                  id="followers_estimate"
                  type="number"
                  value={form.followers_estimate || ''}
                  onChange={(e) => onChange({ followers_estimate: parseInt(e.target.value) || 0 })}
                  placeholder="Number of followers..."
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">
                Tags
              </Label>
              <div className="space-y-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter..."
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                />
                {form.tags && form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 pr-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(index)}
                          className="ml-1 hover:bg-purple-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sliders: Openness & Dogmatism */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="openness" className="text-sm font-semibold text-gray-700">
                  Openness: {form.openness || 50}%
                </Label>
                <Input
                  id="openness"
                  type="range"
                  min="0"
                  max="100"
                  value={form.openness || 50}
                  onChange={(e) => onChange({ openness: numberClamp(parseInt(e.target.value)) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">How open is this religion to outsiders and new ideas?</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dogmatism" className="text-sm font-semibold text-gray-700">
                  Dogmatism: {form.dogmatism || 50}%
                </Label>
                <Input
                  id="dogmatism"
                  type="range"
                  min="0"
                  max="100"
                  value={form.dogmatism || 50}
                  onChange={(e) => onChange({ dogmatism: numberClamp(parseInt(e.target.value)) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">How strict are the religious doctrines and interpretations?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Search className="w-4 h-4 text-purple-600" />
            </div>
            Overview
          </h2>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe this belief system in detail..."
              rows={6}
              className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
            />
            <p className="text-xs text-gray-500 italic">
              Tip: Include the core beliefs, origin story, and cultural significance of this religion.
            </p>
          </div>
        </div>

        {/* Additional Sections Placeholder */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <p className="text-sm text-purple-700">
            Additional sections for Pantheon, Scriptures, Practices, Organization, and Holy Places will be available after creating the religion.
          </p>
        </div>
      </div>
    </div>
    )
  }

  // EDIT MODE - Full tabbed workspace
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Editable name + pills */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Church className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {editingName ? (
                  <Input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(e) => handleChange({ name: e.target.value })}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingName(false)
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    className="text-2xl font-bold text-gray-900 border-0 border-b-2 border-purple-500 rounded-none px-1 py-0 h-auto focus:ring-0 bg-transparent"
                  />
                ) : (
                  <h1
                    onClick={() => setEditingName(true)}
                    className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                  >
                    {form.name || 'Untitled Religion'}
                  </h1>
                )}
                
                {/* Pills */}
                <div className="flex items-center gap-2">
                  {form.type && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${pillColor('religion', form.type)}`}>
                      {form.type}
                    </span>
                  )}
                  {form.status && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${pillColor('status', form.status)}`}>
                      {form.status}
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDuplicate}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2 rotate-45" />
                Back to List
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-0">
                  <TabsTrigger value="overview" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 hover:bg-gray-50 data-[state=active]:bg-purple-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <BookOpen className="w-4 h-4 text-gray-500 group-data-[state=active]:text-purple-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-purple-900">Overview</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="pantheon" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 hover:bg-gray-50 data-[state=active]:bg-amber-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Users className="w-4 h-4 text-gray-500 group-data-[state=active]:text-amber-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-amber-900">Pantheon</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="scriptures" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 hover:bg-gray-50 data-[state=active]:bg-blue-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <ScrollText className="w-4 h-4 text-gray-500 group-data-[state=active]:text-blue-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-blue-900">Scriptures</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="practices" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 hover:bg-gray-50 data-[state=active]:bg-emerald-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Sparkles className="w-4 h-4 text-gray-500 group-data-[state=active]:text-emerald-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-emerald-900">Practices</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="organization" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 hover:bg-gray-50 data-[state=active]:bg-indigo-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Building2 className="w-4 h-4 text-gray-500 group-data-[state=active]:text-indigo-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-indigo-900">Organization</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="places" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 hover:bg-gray-50 data-[state=active]:bg-rose-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <MapPin className="w-4 h-4 text-gray-500 group-data-[state=active]:text-rose-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-rose-900">Worship & Places</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="theology" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 hover:bg-gray-50 data-[state=active]:bg-violet-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Heart className="w-4 h-4 text-gray-500 group-data-[state=active]:text-violet-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-violet-900">Theology & Values</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="culture" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 hover:bg-gray-50 data-[state=active]:bg-cyan-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Globe className="w-4 h-4 text-gray-500 group-data-[state=active]:text-cyan-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-cyan-900">Culture & Daily Life</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="history" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 hover:bg-gray-50 data-[state=active]:bg-orange-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <Calendar className="w-4 h-4 text-gray-500 group-data-[state=active]:text-orange-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-orange-900">History & Demographics</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="relationships" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 hover:bg-gray-50 data-[state=active]:bg-pink-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <LinkIcon className="w-4 h-4 text-gray-500 group-data-[state=active]:text-pink-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-pink-900">Relationships</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                  
                  <TabsTrigger value="stats" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 hover:bg-gray-50 data-[state=active]:bg-teal-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group">
                    <BarChart3 className="w-4 h-4 text-gray-500 group-data-[state=active]:text-teal-600" />
                    <span className="text-gray-600 group-data-[state=active]:text-teal-900">Stats & Media</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                  </TabsTrigger>
                </div>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={(value) => handleChange({ type: value })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {religionTypes.map(type => (
                            <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(value: any) => handleChange({ status: value })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="defunct">Defunct</SelectItem>
                          <SelectItem value="underground">Underground</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origin Country</Label>
                      <Input
                        value={form.origin_country}
                        onChange={(e) => handleChange({ origin_country: e.target.value })}
                        placeholder="Country of origin..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Followers Estimate</Label>
                      <Input
                        type="number"
                        value={form.followers_estimate || ''}
                        onChange={(e) => handleChange({ followers_estimate: parseInt(e.target.value) || 0 })}
                        placeholder="Number of followers..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => handleChange({ description: e.target.value })}
                      placeholder="Describe this belief system..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Openness: {form.openness || 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={form.openness || 50}
                        onChange={(e) => handleChange({ openness: numberClamp(parseInt(e.target.value)) })}
                      />
                      <p className="text-xs text-gray-500">How open to outsiders and new ideas?</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Dogmatism: {form.dogmatism || 50}%</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={form.dogmatism || 50}
                        onChange={(e) => handleChange({ dogmatism: numberClamp(parseInt(e.target.value)) })}
                      />
                      <p className="text-xs text-gray-500">How strict are the doctrines?</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PANTHEON TAB */}
            <TabsContent value="pantheon" className="mt-0 space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    onClick={() => {
                      const newDeity: Deity = {
                        id: `deity-${Date.now()}`,
                        name: '',
                        domain: '',
                        symbol: '',
                        description: '',
                        relationships: []
                      }
                      handleChange({ pantheon: [...(form.pantheon || []), newDeity] })
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deity
                  </Button>

                  <div className="relative flex-1 max-w-xs">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Filter by domain..."
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      className="pl-9"
                    />
                    {domainFilter && (
                      <button
                        onClick={() => setDomainFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPantheon}
                    className="hidden"
                    id="import-pantheon-json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={() => document.getElementById('import-pantheon-json')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={handleExportPantheon}
                    disabled={!form.pantheon || form.pantheon.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Deity Cards Grid */}
              {(!form.pantheon || form.pantheon.length === 0) ? (
                <Card className="rounded-xl border-gray-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deities Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Start building your pantheon by adding deities.</p>
                    <Button
                      onClick={() => {
                        const newDeity: Deity = {
                          id: `deity-${Date.now()}`,
                          name: '',
                          domain: '',
                          symbol: '',
                          description: '',
                          relationships: []
                        }
                        handleChange({ pantheon: [newDeity] })
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Deity
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {form.pantheon
                    .filter(deity => {
                      if (!domainFilter) return true
                      return deity.domain?.toLowerCase().includes(domainFilter.toLowerCase()) ||
                             deity.name?.toLowerCase().includes(domainFilter.toLowerCase())
                    })
                    .map((deity, index) => {
                      // Get actual index in full pantheon array for operations
                      const actualIndex = form.pantheon.findIndex(d => d.id === deity.id)
                      
                      return (
                    <Card
                      key={deity.id}
                      draggable
                      onDragStart={() => handleDragStart(actualIndex)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDragEnd={handleDragEnd}
                      className={`group relative hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-amber-300 bg-white overflow-hidden cursor-move ${
                        draggedDeityIndex === actualIndex ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="absolute top-3 left-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Card Actions Dropdown */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/80">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem
                              onClick={() => {
                                const duplicatedDeity: Deity = {
                                  ...deity,
                                  id: `deity-${Date.now()}`,
                                  name: `${deity.name} (Copy)`
                                }
                                const newPantheon = [...form.pantheon]
                                newPantheon.splice(actualIndex + 1, 0, duplicatedDeity)
                                handleChange({ pantheon: newPantheon })
                              }}
                              className="cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const newPantheon = form.pantheon.filter((_, i) => i !== actualIndex)
                                handleChange({ pantheon: newPantheon })
                              }}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardContent className="pt-6 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700">Name *</Label>
                          <Input
                            value={deity.name}
                            onChange={(e) => {
                              const newPantheon = [...form.pantheon]
                              newPantheon[actualIndex] = { ...deity, name: e.target.value }
                              handleChange({ pantheon: newPantheon })
                            }}
                            placeholder="Deity name..."
                            className="bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 font-semibold"
                          />
                        </div>

                        {/* Domain & Symbol */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Domain</Label>
                            <Input
                              value={deity.domain}
                              onChange={(e) => {
                                const newPantheon = [...form.pantheon]
                                newPantheon[actualIndex] = { ...deity, domain: e.target.value }
                                handleChange({ pantheon: newPantheon })
                              }}
                              placeholder="e.g., War"
                              className="bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">Symbol</Label>
                            <Input
                              value={deity.symbol}
                              onChange={(e) => {
                                const newPantheon = [...form.pantheon]
                                newPantheon[actualIndex] = { ...deity, symbol: e.target.value }
                                handleChange({ pantheon: newPantheon })
                              }}
                              placeholder="e.g., ⚔️"
                              className="bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 text-sm"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700">Description</Label>
                          <Textarea
                            value={deity.description}
                            onChange={(e) => {
                              const newPantheon = [...form.pantheon]
                              newPantheon[actualIndex] = { ...deity, description: e.target.value }
                              handleChange({ pantheon: newPantheon })
                            }}
                            placeholder="Describe this deity..."
                            rows={3}
                            className="bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 resize-none text-sm"
                          />
                        </div>

                        {/* Relationships */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700">Relationships</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {deity.relationships && deity.relationships.length > 0 ? (
                              deity.relationships.map((relId, relIndex) => {
                                const relatedDeity = form.pantheon.find(d => d.id === relId)
                                return (
                                  <Badge
                                    key={relIndex}
                                    variant="secondary"
                                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs pr-1"
                                  >
                                    {relatedDeity?.name || 'Unknown'}
                                    <button
                                      onClick={() => {
                                        const newPantheon = [...form.pantheon]
                                        newPantheon[actualIndex] = {
                                          ...deity,
                                          relationships: deity.relationships?.filter((_, i) => i !== relIndex) || []
                                        }
                                        handleChange({ pantheon: newPantheon })
                                      }}
                                      className="ml-1 hover:bg-amber-300 rounded-full p-0.5"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </Badge>
                                )
                              })
                            ) : null}
                            
                            {/* Add Relationship Popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-2 bg-background" align="start">
                                <Command className="bg-background">
                                  <CommandInput placeholder="Search deities..." className="bg-background" />
                                  <CommandList className="bg-background">
                                    <CommandEmpty>No deities found.</CommandEmpty>
                                    <CommandGroup className="bg-background">
                                      {form.pantheon
                                        .filter(d => d.id !== deity.id && !deity.relationships?.includes(d.id))
                                        .map(otherDeity => (
                                          <CommandItem
                                            key={otherDeity.id}
                                            onSelect={() => {
                                              const newPantheon = [...form.pantheon]
                                              newPantheon[actualIndex] = {
                                                ...deity,
                                                relationships: [...(deity.relationships || []), otherDeity.id]
                                              }
                                              handleChange({ pantheon: newPantheon })
                                            }}
                                            className="bg-background cursor-pointer"
                                          >
                                            <Check className="mr-2 h-4 w-4 opacity-0" />
                                            <span>{otherDeity.name || 'Unnamed Deity'}</span>
                                            {otherDeity.domain && (
                                              <span className="ml-auto text-xs text-gray-500">{otherDeity.domain}</span>
                                            )}
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            Link this deity to others in the pantheon
                          </p>
                        </div>

                        {/* Domain Badge (if set) */}
                        {deity.domain && (
                          <div className="pt-2 border-t border-gray-100">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                              {deity.symbol && <span className="mr-1">{deity.symbol}</span>}
                              {deity.domain}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                      )
                    })}
                </div>
              )}
            </TabsContent>

            {/* SCRIPTURES TAB */}
            <TabsContent value="scriptures" className="mt-0 space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <Button
                  onClick={() => {
                    const newScripture: Scripture = {
                      id: `scripture-${Date.now()}`,
                      title: '',
                      excerpt: '',
                      significance: '',
                      date: ''
                    }
                    handleChange({ scriptures: [...(form.scriptures || []), newScripture] })
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scripture
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportScriptures}
                    className="hidden"
                    id="import-scriptures-json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={() => document.getElementById('import-scriptures-json')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:border-gray-300"
                        disabled={!form.scriptures || form.scriptures.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background">
                      <DropdownMenuItem onClick={() => handleExportScriptures('json')} className="cursor-pointer">
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportScriptures('csv')} className="cursor-pointer">
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table */}
              {(!form.scriptures || form.scriptures.length === 0) ? (
                <Card className="rounded-xl border-gray-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <ScrollText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scriptures Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Add sacred texts and religious writings.</p>
                    <Button
                      onClick={() => {
                        const newScripture: Scripture = {
                          id: `scripture-${Date.now()}`,
                          title: '',
                          excerpt: '',
                          significance: '',
                          date: ''
                        }
                        handleChange({ scriptures: [newScripture] })
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Scripture
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="font-semibold text-gray-900">Title</TableHead>
                        <TableHead className="font-semibold text-gray-900">Excerpt</TableHead>
                        <TableHead className="font-semibold text-gray-900">Significance</TableHead>
                        <TableHead className="font-semibold text-gray-900 w-32">Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.scriptures.map((scripture, index) => {
                        const isEditing = editingScriptureId === scripture.id
                        const displayData = isEditing && tempScriptureData ? tempScriptureData : scripture

                        return (
                          <TableRow
                            key={scripture.id}
                            draggable
                            onDragStart={() => setDraggedScriptureIndex(index)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              if (draggedScriptureIndex === null || draggedScriptureIndex === index) return
                              const newScriptures = [...form.scriptures]
                              const draggedItem = newScriptures[draggedScriptureIndex]
                              newScriptures.splice(draggedScriptureIndex, 1)
                              newScriptures.splice(index, 0, draggedItem)
                              handleChange({ scriptures: newScriptures })
                              setDraggedScriptureIndex(index)
                            }}
                            onDragEnd={() => setDraggedScriptureIndex(null)}
                            className={`hover:bg-gray-50 transition-colors cursor-move ${draggedScriptureIndex === index ? 'opacity-50' : 'opacity-100'}`}
                          >
                            <TableCell>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.title}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingScriptureId(scripture.id)
                                    setTempScriptureData({ ...scripture, title: e.target.value })
                                  } else {
                                    setTempScriptureData({ ...displayData, title: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-blue-500 bg-transparent"
                                placeholder="Title..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.excerpt}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingScriptureId(scripture.id)
                                    setTempScriptureData({ ...scripture, excerpt: e.target.value })
                                  } else {
                                    setTempScriptureData({ ...displayData, excerpt: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-blue-500 bg-transparent"
                                placeholder="Excerpt..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.significance}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingScriptureId(scripture.id)
                                    setTempScriptureData({ ...scripture, significance: e.target.value })
                                  } else {
                                    setTempScriptureData({ ...displayData, significance: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-blue-500 bg-transparent"
                                placeholder="Significance..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.date}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingScriptureId(scripture.id)
                                    setTempScriptureData({ ...scripture, date: e.target.value })
                                  } else {
                                    setTempScriptureData({ ...displayData, date: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempScriptureData) {
                                    const newScriptures = [...form.scriptures]
                                    newScriptures[index] = tempScriptureData
                                    handleChange({ scriptures: newScriptures })
                                    setEditingScriptureId(null)
                                    setTempScriptureData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-blue-500 bg-transparent"
                                placeholder="Date..."
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newScriptures = form.scriptures.filter((_, i) => i !== index)
                                  handleChange({ scriptures: newScriptures })
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="practices" className="mt-0 space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <Button
                  onClick={() => {
                    const newPractice: Practice = {
                      id: `practice-${Date.now()}`,
                      name: '',
                      cadence: 'daily',
                      details: ''
                    }
                    handleChange({ practices: [...(form.practices || []), newPractice] })
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Practice
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPractices}
                    className="hidden"
                    id="import-practices-json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={() => document.getElementById('import-practices-json')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:border-gray-300"
                        disabled={!form.practices || form.practices.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background">
                      <DropdownMenuItem onClick={() => handleExportPractices('json')} className="cursor-pointer">
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPractices('csv')} className="cursor-pointer">
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table */}
              {(!form.practices || form.practices.length === 0) ? (
                <Card className="rounded-xl border-gray-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Practices Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Add rituals and religious practices.</p>
                    <Button
                      onClick={() => {
                        const newPractice: Practice = {
                          id: `practice-${Date.now()}`,
                          name: '',
                          cadence: 'daily',
                          details: ''
                        }
                        handleChange({ practices: [newPractice] })
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Practice
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="font-semibold text-gray-900">Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 w-40">Cadence</TableHead>
                        <TableHead className="font-semibold text-gray-900">Details</TableHead>
                        <TableHead className="font-semibold text-gray-900 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.practices.map((practice, index) => {
                        const isEditing = editingPracticeId === practice.id
                        const displayData = isEditing && tempPracticeData ? tempPracticeData : practice

                        return (
                          <TableRow
                            key={practice.id}
                            draggable
                            onDragStart={() => setDraggedPracticeIndex(index)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              if (draggedPracticeIndex === null || draggedPracticeIndex === index) return
                              const newPractices = [...form.practices]
                              const draggedItem = newPractices[draggedPracticeIndex]
                              newPractices.splice(draggedPracticeIndex, 1)
                              newPractices.splice(index, 0, draggedItem)
                              handleChange({ practices: newPractices })
                              setDraggedPracticeIndex(index)
                            }}
                            onDragEnd={() => setDraggedPracticeIndex(null)}
                            className={`hover:bg-gray-50 transition-colors cursor-move ${draggedPracticeIndex === index ? 'opacity-50' : 'opacity-100'}`}
                          >
                            <TableCell>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.name}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingPracticeId(practice.id)
                                    setTempPracticeData({ ...practice, name: e.target.value })
                                  } else {
                                    setTempPracticeData({ ...displayData, name: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempPracticeData) {
                                    const newPractices = [...form.practices]
                                    newPractices[index] = tempPracticeData
                                    handleChange({ practices: newPractices })
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempPracticeData) {
                                    const newPractices = [...form.practices]
                                    newPractices[index] = tempPracticeData
                                    handleChange({ practices: newPractices })
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-emerald-500 bg-transparent"
                                placeholder="Practice name..."
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={displayData.cadence}
                                onValueChange={(value: any) => {
                                  const newPractices = [...form.practices]
                                  newPractices[index] = { ...practice, cadence: value }
                                  handleChange({ practices: newPractices })
                                }}
                              >
                                <SelectTrigger className="bg-background border-0 focus:ring-1 focus:ring-emerald-500">
                                  <SelectValue placeholder="Select cadence" />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="seasonal">Seasonal</SelectItem>
                                  <SelectItem value="annual">Annual</SelectItem>
                                  <SelectItem value="lifecycle">Lifecycle</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.details}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingPracticeId(practice.id)
                                    setTempPracticeData({ ...practice, details: e.target.value })
                                  } else {
                                    setTempPracticeData({ ...displayData, details: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempPracticeData) {
                                    const newPractices = [...form.practices]
                                    newPractices[index] = tempPracticeData
                                    handleChange({ practices: newPractices })
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempPracticeData) {
                                    const newPractices = [...form.practices]
                                    newPractices[index] = tempPracticeData
                                    handleChange({ practices: newPractices })
                                    setEditingPracticeId(null)
                                    setTempPracticeData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-emerald-500 bg-transparent"
                                placeholder="Details..."
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newPractices = form.practices.filter((_, i) => i !== index)
                                  handleChange({ practices: newPractices })
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="organization" className="mt-0 space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <Button
                  onClick={() => {
                    const newOrg: Organization = {
                      id: `org-${Date.now()}`,
                      role: '',
                      name: '',
                      hierarchy: '',
                      description: ''
                    }
                    handleChange({ organization: [...(form.organization || []), newOrg] })
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportOrganization}
                    className="hidden"
                    id="import-organization-json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={() => document.getElementById('import-organization-json')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={handleExportOrganization}
                    disabled={!form.organization || form.organization.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Table */}
              {(!form.organization || form.organization.length === 0) ? (
                <Card className="rounded-xl border-gray-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <Building2 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizational Roles Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Define the religious hierarchy and organizational structure.</p>
                    <Button
                      onClick={() => {
                        const newOrg: Organization = {
                          id: `org-${Date.now()}`,
                          role: '',
                          name: '',
                          hierarchy: '',
                          description: ''
                        }
                        handleChange({ organization: [newOrg] })
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Role
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="font-semibold text-gray-900">Role</TableHead>
                        <TableHead className="font-semibold text-gray-900">Name</TableHead>
                        <TableHead className="font-semibold text-gray-900">Hierarchy</TableHead>
                        <TableHead className="font-semibold text-gray-900">Description</TableHead>
                        <TableHead className="font-semibold text-gray-900 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.organization.map((org, index) => {
                        const isEditing = editingOrganizationId === org.id
                        const displayData = isEditing && tempOrganizationData ? tempOrganizationData : org

                        return (
                          <TableRow
                            key={org.id}
                            draggable
                            onDragStart={() => setDraggedOrganizationIndex(index)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              if (draggedOrganizationIndex === null || draggedOrganizationIndex === index) return
                              const newOrganization = [...form.organization]
                              const draggedItem = newOrganization[draggedOrganizationIndex]
                              newOrganization.splice(draggedOrganizationIndex, 1)
                              newOrganization.splice(index, 0, draggedItem)
                              handleChange({ organization: newOrganization })
                              setDraggedOrganizationIndex(index)
                            }}
                            onDragEnd={() => setDraggedOrganizationIndex(null)}
                            className={`hover:bg-gray-50 transition-colors cursor-move ${draggedOrganizationIndex === index ? 'opacity-50' : 'opacity-100'}`}
                          >
                            <TableCell>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.role}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingOrganizationId(org.id)
                                    setTempOrganizationData({ ...org, role: e.target.value })
                                  } else {
                                    setTempOrganizationData({ ...displayData, role: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                                placeholder="Role title..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.name}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingOrganizationId(org.id)
                                    setTempOrganizationData({ ...org, name: e.target.value })
                                  } else {
                                    setTempOrganizationData({ ...displayData, name: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                                placeholder="Optional name..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.hierarchy}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingOrganizationId(org.id)
                                    setTempOrganizationData({ ...org, hierarchy: e.target.value })
                                  } else {
                                    setTempOrganizationData({ ...displayData, hierarchy: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                                placeholder="Hierarchy level..."
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={displayData.description}
                                onChange={(e) => {
                                  if (!isEditing) {
                                    setEditingOrganizationId(org.id)
                                    setTempOrganizationData({ ...org, description: e.target.value })
                                  } else {
                                    setTempOrganizationData({ ...displayData, description: e.target.value })
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                onBlur={() => {
                                  if (isEditing && tempOrganizationData) {
                                    const newOrganization = [...form.organization]
                                    newOrganization[index] = tempOrganizationData
                                    handleChange({ organization: newOrganization })
                                    setEditingOrganizationId(null)
                                    setTempOrganizationData(null)
                                  }
                                }}
                                className="border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                                placeholder="Description..."
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOrganization = form.organization.filter((_, i) => i !== index)
                                  handleChange({ organization: newOrganization })
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="places" className="mt-0 space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
                <Button
                  onClick={() => {
                    const newPlace: Place = {
                      id: `place-${Date.now()}`,
                      name: '',
                      location: '',
                      importance: '',
                      image: ''
                    }
                    handleChange({ worship_places: [...(form.worship_places || []), newPlace] })
                  }}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Place
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPlaces}
                    className="hidden"
                    id="import-places-json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={() => document.getElementById('import-places-json')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                    onClick={handleExportPlaces}
                    disabled={!form.worship_places || form.worship_places.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Places Grid */}
              {(!form.worship_places || form.worship_places.length === 0) ? (
                <Card className="rounded-xl border-gray-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sacred Places Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Add holy sites and places of worship.</p>
                    <Button
                      onClick={() => {
                        const newPlace: Place = {
                          id: `place-${Date.now()}`,
                          name: '',
                          location: '',
                          importance: '',
                          image: ''
                        }
                        handleChange({ worship_places: [newPlace] })
                      }}
                      className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Place
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {form.worship_places.map((place, index) => (
                    <Card
                      key={place.id}
                      draggable
                      onDragStart={() => setDraggedPlaceIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedPlaceIndex === null || draggedPlaceIndex === index) return
                        const newPlaces = [...form.worship_places]
                        const draggedItem = newPlaces[draggedPlaceIndex]
                        newPlaces.splice(draggedPlaceIndex, 1)
                        newPlaces.splice(index, 0, draggedItem)
                        handleChange({ worship_places: newPlaces })
                        setDraggedPlaceIndex(index)
                      }}
                      onDragEnd={() => setDraggedPlaceIndex(null)}
                      className={`group relative hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-rose-300 bg-white overflow-hidden cursor-move ${
                        draggedPlaceIndex === index ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="absolute top-3 left-3 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded p-1">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* Delete Button */}
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newPlaces = form.worship_places.filter((_, i) => i !== index)
                            handleChange({ worship_places: newPlaces })
                          }}
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Image */}
                      {place.image ? (
                        <div 
                          className="relative h-48 bg-gray-100 cursor-pointer"
                          onClick={() => setLightboxImage(place.image!)}
                        >
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-48 bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (event) => {
                                  const imageUrl = event.target?.result as string
                                  const newPlaces = [...form.worship_places]
                                  newPlaces[index] = { ...place, image: imageUrl }
                                  handleChange({ 
                                    worship_places: newPlaces,
                                    images: [...(form.images || []), imageUrl]
                                  })
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="hidden"
                            id={`place-image-${place.id}`}
                          />
                          <label
                            htmlFor={`place-image-${place.id}`}
                            className="cursor-pointer flex flex-col items-center gap-2 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <ImageIcon className="w-12 h-12" />
                            <span className="text-sm font-medium">Upload Image</span>
                          </label>
                        </div>
                      )}

                      <CardContent className="pt-4 space-y-3">
                        {/* Name */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-700">Name *</Label>
                          <Input
                            value={place.name}
                            onChange={(e) => {
                              const newPlaces = [...form.worship_places]
                              newPlaces[index] = { ...place, name: e.target.value }
                              handleChange({ worship_places: newPlaces })
                            }}
                            placeholder="Place name..."
                            className="bg-white border-gray-300 focus:border-rose-500 focus:ring-rose-500/20 font-semibold"
                          />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-700">Location</Label>
                          <Input
                            value={place.location}
                            onChange={(e) => {
                              const newPlaces = [...form.worship_places]
                              newPlaces[index] = { ...place, location: e.target.value }
                              handleChange({ worship_places: newPlaces })
                            }}
                            placeholder="Geographic location..."
                            className="bg-white border-gray-300 focus:border-rose-500 focus:ring-rose-500/20 text-sm"
                          />
                        </div>

                        {/* Importance */}
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-700">Importance</Label>
                          <Textarea
                            value={place.importance}
                            onChange={(e) => {
                              const newPlaces = [...form.worship_places]
                              newPlaces[index] = { ...place, importance: e.target.value }
                              handleChange({ worship_places: newPlaces })
                            }}
                            placeholder="Religious significance..."
                            rows={2}
                            className="bg-white border-gray-300 focus:border-rose-500 focus:ring-rose-500/20 resize-none text-sm"
                          />
                        </div>

                        {/* Image URL (if uploaded) */}
                        {place.image && (
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Image attached
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newPlaces = [...form.worship_places]
                                newPlaces[index] = { ...place, image: '' }
                                handleChange({ worship_places: newPlaces })
                              }}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Image Lightbox */}
              {lightboxImage && (
                <div
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                  onClick={() => setLightboxImage(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]">
                    <button
                      onClick={() => setLightboxImage(null)}
                      className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    <img
                      src={lightboxImage}
                      alt="Sacred place"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="theology" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
                {/* Main Content */}
                <div className="space-y-6">
                  {/* Core Theology */}
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-violet-600" />
                        </div>
                        Core Theology & Beliefs
                      </CardTitle>
                      {isSaving && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                          Saving...
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Central Tenets & Doctrines</Label>
                        <Textarea
                          value={form.theology}
                          onChange={(e) => handleChange({ theology: e.target.value })}
                          placeholder="Describe the core theological beliefs, worldview, creation myths, cosmology, and fundamental doctrines...\n\nExamples:\n- The nature of the divine\n- Purpose of existence\n- Afterlife beliefs\n- Cosmological structure\n- Relationship between gods and mortals"
                          rows={12}
                          className="bg-white border-gray-300 focus:border-violet-500 focus:ring-violet-500/20 resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 italic">
                          Autosaves after 600ms of inactivity
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Core Values */}
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle>Core Values & Ethics</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Moral Principles & Virtues</Label>
                        <Textarea
                          value={form.values}
                          onChange={(e) => handleChange({ values: e.target.value })}
                          placeholder="Outline the moral framework, ethical guidelines, virtues, and principles...\n\nExamples:\n- Cardinal virtues and sins\n- Moral imperatives\n- Ethical conduct expectations\n- Community values\n- Personal development ideals"
                          rows={12}
                          className="bg-white border-gray-300 focus:border-violet-500 focus:ring-violet-500/20 resize-none font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Propagation Methods */}
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle>Propagation & Spread</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">How the Religion Spreads</Label>
                        <Textarea
                          value={form.propagation}
                          onChange={(e) => handleChange({ propagation: e.target.value })}
                          placeholder="Describe missionary work, conversion methods, cultural diffusion, political expansion...\n\nExamples:\n- Missionary activities\n- Conquest and colonization\n- Trade routes\n- Cultural assimilation\n- Educational institutions"
                          rows={8}
                          className="bg-white border-gray-300 focus:border-violet-500 focus:ring-violet-500/20 resize-none font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Key Tenets */}
                <div className="space-y-6">
                  <Card className="rounded-xl border-gray-200 sticky top-6">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-base">Key Tenets</CardTitle>
                      <p className="text-xs text-gray-500">Core principles in brief</p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Tenet Input */}
                      <div className="space-y-2">
                        <Input
                          value={tenetInput}
                          onChange={(e) => setTenetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tenetInput.trim()) {
                              e.preventDefault()
                              const newTags = [...(form.tags || []), tenetInput.trim()]
                              handleChange({ tags: newTags })
                              setTenetInput('')
                            }
                          }}
                          placeholder="Add a tenet (Enter to save)"
                          className="bg-white border-gray-300 focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                        />
                      </div>

                      {/* Tenets List */}
                      {form.tags && form.tags.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {form.tags.map((tenet, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-2 rounded-lg bg-violet-50 border border-violet-100 group hover:bg-violet-100 transition-colors"
                            >
                              <div className="flex-1 text-sm text-violet-900">{tenet}</div>
                              <button
                                onClick={() => {
                                  const newTags = form.tags?.filter((_, i) => i !== index)
                                  handleChange({ tags: newTags })
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-600 hover:text-violet-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-4 italic">
                          No tenets added yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="culture" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
                {/* Main Content */}
                <div className="space-y-6">
                  {/* Daily Life */}
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-cyan-600" />
                        </div>
                        Culture & Daily Life
                      </CardTitle>
                      {isSaving && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-cyan-500 rounded-full animate-spin" />
                          Saving...
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Daily Religious Practices & Lifestyle</Label>
                        <Textarea
                          value={form.daily_life}
                          onChange={(e) => handleChange({ daily_life: e.target.value })}
                          placeholder="Describe how this religion affects everyday life...\n\nExamples:\n- Daily prayers and rituals\n- Dietary restrictions and fasting\n- Dress codes and modesty\n- Religious observances throughout the day\n- Sacred times and moments\n- Family traditions\n- Community gatherings\n- Lifecycle ceremonies\n- Social customs and etiquette"
                          rows={16}
                          className="bg-white border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 italic">
                          Autosaves after 600ms of inactivity
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Festivals & Holidays */}
                <div className="space-y-6">
                  <Card className="rounded-xl border-gray-200 sticky top-6">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-base">Festivals & Holidays</CardTitle>
                      <p className="text-xs text-gray-500">Sacred celebrations</p>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Festival Input */}
                      <div className="space-y-2">
                        <Input
                          value={festivalInput}
                          onChange={(e) => setFestivalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && festivalInput.trim()) {
                              e.preventDefault()
                              // Store festivals in tags array with a prefix or use a new field
                              const newTags = [...(form.tags || []), `🎉 ${festivalInput.trim()}`]
                              handleChange({ tags: newTags })
                              setFestivalInput('')
                            }
                          }}
                          placeholder="Add festival (Enter to save)"
                          className="bg-white border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
                        />
                        <p className="text-xs text-gray-500 italic">
                          Press Enter to add to the list
                        </p>
                      </div>

                      {/* Festivals List */}
                      {form.tags && form.tags.filter(t => t.startsWith('🎉')).length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {form.tags
                            .map((tag, index) => ({ tag, index }))
                            .filter(({ tag }) => tag.startsWith('🎉'))
                            .map(({ tag, index }) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-50 border border-cyan-100 group hover:bg-cyan-100 transition-colors"
                            >
                              <div className="flex-1 text-sm text-cyan-900">{tag.replace('🎉 ', '')}</div>
                              <button
                                onClick={() => {
                                  const newTags = form.tags?.filter((_, i) => i !== index)
                                  handleChange({ tags: newTags })
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-600 hover:text-cyan-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-4 italic">
                          No festivals added yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-6">
              {/* History & Origins */}
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    History & Origins
                  </CardTitle>
                  {isSaving && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                      Saving...
                    </span>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Historical Development</Label>
                    <Textarea
                      value={form.history}
                      onChange={(e) => handleChange({ history: e.target.value })}
                      placeholder="Chronicle the religion's history from founding to present...\n\nExamples:\n- Founding story and mythology\n- Key prophets, founders, or reformers\n- Major historical events and turning points\n- Schisms, reformations, and evolutions\n- Periods of growth and decline\n- Persecution and survival\n- Golden ages and dark periods\n- Modern developments and adaptations\n- Relationship with secular powers\n- Influence on art, science, and culture"
                      rows={16}
                      className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 italic">
                      Autosaves after 600ms of inactivity
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Demographics & Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Follower Demographics</Label>
                    <Textarea
                      value={form.demographics}
                      onChange={(e) => handleChange({ demographics: e.target.value })}
                      placeholder="Describe who follows this religion and where they are located...\n\nExamples:\n- Geographic distribution and concentration\n- Social classes and economic status\n- Ethnic and cultural groups\n- Age demographics\n- Urban vs. rural followers\n- Educational backgrounds\n- Gender distribution\n- Converts vs. born followers\n- Sects, denominations, and branches\n- Regional variations and diversity"
                      rows={12}
                      className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 resize-none font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats Summary (if available) */}
              {(form.followers_estimate || form.origin_country) && (
                <Card className="rounded-xl border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {form.followers_estimate && (
                        <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="text-2xl font-bold text-orange-900">
                            {form.followers_estimate.toLocaleString()}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">Followers</div>
                        </div>
                      )}
                      {form.origin_country && (
                        <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="text-sm font-semibold text-orange-900">
                            {form.origin_country}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">Origin</div>
                        </div>
                      )}
                      {form.status && (
                        <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="text-sm font-semibold text-orange-900 capitalize">
                            {form.status}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">Status</div>
                        </div>
                      )}
                      {form.type && (
                        <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="text-sm font-semibold text-orange-900 capitalize">
                            {form.type}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">Type</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="relationships" className="mt-0 space-y-6">
              {/* Entity Picker */}
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    Link to World Elements
                  </CardTitle>
                  <p className="text-xs text-gray-500">Connect this religion to characters, locations, factions, and more</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={relationshipSearch}
                        onChange={(e) => {
                          setRelationshipSearch(e.target.value)
                          setShowRelationshipPicker(e.target.value.length > 0)
                        }}
                        onFocus={() => setShowRelationshipPicker(relationshipSearch.length > 0)}
                        placeholder="Search characters, locations, factions, items..."
                        className="pl-10 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Entity Picker Dropdown */}
                    {showRelationshipPicker && filteredEntities.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-background border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredEntities.map((entity) => {
                          const colors = getEntityTypeColor(entity.type)
                          const isAlreadyLinked = form.links?.some(link => link.id === entity.id)
                          
                          return (
                            <button
                              key={entity.id}
                              onClick={() => !isAlreadyLinked && handleAddRelationship(entity)}
                              disabled={isAlreadyLinked}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
                                isAlreadyLinked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {entity.type}
                              </span>
                              <span className="text-sm text-gray-900">{entity.name}</span>
                              {isAlreadyLinked && (
                                <span className="ml-auto text-xs text-gray-500">Already linked</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Linked Entities */}
                  {form.links && form.links.length > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Linked Entities ({form.links.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {form.links.map((link, index) => {
                          const colors = getEntityTypeColor(link.type)
                          return (
                            <div
                              key={index}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} group hover:shadow-md transition-all`}
                            >
                              <span className={`text-xs font-medium uppercase ${colors.text}`}>
                                {link.type}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{link.name}</span>
                              <button
                                onClick={() => handleRemoveRelationship(index)}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No relationships added yet</p>
                      <p className="text-xs mt-1">Start typing to search for world elements</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Relationship Groups by Type */}
              {form.links && form.links.length > 0 && (
                <Card className="rounded-xl border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-base">Grouped by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['character', 'location', 'faction', 'item', 'system', 'language', 'religion'].map(type => {
                        const linksOfType = form.links?.filter(link => link.type === type) || []
                        if (linksOfType.length === 0) return null
                        
                        const colors = getEntityTypeColor(type)
                        return (
                          <div key={type} className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                            <h4 className={`text-sm font-semibold ${colors.text} uppercase mb-2`}>
                              {type}s ({linksOfType.length})
                            </h4>
                            <div className="space-y-1">
                              {linksOfType.map((link, idx) => (
                                <div key={idx} className="text-sm text-gray-700">
                                  • {link.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Metrics Editor */}
                <div className="space-y-6">
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <BarChart className="w-4 h-4 text-emerald-600" />
                        </div>
                        Metrics & Statistics
                      </CardTitle>
                      <p className="text-xs text-gray-500">Track numerical data about this religion</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Metric Input Form */}
                      <div className="flex gap-2">
                        <Input
                          value={metricKey}
                          onChange={(e) => setMetricKey(e.target.value)}
                          placeholder="Metric name (e.g., Followers)"
                          className="flex-1 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveMetric()
                            }
                          }}
                        />
                        <Input
                          type="number"
                          value={metricValue}
                          onChange={(e) => setMetricValue(e.target.value)}
                          placeholder="Value"
                          className="w-32 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveMetric()
                            }
                          }}
                        />
                        <Button
                          onClick={handleSaveMetric}
                          disabled={!metricKey.trim()}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {editingMetricIndex !== null ? 'Update' : 'Add'}
                        </Button>
                      </div>

                      {/* Metrics List */}
                      {form.stats && form.stats.length > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Tracked Metrics</Label>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {form.stats.map((metric, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100 group hover:bg-emerald-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-emerald-900">{metric.key}</div>
                                  <div className="text-lg font-bold text-emerald-700">
                                    {metric.value.toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditMetric(index)}
                                    className="text-emerald-600 hover:text-emerald-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMetric(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No metrics added yet</p>
                          <p className="text-xs mt-1">Add key-value pairs to track statistics</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Image Gallery */}
                <div className="space-y-6">
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-rose-600" />
                        </div>
                        Image Gallery
                      </CardTitle>
                      <p className="text-xs text-gray-500">Upload and manage images</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Upload Button */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => document.getElementById('gallery-image-upload')?.click()}
                          variant="outline"
                          size="sm"
                          className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          id="gallery-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryImageUpload}
                          className="hidden"
                        />
                        {form.images && form.images.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {form.images.length} image{form.images.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Image Grid */}
                      {form.images && form.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {form.images.map((image, index) => (
                            <div
                              key={index}
                              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-rose-400 transition-all"
                            >
                              <img
                                src={image}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setLightboxImage(image)}
                              />
                              
                              {/* Overlay Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                {form.cover_image === image ? (
                                  <div className="px-2 py-1 bg-rose-600 text-white text-xs rounded font-semibold">
                                    Cover Image
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handleSetCoverImage(image)}
                                    size="sm"
                                    className="bg-white text-gray-900 hover:bg-gray-100 text-xs"
                                  >
                                    Set as Cover
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleRemoveGalleryImage(index)}
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <Trash className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">No images uploaded</p>
                          <p className="text-xs text-gray-400 mt-1">Click &quot;Upload Image&quot; to add</p>
                        </div>
                      )}

                      {/* Cover Image Preview */}
                      {form.cover_image && (
                        <div className="pt-4 border-t border-gray-200">
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Current Cover Image</Label>
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-rose-400">
                            <img
                              src={form.cover_image}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// ========== TOOLBAR COMPONENT ==========
interface ReligionsToolbarProps {
  query: string
  onQuery: (q: string) => void
  sort: string
  onSort: (s: string) => void
  filters: { type?: string[]; status?: string[]; origin_country?: string[] }
  onFilters: (f: any) => void
  view: 'grid' | 'list'
  onView: (v: 'grid' | 'list') => void
  onNew: () => void
  selectionCount?: number
  onClearFilters: () => void
  availableCountries?: string[]
}

function ReligionsToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilters,
  view,
  onView,
  onNew,
  selectionCount = 0,
  onClearFilters,
  availableCountries = []
}: ReligionsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const religionTypes = ['monotheistic', 'polytheistic', 'pantheistic', 'animistic', 'atheistic', 'philosophical', 'nature-based', 'ancestral']
  const statusOptions = ['active', 'defunct', 'underground']

  // Keyboard shortcut for search
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

  const activeFilterCount = 
    (filters.type?.length || 0) + 
    (filters.status?.length || 0) + 
    (filters.origin_country?.length || 0)

  const toggleFilter = (category: 'type' | 'status' | 'origin_country', value: string) => {
    const current = filters[category] || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilters({ ...filters, [category]: updated })
  }

  const removeFilter = (category: 'type' | 'status' | 'origin_country', value: string) => {
    const current = filters[category] || []
    const updated = current.filter(v => v !== value)
    onFilters({ ...filters, [category]: updated })
  }

  return (
    <div className="sticky top-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 z-10 pb-6 space-y-4">
      {/* Main Toolbar Row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search religions... (press '/' to focus)"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="pl-9 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={onSort}>
          <SelectTrigger className="w-[180px] bg-background border-gray-200">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="name-asc">Name A→Z</SelectItem>
            <SelectItem value="name-desc">Name Z→A</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="type">By Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`border-gray-200 ${activeFilterCount > 0 ? 'border-purple-500 bg-purple-50' : 'bg-white'}`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-purple-500 text-white rounded-full px-1.5 py-0 text-xs min-w-[1.25rem] h-5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background" align="start">
            <Command className="bg-background">
              <CommandInput placeholder="Search filters..." className="bg-background" />
              <CommandList className="bg-background">
                <CommandEmpty>No filters found.</CommandEmpty>
                
                {/* Type Filters */}
                <CommandGroup heading="Type" className="bg-background">
                  {religionTypes.map(type => {
                    const isSelected = filters.type?.includes(type)
                    return (
                      <CommandItem
                        key={type}
                        onSelect={() => toggleFilter('type', type)}
                        className="bg-background cursor-pointer"
                      >
                        <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="capitalize">{type}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>

                {/* Status Filters */}
                <CommandGroup heading="Status" className="bg-background">
                  {statusOptions.map(status => {
                    const isSelected = filters.status?.includes(status)
                    return (
                      <CommandItem
                        key={status}
                        onSelect={() => toggleFilter('status', status)}
                        className="bg-background cursor-pointer"
                      >
                        <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="capitalize">{status}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>

                {/* Origin Country Filters */}
                {availableCountries.length > 0 && (
                  <CommandGroup heading="Origin Country" className="bg-background">
                    {availableCountries.map(country => {
                      const isSelected = filters.origin_country?.includes(country)
                      return (
                        <CommandItem
                          key={country}
                          onSelect={() => toggleFilter('origin_country', country)}
                          className="bg-background cursor-pointer"
                        >
                          <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span>{country}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* View Toggle */}
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && onView(v as 'grid' | 'list')}>
          <ToggleGroupItem value="grid" aria-label="Grid view" className="bg-background">
            <Grid3x3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="bg-background">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* New Religion Button */}
        <Button
          onClick={onNew}
          title="Create new religion (Press N)"
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ml-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Religion
        </Button>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Active filters:</span>
          
          {filters.type?.map(type => (
            <Badge key={`type-${type}`} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 pr-1">
              <span className="capitalize">{type}</span>
              <button
                onClick={() => removeFilter('type', type)}
                className="ml-1 hover:bg-purple-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.status?.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 pr-1">
              <span className="capitalize">{status}</span>
              <button
                onClick={() => removeFilter('status', status)}
                className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.origin_country?.map(country => (
            <Badge key={`country-${country}`} variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 pr-1">
              {country}
              <button
                onClick={() => removeFilter('origin_country', country)}
                className="ml-1 hover:bg-emerald-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-600 hover:text-gray-900"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ReligionsPanel({ projectId, selectedElement, onReligionsChange, onClearSelection }: any) {
  const [religions, setReligions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<ReligionForm>(INITIAL_RELIGION)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState<{ type?: string[]; status?: string[]; origin_country?: string[] }>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [religionToDelete, setReligionToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hardDelete, setHardDelete] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const supabase = createSupabaseClient()

  const religionTypes = ['monotheistic', 'polytheistic', 'pantheistic', 'animistic', 'atheistic', 'philosophical', 'nature-based', 'ancestral']

  // Get available countries from existing religions
  const availableCountries = Array.from(new Set(
    religions
      .map(r => r.attributes?.origin_country)
      .filter(Boolean)
  )) as string[]

  useEffect(() => { loadReligions() }, [projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // '/' - Focus search
      if (e.key === '/' && mode === 'list') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // 'n' - Create new
      if (e.key === 'n' && mode === 'list') {
        e.preventDefault()
        handleCreateNew()
      }

      // 'Escape' - Close workspace
      if (e.key === 'Escape' && mode !== 'list') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'religions') {
      setMode('edit')
      setSelectedId(selectedElement.id)
      setForm({
        id: selectedElement.id,
        name: selectedElement.name,
        description: selectedElement.description || '',
        type: selectedElement.attributes?.type || '',
        origin_country: selectedElement.attributes?.origin_country || '',
        followers_estimate: selectedElement.attributes?.followers_estimate || 0,
        openness: selectedElement.attributes?.openness || 50,
        dogmatism: selectedElement.attributes?.dogmatism || 50,
        propagation: selectedElement.attributes?.propagation || '',
        pantheon: selectedElement.attributes?.pantheon || [],
        scriptures: selectedElement.attributes?.scriptures || [],
        practices: selectedElement.attributes?.practices || [],
        organization: selectedElement.attributes?.organization || [],
        worship_places: selectedElement.attributes?.worship_places || [],
        theology: selectedElement.attributes?.theology || '',
        values: selectedElement.attributes?.values || '',
        daily_life: selectedElement.attributes?.daily_life || '',
        history: selectedElement.attributes?.history || '',
        demographics: selectedElement.attributes?.demographics || '',
        links: selectedElement.attributes?.links || [],
        tags: selectedElement.tags || [],
        stats: selectedElement.attributes?.stats || [],
        images: selectedElement.attributes?.images || [],
        status: selectedElement.attributes?.status || 'active'
      })
    }
  }, [selectedElement])

  const loadReligions = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'religions')
        .or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setReligions(data || [])
    } finally { 
      setLoading(false) 
    }
  }

  const handleCreateNew = () => {
    setMode('create')
    setSelectedId(null)
    setForm(INITIAL_RELIGION)
  }

  const handleEdit = (religion: any) => {
    setMode('edit')
    setSelectedId(religion.id)
    setForm({
      id: religion.id,
      name: religion.name,
      description: religion.description || '',
      type: religion.attributes?.type || '',
      origin_country: religion.attributes?.origin_country || '',
      followers_estimate: religion.attributes?.followers_estimate || 0,
      openness: religion.attributes?.openness || 50,
      dogmatism: religion.attributes?.dogmatism || 50,
      propagation: religion.attributes?.propagation || '',
      pantheon: religion.attributes?.pantheon || [],
      scriptures: religion.attributes?.scriptures || [],
      practices: religion.attributes?.practices || [],
      organization: religion.attributes?.organization || [],
      worship_places: religion.attributes?.worship_places || [],
      theology: religion.attributes?.theology || '',
      values: religion.attributes?.values || '',
      daily_life: religion.attributes?.daily_life || '',
      history: religion.attributes?.history || '',
      demographics: religion.attributes?.demographics || '',
      links: religion.attributes?.links || [],
      tags: religion.tags || [],
      stats: religion.attributes?.stats || [],
      images: religion.attributes?.images || [],
      status: religion.attributes?.status || 'active'
    })
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedId(null)
    setForm(INITIAL_RELIGION)
    onClearSelection?.()
  }

  const handleSave = async () => {
    if (!form.name.trim()) return

    setSaving(true)
    try {
      const religionData = {
        project_id: projectId,
        category: 'religions',
        name: form.name,
        description: form.description,
        attributes: {
          type: form.type,
          origin_country: form.origin_country,
          followers_estimate: form.followers_estimate,
          openness: numberClamp(form.openness || 50),
          dogmatism: numberClamp(form.dogmatism || 50),
          propagation: form.propagation,
          pantheon: form.pantheon,
          scriptures: form.scriptures,
          practices: form.practices,
          organization: form.organization,
          worship_places: form.worship_places,
          theology: form.theology,
          values: form.values,
          daily_life: form.daily_life,
          history: form.history,
          demographics: form.demographics,
          links: form.links,
          stats: form.stats,
          images: form.images,
          status: form.status
        },
        tags: form.tags || []
      }

      let result: any
      if (form.id) {
        // Update existing
        const { data, error } = await supabase.from('world_elements').update({ ...religionData, updated_at: new Date().toISOString() }).eq('id', form.id).select().single()
        if (error) throw error
        result = data
        setReligions(prev => prev.map(r => r.id === form.id ? result : r))
      } else {
        // Create new - optimistic insert
        const tempId = `temp-${Date.now()}`
        const optimisticReligion = {
          ...religionData,
          id: tempId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Add optimistically
        setReligions(prev => [optimisticReligion, ...prev])
        
        // Insert to database
        const { data, error } = await supabase.from('world_elements').insert(religionData).select().single()
        if (error) throw error
        result = data
        
        // Replace temp with real data
        setReligions(prev => prev.map(r => r.id === tempId ? result : r))
        
        // Switch to edit mode with the new ID
        setMode('edit')
        setSelectedId(result.id)
        setForm({ ...form, id: result.id })
      }

      // Dispatch custom event for sidebar refresh
      window.dispatchEvent(new CustomEvent('religionCreated', {
        detail: { religion: result, projectId }
      }))

      onClearSelection?.()
      onReligionsChange?.()
    } catch (error) {
      console.error('Error saving religion:', error)
      // Rollback optimistic update on error
      if (!form.id) {
        setReligions(prev => prev.filter(r => !r.id.startsWith('temp-')))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleFormChange = (patch: Partial<ReligionForm>) => {
    setForm(prev => ({ ...prev, ...patch }))
  }

  const deleteReligion = async (religionId: string) => {
    try {
      const { error } = await supabase.from('world_elements').delete().eq('id', religionId)
      if (error) throw error
      setReligions(prev => prev.filter(r => r.id !== religionId))
      onReligionsChange?.()
    } catch (error) {
      console.error('Error deleting religion:', error)
    }
  }

  const handleDuplicate = async (religion: any) => {
    try {
      const duplicateData = {
        project_id: projectId,
        category: 'religions',
        name: `${religion.name} (Copy)`,
        description: religion.description,
        attributes: religion.attributes,
        tags: religion.tags || []
      }

      const { data, error } = await supabase.from('world_elements').insert(duplicateData).select().single()
      if (error) throw error

      setReligions(prev => [data, ...prev])
      window.dispatchEvent(new CustomEvent('religionCreated', { detail: { religion: data, projectId } }))
      onReligionsChange?.()
    } catch (error) {
      console.error('Error duplicating religion:', error)
    }
  }

  const handleDeleteClick = (religion: any, hard = false) => {
    setReligionToDelete(religion)
    setHardDelete(hard)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!religionToDelete) return

    setDeleting(true)
    try {
      if (hardDelete) {
        // Hard delete - remove from database
        const { error } = await supabase
          .from('world_elements')
          .delete()
          .eq('id', religionToDelete.id)

        if (error) throw error
      } else {
        // Soft delete - set __deleted flag
        const { error } = await supabase
          .from('world_elements')
          .update({
            attributes: {
              ...religionToDelete.attributes,
              __deleted: true,
              __deleted_at: new Date().toISOString(),
            },
          })
          .eq('id', religionToDelete.id)

        if (error) throw error
      }

      // Remove from local state
      setReligions(prev => prev.filter(r => r.id !== religionToDelete.id))
      setDeleteDialogOpen(false)
      setReligionToDelete(null)
    } catch (error) {
      console.error('Error in confirmDelete:', error)
      alert('Failed to delete religion')
    } finally {
      setDeleting(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  // Apply filters and sorting
  const filteredReligions = React.useMemo(() => {
    let result = [...religions]

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some((tag: string) => tag.toLowerCase().includes(q))
      )
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      result = result.filter(r => filters.type!.includes(r.attributes?.type))
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter(r => filters.status!.includes(r.attributes?.status))
    }

    // Origin country filter
    if (filters.origin_country && filters.origin_country.length > 0) {
      result = result.filter(r => filters.origin_country!.includes(r.attributes?.origin_country))
    }

    // Sorting
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name))
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'type') {
      result.sort((a, b) => (a.attributes?.type || '').localeCompare(b.attributes?.type || ''))
    }

    return result
  }, [religions, searchTerm, filters, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading religions...</p>
        </div>
      </div>
    )
  }

  // Edit/Create view - show inline workspace
  if (mode === 'create' || mode === 'edit') {
    const currentReligion = religions.find(r => r.id === selectedId)
    
    return (
      <ReligionWorkspace
        mode={mode}
        form={form}
        onChange={handleFormChange}
        onSave={handleSave}
        onCancel={handleCancel}
        onDuplicate={mode === 'edit' && currentReligion ? () => handleDuplicate(currentReligion) : undefined}
        onDelete={mode === 'edit' && currentReligion ? () => handleDeleteClick(currentReligion) : undefined}
        saving={saving}
      />
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Church className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Religions
            </h2>
            <p className="text-sm text-gray-500">
              {religions.length} {religions.length === 1 ? 'religion' : 'religions'} defined
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <ReligionsToolbar
          query={searchTerm}
          onQuery={setSearchTerm}
          sort={sortBy}
          onSort={setSortBy}
          filters={filters}
          onFilters={setFilters}
          view={viewMode}
          onView={setViewMode}
          onNew={handleCreateNew}
          onClearFilters={handleClearFilters}
          availableCountries={availableCountries}
        />

        {/* Content */}
        {filteredReligions.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 flex items-center justify-center shadow-xl">
                <Church className="w-16 h-16 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || filters.type?.length || filters.status?.length || filters.origin_country?.length
                ? 'No religions found'
                : 'Begin Your World\'s Belief Systems'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
              {searchTerm || filters.type?.length || filters.status?.length || filters.origin_country?.length
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Create the diverse religions, spiritual practices, and belief systems that shape your world. Each faith tells a unique story.'}
            </p>
            {!searchTerm && !filters.type?.length && !filters.status?.length && !filters.origin_country?.length && (
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Religion
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <ReligionsGrid
            religions={filteredReligions}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
          />
        ) : (
          <ReligionsTable
            religions={filteredReligions}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hardDelete ? 'Permanently Delete Religion?' : 'Delete Religion?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hardDelete ? (
                <>
                  This will <strong>permanently delete</strong> &quot;{religionToDelete?.name}&quot; from the database.
                  <br />
                  <strong className="text-red-600">This action cannot be undone.</strong>
                </>
              ) : (
                <>
                  This will move &quot;{religionToDelete?.name}&quot; to trash. You can restore it later or permanently delete it.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className={hardDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}
            >
              {deleting ? 'Deleting...' : hardDelete ? 'Delete Permanently' : 'Move to Trash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}