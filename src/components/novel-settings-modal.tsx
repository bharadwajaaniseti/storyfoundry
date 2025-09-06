'use client'

import React, { useState, useEffect } from 'react'
import { 
  Settings,
  Save,
  Trash2,
  EyeOff,
  Users,
  Globe,
  AlertTriangle,
  X,
  Edit
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseClient } from '@/lib/auth'

interface Project {
  id: string
  title: string
  logline: string
  synopsis?: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  owner_id: string
  created_at: string
  updated_at: string
}

interface NovelSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onProjectUpdate: (updatedProject: Project) => void
  onProjectDelete: () => void
}

export default function NovelSettingsModal({ 
  isOpen, 
  onClose, 
  project, 
  onProjectUpdate,
  onProjectDelete 
}: NovelSettingsModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Form state
  const [title, setTitle] = useState('')
  const [logline, setLogline] = useState('')
  const [format, setFormat] = useState('novel')
  const [genre, setGenre] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'preview' | 'public'>('private')

  // Initialize form values when project changes
  useEffect(() => {
    if (project) {
      setTitle(project.title || '')
      setLogline(project.logline || '')
      setFormat(project.format || 'novel')
      setGenre(project.genre || '')
      setVisibility(project.visibility || 'private')
    } else {
      // Reset to defaults when no project
      setTitle('')
      setLogline('')
      setFormat('novel')
      setGenre('')
      setVisibility('private')
    }
  }, [project])

  const handleSave = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: title.trim(),
          logline: logline.trim(),
          format,
          genre: genre.trim() || null,
          visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .select()
        .single()

      if (error) throw error

      onProjectUpdate(data)
      onClose()
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project || deleteConfirmText !== (project.title || '')) return

    setIsDeleting(true)
    try {
      const supabase = createSupabaseClient()
      
      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      onProjectDelete()
      onClose()
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'private':
        return <EyeOff className="w-4 h-4 text-gray-500" />
      case 'preview':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'public':
        return <Globe className="w-4 h-4 text-green-500" />
      default:
        return <EyeOff className="w-4 h-4 text-gray-500" />
    }
  }

  const hasChanges = project && (
    title !== (project.title || '') ||
    logline !== (project.logline || '') ||
    format !== (project.format || 'novel') ||
    genre !== (project.genre || '') ||
    visibility !== (project.visibility || 'private')
  )

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
        <DialogHeader className="border-b border-orange-100 pb-6 bg-gradient-to-r from-orange-50 to-amber-50 -m-6 mb-6 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Novel Settings
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 p-1">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">Novel Title</Label>
                <Input
                  id="title"
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter novel title..."
                  className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="logline" className="text-sm font-semibold text-gray-700 mb-2 block">Logline</Label>
                <Input
                  id="logline"
                  value={logline || ''}
                  onChange={(e) => setLogline(e.target.value)}
                  placeholder="Brief description of your novel..."
                  className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format" className="text-sm font-semibold text-gray-700 mb-2 block">Format</Label>
                  <select
                    id="format"
                    value={format || 'novel'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    <option value="novel">Novel</option>
                    <option value="short_story">Short Story</option>
                    <option value="novella">Novella</option>
                    <option value="screenplay">Screenplay</option>
                    <option value="treatment">Treatment</option>
                    <option value="pilot">TV Pilot</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="genre" className="text-sm font-semibold text-gray-700 mb-2 block">Genre</Label>
                  <select
                    id="genre"
                    value={genre || ''}
                    onChange={(e) => setGenre(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                  >
                    <option value="">Select genre...</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="science-fiction">Science Fiction</option>
                    <option value="mystery">Mystery</option>
                    <option value="thriller">Thriller</option>
                    <option value="romance">Romance</option>
                    <option value="historical">Historical</option>
                    <option value="contemporary">Contemporary</option>
                    <option value="young-adult">Young Adult</option>
                    <option value="literary">Literary</option>
                    <option value="horror">Horror</option>
                    <option value="adventure">Adventure</option>
                    <option value="drama">Drama</option>
                    <option value="comedy">Comedy</option>
                    <option value="biography">Biography</option>
                    <option value="non-fiction">Non-Fiction</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Visibility Settings</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Control who can see and access your novel</p>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-sm bg-white">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <EyeOff className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-800">Private</span>
                  </div>
                  <p className="text-sm text-gray-600">Only you can see your novel</p>
                </div>
              </label>

              <label className="flex items-start space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-sm bg-white">
                <input
                  type="radio"
                  name="visibility"
                  value="preview"
                  checked={visibility === 'preview'}
                  onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-gray-800">Preview</span>
                  </div>
                  <p className="text-sm text-gray-600">People with the link can view your novel</p>
                </div>
              </label>

              <label className="flex items-start space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-sm bg-white">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                  className="mt-1 w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <Globe className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-gray-800">Public</span>
                  </div>
                  <p className="text-sm text-gray-600">Anyone can discover and view your novel</p>
                </div>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-2 border-red-200 rounded-xl p-6 bg-gradient-to-br from-red-50 to-pink-50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-800">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Delete Novel</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Permanently delete this novel and all its content. This action cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-white shadow-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Novel
                  </Button>
                ) : (
                  <div className="space-y-4 bg-white rounded-lg p-4 border border-red-200">
                    <div>
                      <Label htmlFor="deleteConfirm" className="text-sm font-semibold text-red-700">
                        Type the novel title "<span className="font-bold">{project?.title || ''}</span>" to confirm deletion:
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmText || ''}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={project?.title || ''}
                        className="mt-2 border-red-300 focus:border-red-500 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDelete}
                        disabled={deleteConfirmText !== (project?.title || '') || isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                        }}
                        variant="outline"
                        className="bg-white shadow-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50 -m-1 p-6 rounded-b-lg">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-white border-gray-300 hover:bg-gray-50 shadow-sm"
            >
              Cancel
            </Button>
            
            {hasChanges && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
