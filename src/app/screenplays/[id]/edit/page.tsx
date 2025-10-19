'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Film, Users, Target, MapPin, Search, 
  ChevronRight, Plus, Download, Printer, Lightbulb,
  Zap, BarChart3, FileText, Timer, Type, AlignLeft,
  MessageSquare, Sparkles, Rocket, Layout, Settings, LogOut, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createSupabaseClient } from '@/lib/auth'
import ScreenplayEditor from '@/components/screenplay-editor'
import UserAvatar from '@/components/user-avatar'
import NotificationBell from '@/components/notification-bell'
import { ToastProvider } from '@/components/ui/toast'

// Type definitions
interface Project {
  id: string
  title: string
  logline: string
  synopsis?: string | null
  format: string
  genre: string | null
  subgenre?: string | null
  word_count?: number | null
  cast_size?: number | null
  language?: string
  visibility: 'private' | 'preview' | 'public'
  buzz_score?: number
  owner_id: string
  created_at: string
  updated_at: string
  owner?: {
    display_name: string
    avatar_url?: string
  }
}

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

interface Scene {
  id: string
  project_id: string
  scene_number: number
  heading: string
  content: string
  page_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  created_at: string
  updated_at: string
  parent_folder_id?: string
  sort_order?: number
  category: string
  icon_color?: string
}

// Sidebar navigation options - SCREENPLAY SPECIFIC
const SIDEBAR_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: Target, hasAdd: false, color: 'slate', description: 'Project overview and statistics' },
  { id: 'scenes', label: 'Scenes', icon: Film, hasAdd: true, color: 'orange', description: 'Write and organize your screenplay' },
]

