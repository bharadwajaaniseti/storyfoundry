'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, MessageSquare, Search, Trash2, Edit3, ArrowLeft, X, Save, Link as LinkIcon, Filter, Grid3x3, List, Copy, MoreHorizontal, BookOpen, Upload, Calendar, FileText, Hash, Clock, GripVertical, Download, MoreVertical, Check, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'

// Types
type WordEntry = {
  id: string
  term: string
  pronunciation?: string
  type?: string
  definition?: string
  notes?: string
  examples?: string[]
}

type SymbolEntry = {
  id: string
  glyph?: string
  romanization?: string
  sound?: string
  tags?: string[]
  image?: string
}

type LanguageForm = {
  name: string
  description?: string
  family?: string
  status?: 'living' | 'dead' | 'constructed' | 'ancient' | 'ceremonial'
  speakers?: string
  writing_system?: 'alphabetic' | 'logographic' | 'syllabic' | 'abjad' | 'abugida' | 'pictographic' | 'none'
  sample_text?: string
  words: WordEntry[]
  word_types: string[]
  symbols: SymbolEntry[]
  phonology?: {
    vowels?: string[]
    consonants?: string[]
    syllableStructure?: string
  }
  grammar?: {
    wordOrder?: string
    morphology?: string
    tenses?: string[]
    cases?: string[]
    plurals?: string
  }
  links?: {
    type: 'character' | 'location' | 'faction' | 'item' | 'system' | 'language'
    id: string
    name: string
  }[]
  images?: {
    id: string
    url: string
    caption?: string
    isCover?: boolean
  }[]
  tags?: string[]
}

type ViewMode = 'grid' | 'list'
type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'status'

interface FilterState {
  families: string[]
  statuses: string[]
  writingSystems: string[]
}

