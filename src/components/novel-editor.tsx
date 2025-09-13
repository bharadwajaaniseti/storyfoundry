'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save,
  Share2,
  Settings,
  Users,
  History,
  BookOpen,
  FileText,
  BarChart3,
  Eye,
  UserPlus,
  Clock,
  ChevronDown
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import NovelWriter from './novel-writer'
import NovelOutline from './novel-outline'
import NovelDashboard from './novel-dashboard'
import NovelSettingsModal from './novel-settings-modal'
import EditorApprovalInterface from './editor-approval-interface'
import RoleBasedNovelEditor from './role-based-novel-editor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

interface Chapter {
  id: string
  title: string
  content: string
  word_count: number
  order_index: number
  chapter_number: number
  target_word_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  created_at: string
  updated_at: string
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
}

interface Character {
  id?: string
  name: string
  description: string
  image_url?: string
  sections: any[]
  created_at?: string
  updated_at?: string
}

interface NovelEditorProps {
  projectId: string
}

const TABS = [
  { key: 'chapters', label: 'Chapters', icon: BookOpen, color: 'blue' },
  { key: 'outline', label: 'Outline', icon: FileText, color: 'green' },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'purple' },
  { key: 'overview', label: 'Overview', icon: Eye, color: 'orange' },
  { key: 'collaborators', label: 'Collaborators', icon: Users, color: 'pink' },
  { key: 'approvals', label: 'Approvals', icon: Clock, color: 'yellow' },
  { key: 'history', label: 'History', icon: History, color: 'indigo' }
]

export default function NovelEditor({ projectId }: NovelEditorProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeTab, setActiveTab] = useState('chapters')
  const [isLoading, setIsLoading] = useState(true)
  const [totalWordCount, setTotalWordCount] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'other' | null>(null)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)

  useEffect(() => {
    loadProject()
    loadChapters()
    checkUserRole()
  }, [projectId])

  useEffect(() => {
    const total = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0)
    setTotalWordCount(total)
  }, [chapters])

  useEffect(() => {
    if (userRole === 'owner') {
      loadPendingApprovalsCount()
    }
  }, [userRole])

  const loadProject = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  const checkUserRole = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Check if user is project owner
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (project?.owner_id === user.id) {
        setUserRole('owner')
        return
      }

      // Check if user is a collaborator and their role
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, secondary_roles')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaborator) {
        const isEditor = collaborator.role === 'editor' || 
                        (collaborator.secondary_roles && collaborator.secondary_roles.includes('editor'))
        setUserRole(isEditor ? 'editor' : 'other')
      } else {
        setUserRole('other')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      setUserRole('other')
    }
  }

  const loadPendingApprovalsCount = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/approvals`)
      const data = await response.json()
      
      if (data.success) {
        setPendingApprovalsCount(data.pendingChanges?.length || 0)
      }
    } catch (error) {
      console.error('Error loading pending approvals count:', error)
    }
  }

  const loadChapters = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) throw error
      
      // Map the data to include default values for missing fields
      const mappedChapters = (data || []).map(chapter => ({
        ...chapter,
        chapter_number: chapter.chapter_number || chapter.order_index + 1,
        target_word_count: chapter.target_word_count || 2000,
        status: chapter.status || 'draft',
        notes: chapter.notes || '',
        updated_at: chapter.updated_at || chapter.created_at
      }))
      
      setChapters(mappedChapters)
    } catch (error) {
      console.error('Error loading chapters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    // Auto-save functionality
    setLastSaved(new Date())
    // Add your save logic here
  }

  const handleShare = () => {
    // Share functionality
    console.log('Share project')
  }

  const handleSettings = () => {
    setShowSettingsModal(true)
  }

  const goBackToDashboard = () => {
    router.push('/projects')
  }

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
    setLastSaved(new Date())
  }

  const handleProjectDelete = () => {
    router.push('/projects')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading novel editor...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project not found</h2>
          <Button onClick={goBackToDashboard} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    if (!project) return null
    
    switch (activeTab) {
      case 'chapters':
        return (
          <div className="h-full">
            <RoleBasedNovelEditor 
              projectId={projectId}
              content=""
              onContentChange={() => {}}
              onSave={() => {}}
              isLoading={false}
            />
          </div>
        )
      case 'outline':
        return (
          <div className="h-full">
            <NovelOutline 
              projectId={projectId}
              chapters={chapters}
            />
          </div>
        )
      case 'dashboard':
        return (
          <div className="h-full">
            <NovelDashboard 
              projectId={projectId}
              chapters={chapters}
              totalWordCount={totalWordCount}
            />
          </div>
        )
      case 'overview':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Project Details</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Title:</span> {project.title}</p>
                      <p><span className="font-medium">Genre:</span> <Badge>{project.genre}</Badge></p>
                      <p><span className="font-medium">Created:</span> {new Date(project.created_at).toLocaleDateString()}</p>
                      <p><span className="font-medium">Last Updated:</span> {new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Writing Progress</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Chapters:</span> {chapters.length}</p>
                      <p><span className="font-medium">Total Words:</span> {totalWordCount.toLocaleString()}</p>
                      <p><span className="font-medium">Average per Chapter:</span> {chapters.length > 0 ? Math.round(totalWordCount / chapters.length).toLocaleString() : 0}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{project.logline || 'No description provided.'}</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'collaborators':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Collaborators</h2>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </div>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No collaborators yet</h3>
                  <p className="text-gray-600">Invite others to collaborate on your novel</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'approvals':
        return (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              {userRole === 'owner' ? (
                <EditorApprovalInterface 
                  projectId={projectId}
                  onApprovalProcessed={() => {
                    loadPendingApprovalsCount()
                    setLastSaved(new Date())
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Approvals</h2>
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Access Restricted</h3>
                    <p className="text-gray-600">Only project owners can view pending approvals</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 'history':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Version History</h2>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No version history</h3>
                  <p className="text-gray-600">Version history will appear here as you save changes</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            {/* Top Row - Project Info & Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={goBackToDashboard}
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">{project.title}</h1>
                    <p className="text-sm text-gray-600">{project.logline}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {project.genre}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={handleSettings} variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                const showBadge = tab.key === 'approvals' && userRole === 'owner' && pendingApprovalsCount > 0
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive
                        ? `bg-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-200`
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {showBadge && (
                      <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.2rem] h-5">
                        {pendingApprovalsCount}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      {/* Novel Settings Modal */}
      <NovelSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        project={project}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
      />
    </div>
  )
}
