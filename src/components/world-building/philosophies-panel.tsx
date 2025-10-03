'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Brain, Search, Trash2, Edit3, Grid3x3, List, Eye, X, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Copy, MoreVertical, Image as ImageIcon, GripVertical, Upload, Download, FileJson, FileText, Book, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'

// ========================
// Types & Schema
// ========================
type Tenet = { 
  id: string
  title: string
  details?: string
}

type TextRef = { 
  id: string
  title: string
  author?: string
  year?: string
  summary?: string
}

type Practice = { 
  id: string
  name: string
  notes?: string
  cadence?: 'daily' | 'weekly' | 'seasonal' | 'annual'
}

type PhilosophyForm = {
  name: string
  description?: string
  system?: string
  type?: string
  field?: string
  founder?: string
  origin_place?: string
  commonality?: number
  geographic_area?: string
  adherents?: number
  propagation?: string
  role_of_people?: string
  purpose_of_life?: string
  outlook?: string
  history?: string
  ethics?: string
  morality?: string
  meaning_of_life?: string
  virtues?: string[]
  vices?: string[]
  precepts?: string
  rituals?: string
  practices?: Practice[]
  key_texts?: TextRef[]
  core_principles?: Tenet[]
  impact_on_society?: string
  impact_metrics?: {
    education?: number
    politics?: number
    art?: number
    science?: number
    social?: number
    economics?: number
  }
  similar_philosophies?: string[]
  tags?: string[]
  status?: 'active' | 'historic' | 'revival'
  images?: string[]
  links?: {
    type: 'character' | 'location' | 'faction' | 'item' | 'system' | 'language' | 'religion' | 'philosophy' | 'culture' | 'species'
    id: string
    name: string
    relationship?: string  // Description of the relationship
  }[]
}

