'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  Share2,
  Users,
  Settings,
  Eye,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
  History,
  Download,
  Sparkles,
  AlertCircle,
  Check
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import NovelWriter from '@/components/novel-writer'
import NovelOutline from '@/components/novel-outline'
import NovelDashboard from '@/components/novel-dashboard'

interface Project {
  id: string
  title: string
  logline: string
  description: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  word_count?: number
  ai_enabled?: boolean
  ip_protection_enabled?: boolean
  created_at: string
  updated_at: string
  owner_id: string
}

interface ProjectAsset {
  id: string
  project_id: string
  filename: string
  content: string
  asset_type: string
  created_at: string
  updated_at: string
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const [editingLogline, setEditingLogline] = useState(false)
  const [loglineValue, setLoglineValue] = useState('')

  // Unwrap params using React.use()
  const resolvedParams = React.use(params)

  // Handle browser history for proper back navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const from = urlParams.get('from')
      
      // Replace the current history entry to set up proper back navigation
      if (from) {
        const backUrl = from === 'library' ? '/app/library' : from === 'search' ? '/app/search' : '/app/dashboard'
        
        // Push the back URL to history so browser back button works correctly
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        window.history.pushState({ backUrl }, '', window.location.pathname + window.location.search)
        
        // Handle browser back button
        const handlePopState = (event: PopStateEvent) => {
          if (event.state && event.state.backUrl) {
            router.push(event.state.backUrl)
          } else {
            router.push(backUrl)
          }
        }
        
        window.addEventListener('popstate', handlePopState)
        
        return () => {
          window.removeEventListener('popstate', handlePopState)
        }
      }
    }
  }, [])

  useEffect(() => {
    loadProject()
  }, [resolvedParams.id])

  // Reload project data when returning from settings or other pages
  useEffect(() => {
    const handleFocus = () => {
      // Only reload if we're not currently loading and not editing logline
      if (!isLoading && !editingLogline) {
        loadProject()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [isLoading, editingLogline, resolvedParams.id])

  const loadProject = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (projectError || !projectData) {
        router.push('/app/dashboard')
        return
      }

      // Check if user has access
      if (projectData.owner_id !== user.id) {
        // TODO: Check collaborator access
        router.push('/app/dashboard')
        return
      }

      setProject(projectData)
      setLoglineValue(projectData.logline)

      // Load project content
      const { data: contentData, error: contentError } = await supabase
        .from('project_content')
        .select('*')
        .eq('project_id', resolvedParams.id)
        .eq('asset_type', 'content')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (contentError) {
        console.log('No content found for project (this is normal for new projects):', contentError.message)
      } else if (contentData && contentData.length > 0) {
        setContent(contentData[0].content || '')
      }

    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveContent = async () => {
    if (!project || isSaving) return

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const supabase = createSupabaseClient()

      // Calculate word count using the same method as the frontend display
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length

      // Save/update content
      const { error } = await supabase
        .from('project_content')
        .upsert({
          project_id: project.id,
          filename: `${project.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
          content,
          asset_type: 'content'
        })

      if (error) throw error

      // Update project with new word count and updated_at
      await supabase
        .from('projects')
        .update({ 
          word_count: wordCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', project.id)

      // Update local project state to reflect the new word count
      setProject({ ...project, word_count: wordCount })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)

    } catch (error) {
      console.error('Error saving content:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const saveLogline = async () => {
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
      console.error('Error saving logline:', error)
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="w-4 h-4 text-green-500" />
      case 'preview': return <Users className="w-4 h-4 text-orange-500" />
      case 'private': return <Shield className="w-4 h-4 text-gray-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search)
              const from = urlParams.get('from')
              const backUrl = from === 'library' ? '/app/library' : from === 'search' ? '/app/search' : '/app/dashboard'
              router.push(backUrl)
            }}
            className="btn-primary"
          >
            Back to {(() => {
              const urlParams = new URLSearchParams(window.location.search)
              const from = urlParams.get('from')
              return from === 'library' ? 'Library' : from === 'search' ? 'Search' : 'Dashboard'
            })()}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  // Get the from parameter from the current URL
                  const currentUrl = new URL(window.location.href)
                  const from = currentUrl.searchParams.get('from')
                  console.log('App back button clicked. Current URL:', window.location.href)
                  console.log('From parameter:', from)
                  
                  let backUrl = '/app/dashboard' // default
                  if (from === 'library') {
                    backUrl = '/app/library'
                  } else if (from === 'search') {
                    backUrl = '/app/search'
                  }
                  
                  console.log('Navigating to:', backUrl)
                  router.push(backUrl)
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-semibold text-gray-800">{project.title}</h1>
                  {getVisibilityIcon(project.visibility)}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {project.format}
                  </span>
                  {project.genre && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                      {project.genre}
                    </span>
                  )}
                </div>
                {editingLogline ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={loglineValue}
                      onChange={(e) => setLoglineValue(e.target.value)}
                      className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 flex-1"
                      placeholder="Enter logline..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          saveLogline()
                        }
                        if (e.key === 'Escape') {
                          setEditingLogline(false)
                          setLoglineValue(project.logline)
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={saveLogline}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingLogline(false)
                        setLoglineValue(project.logline)
                      }}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p 
                    className="text-sm text-gray-600 mt-1 cursor-pointer hover:text-gray-800 hover:bg-gray-50 px-1 py-1 rounded"
                    onClick={() => {
                      setEditingLogline(true)
                      setLoglineValue(project.logline)
                    }}
                    title="Click to edit logline"
                  >
                    {project.logline}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Save Status */}
              {saveStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600">Error saving</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={saveContent}
                disabled={isSaving}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>

              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <Link href={`/app/projects/${project.id}/settings`}>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('write')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'write'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {project?.format === 'novel' ? 'Chapters' : 'Write'}
              </button>
              {project?.format === 'novel' && (
                <>
                  <button
                    onClick={() => setActiveTab('outline')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'outline'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Outline
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-2 border-b-2 transition-colors ${
                      activeTab === 'dashboard'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Dashboard
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('collaborators')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'collaborators'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Collaborators
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                History
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {activeTab === 'write' && (
          <>
            {project?.format === 'novel' ? (
              <div className="-mx-6 -my-8 ml-[-83px]" style={{ height: 'calc(100vh - 200px)' }}>
                <NovelWriter 
                  projectId={project.id} 
                  project={{
                    id: project.id,
                    title: project.title,
                    word_count: project.word_count || 0,
                    target_word_count: 80000, // Default target for novels
                    format: project.format
                  }}
                />
              </div>
            ) : (
              <div className="grid lg:grid-cols-4 gap-8">
                {/* Main Editor */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl border border-gray-200 min-h-[600px]">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">Content</h2>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[500px] border-none outline-none resize-none text-gray-800 leading-relaxed"
                    placeholder="Start writing your story here..."
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Assistant */}
              {project.ai_enabled && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Get AI-powered suggestions for your story
                  </p>
                  <button className="w-full btn-secondary text-sm">
                    Analyze Current Content
                  </button>
                </div>
              )}

              {/* Project Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count</span>
                    <span className="font-medium">{content.split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Character Count</span>
                    <span className="font-medium">{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buzz Score</span>
                    <span className="font-medium">{project.buzz_score}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Download className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Export as PDF</span>
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Export as DOCX</span>
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Create Timestamp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
            )}
          </>
        )}

        {activeTab === 'outline' && project?.format === 'novel' && (
          <NovelOutline 
            projectId={project.id}
            chapters={[]} // Will be loaded within the component
          />
        )}

        {activeTab === 'dashboard' && project?.format === 'novel' && (
          <NovelDashboard 
            projectId={project.id}
            chapters={[]} // Will be loaded within the component
            totalWordCount={project.word_count || 0}
            targetWordCount={80000}
          />
        )}

        {activeTab === 'overview' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Overview</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Format</label>
                      <p className="font-medium">{project.format}</p>
                    </div>
                    {project.genre && (
                      <div>
                        <label className="text-sm text-gray-600">Genre</label>
                        <p className="font-medium">{project.genre}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600">Visibility</label>
                      <p className="font-medium capitalize">{project.visibility}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Created</label>
                      <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${project.ai_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">AI Assistant {project.ai_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${project.ip_protection_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm">IP Protection {project.ip_protection_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {project.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Collaborators</h2>
                <button className="btn-primary">Invite Collaborator</button>
              </div>
              
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No collaborators yet</h3>
                <p className="text-gray-600">Invite others to collaborate on this project</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Version History</h2>
              
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No version history</h3>
                <p className="text-gray-600">Content versions will appear here as you make changes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
