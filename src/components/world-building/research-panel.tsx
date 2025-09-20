'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Filter,
  BookOpen,
  FileText,
  Link2,
  Image as ImageIcon,
  Video,
  Globe,
  Upload,
  Edit3, 
  Trash2,
  ExternalLink,
  FolderPlus,
  Folder,
  Eye,
  Download,
  Star,
  StarIcon,
  Tag,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  is_folder?: boolean
  parent_folder_id?: string
  sort_order?: number
  icon_color?: string
}

interface ResearchFile {
  id: string
  project_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  category: string
  attributes: {
    research_type: 'file'
    [key: string]: any
  }
}

interface ResearchContent {
  id: string
  project_id: string
  name: string
  description: string
  content: string
  type: 'note' | 'link' | 'image' | 'document' | 'video'
  attributes: {
    research_type: 'content'
    research_file_id: string // Reference to the parent file
    type: string
    url?: string
    file_name?: string
    file_size?: number
    [key: string]: any
  }
  tags: string[]
  file_url?: string
  image_url?: string
  created_at: string
  updated_at: string
  is_favorite?: boolean
  category: string
}

interface ResearchPanelProps {
  projectId: string
  selectedElement?: WorldElement | null
  triggerCreateFile?: boolean
}

const CONTENT_TYPES = [
  { id: 'all', label: 'All Content', icon: BookOpen, color: 'text-gray-600' },
  { id: 'note', label: 'Notes', icon: FileText, color: 'text-blue-600' },
  { id: 'link', label: 'Web Links', icon: Link2, color: 'text-green-600' },
  { id: 'image', label: 'Images', icon: ImageIcon, color: 'text-purple-600' },
  { id: 'document', label: 'Documents', icon: FileText, color: 'text-orange-600' },
  { id: 'video', label: 'Videos', icon: Video, color: 'text-red-600' }
]