// ========================
// Helper Functions
// ========================
function relativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffYear > 0) return `${diffYear}y ago`
  if (diffMonth > 0) return `${diffMonth}mo ago`
  if (diffWeek > 0) return `${diffWeek}w ago`
  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHour > 0) return `${diffHour}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'just now'
}

function clamp01to100(n: number | undefined): number {
  if (n === undefined || n === null || isNaN(n)) return 50
  return Math.max(0, Math.min(100, n))
}

function getStatusColor(status?: 'active' | 'historic' | 'revival'): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200'
    case 'historic': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'revival': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}

function applySearchSortFilter(
  items: any[],
  searchTerm: string,
  sortBy: 'name' | 'updated' | 'created' = 'updated'
): any[] {
  let filtered = items

  // Apply search filter
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim()
    filtered = filtered.filter(item =>
      item.name?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.attributes?.system?.toLowerCase().includes(term) ||
      item.attributes?.type?.toLowerCase().includes(term) ||
      item.attributes?.field?.toLowerCase().includes(term) ||
      item.attributes?.founder?.toLowerCase().includes(term) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(term))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '')
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  return filtered
}

// ========================
// Initial Form State
// ========================
const INITIAL_FORM: PhilosophyForm = {
  name: '',
  description: '',
  system: '',
  type: '',
  field: '',
  founder: '',
  origin_place: '',
  commonality: 50,
  geographic_area: '',
  adherents: undefined,
  propagation: '',
  role_of_people: '',
  purpose_of_life: '',
  outlook: '',
  history: '',
  ethics: '',
  morality: '',
  meaning_of_life: '',
  precepts: '',
  rituals: '',
  practices: [],
  key_texts: [],
  core_principles: [],
  impact_on_society: '',
  impact_metrics: { education: 0, politics: 0, art: 0 },
  similar_philosophies: [],
  tags: [],
  status: 'active',
  images: [],
  links: [],
  virtues: [],
  vices: []
}

// ========================
// Toolbar Component
// ========================
interface PhilosophiesToolbarProps {
  query: string
  onQuery: (value: string) => void
  sort: 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'type'
  onSort: (value: 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'type') => void
  filters: {
    systems: string[]
    types: string[]
    statuses: ('active' | 'historic' | 'revival')[]
  }
  onFilters: (filters: { systems: string[], types: string[], statuses: ('active' | 'historic' | 'revival')[] }) => void
  view: 'grid' | 'list'
  onView: (value: 'grid' | 'list') => void
  onNew: () => void
  onClearFilters: () => void
  availableSystems: string[]
  availableTypes: string[]
}

function PhilosophiesToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilters,
  view,
  onView,
  onNew,
  onClearFilters,
  availableSystems,
  availableTypes
}: PhilosophiesToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut for search: '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeFilterCount = filters.systems.length + filters.types.length + filters.statuses.length

  const toggleSystem = (system: string) => {
    const updated = filters.systems.includes(system)
      ? filters.systems.filter(s => s !== system)
      : [...filters.systems, system]
    onFilters({ ...filters, systems: updated })
  }

  const toggleType = (type: string) => {
    const updated = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFilters({ ...filters, types: updated })
  }

  const toggleStatus = (status: 'active' | 'historic' | 'revival') => {
    const updated = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    onFilters({ ...filters, statuses: updated })
  }

  const removeFilter = (category: 'system' | 'type' | 'status', value: string) => {
    if (category === 'system') {
      onFilters({ ...filters, systems: filters.systems.filter(s => s !== value) })
    } else if (category === 'type') {
      onFilters({ ...filters, types: filters.types.filter(t => t !== value) })
    } else {
      onFilters({ ...filters, statuses: filters.statuses.filter(s => s !== value) as ('active' | 'historic' | 'revival')[] })
    }
  }

  return (
    <div className="space-y-4">
      {/* Main toolbar row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search philosophies... (Press '/' to focus)"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={onSort}>
          <SelectTrigger className="w-[180px] bg-white">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="name-asc">Name A→Z</SelectItem>
            <SelectItem value="name-desc">Name Z→A</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-background relative">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 px-1.5 py-0 h-5 min-w-5 bg-indigo-500 text-white border-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-lg" align="end">
            <Command className="bg-white">
              <CommandInput placeholder="Search filters..." className="bg-white" />
              <CommandList className="bg-white">
                <CommandEmpty>No filters found.</CommandEmpty>
                
                {/* Systems */}
                {availableSystems.length > 0 && (
                  <CommandGroup heading="System" className="bg-white">
                    {availableSystems.map(system => (
                      <CommandItem
                        key={system}
                        onSelect={() => toggleSystem(system)}
                        className="bg-background cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.systems.includes(system)}
                          className="mr-2"
                        />
                        <span>{system}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Types */}
                {availableTypes.length > 0 && (
                  <CommandGroup heading="Type" className="bg-white">
                    {availableTypes.map(type => (
                      <CommandItem
                        key={type}
                        onSelect={() => toggleType(type)}
                        className="bg-background cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.types.includes(type)}
                          className="mr-2"
                        />
                        <span>{type}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Statuses */}
                <CommandGroup heading="Status" className="bg-white">
                  {(['active', 'historic', 'revival'] as const).map(status => (
                    <CommandItem
                      key={status}
                      onSelect={() => toggleStatus(status)}
                      className="bg-background cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.statuses.includes(status)}
                        className="mr-2"
                      />
                      <span className="capitalize">{status}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* View Toggle */}
        <ToggleGroup type="single" value={view} onValueChange={(val) => val && onView(val as 'grid' | 'list')} className="bg-white rounded-lg border border-gray-200 p-1">
          <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 px-3 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-600">
            <Grid3x3 className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="h-8 px-3 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-600">
            <List className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* New Philosophy Button */}
        <Button
          onClick={onNew}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Philosophy
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Active filters:</span>
          
          {filters.systems.map(system => (
            <Badge key={`system-${system}`} variant="secondary" className="gap-1 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200">
              System: {system}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-indigo-900" 
                onClick={() => removeFilter('system', system)}
              />
            </Badge>
          ))}

          {filters.types.map(type => (
            <Badge key={`type-${type}`} variant="secondary" className="gap-1 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
              Type: {type}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-purple-900" 
                onClick={() => removeFilter('type', type)}
              />
            </Badge>
          ))}

          {filters.statuses.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className={`gap-1 ${getStatusColor(status)} hover:opacity-80`}>
              <span className="capitalize">{status}</span>
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeFilter('status', status)}
              />
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

// ========================
// Grid View Component
// ========================
interface PhilosophiesGridProps {
  philosophies: any[]
  onEdit: (philosophy: any) => void
  onDuplicate: (philosophy: any) => void
  onDelete: (id: string) => Promise<void>
}

function PhilosophiesGrid({ philosophies, onEdit, onDuplicate, onDelete }: PhilosophiesGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [philosophyToDelete, setPhilosophyToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (philosophy: any) => {
    setPhilosophyToDelete(philosophy)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (philosophyToDelete) {
      setDeleting(true)
      await onDelete(philosophyToDelete.id)
      setDeleting(false)
      setDeleteDialogOpen(false)
      setPhilosophyToDelete(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {philosophies.map(philosophy => (
          <Card
            key={philosophy.id}
            onClick={() => onEdit(philosophy)}
            className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-indigo-400/50 transition-all duration-300 cursor-pointer overflow-visible before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-500/0 before:via-indigo-500/5 before:to-purple-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
          >
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-start justify-between mb-2">
                {/* Enhanced Icon with Gradient Background and Glow Effect */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                  <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <Brain className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                
                {/* Action Buttons - Always Visible */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(philosophy); }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDuplicate(philosophy); }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(philosophy); }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-1">
                {philosophy.name}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {philosophy.attributes?.type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 group-hover:border-indigo-300 transition-all duration-300">
                    {philosophy.attributes.type}
                  </span>
                )}
                {philosophy.attributes?.system && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-300 transition-all duration-300">
                    {philosophy.attributes.system}
                  </span>
                )}
                {philosophy.attributes?.status && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(philosophy.attributes.status)} group-hover:border-indigo-300 transition-all duration-300`}>
                    {philosophy.attributes.status.charAt(0).toUpperCase() + philosophy.attributes.status.slice(1)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {philosophy.description && (
                <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">{philosophy.description}</p>
              )}
              
              {/* Quick Facts */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                {philosophy.attributes?.adherents && (
                  <span className="flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:bg-indigo-500 group-hover:shadow-sm group-hover:shadow-indigo-300 transition-all duration-300"></span>
                    <span className="font-medium">{philosophy.attributes.adherents >= 1000000 
                      ? `${(philosophy.attributes.adherents / 1000000).toFixed(1)}M` 
                      : philosophy.attributes.adherents >= 1000 
                      ? `${(philosophy.attributes.adherents / 1000).toFixed(1)}K`
                      : philosophy.attributes.adherents.toLocaleString()}</span>
                  </span>
                )}
                {philosophy.attributes?.adherents && philosophy.attributes?.origin_place && (
                  <span>•</span>
                )}
                {philosophy.attributes?.origin_place && (
                  <span className="group-hover:text-indigo-600 transition-colors duration-300">{philosophy.attributes.origin_place}</span>
                )}
              </div>

              {/* Tags */}
              {philosophy.tags && philosophy.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {philosophy.tags.slice(0, 2).map((tag: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs group-hover:bg-indigo-100 transition-all duration-300">
                      {tag}
                    </span>
                  ))}
                  {philosophy.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{philosophy.tags.length - 2}</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 group-hover:text-gray-500 transition-colors duration-300">
                Updated • {relativeTime(philosophy.updated_at)}
              </div>
            </CardContent>
            
            {/* Animated Bottom Border on Hover */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center text-gray-900">
              Delete Philosophy?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              You are about to permanently delete <span className="font-semibold text-gray-900">&quot;{philosophyToDelete?.name}&quot;</span> from the database.
            </AlertDialogDescription>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                This action cannot be undone
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel 
              disabled={deleting}
              className="flex-1 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-600/30 transition-all duration-200 hover:shadow-xl hover:shadow-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ========================
// Table View Component
// ========================
interface PhilosophiesTableProps {
  philosophies: any[]
  onEdit: (philosophy: any) => void
  onDuplicate: (philosophy: any) => void
  onDelete: (id: string) => Promise<void>
}

function PhilosophiesTable({ philosophies, onEdit, onDuplicate, onDelete }: PhilosophiesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [philosophyToDelete, setPhilosophyToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (philosophy: any) => {
    setPhilosophyToDelete(philosophy)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (philosophyToDelete) {
      setDeleting(true)
      await onDelete(philosophyToDelete.id)
      setDeleting(false)
      setDeleteDialogOpen(false)
      setPhilosophyToDelete(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Name</TableHead>
              <TableHead className="font-semibold text-gray-900">System</TableHead>
              <TableHead className="font-semibold text-gray-900">Type</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">Adherents</TableHead>
              <TableHead className="font-semibold text-gray-900">Updated</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {philosophies.map(philosophy => (
              <TableRow 
                key={philosophy.id} 
                onClick={() => onEdit(philosophy)}
                className="group relative hover:bg-indigo-50/50 transition-all duration-300 cursor-pointer border-b border-gray-100 hover:border-indigo-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-indigo-500 after:via-purple-500 after:to-indigo-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-out"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Enhanced Icon with Glow Effect */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <Brain className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300">{philosophy.name}</div>
                      {philosophy.attributes?.origin_place && (
                        <div className="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors duration-300">{philosophy.attributes.origin_place}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {philosophy.attributes?.system && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-300 transition-all duration-300">
                      {philosophy.attributes.system}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {philosophy.attributes?.type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 group-hover:border-indigo-300 transition-all duration-300">
                      {philosophy.attributes.type}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {philosophy.attributes?.status && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(philosophy.attributes.status)} group-hover:border-indigo-300 transition-all duration-300`}>
                      {philosophy.attributes.status.charAt(0).toUpperCase() + philosophy.attributes.status.slice(1)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {philosophy.attributes?.adherents ? (
                    <span className="flex items-center gap-1.5 text-sm text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:bg-indigo-500 group-hover:shadow-sm group-hover:shadow-indigo-300 transition-all duration-300"></span>
                      <span className="font-medium">{philosophy.attributes.adherents.toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors duration-300">{relativeTime(philosophy.updated_at)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(philosophy); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDuplicate(philosophy); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(philosophy); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center text-gray-900">
              Delete Philosophy?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              You are about to permanently delete <span className="font-semibold text-gray-900">&quot;{philosophyToDelete?.name}&quot;</span> from the database.
            </AlertDialogDescription>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                This action cannot be undone
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3">
            <AlertDialogCancel 
              disabled={deleting}
              className="flex-1 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-600/30 transition-all duration-200 hover:shadow-xl hover:shadow-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ========================
// Philosophy Workspace (Create/Edit)
// ========================
interface PhilosophyWorkspaceProps {
  mode: 'create' | 'edit'
  form: PhilosophyForm
  onFormChange: (form: PhilosophyForm) => void
  onSave: () => void
  onCancel: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  saving: boolean
  projectId: string
  philosophyId?: string | null
  toast: { addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number }) => void, removeToast: (id: string) => void }
}

function PhilosophyWorkspace({ mode, form, onFormChange, onSave, onCancel, onDuplicate, onDelete, saving, projectId, philosophyId, toast }: PhilosophyWorkspaceProps) {
  const [tagInput, setTagInput] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isAutosaving, setIsAutosaving] = useState(false)
  const [worldElements, setWorldElements] = useState<any[]>([])
  const [loadingElements, setLoadingElements] = useState(false)
  const [relationshipSearch, setRelationshipSearch] = useState('')
  const [editingRelationship, setEditingRelationship] = useState<{ id: string, relationship: string } | null>(null)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createSupabaseClient()

  // Load world elements for relationships
  useEffect(() => {
    const loadWorldElements = async () => {
      setLoadingElements(true)
      try {
        const { data, error } = await supabase
          .from('world_elements')
          .select('id, name, category, description')
          .eq('project_id', projectId)
          .or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')
          .order('name')
        
        if (error) throw error
        setWorldElements(data || [])
      } catch (error) {
        console.error('Failed to load world elements:', error)
      } finally {
        setLoadingElements(false)
      }
    }

    loadWorldElements()
  }, [projectId, supabase])

  const updateForm = (updates: Partial<PhilosophyForm>) => {
    onFormChange({ ...form, ...updates })
    
    // Trigger autosave in edit mode
    if (mode === 'edit' && philosophyId) {
      triggerAutosave({ ...form, ...updates })
    }
  }

  const triggerAutosave = useCallback((updatedForm: PhilosophyForm) => {
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    // Set new timeout for 600ms
    autosaveTimeoutRef.current = setTimeout(async () => {
      if (!philosophyId) return
      
      setIsAutosaving(true)
      try {
        const philosophyData = {
          name: updatedForm.name,
          description: updatedForm.description || '',
          attributes: {
            system: updatedForm.system,
            type: updatedForm.type,
            field: updatedForm.field,
            founder: updatedForm.founder,
            origin_place: updatedForm.origin_place,
            commonality: updatedForm.commonality,
            geographic_area: updatedForm.geographic_area,
            adherents: updatedForm.adherents,
            propagation: updatedForm.propagation,
            role_of_people: updatedForm.role_of_people,
            purpose_of_life: updatedForm.purpose_of_life,
            outlook: updatedForm.outlook,
            history: updatedForm.history,
            ethics: updatedForm.ethics,
            morality: updatedForm.morality,
            meaning_of_life: updatedForm.meaning_of_life,
            virtues: updatedForm.virtues,
            vices: updatedForm.vices,
            precepts: updatedForm.precepts,
            rituals: updatedForm.rituals,
            practices: updatedForm.practices,
            key_texts: updatedForm.key_texts,
            core_principles: updatedForm.core_principles,
            impact_on_society: updatedForm.impact_on_society,
            impact_metrics: updatedForm.impact_metrics,
            similar_philosophies: updatedForm.similar_philosophies,
            status: updatedForm.status,
            images: updatedForm.images,
            links: updatedForm.links
          },
          tags: updatedForm.tags || [],
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('world_elements')
          .update(philosophyData)
          .eq('id', philosophyId)

        if (error) {
          console.error('Autosave error:', error)
          toast.addToast({ type: 'error', title: 'Failed to save changes' })
        } else {
          toast.addToast({ type: 'success', title: 'Saved', duration: 2000 })
        }
      } catch (error) {
        console.error('Autosave failed:', error)
        toast.addToast({ type: 'error', title: 'Failed to save changes' })
      } finally {
        setIsAutosaving(false)
      }
    }, 600)
  }, [philosophyId, supabase, toast])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tags = form.tags || []
      if (!tags.includes(tagInput.trim())) {
        updateForm({ tags: [...tags, tagInput.trim()] })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateForm({ tags: (form.tags || []).filter(t => t !== tag) })
  }

  // CREATE MODE: Simple form
  if (mode === 'create') {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create Philosophy</h1>
                  <p className="text-xs text-gray-600">Define a new school of thought for your world.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={saving}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onSave}
                  disabled={saving || !form.name.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Create Philosophy'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="space-y-8">
          {/* Section: Basics */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              Basics
            </h3>
            <p className="text-sm text-gray-500 mb-6">Core identifying information</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Name (Required) */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="name" 
                  value={form.name} 
                  onChange={(e) => updateForm({ name: e.target.value })} 
                  placeholder="e.g., Stoicism, Confucianism..." 
                  className="bg-background"
                />
              </div>

              {/* System */}
              <div>
                <Label htmlFor="system" className="text-sm font-medium text-gray-700 mb-1.5">System</Label>
                <Select value={form.system || ''} onValueChange={(v) => updateForm({ system: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select system..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="Western">Western</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Indigenous">Indigenous</SelectItem>
                    <SelectItem value="Syncretic">Syncretic</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Ancient">Ancient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1.5">Type</Label>
                <Select value={form.type || ''} onValueChange={(v) => updateForm({ type: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                    <SelectItem value="Religious">Religious</SelectItem>
                    <SelectItem value="Secular">Secular</SelectItem>
                    <SelectItem value="Spiritual">Spiritual</SelectItem>
                    <SelectItem value="Political">Political</SelectItem>
                    <SelectItem value="Ethical">Ethical</SelectItem>
                    <SelectItem value="Metaphysical">Metaphysical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field */}
              <div>
                <Label htmlFor="field" className="text-sm font-medium text-gray-700 mb-1.5">Field</Label>
                <Select value={form.field || ''} onValueChange={(v) => updateForm({ field: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="Ethics">Ethics</SelectItem>
                    <SelectItem value="Metaphysics">Metaphysics</SelectItem>
                    <SelectItem value="Epistemology">Epistemology</SelectItem>
                    <SelectItem value="Logic">Logic</SelectItem>
                    <SelectItem value="Aesthetics">Aesthetics</SelectItem>
                    <SelectItem value="Political">Political</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Existential">Existential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Founder */}
              <div>
                <Label htmlFor="founder" className="text-sm font-medium text-gray-700 mb-1.5">Founder</Label>
                <Input 
                  id="founder" 
                  value={form.founder || ''} 
                  onChange={(e) => updateForm({ founder: e.target.value })} 
                  placeholder="e.g., Zeno of Citium..." 
                  className="bg-background"
                />
              </div>

              {/* Origin Place */}
              <div>
                <Label htmlFor="origin_place" className="text-sm font-medium text-gray-700 mb-1.5">Origin Place</Label>
                <Input 
                  id="origin_place" 
                  value={form.origin_place || ''} 
                  onChange={(e) => updateForm({ origin_place: e.target.value })} 
                  placeholder="e.g., Ancient Athens..." 
                  className="bg-background"
                />
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1.5">Status</Label>
                <Select value={form.status} onValueChange={(v: any) => updateForm({ status: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="historic">Historic</SelectItem>
                    <SelectItem value="revival">Revival</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-1.5">Tags</Label>
                <div className="space-y-2">
                  <Input 
                    id="tags"
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Press Enter to add tag..." 
                    className="bg-background"
                  />
                  {form.tags && form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sliders Row */}
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100">
              {/* Commonality */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>Commonality</span>
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{form.commonality}%</span>
                </Label>
                <Slider
                  value={[form.commonality ?? 50]}
                  onValueChange={([v]) => updateForm({ commonality: v })}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">How widespread is this philosophy?</p>
              </div>

              {/* Adherents */}
              <div>
                <Label htmlFor="adherents" className="text-sm font-medium text-gray-700 mb-2">Adherents</Label>
                <Input 
                  id="adherents"
                  type="number"
                  value={form.adherents || ''} 
                  onChange={(e) => updateForm({ adherents: e.target.value ? parseInt(e.target.value) : undefined })} 
                  placeholder="Number of followers..." 
                  className="bg-background"
                />
                <p className="text-xs text-gray-500 mt-1">Estimated number of practitioners</p>
              </div>

              {/* Geographic Area */}
              <div>
                <Label htmlFor="geographic_area" className="text-sm font-medium text-gray-700 mb-2">Geographic Area</Label>
                <Input 
                  id="geographic_area"
                  value={form.geographic_area || ''} 
                  onChange={(e) => updateForm({ geographic_area: e.target.value })} 
                  placeholder="e.g., Mediterranean Basin..." 
                  className="bg-background"
                />
                <p className="text-xs text-gray-500 mt-1">Primary region of influence</p>
              </div>
            </div>

            {/* Additional Text Fields Row */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Propagation */}
              <div>
                <Label htmlFor="propagation" className="text-sm font-medium text-gray-700 mb-1.5">Propagation</Label>
                <Input 
                  id="propagation"
                  value={form.propagation || ''} 
                  onChange={(e) => updateForm({ propagation: e.target.value })} 
                  placeholder="How it spreads..." 
                  className="bg-background"
                />
              </div>

              {/* Role of People */}
              <div>
                <Label htmlFor="role_of_people" className="text-sm font-medium text-gray-700 mb-1.5">Role of People</Label>
                <Input 
                  id="role_of_people"
                  value={form.role_of_people || ''} 
                  onChange={(e) => updateForm({ role_of_people: e.target.value })} 
                  placeholder="Human agency in this philosophy..." 
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Section: Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              Overview
            </h3>
            <p className="text-sm text-gray-500 mb-6">Key tenets and worldview</p>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5">Description</Label>
                <Textarea 
                  id="description"
                  value={form.description || ''} 
                  onChange={(e) => updateForm({ description: e.target.value })} 
                  placeholder="Comprehensive overview of this philosophy..."
                  rows={4}
                  className="bg-background resize-none"
                />
              </div>

              {/* Outlook */}
              <div>
                <Label htmlFor="outlook" className="text-sm font-medium text-gray-700 mb-1.5">Outlook</Label>
                <Textarea 
                  id="outlook"
                  value={form.outlook || ''} 
                  onChange={(e) => updateForm({ outlook: e.target.value })} 
                  placeholder="Worldview and perspective on reality..."
                  rows={3}
                  className="bg-background resize-none"
                />
              </div>

              {/* Purpose of Life */}
              <div>
                <Label htmlFor="purpose_of_life" className="text-sm font-medium text-gray-700 mb-1.5">Purpose of Life</Label>
                <Input 
                  id="purpose_of_life"
                  value={form.purpose_of_life || ''} 
                  onChange={(e) => updateForm({ purpose_of_life: e.target.value })} 
                  placeholder="What this philosophy says about life's purpose..."
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  // EDIT MODE: Tabbed interface with autosave
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
      {/* Header with editable name and pills */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Editable name + pills */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Input
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                  placeholder="Philosophy name..."
                />
                {isAutosaving && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                    Saving...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {form.status && (
                  <Badge variant="outline" className={`${getStatusColor(form.status)} text-xs`}>
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Badge>
                )}
                {form.type && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    {form.type}
                  </Badge>
                )}
                {form.system && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                    {form.system}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDuplicate}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  Duplicate
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4 mr-1.5" />
                Back to List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-10 mb-6 bg-gray-100/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Overview</TabsTrigger>
            <TabsTrigger value="tenets" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Tenets & Principles</TabsTrigger>
            <TabsTrigger value="practices" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Practices & Rituals</TabsTrigger>
            <TabsTrigger value="texts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Key Texts</TabsTrigger>
            <TabsTrigger value="ethics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Ethics & Morality</TabsTrigger>
            <TabsTrigger value="meaning" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Meaning & Outlook</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">History</TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Impact on Society</TabsTrigger>
            <TabsTrigger value="relationships" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Relationships</TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Media</TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Description & Overview */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold">Description</Label>
                <p className="text-xs text-gray-500 mt-1">Provide a comprehensive overview of this philosophy</p>
              </div>
              <Textarea
                value={form.description || ''}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={5}
                className="bg-background"
                placeholder="Describe the philosophy's main ideas, purpose, and significance...\n\nExample: Stoicism teaches the development of self-control and fortitude as a means of overcoming destructive emotions."
              />
              <div className="text-xs text-gray-400 mt-2">
                {(form.description || '').length} characters
              </div>
            </div>

            {/* Classification */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold">Classification</Label>
                <p className="text-xs text-gray-500 mt-1">Categorize and classify this philosophical system</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">System <span className="text-red-500">*</span></Label>
                  <Select value={form.system || ''} onValueChange={(v) => updateForm({ system: v })}>
                    <SelectTrigger className="bg-white mt-1.5 border-gray-200">
                      <SelectValue placeholder="Select system..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Western">🏛️ Western</SelectItem>
                      <SelectItem value="Eastern">🏯 Eastern</SelectItem>
                      <SelectItem value="Indigenous">🌍 Indigenous</SelectItem>
                      <SelectItem value="Syncretic">🔄 Syncretic</SelectItem>
                      <SelectItem value="Modern">🔬 Modern</SelectItem>
                      <SelectItem value="Ancient">📜 Ancient</SelectItem>
                      <SelectItem value="Medieval">⚔️ Medieval</SelectItem>
                      <SelectItem value="Contemporary">💡 Contemporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Type</Label>
                  <Select value={form.type || ''} onValueChange={(v) => updateForm({ type: v })}>
                    <SelectTrigger className="bg-white mt-1.5 border-gray-200">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Religious">✨ Religious</SelectItem>
                      <SelectItem value="Secular">📚 Secular</SelectItem>
                      <SelectItem value="Spiritual">🧘 Spiritual</SelectItem>
                      <SelectItem value="Political">⚖️ Political</SelectItem>
                      <SelectItem value="Ethical">💚 Ethical</SelectItem>
                      <SelectItem value="Metaphysical">🌌 Metaphysical</SelectItem>
                      <SelectItem value="Epistemological">🔍 Epistemological</SelectItem>
                      <SelectItem value="Existential">🤔 Existential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Field</Label>
                  <Select value={form.field || ''} onValueChange={(v) => updateForm({ field: v })}>
                    <SelectTrigger className="bg-white mt-1.5 border-gray-200">
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Ethics">Ethics</SelectItem>
                      <SelectItem value="Metaphysics">Metaphysics</SelectItem>
                      <SelectItem value="Epistemology">Epistemology</SelectItem>
                      <SelectItem value="Logic">Logic</SelectItem>
                      <SelectItem value="Aesthetics">Aesthetics</SelectItem>
                      <SelectItem value="Political">Political Philosophy</SelectItem>
                      <SelectItem value="Natural">Natural Philosophy</SelectItem>
                      <SelectItem value="Moral">Moral Philosophy</SelectItem>
                      <SelectItem value="Existential">Existentialism</SelectItem>
                      <SelectItem value="Phenomenology">Phenomenology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => updateForm({ status: v })}>
                    <SelectTrigger className="bg-white mt-1.5 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="active">✅ Active (Currently Practiced)</SelectItem>
                      <SelectItem value="historic">📚 Historic (No Longer Practiced)</SelectItem>
                      <SelectItem value="revival">🔄 Revival (Being Revived)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Origins */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold">Origins & Founder</Label>
                <p className="text-xs text-gray-500 mt-1">Historical context and founding information</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Founder / Key Figure</Label>
                  <Input
                    value={form.founder || ''}
                    onChange={(e) => updateForm({ founder: e.target.value })}
                    className="bg-white mt-1.5 border-gray-200"
                    placeholder="e.g., Socrates, Confucius, Buddha..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Place of Origin</Label>
                  <Input
                    value={form.origin_place || ''}
                    onChange={(e) => updateForm({ origin_place: e.target.value })}
                    className="bg-white mt-1.5 border-gray-200"
                    placeholder="e.g., Athens, India, China..."
                  />
                </div>
              </div>
            </div>

            {/* Demographics & Reach */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold">Demographics & Reach</Label>
                <p className="text-xs text-gray-500 mt-1">Geographical spread and follower base</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Commonality / Prevalence</Label>
                    <Badge variant="secondary">{form.commonality || 50}%</Badge>
                  </div>
                  <Slider
                    value={[form.commonality || 50]}
                    onValueChange={(v) => updateForm({ commonality: v[0] })}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Rare</span>
                    <span>Uncommon</span>
                    <span>Common</span>
                    <span>Widespread</span>
                    <span>Universal</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Geographic Area</Label>
                  <Input
                    value={form.geographic_area || ''}
                    onChange={(e) => updateForm({ geographic_area: e.target.value })}
                    className="bg-white mt-1.5 border-gray-200"
                    placeholder="e.g., Mediterranean, East Asia, Global..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Estimated Adherents</Label>
                  <Input
                    type="number"
                    value={form.adherents || ''}
                    onChange={(e) => updateForm({ adherents: parseInt(e.target.value) || undefined })}
                    className="bg-white mt-1.5 border-gray-200"
                    placeholder="Approximate number of followers"
                  />
                  {form.adherents && form.adherents > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {form.adherents.toLocaleString()} adherents
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Propagation */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Propagation & Spread</Label>
                <p className="text-xs text-gray-500 mt-1">How this philosophy spreads and is transmitted</p>
              </div>
              <Textarea
                value={form.propagation || ''}
                onChange={(e) => updateForm({ propagation: e.target.value })}
                rows={3}
                className="bg-white border-gray-200"
                placeholder="Describe how this philosophy is taught, shared, and propagated... (e.g., oral tradition, written texts, monasteries, universities, community gatherings)"
              />
            </div>
          </TabsContent>

          {/* Tab: Tenets & Principles */}
          <TabsContent value="tenets" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Core Principles</Label>
                <div className="flex gap-2">
                  {/* Quick Templates Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Quick Template
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background">
                      <DropdownMenuItem
                        onClick={() => {
                          const newPrinciple: Tenet = {
                            id: crypto.randomUUID(),
                            title: 'Consequentialism',
                            details: 'Actions are morally right if they produce the best overall consequences. The ends justify the means, and outcomes matter more than intentions.'
                          }
                          updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                        }}
                      >
                        Consequentialism
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const newPrinciple: Tenet = {
                            id: crypto.randomUUID(),
                            title: 'Deontology',
                            details: 'Moral duty and rules define right action. Certain acts are inherently right or wrong regardless of their consequences. Follow universal moral laws.'
                          }
                          updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                        }}
                      >
                        Deontology
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const newPrinciple: Tenet = {
                            id: crypto.randomUUID(),
                            title: 'Virtue Ethics',
                            details: 'Focus on character and virtues rather than rules or consequences. Cultivate excellence of character through practical wisdom and moral habits.'
                          }
                          updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                        }}
                      >
                        Virtue Ethics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const newPrinciple: Tenet = {
                            id: crypto.randomUUID(),
                            title: 'Natural Law',
                            details: 'Moral principles are derived from nature and universal human reason. Align actions with the natural order and human flourishing.'
                          }
                          updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                        }}
                      >
                        Natural Law
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const newPrinciple: Tenet = {
                            id: crypto.randomUUID(),
                            title: 'Social Contract',
                            details: 'Moral and political obligations arise from agreements among individuals to form society. Justice is based on mutual benefit and cooperation.'
                          }
                          updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                        }}
                      >
                        Social Contract
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPrinciple: Tenet = {
                        id: crypto.randomUUID(),
                        title: '',
                        details: ''
                      }
                      updateForm({ core_principles: [newPrinciple, ...(form.core_principles || [])] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Principle
                  </Button>
                </div>
              </div>

              {/* Principles List */}
              <div className="space-y-3">
                {(!form.core_principles || form.core_principles.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No principles yet. Add one to get started.
                  </div>
                )}
                {form.core_principles?.map((principle, index) => (
                  <div
                    key={principle.id}
                    className="flex gap-3 items-start p-4 bg-background rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    {/* Drag Handle */}
                    <button
                      type="button"
                      className="mt-2 cursor-move text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => {
                        const startIndex = index
                        let currentY = e.clientY
                        let targetIndex = startIndex

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - currentY
                          const rowHeight = 80 // approximate height
                          const indexDelta = Math.round(deltaY / rowHeight)
                          targetIndex = Math.max(0, Math.min((form.core_principles?.length || 1) - 1, startIndex + indexDelta))
                        }

                        const handleMouseUp = () => {
                          if (targetIndex !== startIndex && form.core_principles) {
                            const newPrinciples = [...form.core_principles]
                            const [movedItem] = newPrinciples.splice(startIndex, 1)
                            newPrinciples.splice(targetIndex, 0, movedItem)
                            updateForm({ core_principles: newPrinciples })
                          }
                          document.removeEventListener('mousemove', handleMouseMove)
                          document.removeEventListener('mouseup', handleMouseUp)
                        }

                        document.addEventListener('mousemove', handleMouseMove)
                        document.addEventListener('mouseup', handleMouseUp)
                      }}
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={principle.title}
                        onChange={(e) => {
                          const updated = [...(form.core_principles || [])]
                          updated[index] = { ...updated[index], title: e.target.value }
                          updateForm({ core_principles: updated })
                        }}
                        placeholder="Principle title..."
                        className="font-medium bg-white"
                      />
                      <Textarea
                        value={principle.details || ''}
                        onChange={(e) => {
                          const updated = [...(form.core_principles || [])]
                          updated[index] = { ...updated[index], details: e.target.value }
                          updateForm({ core_principles: updated })
                        }}
                        placeholder="Details and explanation..."
                        rows={2}
                        className="bg-white text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => {
                          const duplicated: Tenet = {
                            ...principle,
                            id: crypto.randomUUID(),
                            title: `${principle.title} (Copy)`
                          }
                          const updated = [...(form.core_principles || [])]
                          updated.splice(index + 1, 0, duplicated)
                          updateForm({ core_principles: updated })
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => {
                          const updated = form.core_principles?.filter((_, i) => i !== index)
                          updateForm({ core_principles: updated })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legacy precepts textarea for backward compatibility */}
              {form.precepts && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Label className="text-sm text-gray-600">Legacy Precepts (Migrated)</Label>
                  <Textarea
                    value={form.precepts || ''}
                    onChange={(e) => updateForm({ precepts: e.target.value })}
                    rows={4}
                    className="bg-background mt-1.5 text-sm"
                    placeholder="Legacy text format..."
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Practices & Rituals */}
          <TabsContent value="practices" className="space-y-6">
            {/* Structured Practices Table */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Practices</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPractice: Practice = {
                      id: crypto.randomUUID(),
                      name: '',
                      cadence: 'daily',
                      notes: ''
                    }
                    updateForm({ practices: [newPractice, ...(form.practices || [])] })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Practice
                </Button>
              </div>

              {/* Practices Table */}
              <div className="space-y-3">
                {(!form.practices || form.practices.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No practices yet. Add one to get started.
                  </div>
                )}
                {form.practices?.map((practice, index) => (
                  <div
                    key={practice.id}
                    className="flex gap-3 items-start p-4 bg-background rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    {/* Drag Handle */}
                    <button
                      type="button"
                      className="mt-2 cursor-move text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => {
                        const startIndex = index
                        let currentY = e.clientY
                        let targetIndex = startIndex

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - currentY
                          const rowHeight = 80
                          const indexDelta = Math.round(deltaY / rowHeight)
                          targetIndex = Math.max(0, Math.min((form.practices?.length || 1) - 1, startIndex + indexDelta))
                        }

                        const handleMouseUp = () => {
                          if (targetIndex !== startIndex && form.practices) {
                            const newPractices = [...form.practices]
                            const [movedItem] = newPractices.splice(startIndex, 1)
                            newPractices.splice(targetIndex, 0, movedItem)
                            updateForm({ practices: newPractices })
                          }
                          document.removeEventListener('mousemove', handleMouseMove)
                          document.removeEventListener('mouseup', handleMouseUp)
                        }

                        document.addEventListener('mousemove', handleMouseMove)
                        document.addEventListener('mouseup', handleMouseUp)
                      }}
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 grid grid-cols-[2fr,1fr,3fr] gap-3">
                      {/* Name */}
                      <div>
                        <Label className="text-xs text-gray-500">Name</Label>
                        <Input
                          value={practice.name}
                          onChange={(e) => {
                            const updated = [...(form.practices || [])]
                            updated[index] = { ...updated[index], name: e.target.value }
                            updateForm({ practices: updated })
                          }}
                          placeholder="Practice name..."
                          className="bg-white mt-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                            if (e.key === 'Escape') {
                              if (!practice.name && !practice.notes) {
                                const updated = form.practices?.filter((_, i) => i !== index)
                                updateForm({ practices: updated })
                              }
                              e.currentTarget.blur()
                            }
                          }}
                        />
                      </div>

                      {/* Cadence */}
                      <div>
                        <Label className="text-xs text-gray-500">Cadence</Label>
                        <Select
                          value={practice.cadence || 'daily'}
                          onValueChange={(value) => {
                            const updated = [...(form.practices || [])]
                            updated[index] = { ...updated[index], cadence: value as Practice['cadence'] }
                            updateForm({ practices: updated })
                          }}
                        >
                          <SelectTrigger className="bg-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="seasonal">Seasonal</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label className="text-xs text-gray-500">Notes</Label>
                        <Input
                          value={practice.notes || ''}
                          onChange={(e) => {
                            const updated = [...(form.practices || [])]
                            updated[index] = { ...updated[index], notes: e.target.value }
                            updateForm({ practices: updated })
                          }}
                          placeholder="Additional notes..."
                          className="bg-white mt-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                            if (e.key === 'Escape') {
                              e.currentTarget.blur()
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 mt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => {
                          const duplicated: Practice = {
                            ...practice,
                            id: crypto.randomUUID(),
                            name: `${practice.name} (Copy)`
                          }
                          const updated = [...(form.practices || [])]
                          updated.splice(index + 1, 0, duplicated)
                          updateForm({ practices: updated })
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => {
                          const updated = form.practices?.filter((_, i) => i !== index)
                          updateForm({ practices: updated })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Precepts Textarea */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <Label className="text-base font-semibold">Precepts</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">Core beliefs and guiding principles (freeform notes)</p>
              <Textarea
                value={form.precepts || ''}
                onChange={(e) => updateForm({ precepts: e.target.value })}
                rows={6}
                className="bg-background"
                placeholder="Fundamental precepts, doctrines, and core beliefs..."
              />
            </div>

            {/* Rituals Textarea */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <Label className="text-base font-semibold">Rituals</Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">Ceremonies, observances, and traditions (freeform notes)</p>
              <Textarea
                value={form.rituals || ''}
                onChange={(e) => updateForm({ rituals: e.target.value })}
                rows={6}
                className="bg-background"
                placeholder="Ceremonies, observances, and regular practices..."
              />
            </div>
          </TabsContent>

          {/* Tab: Key Texts */}
          <TabsContent value="texts" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Key Texts & Literature</Label>
                <div className="flex gap-2">
                  {/* Import/Export Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background">
                      <DropdownMenuItem
                        onClick={() => {
                          const data = form.key_texts || []
                          const json = JSON.stringify(data, null, 2)
                          const blob = new Blob([json], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${form.name || 'philosophy'}-texts.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <FileJson className="w-4 h-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const data = form.key_texts || []
                          const headers = ['Title', 'Author', 'Year', 'Summary']
                          const rows = data.map(t => [
                            t.title || '',
                            t.author || '',
                            t.year || '',
                            (t.summary || '').replace(/"/g, '""')
                          ])
                          const csv = [headers, ...rows].map(row => 
                            row.map(cell => `"${cell}"`).join(',')
                          ).join('\n')
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${form.name || 'philosophy'}-texts.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Import Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Upload className="w-3 h-3 mr-1" />
                        Import
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background">
                      <DropdownMenuItem
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.json'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              try {
                                const imported = JSON.parse(event.target?.result as string)
                                const newTexts = Array.isArray(imported) ? imported : [imported]
                                const withIds = newTexts.map((t: any) => ({
                                  id: crypto.randomUUID(),
                                  title: t.title || '',
                                  author: t.author || '',
                                  year: t.year || '',
                                  summary: t.summary || ''
                                }))
                                updateForm({ key_texts: [...withIds, ...(form.key_texts || [])] })
                              } catch (err) {
                                console.error('Import failed:', err)
                              }
                            }
                            reader.readAsText(file)
                          }
                          input.click()
                        }}
                      >
                        <FileJson className="w-4 h-4 mr-2" />
                        Import from JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.csv'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              try {
                                const csv = event.target?.result as string
                                const lines = csv.split('\n').filter(l => l.trim())
                                const rows = lines.slice(1).map(line => {
                                  const matches = line.match(/"([^"]*)"|,/g) || []
                                  return matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"'))
                                })
                                const newTexts = rows.map(row => ({
                                  id: crypto.randomUUID(),
                                  title: row[0] || '',
                                  author: row[1] || '',
                                  year: row[2] || '',
                                  summary: row[3] || ''
                                }))
                                updateForm({ key_texts: [...newTexts, ...(form.key_texts || [])] })
                              } catch (err) {
                                console.error('Import failed:', err)
                              }
                            }
                            reader.readAsText(file)
                          }
                          input.click()
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Import from CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add from Library (placeholder hook) */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Hook for library integration
                      console.log('Add from Library - integration point')
                      // Example: could open a modal to select from existing library items
                    }}
                  >
                    <Book className="w-3 h-3 mr-1" />
                    Add from Library
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newText: TextRef = {
                        id: crypto.randomUUID(),
                        title: '',
                        author: '',
                        year: '',
                        summary: ''
                      }
                      updateForm({ key_texts: [newText, ...(form.key_texts || [])] })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Text
                  </Button>
                </div>
              </div>

              {/* Texts Card List */}
              <div className="space-y-3">
                {(!form.key_texts || form.key_texts.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No key texts yet. Add one to get started or import from file.
                  </div>
                )}
                {form.key_texts?.map((text, index) => (
                  <div
                    key={text.id}
                    className="p-4 bg-background rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Title (Required) */}
                        <div>
                          <Label className="text-xs text-gray-500">Title *</Label>
                          <Input
                            value={text.title}
                            onChange={(e) => {
                              const updated = [...(form.key_texts || [])]
                              updated[index] = { ...updated[index], title: e.target.value }
                              updateForm({ key_texts: updated })
                            }}
                            placeholder="Text title..."
                            className="bg-white mt-1 font-medium"
                          />
                        </div>

                        {/* Author & Year */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-500">Author</Label>
                            <Input
                              value={text.author || ''}
                              onChange={(e) => {
                                const updated = [...(form.key_texts || [])]
                                updated[index] = { ...updated[index], author: e.target.value }
                                updateForm({ key_texts: updated })
                              }}
                              placeholder="Author name..."
                              className="bg-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Year</Label>
                            <Input
                              value={text.year || ''}
                              onChange={(e) => {
                                const updated = [...(form.key_texts || [])]
                                updated[index] = { ...updated[index], year: e.target.value }
                                updateForm({ key_texts: updated })
                              }}
                              placeholder="Year or period..."
                              className="bg-white mt-1"
                            />
                          </div>
                        </div>

                        {/* Summary */}
                        <div>
                          <Label className="text-xs text-gray-500">Summary</Label>
                          <Textarea
                            value={text.summary || ''}
                            onChange={(e) => {
                              const updated = [...(form.key_texts || [])]
                              updated[index] = { ...updated[index], summary: e.target.value }
                              updateForm({ key_texts: updated })
                            }}
                            placeholder="Brief summary or significance..."
                            rows={2}
                            className="bg-white mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 pt-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            const duplicated: TextRef = {
                              ...text,
                              id: crypto.randomUUID(),
                              title: `${text.title} (Copy)`
                            }
                            const updated = [...(form.key_texts || [])]
                            updated.splice(index + 1, 0, duplicated)
                            updateForm({ key_texts: updated })
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          onClick={() => {
                            const updated = form.key_texts?.filter((_, i) => i !== index)
                            updateForm({ key_texts: updated })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Ethics & Morality */}
          <TabsContent value="ethics" className="space-y-6">
            {/* Ethical Framework */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Ethical Framework</Label>
                <p className="text-xs text-gray-500 mt-1">Core ethical principles and moral philosophy</p>
              </div>
              <Textarea
                value={form.ethics || ''}
                onChange={(e) => updateForm({ ethics: e.target.value })}
                rows={5}
                className="bg-white border-gray-200"
                placeholder="Describe the ethical principles, moral reasoning, and decision-making framework...\n\nExample: Right and wrong are determined by consequences, with actions judged by their outcomes rather than intentions."
              />
            </div>

            {/* Morality */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Moral Philosophy</Label>
                <p className="text-xs text-gray-500 mt-1">The nature and foundation of morality</p>
              </div>
              <Textarea
                value={form.morality || ''}
                onChange={(e) => updateForm({ morality: e.target.value })}
                rows={4}
                className="bg-white border-gray-200"
                placeholder="What is the basis of morality in this philosophy? Is it absolute or relative? Divine command, reason, emotion, or social contract?\n\nExample: Morality is grounded in reason and natural law, accessible to all rational beings."
              />
            </div>

            {/* Virtues */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Virtues</Label>
                <p className="text-xs text-gray-500 mt-1">Encouraged qualities and positive attributes</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Compassion', 'Courage', 'Wisdom', 'Justice', 'Temperance', 'Humility', 'Honesty', 'Generosity', 'Patience', 'Fortitude', 'Prudence', 'Loyalty', 'Diligence', 'Charity', 'Kindness', 'Gratitude', 'Self-Control', 'Discipline', 'Faith', 'Hope', 'Love', 'Mindfulness', 'Detachment', 'Resilience'].map(virtue => (
                  <Badge
                    key={virtue}
                    variant={form.virtues?.includes(virtue) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      form.virtues?.includes(virtue) 
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm' 
                        : 'hover:bg-green-50 hover:border-green-300'
                    }`}
                    onClick={() => {
                      const current = form.virtues || []
                      const updated = current.includes(virtue)
                        ? current.filter(v => v !== virtue)
                        : [...current, virtue]
                      updateForm({ virtues: updated })
                    }}
                  >
                    {virtue}
                  </Badge>
                ))}
              </div>
              {form.virtues && form.virtues.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-900 mb-1">Selected Virtues ({form.virtues.length}):</div>
                  <div className="text-sm text-green-800">{form.virtues.join(' • ')}</div>
                </div>
              )}
            </div>

            {/* Vices */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Vices</Label>
                <p className="text-xs text-gray-500 mt-1">Discouraged qualities and negative attributes to avoid</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Greed', 'Pride', 'Envy', 'Wrath', 'Sloth', 'Gluttony', 'Lust', 'Deception', 'Cruelty', 'Cowardice', 'Arrogance', 'Selfishness', 'Vanity', 'Ignorance', 'Indifference', 'Betrayal', 'Hatred', 'Prejudice', 'Impatience', 'Recklessness', 'Wastefulness', 'Dishonesty'].map(vice => (
                  <Badge
                    key={vice}
                    variant={form.vices?.includes(vice) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      form.vices?.includes(vice) 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm' 
                        : 'hover:bg-red-50 hover:border-red-300'
                    }`}
                    onClick={() => {
                      const current = form.vices || []
                      const updated = current.includes(vice)
                        ? current.filter(v => v !== vice)
                        : [...current, vice]
                      updateForm({ vices: updated })
                    }}
                  >
                    {vice}
                  </Badge>
                ))}
              </div>
              {form.vices && form.vices.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs font-medium text-red-900 mb-1">Selected Vices ({form.vices.length}):</div>
                  <div className="text-sm text-red-800">{form.vices.join(' • ')}</div>
                </div>
              )}
            </div>

            {/* Precepts & Rules */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Precepts & Rules</Label>
                <p className="text-xs text-gray-500 mt-1">Specific commandments, rules, or guidelines to follow</p>
              </div>
              <Textarea
                value={form.precepts || ''}
                onChange={(e) => updateForm({ precepts: e.target.value })}
                rows={6}
                className="bg-white border-gray-200"
                placeholder="List key precepts, commandments, or rules...&#10;&#10;Example:&#10;• Do not harm living beings&#10;• Speak truthfully&#10;• Practice compassion toward all&#10;• Cultivate wisdom through study and reflection&#10;• Maintain equanimity in all circumstances"
              />
            </div>
          </TabsContent>

          {/* Tab: Meaning & Outlook */}
          <TabsContent value="meaning" className="space-y-6">
            {/* Role of People */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Role of People</Label>
                <p className="text-xs text-gray-500 mt-1">Humanity's place and purpose in the cosmos</p>
              </div>
              <Textarea
                value={form.role_of_people || ''}
                onChange={(e) => updateForm({ role_of_people: e.target.value })}
                rows={4}
                className="bg-white border-gray-200"
                placeholder="What is humanity's role? Are humans masters, stewards, observers, or something else?&#10;&#10;Example: Humans are rational beings with the capacity to understand and align with the natural order."
              />
            </div>

            {/* Purpose of Life */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Purpose of Life</Label>
                <p className="text-xs text-gray-500 mt-1">The fundamental purpose or goal of human existence</p>
              </div>
              <Textarea
                value={form.purpose_of_life || ''}
                onChange={(e) => updateForm({ purpose_of_life: e.target.value })}
                rows={4}
                className="bg-white border-gray-200"
                placeholder="What should humans strive for? Enlightenment, happiness, virtue, knowledge, service?&#10;&#10;Example: To live in accordance with reason and nature, achieving inner peace and freedom from destructive passions."
              />
            </div>

            {/* Meaning of Life */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Meaning of Life</Label>
                <p className="text-xs text-gray-500 mt-1">What gives life meaning, value, and significance</p>
              </div>
              <Textarea
                value={form.meaning_of_life || ''}
                onChange={(e) => updateForm({ meaning_of_life: e.target.value })}
                rows={5}
                className="bg-white border-gray-200"
                placeholder="Where does meaning come from? Relationships, achievements, spiritual growth, service to others?&#10;&#10;Example: Life's meaning emerges from living virtuously, cultivating wisdom, and contributing to the greater good."
              />
            </div>

            {/* Philosophical Outlook */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Philosophical Outlook</Label>
                <p className="text-xs text-gray-500 mt-1">Overall worldview and stance on existence, reality, and the human condition</p>
              </div>
              <Textarea
                value={form.outlook || ''}
                onChange={(e) => updateForm({ outlook: e.target.value })}
                rows={5}
                className="bg-white border-gray-200"
                placeholder="Optimistic or pessimistic? Materialist or idealist? Determinist or free will? Theistic or atheistic?&#10;&#10;Example: A rational, naturalistic worldview emphasizing human agency within a deterministic universe governed by natural law."
              />
            </div>
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="space-y-6">
            {/* Historical Development */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Historical Development</Label>
                <p className="text-xs text-gray-500 mt-1">Chronicle the evolution, key periods, and historical trajectory</p>
              </div>
              <Textarea
                value={form.history || ''}
                onChange={(e) => updateForm({ history: e.target.value })}
                rows={12}
                className="bg-white border-gray-200 font-mono text-sm leading-relaxed"
                placeholder="Describe the historical origins, key periods, and evolution...&#10;&#10;Example Structure:&#10;&#10;FOUNDING ERA (Date)&#10;• Context and circumstances&#10;• Key founding figures&#10;• Original formulation&#10;&#10;EARLY DEVELOPMENT (Date Range)&#10;• Major schools or branches&#10;• Influential thinkers&#10;• Geographic spread&#10;&#10;CLASSICAL PERIOD (Date Range)&#10;• Peak influence&#10;• Major works produced&#10;• Integration with culture&#10;&#10;MODERN EVOLUTION (Date Range)&#10;• Contemporary interpretations&#10;• Revival movements&#10;• Current status"
              />
              <div className="text-xs text-gray-400 mt-2">
                {(form.history || '').length} characters • Use clear section headers for different historical periods
              </div>
            </div>

            {/* Similar Philosophies */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Related & Similar Philosophies</Label>
                <p className="text-xs text-gray-500 mt-1">Other philosophies with similar ideas, influences, or reactions</p>
              </div>
              <div className="mb-3">
                <Input
                  placeholder="Add a related philosophy (press Enter)..."
                  className="bg-white border-gray-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const value = e.currentTarget.value.trim()
                      if (!form.similar_philosophies?.includes(value)) {
                        updateForm({ 
                          similar_philosophies: [...(form.similar_philosophies || []), value] 
                        })
                      }
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {form.similar_philosophies?.map((phil, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 flex items-center gap-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    <span>{phil}</span>
                    <button
                      onClick={() => {
                        const updated = form.similar_philosophies?.filter((_, i) => i !== index)
                        updateForm({ similar_philosophies: updated })
                      }}
                      className="hover:bg-indigo-200 rounded p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {(!form.similar_philosophies || form.similar_philosophies.length === 0) && (
                <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  No related philosophies added yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Impact on Society */}
          <TabsContent value="impact" className="space-y-6">
            {/* Societal Impact - Long Form */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-3">
                <Label className="text-base font-semibold">Societal Impact & Influence</Label>
                <p className="text-xs text-gray-500 mt-1">Describe how this philosophy has shaped society, culture, and institutions</p>
              </div>
              <Textarea
                value={form.impact_on_society || ''}
                onChange={(e) => updateForm({ impact_on_society: e.target.value })}
                rows={8}
                className="bg-white border-gray-200 font-mono text-sm leading-relaxed"
                placeholder="Describe the philosophy's broader impact...&#10;&#10;Example:&#10;• Social movements or reforms inspired&#10;• Cultural shifts or transformations&#10;• Legal or institutional changes&#10;• Intellectual discourse shaped&#10;• Popular culture representation&#10;• Resistance or opposition faced"
              />
              <div className="text-xs text-gray-400 mt-2">
                {(form.impact_on_society || '').length} characters
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="mb-4">
                <Label className="text-base font-semibold">Domain Influence</Label>
                <p className="text-xs text-gray-500 mt-1">Rate the philosophy's influence across different societal domains (0 = None, 10 = Transformative)</p>
              </div>
              
              <div className="space-y-6">
                {/* Education Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">📚 Education & Academia</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.education ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.education ?? 0) === value
                              ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                education: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on educational systems, curriculum, academic discourse, and scholarly traditions</p>
                </div>

                {/* Politics Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">⚖️ Politics & Governance</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.politics ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.politics ?? 0) === value
                              ? 'bg-purple-500 text-white hover:bg-purple-600 border-purple-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                politics: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on political systems, policy-making, governance structures, and civic movements</p>
                </div>

                {/* Art Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">🎨 Art & Culture</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.art ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.art ?? 0) === value
                              ? 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                art: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on artistic movements, literature, music, visual arts, and cultural expression</p>
                </div>

                {/* Science Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">🔬 Science & Technology</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.science ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.science ?? 0) === value
                              ? 'bg-green-500 text-white hover:bg-green-600 border-green-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                science: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on scientific methods, technological development, and approach to knowledge</p>
                </div>

                {/* Social Structure Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">👥 Social Structure</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.social ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.social ?? 0) === value
                              ? 'bg-rose-500 text-white hover:bg-rose-600 border-rose-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                social: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on family structures, social hierarchies, community organization, and interpersonal relations</p>
                </div>

                {/* Economics Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">💰 Economics & Commerce</Label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Badge
                          key={value}
                          variant={(form.impact_metrics?.economics ?? 0) === value ? 'default' : 'outline'}
                          className={`cursor-pointer w-7 h-7 flex items-center justify-center transition-colors text-xs font-semibold ${
                            (form.impact_metrics?.economics ?? 0) === value
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500'
                              : 'hover:bg-gray-100 border-gray-200'
                          }`}
                          onClick={() => {
                            updateForm({ 
                              impact_metrics: { 
                                ...(form.impact_metrics || {}), 
                                economics: value 
                              } 
                            })
                          }}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Influence on economic systems, trade practices, attitudes toward wealth, and commercial ethics</p>
                </div>
              </div>
            </div>

            {/* Spread Metrics (existing) */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <Label className="text-base font-semibold mb-4 block">Spread & Adoption</Label>
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center justify-between text-sm">
                    <span>Commonality</span>
                    <span className="text-xs font-mono text-indigo-600">{form.commonality ?? 50}%</span>
                  </Label>
                  <Slider
                    value={[form.commonality ?? 50]}
                    onValueChange={([v]) => updateForm({ commonality: v })}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-3"
                  />
                </div>
                <div>
                  <Label>Adherents</Label>
                  <Input
                    type="number"
                    value={form.adherents || ''}
                    onChange={(e) => updateForm({ adherents: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="bg-background mt-1.5"
                    placeholder="Number of followers..."
                  />
                </div>
                <div>
                  <Label>Geographic Area</Label>
                  <Input
                    value={form.geographic_area || ''}
                    onChange={(e) => updateForm({ geographic_area: e.target.value })}
                    className="bg-background mt-1.5"
                    placeholder="Primary region..."
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Relationships */}
          <TabsContent value="relationships" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-semibold">Linked Elements</Label>
                  <p className="text-xs text-gray-500 mt-1">Connect to related characters, locations, cultures, and other world elements</p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Link
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-white w-96 p-0" align="end">
                    <Command className="bg-white">
                      <CommandInput 
                        placeholder="Search elements..." 
                        className="h-9"
                        value={relationshipSearch}
                        onValueChange={setRelationshipSearch}
                      />
                      <CommandList className="bg-white max-h-80">
                        <CommandEmpty>
                          {loadingElements ? 'Loading...' : 'No elements found.'}
                        </CommandEmpty>
                        
                        {/* Group elements by category */}
                        {['characters', 'locations', 'factions', 'cultures', 'species', 'religions', 'languages', 'systems', 'items', 'philosophies'].map(category => {
                          const categoryElements = worldElements.filter(el => 
                            el.category === category && 
                            el.id !== philosophyId && // Don't link to self
                            !form.links?.some(l => l.id === el.id) // Don't show already linked
                          )
                          
                          if (categoryElements.length === 0) return null
                          
                          return (
                            <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                              {categoryElements.map(element => (
                                <CommandItem
                                  key={element.id}
                                  onSelect={() => {
                                    const newLink = {
                                      type: category.slice(0, -1) as any, // Remove 's' from category
                                      id: element.id,
                                      name: element.name,
                                      relationship: '' // Will be edited after adding
                                    }
                                    updateForm({ links: [...(form.links || []), newLink] })
                                    setEditingRelationship({ id: element.id, relationship: '' })
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{element.name}</div>
                                    {element.description && (
                                      <div className="text-xs text-gray-500 line-clamp-1">{element.description}</div>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Linked Elements Display */}
              <div className="space-y-4">
                {(!form.links || form.links.length === 0) && (
                  <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-gray-300 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-500">No linked elements yet</p>
                    <p className="text-xs mt-1">Add connections to other world elements to build relationships</p>
                  </div>
                )}
                
                {/* Group by type */}
                {['character', 'location', 'faction', 'culture', 'species', 'item', 'system', 'language', 'religion', 'philosophy'].map(linkType => {
                  const linksOfType = form.links?.filter(l => l.type === linkType) || []
                  if (linksOfType.length === 0) return null
                  
                  const typeConfig: Record<string, { bg: string, text: string, border: string, icon: string }> = {
                    character: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '👤' },
                    location: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '📍' },
                    faction: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '⚔️' },
                    culture: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🏛️' },
                    species: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: '🧬' },
                    item: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '📦' },
                    system: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: '⚙️' },
                    language: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: '💬' },
                    religion: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '✨' },
                    philosophy: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🧠' }
                  }
                  const config = typeConfig[linkType]
                  
                  return (
                    <div key={linkType} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <Label className="text-sm font-semibold text-gray-700 capitalize">{linkType}s</Label>
                        <Badge variant="secondary" className="text-xs">{linksOfType.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {linksOfType.map((link) => (
                          <div
                            key={link.id}
                            className={`${config.bg} ${config.border} border rounded-lg p-3 flex items-start gap-3 group hover:shadow-sm transition-shadow`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${config.text}`}>{link.name}</span>
                              </div>
                              
                              {/* Relationship description */}
                              {editingRelationship?.id === link.id ? (
                                <div className="mt-2">
                                  <Input
                                    placeholder="Describe the relationship..."
                                    value={editingRelationship.relationship}
                                    onChange={(e) => setEditingRelationship({ ...editingRelationship, relationship: e.target.value })}
                                    className="text-sm h-8"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const updated = form.links?.map(l => 
                                          l.id === link.id ? { ...l, relationship: editingRelationship.relationship } : l
                                        )
                                        updateForm({ links: updated })
                                        setEditingRelationship(null)
                                      } else if (e.key === 'Escape') {
                                        setEditingRelationship(null)
                                      }
                                    }}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const updated = form.links?.map(l => 
                                          l.id === link.id ? { ...l, relationship: editingRelationship.relationship } : l
                                        )
                                        updateForm({ links: updated })
                                        setEditingRelationship(null)
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingRelationship(null)}
                                      className="h-7 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                                  onClick={() => setEditingRelationship({ id: link.id, relationship: link.relationship || '' })}
                                >
                                  {link.relationship || (
                                    <span className="text-gray-400 italic">Click to describe relationship...</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingRelationship({ id: link.id, relationship: link.relationship || '' })}
                                className="h-7 w-7 p-0"
                                title="Edit relationship"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const updated = form.links?.filter(l => l.id !== link.id)
                                  updateForm({ links: updated })
                                  if (editingRelationship?.id === link.id) {
                                    setEditingRelationship(null)
                                  }
                                }}
                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                title="Remove link"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Media */}
          <TabsContent value="media" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-semibold">Image Gallery</Label>
                  <p className="text-xs text-gray-500 mt-1">Manage visual representations and associated media</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
                      input.multiple = true
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (!files || files.length === 0) return
                        
                        toast.addToast({ type: 'info', title: 'Uploading images...', duration: 2000 })
                        const uploadedUrls: string[] = []
                        
                        for (const file of Array.from(files)) {
                          // Validate file size (5MB limit)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.addToast({ type: 'error', title: `${file.name} is too large (max 5MB)` })
                            continue
                          }

                          // Validate file type
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                          if (!allowedTypes.includes(file.type)) {
                            toast.addToast({ type: 'error', title: `${file.name} is not a supported image type` })
                            continue
                          }

                          try {
                            // Generate unique filename to avoid collisions
                            const fileExt = file.name.split('.').pop()
                            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                            const filePath = `${projectId}/${philosophyId || 'temp'}/${fileName}`

                            // Upload to Supabase Storage
                            const { data, error } = await supabase.storage
                              .from('philosophy-images')
                              .upload(filePath, file, {
                                cacheControl: '3600',
                                upsert: false
                              })

                            if (error) throw error

                            // Get public URL
                            const { data: urlData } = supabase.storage
                              .from('philosophy-images')
                              .getPublicUrl(filePath)

                            uploadedUrls.push(urlData.publicUrl)
                          } catch (error) {
                            console.error('Error uploading image:', error)
                            toast.addToast({ type: 'error', title: `Failed to upload ${file.name}` })
                          }
                        }

                        // Update form with new image URLs
                        if (uploadedUrls.length > 0) {
                          updateForm({ images: [...(form.images || []), ...uploadedUrls] })
                          toast.addToast({ type: 'success', title: `${uploadedUrls.length} image(s) uploaded successfully` })
                        }
                      }
                      input.click()
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Placeholder: Open library modal to select existing images
                      const mockUrl = 'https://placeholder.com/library-image.jpg'
                      if (!form.images?.includes(mockUrl)) {
                        updateForm({ images: [...(form.images || []), mockUrl] })
                      }
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Select from Library
                  </Button>
                </div>
              </div>

              {/* Image Grid */}
              <div className="space-y-4">
                {(!form.images || form.images.length === 0) && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No images yet. Upload or select from library.</p>
                  </div>
                )}
                
                {form.images && form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {form.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      >
                        {/* Image Preview */}
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <img 
                            src={imageUrl} 
                            alt={`Philosophy image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                const fallback = document.createElement('div')
                                fallback.className = 'w-full h-full flex items-center justify-center'
                                fallback.innerHTML = `
                                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                `
                                parent.appendChild(fallback)
                              }
                            }}
                          />
                        </div>

                        {/* Cover Badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-indigo-500 text-white text-xs">Cover</Badge>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 p-4">
                          {/* Set as Cover Button (if not already cover) */}
                          {index !== 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 text-xs font-medium bg-white hover:bg-gray-100 text-gray-900 shadow-md w-full"
                              onClick={() => {
                                const updated = [...(form.images || [])]
                                const [moved] = updated.splice(index, 1)
                                updated.unshift(moved)
                                updateForm({ images: updated })
                              }}
                            >
                              <Star className="w-3 h-3 mr-1.5" />
                              Set as Cover
                            </Button>
                          )}
                          
                          {/* Reorder Buttons */}
                          <div className="flex gap-2 w-full">
                            {index > 0 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1 h-9 bg-white/90 hover:bg-white text-gray-900 shadow-md"
                                onClick={() => {
                                  const updated = [...(form.images || [])]
                                  const [moved] = updated.splice(index, 1)
                                  updated.splice(index - 1, 0, moved)
                                  updateForm({ images: updated })
                                }}
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                            )}
                            {index < (form.images?.length || 0) - 1 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1 h-9 bg-white/90 hover:bg-white text-gray-900 shadow-md"
                                onClick={() => {
                                  const updated = [...(form.images || [])]
                                  const [moved] = updated.splice(index, 1)
                                  updated.splice(index + 1, 0, moved)
                                  updateForm({ images: updated })
                                }}
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-9 text-xs font-medium bg-red-500 hover:bg-red-600 text-white shadow-md w-full"
                            onClick={async () => {
                              if (!confirm('Delete this image?')) return
                              
                              const imageUrl = form.images?.[index]
                              if (!imageUrl) return

                              try {
                                // Extract path from public URL
                                // URL format: https://{project}.supabase.co/storage/v1/object/public/philosophy-images/{path}
                                const urlParts = imageUrl.split('/philosophy-images/')
                                if (urlParts.length === 2) {
                                  const filePath = urlParts[1]
                                  
                                  // Delete from storage
                                  const { error } = await supabase.storage
                                    .from('philosophy-images')
                                    .remove([filePath])

                                  if (error) {
                                    console.error('Error deleting from storage:', error)
                                    toast.addToast({ type: 'error', title: 'Failed to delete from storage' })
                                    // Continue anyway to remove from UI
                                  } else {
                                    toast.addToast({ type: 'success', title: 'Image deleted', duration: 2000 })
                                  }
                                }

                                // Remove from form
                                const updated = form.images?.filter((_, i) => i !== index)
                                updateForm({ images: updated })
                              } catch (error) {
                                console.error('Error deleting image:', error)
                                toast.addToast({ type: 'error', title: 'Failed to delete image' })
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function PhilosophiesPanel({ projectId, selectedElement, onPhilosophiesChange, onClearSelection }: any) {
  const [philosophies, setPhilosophies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PhilosophyForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'type'>('newest')
  const [filters, setFilters] = useState<{
    systems: string[]
    types: string[]
    statuses: ('active' | 'historic' | 'revival')[]
  }>({
    systems: [],
    types: [],
    statuses: []
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null)
  const [hardDelete, setHardDelete] = useState(false)
  
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const supabase = createSupabaseClient()
  const toast = useToast()

  const philosophySchools = ['ethics', 'metaphysics', 'epistemology', 'logic', 'aesthetics', 'political', 'natural', 'moral', 'existential', 'mystical']

  // Extract unique systems and types from existing philosophies
  const availableSystems = React.useMemo(() => {
    const systems = new Set<string>()
    philosophies.forEach(p => {
      if (p.attributes?.system) systems.add(p.attributes.system)
    })
    return Array.from(systems).sort()
  }, [philosophies])

  const availableTypes = React.useMemo(() => {
    const types = new Set<string>()
    philosophies.forEach(p => {
      if (p.attributes?.type) types.add(p.attributes.type)
    })
    return Array.from(types).sort()
  }, [philosophies])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts in list mode
      if (mode !== 'list') return
      
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // '/' to focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // 'n' to create new philosophy
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleCreateNew()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  useEffect(() => { loadPhilosophies() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'philosophies') {
      setSelectedId(selectedElement.id)
      const attrs = selectedElement.attributes || {}
      setForm({ 
        name: selectedElement.name,
        description: selectedElement.description || '',
        system: attrs.system || '',
        type: attrs.type || '',
        field: attrs.field || '',
        founder: attrs.founder || '',
        origin_place: attrs.origin_place || '',
        commonality: attrs.commonality ?? 50,
        geographic_area: attrs.geographic_area || '',
        adherents: attrs.adherents,
        propagation: attrs.propagation || '',
        role_of_people: attrs.role_of_people || '',
        purpose_of_life: attrs.purpose_of_life || '',
        outlook: attrs.outlook || '',
        history: attrs.history || '',
        ethics: attrs.ethics || '',
        morality: attrs.morality || '',
        meaning_of_life: attrs.meaning_of_life || '',
        virtues: attrs.virtues || [],
        vices: attrs.vices || [],
        precepts: attrs.precepts || '',
        rituals: attrs.rituals || '',
        practices: attrs.practices || [],
        key_texts: attrs.key_texts || [],
        core_principles: attrs.core_principles || [],
        impact_on_society: attrs.impact_on_society || '',
        impact_metrics: attrs.impact_metrics || { education: 0, politics: 0, art: 0 },
        similar_philosophies: attrs.similar_philosophies || [],
        tags: selectedElement.tags || [],
        status: attrs.status || 'active',
        images: attrs.images || [],
        links: attrs.links || []
      })
      setMode('edit')
    }
  }, [selectedElement])

  const loadPhilosophies = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'philosophies')
        .or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')
        .order('updated_at', { ascending: false })
      if (error) throw error
      setPhilosophies(data || [])
    } catch (err) {
      console.error('Failed to load philosophies:', err)
    } finally { 
      setLoading(false) 
    }
  }

  const handleCreateNew = () => {
    setForm(INITIAL_FORM)
    setSelectedId(null)
    setMode('create')
    onClearSelection?.()
  }

  const handleEdit = (philosophy: any) => {
    setSelectedId(philosophy.id)
    const attrs = philosophy.attributes || {}
    setForm({ 
      name: philosophy.name,
      description: philosophy.description || '',
      system: attrs.system || '',
      type: attrs.type || '',
      field: attrs.field || '',
      founder: attrs.founder || '',
      origin_place: attrs.origin_place || '',
      commonality: attrs.commonality ?? 50,
      geographic_area: attrs.geographic_area || '',
      adherents: attrs.adherents,
      propagation: attrs.propagation || '',
      role_of_people: attrs.role_of_people || '',
      purpose_of_life: attrs.purpose_of_life || '',
      outlook: attrs.outlook || '',
      history: attrs.history || '',
      ethics: attrs.ethics || '',
      morality: attrs.morality || '',
      meaning_of_life: attrs.meaning_of_life || '',
      virtues: attrs.virtues || [],
      vices: attrs.vices || [],
      precepts: attrs.precepts || '',
      rituals: attrs.rituals || '',
      practices: attrs.practices || [],
      key_texts: attrs.key_texts || [],
      core_principles: attrs.core_principles || [],
      impact_on_society: attrs.impact_on_society || '',
      impact_metrics: attrs.impact_metrics || { education: 0, politics: 0, art: 0 },
      similar_philosophies: attrs.similar_philosophies || [],
      tags: philosophy.tags || [],
      status: attrs.status || 'active',
      images: attrs.images || [],
      links: attrs.links || []
    })
    setMode('edit')
  }

  const handleCancel = () => {
    setMode('list')
    setForm(INITIAL_FORM)
    setSelectedId(null)
    onClearSelection?.()
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    
    setSaving(true)
    try {
      const philosophyData = { 
        project_id: projectId, 
        category: 'philosophies', 
        name: form.name, 
        description: form.description || '', 
        attributes: { 
          system: form.system,
          type: form.type,
          field: form.field,
          founder: form.founder,
          origin_place: form.origin_place,
          commonality: form.commonality,
          geographic_area: form.geographic_area,
          adherents: form.adherents,
          propagation: form.propagation,
          role_of_people: form.role_of_people,
          purpose_of_life: form.purpose_of_life,
          outlook: form.outlook,
          history: form.history,
          ethics: form.ethics,
          morality: form.morality,
          meaning_of_life: form.meaning_of_life,
          virtues: form.virtues,
          vices: form.vices,
          precepts: form.precepts,
          rituals: form.rituals,
          practices: form.practices,
          key_texts: form.key_texts,
          core_principles: form.core_principles,
          impact_on_society: form.impact_on_society,
          impact_metrics: form.impact_metrics,
          similar_philosophies: form.similar_philosophies,
          status: form.status,
          images: form.images,
          links: form.links
        }, 
        tags: form.tags || [] 
      }
      
      let result: any
      if (mode === 'edit' && selectedId) {
        const { data, error } = await supabase.from('world_elements').update({ ...philosophyData, updated_at: new Date().toISOString() }).eq('id', selectedId).select().single()
        if (error) throw error
        result = data
        setPhilosophies(prev => prev.map(p => p.id === selectedId ? result : p))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(philosophyData).select().single()
        if (error) throw error
        result = data
        setPhilosophies(prev => [result, ...prev])
      }
      
      window.dispatchEvent(new CustomEvent('philosophyCreated', { detail: { philosophy: result, projectId } }))
      
      toast.addToast({ type: 'success', title: mode === 'create' ? 'Philosophy created' : 'Philosophy updated', duration: 2000 })
      
      // On create success, switch to edit mode with the new ID
      if (mode === 'create') {
        setSelectedId(result.id)
        setMode('edit')
      } else {
        handleCancel()
      }
      
      onPhilosophiesChange?.()
    } catch (error) {
      console.error('Error:', error)
      toast.addToast({ type: 'error', title: 'Failed to save philosophy' })
    } finally {
      setSaving(false)
    }
  }

  const deletePhilosophy = async (philosophyId: string, hard: boolean = false) => {
    try {
      if (hard) {
        // Hard delete - permanently remove from database
        const { error } = await supabase.from('world_elements').delete().eq('id', philosophyId)
        if (error) throw error
        setPhilosophies(prev => prev.filter(p => p.id !== philosophyId))
        toast.addToast({ type: 'success', title: 'Philosophy permanently deleted', duration: 2000 })
      } else {
        // Soft delete - mark as deleted in attributes
        const philosophy = philosophies.find(p => p.id === philosophyId)
        if (!philosophy) return
        
        const { error } = await supabase
          .from('world_elements')
          .update({ 
            attributes: { 
              ...(philosophy.attributes || {}), 
              __deleted: true 
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', philosophyId)
        
        if (error) throw error
        setPhilosophies(prev => prev.filter(p => p.id !== philosophyId))
        toast.addToast({ type: 'success', title: 'Philosophy deleted', duration: 2000 })
      }
      
      setMode('list')
      setSelectedId(null)
      onPhilosophiesChange?.()
    } catch (error) {
      console.error('Error deleting philosophy:', error)
      toast.addToast({ type: 'error', title: 'Failed to delete philosophy' })
    }
  }

  const confirmDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
    setHardDelete(false)
    setDeleteDialogOpen(true)
  }

  // Apply filters, search, and sorting
  const filteredAndSortedPhilosophies = React.useMemo(() => {
    let result = [...philosophies]

    // Apply search
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.attributes?.system?.toLowerCase().includes(term) ||
        p.attributes?.type?.toLowerCase().includes(term) ||
        p.attributes?.field?.toLowerCase().includes(term) ||
        p.attributes?.founder?.toLowerCase().includes(term) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      )
    }

    // Apply filters
    if (filters.systems.length > 0) {
      result = result.filter(p => filters.systems.includes(p.attributes?.system))
    }
    if (filters.types.length > 0) {
      result = result.filter(p => filters.types.includes(p.attributes?.type))
    }
    if (filters.statuses.length > 0) {
      result = result.filter(p => filters.statuses.includes(p.attributes?.status || 'active'))
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'type':
          return (a.attributes?.type || '').localeCompare(b.attributes?.type || '')
        case 'newest':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [philosophies, searchTerm, filters, sortBy])

  const handleClearFilters = () => {
    setFilters({ systems: [], types: [], statuses: [] })
  }

  const handleDuplicate = (philosophy: any) => {
    const attrs = philosophy.attributes || {}
    setForm({
      name: `${philosophy.name} (Copy)`,
      description: philosophy.description || '',
      system: attrs.system || '',
      type: attrs.type || '',
      field: attrs.field || '',
      founder: attrs.founder || '',
      origin_place: attrs.origin_place || '',
      commonality: attrs.commonality ?? 50,
      geographic_area: attrs.geographic_area || '',
      adherents: attrs.adherents,
      propagation: attrs.propagation || '',
      role_of_people: attrs.role_of_people || '',
      purpose_of_life: attrs.purpose_of_life || '',
      outlook: attrs.outlook || '',
      history: attrs.history || '',
      ethics: attrs.ethics || '',
      morality: attrs.morality || '',
      meaning_of_life: attrs.meaning_of_life || '',
      virtues: attrs.virtues ? JSON.parse(JSON.stringify(attrs.virtues)) : [],
      vices: attrs.vices ? JSON.parse(JSON.stringify(attrs.vices)) : [],
      precepts: attrs.precepts || '',
      rituals: attrs.rituals || '',
      practices: attrs.practices ? JSON.parse(JSON.stringify(attrs.practices)) : [],
      key_texts: attrs.key_texts ? JSON.parse(JSON.stringify(attrs.key_texts)) : [],
      core_principles: attrs.core_principles ? JSON.parse(JSON.stringify(attrs.core_principles)) : [],
      impact_on_society: attrs.impact_on_society || '',
      impact_metrics: attrs.impact_metrics ? JSON.parse(JSON.stringify(attrs.impact_metrics)) : { education: 0, politics: 0, art: 0 },
      similar_philosophies: attrs.similar_philosophies ? [...attrs.similar_philosophies] : [],
      tags: philosophy.tags ? [...philosophy.tags] : [],
      status: attrs.status || 'active',
      images: attrs.images ? [...attrs.images] : [],
      links: attrs.links ? JSON.parse(JSON.stringify(attrs.links)) : []
    })
    setSelectedId(null)
    setMode('create')
    toast.addToast({ type: 'success', title: 'Philosophy duplicated', duration: 2000 })
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading philosophies...</p>
      </div>
    </div>
  )

  // Edit/Create view - show workspace
  if (mode === 'create' || mode === 'edit') {
    const currentPhilosophy = philosophies.find(p => p.id === selectedId)
    return (
      <PhilosophyWorkspace
        mode={mode}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        onCancel={handleCancel}
        onDuplicate={mode === 'edit' ? () => handleDuplicate(currentPhilosophy) : undefined}
        onDelete={mode === 'edit' && selectedId && currentPhilosophy ? () => confirmDelete(selectedId, currentPhilosophy.name) : undefined}
        saving={saving}
        projectId={projectId}
        philosophyId={selectedId}
        toast={toast}
      />
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-6">
      <div className="max-w-full mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 z-10 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900">Philosophies</h2>
              <p className="text-sm text-gray-500">
                {philosophies.length} {philosophies.length === 1 ? 'philosophy' : 'philosophies'} · {filteredAndSortedPhilosophies.length} shown
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <PhilosophiesToolbar
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
            availableSystems={availableSystems}
            availableTypes={availableTypes}
          />
        </div>

        {/* Content */}
        {filteredAndSortedPhilosophies.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-100 flex items-center justify-center shadow-xl">
                <Brain className="w-16 h-16 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No philosophies found' : 'Begin Your World\'s Philosophies'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
              {searchTerm
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'Create the schools of thought, wisdom traditions, and intellectual movements that shape your world.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Philosophy
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <PhilosophiesGrid
            philosophies={filteredAndSortedPhilosophies}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={async (id) => {
              await deletePhilosophy(id, true)
            }}
          />
        ) : (
          <PhilosophiesTable
            philosophies={filteredAndSortedPhilosophies}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={async (id) => {
              await deletePhilosophy(id, true)
            }}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Philosophy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex items-center space-x-2 px-6 py-2">
            <Checkbox
              id="hard-delete"
              checked={hardDelete}
              onCheckedChange={(checked) => setHardDelete(checked === true)}
            />
            <label
              htmlFor="hard-delete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Permanently delete (cannot be undone)
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deletePhilosophy(deleteTarget.id, hardDelete)
                  setDeleteDialogOpen(false)
                  setDeleteTarget(null)
                  setHardDelete(false)
                }
              }}
              className={hardDelete ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {hardDelete ? 'Delete Permanently' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
