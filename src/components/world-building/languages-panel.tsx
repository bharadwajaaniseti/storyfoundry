'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, MessageSquare, Search, Trash2, Edit3, ArrowLeft, X, Save, Link as LinkIcon, Filter, Grid3x3, List, Copy, MoreHorizontal, BookOpen, Upload } from 'lucide-react'
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
  tags: []
}

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
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'languages').order('created_at', { ascending: false })
      if (error) throw error
      setLanguages(data || [])
    } finally { setLoading(false) }
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

  const handleDelete = async (languageId: string) => {
    try {
      const { error } = await supabase.from('world_elements').delete().eq('id', languageId)
      if (error) throw error
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

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
    return date.toLocaleDateString()
  }

  // Apply search, sort, and filters
  const getFilteredAndSortedLanguages = () => {
    let result = [...languages]

    // Apply search query
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(lang =>
        lang.name.toLowerCase().includes(q) ||
        lang.description?.toLowerCase().includes(q) ||
        lang.attributes?.family?.toLowerCase().includes(q) ||
        lang.tags?.some((tag: string) => tag.toLowerCase().includes(q))
      )
    }

    // Apply family filters
    if (filters.families.length > 0) {
      result = result.filter(lang =>
        lang.attributes?.family && filters.families.includes(lang.attributes.family)
      )
    }

    // Apply status filters
    if (filters.statuses.length > 0) {
      result = result.filter(lang =>
        lang.attributes?.status && filters.statuses.includes(lang.attributes.status)
      )
    }

    // Apply writing system filters
    if (filters.writingSystems.length > 0) {
      result = result.filter(lang =>
        lang.attributes?.writing_system && filters.writingSystems.includes(lang.attributes.writing_system)
      )
    }

    // Apply sorting
    switch (sort) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'status':
        result.sort((a, b) => {
          const statusA = a.attributes?.status || ''
          const statusB = b.attributes?.status || ''
          return statusA.localeCompare(statusB)
        })
        break
    }

    return result
  }

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
                getRelativeTime={getRelativeTime}
              />
            ) : (
              <LanguagesTable 
                languages={filteredLanguages}
                onEdit={handleEdit}
                onDelete={(id: string) => setDeleteConfirm(id)}
                onDuplicate={handleDuplicate}
                getRelativeTime={getRelativeTime}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Language?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this language and all its data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Render WORKSPACE (create/edit)
  return <LanguageWorkspace 
    mode={mode}
    form={form}
    setForm={setForm}
    onSave={handleSaveLanguage}
    onCancel={handleCancel}
    languageStatuses={languageStatuses}
    writingSystems={writingSystems}
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
  getRelativeTime: (date: string) => string
}

