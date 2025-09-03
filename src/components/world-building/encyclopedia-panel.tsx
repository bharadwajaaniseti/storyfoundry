'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit3, Trash2, BookOpen, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/lib/auth'

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

interface EncyclopediaPanelProps {
  projectId: string
}

export default function EncyclopediaPanel({ projectId }: EncyclopediaPanelProps) {
  const [entries, setEntries] = useState<WorldElement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<WorldElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorldElement | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchEntries()
  }, [projectId])

  const fetchEntries = async () => {
    try {
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

  const createEntry = async (entryData: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'encyclopedia',
          name: entryData.name || 'New Entry',
          description: entryData.description || '',
          attributes: {
            type: entryData.attributes?.type || 'concept',
            definition: entryData.attributes?.definition || '',
            origin: entryData.attributes?.origin || '',
            related_terms: entryData.attributes?.related_terms || '',
            pronunciation: entryData.attributes?.pronunciation || '',
            etymology: entryData.attributes?.etymology || '',
            examples: entryData.attributes?.examples || ''
          },
          tags: entryData.tags || []
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEntries(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedEntry(data)
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating encyclopedia entry:', error)
    }
  }

  const updateEntry = async (id: string, updates: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEntries(prev => prev.map(entry => entry.id === id ? data : entry).sort((a, b) => a.name.localeCompare(b.name)))
        if (selectedEntry?.id === id) {
          setSelectedEntry(data)
        }
      }
    } catch (error) {
      console.error('Error updating encyclopedia entry:', error)
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEntries(prev => prev.filter(entry => entry.id !== id))
      if (selectedEntry?.id === id) {
        setSelectedEntry(null)
      }
    } catch (error) {
      console.error('Error deleting encyclopedia entry:', error)
    }
  }

  const getEntryTypes = () => {
    const types = new Set(entries.map(entry => entry.attributes.type || 'concept'))
    return Array.from(types).sort()
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.attributes.definition && entry.attributes.definition.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || entry.attributes.type === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleCreateNew = () => {
    setIsCreating(true)
    setEditingEntry({
      id: '',
      project_id: projectId,
      category: 'encyclopedia',
      name: '',
      description: '',
      attributes: {
        type: 'concept',
        definition: '',
        origin: '',
        related_terms: '',
        pronunciation: '',
        etymology: '',
        examples: ''
      },
      tags: [],
      created_at: '',
      updated_at: ''
    })
    setSelectedEntry(null)
  }

  const handleSave = () => {
    if (!editingEntry) return

    if (isCreating) {
      createEntry(editingEntry)
    } else {
      updateEntry(editingEntry.id, editingEntry)
    }
    setEditingEntry(null)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingEntry(null)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'concept': 'bg-blue-100 text-blue-800',
      'person': 'bg-green-100 text-green-800',
      'place': 'bg-purple-100 text-purple-800',
      'object': 'bg-orange-100 text-orange-800',
      'event': 'bg-red-100 text-red-800',
      'language': 'bg-indigo-100 text-indigo-800',
      'culture': 'bg-pink-100 text-pink-800',
      'technology': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading encyclopedia...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex">
      {/* Entries List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Encyclopedia</h3>
            <Button 
              size="sm"
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Entry
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              {getEntryTypes().map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="mb-2">No encyclopedia entries yet</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNew}
              >
                Create your first entry
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntry(entry)
                    setEditingEntry(null)
                    setIsCreating(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedEntry?.id === entry.id
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="font-medium truncate">{entry.name}</div>
                        <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ml-2 ${getTypeColor(entry.attributes.type)}`}>
                          {entry.attributes.type}
                        </span>
                      </div>
                      {entry.attributes.definition && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {entry.attributes.definition}
                        </div>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{entry.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className="flex-1 flex flex-col">
        {editingEntry ? (
          // Edit/Create Form
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Create New Entry' : 'Edit Entry'}
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isCreating ? 'Create Entry' : 'Save Changes'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term/Name *
                  </label>
                  <Input
                    value={editingEntry.name}
                    onChange={(e) => setEditingEntry({...editingEntry, name: e.target.value})}
                    placeholder="Enter the term or name..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={editingEntry.attributes.type || 'concept'}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry, 
                      attributes: {...editingEntry.attributes, type: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="concept">Concept</option>
                    <option value="person">Person</option>
                    <option value="place">Place</option>
                    <option value="object">Object</option>
                    <option value="event">Event</option>
                    <option value="language">Language</option>
                    <option value="culture">Culture</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Definition
                  </label>
                  <Textarea
                    value={editingEntry.attributes.definition || ''}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry, 
                      attributes: {...editingEntry.attributes, definition: e.target.value}
                    })}
                    placeholder="Provide a clear definition..."
                    className="w-full h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editingEntry.description}
                    onChange={(e) => setEditingEntry({...editingEntry, description: e.target.value})}
                    placeholder="Additional details and context..."
                    className="w-full h-32"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pronunciation
                    </label>
                    <Input
                      value={editingEntry.attributes.pronunciation || ''}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry, 
                        attributes: {...editingEntry.attributes, pronunciation: e.target.value}
                      })}
                      placeholder="How is it pronounced?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origin
                    </label>
                    <Input
                      value={editingEntry.attributes.origin || ''}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry, 
                        attributes: {...editingEntry.attributes, origin: e.target.value}
                      })}
                      placeholder="Where does it come from?"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etymology
                  </label>
                  <Textarea
                    value={editingEntry.attributes.etymology || ''}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry, 
                      attributes: {...editingEntry.attributes, etymology: e.target.value}
                    })}
                    placeholder="Historical development of the term..."
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Terms
                  </label>
                  <Textarea
                    value={editingEntry.attributes.related_terms || ''}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry, 
                      attributes: {...editingEntry.attributes, related_terms: e.target.value}
                    })}
                    placeholder="Related concepts, synonyms, antonyms..."
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Examples/Usage
                  </label>
                  <Textarea
                    value={editingEntry.attributes.examples || ''}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry, 
                      attributes: {...editingEntry.attributes, examples: e.target.value}
                    })}
                    placeholder="Examples of how it's used in your world..."
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <Input
                    value={editingEntry.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      setEditingEntry({...editingEntry, tags})
                    }}
                    placeholder="Enter tags separated by commas..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : selectedEntry ? (
          // Entry Details View
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedEntry.name}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingEntry(selectedEntry)
                      setIsCreating(false)
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${selectedEntry.name}?`)) {
                        deleteEntry(selectedEntry.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm rounded-full ${getTypeColor(selectedEntry.attributes.type)}`}>
                    {selectedEntry.attributes.type}
                  </span>
                  {selectedEntry.attributes.pronunciation && (
                    <span className="text-gray-500 italic">
                      /{selectedEntry.attributes.pronunciation}/
                    </span>
                  )}
                </div>

                {selectedEntry.attributes.definition && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Definition</h3>
                    <p className="text-gray-700 font-medium">{selectedEntry.attributes.definition}</p>
                  </div>
                )}

                {selectedEntry.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedEntry.description}</p>
                  </div>
                )}

                {selectedEntry.attributes.origin && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Origin</h3>
                    <p className="text-gray-700">{selectedEntry.attributes.origin}</p>
                  </div>
                )}

                {selectedEntry.attributes.etymology && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Etymology</h3>
                    <p className="text-gray-700">{selectedEntry.attributes.etymology}</p>
                  </div>
                )}

                {selectedEntry.attributes.related_terms && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Related Terms</h3>
                    <p className="text-gray-700">{selectedEntry.attributes.related_terms}</p>
                  </div>
                )}

                {selectedEntry.attributes.examples && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Examples/Usage</h3>
                    <p className="text-gray-700">{selectedEntry.attributes.examples}</p>
                  </div>
                )}

                {selectedEntry.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No entry selected</h3>
              <p className="text-sm mb-4">Select an entry from the encyclopedia to view details</p>
              <Button 
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create New Entry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