export default function ResearchPanel({ projectId, selectedElement, triggerCreateFile }: ResearchPanelProps) {
  const [researchFiles, setResearchFiles] = useState<ResearchFile[]>([])
  const [selectedFile, setSelectedFile] = useState<ResearchFile | null>(null)
  const [researchContent, setResearchContent] = useState<ResearchContent[]>([])
  const [selectedContent, setSelectedContent] = useState<ResearchContent | null>(null)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isCreatingContent, setIsCreatingContent] = useState(false)
  const [createType, setCreateType] = useState<string>('note')
  const [editingContent, setEditingContent] = useState<ResearchContent | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Toast notification state
  const [toasts, setToasts] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'info'
    title: string
    message?: string
  }>>([])
  
  const [fileFormData, setFileFormData] = useState({
    name: '',
    description: ''
  })

  const [contentFormData, setContentFormData] = useState({
    name: '',
    description: '',
    content: '',
    tags: '',
    url: ''
  })

  const addToast = (toast: { type: 'success' | 'error' | 'info', title: string, message?: string }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  useEffect(() => {
    loadResearchFiles()
  }, [projectId])

  useEffect(() => {
    if (selectedFile) {
      loadResearchContent(selectedFile.id)
    }
  }, [selectedFile])

  // Handle navigation from sidebar - auto-select research file when selectedElement changes
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'research' && 
        selectedElement.attributes?.research_type === 'file') {
      // Convert WorldElement to ResearchFile
      const researchFile: ResearchFile = {
        id: selectedElement.id,
        project_id: selectedElement.project_id,
        name: selectedElement.name,
        description: selectedElement.description,
        created_at: selectedElement.created_at,
        updated_at: selectedElement.updated_at,
        category: selectedElement.category,
        attributes: {
          research_type: 'file',
          ...selectedElement.attributes
        }
      }
      setSelectedFile(researchFile)
    }
  }, [selectedElement])

  // Handle trigger to create new file from sidebar
  useEffect(() => {
    if (triggerCreateFile) {
      setIsCreatingFile(true)
      setSelectedFile(null) // Clear any selected file to show creation form
    }
  }, [triggerCreateFile])

  const loadResearchFiles = async () => {
    try {
      setLoading(true)
      console.log('Loading research files for project:', projectId)
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'research')
        .eq('attributes->>research_type', 'file') // Only research files
        .order('updated_at', { ascending: false })

      console.log('Research files query result:', { data, error })

      if (error) {
        console.error('Error loading research files:', error)
        addToast({
          type: 'error',
          title: 'Failed to load research files',
          message: error.message || 'Database error occurred'
        })
        return
      }

      console.log('Setting research files:', data)
      setResearchFiles(data || [])
    } catch (error) {
      console.error('Unexpected error loading research files:', error)
      addToast({
        type: 'error',
        title: 'Failed to load research files',
        message: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadResearchContent = async (fileId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'research')
        .eq('attributes->>research_type', 'content')
        .eq('attributes->>research_file_id', fileId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading research content:', error)
        addToast({
          type: 'error',
          title: 'Failed to load research content'
        })
        return
      }

      // Transform data to match ResearchContent interface
      const content = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        name: item.name,
        description: item.description || '',
        content: item.content || '',
        type: item.attributes?.type || 'note',
        attributes: item.attributes || {},
        tags: item.tags || [],
        file_url: item.file_url,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_favorite: item.is_favorite || false,
        category: item.category
      }))

      setResearchContent(content)
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to load research content'
      })
    }
  }

  const createResearchFile = async () => {
    if (!fileFormData.name.trim()) return

    try {
      const supabase = createSupabaseClient()
      const fileData = {
        project_id: projectId,
        category: 'research',
        name: fileFormData.name.trim(),
        description: fileFormData.description.trim(),
        attributes: {
          research_type: 'file'
        },
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert([fileData])
        .select()
        .single()

      console.log('Research file creation result:', { data, error })

      if (error) {
        console.error('Error creating research file:', error)
        addToast({
          type: 'error',
          title: 'Failed to create research file'
        })
        return
      }

      addToast({
        type: 'success',
        title: 'Research file created'
      })

      // Convert the created data to ResearchFile format and select it
      const newResearchFile: ResearchFile = {
        id: data.id,
        project_id: data.project_id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.category,
        attributes: data.attributes
      }

      setIsCreatingFile(false)
      setFileFormData({ name: '', description: '' })
      setSelectedFile(newResearchFile) // Automatically select the new file
      loadResearchFiles()
      
      // Trigger a custom event to refresh sidebar elements
      window.dispatchEvent(new CustomEvent('researchFileCreated', {
        detail: { researchFile: newResearchFile, projectId }
      }))
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to create research file'
      })
    }
  }

  const deleteResearchFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this research file and all its content?')) return

    try {
      const supabase = createSupabaseClient()
      
      // Delete all content first
      await supabase
        .from('world_elements')
        .delete()
        .eq('parent_id', fileId)

      // Then delete the file
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', fileId)

      if (error) {
        console.error('Error deleting research file:', error)
        addToast({
          type: 'error',
          title: 'Failed to delete research file'
        })
        return
      }

      setResearchFiles(researchFiles.filter(file => file.id !== fileId))
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
        setResearchContent([])
      }

      addToast({
        type: 'success',
        title: 'Research file deleted'
      })
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to delete research file'
      })
    }
  }

  const createContent = (type: string) => {
    setContentFormData({ 
      name: '', 
      description: '', 
      content: '',
      tags: '', 
      url: ''
    })
    setCreateType(type)
    setEditingContent(null)
    setIsCreatingContent(true)
  }

  const editContent = (content: ResearchContent) => {
    setContentFormData({
      name: content.name,
      description: content.description,
      content: content.content || '',
      tags: content.tags.join(', '),
      url: content.attributes?.url || ''
    })
    setCreateType(content.type)
    setEditingContent(content)
    setIsCreatingContent(true)
  }

  const saveContent = async () => {
    if (!selectedFile || !contentFormData.name.trim()) return
    if (createType === 'link' && !contentFormData.url.trim()) {
      addToast({
        type: 'error',
        title: 'URL is required for links'
      })
      return
    }

    try {
      const supabase = createSupabaseClient()
      const contentData = {
        project_id: projectId,
        category: 'research',
        name: contentFormData.name.trim(),
        description: contentFormData.description.trim(),
        content: contentFormData.content.trim(),
        tags: contentFormData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
        is_favorite: false,
        attributes: {
          research_type: 'content',
          research_file_id: selectedFile.id,
          type: createType,
          url: contentFormData.url.trim()
        }
      }

      if (editingContent) {
        const { error } = await supabase
          .from('world_elements')
          .update(contentData)
          .eq('id', editingContent.id)

        if (error) {
          console.error('Error updating content:', error)
          addToast({
            type: 'error',
            title: 'Failed to update content'
          })
          return
        }

        addToast({
          type: 'success',
          title: 'Content updated'
        })
      } else {
        const { error } = await supabase
          .from('world_elements')
          .insert([contentData])

        if (error) {
          console.error('Error creating content:', error)
          addToast({
            type: 'error',
            title: 'Failed to create content'
          })
          return
        }

        addToast({
          type: 'success',
          title: 'Content created'
        })
      }

      setIsCreatingContent(false)
      setEditingContent(null)
      loadResearchContent(selectedFile.id)
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to save content'
      })
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', contentId)

      if (error) {
        console.error('Error deleting content:', error)
        addToast({
          type: 'error',
          title: 'Failed to delete content'
        })
        return
      }

      setResearchContent(researchContent.filter(content => content.id !== contentId))
      if (selectedContent?.id === contentId) {
        setSelectedContent(null)
      }

      addToast({
        type: 'success',
        title: 'Content deleted'
      })
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to delete content'
      })
    }
  }

  const toggleContentFavorite = async (content: ResearchContent) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('world_elements')
        .update({ is_favorite: !content.is_favorite })
        .eq('id', content.id)

      if (error) {
        console.error('Error updating favorite status:', error)
        addToast({
          type: 'error',
          title: 'Failed to update favorite'
        })
        return
      }

      setResearchContent(researchContent.map(c => 
        c.id === content.id ? { ...c, is_favorite: !c.is_favorite } : c
      ))
      
      if (selectedContent?.id === content.id) {
        setSelectedContent({ ...selectedContent, is_favorite: !selectedContent.is_favorite })
      }

      addToast({
        type: 'success',
        title: content.is_favorite ? 'Removed from favorites' : 'Added to favorites'
      })
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to update favorite'
      })
    }
  }

  const handleFileUpload = async (file: File, type: string) => {
    if (!selectedFile) return

    try {
      addToast({
        type: 'info',
        title: 'Uploading file...'
      })

      const supabase = createSupabaseClient()
      const fileName = `research/${projectId}/${selectedFile.id}/${Date.now()}-${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        addToast({
          type: 'error',
          title: 'Failed to upload file'
        })
        return
      }

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName)

      const contentData = {
        project_id: projectId,
        category: 'research',
        parent_id: selectedFile.id,
        name: file.name,
        description: `Uploaded ${type}`,
        content: '',
        tags: [],
        is_favorite: false,
        file_url: urlData.publicUrl,
        attributes: {
          type: type,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        }
      }

      const { error } = await supabase
        .from('world_elements')
        .insert([contentData])

      if (error) {
        console.error('Error creating file content:', error)
        addToast({
          type: 'error',
          title: 'Failed to save file'
        })
        return
      }

      addToast({
        type: 'success',
        title: 'File uploaded successfully'
      })

      loadResearchContent(selectedFile.id)
    } catch (error) {
      console.error('Error uploading file:', error)
      addToast({
        type: 'error',
        title: 'Failed to upload file'
      })
    }
  }

  const getItemIcon = (type: string) => {
    const contentType = CONTENT_TYPES.find(t => t.id === type)
    return contentType ? contentType.icon : FileText
  }

  const getItemColor = (type: string) => {
    const contentType = CONTENT_TYPES.find(t => t.id === type)
    return contentType ? contentType.color : 'text-gray-600'
  }

  const filteredContent = researchContent.filter(content => {
    const matchesType = selectedType === 'all' || content.type === selectedType
    const matchesSearch = searchTerm === '' || 
      content.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesType && matchesSearch
  })

  // Research file creation form
  if (isCreatingFile) {
    return (
      <div className="h-full bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Research File</h2>
              <p className="text-gray-600">Create a new research file to organize your materials</p>
            </div>
            <Button onClick={() => setIsCreatingFile(false)} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <Input
                value={fileFormData.name}
                onChange={(e) => setFileFormData({ ...fileFormData, name: e.target.value })}
                placeholder="Enter research file name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={fileFormData.description}
                onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                placeholder="Describe what this research file will contain..."
                className="w-full h-24"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsCreatingFile(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={createResearchFile}
                disabled={!fileFormData.name.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Research File
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no file is selected and not creating
  if (!selectedFile) {
    return (
      <div className="h-full bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Research File Selected</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Select a research file from the sidebar to view its contents, or create a new one using the + button.
            </p>
            <Button onClick={() => setIsCreatingFile(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Research File
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Content creation form for selected research file
  if (isCreatingContent) {
    return (
      <div className="h-full bg-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => {
                  setIsCreatingContent(false)
                  setEditingContent(null)
                }}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {selectedFile.name}
              </Button>
            </div>
            <Button onClick={() => {
              setIsCreatingContent(false)
              setEditingContent(null)
            }} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingContent ? 'Edit Content' : `New ${CONTENT_TYPES.find(t => t.id === createType)?.label || 'Content'}`}
            </h2>
            <p className="text-gray-600">Add content to {selectedFile.name}</p>
          </div>

          <div className="space-y-6">
            {/* Type Selection */}
            {!editingContent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Content Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CONTENT_TYPES.filter(type => type.id !== 'all').map(type => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.id}
                        variant={createType === type.id ? "default" : "outline"}
                        className={`h-auto py-4 flex flex-col items-center space-y-2 ${
                          createType === type.id ? 'bg-purple-600 hover:bg-purple-700' : ''
                        }`}
                        onClick={() => setCreateType(type.id)}
                      >
                        <Icon className={`w-6 h-6 ${createType === type.id ? 'text-white' : type.color}`} />
                        <span className={`text-sm ${createType === type.id ? 'text-white' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* File Upload for certain types */}
            {(createType === 'image' || createType === 'document' || createType === 'video') && !editingContent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {createType === 'image' && 'PNG, JPG, GIF up to 10MB'}
                    {createType === 'document' && 'PDF, DOC, TXT up to 25MB'}
                    {createType === 'video' && 'MP4, MOV, AVI up to 100MB'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    createType === 'image' ? 'image/*' :
                    createType === 'document' ? '.pdf,.doc,.docx,.txt' :
                    createType === 'video' ? 'video/*' : ''
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file, createType)
                      setIsCreatingContent(false)
                    }
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                value={contentFormData.name}
                onChange={(e) => setContentFormData({ ...contentFormData, name: e.target.value })}
                placeholder="Enter a descriptive title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={contentFormData.description}
                onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })}
                placeholder="Brief description..."
                className="w-full h-24"
              />
            </div>

            {/* URL field for links */}
            {createType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <Input
                  value={contentFormData.url}
                  onChange={(e) => setContentFormData({ ...contentFormData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
            )}

            {/* Content field for notes */}
            {createType === 'note' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <Textarea
                  value={contentFormData.content}
                  onChange={(e) => setContentFormData({ ...contentFormData, content: e.target.value })}
                  placeholder="Write your research notes here..."
                  className="w-full h-40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                value={contentFormData.tags}
                onChange={(e) => setContentFormData({ ...contentFormData, tags: e.target.value })}
                placeholder="medieval, architecture, weapons"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate tags with commas
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsCreatingContent(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={saveContent}
                disabled={!contentFormData.name.trim() || (createType === 'link' && !contentFormData.url.trim())}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {editingContent ? 'Update Content' : 'Create Content'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main research file content view
  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                setSelectedFile(null)
                setSelectedContent(null) // Also clear selected content
              }}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Research
            </Button>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedFile.name}</h1>
              <p className="text-gray-600">{selectedFile.description || 'Research file'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => createContent('note')} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-140px)]">
        {/* Sidebar - Content Types */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-1">
            {CONTENT_TYPES.map(type => {
              const Icon = type.icon
              const count = type.id === 'all' 
                ? filteredContent.length 
                : researchContent.filter(content => content.type === type.id).length
              
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedType === type.id 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${selectedType === type.id ? 'text-purple-600' : type.color}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Add</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 flex flex-col items-center"
                onClick={() => createContent('note')}
              >
                <FileText className="w-4 h-4 mb-1 text-blue-600" />
                <span className="text-xs">Note</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 flex flex-col items-center"
                onClick={() => createContent('link')}
              >
                <Link2 className="w-4 h-4 mb-1 text-green-600" />
                <span className="text-xs">Link</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 flex flex-col items-center"
                onClick={() => createContent('image')}
              >
                <ImageIcon className="w-4 h-4 mb-1 text-purple-600" />
                <span className="text-xs">Image</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 flex flex-col items-center"
                onClick={() => createContent('document')}
              >
                <FileText className="w-4 h-4 mb-1 text-orange-600" />
                <span className="text-xs">Doc</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Content List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
            {filteredContent.length === 0 ? (
              <div className="text-center py-12 px-6">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600 mb-4">Start adding content to this research file</p>
                <Button onClick={() => createContent('note')} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Content
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredContent.map((content) => {
                  const Icon = getItemIcon(content.type)
                  const itemColor = getItemColor(content.type)
                  
                  return (
                    <Card 
                      key={content.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedContent?.id === content.id ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                      }`}
                      onClick={() => setSelectedContent(content)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className={`w-4 h-4 ${itemColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{content.name}</h3>
                                {content.is_favorite && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                                {content.attributes?.url && (
                                  <ExternalLink className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              
                              <Badge variant="outline" className="text-xs mb-2">
                                {CONTENT_TYPES.find(t => t.id === content.type)?.label || 'Unknown'}
                              </Badge>
                              
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {content.description || 'No description'}
                              </p>
                              
                              {content.tags && content.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {content.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {content.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{content.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(content.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleContentFavorite(content)
                              }}
                              className="p-1"
                            >
                              <Star className={`w-3 h-3 ${content.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                editContent(content)
                              }}
                              className="p-1"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteContent(content.id)
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detail View */}
          <div className="flex-1 overflow-y-auto bg-white">
            {selectedContent ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                      {(() => {
                        const Icon = getItemIcon(selectedContent.type)
                        return <Icon className="w-6 h-6 text-white" />
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedContent.name}</h2>
                        {selectedContent.is_favorite && (
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="outline">
                          {CONTENT_TYPES.find(t => t.id === selectedContent.type)?.label || 'Unknown'}
                        </Badge>
                        {selectedContent.attributes?.url && (
                          <a
                            href={selectedContent.attributes.url}
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
                      onClick={() => toggleContentFavorite(selectedContent)}
                      variant="outline"
                      size="sm"
                    >
                      <Star className={`w-4 h-4 mr-2 ${selectedContent.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      {selectedContent.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    <Button
                      onClick={() => editContent(selectedContent)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteContent(selectedContent.id)}
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
                  {selectedContent.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedContent.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Content for notes */}
                  {selectedContent.content && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                            {selectedContent.content}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* URL for links */}
                  {selectedContent.attributes?.url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Link</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Link2 className="w-4 h-4 text-gray-400" />
                          <a
                            href={selectedContent.attributes.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 hover:underline break-all"
                          >
                            {selectedContent.attributes.url}
                          </a>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* File display for uploads */}
                  {selectedContent.file_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">File</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedContent.type === 'image' ? (
                          <img 
                            src={selectedContent.file_url} 
                            alt={selectedContent.name}
                            className="max-w-full h-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-6 h-6 text-gray-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{selectedContent.attributes?.file_name}</p>
                              <p className="text-sm text-gray-600">
                                {selectedContent.attributes?.file_size && 
                                  `${(selectedContent.attributes.file_size / 1024 / 1024).toFixed(2)} MB`
                                }
                              </p>
                            </div>
                            <a
                              href={selectedContent.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Tags */}
                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedContent.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Created</label>
                          <p className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(selectedContent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Last Updated</label>
                          <p className="text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(selectedContent.updated_at).toLocaleDateString()}
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
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content</h3>
                  <p className="text-gray-600">Choose content from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm w-full rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{toast.title}</h4>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