function ScreenplayPageInner() {
  const router = useRouter()
  const params = useParams()
  
  // Core state
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<string>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isProjectOwner, setIsProjectOwner] = useState(false)
  
  // Data state
  const [worldElements, setWorldElements] = useState<WorldElement[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedElement, setSelectedElement] = useState<WorldElement | null>(null)
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  
  // Screenplay editor callback
  const [addElementCallback, setAddElementCallback] = useState<((type: string) => void) | null>(null)
  const [screenplayStats, setScreenplayStats] = useState<any>(null)
  const [togglePreviewMode, setTogglePreviewMode] = useState<((isPreview: boolean) => void) | null>(null)
  
  // Wrap setAddElementCallback in useCallback to prevent re-renders
  const handleAddElementCallback = useCallback((callback: (type: string) => void) => {
    setAddElementCallback(() => callback)
  }, [])
  
  const handlePreviewModeChange = useCallback((callback: (isPreview: boolean) => void) => {
    setTogglePreviewMode(() => callback)
  }, [])
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Permission checks
  const isOwner = currentUser?.id === project?.owner_id
  const canWrite = isOwner // Can be extended for collaborators later
  const canComment = true // All authenticated users can comment
  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const projectId = params.id as string
        if (!projectId) return
        
        // Check user authentication
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setCurrentUser(user)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, display_name, avatar_url, role')
              .eq('id', user.id)
              .single()
            if (profile) setUserProfile(profile)
          } catch (e) {
            console.warn('Failed to load user profile', e)
          }
        }
        
        // Fetch project
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            setProject(null)
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const projectData = await response.json()
        
        // Verify screenplay format
        if (projectData.format !== 'screenplay' && projectData.format !== 'Screenplay') {
          router.push(`/app/projects/${projectId}`)
          return
        }

        const isOwner = projectData.owner_id === user?.id
        setIsProjectOwner(isOwner)
        
        if (isOwner) {
          setProject(projectData)
        } else {
          // Check collaborator access
          try {
            const { data: collabRow } = await supabase
              .from('project_collaborators')
              .select('*')
              .eq('project_id', projectId)
              .eq('user_id', user?.id)
              .eq('status', 'active')
              .single()

            if (collabRow) {
              setProject(projectData)
            } else {
              router.push(`/app/projects`)
              return
            }
          } catch (e) {
            router.push(`/app/projects`)
            return
          }
        }
        
        // Load world elements
        await loadWorldElements(projectId)
        
      } catch (error) {
        console.error('Error loading screenplay:', error)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [params, router])

  const loadWorldElements = async (projectId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setWorldElements(data || [])
    } catch (error) {
      console.error('Failed to load world elements:', error)
    }
  }

  const getTotalItemsForCategory = (category: string): number => {
    if (category === 'scenes') {
      return scenes.length
    }
    return worldElements.filter(el => el.category === category).length
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleBack = () => {
    router.push('/app/projects')
  }

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const renderPanelContent = () => {
    if (!project) return null

    switch (activePanel) {
      case 'dashboard':
        return (
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Scenes Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Scenes</h4>
                    <p className="text-sm text-gray-500">Story structure</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {scenes.length}
                </div>
                <p className="text-sm text-gray-600">
                  Total scenes written
                </p>
              </div>

              {/* Characters Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Characters</h4>
                    <p className="text-sm text-gray-500">Cast members</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {worldElements.filter(el => el.category === 'characters').length}
                </div>
                <p className="text-sm text-gray-600">
                  Developed characters
                </p>
              </div>

              {/* Locations Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Locations</h4>
                    <p className="text-sm text-gray-500">Settings</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {worldElements.filter(el => el.category === 'locations').length}
                </div>
                <p className="text-sm text-gray-600">
                  Shooting locations
                </p>
              </div>
            </div>

            {/* Quick Start Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Get Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Ready to start your screenplay? The enhanced editor includes everything you need: scene writing, character tracking, and analytics - all in one place.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white justify-start h-12"
                      onClick={() => setActivePanel('scenes')}
                    >
                      <Film className="w-5 h-5 mr-2" />
                      Open Screenplay Editor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'scenes':
        // Use the full screenplay editor component
        return (
          <div className="-m-6">
            <ScreenplayEditor
              projectId={project.id}
              onAddElementCallback={handleAddElementCallback}
              onStatsUpdate={setScreenplayStats}
              onPreviewModeChange={handlePreviewModeChange}
              hideSidebar={true}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screenplay...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Screenplay not found</h2>
          <p className="text-gray-600 mb-4">The screenplay you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0'
      } overflow-hidden shadow-sm`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 truncate text-sm">{project.title}</h2>
              <p className="text-xs text-gray-500">{project.genre || 'Screenplay'}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {activePanel !== 'scenes' ? (
            // Regular navigation
            SIDEBAR_OPTIONS.map((option) => {
              const Icon = option.icon
              const totalItems = getTotalItemsForCategory(option.id)
              const isExpanded = expandedCategories.includes(option.id)
              const isActive = activePanel === option.id
              const canExpand = totalItems > 0 && option.hasAdd

              return (
                <div key={option.id} className="mb-1">
                  <div
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setActivePanel(option.id)
                      if (totalItems > 0) {
                        toggleCategoryExpansion(option.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 ${isActive ? 'text-orange-600' : `text-${option.color}-500`}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {sidebarOpen && (
                        <span className={`font-medium text-sm truncate ${isActive ? 'text-orange-700' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                      )}
                    </div>
                    
                    {sidebarOpen && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {totalItems > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-orange-200 text-orange-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {totalItems}
                          </span>
                        )}
                        {option.hasAdd && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActivePanel(option.id)
                            }}
                            className={`p-1 rounded transition-colors ${
                              isActive
                                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                            }`}
                            title={`Add new ${option.label.slice(0, -1).toLowerCase()}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canExpand && (
                          <div className="p-1">
                            {isExpanded ? (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 transform rotate-90 transition-transform" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 transition-transform" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            // Screenplay Tools when Scenes is active
            <div className="space-y-4">
              {/* Screenplay Elements */}
              <div>
                <div className="px-3 py-2 mb-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Screenplay Elements
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Click to add or use Tab key</p>
                </div>
                
                <div className="space-y-1">
                  <button
                    onClick={() => addElementCallback?.('scene_heading')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-transparent hover:border-blue-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Film className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Scene Heading</div>
                        <div className="text-xs text-gray-500 truncate">INT./EXT. LOCATION</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElementCallback?.('action')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 border border-transparent hover:border-green-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <AlignLeft className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Action</div>
                        <div className="text-xs text-gray-500 truncate">Scene description</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElementCallback?.('character')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 border border-transparent hover:border-purple-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Character</div>
                        <div className="text-xs text-gray-500 truncate">Character name</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElementCallback?.('dialogue')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 transition-all duration-200 border border-transparent hover:border-amber-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Dialogue</div>
                        <div className="text-xs text-gray-500 truncate">Character speech</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElementCallback?.('parenthetical')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 transition-all duration-200 border border-transparent hover:border-pink-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Type className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Parenthetical</div>
                        <div className="text-xs text-gray-500 truncate">(wryly)</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => addElementCallback?.('transition')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 transition-all duration-200 border border-transparent hover:border-indigo-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-900">Transition</div>
                        <div className="text-xs text-gray-500 truncate">CUT TO:</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="px-3 py-2 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <h4 className="font-medium text-xs text-gray-900 flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5 text-blue-500" />
                    Quick Actions
                  </h4>
                </div>
                <div className="space-y-0.5">
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">Export Script</span>
                  </button>
                  <button 
                    onClick={() => setActivePanel('dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-2"
                  >
                    <Target className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">View Dashboard</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">Print Script</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <div className="px-3 py-2 mb-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <h4 className="font-medium text-xs text-gray-900 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    Shortcuts
                  </h4>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Tab</span>
                    <span className="text-xs font-medium text-gray-800">Change Type</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Enter</span>
                    <span className="text-xs font-medium text-gray-800">New Element</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs text-gray-600">Ctrl+S</span>
                    <span className="text-xs font-medium text-gray-800">Save</span>
                  </div>
                </div>
              </div>

              {/* Live Statistics */}
              {screenplayStats && (
                <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-lg border border-orange-200 p-3">
                  <div className="mb-2">
                    <h4 className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                      Live Stats
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 px-2 bg-white/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs text-gray-700 flex items-center gap-1.5">
                        <Film className="w-3 h-3 text-blue-500" /> Scenes
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{screenplayStats.scenes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 px-2 bg-white/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs text-gray-700 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-green-500" /> Pages
                      </span>
                      <span className="font-bold text-gray-900 text-sm">~{screenplayStats.pages || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 px-2 bg-white/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs text-gray-700 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-purple-500" /> Characters
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{screenplayStats.characters || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 px-2 bg-white/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs text-gray-700 flex items-center gap-1.5">
                        <Timer className="w-3 h-3 text-orange-500" /> Runtime
                      </span>
                      <span className="font-bold text-gray-900 text-sm">~{screenplayStats.estimatedRuntime || 0}m</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${sidebarOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                <div className="h-6 w-px bg-gray-300" />
                
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {project.title}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {project.genre ? `${project.genre} • ` : ''}Screenplay
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={() => togglePreviewMode?.(true)}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
                  onClick={() => togglePreviewMode?.(false)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                
                <div className="h-6 w-px bg-gray-300" />
                
                <NotificationBell />
                
                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none">
                      <UserAvatar user={userProfile || currentUser} size="sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                    <DropdownMenuLabel className="font-semibold">
                      {userProfile?.display_name || currentUser?.email || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/app/settings')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/app/settings')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">{renderPanelContent()}</div>
        </div>
      </div>
    </div>
  )
}

export default function ScreenplayPage() {
  return (
    <ToastProvider>
      <ScreenplayPageInner />
    </ToastProvider>
  )
}
