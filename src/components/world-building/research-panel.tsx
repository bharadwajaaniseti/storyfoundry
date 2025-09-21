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
  Hash,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  X,
  ChevronLeft
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

  // State for holding selected files before upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Media viewer modal state
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<{
    url: string
    type: 'image' | 'video' | 'document'
    name?: string
    index: number
    totalCount: number
    allMedia: Array<{ url: string; type: 'image' | 'video' | 'document'; name?: string }>
  } | null>(null)

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
      
      // Cancel creation mode if user selects an existing file
      setIsCreatingFile(false)
      setIsCreatingContent(false)
      setEditingContent(null)
      
      // Reset form data
      setFileFormData({ name: '', description: '' })
      setContentFormData({ name: '', description: '', content: '', tags: '', url: '' })
      
      // Set the selected file
      setSelectedFile(researchFile)
    }
  }, [selectedElement])

  // Handle trigger to create new file from sidebar
  useEffect(() => {
    // Only trigger creation if no specific element is selected
    if (triggerCreateFile && !selectedElement) {
      setIsCreatingFile(true)
      setSelectedFile(null) // Clear any selected file to show creation form
      setSelectedContent(null) // Also clear selected content
      // Ensure we're not in content creation mode
      setIsCreatingContent(false)
      setEditingContent(null)
    }
  }, [triggerCreateFile, selectedElement])

  // Handle keyboard navigation for media viewer
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!mediaViewerOpen || !viewerMedia) return
      
      switch (e.key) {
        case 'Escape':
          closeMediaViewer()
          break
        case 'ArrowLeft':
          if (viewerMedia.totalCount > 1) {
            navigateMedia('prev')
          }
          break
        case 'ArrowRight':
          if (viewerMedia.totalCount > 1) {
            navigateMedia('next')
          }
          break
      }
    }

    if (mediaViewerOpen) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [mediaViewerOpen, viewerMedia])

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
        console.error('Error loading research files:', error.message || 'Failed to load research files')
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
      // Convert to WorldElement format for sidebar
      const worldElement = {
        ...data,
        tags: data.tags || []
      }
      console.log('Dispatching researchFileCreated event:', worldElement)
      console.log('Project ID:', projectId)
      window.dispatchEvent(new CustomEvent('researchFileCreated', {
        detail: { researchFile: worldElement, projectId }
      }))

      // Also trigger a sidebar reload as a backup
      window.dispatchEvent(new CustomEvent('reloadSidebar', {
        detail: { projectId }
      }))
      
      // Test if events are working at all
      console.log('Testing if custom events work...')
      setTimeout(() => {
        console.log('Dispatching test event')
        window.dispatchEvent(new CustomEvent('testEvent', { detail: { test: 'working' } }))
      }, 100)
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
    // Strict validation to prevent creating content without a parent research file
    if (!selectedFile) {
      addToast({
        type: 'error',
        title: 'No research file selected',
        message: 'Please select a research file before creating content'
      })
      return
    }
    
    if (!selectedFile.id) {
      addToast({
        type: 'error',
        title: 'Invalid research file',
        message: 'The selected research file is missing an ID'
      })
      return
    }

    if (!contentFormData.name.trim()) {
      addToast({
        type: 'error',
        title: 'Content name is required'
      })
      return
    }

    if (createType === 'link' && !contentFormData.url.trim()) {
      addToast({
        type: 'error',
        title: 'URL is required for links'
      })
      return
    }

    try {
      setUploadingFiles(true)
      const supabase = createSupabaseClient()
      let fileUrls: string[] = []

      // Handle file uploads for images, documents, videos
      if ((createType === 'image' || createType === 'document' || createType === 'video') && selectedFiles.length > 0) {
        addToast({
          type: 'info',
          title: `Uploading ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}...`
        })

        const uploadPromises = selectedFiles.map(async (file, index) => {
          const fileName = `research/${projectId}/${selectedFile.id}/${Date.now()}-${index}-${file.name}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('research')
            .upload(fileName, file)

          if (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError)
            console.error('Full upload error details:', uploadError)
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message || 'Storage permission denied'}`)
          }

          const { data: urlData } = supabase.storage
            .from('research')
            .getPublicUrl(fileName)

          return urlData.publicUrl
        })

        fileUrls = await Promise.all(uploadPromises)
      }

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
          url: contentFormData.url.trim(),
          file_urls: fileUrls, // Store all file URLs
          file_names: selectedFiles.map(f => f.name), // Store original file names
          file_count: selectedFiles.length
        }
      }

      // Final validation to ensure we're creating content correctly
      if (!contentData.attributes.research_type || contentData.attributes.research_type !== 'content') {
        addToast({
          type: 'error',
          title: 'Invalid content data',
          message: 'Content is missing research_type attribute'
        })
        return
      }

      if (!contentData.attributes.research_file_id) {
        addToast({
          type: 'error',
          title: 'Invalid content data',
          message: 'Content is missing parent research file ID'
        })
        return
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
          title: fileUrls.length > 0 ? `Content created with ${fileUrls.length} file${fileUrls.length > 1 ? 's' : ''}` : 'Content created'
        })
      }

      // Reset form and file selection
      setIsCreatingContent(false)
      setEditingContent(null)
      setSelectedFiles([])
      setContentFormData({
        name: '',
        description: '',
        content: '',
        tags: '',
        url: ''
      })
      loadResearchContent(selectedFile.id)
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'Failed to save content',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setUploadingFiles(false)
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

  const handleFileUpload = async (files: FileList, type: string) => {
    if (!selectedFile || files.length === 0) return

    try {
      addToast({
        type: 'info',
        title: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`
      })

      const supabase = createSupabaseClient()
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileName = `research/${projectId}/${selectedFile.id}/${Date.now()}-${index}-${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('research')
          .upload(fileName, file)

        if (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError)
          console.error('Full upload error details:', uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message || 'Storage permission denied'}`)
        }

        const { data: urlData } = supabase.storage
          .from('research')
          .getPublicUrl(fileName)

        const contentData = {
          project_id: projectId,
          category: 'research',
          name: file.name,
          description: `Uploaded ${type}`,
          content: '',
          tags: [],
          is_favorite: false,
          attributes: {
            research_type: 'content',
            research_file_id: selectedFile.id,
            type: type,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: urlData.publicUrl
          }
        }

        const { error: dbError } = await supabase
          .from('world_elements')
          .insert([contentData])

        if (dbError) {
          console.error(`Error saving file ${file.name} to database:`, dbError)
          throw new Error(`Failed to save ${file.name}`)
        }

        return file.name
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      
      addToast({
        type: 'success',
        title: `Successfully uploaded ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`,
        message: uploadedFiles.join(', ')
      })

      loadResearchContent(selectedFile.id)
    } catch (error) {
      console.error('Error during batch upload:', error)
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: error instanceof Error ? error.message : 'Some files failed to upload'
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

  // Media viewer functions
  const openMediaViewer = (url: string, type: 'image' | 'video' | 'document', name: string, allUrls: string[], currentIndex: number) => {
    console.log('Opening media viewer:', { url, type, name, allUrls, currentIndex })
    console.log('All URLs:', allUrls)
    
    // Filter to include images, videos, and documents for navigation
    const mediaItems = allUrls.map((mediaUrl, index) => {
      // Determine type based on file extension or content type
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaUrl)
      const isVideo = /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(mediaUrl)
      const isDocument = /\.(pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(mediaUrl)
      
      let itemType: 'image' | 'video' | 'document' | 'unknown' = 'unknown'
      if (isImage) itemType = 'image'
      else if (isVideo) itemType = 'video'
      else if (isDocument) itemType = 'document'
      
      console.log(`File ${index}: ${mediaUrl} -> ${itemType}`)
      
      return {
        url: mediaUrl,
        type: itemType,
        name: selectedContent?.attributes?.file_names?.[index] || `File ${index + 1}`
      }
    }).filter(item => item.type !== 'unknown') as Array<{ url: string; type: 'image' | 'video' | 'document'; name: string }>

    console.log('Filtered media items:', mediaItems)
    
    const mediaIndex = mediaItems.findIndex(item => item.url === url)
    
    const viewerData = {
      url,
      type,
      name,
      index: mediaIndex,
      totalCount: mediaItems.length,
      allMedia: mediaItems
    }
    
    console.log('Setting viewer data:', viewerData)
    setViewerMedia(viewerData)
    setMediaViewerOpen(true)
    console.log('Media viewer should be open now')
  }

  const closeMediaViewer = () => {
    setMediaViewerOpen(false)
    setViewerMedia(null)
  }

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!viewerMedia || !viewerMedia.allMedia || viewerMedia.allMedia.length === 0) return

    const currentIndex = viewerMedia.index
    let newIndex = direction === 'next' 
      ? (currentIndex + 1) % viewerMedia.allMedia.length
      : (currentIndex - 1 + viewerMedia.allMedia.length) % viewerMedia.allMedia.length

    const newMedia = viewerMedia.allMedia[newIndex]
    setViewerMedia({
      ...viewerMedia,
      url: newMedia.url,
      type: newMedia.type,
      name: newMedia.name || `File ${newIndex + 1}`,
      index: newIndex
    })
  }

  // Research file creation form
  if (isCreatingFile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Create New Research File</h1>
                <p className="text-gray-600">Create a new research file to organize your story materials</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCreatingFile(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={fileFormData.name}
                    onChange={(e) => setFileFormData({ ...fileFormData, name: e.target.value })}
                    placeholder="Enter research file name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={fileFormData.description}
                    onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                    placeholder="Describe what this research file will contain..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsCreatingFile(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={createResearchFile}
                    disabled={!fileFormData.name.trim()}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Create Research File</span>
                  </button>
                </div>
              </div>
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
            <button onClick={() => setIsCreatingFile(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Research File</span>
            </button>
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
                        className={`h-auto py-4 flex flex-col items-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                          createType === type.id ? 'bg-orange-500 text-white hover:bg-orange-600' : ''
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload multiple files or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {createType === 'image' && 'PNG, JPG, GIF up to 10MB each'}
                    {createType === 'document' && 'PDF, DOC, TXT up to 25MB each'}
                    {createType === 'video' && 'MP4, MOV, AVI up to 100MB each'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={
                    createType === 'image' ? 'image/*' :
                    createType === 'document' ? '.pdf,.doc,.docx,.txt' :
                    createType === 'video' ? 'video/*' : ''
                  }
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      setSelectedFiles(Array.from(files))
                      // Don't upload immediately or close the modal
                    }
                  }}
                />

                {/* Show selected files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            onClick={() => {
                              const newFiles = selectedFiles.filter((_, i) => i !== index)
                              setSelectedFiles(newFiles)
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                disabled={!contentFormData.name.trim() || (createType === 'link' && !contentFormData.url.trim()) || uploadingFiles}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                {uploadingFiles ? 'Uploading...' : editingContent ? 'Update Content' : 'Create Content'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main research file content view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center ring-1 ring-orange-100">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedFile.name}</h1>
                <p className="text-gray-600 mt-1">{selectedFile.description || 'Research file'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => createContent('note')} 
                className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Add Content</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex h-[calc(100vh-200px)]">
          {/* Sidebar - Content Types */}
          <div className="w-64 bg-white border border-gray-200 rounded-lg p-4 mr-6">
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
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${selectedType === type.id ? 'text-orange-600' : type.color}`} />
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
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-orange-200 rounded-xl border-gray-200 ${
                        selectedContent?.id === content.id ? 'ring-2 ring-orange-500 bg-orange-50 shadow-lg' : 'hover:bg-orange-50/30'
                      }`}
                      onClick={() => setSelectedContent(content)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 bg-orange-100 rounded-xl">
                              <Icon className={`w-5 h-5 ${itemColor}`} />
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
                              
                              <Badge variant="outline" className="text-xs mb-2 border-orange-200 text-orange-700 bg-orange-50">
                                {CONTENT_TYPES.find(t => t.id === content.type)?.label || 'Unknown'}
                              </Badge>
                              
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {content.description || 'No description'}
                              </p>
                              
                              {content.tags && content.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {content.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {content.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                      +{content.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-2 text-xs text-orange-600">
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
                              className="p-1 hover:bg-orange-100 rounded-lg"
                            >
                              <Star className={`w-3 h-3 ${content.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400 hover:text-orange-500'}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                editContent(content)
                              }}
                              className="p-1 hover:bg-orange-100 text-gray-400 hover:text-orange-600 rounded-lg"
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
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
          <div className="flex-1 overflow-y-auto bg-orange-50/30">
            {selectedContent ? (
              <div className="h-full">
                {/* Header */}
                <div className="bg-white border-b border-orange-200 px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        {(() => {
                          const Icon = getItemIcon(selectedContent.type)
                          return <Icon className="w-6 h-6 text-orange-600" />
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h1 className="text-xl font-bold text-gray-900">{selectedContent.name}</h1>
                          {selectedContent.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {CONTENT_TYPES.find(t => t.id === selectedContent.type)?.label || 'Unknown'}
                          </span>
                          {selectedContent.attributes?.url && (
                            <a
                              href={selectedContent.attributes.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                  <div className="flex items-center space-x-2">
                    {/* Debug button */}
                    <button
                      onClick={() => {
                        console.log('Test button clicked')
                        setViewerMedia({
                          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0MCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjgwMHg2MDA8L3RleHQ+Cjwvc3ZnPg==',
                          type: 'image',
                          name: 'Test Image',
                          index: 0,
                          totalCount: 1,
                          allMedia: [{
                            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0MCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjgwMHg2MDA8L3RleHQ+Cjwvc3ZnPg==',
                            type: 'image',
                            name: 'Test Image'
                          }]
                        })
                        setMediaViewerOpen(true)
                        console.log('Test modal should be open')
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      Test Modal
                    </button>
                    
                    <button
                      onClick={() => toggleContentFavorite(selectedContent)}
                      className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-xl text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 hover:border-orange-400 transition-all"
                    >
                        <Star className={`w-4 h-4 mr-2 ${selectedContent.is_favorite ? 'text-yellow-500 fill-current' : 'text-orange-400'}`} />
                        Favorite
                      </button>
                      <button
                        onClick={() => editContent(selectedContent)}
                        className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-xl text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 hover:border-orange-400 transition-all"
                      >
                        <Edit3 className="w-4 h-4 mr-2 text-orange-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteContent(selectedContent.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-xl text-sm font-medium text-red-700 bg-white hover:bg-red-50 hover:border-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Description Section */}
                  <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedContent.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Content Section */}
                  {selectedContent.content && (
                    <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedContent.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Files Section for multiple files */}
                  {selectedContent.attributes?.file_urls && selectedContent.attributes.file_urls.length > 0 && (
                    <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Files ({selectedContent.attributes.file_count || selectedContent.attributes.file_urls.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedContent.attributes.file_urls.map((url: string, index: number) => {
                          const fileName = selectedContent.attributes?.file_names?.[index] || `File ${index + 1}`
                          const isImage = selectedContent.type === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
                          const isVideo = selectedContent.type === 'video' || /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(url)
                          const isDocument = selectedContent.type === 'document' || /\.(pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(url)
                          const canViewInline = isImage || isVideo || isDocument
                          
                          return (
                            <div key={index} className="group relative">
                              <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl overflow-hidden border border-orange-300 hover:border-orange-400 transition-colors">
                                {isImage ? (
                                  <div className="relative w-full h-full bg-white">
                                    {/* Always visible fallback background */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                                      <div className="text-center">
                                        <div className="text-2xl mb-2">🖼️</div>
                                        <p className="text-xs text-orange-700 font-medium px-2">{fileName}</p>
                                      </div>
                                    </div>
                                    {/* Image overlay - will cover fallback if it loads */}
                                    <img 
                                      src={url} 
                                      alt={fileName}
                                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      style={{ zIndex: 2 }}
                                      onLoad={(e) => {
                                        console.log('✅ Image loaded successfully:', url)
                                        const target = e.target as HTMLImageElement
                                        target.style.opacity = '1'
                                      }}
                                      onError={(e) => {
                                        console.error('❌ Image failed to load:', url)
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                    {/* Hover overlay */}
                                    <div 
                                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ zIndex: 3 }}
                                    >
                                      <div className="text-center text-white">
                                        <Eye className="w-6 h-6 mx-auto mb-1" />
                                        <p className="text-xs font-medium">Click to view</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : isVideo ? (
                                  <div className="relative w-full h-full bg-orange-900 rounded-xl overflow-hidden">
                                    <video 
                                      src={url} 
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 bg-orange-900 bg-opacity-30 flex items-center justify-center">
                                      <div className="w-12 h-12 bg-orange-100 bg-opacity-90 rounded-full flex items-center justify-center">
                                        <Video className="w-6 h-6 text-orange-700" />
                                      </div>
                                    </div>
                                  </div>
                                ) : isDocument ? (
                                  <div className="w-full h-full flex items-center justify-center bg-orange-50">
                                    <div className="text-center">
                                      <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                      <p className="text-xs text-orange-700 truncate px-2 font-medium">
                                        {fileName}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-orange-50">
                                    <div className="text-center">
                                      {(() => {
                                        const Icon = getItemIcon(selectedContent.type)
                                        return <Icon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                      })()}
                                      <p className="text-xs text-orange-700 truncate px-2 font-medium">
                                        {fileName}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {canViewInline ? (
                                <button
                                  onClick={() => {
                                    console.log('Button clicked! Opening media viewer...')
                                    const fileType = isImage ? 'image' : isVideo ? 'video' : 'document'
                                    openMediaViewer(
                                      url,
                                      fileType,
                                      fileName,
                                      selectedContent.attributes?.file_urls || [],
                                      index
                                    )
                                  }}
                                  className="absolute inset-0 rounded-xl bg-transparent transition-all duration-200 flex items-center justify-center hover:bg-orange-500 hover:bg-opacity-10"
                                  style={{ zIndex: 10 }}
                                >
                                  {/* This button is now invisible but clickable and sits on top of everything */}
                                </button>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 rounded-xl bg-orange-500 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
                                >
                                  <ExternalLink className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Single File Section */}
                  {selectedContent.file_url && !selectedContent.attributes?.file_urls && (
                    <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">File</h3>
                      <div className="flex justify-center">
                        {(() => {
                          const fileName = selectedContent.name
                          const url = selectedContent.file_url!
                          const isImage = selectedContent.type === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
                          const isVideo = selectedContent.type === 'video' || /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(url)
                          const canViewInline = isImage || isVideo
                          
                          return (
                            <div className="group relative max-w-md">
                              <div className="aspect-square bg-orange-100 rounded-xl overflow-hidden border border-orange-200">
                                {isImage ? (
                                  <img 
                                    src={url} 
                                    alt={fileName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                ) : isVideo ? (
                                  <div className="relative w-full h-full bg-orange-900 rounded-xl overflow-hidden">
                                    <video 
                                      src={url} 
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 bg-orange-900 bg-opacity-30 flex items-center justify-center">
                                      <div className="w-12 h-12 bg-orange-100 bg-opacity-90 rounded-full flex items-center justify-center">
                                        <Video className="w-6 h-6 text-orange-700" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-orange-50">
                                    <div className="text-center">
                                      {(() => {
                                        const Icon = getItemIcon(selectedContent.type)
                                        return <Icon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                      })()}
                                      <p className="text-xs text-orange-700 truncate px-2 font-medium">
                                        {fileName}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {canViewInline ? (
                                <button
                                  onClick={() => {
                                    console.log('Single file button clicked! Opening media viewer...')
                                    openMediaViewer(
                                      url,
                                      isImage ? 'image' : 'video',
                                      fileName,
                                      [url],
                                      0
                                    )
                                  }}
                                  className="absolute inset-0 rounded-xl bg-orange-500 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
                                >
                                  <Eye className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </button>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 rounded-xl bg-orange-500 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
                                >
                                  <ExternalLink className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </a>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Link Section */}
                  {selectedContent.attributes?.url && (
                    <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Link</h3>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={selectedContent.attributes.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 font-medium truncate block"
                          >
                            {selectedContent.attributes.url}
                          </a>
                          <p className="text-sm text-gray-500">External link</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags Section */}
                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                          >
                            <Hash className="w-3 h-3 mr-1 text-orange-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Information Section */}
                  <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-orange-700 mb-1">Created</label>
                        <div className="flex items-center text-orange-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {new Date(selectedContent.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-orange-700 mb-1">Last Updated</label>
                        <div className="flex items-center text-orange-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {new Date(selectedContent.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content</h3>
                  <p className="text-orange-600">Choose content from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Media Viewer Modal */}
      {mediaViewerOpen && viewerMedia && (
         <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.43)'
          }}
          onClick={closeMediaViewer}
        >
          <div 
            className="relative flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeMediaViewer}
              className="fixed top-4 right-4 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full text-black transition-all shadow-lg"
              style={{ zIndex: 10000 }}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Button */}
            {viewerMedia.totalCount > 1 && (
              <button
                onClick={() => navigateMedia('prev')}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full text-black transition-all shadow-lg"
                style={{ zIndex: 10000 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {viewerMedia.totalCount > 1 && (
              <button
                onClick={() => navigateMedia('next')}
                className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full text-black transition-all shadow-lg"
                style={{ zIndex: 10000 }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center p-8">
              {viewerMedia.type === 'image' ? (
                <img
                  src={viewerMedia.url}
                  alt={viewerMedia.name}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                  style={{ maxWidth: 'calc(100vw - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    console.error('Failed to load image:', viewerMedia.url)
                    addToast({
                      type: 'error',
                      title: 'Failed to load image',
                      message: 'The image could not be displayed'
                    })
                  }}
                />
              ) : viewerMedia.type === 'video' ? (
                <video
                  src={viewerMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full shadow-2xl"
                  style={{ maxWidth: 'calc(100vw - 8rem)', maxHeight: 'calc(100vh - 8rem)' }}
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    console.error('Failed to load video:', viewerMedia.url)
                    addToast({
                      type: 'error',
                      title: 'Failed to load video',
                      message: 'The video could not be played'
                    })
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : viewerMedia.type === 'document' ? (
                <div className="w-full h-full flex items-center justify-center">
                  {viewerMedia.url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={viewerMedia.url}
                      className="border-0 shadow-2xl rounded-lg"
                      style={{
                        width: 'calc(100vw - 8rem)',
                        height: 'calc(100vh - 8rem)'
                      }}
                      title={viewerMedia.name}
                      onClick={(e) => e.stopPropagation()}
                      onError={(e) => {
                        console.error('Failed to load document:', viewerMedia.url)
                        addToast({
                          type: 'error',
                          title: 'Failed to load document',
                          message: 'The document could not be displayed'
                        })
                      }}
                    />
                  ) : viewerMedia.url.toLowerCase().match(/\.(txt|rtf)$/i) ? (
                    <div className="w-full h-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden">
                      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{viewerMedia.name}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <a
                            href={viewerMedia.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open in new tab
                          </a>
                        </div>
                      </div>
                      <div className="p-6 h-full overflow-auto">
                        <iframe
                          src={viewerMedia.url}
                          className="w-full h-full border-0"
                          style={{ minHeight: 'calc(100vh - 16rem)' }}
                          title={viewerMedia.name}
                          onClick={(e) => e.stopPropagation()}
                          onError={(e) => {
                            console.error('Failed to load text file:', viewerMedia.url)
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gray-800 bg-opacity-80 rounded-lg">
                      <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">{viewerMedia.name}</h3>
                      <p className="text-gray-300 mb-4">This document type cannot be previewed inline.</p>
                      <div className="space-y-3">
                        <a
                          href={viewerMedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Document
                        </a>
                        <p className="text-xs text-gray-400">
                          Will open in a new tab
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Media Info */}
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg" style={{ zIndex: 10000 }}>
              <div className="text-center">
                <p className="font-medium">{viewerMedia.name}</p>
                {viewerMedia.totalCount > 1 && (
                  <p className="text-sm opacity-75">
                    {viewerMedia.index + 1} of {viewerMedia.totalCount}
                  </p>
                )}
              </div>
            </div>

            {/* Keyboard hint */}
            {viewerMedia.totalCount > 1 && (
              <div className="fixed top-4 left-4 bg-white bg-opacity-90 text-black text-sm px-3 py-2 rounded-lg shadow-lg" style={{ zIndex: 10000 }}>
                Use ← → arrows or click buttons to navigate
              </div>
            )}
          </div>
        </div>
      )}

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