function LanguagesGrid({ languages, onEdit, onDelete, onDuplicate, getRelativeTime }: LanguagesGridProps) {
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
                  className={`text-xs font-medium border ${getStatusColor(language.attributes.status)}`}
                >
                  {language.attributes.status}
                </Badge>
              )}
              {language.attributes?.writing_system && (
                <Badge variant="outline" className="text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800">
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
                <span className="font-medium">{getRelativeTime(language.updated_at)}</span>
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
  getRelativeTime: (date: string) => string
}

function LanguagesTable({ languages, onEdit, onDelete, onDuplicate, getRelativeTime }: LanguagesTableProps) {
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
                    className={`text-xs font-medium border ${getStatusColor(language.attributes.status)}`}
                  >
                    {language.attributes.status}
                  </Badge>
                ) : '—'}
              </TableCell>
              <TableCell className="text-gray-700">
                {language.attributes?.writing_system ? (
                  <Badge variant="outline" className="text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800">
                    {language.attributes.writing_system}
                  </Badge>
                ) : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {getRelativeTime(language.updated_at)}
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
  writingSystems
}: {
  mode: 'create' | 'edit'
  form: LanguageForm
  setForm: React.Dispatch<React.SetStateAction<LanguageForm>>
  onSave: () => void
  onCancel: () => void
  languageStatuses: string[]
  writingSystems: string[]
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
  writingSystems
}: {
  form: LanguageForm
  setForm: React.Dispatch<React.SetStateAction<LanguageForm>>
  onSave: () => void
  onCancel: () => void
  languageStatuses: string[]
  writingSystems: string[]
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [newWord, setNewWord] = useState<Partial<WordEntry>>({})
  const [newSymbol, setNewSymbol] = useState<Partial<SymbolEntry>>({})
  const [newWordType, setNewWordType] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  // Symbol Management
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
    setForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }))
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))
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
            <TabsContent value="overview" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="family">Language Family</Label>
                      <Input 
                        id="family" 
                        value={form.family || ''} 
                        onChange={(e) => setForm(prev => ({ ...prev, family: e.target.value }))} 
                        placeholder="e.g., Indo-European, Sino-Tibetan..." 
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speakers">Number of Speakers</Label>
                      <Input 
                        id="speakers" 
                        value={form.speakers || ''} 
                        onChange={(e) => setForm(prev => ({ ...prev, speakers: e.target.value }))} 
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
                        onValueChange={(value: any) => setForm(prev => ({ ...prev, status: value }))}
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
                        onValueChange={(value: any) => setForm(prev => ({ ...prev, writing_system: value }))}
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
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
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
                      onChange={(e) => setForm(prev => ({ ...prev, sample_text: e.target.value }))} 
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

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* DICTIONARY TAB */}
            <TabsContent value="dictionary" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Language Name *</Label>
                      <Input 
                        id="name" 
                        value={form.name} 
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
                        placeholder="Language name..." 
                      />
                    </div>
                    <div>
                      <Label htmlFor="family">Language Family</Label>
                      <Input 
                        id="family" 
                        value={form.family} 
                        onChange={(e) => setForm(prev => ({ ...prev, family: e.target.value }))} 
                        placeholder="e.g., Indo-European, Sino-Tibetan..." 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={form.description} 
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
                      placeholder="Describe this language..." 
                      rows={4} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={form.status} 
                        onValueChange={(value: any) => setForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="speakers">Number of Speakers</Label>
                      <Input 
                        id="speakers" 
                        value={form.speakers} 
                        onChange={(e) => setForm(prev => ({ ...prev, speakers: e.target.value }))} 
                        placeholder="e.g., 1 million, Few hundred..." 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sample_text">Sample Text/Phrases</Label>
                    <Textarea 
                      id="sample_text" 
                      value={form.sample_text} 
                      onChange={(e) => setForm(prev => ({ ...prev, sample_text: e.target.value }))} 
                      placeholder="Common phrases, greetings, or sample text in this language..." 
                      rows={4} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DICTIONARY TAB */}
            <TabsContent value="dictionary" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle>Dictionary & Vocabulary</CardTitle>
                    <Button 
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          words: [...(prev.words || []), { id: crypto.randomUUID(), term: '', pronunciation: '', type: '', definition: '', notes: '', examples: [] }]
                        }))
                      }}
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Word
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {(!form.words || form.words.length === 0) ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-4">No words yet</p>
                      <Button 
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            words: [{ id: crypto.randomUUID(), term: '', pronunciation: '', type: '', definition: '', notes: '', examples: [] }]
                          }))
                        }}
                        variant="outline"
                        className="rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Word
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.words.map((word, index) => (
                        <Card key={index} className="rounded-lg border-gray-200">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label>Term</Label>
                                <Input 
                                  value={word.term}
                                  onChange={(e) => {
                                    const newWords = [...(form.words || [])]
                                    newWords[index] = { ...newWords[index], term: e.target.value }
                                    setForm(prev => ({ ...prev, words: newWords }))
                                  }}
                                  placeholder="Word in your language"
                                  className="rounded-lg"
                                />
                              </div>
                              <div>
                                <Label>Definition</Label>
                                <Input 
                                  value={word.definition}
                                  onChange={(e) => {
                                    const newWords = [...(form.words || [])]
                                    newWords[index] = { ...newWords[index], definition: e.target.value }
                                    setForm(prev => ({ ...prev, words: newWords }))
                                  }}
                                  placeholder="English definition"
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label>Type</Label>
                                <Input 
                                  value={word.type || ''}
                                  onChange={(e) => {
                                    const newWords = [...(form.words || [])]
                                    newWords[index] = { ...newWords[index], type: e.target.value }
                                    setForm(prev => ({ ...prev, words: newWords }))
                                  }}
                                  placeholder="e.g., noun, verb, adjective"
                                  className="rounded-lg"
                                />
                              </div>
                              <div>
                                <Label>Pronunciation (IPA)</Label>
                                <Input 
                                  value={word.pronunciation || ''}
                                  onChange={(e) => {
                                    const newWords = [...(form.words || [])]
                                    newWords[index] = { ...newWords[index], pronunciation: e.target.value }
                                    setForm(prev => ({ ...prev, words: newWords }))
                                  }}
                                  placeholder="e.g., /fəˈnɛtɪk/"
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <Label>Notes</Label>
                              <Textarea 
                                value={word.notes || ''}
                                onChange={(e) => {
                                  const newWords = [...(form.words || [])]
                                  newWords[index] = { ...newWords[index], notes: e.target.value }
                                  setForm(prev => ({ ...prev, words: newWords }))
                                }}
                                placeholder="Etymology, usage context, cultural notes..."
                                rows={2}
                                className="rounded-lg resize-none"
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newWords = (form.words || []).filter((_, i) => i !== index)
                                  setForm(prev => ({ ...prev, words: newWords }))
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Word
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* SCRIPT TAB */}
            <TabsContent value="script" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle>Writing System & Symbols</CardTitle>
                    <Button 
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          symbols: [...(prev.symbols || []), { id: crypto.randomUUID(), glyph: '', romanization: '', sound: '', tags: [], image: '' }]
                        }))
                      }}
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Symbol
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Writing System Type */}
                  <div>
                    <Label htmlFor="writing_system">Writing System Type</Label>
                    <Select 
                      value={form.writing_system} 
                      onValueChange={(value: any) => setForm(prev => ({ ...prev, writing_system: value }))}
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

                  {/* Symbols List */}
                  {(!form.symbols || form.symbols.length === 0) ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-4">No symbols yet</p>
                      <Button 
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            symbols: [{ id: crypto.randomUUID(), glyph: '', romanization: '', sound: '', tags: [], image: '' }]
                          }))
                        }}
                        variant="outline"
                        className="rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Symbol
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.symbols.map((symbol, index) => (
                        <Card key={index} className="rounded-lg border-gray-200">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <Label>Glyph/Character</Label>
                                <Input 
                                  value={symbol.glyph}
                                  onChange={(e) => {
                                    const newSymbols = [...(form.symbols || [])]
                                    newSymbols[index] = { ...newSymbols[index], glyph: e.target.value }
                                    setForm(prev => ({ ...prev, symbols: newSymbols }))
                                  }}
                                  placeholder="The symbol itself"
                                  className="rounded-lg text-2xl text-center"
                                />
                              </div>
                              <div>
                                <Label>Romanization</Label>
                                <Input 
                                  value={symbol.romanization}
                                  onChange={(e) => {
                                    const newSymbols = [...(form.symbols || [])]
                                    newSymbols[index] = { ...newSymbols[index], romanization: e.target.value }
                                    setForm(prev => ({ ...prev, symbols: newSymbols }))
                                  }}
                                  placeholder="Latin alphabet equivalent"
                                  className="rounded-lg"
                                />
                              </div>
                              <div>
                                <Label>Sound (IPA)</Label>
                                <Input 
                                  value={symbol.sound || ''}
                                  onChange={(e) => {
                                    const newSymbols = [...(form.symbols || [])]
                                    newSymbols[index] = { ...newSymbols[index], sound: e.target.value }
                                    setForm(prev => ({ ...prev, symbols: newSymbols }))
                                  }}
                                  placeholder="e.g., /a/"
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSymbols = (form.symbols || []).filter((_, i) => i !== index)
                                  setForm(prev => ({ ...prev, symbols: newSymbols }))
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Symbol
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
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
                        placeholder="Add vowel..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            addToArray('phonology.vowels', input.value)
                            input.value = ''
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
                          onClick={() => removeFromArray('phonology.vowels', vowel)}
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
                        placeholder="Add consonant..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            addToArray('phonology.consonants', input.value)
                            input.value = ''
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
                          onClick={() => removeFromArray('phonology.consonants', consonant)}
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
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        phonology: { ...prev.phonology, syllableStructure: e.target.value }
                      }))}
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
                      <Input 
                        id="wordOrder"
                        value={form.grammar?.wordOrder || ''}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          grammar: { ...prev.grammar, wordOrder: e.target.value }
                        }))}
                        placeholder="e.g., SVO, SOV, VSO..."
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="morphology">Morphology</Label>
                      <Input 
                        id="morphology"
                        value={form.grammar?.morphology || ''}
                        onChange={(e) => setForm(prev => ({
                          ...prev,
                          grammar: { ...prev.grammar, morphology: e.target.value }
                        }))}
                        placeholder="e.g., agglutinative, fusional..."
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Tenses */}
                  <div>
                    <Label>Tenses</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="Add tense..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            addToArray('grammar.tenses', input.value)
                            input.value = ''
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
                          onClick={() => removeFromArray('grammar.tenses', tense)}
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
                        placeholder="Add case..."
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget
                            addToArray('grammar.cases', input.value)
                            input.value = ''
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
                          onClick={() => removeFromArray('grammar.cases', grammarCase)}
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
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        grammar: { ...prev.grammar, plurals: e.target.value }
                      }))}
                      placeholder="Describe how plurals are formed..."
                      rows={3}
                      className="rounded-lg resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* RELATIONSHIPS TAB */}
            <TabsContent value="relationships" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Related Elements</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-500 mb-4">Link to characters, locations, factions, etc. that use this language</p>
                  <div className="space-y-2">
                    {(form.links || []).map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{link.name}</span>
                          <Badge variant="outline" className="text-xs">{link.type}</Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            links: (prev.links || []).filter((_, i) => i !== idx)
                          }))}
                          className="hover:bg-red-50 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {(!form.links || form.links.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No links added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="mt-0 space-y-6">
              <Card className="rounded-xl border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle>Media & Attachments</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 mb-4">No media uploaded yet</p>
                    <Button variant="outline" className="rounded-lg">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image or File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={onSave} 
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                  disabled={!form.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
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

