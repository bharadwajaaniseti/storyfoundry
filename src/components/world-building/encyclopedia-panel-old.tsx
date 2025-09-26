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
}

export default function EncyclopediaPanel({ projectId }: EncyclopediaPanelProps) {
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

  const createNewEntry = async () => {
    try {
      const newEntry = {
        project_id: projectId,
        category: 'encyclopedia',
        name: 'New Article',
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
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newEntry)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setEntries(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedEntry(data)
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error creating encyclopedia entry:', error)
    }
  }

  const updateEntry = async (updatedEntry: EncyclopediaEntry) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .update({
          name: updatedEntry.name,
          description: updatedEntry.description,
          attributes: updatedEntry.attributes,
          tags: updatedEntry.tags,
          image_url: updatedEntry.image_url
        })
        .eq('id', updatedEntry.id)
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
      }
    } catch (error) {
      console.error('Error updating encyclopedia entry:', error)
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
      {/* Header with controls */}
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
              New Article
            </Button>
          </div>
        </div>
      </div>

        {selectedEntry ? (
          <>
            {/* Article Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {(() => {
                    const typeInfo = getTypeInfo(selectedEntry.attributes?.type)
                    const IconComponent = typeInfo.icon
                    return <IconComponent className={`w-6 h-6 mt-1 ${typeInfo.color}`} />
                  })()}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
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
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEntry(null)}
                  >
                    ← Back to Articles
                  </Button>
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false)
                          // Refresh the entry data
                          const currentEntry = entries.find(e => e.id === selectedEntry.id)
                          if (currentEntry) setSelectedEntry(currentEntry)
                        }}
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
                  onSave={updateEntry}
                  onCancel={() => setIsEditing(false)}
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
                    Create First Article
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
                      <button
                        key={entry.id}
                        onClick={() => {
                          setSelectedEntry(entry)
                          setIsEditing(false)
                        }}
                        className="text-left p-6 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <IconComponent className={`w-5 h-5 mt-0.5 ${typeInfo.color} group-hover:scale-110 transition-transform`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate text-lg mb-1">
                              {entry.name}
                            </div>
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              typeInfo.id === 'concept' ? 'bg-blue-100 text-blue-700' :
                              typeInfo.id === 'person' ? 'bg-green-100 text-green-700' :
                              typeInfo.id === 'place' ? 'bg-purple-100 text-purple-700' :
                              typeInfo.id === 'object' ? 'bg-orange-100 text-orange-700' :
                              typeInfo.id === 'event' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                        
                        {entry.attributes?.definition && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                            {entry.attributes.definition}
                          </p>
                        )}
                        
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{entry.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </button>
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

  const entryTypes = [
    { id: 'concept', label: 'Concept' },
    { id: 'person', label: 'Person' },
    { id: 'place', label: 'Place' },
    { id: 'object', label: 'Object' },
    { id: 'event', label: 'Event' },
    { id: 'language', label: 'Language' },
    { id: 'culture', label: 'Culture' },
    { id: 'technology', label: 'Technology' }
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Title *
              </label>
              <Input
                value={editedEntry.name}
                onChange={(e) => setEditedEntry({...editedEntry, name: e.target.value})}
                placeholder="Enter article title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={editedEntry.attributes?.type || 'concept'}
                onChange={(e) => updateAttribute('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {entryTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pronunciation
              </label>
              <Input
                value={editedEntry.attributes?.pronunciation || ''}
                onChange={(e) => updateAttribute('pronunciation', e.target.value)}
                placeholder="How is it pronounced?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                value={editedEntry.tags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  setEditedEntry({...editedEntry, tags})
                }}
                placeholder="Enter tags separated by commas..."
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Definition *
            </label>
            <Textarea
              value={editedEntry.attributes?.definition || ''}
              onChange={(e) => updateAttribute('definition', e.target.value)}
              placeholder="Provide a clear, concise definition..."
              className="h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={editedEntry.description}
              onChange={(e) => setEditedEntry({...editedEntry, description: e.target.value})}
              placeholder="Additional details, context, and expanded information..."
              className="h-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin
              </label>
              <Textarea
                value={editedEntry.attributes?.origin || ''}
                onChange={(e) => updateAttribute('origin', e.target.value)}
                placeholder="Where does it come from?"
                className="h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etymology
              </label>
              <Textarea
                value={editedEntry.attributes?.etymology || ''}
                onChange={(e) => updateAttribute('etymology', e.target.value)}
                placeholder="Word origin and historical development..."
                className="h-20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Terms
            </label>
            <Textarea
              value={editedEntry.attributes?.related_terms || ''}
              onChange={(e) => updateAttribute('related_terms', e.target.value)}
              placeholder="Related concepts, synonyms, antonyms..."
              className="h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examples & Usage
            </label>
            <Textarea
              value={editedEntry.attributes?.examples || ''}
              onChange={(e) => updateAttribute('examples', e.target.value)}
              placeholder="Examples of how it's used in your world..."
              className="h-24"
            />
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// Entry Viewer Component  
function EncyclopediaEntryViewer({ entry }: { entry: EncyclopediaEntry }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Definition */}
        {entry.attributes?.definition && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Definition</h3>
            <p className="text-blue-800 text-lg leading-relaxed">
              {entry.attributes.definition}
            </p>
          </div>
        )}

        {/* Description */}
        {entry.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.description}
              </p>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entry.attributes?.origin && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Origin</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {entry.attributes.origin}
              </p>
            </div>
          )}

          {entry.attributes?.etymology && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Etymology</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {entry.attributes.etymology}
              </p>
            </div>
          )}
        </div>

        {entry.attributes?.related_terms && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Related Terms</h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {entry.attributes.related_terms}
            </p>
          </div>
        )}

        {entry.attributes?.examples && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Examples & Usage</h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {entry.attributes.examples}
            </p>
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}