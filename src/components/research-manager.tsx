'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus,
  Search,
  BookOpen,
  Globe,
  FileText,
  Image,
  Video,
  Link as LinkIcon,
  Edit3,
  Trash2,
  ExternalLink,
  Upload,
  Tag
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ResearchItem {
  id: string
  project_id: string
  title: string
  description: string
  type: 'article' | 'book' | 'website' | 'image' | 'video' | 'document' | 'note'
  content: string
  url?: string
  file_path?: string
  tags: string[]
  is_favorited: boolean
  created_at: string
  updated_at: string
}

interface ResearchManagerProps {
  projectId: string
}

export default function ResearchManager({ projectId }: ResearchManagerProps) {
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [newItem, setNewItem] = useState<Partial<ResearchItem>>({
    title: '',
    description: '',
    type: 'note',
    content: '',
    url: '',
    tags: []
  })

  useEffect(() => {
    loadResearchItems()
  }, [projectId])

  const loadResearchItems = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('research_items')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setResearchItems(data || [])
    } catch (error) {
      console.error('Error loading research items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createResearchItem = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('research_items')
        .insert({
          ...newItem,
          project_id: projectId,
          is_favorited: false
        })
        .select()
        .single()

      if (error) throw error
      
      setResearchItems([data, ...researchItems])
      setNewItem({
        title: '',
        description: '',
        type: 'note',
        content: '',
        url: '',
        tags: []
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating research item:', error)
    }
  }

  const updateResearchItem = async (itemId: string, updates: Partial<ResearchItem>) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('research_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      
      setResearchItems(researchItems.map(item => 
        item.id === itemId ? data : item
      ))
      
      if (selectedItem?.id === itemId) {
        setSelectedItem(data)
      }
    } catch (error) {
      console.error('Error updating research item:', error)
    }
  }

  const deleteResearchItem = async (itemId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('research_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      setResearchItems(researchItems.filter(item => item.id !== itemId))
      if (selectedItem?.id === itemId) {
        setSelectedItem(null)
      }
    } catch (error) {
      console.error('Error deleting research item:', error)
    }
  }

  const filteredItems = researchItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || item.type === selectedType
    
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText
      case 'book': return BookOpen
      case 'website': return Globe
      case 'image': return Image
      case 'video': return Video
      case 'document': return FileText
      case 'note': return FileText
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'blue'
      case 'book': return 'green'
      case 'website': return 'purple'
      case 'image': return 'pink'
      case 'video': return 'red'
      case 'document': return 'orange'
      case 'note': return 'gray'
      default: return 'gray'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Research Items List */}
      <div className="lg:col-span-1 flex flex-col">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Research Library
              </CardTitle>
              <Button onClick={() => setIsCreating(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search research..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="note">Notes</option>
                <option value="article">Articles</option>
                <option value="book">Books</option>
                <option value="website">Websites</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {filteredItems.map(item => {
                const Icon = getTypeIcon(item.type)
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 text-${getTypeColor(item.type)}-500`} />
                        <span className="font-medium text-sm truncate">{item.title}</span>
                      </div>
                      {item.is_favorited && (
                        <div className="text-yellow-500">★</div>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
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
                  </button>
                )
              })}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No research items found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-2">
        {isCreating ? (
          <CreateResearchForm
            newItem={newItem}
            setNewItem={setNewItem}
            onSave={createResearchItem}
            onCancel={() => setIsCreating(false)}
          />
        ) : selectedItem ? (
          <ResearchItemDetails
            item={selectedItem}
            onUpdate={updateResearchItem}
            onDelete={deleteResearchItem}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Select a research item</h3>
                <p>Choose an item from the library to view its details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface CreateResearchFormProps {
  newItem: Partial<ResearchItem>
  setNewItem: (item: Partial<ResearchItem>) => void
  onSave: () => void
  onCancel: () => void
}

function CreateResearchForm({ newItem, setNewItem, onSave, onCancel }: CreateResearchFormProps) {
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags?.includes(tagInput.trim())) {
      setNewItem({
        ...newItem,
        tags: [...(newItem.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewItem({
      ...newItem,
      tags: newItem.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Add New Research Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <Input
              value={newItem.title || ''}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Research item title..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
            <select
              value={newItem.type || 'note'}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="note">Note</option>
              <option value="article">Article</option>
              <option value="book">Book</option>
              <option value="website">Website</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <Textarea
            value={newItem.description || ''}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Brief description..."
            rows={2}
          />
        </div>

        {(newItem.type === 'website' || newItem.type === 'article') && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">URL</label>
            <Input
              value={newItem.url || ''}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
          <Textarea
            value={newItem.content || ''}
            onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
            placeholder="Research content, notes, quotes..."
            rows={6}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
          <div className="flex space-x-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="sm">
              <Tag className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {newItem.tags?.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button onClick={onSave} className="flex-1">
            Save Research Item
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ResearchItemDetailsProps {
  item: ResearchItem
  onUpdate: (id: string, updates: Partial<ResearchItem>) => void
  onDelete: (id: string) => void
}

function ResearchItemDetails({ item, onUpdate, onDelete }: ResearchItemDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState(item)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText
      case 'book': return BookOpen
      case 'website': return Globe
      case 'image': return Image
      case 'video': return Video
      case 'document': return FileText
      case 'note': return FileText
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'blue'
      case 'book': return 'green'
      case 'website': return 'purple'
      case 'image': return 'pink'
      case 'video': return 'red'
      case 'document': return 'orange'
      case 'note': return 'gray'
      default: return 'gray'
    }
  }

  const handleSave = () => {
    onUpdate(item.id, editedItem)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedItem(item)
    setIsEditing(false)
  }

  const toggleFavorite = () => {
    onUpdate(item.id, { is_favorited: !item.is_favorited })
  }

  const Icon = getTypeIcon(item.type)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-purple-500" />
            <div>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <Badge className="text-purple-600 bg-purple-100">
                {item.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleFavorite}
              size="sm"
              variant="outline"
              className={item.is_favorited ? 'text-yellow-600 border-yellow-300' : ''}
            >
              ★
            </Button>
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm">Save</Button>
                <Button onClick={handleCancel} size="sm" variant="outline">Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm('Delete this research item?')) onDelete(item.id)
                  }} 
                  size="sm" 
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.description && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Description</h4>
            {isEditing ? (
              <Textarea
                value={editedItem.description}
                onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                rows={2}
              />
            ) : (
              <p className="text-gray-600">{item.description}</p>
            )}
          </div>
        )}

        {item.url && (
          <div>
            <h4 className="font-medium text-gray-800 mb-1">URL</h4>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>{item.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-800 mb-1">Content</h4>
          {isEditing ? (
            <Textarea
              value={editedItem.content}
              onChange={(e) => setEditedItem({ ...editedItem, content: e.target.value })}
              rows={12}
            />
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {item.content || 'No content'}
              </pre>
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