const INITIAL_FORM: LanguageForm = {
  name: '',
  description: '',
  family: '',
  status: 'living',
  speakers: '',
  writing_system: 'alphabetic',
  sample_text: '',
  words: [],
  word_types: ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction'],
  symbols: [],
  phonology: {
    vowels: [],
    consonants: [],
    syllableStructure: ''
  },
  grammar: {
    wordOrder: '',
    morphology: '',
    tenses: [],
    cases: [],
    plurals: ''
  },
  links: [],
  images: [],
  tags: []
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Utility: Relative time
const relativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

// Utility: Status pill color
const getStatusPillColor = (status: string) => {
  switch (status) {
    case 'living': return 'bg-green-100 text-green-800 border-green-200'
    case 'dead': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'constructed': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ancient': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'ceremonial': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Utility: Writing system pill color
const getWSysPillColor = (ws: string) => {
  switch (ws) {
    case 'alphabetic': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'logographic': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'syllabic': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'abjad': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    case 'abugida': return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'pictographic': return 'bg-pink-100 text-pink-800 border-pink-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// ============================================================================
// MAIN PANEL COMPONENT
// ============================================================================

export default function LanguagesPanel({ projectId, selectedElement, onLanguagesChange, onClearSelection }: any) {
  const [languages, setLanguages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<LanguageForm>(INITIAL_FORM)
  
  // Toolbar state
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [filters, setFilters] = useState<FilterState>({
    families: [],
    statuses: [],
    writingSystems: []
  })
  const [view, setView] = useState<ViewMode>('grid')
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  const languageStatuses = ['living', 'dead', 'constructed', 'ancient', 'ceremonial']
  const writingSystems = ['alphabetic', 'logographic', 'syllabic', 'abjad', 'abugida', 'pictographic', 'none']

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // '/' focuses search
      if (e.key === '/' && mode === 'list') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[placeholder*="Search"]')?.focus()
      }

      // 'n' starts create
      if (e.key === 'n' && mode === 'list') {
        e.preventDefault()
        setForm(INITIAL_FORM)
        setMode('create')
      }

      // Escape to go back to list
      if (e.key === 'Escape' && (mode === 'create' || mode === 'edit')) {
        if (!e.target || !(e.target as HTMLElement).closest('[role="dialog"]')) {
          setMode('list')
          setSelectedId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  useEffect(() => { loadLanguages() }, [projectId])
  
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'languages') {
      const lang = languages.find(l => l.id === selectedElement.id)
      if (lang) {
        setSelectedId(lang.id)
        loadLanguageIntoForm(lang)
        setMode('edit')
      }
    }
  }, [selectedElement, languages])

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'languages')
        .or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')
        .order('updated_at', { ascending: false })
      if (error) throw error
      setLanguages(data || [])
    } finally { setLoading(false) }
  }

  // Apply search, sort, and filter using utility function
  const applySearchSortFilter = () => {
    let filtered = [...languages]

    // Search
    if (query.trim()) {
      const search = query.toLowerCase()
      filtered = filtered.filter(lang => 
        lang.name?.toLowerCase().includes(search) ||
        lang.description?.toLowerCase().includes(search) ||
        lang.attributes?.family?.toLowerCase().includes(search)
      )
    }

    // Filters
    if (filters.families.length > 0) {
      filtered = filtered.filter(lang => 
        filters.families.includes(lang.attributes?.family || '')
      )
    }
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(lang => 
        filters.statuses.includes(lang.attributes?.status || '')
      )
    }
    if (filters.writingSystems.length > 0) {
      filtered = filtered.filter(lang => 
        filters.writingSystems.includes(lang.attributes?.writing_system || '')
      )
    }

    // Sort
    switch (sort) {
      case 'name_asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'name_desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
        break
      case 'status':
        filtered.sort((a, b) => (a.attributes?.status || '').localeCompare(b.attributes?.status || ''))
        break
    }

    return filtered
  }

  const loadLanguageIntoForm = (language: any) => {
    const attrs = language.attributes || {}
    setForm({
      name: language.name || '',
      description: language.description || '',
      family: attrs.family || '',
      status: attrs.status || 'living',
      speakers: attrs.speakers || '',
      writing_system: attrs.writing_system || 'alphabetic',
      sample_text: attrs.sample_text || '',
      words: attrs.words || [],
      word_types: attrs.word_types || ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction'],
      symbols: attrs.symbols || [],
      phonology: attrs.phonology || { vowels: [], consonants: [], syllableStructure: '' },
      grammar: attrs.grammar || { wordOrder: '', morphology: '', tenses: [], cases: [], plurals: '' },
      links: attrs.links || [],
      images: attrs.images || [],
      tags: attrs.tags || []
    })
  }

  const handleSaveLanguage = async () => {
    try {
      const languageData = {
        project_id: projectId,
        category: 'languages',
        name: form.name,
        description: form.description,
        attributes: {
          family: form.family,
          status: form.status,
          speakers: form.speakers,
          writing_system: form.writing_system,
          sample_text: form.sample_text,
          words: form.words,
          word_types: form.word_types,
          symbols: form.symbols,
          phonology: form.phonology,
          grammar: form.grammar,
          links: form.links,
          images: form.images,
          tags: form.tags
        },
        tags: form.tags || []
      }
      
      let result: any
      if (mode === 'edit' && selectedId) {
        // Update existing language
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...languageData, updated_at: new Date().toISOString() })
          .eq('id', selectedId)
          .select()
          .single()
        if (error) throw error
        result = data
        setLanguages(prev => prev.map(l => l.id === selectedId ? result : l))
        // Stay in edit mode
      } else {
        // Create new language
        const { data, error } = await supabase
          .from('world_elements')
          .insert(languageData)
          .select()
          .single()
        if (error) throw error
        result = data
        setLanguages(prev => [result, ...prev])
        
        // Transition to edit mode with the new language
        setSelectedId(result.id)
        loadLanguageIntoForm(result)
        setMode('edit')
      }
      
      window.dispatchEvent(new CustomEvent('languageCreated', { detail: { language: result, projectId } }))
      onLanguagesChange?.()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCancel = () => {
    setMode('list')
    setSelectedId(null)
    setForm(INITIAL_FORM)
    onClearSelection?.()
  }

  const handleEdit = (language: any) => {
    setSelectedId(language.id)
    loadLanguageIntoForm(language)
    setMode('edit')
  }

  const handleDelete = async (languageId: string, hardDelete = false) => {
    try {
      if (hardDelete) {
        // Hard delete - permanently remove from database
        const { error } = await supabase
          .from('world_elements')
          .delete()
          .eq('id', languageId)
        if (error) throw error
      } else {
        // Soft delete - set __deleted flag
        const language = languages.find(l => l.id === languageId)
        const { error } = await supabase
          .from('world_elements')
          .update({
            attributes: {
              ...(language?.attributes || {}),
              __deleted: true
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', languageId)
        if (error) throw error
      }
      
      setLanguages(prev => prev.filter(l => l.id !== languageId))
      setDeleteConfirm(null)
      onLanguagesChange?.()
    } catch (error) {
      console.error('Error deleting language:', error)
    }
  }

  const handleDuplicate = async (language: any) => {
    try {
      const duplicateData = {
        project_id: projectId,
        category: 'languages',
        name: `${language.name} (Copy)`,
        description: language.description,
        attributes: language.attributes,
        tags: language.tags || []
      }
      const { data, error } = await supabase
        .from('world_elements')
        .insert(duplicateData)
        .select()
        .single()
      if (error) throw error
      setLanguages(prev => [data, ...prev])
      onLanguagesChange?.()
    } catch (error) {
      console.error('Error duplicating language:', error)
    }
  }

  // Apply search, sort, and filters (delegate to utility function)
  const getFilteredAndSortedLanguages = applySearchSortFilter

  const handleClearFilters = () => {
    setFilters({
      families: [],
      statuses: [],
      writingSystems: []
    })
  }

  // Get unique families from all languages for filter options
  const getUniqueFamilies = () => {
    const families = new Set<string>()
    languages.forEach(lang => {
      if (lang.attributes?.family) {
        families.add(lang.attributes.family)
      }
    })
    return Array.from(families).sort()
  }

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div></div></div>

  // Render LIST view
  if (mode === 'list') {
    const filteredLanguages = getFilteredAndSortedLanguages()
    
    return (
      <div className="h-full bg-white flex flex-col overflow-hidden">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <LanguagesToolbar
            query={query}
            onQuery={setQuery}
            sort={sort}
            onSort={setSort}
            filters={filters}
            onFilters={setFilters}
            view={view}
            onView={setView}
            onNew={() => {
              setForm(INITIAL_FORM)
              setSelectedId(null)
              setMode('create')
            }}
            selectionCount={0}
            onClearFilters={handleClearFilters}
            availableFamilies={getUniqueFamilies()}
            languageStatuses={languageStatuses}
            writingSystems={writingSystems}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {filteredLanguages.length === 0 ? (
              <EmptyState 
                onCreateFirst={() => { setForm(INITIAL_FORM); setSelectedId(null); setMode('create') }} 
                hasFilters={!!(query || filters.families.length > 0 || filters.statuses.length > 0 || filters.writingSystems.length > 0)} 
              />
            ) : view === 'grid' ? (
              <LanguagesGrid 
                languages={filteredLanguages}
                onEdit={handleEdit}
                onDelete={(id: string) => setDeleteConfirm(id)}
                onDuplicate={handleDuplicate}
              />
            ) : (
              <LanguagesTable 
                languages={filteredLanguages}
                onEdit={handleEdit}
                onDelete={(id: string) => setDeleteConfirm(id)}
                onDuplicate={handleDuplicate}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Language?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  This will archive the language, hiding it from your list. You can restore it later if needed.
                </p>
                <p className="text-xs text-gray-500">
                  Tip: Use the action menu on the language card to permanently delete if you want to remove it completely.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirm && handleDelete(deleteConfirm, false)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Render WORKSPACE (create/edit)
  const currentLanguage = selectedId ? languages.find(l => l.id === selectedId) : null
  return <LanguageWorkspace 
    mode={mode}
    form={form}
    setForm={setForm}
    onSave={handleSaveLanguage}
    onCancel={handleCancel}
    languageStatuses={languageStatuses}
    writingSystems={writingSystems}
    languageId={selectedId}
    metadata={currentLanguage ? {
      created_at: currentLanguage.created_at,
      updated_at: currentLanguage.updated_at
    } : undefined}
  />
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ onCreateFirst, hasFilters }: { onCreateFirst: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-amber-50 p-6 mb-6">
        <MessageSquare className="w-16 h-16 text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No languages match your filters' : 'No languages yet'}
      </h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        {hasFilters 
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Create your first language to start building unique communication systems for your world.'}
      </p>
      {!hasFilters && (
        <Button 
          onClick={onCreateFirst}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6 py-3 transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create First Language
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// LANGUAGES GRID COMPONENT
// ============================================================================

interface LanguagesGridProps {
  languages: any[]
  onEdit: (language: any) => void
  onDelete: (id: string) => void
  onDuplicate: (language: any) => void
}

function LanguagesGrid({ languages, onEdit, onDelete, onDuplicate }: LanguagesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {languages.map((language) => (
        <Card 
          key={language.id} 
          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300 hover:-translate-y-1"
        >
          <CardContent className="p-6">
            {/* Header with Icon and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="rounded-xl bg-amber-100 p-2.5 flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
                    {language.name}
                  </h3>
                  {language.attributes?.family && (
                    <p className="text-sm text-gray-500 truncate">
                      {language.attributes.family}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background w-48">
                  <DropdownMenuItem onClick={() => onEdit(language)} className="cursor-pointer">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(language)} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(language.id)} 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Pills/Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {language.attributes?.status && (
                <Badge 
                  variant="outline" 
                  className={`text-xs font-medium border ${getStatusPillColor(language.attributes.status)}`}
                >
                  {language.attributes.status}
                </Badge>
              )}
              {language.attributes?.writing_system && (
                <Badge variant="outline" className={`text-xs font-medium border ${getWSysPillColor(language.attributes.writing_system)}`}>
                  {language.attributes.writing_system}
                </Badge>
              )}
            </div>

            {/* Description */}
            {language.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                {language.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Updated</span>
                <span>•</span>
                <span className="font-medium">{relativeTime(language.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// LANGUAGES TABLE COMPONENT
// ============================================================================

interface LanguagesTableProps {
  languages: any[]
  onEdit: (language: any) => void
  onDelete: (id: string) => void
  onDuplicate: (language: any) => void
}

function LanguagesTable({ languages, onEdit, onDelete, onDuplicate }: LanguagesTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold text-gray-900">Name</TableHead>
            <TableHead className="font-semibold text-gray-900">Family</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Writing System</TableHead>
            <TableHead className="font-semibold text-gray-900">Updated</TableHead>
            <TableHead className="w-[100px] font-semibold text-gray-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {languages.map((language) => (
            <TableRow 
              key={language.id}
              className="group hover:bg-amber-50/50 transition-colors cursor-pointer"
              onClick={() => onEdit(language)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{language.name}</div>
                    {language.description && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {language.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-700">
                {language.attributes?.family || '—'}
              </TableCell>
              <TableCell>
                {language.attributes?.status ? (
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getStatusPillColor(language.attributes.status)}`}
                  >
                    {language.attributes.status}
                  </Badge>
                ) : '—'}
              </TableCell>
              <TableCell className="text-gray-700">
                {language.attributes?.writing_system ? (
                  <Badge variant="outline" className={`text-xs font-medium border ${getWSysPillColor(language.attributes.writing_system)}`}>
                    {language.attributes.writing_system}
                  </Badge>
                ) : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {relativeTime(language.updated_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background w-48">
                    <DropdownMenuItem onClick={() => onEdit(language)} className="cursor-pointer">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(language)} className="cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(language.id)} 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
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

// ============================================================================
// LANGUAGES TOOLBAR COMPONENT
// ============================================================================

interface LanguagesToolbarProps {
  query: string
  onQuery: (value: string) => void
  sort: SortOption
  onSort: (value: SortOption) => void
  filters: FilterState
  onFilters: (filters: FilterState) => void
  view: ViewMode
  onView: (view: ViewMode) => void
  onNew: () => void
  selectionCount: number
  onClearFilters: () => void
  availableFamilies: string[]
  languageStatuses: string[]
  writingSystems: string[]
}

function LanguagesToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilters,
  view,
  onView,
  onNew,
  selectionCount,
  onClearFilters,
  availableFamilies,
  languageStatuses,
  writingSystems
}: LanguagesToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Keyboard shortcut for search (/)
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

  // Calculate active filter count
  const activeFilterCount = filters.families.length + filters.statuses.length + filters.writingSystems.length

  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilters({ ...filters, [category]: updated })
  }

  const removeFilter = (category: keyof FilterState, value: string) => {
    onFilters({
      ...filters,
      [category]: filters[category].filter(v => v !== value)
    })
  }

  return (
    <div className="px-6 py-6">
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Left side: Title and search */}
            <div className="flex-1 space-y-3 w-full lg:w-auto">
              <div className="flex items-center justify-between lg:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-gray-900">Languages</h2>
                </div>
                <Button 
                  onClick={onNew}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 py-2 transition-all duration-200 lg:hidden"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
              
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search languages... (press / to focus)"
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort */}
              <Select value={sort} onValueChange={(value) => onSort(value as SortOption)}>
                <SelectTrigger className="w-[140px] rounded-xl px-4 py-3 border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-background border border-gray-200 shadow-xl rounded-xl z-50">
                  <SelectItem value="name_asc">Name A→Z</SelectItem>
                  <SelectItem value="name_desc">Name Z→A</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="rounded-xl px-4 py-3 border-gray-200 focus:ring-2 focus:ring-amber-500 transition-all duration-200"
                    aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-full bg-amber-100 text-amber-800">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-background rounded-xl shadow-lg" align="start">
                  <Command className="bg-background">
                    <CommandInput placeholder="Search filters..." className="bg-background" />
                    <CommandList>
                      <CommandEmpty>No filters found.</CommandEmpty>
                      
                      {/* Family Filters */}
                      {availableFamilies.length > 0 && (
                        <>
                          <CommandGroup heading="Language Family">
                            {availableFamilies.map((family) => (
                              <CommandItem
                                key={family}
                                onSelect={() => toggleFilter('families', family)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    filters.families.includes(family) ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                                  }`}>
                                    {filters.families.includes(family) && (
                                      <div className="w-2 h-2 bg-white rounded-sm" />
                                    )}
                                  </div>
                                  <span>{family}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                        </>
                      )}

                      {/* Status Filters */}
                      <CommandGroup heading="Status">
                        {languageStatuses.map((status) => (
                          <CommandItem
                            key={status}
                            onSelect={() => toggleFilter('statuses', status)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                filters.statuses.includes(status) ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                              }`}>
                                {filters.statuses.includes(status) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="capitalize">{status}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <CommandSeparator />

                      {/* Writing System Filters */}
                      <CommandGroup heading="Writing System">
                        {writingSystems.map((system) => (
                          <CommandItem
                            key={system}
                            onSelect={() => toggleFilter('writingSystems', system)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                filters.writingSystems.includes(system) ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                              }`}>
                                {filters.writingSystems.includes(system) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="capitalize">{system}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* View Toggle */}
              <ToggleGroup type="single" value={view} onValueChange={(value) => value && onView(value as ViewMode)}>
                <ToggleGroupItem 
                  value="grid" 
                  aria-label="Grid view" 
                  className="rounded-l-xl data-[state=on]:bg-amber-100 data-[state=on]:text-amber-900 transition-all duration-200"
                >
                  <Grid3x3 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="list" 
                  aria-label="List view" 
                  className="rounded-r-xl data-[state=on]:bg-amber-100 data-[state=on]:text-amber-900 transition-all duration-200"
                >
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              {/* New Language Button (Desktop) */}
              <Button 
                onClick={onNew}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 py-3 transition-all duration-200 hidden lg:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Language
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filters.families.map(family => (
                  <Badge 
                    key={`family-${family}`} 
                    variant="secondary" 
                    className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('families', family)}
                  >
                    {family}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.statuses.map(status => (
                  <Badge 
                    key={`status-${status}`} 
                    variant="secondary" 
                    className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('statuses', status)}
                  >
                    {status}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.writingSystems.map(system => (
                  <Badge 
                    key={`system-${system}`} 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('writingSystems', system)}
                  >
                    {system}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// LANGUAGE WORKSPACE COMPONENT
// ============================================================================

function LanguageWorkspace({ 
  mode, 
  form, 
  setForm, 
  onSave, 
  onCancel,
  languageStatuses,
  writingSystems,
  languageId,
  metadata
}: {
  mode: 'create' | 'edit'
  form: LanguageForm
  setForm: React.Dispatch<React.SetStateAction<LanguageForm>>
  onSave: () => void
  onCancel: () => void
  languageStatuses: string[]
  writingSystems: string[]
  languageId?: string | null
  metadata?: {
    created_at?: string
    updated_at?: string
  }
}) {
  const [newTag, setNewTag] = useState('')

  // Tag Management
  const addTag = () => {
    if (!newTag.trim() || form.tags?.includes(newTag.trim())) return
    setForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }))
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))
  }

  // For CREATE mode, show simplified form
  if (mode === 'create') {
    return (
      <div className="h-full bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create Language</h2>
                  <p className="text-sm text-gray-500">Define a new language or communication system</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} className="rounded-lg">
                  Cancel
                </Button>
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Language
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Getting Started Tip */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Getting Started</h4>
                    <p className="text-sm text-amber-800">
                      Start with the basics: give your language a name, choose its status, and add a brief description. 
                      You can add vocabulary, grammar rules, and writing systems later after creating the language.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basics Section */}
            <Card className="rounded-xl border-gray-200">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Basics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Two Column Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Language Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Language Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      value={form.name} 
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
                      placeholder="e.g., Elvish, Common Tongue, Ancient Script"
                      className="rounded-lg"
                    />
                  </div>

                  {/* Language Family */}
                  <div>
                    <Label htmlFor="family" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Language Family
                    </Label>
                    <Input 
                      id="family" 
                      value={form.family || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, family: e.target.value }))} 
                      placeholder="e.g., Indo-European, Sino-Tibetan"
                      className="rounded-lg"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Status
                    </Label>
                    <Select 
                      value={form.status} 
                      onValueChange={(value: any) => setForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status" className="rounded-lg">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {languageStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speakers */}
                  <div>
                    <Label htmlFor="speakers" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Number of Speakers
                    </Label>
                    <Input 
                      id="speakers" 
                      value={form.speakers || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, speakers: e.target.value }))} 
                      placeholder="e.g., 1 million, Few hundred"
                      className="rounded-lg"
                    />
                  </div>

                  {/* Writing System */}
                  <div className="col-span-2">
                    <Label htmlFor="writing_system" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Writing System
                    </Label>
                    <Select 
                      value={form.writing_system} 
                      onValueChange={(value: any) => setForm(prev => ({ ...prev, writing_system: value }))}
                    >
                      <SelectTrigger id="writing_system" className="rounded-lg">
                        <SelectValue placeholder="Select writing system" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {writingSystems.map(system => (
                          <SelectItem key={system} value={system}>
                            {system.charAt(0).toUpperCase() + system.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Tags
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      className="rounded-lg"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button onClick={addTag} size="sm" variant="outline" className="rounded-lg">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.tags || []).map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sample Text */}
                <div>
                  <Label htmlFor="sample_text" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Sample Text/Phrases
                  </Label>
                  <Textarea 
                    id="sample_text" 
                    value={form.sample_text || ''} 
                    onChange={(e) => setForm(prev => ({ ...prev, sample_text: e.target.value }))} 
                    placeholder="Common phrases, greetings, or sample text in this language..."
                    rows={3}
                    className="rounded-lg resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Overview Section */}
            <Card className="rounded-xl border-gray-200">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Description
                  </Label>
                  <Textarea 
                    id="description" 
                    value={form.description || ''} 
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
                    placeholder="Describe this language, its origins, usage, cultural significance, and any unique characteristics..."
                    rows={6}
                    className="rounded-lg resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Provide context about when and where this language is used, who speaks it, and what makes it unique in your world.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // For EDIT mode, show full tabbed interface
  return <LanguageWorkspaceEdit 
    form={form}
    setForm={setForm}
    onSave={onSave}
    onCancel={onCancel}
    languageStatuses={languageStatuses}
    writingSystems={writingSystems}
    languageId={languageId}
    metadata={metadata}
  />
}

// ============================================================================
// LANGUAGE WORKSPACE EDIT COMPONENT (Full Tabs)
// ============================================================================

function LanguageWorkspaceEdit({
  form,
  setForm,
  onSave,
  onCancel,
  languageStatuses,
  writingSystems,
  languageId,
  metadata
}: {
  form: LanguageForm
  setForm: React.Dispatch<React.SetStateAction<LanguageForm>>
  onSave: () => void
  onCancel: () => void
  languageStatuses: string[]
  writingSystems: string[]
  languageId?: string | null
  metadata?: {
    created_at?: string
    updated_at?: string
  }
}) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [newWord, setNewWord] = useState<Partial<WordEntry>>({})
  const [newSymbol, setNewSymbol] = useState<Partial<SymbolEntry>>({})
  const [newWordType, setNewWordType] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Dictionary tab state
  const [editingWordId, setEditingWordId] = useState<string | null>(null)
  const [wordSearch, setWordSearch] = useState('')
  const [wordTypeFilter, setWordTypeFilter] = useState<string>('all')
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importPreview, setImportPreview] = useState<WordEntry[]>([])
  const [editWordCache, setEditWordCache] = useState<{[key: string]: WordEntry}>({})

  // Script tab state
  const [editingSymbolId, setEditingSymbolId] = useState<string | null>(null)
  const [draggedSymbolId, setDraggedSymbolId] = useState<string | null>(null)
  const [bulkAddText, setBulkAddText] = useState('')
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [uploadingSymbolId, setUploadingSymbolId] = useState<string | null>(null)

  // Auto-save with debounce (600ms)
  const autoSave = useCallback(async (updatedForm: LanguageForm) => {
    if (!languageId) return

    try {
      setIsSaving(true)
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('world_elements')
        .update({
          name: updatedForm.name,
          description: updatedForm.description,
          attributes: {
            family: updatedForm.family,
            status: updatedForm.status,
            speakers: updatedForm.speakers,
            writing_system: updatedForm.writing_system,
            sample_text: updatedForm.sample_text,
            words: updatedForm.words,
            word_types: updatedForm.word_types,
            symbols: updatedForm.symbols,
            phonology: updatedForm.phonology,
            grammar: updatedForm.grammar,
            links: updatedForm.links,
            images: updatedForm.images
          },
          tags: updatedForm.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', languageId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Saved',
        message: 'Changes saved successfully',
        duration: 2000
      })
    } catch (error) {
      console.error('Auto-save error:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save changes. Please try again.',
        duration: 4000
      })
    } finally {
      setIsSaving(false)
    }
  }, [languageId, addToast])

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((updatedForm: LanguageForm) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(updatedForm)
    }, 600)
  }, [autoSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'living': return 'bg-green-100 text-green-800 border-green-200'
      case 'dead': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'constructed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ancient': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ceremonial': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleDuplicate = async () => {
    // Create a duplicate and go back to list
    try {
      const duplicateData = {
        project_id: form.name, // This will be set by parent
        category: 'languages',
        name: `${form.name} (Copy)`,
        description: form.description,
        attributes: {
          family: form.family,
          status: form.status,
          speakers: form.speakers,
          writing_system: form.writing_system,
          sample_text: form.sample_text,
          words: form.words,
          word_types: form.word_types,
          symbols: form.symbols,
          phonology: form.phonology,
          grammar: form.grammar,
          links: form.links,
          images: form.images,
          tags: form.tags
        },
        tags: form.tags || []
      }
      // This would need to be handled by parent component
      console.log('Duplicate:', duplicateData)
      onCancel() // Go back to list for now
    } catch (error) {
      console.error('Error duplicating:', error)
    }
  }

  const handleDelete = () => {
    setDeleteConfirm(true)
  }

  const confirmDelete = () => {
    // This would need to be handled by parent component
    console.log('Delete language')
    onCancel() // Go back to list
  }

  // Word Management
  const addWord = () => {
    if (!newWord.term) return
    const word: WordEntry = {
      id: Date.now().toString(),
      term: newWord.term,
      pronunciation: newWord.pronunciation,
      type: newWord.type,
      definition: newWord.definition,
      notes: newWord.notes,
      examples: newWord.examples || []
    }
    setForm(prev => ({ ...prev, words: [...prev.words, word] }))
    setNewWord({})
  }

  const removeWord = (id: string) => {
    setForm(prev => ({ ...prev, words: prev.words.filter(w => w.id !== id) }))
  }

  // Dictionary Management Functions
  const addNewWord = () => {
    const newWord: WordEntry = {
      id: crypto.randomUUID(),
      term: '',
      pronunciation: '',
      type: '',
      definition: '',
      notes: '',
      examples: []
    }
    const updated = { ...form, words: [newWord, ...(form.words || [])] }
    setForm(updated)
    setEditingWordId(newWord.id)
    triggerAutoSave(updated)
  }

  const updateWord = (id: string, field: keyof WordEntry, value: any) => {
    const updated = {
      ...form,
      words: form.words.map(w => w.id === id ? { ...w, [field]: value } : w)
    }
    setForm(updated)
    
    // Update cache for inline editing
    setEditWordCache(prev => ({
      ...prev,
      [id]: { ...(prev[id] || form.words.find(w => w.id === id)!), [field]: value }
    }))
  }

  const saveWord = (id: string) => {
    setEditingWordId(null)
    setEditWordCache(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    triggerAutoSave(form)
  }

  const cancelEditWord = (id: string) => {
    if (editWordCache[id]) {
      const updated = {
        ...form,
        words: form.words.map(w => w.id === id ? editWordCache[id] : w)
      }
      setForm(updated)
    }
    setEditingWordId(null)
    setEditWordCache(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const duplicateWord = (id: string) => {
    const word = form.words.find(w => w.id === id)
    if (!word) return
    
    const duplicate: WordEntry = {
      ...word,
      id: crypto.randomUUID(),
      term: `${word.term} (Copy)`
    }
    const updated = { ...form, words: [...form.words, duplicate] }
    setForm(updated)
    triggerAutoSave(updated)
    
    addToast({
      type: 'success',
      title: 'Word Duplicated',
      message: `"${word.term}" has been duplicated`,
      duration: 2000
    })
  }

  const deleteWord = (id: string) => {
    const word = form.words.find(w => w.id === id)
    const updated = { ...form, words: form.words.filter(w => w.id !== id) }
    setForm(updated)
    triggerAutoSave(updated)
    
    addToast({
      type: 'success',
      title: 'Word Deleted',
      message: word ? `"${word.term}" has been deleted` : 'Word deleted',
      duration: 2000
    })
  }

  // Drag and Drop for word reordering
  const handleDragStart = (id: string) => {
    setDraggedWordId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedWordId || draggedWordId === targetId) return

    const draggedIndex = form.words.findIndex(w => w.id === draggedWordId)
    const targetIndex = form.words.findIndex(w => w.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    const newWords = [...form.words]
    const [removed] = newWords.splice(draggedIndex, 1)
    newWords.splice(targetIndex, 0, removed)
    
    setForm(prev => ({ ...prev, words: newWords }))
  }

  const handleDragEnd = () => {
    if (draggedWordId) {
      triggerAutoSave(form)
    }
    setDraggedWordId(null)
  }

  // Import/Export Functions
  const exportWords = (format: 'json' | 'csv', selectedOnly: boolean = false) => {
    const words = selectedOnly ? form.words.filter((_, i) => i < 10) : form.words // For now, export all
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name}-dictionary.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const csv = [
        'Term,Pronunciation,Type,Definition,Notes',
        ...words.map(w => `"${w.term}","${w.pronunciation || ''}","${w.type || ''}","${w.definition || ''}","${w.notes || ''}"`)
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.name}-dictionary.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    addToast({
      type: 'success',
      title: 'Exported',
      message: `Dictionary exported as ${format.toUpperCase()}`,
      duration: 2000
    })
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        let importedWords: WordEntry[] = []

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content)
          importedWords = Array.isArray(parsed) ? parsed : [parsed]
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n')
          const headers = lines[0].split(',')
          importedWords = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.replace(/^"|"$/g, ''))
            return {
              id: crypto.randomUUID(),
              term: values[0] || '',
              pronunciation: values[1] || '',
              type: values[2] || '',
              definition: values[3] || '',
              notes: values[4] || '',
              examples: []
            }
          })
        }

        // Ensure all words have IDs
        importedWords = importedWords.map(w => ({
          ...w,
          id: w.id || crypto.randomUUID()
        }))

        setImportPreview(importedWords)
        setShowImportDialog(true)
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: 'Could not parse file. Please check the format.',
          duration: 4000
        })
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  const confirmImport = () => {
    const updated = { ...form, words: [...importPreview, ...form.words] }
    setForm(updated)
    triggerAutoSave(updated)
    setShowImportDialog(false)
    setImportPreview([])
    
    addToast({
      type: 'success',
      title: 'Words Imported',
      message: `${importPreview.length} word(s) added to dictionary`,
      duration: 3000
    })
  }

  // Filter words based on search and type
  const getFilteredWords = () => {
    let filtered = form.words || []
    
    if (wordSearch.trim()) {
      const search = wordSearch.toLowerCase()
      filtered = filtered.filter(w => 
        w.term.toLowerCase().includes(search) ||
        w.definition?.toLowerCase().includes(search) ||
        w.pronunciation?.toLowerCase().includes(search)
      )
    }
    
    if (wordTypeFilter !== 'all') {
      filtered = filtered.filter(w => w.type === wordTypeFilter)
    }
    
    return filtered
  }

  // === Script Tab Symbol Functions ===
  
  // Add new symbol at top
  const addNewSymbol = () => {
    const newSym: SymbolEntry = {
      id: crypto.randomUUID(),
      glyph: '',
      romanization: '',
      sound: '',
      tags: [],
      image: ''
    }
    const updated = {
      ...form,
      symbols: [newSym, ...(form.symbols || [])]
    }
    setForm(updated)
    setEditingSymbolId(newSym.id)
    triggerAutoSave(updated)
    addToast({
      type: 'success',
      title: 'Symbol added',
      message: 'New symbol created at the top'
    })
  }

  // Bulk add symbols from textarea
  const handleBulkAdd = () => {
    if (!bulkAddText.trim()) return
    
    const lines = bulkAddText.split('\n').filter(line => line.trim())
    const newSymbols: SymbolEntry[] = lines.map(line => {
      const parts = line.split('|').map(p => p.trim())
      return {
        id: crypto.randomUUID(),
        glyph: parts[0] || '',
        romanization: parts[1] || '',
        sound: parts[2] || '',
        tags: parts[3] ? parts[3].split(',').map(t => t.trim()) : [],
        image: ''
      }
    })
    
    const updated = {
      ...form,
      symbols: [...newSymbols, ...(form.symbols || [])]
    }
    setForm(updated)
    setBulkAddText('')
    setShowBulkAdd(false)
    triggerAutoSave(updated)
    addToast({
      type: 'success',
      title: `${newSymbols.length} symbols added`,
      message: 'Bulk import completed successfully'
    })
  }

  // Update symbol field
  const updateSymbol = (id: string, field: keyof SymbolEntry, value: any) => {
    const updated = {
      ...form,
      symbols: (form.symbols || []).map(symbol => 
        symbol.id === id ? { ...symbol, [field]: value } : symbol
      )
    }
    setForm(updated)
    triggerAutoSave(updated)
  }

  // Add tag to symbol
  const addSymbolTag = (id: string, tag: string) => {
    if (!tag.trim()) return
    const updated = {
      ...form,
      symbols: (form.symbols || []).map(symbol => 
        symbol.id === id 
          ? { ...symbol, tags: [...(symbol.tags || []), tag.trim()] }
          : symbol
      )
    }
    setForm(updated)
    triggerAutoSave(updated)
  }

  // Remove tag from symbol
  const removeSymbolTag = (id: string, tag: string) => {
    const updated = {
      ...form,
      symbols: (form.symbols || []).map(symbol => 
        symbol.id === id 
          ? { ...symbol, tags: (symbol.tags || []).filter(t => t !== tag) }
          : symbol
      )
    }
    setForm(updated)
    triggerAutoSave(updated)
  }

  // Delete symbol
  const deleteSymbol = (id: string) => {
    const symbol = form.symbols?.find(s => s.id === id)
    const updated = {
      ...form,
      symbols: (form.symbols || []).filter(s => s.id !== id)
    }
    setForm(updated)
    triggerAutoSave(updated)
    addToast({
      type: 'success',
      title: 'Symbol deleted',
      message: symbol?.glyph ? `Deleted "${symbol.glyph}"` : 'Symbol removed'
    })
  }

  // Duplicate symbol
  const duplicateSymbol = (id: string) => {
    const symbol = form.symbols?.find(s => s.id === id)
    if (!symbol) return
    
    const newSym = {
      ...symbol,
      id: crypto.randomUUID()
    }
    const index = form.symbols?.findIndex(s => s.id === id) || 0
    const newSymbols = [...(form.symbols || [])]
    newSymbols.splice(index + 1, 0, newSym)
    
    const updated = { ...form, symbols: newSymbols }
    setForm(updated)
    triggerAutoSave(updated)
    addToast({
      type: 'success',
      title: 'Symbol duplicated',
      message: 'Copy created below original'
    })
  }

  // Drag & Drop for symbols
  const handleSymbolDragStart = (id: string) => {
    setDraggedSymbolId(id)
  }

  const handleSymbolDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedSymbolId || draggedSymbolId === targetId) return
    
    const symbols = [...(form.symbols || [])]
    const draggedIndex = symbols.findIndex(s => s.id === draggedSymbolId)
    const targetIndex = symbols.findIndex(s => s.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const [removed] = symbols.splice(draggedIndex, 1)
    symbols.splice(targetIndex, 0, removed)
    
    setForm(prev => ({ ...prev, symbols }))
  }

  const handleSymbolDragEnd = () => {
    if (draggedSymbolId) {
      triggerAutoSave(form)
    }
    setDraggedSymbolId(null)
  }

  // Upload image for symbol
  const handleSymbolImageUpload = async (symbolId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid file',
        message: 'Please upload an image file'
      })
      return
    }

    setUploadingSymbolId(symbolId)

    try {
      const supabase = createSupabaseClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${languageId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('language-symbols')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('language-symbols')
        .getPublicUrl(filePath)

      updateSymbol(symbolId, 'image', publicUrl)
      
      addToast({
        type: 'success',
        title: 'Image uploaded',
        message: 'Symbol image updated successfully'
      })
    } catch (error) {
      console.error('Upload error:', error)
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Could not upload image'
      })
    } finally {
      setUploadingSymbolId(null)
    }
  }

  // Old symbol management - for backwards compatibility
  const addSymbol = () => {
    if (!newSymbol.glyph && !newSymbol.romanization) return
    const symbol: SymbolEntry = {
      id: Date.now().toString(),
      glyph: newSymbol.glyph,
      romanization: newSymbol.romanization,
      sound: newSymbol.sound,
      tags: newSymbol.tags || [],
      image: newSymbol.image
    }
    setForm(prev => ({ ...prev, symbols: [...prev.symbols, symbol] }))
    setNewSymbol({})
  }

  const removeSymbol = (id: string) => {
    setForm(prev => ({ ...prev, symbols: prev.symbols.filter(s => s.id !== id) }))
  }

  // Word Type Management
  const addWordType = () => {
    if (!newWordType.trim() || form.word_types.includes(newWordType.trim())) return
    setForm(prev => ({ ...prev, word_types: [...prev.word_types, newWordType.trim()] }))
    setNewWordType('')
  }

  const removeWordType = (type: string) => {
    setForm(prev => ({ ...prev, word_types: prev.word_types.filter(t => t !== type) }))
  }

  // Tag Management
  const addTag = () => {
    if (!newTag.trim() || form.tags?.includes(newTag.trim())) return
    const updated = { ...form, tags: [...(form.tags || []), newTag.trim()] }
    setForm(updated)
    setNewTag('')
    triggerAutoSave(updated)
  }

  const removeTag = (tag: string) => {
    const updated = { ...form, tags: (form.tags || []).filter(t => t !== tag) }
    setForm(updated)
    triggerAutoSave(updated)
  }

  // Array helpers for phonology/grammar
  const addToArray = (path: 'phonology.vowels' | 'phonology.consonants' | 'grammar.tenses' | 'grammar.cases', value: string) => {
    if (!value.trim()) return
    if (path === 'phonology.vowels') {
      setForm(prev => ({
        ...prev,
        phonology: { ...prev.phonology, vowels: [...(prev.phonology?.vowels || []), value.trim()] }
      }))
    } else if (path === 'phonology.consonants') {
      setForm(prev => ({
        ...prev,
        phonology: { ...prev.phonology, consonants: [...(prev.phonology?.consonants || []), value.trim()] }
      }))
    } else if (path === 'grammar.tenses') {
      setForm(prev => ({
        ...prev,
        grammar: { ...prev.grammar, tenses: [...(prev.grammar?.tenses || []), value.trim()] }
      }))
    } else if (path === 'grammar.cases') {
      setForm(prev => ({
        ...prev,
        grammar: { ...prev.grammar, cases: [...(prev.grammar?.cases || []), value.trim()] }
      }))
    }
  }

  const removeFromArray = (path: 'phonology.vowels' | 'phonology.consonants' | 'grammar.tenses' | 'grammar.cases', value: string) => {
    if (path === 'phonology.vowels') {
      setForm(prev => ({
        ...prev,
        phonology: { ...prev.phonology, vowels: (prev.phonology?.vowels || []).filter(v => v !== value) }
      }))
    } else if (path === 'phonology.consonants') {
      setForm(prev => ({
        ...prev,
        phonology: { ...prev.phonology, consonants: (prev.phonology?.consonants || []).filter(v => v !== value) }
      }))
    } else if (path === 'grammar.tenses') {
      setForm(prev => ({
        ...prev,
        grammar: { ...prev.grammar, tenses: (prev.grammar?.tenses || []).filter(v => v !== value) }
      }))
    } else if (path === 'grammar.cases') {
      setForm(prev => ({
        ...prev,
        grammar: { ...prev.grammar, cases: (prev.grammar?.cases || []).filter(v => v !== value) }
      }))
    }
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Enhanced Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        {/* Top Row: Name and Actions */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Editable Name and Meta Pills */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false)
                      if (e.key === 'Escape') setIsEditingName(false)
                    }}
                    className="text-2xl font-bold h-auto py-1 px-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors flex items-center gap-2 group"
                  onClick={() => setIsEditingName(true)}
                >
                  {form.name}
                  <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
              
              {/* Meta Pills */}
              <div className="flex items-center gap-2">
                {form.status && (
                  <Badge variant="outline" className={`text-xs font-medium border ${getStatusColor(form.status)}`}>
                    {form.status}
                  </Badge>
                )}
                {form.writing_system && (
                  <Badge variant="outline" className="text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800">
                    {form.writing_system}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="rounded-lg"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Tabs */}
        <div className="px-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0 space-x-6">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="dictionary" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Dictionary
                </TabsTrigger>
                <TabsTrigger 
                  value="script" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Script
                </TabsTrigger>
                <TabsTrigger 
                  value="phonology" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Phonology & Grammar
                </TabsTrigger>
                <TabsTrigger 
                  value="relationships" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Relationships
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative px-0 pb-3 pt-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 font-medium transition-colors"
                >
                  Media
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
                {/* Main Content */}
                <div className="space-y-6">
                  {/* Basic Information Card */}
                  <Card className="rounded-xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle>Basic Information</CardTitle>
                      {isSaving && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          Saving...
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="family">Language Family</Label>
                          <Input 
                            id="family" 
                            value={form.family || ''} 
                            onChange={(e) => {
                              const updated = { ...form, family: e.target.value }
                              setForm(updated)
                              triggerAutoSave(updated)
                            }} 
                            placeholder="e.g., Indo-European, Sino-Tibetan..." 
                            className="rounded-lg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="speakers">Number of Speakers</Label>
                          <Input 
                            id="speakers" 
                            value={form.speakers || ''} 
                            onChange={(e) => {
                              const updated = { ...form, speakers: e.target.value }
                              setForm(updated)
                              triggerAutoSave(updated)
                            }} 
                            placeholder="e.g., 1 million, Few hundred" 
                            className="rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select 
                            value={form.status} 
                            onValueChange={(value: any) => {
                              const updated = { ...form, status: value }
                              setForm(updated)
                              triggerAutoSave(updated)
                            }}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {languageStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="writing_system">Writing System</Label>
                          <Select 
                            value={form.writing_system} 
                            onValueChange={(value: any) => {
                              const updated = { ...form, writing_system: value }
                              setForm(updated)
                              triggerAutoSave(updated)
                            }}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue placeholder="Select writing system" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {writingSystems.map(system => (
                                <SelectItem key={system} value={system}>
                                  {system.charAt(0).toUpperCase() + system.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          value={form.description || ''} 
                          onChange={(e) => {
                            const updated = { ...form, description: e.target.value }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }} 
                          placeholder="Describe this language..." 
                          rows={6}
                          className="rounded-lg resize-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sample_text">Sample Text/Phrases</Label>
                        <Textarea 
                          id="sample_text" 
                          value={form.sample_text || ''} 
                          onChange={(e) => {
                            const updated = { ...form, sample_text: e.target.value }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }} 
                          placeholder="Common phrases, greetings, or sample text in this language..." 
                          rows={4}
                          className="rounded-lg resize-none"
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <div className="flex gap-2 mb-2">
                          <Input 
                            id="tags"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag..."
                            className="rounded-lg"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addTag()
                              }
                            }}
                          />
                          <Button onClick={addTag} size="sm" variant="outline" className="rounded-lg">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(form.tags || []).map(tag => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                              onClick={() => removeTag(tag)}
                            >
                              {tag}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Facts Sidebar (readonly) */}
                <div className="space-y-4">
                  <Card className="rounded-xl border-gray-200 bg-gray-50">
                    <CardHeader className="border-b border-gray-100 bg-white rounded-t-xl">
                      <CardTitle className="text-sm font-semibold text-gray-700">Language Facts</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 text-sm">
                      {/* Created */}
                      {metadata?.created_at && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</div>
                            <div className="text-gray-900 mt-1">
                              {new Date(metadata.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Updated */}
                      {metadata?.updated_at && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</div>
                            <div className="text-gray-900 mt-1">
                              {new Date(metadata.updated_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4 space-y-3">
                        {/* Word Count */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Words</span>
                          </div>
                          <span className="font-semibold text-amber-600">{form.words?.length || 0}</span>
                        </div>

                        {/* Symbol Count */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Hash className="w-4 h-4" />
                            <span>Symbols</span>
                          </div>
                          <span className="font-semibold text-amber-600">{form.symbols?.length || 0}</span>
                        </div>

                        {/* Tag Count */}
                        {form.tags && form.tags.length > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                              <X className="w-4 h-4" />
                              <span>Tags</span>
                            </div>
                            <span className="font-semibold text-amber-600">{form.tags.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Tag Cloud */}
                      {form.tags && form.tags.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tags</div>
                          <div className="flex flex-wrap gap-1.5">
                            {form.tags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs bg-amber-100 text-amber-800"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>


            {/* DICTIONARY TAB */}
            <TabsContent value="dictionary" className="mt-0">
              {/* Toolbar */}
              <div className="mb-4 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    onClick={addNewWord}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Word
                  </Button>

                  <div className="flex-1 min-w-[200px]">
                    <Input 
                      placeholder="Search words..."
                      value={wordSearch}
                      onChange={(e) => setWordSearch(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <Select value={wordTypeFilter} onValueChange={setWordTypeFilter}>
                    <SelectTrigger className="w-[180px] rounded-lg">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="all">All Types</SelectItem>
                      {form.word_types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background">
                      <DropdownMenuItem onClick={() => exportWords('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportWords('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('import-file')?.click()}
                    className="rounded-lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <input 
                    id="import-file"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>

                {/* Word Type Management */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Word Types:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {form.word_types.map(type => (
                      <Badge 
                        key={type}
                        variant="secondary"
                        className="bg-amber-100 text-amber-800"
                      >
                        {type}
                      </Badge>
                    ))}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Type
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-background w-64" align="start">
                        <div className="space-y-2">
                          <Label>New Word Type</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="e.g., noun, verb..."
                              value={newWordType}
                              onChange={(e) => setNewWordType(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addWordType()
                                }
                              }}
                              className="rounded-lg"
                            />
                            <Button onClick={addWordType} size="sm" className="rounded-lg">
                              Add
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Dictionary Table */}
              {getFilteredWords().length === 0 ? (
                <Card className="rounded-xl border-gray-200">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-4">
                        {wordSearch || wordTypeFilter !== 'all' ? 'No words match your filters' : 'No words yet'}
                      </p>
                      {!wordSearch && wordTypeFilter === 'all' && (
                        <Button onClick={addNewWord} variant="outline" className="rounded-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Word
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-xl border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Pronunciation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredWords().map((word) => (
                        <TableRow 
                          key={word.id}
                          draggable
                          onDragStart={() => handleDragStart(word.id)}
                          onDragOver={(e) => handleDragOver(e, word.id)}
                          onDragEnd={handleDragEnd}
                          className={draggedWordId === word.id ? 'opacity-50' : ''}
                        >
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          </TableCell>
                          <TableCell>
                            {editingWordId === word.id ? (
                              <Input 
                                value={word.term}
                                onChange={(e) => updateWord(word.id, 'term', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveWord(word.id)
                                  if (e.key === 'Escape') cancelEditWord(word.id)
                                }}
                                autoFocus
                                className="h-8 rounded"
                              />
                            ) : (
                              <div 
                                onClick={() => setEditingWordId(word.id)}
                                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[32px] flex items-center"
                              >
                                {word.term || <span className="text-gray-400">Click to edit</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingWordId === word.id ? (
                              <Input 
                                value={word.pronunciation || ''}
                                onChange={(e) => updateWord(word.id, 'pronunciation', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveWord(word.id)
                                  if (e.key === 'Escape') cancelEditWord(word.id)
                                }}
                                placeholder="/IPA/"
                                className="h-8 rounded"
                              />
                            ) : (
                              <div 
                                onClick={() => setEditingWordId(word.id)}
                                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[32px] flex items-center font-mono text-sm"
                              >
                                {word.pronunciation || <span className="text-gray-400">—</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingWordId === word.id ? (
                              <Select 
                                value={word.type || ''}
                                onValueChange={(value) => updateWord(word.id, 'type', value)}
                              >
                                <SelectTrigger className="h-8 rounded">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  {form.word_types.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div 
                                onClick={() => setEditingWordId(word.id)}
                                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[32px] flex items-center"
                              >
                                {word.type ? (
                                  <Badge variant="outline" className="text-xs">{word.type}</Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingWordId === word.id ? (
                              <Input 
                                value={word.definition || ''}
                                onChange={(e) => updateWord(word.id, 'definition', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveWord(word.id)
                                  if (e.key === 'Escape') cancelEditWord(word.id)
                                }}
                                placeholder="Definition..."
                                className="h-8 rounded"
                              />
                            ) : (
                              <div 
                                onClick={() => setEditingWordId(word.id)}
                                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[32px] flex items-center"
                              >
                                {word.definition || <span className="text-gray-400">Click to edit</span>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingWordId === word.id ? (
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => saveWord(word.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => cancelEditWord(word.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-background" align="end">
                                  <DropdownMenuItem onClick={() => setEditingWordId(word.id)}>
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateWord(word.id)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => deleteWord(word.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {/* Import Preview Dialog */}
              <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <AlertDialogContent className="bg-background max-w-4xl max-h-[80vh] overflow-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Import Preview</AlertDialogTitle>
                    <AlertDialogDescription>
                      Review {importPreview.length} word(s) before importing. They will be added to the top of your dictionary.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4 max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Pronunciation</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Definition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.map((word, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{word.term}</TableCell>
                            <TableCell className="font-mono text-sm">{word.pronunciation || '—'}</TableCell>
                            <TableCell>
                              {word.type && <Badge variant="outline" className="text-xs">{word.type}</Badge>}
                            </TableCell>
                            <TableCell className="max-w-md truncate">{word.definition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmImport}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Import {importPreview.length} Word(s)
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            {/* SCRIPT TAB */}
            <TabsContent value="script" className="mt-0">
              <div className="flex gap-6">
                {/* Main Content - Symbols Grid */}
                <div className="flex-1 space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={addNewSymbol}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Symbol
                      </Button>
                      <Button 
                        onClick={() => setShowBulkAdd(!showBulkAdd)}
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Add
                      </Button>
                    </div>
                    
                    {/* Writing System Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Writing System:</Label>
                      <Select 
                        value={form.writing_system || 'none'} 
                        onValueChange={(value: any) => {
                          const updated = { ...form, writing_system: value }
                          setForm(updated)
                          triggerAutoSave(updated)
                        }}
                      >
                        <SelectTrigger className="rounded-lg w-40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {writingSystems.map(system => (
                            <SelectItem key={system} value={system}>
                              {system.charAt(0).toUpperCase() + system.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Add Dialog */}
                  {showBulkAdd && (
                    <Card className="rounded-xl border-amber-200 bg-amber-50">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Bulk Add Symbols</Label>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowBulkAdd(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea 
                          value={bulkAddText}
                          onChange={(e) => setBulkAddText(e.target.value)}
                          placeholder="Paste symbols, one per line. Format: Glyph | Romanization | Sound | Tags&#10;Example: あ | a | /a/ | hiragana, vowel"
                          className="rounded-lg min-h-[120px] bg-white"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setBulkAddText('')
                              setShowBulkAdd(false)
                            }}
                            className="rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleBulkAdd}
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                            disabled={!bulkAddText.trim()}
                          >
                            Import Symbols
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Symbols Grid */}
                  {(!form.symbols || form.symbols.length === 0) ? (
                    <Card className="rounded-xl border-gray-200">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 mb-4">No symbols yet</p>
                          <Button 
                            onClick={addNewSymbol}
                            variant="outline"
                            className="rounded-lg"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Symbol
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {form.symbols.map((symbol) => (
                        <Card 
                          key={symbol.id}
                          draggable
                          onDragStart={() => handleSymbolDragStart(symbol.id)}
                          onDragOver={(e) => handleSymbolDragOver(e, symbol.id)}
                          onDragEnd={handleSymbolDragEnd}
                          className={`rounded-xl border-gray-200 transition-all hover:shadow-md ${
                            draggedSymbolId === symbol.id ? 'opacity-50' : ''
                          }`}
                        >
                          <CardContent className="pt-6 space-y-4">
                            {/* Drag Handle & Actions */}
                            <div className="flex items-start justify-between">
                              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-background" align="end">
                                  <DropdownMenuItem onClick={() => duplicateSymbol(symbol.id)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => deleteSymbol(symbol.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Glyph Display / Image */}
                            <div className="text-center">
                              {symbol.image ? (
                                <div className="relative">
                                  <img 
                                    src={symbol.image} 
                                    alt={symbol.glyph || 'Symbol'} 
                                    className="w-20 h-20 mx-auto object-contain rounded-lg"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateSymbol(symbol.id, 'image', '')}
                                    className="absolute top-0 right-0 h-6 w-6 p-0 rounded-full bg-white shadow"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : symbol.glyph ? (
                                <div className="text-5xl font-serif mb-2">{symbol.glyph}</div>
                              ) : (
                                <div className="text-5xl text-gray-300 mb-2">?</div>
                              )}
                              
                              {/* Image Upload */}
                              {!symbol.image && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`symbol-upload-${symbol.id}`)?.click()}
                                    disabled={uploadingSymbolId === symbol.id}
                                    className="text-xs rounded h-7"
                                  >
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    {uploadingSymbolId === symbol.id ? 'Uploading...' : 'Upload Image'}
                                  </Button>
                                  <input
                                    id={`symbol-upload-${symbol.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleSymbolImageUpload(symbol.id, file)
                                    }}
                                    className="hidden"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Fields */}
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-gray-600">Glyph</Label>
                                <Input 
                                  value={symbol.glyph || ''}
                                  onChange={(e) => updateSymbol(symbol.id, 'glyph', e.target.value)}
                                  placeholder="Symbol character"
                                  className="rounded h-9 text-center text-xl"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Romanization</Label>
                                <Input 
                                  value={symbol.romanization || ''}
                                  onChange={(e) => updateSymbol(symbol.id, 'romanization', e.target.value)}
                                  placeholder="Latin equivalent"
                                  className="rounded h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Sound (IPA)</Label>
                                <Input 
                                  value={symbol.sound || ''}
                                  onChange={(e) => updateSymbol(symbol.id, 'sound', e.target.value)}
                                  placeholder="/a/"
                                  className="rounded h-9 font-mono text-sm"
                                />
                              </div>
                              
                              {/* Tags */}
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Tags</Label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {(symbol.tags || []).map(tag => (
                                    <Badge 
                                      key={tag}
                                      variant="secondary"
                                      className="bg-amber-100 text-amber-800 text-xs cursor-pointer hover:bg-red-100"
                                      onClick={() => removeSymbolTag(symbol.id, tag)}
                                    >
                                      {tag} <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                  ))}
                                </div>
                                <Input 
                                  placeholder="Add tag..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      addSymbolTag(symbol.id, e.currentTarget.value)
                                      e.currentTarget.value = ''
                                    }
                                  }}
                                  className="rounded h-8 text-sm"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Sidebar - Writing System Tips */}
                <div className="hidden lg:block w-80 space-y-4">
                  <Card className="rounded-xl border-gray-200 sticky top-4">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-base">Writing System Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-3 text-sm">
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Alphabetic</h4>
                          <p className="text-gray-600 text-xs">Each symbol represents a single sound (phoneme). Examples: Latin, Greek, Cyrillic.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Logographic</h4>
                          <p className="text-gray-600 text-xs">Symbols represent words or morphemes. Examples: Chinese characters, Egyptian hieroglyphs.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Syllabic</h4>
                          <p className="text-gray-600 text-xs">Each symbol represents a syllable. Examples: Japanese kana, Cherokee syllabary.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Abjad</h4>
                          <p className="text-gray-600 text-xs">Consonants only; vowels are implied or marked with diacritics. Examples: Arabic, Hebrew.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Abugida</h4>
                          <p className="text-gray-600 text-xs">Consonant-vowel combinations with inherent vowel. Examples: Devanagari, Amharic.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 mb-1">Pictographic</h4>
                          <p className="text-gray-600 text-xs">Symbols represent objects or concepts directly. Examples: early Sumerian, Dongba.</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-semibold text-sm mb-2">Symbol Stats</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total symbols:</span>
                            <span className="font-medium text-gray-900">{form.symbols?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>With images:</span>
                            <span className="font-medium text-gray-900">
                              {form.symbols?.filter(s => s.image).length || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>With sounds:</span>
                            <span className="font-medium text-gray-900">
                              {form.symbols?.filter(s => s.sound).length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* PHONOLOGY & GRAMMAR TAB */}
            <TabsContent value="phonology" className="mt-0 space-y-6">
              {/* Phonology Card */}
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Phonology</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Vowels */}
                  <div>
                    <Label>Vowels</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Add vowel (press Enter)..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            if (input.value.trim()) {
                              const updated = {
                                ...form,
                                phonology: { 
                                  ...form.phonology, 
                                  vowels: [...(form.phonology?.vowels || []), input.value.trim()] 
                                }
                              }
                              setForm(updated)
                              triggerAutoSave(updated)
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.phonology?.vowels || []).map(vowel => (
                        <Badge 
                          key={vowel} 
                          variant="secondary" 
                          className="bg-amber-100 text-amber-800 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => {
                            const updated = {
                              ...form,
                              phonology: {
                                ...form.phonology,
                                vowels: (form.phonology?.vowels || []).filter(v => v !== vowel)
                              }
                            }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }}
                        >
                          {vowel} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Consonants */}
                  <div>
                    <Label>Consonants</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Add consonant (press Enter)..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            if (input.value.trim()) {
                              const updated = {
                                ...form,
                                phonology: { 
                                  ...form.phonology, 
                                  consonants: [...(form.phonology?.consonants || []), input.value.trim()] 
                                }
                              }
                              setForm(updated)
                              triggerAutoSave(updated)
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.phonology?.consonants || []).map(consonant => (
                        <Badge 
                          key={consonant} 
                          variant="secondary" 
                          className="bg-amber-100 text-amber-800 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => {
                            const updated = {
                              ...form,
                              phonology: {
                                ...form.phonology,
                                consonants: (form.phonology?.consonants || []).filter(c => c !== consonant)
                              }
                            }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }}
                        >
                          {consonant} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Syllable Structure */}
                  <div>
                    <Label htmlFor="syllableStructure">Syllable Structure</Label>
                    <Input 
                      id="syllableStructure"
                      value={form.phonology?.syllableStructure || ''}
                      onChange={(e) => {
                        const updated = {
                          ...form,
                          phonology: { ...form.phonology, syllableStructure: e.target.value }
                        }
                        setForm(updated)
                        triggerAutoSave(updated)
                      }}
                      placeholder="e.g., (C)V(C), CVC, CV..."
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Grammar Card */}
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Grammar Rules</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wordOrder">Word Order</Label>
                      <Select 
                        value={form.grammar?.wordOrder || ''}
                        onValueChange={(value) => {
                          const updated = {
                            ...form,
                            grammar: { ...form.grammar, wordOrder: value }
                          }
                          setForm(updated)
                          triggerAutoSave(updated)
                        }}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select word order" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="SVO">SVO (Subject-Verb-Object)</SelectItem>
                          <SelectItem value="SOV">SOV (Subject-Object-Verb)</SelectItem>
                          <SelectItem value="VSO">VSO (Verb-Subject-Object)</SelectItem>
                          <SelectItem value="VOS">VOS (Verb-Object-Subject)</SelectItem>
                          <SelectItem value="OVS">OVS (Object-Verb-Subject)</SelectItem>
                          <SelectItem value="OSV">OSV (Object-Subject-Verb)</SelectItem>
                          <SelectItem value="free">Free word order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="morphology">Morphology</Label>
                      <Textarea 
                        id="morphology"
                        value={form.grammar?.morphology || ''}
                        onChange={(e) => {
                          const updated = {
                            ...form,
                            grammar: { ...form.grammar, morphology: e.target.value }
                          }
                          setForm(updated)
                          triggerAutoSave(updated)
                        }}
                        placeholder="e.g., agglutinative, fusional, isolating..."
                        rows={1}
                        className="rounded-lg resize-none"
                      />
                    </div>
                  </div>

                  {/* Tenses */}
                  <div>
                    <Label>Tenses</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Add tense (press Enter)..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            if (input.value.trim()) {
                              const updated = {
                                ...form,
                                grammar: { 
                                  ...form.grammar, 
                                  tenses: [...(form.grammar?.tenses || []), input.value.trim()] 
                                }
                              }
                              setForm(updated)
                              triggerAutoSave(updated)
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.grammar?.tenses || []).map(tense => (
                        <Badge 
                          key={tense} 
                          variant="secondary" 
                          className="bg-amber-100 text-amber-800 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => {
                            const updated = {
                              ...form,
                              grammar: {
                                ...form.grammar,
                                tenses: (form.grammar?.tenses || []).filter(t => t !== tense)
                              }
                            }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }}
                        >
                          {tense} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Cases */}
                  <div>
                    <Label>Grammatical Cases</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Add case (press Enter)..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            if (input.value.trim()) {
                              const updated = {
                                ...form,
                                grammar: { 
                                  ...form.grammar, 
                                  cases: [...(form.grammar?.cases || []), input.value.trim()] 
                                }
                              }
                              setForm(updated)
                              triggerAutoSave(updated)
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.grammar?.cases || []).map(grammarCase => (
                        <Badge 
                          key={grammarCase} 
                          variant="secondary" 
                          className="bg-amber-100 text-amber-800 hover:bg-red-100 cursor-pointer transition-colors"
                          onClick={() => {
                            const updated = {
                              ...form,
                              grammar: {
                                ...form.grammar,
                                cases: (form.grammar?.cases || []).filter(c => c !== grammarCase)
                              }
                            }
                            setForm(updated)
                            triggerAutoSave(updated)
                          }}
                        >
                          {grammarCase} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Plurals */}
                  <div>
                    <Label htmlFor="plurals">Plural Formation</Label>
                    <Textarea 
                      id="plurals"
                      value={form.grammar?.plurals || ''}
                      onChange={(e) => {
                        const updated = {
                          ...form,
                          grammar: { ...form.grammar, plurals: e.target.value }
                        }
                        setForm(updated)
                        triggerAutoSave(updated)
                      }}
                      placeholder="Describe how plurals are formed..."
                      rows={3}
                      className="rounded-lg resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RELATIONSHIPS TAB */}
            <TabsContent value="relationships" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Related Elements</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-gray-500">Link to characters, locations, factions, items, systems, or other languages that use or relate to this language.</p>
                  
                  {/* Existing Links */}
                  {(form.links && form.links.length > 0) ? (
                    <div className="space-y-2 mb-4">
                      {form.links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{link.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">{link.type}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const updated = {
                                ...form,
                                links: (form.links || []).filter((_, i) => i !== idx)
                              }
                              setForm(updated)
                              triggerAutoSave(updated)
                              addToast({
                                type: 'success',
                                title: 'Link removed',
                                message: `Removed link to ${link.name}`
                              })
                            }}
                            className="hover:bg-red-50 text-red-600 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <LinkIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No relationships added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add links to connect this language with other elements</p>
                    </div>
                  )}

                  {/* Add Link Section - Placeholder for future implementation */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic">Note: Use the link picker in the main interface to add relationships to other elements.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle>Media & Attachments</CardTitle>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      className="rounded-lg"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input 
                      id="media-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length === 0) return

                        if (!languageId) {
                          addToast({
                            type: 'error',
                            title: 'Save first',
                            message: 'Please save the language before uploading images'
                          })
                          return
                        }

                        addToast({
                          type: 'info',
                          title: 'Uploading...',
                          message: `Uploading ${files.length} image(s)`
                        })

                        try {
                          const supabase = createSupabaseClient()
                          const uploadedImages = []

                          for (const file of files) {
                            if (!file.type.startsWith('image/')) {
                              console.warn('Skipping non-image file:', file.name)
                              continue
                            }

                            const fileExt = file.name.split('.').pop()
                            const fileName = `${crypto.randomUUID()}.${fileExt}`
                            const filePath = `${languageId}/${fileName}`

                            const { error: uploadError } = await supabase.storage
                              .from('language-images')
                              .upload(filePath, file)

                            if (uploadError) {
                              console.error('Upload error:', uploadError)
                              continue
                            }

                            const { data: { publicUrl } } = supabase.storage
                              .from('language-images')
                              .getPublicUrl(filePath)

                            uploadedImages.push({
                              id: crypto.randomUUID(),
                              url: publicUrl,
                              caption: file.name.replace(/\.[^/.]+$/, ''), // filename without extension
                              isCover: false
                            })
                          }

                          if (uploadedImages.length > 0) {
                            const updatedForm = {
                              ...form,
                              images: [...(form.images || []), ...uploadedImages]
                            }
                            setForm(updatedForm)
                            triggerAutoSave(updatedForm)

                            addToast({
                              type: 'success',
                              title: 'Upload complete',
                              message: `Successfully uploaded ${uploadedImages.length} image(s)`
                            })
                          } else {
                            addToast({
                              type: 'error',
                              title: 'Upload failed',
                              message: 'No images were uploaded successfully'
                            })
                          }
                        } catch (error) {
                          console.error('Upload error:', error)
                          addToast({
                            type: 'error',
                            title: 'Upload failed',
                            message: 'Could not upload images. Please try again.'
                          })
                        }

                        // Reset input
                        e.target.value = ''
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {!form.images || form.images.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-2">Upload calligraphy samples, charts, or reference images</p>
                      <p className="text-sm text-gray-500 mb-4">Drag & drop or click the button above</p>
                      <p className="text-xs text-gray-400">Supported formats: JPG, PNG, GIF, WebP</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {form.images.map((image, index) => (
                        <Card key={image.id} className="overflow-hidden group relative">
                          <div className="aspect-square bg-gray-100 relative">
                            <img 
                              src={image.url} 
                              alt={image.caption || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {image.isCover && (
                              <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
                                Cover
                              </Badge>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-background">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const updatedForm = {
                                        ...form,
                                        images: form.images?.map(img => ({
                                          ...img,
                                          isCover: img.id === image.id
                                        }))
                                      }
                                      setForm(updatedForm)
                                      triggerAutoSave(updatedForm)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Set as Cover
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const updatedForm = {
                                        ...form,
                                        images: form.images?.filter(img => img.id !== image.id)
                                      }
                                      setForm(updatedForm)
                                      triggerAutoSave(updatedForm)
                                    }}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {image.caption && (
                            <CardContent className="p-3">
                              <p className="text-sm text-gray-700 truncate">{image.caption}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Language?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{form.name}" and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

