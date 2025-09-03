'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit3, Trash2, MapPin, Image } from 'lucide-react'
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

interface MapsPanelProps {
  projectId: string
}

export default function MapsPanel({ projectId }: MapsPanelProps) {
  const [maps, setMaps] = useState<WorldElement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMap, setSelectedMap] = useState<WorldElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingMap, setEditingMap] = useState<WorldElement | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchMaps()
  }, [projectId])

  const fetchMaps = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'maps')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaps(data || [])
    } catch (error) {
      console.error('Error fetching maps:', error)
    } finally {
      setLoading(false)
    }
  }

  const createMap = async (mapData: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'maps',
          name: mapData.name || 'New Map',
          description: mapData.description || '',
          attributes: {
            scale: mapData.attributes?.scale || '',
            region: mapData.attributes?.region || '',
            landmarks: mapData.attributes?.landmarks || '',
            boundaries: mapData.attributes?.boundaries || '',
            climate: mapData.attributes?.climate || '',
            terrain: mapData.attributes?.terrain || ''
          },
          tags: mapData.tags || []
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setMaps(prev => [data, ...prev])
        setSelectedMap(data)
        setIsCreating(false)
      }
    } catch (error) {
      console.error('Error creating map:', error)
    }
  }

  const updateMap = async (id: string, updates: Partial<WorldElement>) => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setMaps(prev => prev.map(map => map.id === id ? data : map))
        if (selectedMap?.id === id) {
          setSelectedMap(data)
        }
      }
    } catch (error) {
      console.error('Error updating map:', error)
    }
  }

  const deleteMap = async (id: string) => {
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMaps(prev => prev.filter(map => map.id !== id))
      if (selectedMap?.id === id) {
        setSelectedMap(null)
      }
    } catch (error) {
      console.error('Error deleting map:', error)
    }
  }

  const filteredMaps = maps.filter(map =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    map.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    map.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateNew = () => {
    setIsCreating(true)
    setEditingMap({
      id: '',
      project_id: projectId,
      category: 'maps',
      name: '',
      description: '',
      attributes: {
        scale: '',
        region: '',
        landmarks: '',
        boundaries: '',
        climate: '',
        terrain: ''
      },
      tags: [],
      created_at: '',
      updated_at: ''
    })
    setSelectedMap(null)
  }

  const handleSave = () => {
    if (!editingMap) return

    if (isCreating) {
      createMap(editingMap)
    } else {
      updateMap(editingMap.id, editingMap)
    }
    setEditingMap(null)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingMap(null)
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading maps...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex">
      {/* Maps List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Maps</h3>
            <Button 
              size="sm"
              onClick={handleCreateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Map
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search maps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredMaps.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="mb-2">No maps yet</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNew}
              >
                Create your first map
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredMaps.map((map) => (
                <button
                  key={map.id}
                  onClick={() => {
                    setSelectedMap(map)
                    setEditingMap(null)
                    setIsCreating(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedMap?.id === map.id
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{map.name}</div>
                      {map.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {map.description}
                        </div>
                      )}
                      {map.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {map.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {map.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{map.tags.length - 2}</span>
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
        {editingMap ? (
          // Edit/Create Form
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Create New Map' : 'Edit Map'}
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
                    {isCreating ? 'Create Map' : 'Save Changes'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Map Name *
                  </label>
                  <Input
                    value={editingMap.name}
                    onChange={(e) => setEditingMap({...editingMap, name: e.target.value})}
                    placeholder="Enter map name..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editingMap.description}
                    onChange={(e) => setEditingMap({...editingMap, description: e.target.value})}
                    placeholder="Describe this map or region..."
                    className="w-full h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scale
                    </label>
                    <Input
                      value={editingMap.attributes.scale || ''}
                      onChange={(e) => setEditingMap({
                        ...editingMap, 
                        attributes: {...editingMap.attributes, scale: e.target.value}
                      })}
                      placeholder="e.g., 1:100,000"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <Input
                      value={editingMap.attributes.region || ''}
                      onChange={(e) => setEditingMap({
                        ...editingMap, 
                        attributes: {...editingMap.attributes, region: e.target.value}
                      })}
                      placeholder="Geographic region"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major Landmarks
                  </label>
                  <Textarea
                    value={editingMap.attributes.landmarks || ''}
                    onChange={(e) => setEditingMap({
                      ...editingMap, 
                      attributes: {...editingMap.attributes, landmarks: e.target.value}
                    })}
                    placeholder="Important landmarks, cities, features..."
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boundaries & Borders
                  </label>
                  <Textarea
                    value={editingMap.attributes.boundaries || ''}
                    onChange={(e) => setEditingMap({
                      ...editingMap, 
                      attributes: {...editingMap.attributes, boundaries: e.target.value}
                    })}
                    placeholder="Political boundaries, natural borders..."
                    className="w-full h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Climate
                    </label>
                    <Input
                      value={editingMap.attributes.climate || ''}
                      onChange={(e) => setEditingMap({
                        ...editingMap, 
                        attributes: {...editingMap.attributes, climate: e.target.value}
                      })}
                      placeholder="Climate type"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terrain
                    </label>
                    <Input
                      value={editingMap.attributes.terrain || ''}
                      onChange={(e) => setEditingMap({
                        ...editingMap, 
                        attributes: {...editingMap.attributes, terrain: e.target.value}
                      })}
                      placeholder="Terrain type"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <Input
                    value={editingMap.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      setEditingMap({...editingMap, tags})
                    }}
                    placeholder="Enter tags separated by commas..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : selectedMap ? (
          // Map Details View
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMap.name}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingMap(selectedMap)
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
                      if (confirm(`Delete ${selectedMap.name}?`)) {
                        deleteMap(selectedMap.id)
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
                {selectedMap.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedMap.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {selectedMap.attributes.scale && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Scale</h3>
                      <p className="text-gray-700">{selectedMap.attributes.scale}</p>
                    </div>
                  )}

                  {selectedMap.attributes.region && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Region</h3>
                      <p className="text-gray-700">{selectedMap.attributes.region}</p>
                    </div>
                  )}

                  {selectedMap.attributes.climate && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Climate</h3>
                      <p className="text-gray-700">{selectedMap.attributes.climate}</p>
                    </div>
                  )}

                  {selectedMap.attributes.terrain && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Terrain</h3>
                      <p className="text-gray-700">{selectedMap.attributes.terrain}</p>
                    </div>
                  )}
                </div>

                {selectedMap.attributes.landmarks && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Major Landmarks</h3>
                    <p className="text-gray-700">{selectedMap.attributes.landmarks}</p>
                  </div>
                )}

                {selectedMap.attributes.boundaries && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Boundaries & Borders</h3>
                    <p className="text-gray-700">{selectedMap.attributes.boundaries}</p>
                  </div>
                )}

                {selectedMap.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMap.tags.map((tag, index) => (
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
              <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No map selected</h3>
              <p className="text-sm mb-4">Select a map from the list to view details</p>
              <Button 
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create New Map
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
