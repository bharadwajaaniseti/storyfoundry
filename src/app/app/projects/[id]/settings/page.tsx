'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  Globe,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface Project {
  id: string
  title: string
  logline: string
  description: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  ai_enabled?: boolean
  ip_protection_enabled?: boolean
  created_at: string
  updated_at: string
  owner_id: string
}

export default function ProjectSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'preview' | 'public'>('private')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Project info editing states
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingLogline, setEditingLogline] = useState(false)
  const [loglineValue, setLoglineValue] = useState('')
  const [formatValue, setFormatValue] = useState('')
  const [genreValue, setGenreValue] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [ipProtectionEnabled, setIpProtectionEnabled] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }

      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .single()

      if (error) {
        console.error('Error loading project:', error)
        router.push('/app/projects')
        return
      }

      setProject(projectData)
      setVisibility(projectData.visibility)
      setTitleValue(projectData.title)
      setLoglineValue(projectData.logline)
      setFormatValue(projectData.format)
      setGenreValue(projectData.genre || '')
      // These columns might not exist yet in the database
      setAiEnabled(projectData.ai_enabled ?? false)
      setIpProtectionEnabled(projectData.ip_protection_enabled ?? false)
    } catch (error) {
      console.error('Error:', error)
      router.push('/app/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveVisibility = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .update({ visibility })
        .eq('id', project.id)

      if (error) {
        throw error
      }

      setProject({ ...project, visibility })
      // You could add a toast notification here
    } catch (error) {
      console.error('Error updating visibility:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!project || !titleValue.trim()) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .update({ 
          title: titleValue.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (error) throw error

      setProject({ ...project, title: titleValue.trim() })
      setEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  const handleSaveLogline = async () => {
    if (!project || !loglineValue.trim()) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .update({ 
          logline: loglineValue.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (error) throw error

      setProject({ ...project, logline: loglineValue.trim() })
      setEditingLogline(false)
    } catch (error) {
      console.error('Error updating logline:', error)
    }
  }

  const handleSaveProjectInfo = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('projects')
        .update({ 
          format: formatValue,
          genre: genreValue || null,
          ai_enabled: aiEnabled,
          ip_protection_enabled: ipProtectionEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (error) throw error

      setProject({ 
        ...project, 
        format: formatValue,
        genre: genreValue || null,
        ai_enabled: aiEnabled,
        ip_protection_enabled: ipProtectionEnabled
      })
    } catch (error) {
      console.error('Error updating project info:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmText !== project.title) return

    setIsDeleting(true)
    try {
      const supabase = createSupabaseClient()
      
      // Delete project assets first
      await supabase
        .from('project_assets')
        .delete()
        .eq('project_id', project.id)

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) {
        throw error
      }

      router.push('/app/projects')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project settings...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/app/projects/${projectId}`}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Project Settings</h1>
              <p className="text-gray-600">{project.title}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Project Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Project Information</h2>
            </div>

            <div className="space-y-6">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                {editingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter project title..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveTitle()
                        if (e.key === 'Escape') {
                          setEditingTitle(false)
                          setTitleValue(project.title)
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTitle(false)
                        setTitleValue(project.title)
                      }}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-800">{project.title}</span>
                    <button
                      onClick={() => {
                        setEditingTitle(true)
                        setTitleValue(project.title)
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Logline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logline</label>
                {editingLogline ? (
                  <div className="space-y-2">
                    <textarea
                      value={loglineValue}
                      onChange={(e) => setLoglineValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter project logline..."
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveLogline}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingLogline(false)
                          setLoglineValue(project.logline)
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-800">{project.logline}</span>
                    <button
                      onClick={() => {
                        setEditingLogline(true)
                        setLoglineValue(project.logline)
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700 ml-2"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Format and Genre */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={formatValue}
                    onChange={(e) => setFormatValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="feature">Feature Film</option>
                    <option value="short">Short Film</option>
                    <option value="series">TV Series</option>
                    <option value="pilot">TV Pilot</option>
                    <option value="documentary">Documentary</option>
                    <option value="novel">Novel</option>
                    <option value="short_story">Short Story</option>
                    <option value="stage_play">Stage Play</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={genreValue}
                    onChange={(e) => setGenreValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Genre</option>
                    <option value="action">Action</option>
                    <option value="adventure">Adventure</option>
                    <option value="comedy">Comedy</option>
                    <option value="drama">Drama</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="horror">Horror</option>
                    <option value="mystery">Mystery</option>
                    <option value="romance">Romance</option>
                    <option value="sci-fi">Science Fiction</option>
                    <option value="thriller">Thriller</option>
                    <option value="western">Western</option>
                    <option value="biographical">Biographical</option>
                    <option value="historical">Historical</option>
                    <option value="musical">Musical</option>
                    <option value="animation">Animation</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">AI Assistant</span>
                    <span className="text-xs text-gray-500">Enable AI-powered writing assistance</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={ipProtectionEnabled}
                      onChange={(e) => setIpProtectionEnabled(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">IP Protection</span>
                    <span className="text-xs text-gray-500">Enhanced intellectual property protection</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              {(formatValue !== project.format || 
                genreValue !== (project.genre || '') || 
                aiEnabled !== (project.ai_enabled || false) || 
                ipProtectionEnabled !== (project.ip_protection_enabled || false)) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveProjectInfo}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Project Info'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Visibility Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Control who can see and access your project
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <EyeOff className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">Private</span>
                    </div>
                    <p className="text-sm text-gray-600">Only you can see this project</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="preview"
                    checked={visibility === 'preview'}
                    onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-800">Preview</span>
                    </div>
                    <p className="text-sm text-gray-600">People with the link can view your project</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(e) => setVisibility(e.target.value as 'private' | 'preview' | 'public')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Globe className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-800">Public</span>
                    </div>
                    <p className="text-sm text-gray-600">Anyone can discover and view your project</p>
                  </div>
                </label>
              </div>

              {visibility !== project.visibility && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveVisibility}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Delete Project</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete this project and all its content. This action cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Project</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-3">
                        To confirm deletion, please type the project name: <strong>{project.title}</strong>
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Enter project name"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleDeleteProject}
                        disabled={deleteConfirmText !== project.title || isDeleting}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
