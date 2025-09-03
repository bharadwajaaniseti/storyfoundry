'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Search as ResearchIcon, 
  Edit3, 
  Trash2,
  ExternalLink,
  BookOpen,
  FileText,
  Link,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClient } from '@/lib/auth'

interface ResearchItem {
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

interface ResearchPanelProps {
  projectId: string
}

export default function ResearchPanel({ projectId }: ResearchPanelProps) {
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<ResearchItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    url: '',
    type: 'reference'
  })

  useEffect(() => {
    loadResearchItems()
  }, [projectId])

  const loadResearchItems = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'research')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading research items:', error)
        return
      }

      setResearchItems(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createItem = () => {
    setFormData({ name: '', description: '', tags: '', url: '', type: 'reference' })
    setEditingItem(null)
    setIsCreating(true)
  }

  const editItem = (item: ResearchItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      tags: item.tags.join(', '),
      url: item.attributes?.url || '',
      type: item.attributes?.type || 'reference'
    })
    setEditingItem(item)
    setIsCreating(true)
  }

  const saveItem = async () => {
    if (!formData.name.trim()) return

    try {
      const supabase = createSupabaseClient()
      const itemData = {
        project_id: projectId,
        category: 'research',
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        attributes: {
          url: formData.url.trim(),
          type: formData.type
        }
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('world_elements')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) {
          console.error('Error updating research item:', error)
          return
        }
      } else {
        // Create new item
        const { error } = await supabase
          .from('world_elements')
          .insert([itemData])

        if (error) {
          console.error('Error creating research item:', error)
          return
        }
      }

      setIsCreating(false)
      setEditingItem(null)
      loadResearchItems()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this research item?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error deleting research item:', error)
        return
      }

      setResearchItems(researchItems.filter(item => item.id !== itemId))
      if (selectedItem?.id === itemId) {
        setSelectedItem(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', tags: '', url: '', type: 'reference' })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reference': return 'bg-blue-100 text-blue-800'
      case 'inspiration': return 'bg-purple-100 text-purple-800'
      case 'factual': return 'bg-green-100 text-green-800'
      case 'visual': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredItems = researchItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isCreating) {
    return (
      <div className="h-full bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Edit Research Item' : 'New Research Item'}
              </h2>
              <p className="text-gray-600">Gather reference materials and inspiration</p>
            </div>
            <Button onClick={cancelEdit} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter research title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="reference">Reference Material</option>
                <option value="inspiration">Inspiration</option>
                <option value="factual">Factual Research</option>
                <option value="visual">Visual Reference</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this research item..."
                className="w-full h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL (Optional)
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full"
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
                e.g., medieval, architecture, weapons, culture
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={cancelEdit} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={saveItem}
                disabled={!formData.name.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingItem ? 'Update Item' : 'Create Item'}
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <ResearchIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Research</h1>
              <p className="text-gray-600">Gather reference materials and inspiration</p>
            </div>
          </div>
          <Button onClick={createItem} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Research
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search research items..."
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
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Research List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ResearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No research yet</h3>
                    <p className="text-gray-600 mb-4">Create your first research item to get started</p>
                    <Button onClick={createItem} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Research
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => (
                      <Card 
                        key={item.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedItem?.id === item.id ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                {item.attributes?.url && (
                                  <ExternalLink className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              <Badge className={getTypeColor(item.attributes?.type || 'reference')}>
                                {item.attributes?.type || 'reference'}
                              </Badge>
                              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                {item.description || 'No description'}
                              </p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.tags.length - 3}
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
                                  editItem(item)
                                }}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteItem(item.id)
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

            {/* Research Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedItem ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <ResearchIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(selectedItem.attributes?.type || 'reference')}>
                            {selectedItem.attributes?.type || 'reference'}
                          </Badge>
                          {selectedItem.attributes?.url && (
                            <a
                              href={selectedItem.attributes.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => editItem(selectedItem)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteItem(selectedItem.id)}
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
                          {selectedItem.description || 'No description available.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* URL */}
                    {selectedItem.attributes?.url && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Reference Link</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            <Link className="w-4 h-4 text-gray-400" />
                            <a
                              href={selectedItem.attributes.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700 hover:underline break-all"
                            >
                              {selectedItem.attributes.url}
                            </a>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tags */}
                    {selectedItem.tags && selectedItem.tags.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Tags</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.tags.map((tag, index) => (
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
                          {selectedItem.attributes?.url && (
                            <Button 
                              variant="outline" 
                              className="h-auto py-3 flex flex-col items-center"
                              onClick={() => window.open(selectedItem.attributes?.url, '_blank')}
                            >
                              <ExternalLink className="w-5 h-5 mb-1 text-purple-500" />
                              <span className="text-sm">Open Link</span>
                            </Button>
                          )}
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <FileText className="w-5 h-5 mb-1 text-blue-500" />
                            <span className="text-sm">Add Notes</span>
                          </Button>
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <BookOpen className="w-5 h-5 mb-1 text-green-500" />
                            <span className="text-sm">Reference</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Item Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-700">Created</label>
                            <p className="text-gray-600">
                              {new Date(selectedItem.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Last Updated</label>
                            <p className="text-gray-600">
                              {new Date(selectedItem.updated_at).toLocaleDateString()}
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
                    <ResearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Research Item</h3>
                    <p className="text-gray-600">Choose an item from the list to view details</p>
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
