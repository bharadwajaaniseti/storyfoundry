'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit3, 
  Trash2,
  Globe,
  Map,
  Building,
  Mountain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClient } from '@/lib/auth'

interface Location {
  id: string
  project_id: string
  name: string
  description: string
  attributes: Record<string, any>
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
  category: string
}

interface LocationsPanelProps {
  projectId: string
}

export default function LocationsPanel({ projectId }: LocationsPanelProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  })

  useEffect(() => {
    loadLocations()
  }, [projectId])

  const loadLocations = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'locations')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading locations:', error)
        return
      }

      setLocations(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createLocation = () => {
    setFormData({ name: '', description: '', tags: '' })
    setEditingLocation(null)
    setIsCreating(true)
  }

  const editLocation = (location: Location) => {
    setFormData({
      name: location.name,
      description: location.description,
      tags: location.tags.join(', ')
    })
    setEditingLocation(location)
    setIsCreating(true)
  }

  const saveLocation = async () => {
    if (!formData.name.trim()) return

    try {
      const supabase = createSupabaseClient()
      const locationData = {
        project_id: projectId,
        category: 'locations',
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        attributes: {}
      }

      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('world_elements')
          .update(locationData)
          .eq('id', editingLocation.id)

        if (error) {
          console.error('Error updating location:', error)
          return
        }
      } else {
        // Create new location
        const { error } = await supabase
          .from('world_elements')
          .insert([locationData])

        if (error) {
          console.error('Error creating location:', error)
          return
        }
      }

      setIsCreating(false)
      setEditingLocation(null)
      loadLocations()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', locationId)

      if (error) {
        console.error('Error deleting location:', error)
        return
      }

      setLocations(locations.filter(l => l.id !== locationId))
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingLocation(null)
    setFormData({ name: '', description: '', tags: '' })
  }

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isCreating) {
    return (
      <div className="h-full bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingLocation ? 'Edit Location' : 'New Location'}
              </h2>
              <p className="text-gray-600">Define a place in your story world</p>
            </div>
            <Button onClick={cancelEdit} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter location name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this location..."
                className="w-full h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas..."
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., city, forest, magical, dangerous
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={cancelEdit} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={saveLocation}
                disabled={!formData.name.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">Define places in your story world</p>
            </div>
          </div>
          <Button onClick={createLocation} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Location
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Locations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                {filteredLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                    <p className="text-gray-600 mb-4">Create your first location to get started</p>
                    <Button onClick={createLocation} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Location
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLocations.map((location) => (
                      <Card 
                        key={location.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedLocation?.id === location.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                        }`}
                        onClick={() => setSelectedLocation(location)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{location.name}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {location.description || 'No description'}
                              </p>
                              {location.tags && location.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {location.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {location.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{location.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  editLocation(location)
                                }}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteLocation(location.id)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedLocation ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedLocation.name}</h2>
                        <p className="text-gray-600">Location Details</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => editLocation(selectedLocation)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteLocation(selectedLocation.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">
                          {selectedLocation.description || 'No description available.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    {selectedLocation.tags && selectedLocation.tags.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Tags</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {selectedLocation.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <Map className="w-5 h-5 mb-1 text-green-500" />
                            <span className="text-sm">Add to Map</span>
                          </Button>
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <Building className="w-5 h-5 mb-1 text-blue-500" />
                            <span className="text-sm">Sub-locations</span>
                          </Button>
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <Globe className="w-5 h-5 mb-1 text-purple-500" />
                            <span className="text-sm">Reference</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-700">Created</label>
                            <p className="text-gray-600">
                              {new Date(selectedLocation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Last Updated</label>
                            <p className="text-gray-600">
                              {new Date(selectedLocation.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Location</h3>
                    <p className="text-gray-600">Choose a location from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
