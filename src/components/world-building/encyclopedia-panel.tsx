'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit3, Trash2, BookOpen, Tag, 
  FileText, User, MapPin, Package, Calendar,
  Zap, Globe, Cog, Save, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/lib/auth'

interface EncyclopediaEntry {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: {
    type: string
    definition: string
    pronunciation?: string
    etymology?: string
    origin?: string
    related_terms?: string
    examples?: string
  }
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

interface EncyclopediaPanelProps {
  projectId: string
  selectedElement?: any | null  // WorldElement from sidebar
  onEncyclopediaChange?: () => void
}

export default function EncyclopediaPanel({ projectId, selectedElement, onEncyclopediaChange }: EncyclopediaPanelProps) {
  const [entries, setEntries] = useState<EncyclopediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')

  const supabase = createSupabaseClient()

  // Entry types with icons
  const entryTypes = [
    { id: 'concept', label: 'Concept', icon: FileText, color: 'text-blue-600' },
    { id: 'person', label: 'Person', icon: User, color: 'text-green-600' },
    { id: 'place', label: 'Place', icon: MapPin, color: 'text-purple-600' },
    { id: 'object', label: 'Object', icon: Package, color: 'text-orange-600' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-red-600' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-indigo-600' },
    { id: 'culture', label: 'Culture', icon: Zap, color: 'text-pink-600' },
    { id: 'technology', label: 'Technology', icon: Cog, color: 'text-gray-600' }
  ]

  useEffect(() => {
    fetchEntries()
  }, [projectId])

  // Handle selectedElement from sidebar
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'encyclopedia') {
      // Find the entry in our current entries or set it directly if it's already loaded
      const existingEntry = entries.find(entry => entry.id === selectedElement.id)
      if (existingEntry) {
        setSelectedEntry(existingEntry)
        setIsEditing(false)
      } else if (selectedElement.id) {
        // Convert the sidebar element to encyclopedia entry format
        const encyclopediaEntry: EncyclopediaEntry = {
          id: selectedElement.id,
          project_id: selectedElement.project_id,
          category: selectedElement.category,
          name: selectedElement.name,
          description: selectedElement.description,
          attributes: selectedElement.attributes || {},
          tags: selectedElement.tags || [],
          created_at: selectedElement.created_at,
          updated_at: selectedElement.updated_at
        }
        setSelectedEntry(encyclopediaEntry)
        setIsEditing(false)
      }
    }
  }, [selectedElement, entries])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'encyclopedia')
        .order('name', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching encyclopedia entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewEntry = () => {
    // Create a temporary entry that hasn't been saved to database yet
    const tempEntry: EncyclopediaEntry = {
      id: `temp-${Date.now()}`, // Temporary ID
      project_id: projectId,
      category: 'encyclopedia',
      name: 'New Encyclopedia',
      description: '',
      attributes: {
        type: 'concept',
        definition: '',
        pronunciation: '',
        etymology: '',
        origin: '',
        related_terms: '',
        examples: ''
      },
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSelectedEntry(tempEntry)
    setIsEditing(true)
  }

  const saveEntry = async (entryToSave: EncyclopediaEntry) => {
    try {
      const isNewEntry = entryToSave.id.startsWith('temp-')
      
      if (isNewEntry) {
        // Create new entry in database
        const { id, created_at, updated_at, ...entryData } = entryToSave
        
        const { data, error } = await supabase
          .from('world_elements')
          .insert(entryData)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setEntries(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
          setSelectedEntry(data)
          setIsEditing(false)
          onEncyclopediaChange?.()
        }
      } else {
        // Update existing entry
        const { data, error } = await supabase
          .from('world_elements')
          .update({
            name: entryToSave.name,
            description: entryToSave.description,
            attributes: entryToSave.attributes,
            tags: entryToSave.tags,
            image_url: entryToSave.image_url
          })
          .eq('id', entryToSave.id)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setEntries(prev => 
            prev.map(entry => entry.id === data.id ? data : entry)
              .sort((a, b) => a.name.localeCompare(b.name))
          )
          setSelectedEntry(data)
          setIsEditing(false)
          onEncyclopediaChange?.()
        }
      }
    } catch (error) {
      console.error('Error saving encyclopedia entry:', error)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.id !== entryId))
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null)
        setIsEditing(false)
      }
      
      onEncyclopediaChange?.()
    } catch (error) {
      console.error('Error deleting encyclopedia entry:', error)
    }
  }

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.attributes?.definition && entry.attributes.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || entry.attributes?.type === selectedType
    
    return matchesSearch && matchesType
  })

  const getTypeInfo = (type: string) => {
    return entryTypes.find(t => t.id === type) || entryTypes[0]
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading encyclopedia...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header with controls - Only show when not viewing/editing an entry */}
      {!selectedEntry && (
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-orange-600" />
              Encyclopedia
            </h3>
            <div className="flex items-center gap-4">
              {/* Search and Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  {entryTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={createNewEntry}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Encyclopedia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEntry ? (
          <>
            {/* Article Header */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {(() => {
                    const typeInfo = getTypeInfo(selectedEntry.attributes?.type)
                    const IconComponent = typeInfo.icon
                    return <IconComponent className={`w-5 h-5 mt-0.5 ${typeInfo.color}`} />
                  })()}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedEntry.name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded ${
                        selectedEntry.attributes?.type === 'concept' ? 'bg-blue-100 text-blue-700' :
                        selectedEntry.attributes?.type === 'person' ? 'bg-green-100 text-green-700' :
                        selectedEntry.attributes?.type === 'place' ? 'bg-purple-100 text-purple-700' :
                        selectedEntry.attributes?.type === 'object' ? 'bg-orange-100 text-orange-700' :
                        selectedEntry.attributes?.type === 'event' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getTypeInfo(selectedEntry.attributes?.type).label}
                      </span>
                      {selectedEntry.attributes?.pronunciation && (
                        <span className="italic">
                          /{selectedEntry.attributes.pronunciation}/
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 text-sm font-medium"
                  >
                    ← Back to Articles
                  </Button>
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // If it's a new unsaved entry, go back to the list view
                          if (selectedEntry?.id.startsWith('temp-')) {
                            setSelectedEntry(null)
                          } else {
                            // For existing entries, just exit edit mode
                            const currentEntry = entries.find(e => e.id === selectedEntry.id)
                            if (currentEntry) setSelectedEntry(currentEntry)
                          }
                          setIsEditing(false)
                        }}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 text-sm font-medium"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEntry(selectedEntry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <EncyclopediaEntryEditor
                  entry={selectedEntry}
                  onSave={saveEntry}
                  onCancel={() => {
                    // If it's a new unsaved entry, go back to the list view
                    if (selectedEntry?.id.startsWith('temp-')) {
                      setSelectedEntry(null)
                    }
                    setIsEditing(false)
                  }}
                />
              ) : (
                <EncyclopediaEntryViewer entry={selectedEntry} />
              )}
            </div>
          </>
        ) : (
          /* Articles List View */
          <div className="flex-1 overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    {searchTerm || selectedType !== 'all' 
                      ? 'No articles match your filters' 
                      : 'No encyclopedia articles yet'
                    }
                  </h3>
                  <p className="text-sm mb-4 text-gray-400">
                    {searchTerm || selectedType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start building your world knowledge base'
                    }
                  </p>
                  <Button 
                    onClick={createNewEntry}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Encyclopedia
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredEntries.map(entry => {
                    const typeInfo = getTypeInfo(entry.attributes?.type)
                    const IconComponent = typeInfo.icon
                    return (
                      <EncyclopediaCard
                        key={entry.id}
                        entry={entry}
                        typeInfo={typeInfo}
                        IconComponent={IconComponent}
                        onClick={() => {
                          setSelectedEntry(entry)
                          setIsEditing(false)
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Encyclopedia Card Component (simplified without Visual Web)
const EncyclopediaCard = React.memo(({ 
  entry, 
  typeInfo, 
  IconComponent,
  onClick 
}: { 
  entry: EncyclopediaEntry
  typeInfo: any
  IconComponent: any
  onClick: () => void
}) => {
  return (
    <div 
      className="group relative overflow-hidden border border-gray-200/60 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 ease-out bg-white/80 backdrop-blur-sm hover:bg-white hover:border-orange-200 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-amber-50/0 to-yellow-50/0 group-hover:from-orange-50/30 group-hover:via-amber-50/20 group-hover:to-yellow-50/10 transition-all duration-500 rounded-2xl" />
      
      {/* Card Header */}
      <div className="relative z-10 p-4 border-b border-gray-100 group-hover:border-orange-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo.bgColor} ${typeInfo.borderColor} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md`}>
            <IconComponent className={`w-5 h-5 ${typeInfo.color} transition-colors duration-300`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-base mb-1 group-hover:text-gray-800 transition-colors duration-300">
              {entry.name}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs rounded ${
              typeInfo.id === 'concept' ? 'bg-blue-100 text-blue-700' :
              typeInfo.id === 'person' ? 'bg-green-100 text-green-700' :
              typeInfo.id === 'place' ? 'bg-purple-100 text-purple-700' :
              typeInfo.id === 'object' ? 'bg-orange-100 text-orange-700' :
              typeInfo.id === 'event' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            } group-hover:scale-105 transition-transform duration-300`}>
              {typeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-4">
        <div className="space-y-3">
          {entry.attributes?.definition && (
            <div className="bg-gray-50/70 rounded-xl p-3 group-hover:bg-white/70 transition-all duration-300 border border-gray-100 group-hover:border-gray-200">
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 line-clamp-3 leading-relaxed">
                {entry.attributes.definition}
              </p>
            </div>
          )}
          
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-white/60 text-gray-600 text-xs rounded-full group-hover:bg-white/80 transition-all duration-300 shadow-sm group-hover:shadow-md border border-gray-200/40"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-0.5 group-hover:text-gray-500 transition-colors duration-300">
                  +{entry.tags.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {!entry.attributes?.definition && entry.tags.length === 0 && (
            <div className="text-center py-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors duration-300">
                <IconComponent className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-600 transition-colors duration-300">
                Click to add details
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  )
})

EncyclopediaCard.displayName = "EncyclopediaCard"

// Entry Editor Component
function EncyclopediaEntryEditor({ 
  entry, 
  onSave, 
  onCancel 
}: { 
  entry: EncyclopediaEntry
  onSave: (entry: EncyclopediaEntry) => void
  onCancel: () => void
}) {
  const [editedEntry, setEditedEntry] = useState<EncyclopediaEntry>(entry)
  const [currentStep, setCurrentStep] = useState(1)

  const entryTypes = [
    { id: 'concept', label: 'Concept', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'person', label: 'Person', icon: User, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'place', label: 'Place', icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'object', label: 'Object', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    { id: 'culture', label: 'Culture', icon: Zap, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
    { id: 'technology', label: 'Technology', icon: Cog, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
  ]

  const steps = [
    { id: 1, title: 'Basics', icon: FileText, description: 'Essential information' },
    { id: 2, title: 'Definition', icon: BookOpen, description: 'Core meaning & description' },
    { id: 3, title: 'Context', icon: Globe, description: 'History & connections' }
  ]

  const handleSave = () => {
    onSave(editedEntry)
  }

  const updateAttribute = (key: string, value: string) => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }))
  }

  const selectedType = entryTypes.find(t => t.id === (editedEntry.attributes?.type || 'concept'))
  const SelectedIcon = selectedType?.icon || FileText

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto px-6 py-0 w-full flex flex-col">
        {/* Step Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {currentStep === 1 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  Essential Information
                </h3>
                <p className="text-orange-100 text-sm">The foundation of your encyclopedia entry</p>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Title Field */}
                  <div className="xl:col-span-3">
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Entry Title *
                    </label>
                    <Input
                      value={editedEntry.name}
                      onChange={(e) => setEditedEntry({...editedEntry, name: e.target.value})}
                      placeholder="Enter an engaging title..."
                      className="h-14 text-xl font-semibold border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-6"
                    />
                  </div>
                  
                  {/* Entry Type Selection */}
                  <div className="xl:col-span-2">
                    <label className="block text-lg font-bold text-gray-900 mb-4">
                      Choose Entry Type
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {entryTypes.map(type => {
                        const TypeIcon = type.icon
                        const isSelected = editedEntry.attributes?.type === type.id
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => updateAttribute('type', type.id)}
                            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              isSelected 
                                ? `${type.bgColor} ${type.borderColor} shadow-lg ring-2 ring-opacity-20` 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-md hover:shadow-lg'
                            }`}
                          >
                            <TypeIcon className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isSelected ? type.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <div className={`text-sm font-bold transition-all duration-300 ${isSelected ? type.color : 'text-gray-600 group-hover:text-gray-800'}`}>
                              {type.label}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Pronunciation */}
                    <div className="space-y-3">
                      <label className="block text-lg font-bold text-gray-900">
                        Pronunciation
                      </label>
                      <Input
                        value={editedEntry.attributes?.pronunciation || ''}
                        onChange={(e) => updateAttribute('pronunciation', e.target.value)}
                        placeholder="/pronunciation/"
                        className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4"
                      />
                      <p className="text-sm text-gray-500">Phonetic guide (e.g., /ˈwɜːrdə/)</p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                      <label className="block text-lg font-bold text-gray-900">
                        Tags & Keywords
                      </label>
                      <Input
                        value={editedEntry.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          setEditedEntry({...editedEntry, tags})
                        }}
                        placeholder="magic, ancient, powerful..."
                        className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4"
                      />
                      <p className="text-sm text-gray-500">Separate with commas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-white" />
                  Definition & Description
                </h3>
                <p className="text-blue-100 text-sm">Explain what it is and bring it to life</p>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  <div className="space-y-4 flex flex-col">
                    <label className="block text-lg font-bold text-gray-900">
                      Core Definition *
                    </label>
                    <Textarea
                      value={editedEntry.attributes?.definition || ''}
                      onChange={(e) => updateAttribute('definition', e.target.value)}
                      placeholder="Provide a clear, concise definition that captures the essence..."
                      className="flex-1 min-h-48 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none rounded-xl p-4 text-base"
                    />
                    <p className="text-sm text-gray-500">A brief, dictionary-style definition</p>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <label className="block text-lg font-bold text-gray-900">
                      Rich Description
                    </label>
                    <Textarea
                      value={editedEntry.description}
                      onChange={(e) => setEditedEntry({...editedEntry, description: e.target.value})}
                      placeholder="Paint a vivid picture with rich details, context, and world-building depth..."
                      className="flex-1 min-h-48 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none rounded-xl p-4 text-base"
                    />
                    <p className="text-sm text-gray-500">Elaborate with storytelling details</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-white" />
                  History & Connections
                </h3>
                <p className="text-emerald-100 text-sm">Origins, etymology, and world connections</p>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  <div className="space-y-6 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Origin Story
                      </label>
                      <Textarea
                        value={editedEntry.attributes?.origin || ''}
                        onChange={(e) => updateAttribute('origin', e.target.value)}
                        placeholder="Where and how did this come to be?"
                        className="h-32 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl p-4"
                      />
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Etymology
                      </label>
                      <Textarea
                        value={editedEntry.attributes?.etymology || ''}
                        onChange={(e) => updateAttribute('etymology', e.target.value)}
                        placeholder="How did the name evolve?"
                        className="h-32 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl p-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Related Terms
                      </label>
                      <Textarea
                        value={editedEntry.attributes?.related_terms || ''}
                        onChange={(e) => updateAttribute('related_terms', e.target.value)}
                        placeholder="Connected concepts, synonyms, contrasts..."
                        className="h-32 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl p-4"
                      />
                    </div>

                    <div className="space-y-3 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Examples & Usage
                      </label>
                      <Textarea
                        value={editedEntry.attributes?.examples || ''}
                        onChange={(e) => updateAttribute('examples', e.target.value)}
                        placeholder="Show this element in action..."
                        className="h-32 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl p-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-2 mt-1 flex-shrink-0">
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="px-6 py-3 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl"
              >
                ← Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button 
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl"
              >
                Next Step →
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {editedEntry.id.startsWith('temp-') ? 'Create Entry' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Entry Viewer Component  
function EncyclopediaEntryViewer({ entry }: { entry: EncyclopediaEntry }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        
        {/* Definition - Hero Block (spans full width) */}
        {entry.attributes?.definition && (
          <div className="col-span-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Definition</h2>
                <p className="text-xl leading-relaxed font-medium text-blue-50">
                  {entry.attributes.definition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Description Block - Large */}
        {entry.description && (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Detailed Description</h3>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {entry.description}
              </p>
            </div>
          </div>
        )}

        {/* Tags - Compact Side Block */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
                <Tag className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Origin Block - Medium */}
        {entry.attributes?.origin && (
          <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-200 rounded-2xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="text-lg font-bold text-purple-900">Origin Story</h3>
            </div>
            <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">
              {entry.attributes.origin}
            </p>
          </div>
        )}

        {/* Etymology Block - Medium */}
        {entry.attributes?.etymology && (
          <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl p-6 shadow-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-200 rounded-2xl flex items-center justify-center">
                <span className="text-indigo-700 text-sm font-bold">Et</span>
              </div>
              <h3 className="text-lg font-bold text-indigo-900">Etymology</h3>
            </div>
            <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">
              {entry.attributes.etymology}
            </p>
          </div>
        )}

        {/* Related Terms - Wide Block */}
        {entry.attributes?.related_terms && (
          <div className="col-span-12 lg:col-span-7 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-200 rounded-2xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Related Terms & Concepts</h3>
            </div>
            <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">
              {entry.attributes.related_terms}
            </p>
          </div>
        )}

        {/* Examples - Compact Block */}
        {entry.attributes?.examples && (
          <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 shadow-lg border border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-200 rounded-2xl flex items-center justify-center">
                <span className="text-amber-700 text-sm font-bold">Ex</span>
              </div>
              <h3 className="text-lg font-bold text-amber-900">Examples & Usage</h3>
            </div>
            <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">
              {entry.attributes.examples}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}