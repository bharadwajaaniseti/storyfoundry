'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  Share2,
  Users,
  Settings,
  Eye,
  Edit3,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
  History,
  Download,
  Sparkles,
  CheckCircle,
  Database,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import NovelWriter from '@/components/novel-writer'
import NovelOutline from '@/components/novel-outline'
import NovelDashboard from '@/components/novel-dashboard'
import ProjectCollaborationButton from '@/components/project-collaboration-button'
import SendMessageModal from '@/components/send-message-modal'
import EditCollaboratorModal from '@/components/edit-collaborator-modal'
import { PermissionGate, RoleBadge } from '@/components/permission-gate'
import RoleSpecificSidebar from '@/components/role-specific-sidebar'
import ProjectComments from '@/components/project-comments'
import ProjectHistory from '@/components/project-history'
import ApprovedWorkflow from '@/components/approved-workflow'
import { useProjectCollaborators } from '@/hooks/useCollaboration'
import { useRealtimeProjectContent, useRealtimeProject } from '@/hooks/useRealtimeProject'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/toast'

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

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  // Get project ID from params
  const projectId = params.id as string

  // Real-time content and project
  const { 
    content: realtimeContent, 
    setContent: setRealtimeContent, 
    lastUpdated: contentLastUpdated,
    hasRealtimeUpdate,
    clearRealtimeUpdate
  } = useRealtimeProjectContent(projectId)
  
  const { 
    project: realtimeProject, 
    setProject: setRealtimeProject 
  } = useRealtimeProject(projectId)

  // Use realtime data or fallback to local state
  const content = realtimeContent
  const setContent = setRealtimeContent
  const project = realtimeProject

  // If this is a novel project, redirect legacy /app/projects/:id to canonical /novels/:id
  // If this is a screenplay project, redirect to /screenplays/:id/read
  useEffect(() => {
    try {
      if (project && typeof project.format === 'string') {
        const format = project.format.toLowerCase()
        if (format === 'novel') {
          router.replace(`/novels/${projectId}`)
        } else if (format === 'screenplay') {
          router.replace(`/screenplays/${projectId}/read`)
        }
      }
    } catch (e) {
      console.warn('Redirect to canonical route failed', e)
    }
  }, [project, projectId, router])

  // Local state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get permissions for the current user (only after currentUser is loaded)
  const { userRole: currentUserRole, permissions: currentUserPermissions } = useRoleBasedUI(
    projectId,
    currentUser?.id // Pass the userId to ensure hook has user context
  )
  
  console.log('Main page hook result:', { 
    currentUserRole, 
    isOwner: currentUserPermissions?.isOwner,
    hasCurrentUser: !!currentUser,
    currentUserId: currentUser?.id
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const [editingLogline, setEditingLogline] = useState(false)
  const hasLoadedRef = useRef(false)
  const [loglineValue, setLoglineValue] = useState('')
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{
    id: string
    display_name: string | null
    avatar_url: string | null
    role: string
  } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<any>(null)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'other' | null>(null)
  const [originalContent, setOriginalContent] = useState('')
  
  // Comment functionality state
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [sidebarCommentText, setSidebarCommentText] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  // Content sync status tracking
  const [syncStatus, setSyncStatus] = useState<{
    hasProjectContent: boolean
    hasProjectSynopsis: boolean
    isSync: boolean
    source: 'dual' | 'synopsis' | 'content' | 'none'
    lastChecked: Date | null
  }>({
    hasProjectContent: false,
    hasProjectSynopsis: false,
    isSync: false,
    source: 'none',
    lastChecked: null
  })

  // Toast notifications
  const { addToast } = useToast()

  // Collaboration data
  const { collaborators, pendingInvitations, loading: collaboratorsLoading, error: collaboratorsError, refresh: refreshCollaborators } = useProjectCollaborators(projectId)

  // Comment loading function
  const loadComments = async () => {
    if (!projectId) return
    
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        console.error('Failed to load comments:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Load current user
  useEffect(() => {
    async function loadCurrentUser() {
      console.log('Loading current user...')
      try {
        const supabase = createSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting current user:', error)
          return
        }
        console.log('Current user loaded:', user)
        setCurrentUser(user)
      } catch (error) {
        console.error('Failed to load current user:', error)
      }
    }
    loadCurrentUser()
  }, [])

  // Load comments for the project
  useEffect(() => {
    loadComments()
  }, [projectId])

  // Real-time comment subscription
  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()
    const channel = supabase
      .channel(`project-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_project_comments',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Real-time comment update:', payload)
          if (payload.eventType === 'INSERT') {
            // Fetch the complete comment with user data
            const { data: newComment } = await supabase
              .from('collaboration_project_comments')
              .select(`
                id,
                content,
                created_at,
                updated_at,
                parent_id,
                user:profiles!collaboration_project_comments_user_id_fkey (
                  id,
                  display_name,
                  avatar_url,
                  verified_pro
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (newComment && newComment.user && !Array.isArray(newComment.user)) {
              setComments(prev => [...prev, newComment as any])
            }
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => 
              prev.map(comment => 
                comment.id === payload.new.id 
                  ? { ...comment, ...payload.new }
                  : comment
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => 
              prev.filter(comment => comment.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  // Handler functions for collaboration actions
  const handleSendMessage = (userId: string, userName?: string, userAvatar?: string, userRole?: string) => {
    setMessageRecipient({
      id: userId,
      display_name: userName || null,
      avatar_url: userAvatar || null,
      role: userRole || 'collaborator'
    })
    setShowMessageModal(true)
  }

  const handleEditCollaborator = (collaborator: any) => {
    setEditingCollaborator(collaborator)
    setShowEditModal(true)
  }

  const handleUpdateCollaborator = async (collaboratorId: string, updates: { role?: string; royalty_split?: number }) => {
    try {
      const response = await fetch(`/api/collaborations/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        refreshCollaborators()
      } else {
        throw new Error('Failed to update collaborator')
      }
    } catch (error) {
      throw error
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/collaborations/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        refreshCollaborators()
      } else {
        throw new Error('Failed to remove collaborator')
      }
    } catch (error) {
      throw error
    }
  }

  // Comment functionality
  const submitComment = async (text: string, isFromSidebar = false) => {
    if (!text.trim() || !currentUser) return

    try {
      setIsSubmittingComment(true)
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim()
        })
      })

      if (response.ok) {
        // Clear the appropriate textarea
        if (isFromSidebar) {
          setSidebarCommentText('')
        } else {
          setCommentText('')
        }
        
        addToast({
          type: 'success',
          title: 'Comment added',
          message: 'Your comment has been posted successfully.'
        })
      } else {
        // Get the error message from the API response
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to post comment'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      addToast({
        type: 'error',
        title: 'Failed to post comment',
        message: errorMessage
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    
    try {
      const response = await fetch(`/api/collaborations/invitations/${invitationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        refreshCollaborators()
      } else {
        alert('Failed to cancel invitation')
      }
    } catch (error) {
      alert('Error canceling invitation')
    }
  }

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
    if (projectId && !project && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadProject()
    }
  }, [projectId])

  // Check user role when project loads
  useEffect(() => {
    if (project && currentUser) {
      checkUserRole()
    }
  }, [project, currentUser])

  // Store original content when content first loads or when user becomes an editor
  useEffect(() => {
    if (content && userRole === 'editor' && originalContent !== content) {
      // Only set original content if we haven't set it yet, or if it's different (page reload case)
      if (!originalContent || originalContent === '') {
        setOriginalContent(content)
        console.log('Set original content for editor:', content.slice(0, 50) + '...')
      }
    }
  }, [content, userRole])

  // Set up real-time comment subscription
  useEffect(() => {
    if (!projectId) return

    const supabase = createSupabaseClient()

    // Set up real-time subscription for comments
    const channel = supabase
      .channel(`collaboration_project_comments:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_project_comments',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new comment with user data
            const { data: newComment } = await supabase
              .from('collaboration_project_comments')
              .select(`
                id,
                content,
                created_at,
                updated_at,
                parent_id,
                user:profiles (
                  id,
                  display_name,
                  avatar_url,
                  verified_pro
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (newComment && newComment.user && !Array.isArray(newComment.user)) {
              setComments(prev => [newComment as any, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => 
              prev.map(comment => 
                comment.id === payload.new.id 
                  ? { ...comment, ...payload.new }
                  : comment
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => 
              prev.filter(comment => comment.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const checkUserRole = async () => {
    if (!currentUser || !project) return

    try {
      // Check if user is project owner
      if (project.owner_id === currentUser.id) {
        setUserRole('owner')
        return
      }

      // Check if user is a collaborator and their role
      const supabase = createSupabaseClient()
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, secondary_roles')
        .eq('project_id', projectId)
        .eq('user_id', currentUser.id)
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

  const saveContent = async () => {
    if (!currentUser || !project) return

    // For editors, use approval workflow instead of direct save
    if (userRole === 'editor') {
      await submitForApproval()
      return
    }

    // For owners and other users with write permission, save directly
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const supabase = createSupabaseClient()

      // Try to update project_content table first
      const { data: existingContent } = await supabase
        .from('project_content')
        .select('id')
        .eq('project_id', projectId)
        .eq('asset_type', 'content')
        .single()

      if (existingContent) {
        // Update existing content
        const { error } = await supabase
          .from('project_content')
          .update({
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .eq('asset_type', 'content')

        if (error) throw error
      } else {
        // Create new content record
        const { error } = await supabase
          .from('project_content')
          .insert({
            project_id: projectId,
            filename: `${project.title}_content.txt`,
            content: content,
            asset_type: 'content'
          })

        if (error) throw error
      }

      // Also update projects.synopsis as fallback
      await supabase
        .from('projects')
        .update({
          synopsis: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      setSaveStatus('saved')
      setOriginalContent(content) // Update original content after successful save
      setTimeout(() => setSaveStatus(null), 2000)

    } catch (error) {
      console.error('Error saving content:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const submitForApproval = async () => {
    if (!currentUser || !project || userRole !== 'editor') return

    console.log('Submit for approval - Debug info:')
    console.log('Original content:', originalContent)
    console.log('Current content:', content)
    console.log('Are they equal?', originalContent.trim() === content.trim())

    // Check if content has changed
    if (originalContent.trim() === content.trim()) {
      addToast({
        type: 'warning',
        title: 'No Changes Detected',
        message: 'Please make some changes to the content before submitting for approval.'
      })
      return
    }

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/projects/${projectId}/editor-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: null, // This is general project content, not a specific chapter
          contentType: 'project_content',
          originalContent: originalContent,
          proposedContent: content,
          changeDescription: 'Project content update',
          editorNotes: null,
          contentTitle: 'Project Content'
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        setSaveStatus('saved')
        addToast({
          type: 'success',
          title: 'Changes Submitted',
          message: 'Your changes have been submitted for owner approval. You will be notified when they are reviewed.'
        })
      } else {
        setSaveStatus('error')
        console.error('API Error details:', data)
        addToast({
          type: 'error',
          title: 'Submission Failed',
          message: `Failed to submit changes for approval: ${data.error || 'Unknown error'}${data.details ? '\nDetails: ' + data.details : ''}`
        })
      }
    } catch (error) {
      console.error('Error submitting for approval:', error)
      setSaveStatus('error')
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: 'An error occurred while submitting changes for approval: ' + (error instanceof Error ? error.message : String(error))
      })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // Reload project data when returning from settings or other pages
  useEffect(() => {
    // Disabled auto-reload on focus since we have real-time updates
    // This was causing frequent reloads and poor user experience
    
    // If you need to manually reload, you can call loadProject() from a button
    return () => {
      // Cleanup if needed
    }
  }, [])

  const loadProject = async () => {
    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      setCurrentUser(user)
      console.log('Loading project:', projectId, 'for user:', user.id)

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      console.log('Project query result:', { projectData, projectError })

      if (projectError || !projectData) {
        console.log('Project not found or error:', projectError)
        setError('Project not found')
        setIsLoading(false)
        return
      }

      // If this is a novel and user is not the owner, check if they're a collaborator before redirecting
      if (projectData.format === 'novel' && projectData.owner_id !== user.id) {
        // Check if user is a collaborator
        try {
          const { data: collaboratorData } = await supabase
            .from('project_collaborators')
            .select('*')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          console.log('Novel collaborator check:', collaboratorData)

          // If not a collaborator, redirect to read view
          if (!collaboratorData) {
            router.push(`/novels/${projectId}/read`)
            return
          }
        } catch (error) {
          console.log('Collaboration check failed (table may not exist), allowing access:', error)
          // If collaboration check fails, allow access - the table might not exist yet
        }
      }

      // Check if user has access (owner or collaborator)
      if (projectData.owner_id !== user.id) {
        // Check if user is a collaborator
        try {
          const { data: collaboratorData, error: collaboratorError } = await supabase
            .from('project_collaborators')
            .select('*')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          console.log('Collaborator access check:', { collaboratorData, collaboratorError })

          if (!collaboratorData) {
            console.log('Access denied: not owner and not collaborator')
            setError('You do not have access to this project')
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.log('Collaboration access check failed (table may not exist), allowing owner access only:', error)
          // If collaboration check fails and user is not owner, deny access
          console.log('Access denied: not owner and collaboration table unavailable')
          setError('You do not have access to this project')
          setIsLoading(false)
          return
        }
      }

      setRealtimeProject(projectData)
      setLoglineValue(projectData.logline)

      // Load content from both sources with timestamps to get the most recent
      const [contentResult] = await Promise.all([
        supabase
          .from('project_content')
          .select('content, updated_at')
          .eq('project_id', projectId)
          .eq('asset_type', 'content')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
      ])

      const contentData = contentResult.data
      
      let selectedContent = ''
      let selectedSource = 'none'

      // Determine which content to use based on recency and availability
      const projectContentTime = contentData?.updated_at ? new Date(contentData.updated_at) : null
      const synopsisTime = projectData?.updated_at ? new Date(projectData.updated_at) : null

      console.log('Initial content comparison:')
      console.log('  project_content:', contentData?.content ? `${contentData.content.length} chars @ ${projectContentTime}` : 'none')
      console.log('  projects.synopsis:', projectData?.synopsis ? `${projectData.synopsis.length} chars @ ${synopsisTime}` : 'none')

      // Use the most recently updated content that actually exists
      if (projectData?.synopsis && synopsisTime && 
          (!contentData?.content || !projectContentTime || synopsisTime > projectContentTime)) {
        selectedContent = projectData.synopsis
        selectedSource = 'projects.synopsis (most recent)'
      } else if (contentData?.content) {
        selectedContent = contentData.content
        selectedSource = 'project_content'
      } else if (projectData?.synopsis) {
        selectedContent = projectData.synopsis
        selectedSource = 'projects.synopsis (fallback)'
      }

      setContent(selectedContent)
      console.log(`✅ Initial load from ${selectedSource}`)
      
      // Update sync status tracking for initial load
      const hasProjectContent = !!(contentData?.content)
      const hasProjectSynopsis = !!(projectData?.synopsis)
      const isContentSync = hasProjectContent && hasProjectSynopsis && contentData.content === projectData.synopsis
      
      let source: 'dual' | 'synopsis' | 'content' | 'none' = 'none'
      if (hasProjectContent && hasProjectSynopsis) {
        source = isContentSync ? 'dual' : (selectedSource.includes('synopsis') ? 'synopsis' : 'content')
      } else if (hasProjectSynopsis) {
        source = 'synopsis'
      } else if (hasProjectContent) {
        source = 'content'
      }
      
      setSyncStatus({
        hasProjectContent,
        hasProjectSynopsis,
        isSync: isContentSync,
        source,
        lastChecked: new Date()
      })

    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setIsLoading(false)
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

      setRealtimeProject({ ...project, logline: loglineValue.trim() })
      setEditingLogline(false)

    } catch (error) {
      console.error('Error saving logline:', error)
    }
  }

  const refreshContent = async () => {
    try {
      console.log('Refreshing content from database...')
      const supabase = createSupabaseClient()

      // Load content from both sources with timestamps
      const [contentResult, projectResult] = await Promise.all([
        supabase
          .from('project_content')
          .select('content, updated_at')
          .eq('project_id', projectId)
          .eq('asset_type', 'content')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('projects')
          .select('synopsis, updated_at')
          .eq('id', projectId)
          .single()
      ])

      const contentData = contentResult.data
      const projectData = projectResult.data
      
      let selectedContent = ''
      let selectedSource = 'none'

      // Determine which content to use based on recency and availability
      const projectContentTime = contentData?.updated_at ? new Date(contentData.updated_at) : null
      const synopsisTime = projectData?.updated_at ? new Date(projectData.updated_at) : null

      console.log('Content comparison:')
      console.log('  project_content:', contentData?.content ? `${contentData.content.length} chars @ ${projectContentTime}` : 'none')
      console.log('  projects.synopsis:', projectData?.synopsis ? `${projectData.synopsis.length} chars @ ${synopsisTime}` : 'none')

      // Use the most recently updated content that actually exists
      if (projectData?.synopsis && synopsisTime && 
          (!contentData?.content || !projectContentTime || synopsisTime > projectContentTime)) {
        selectedContent = projectData.synopsis
        selectedSource = 'projects.synopsis (most recent)'
      } else if (contentData?.content) {
        selectedContent = contentData.content
        selectedSource = 'project_content'
      } else if (projectData?.synopsis) {
        selectedContent = projectData.synopsis
        selectedSource = 'projects.synopsis (fallback)'
      }

      setContent(selectedContent)
      console.log(`✅ Loaded content from ${selectedSource}`)
      
      // Update sync status tracking
      const hasProjectContent = !!(contentData?.content)
      const hasProjectSynopsis = !!(projectData?.synopsis)
      const isContentSync = hasProjectContent && hasProjectSynopsis && contentData.content === projectData.synopsis
      
      let source: 'dual' | 'synopsis' | 'content' | 'none' = 'none'
      if (hasProjectContent && hasProjectSynopsis) {
        source = isContentSync ? 'dual' : (selectedSource.includes('synopsis') ? 'synopsis' : 'content')
      } else if (hasProjectSynopsis) {
        source = 'synopsis'
      } else if (hasProjectContent) {
        source = 'content'
      }
      
      setSyncStatus({
        hasProjectContent,
        hasProjectSynopsis,
        isSync: isContentSync,
        source,
        lastChecked: new Date()
      })
      
    } catch (error) {
      console.error('Error refreshing content:', error)
    }
  }

  const handleWriteTabClick = () => {
    // If switching from another tab to write tab, refresh content
    if (activeTab !== 'write') {
      refreshContent()
    }
    setActiveTab('write')
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

  if (!project || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Project not found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The project you're looking for doesn't exist or you don't have access to it."}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
              <p className="text-sm text-yellow-700">Project ID: {projectId}</p>
              <p className="text-sm text-yellow-700">Error: {error || 'No specific error'}</p>
              <p className="text-sm text-yellow-700">Check browser console for more details</p>
            </div>
          )}
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
              {/* Role Badge - Show user's role in this project */}
              {currentUser && (
                <RoleBadge 
                  projectId={projectId} 
                  userId={currentUser.id} 
                  showAllRoles 
                  className="mr-2"
                />
              )}

              {/* Save Status */}
              {saveStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">
                        {userRole === 'editor' ? 'Submitting for approval...' : 'Saving...'}
                      </span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">
                        {userRole === 'editor' ? 'Submitted for approval' : 'Saved'}
                      </span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-600">
                        {userRole === 'editor' ? 'Error submitting for approval' : 'Error saving'}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Changes indicator for editors */}
              {userRole === 'editor' && originalContent && content !== originalContent && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Unsaved changes</span>
                </div>
              )}

              {/* Save Button - Only for users with write permission */}
              <PermissionGate 
                projectId={projectId} 
                userId={currentUser?.id} 
                requiredPermission="write"
              >
                <button
                  onClick={saveContent}
                  disabled={isSaving}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                    userRole === 'editor'
                      ? 'text-purple-600 hover:text-purple-800 border-purple-300 hover:border-purple-400 bg-purple-50 hover:bg-purple-100'
                      : 'text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{userRole === 'editor' ? 'Submit for Approval' : 'Save'}</span>
                </button>
              </PermissionGate>

              {/* Share Button - Only for users with read permission */}
              <PermissionGate 
                projectId={projectId} 
                userId={currentUser?.id} 
                requiredPermission="read"
              >
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </PermissionGate>

              {/* Settings - Owner only */}
              <PermissionGate 
                projectId={projectId} 
                userId={currentUser?.id} 
                ownerOnly
              >
                <Link href={`/app/projects/${project.id}/settings`}>
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </Link>
              </PermissionGate>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-6">
              <button
                onClick={handleWriteTabClick}
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
              <button
                onClick={() => setActiveTab('approved-workflow')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'approved-workflow'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Approved Workflow
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {activeTab === 'write' && (
          <>
            {project?.format === 'novel' ? (
              <div className="w-full" style={{ height: 'calc(100vh - 200px)' }}>
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
              <div className="grid lg:grid-cols-5 gap-8 items-start">
                {/* Main Editor */}
                <div className="lg:col-span-3">
                  <PermissionGate 
                    projectId={projectId} 
                    userId={currentUser?.id} 
                    requiredPermission="write"
                    fallback={
                      <div className="bg-white rounded-xl border border-gray-200 min-h-[600px]">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Content (Read-Only)</h2>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Eye className="w-4 h-4" />
                              <span>Viewing only</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="w-full h-[500px] text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-4 overflow-auto">
                            {content || 'No content yet...'}
                          </div>
                        </div>
                      </div>
                    }
                    showFallback
                  >
                    <div className="bg-white rounded-xl border border-gray-200 min-h-[600px]">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-gray-800">Content</h2>
                          <div className="flex items-center space-x-4">
                            {hasRealtimeUpdate && (
                              <div className="flex items-center space-x-2 text-sm text-orange-600 animate-pulse">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span>Content updated by collaborator</span>
                                <button 
                                  onClick={clearRealtimeUpdate}
                                  className="text-orange-600 hover:text-orange-800 text-xs underline"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Edit3 className="w-4 h-4" />
                              <span>Edit mode</span>
                            </div>
                          </div>
                        </div>
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
                  </PermissionGate>
                </div>

            {/* Role-Specific Sidebar */}
            <div className="lg:col-span-2">
              <RoleSpecificSidebar
                projectId={projectId}
                userId={currentUser?.id}
                project={project}
                content={content}
                comments={comments}
                commentText={sidebarCommentText}
                onCommentTextChange={setSidebarCommentText}
                onSubmitComment={(text) => submitComment(text, true)}
                isSubmittingComment={isSubmittingComment}
              />
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Collaborators</h2>
                    <p className="text-gray-600">Manage who can contribute to your project</p>
                    {process.env.NODE_ENV === 'development' && collaborators.length > 0 && collaborators[0]?.id?.startsWith('mock-') && (
                      <div className="mt-3 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          🧪 <strong>Development Mode:</strong> Showing mock collaboration data because database is unavailable
                        </p>
                      </div>
                    )}
                  </div>
                  <ProjectCollaborationButton 
                    projectId={projectId}
                    projectTitle={project.title}
                    isOwner={true}
                    currentCollaborators={collaborators}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    onInvitationSent={refreshCollaborators}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {collaboratorsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading collaborators...</p>
                  </div>
                ) : collaboratorsError ? (
                  <div className="text-center py-16">
                    <div className="relative mx-auto mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Oops! Something went wrong</h3>
                    <p className="text-gray-600 mb-2">We couldn't load your collaborators right now.</p>
                    <p className="text-sm text-red-600 mb-6 font-mono bg-red-50 px-3 py-2 rounded-lg inline-block">{collaboratorsError}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Try Again
                      </button>
                      <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-orange-300 hover:text-orange-700 transition-colors">
                        Contact Support
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Don't worry - your collaborators are still there! This is just a temporary loading issue.
                    </p>
                  </div>
                ) : (collaborators.length === 0 && pendingInvitations.length === 0) ? (
                  /* Empty State */
                  <div className="text-center py-20">
                    {/* Animated Icon Container */}
                    <div className="relative mx-auto mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                        <Users className="w-12 h-12 text-orange-600" />
                      </div>
                      {/* Floating Elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center animate-bounce">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce delay-300">
                        <MessageSquare className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Ready to build your dream team? ✨
                    </h3>
                    <p className="text-lg text-gray-700 mb-3 max-w-lg mx-auto">
                      Great stories are born from collaboration! 
                    </p>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                      Invite talented writers, skilled editors, creative translators, and experienced producers to join your project. 
                      Share revenue, combine expertise, and create something amazing together.
                    </p>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Find Your Tribe</h4>
                        <p className="text-sm text-gray-600">Connect with writers, editors, and creators who share your vision</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Share Revenue</h4>
                        <p className="text-sm text-gray-600">Set up fair revenue sharing and build a sustainable creative partnership</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Grow Together</h4>
                        <p className="text-sm text-gray-600">Track contributions and watch your project flourish with diverse skills</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <ProjectCollaborationButton 
                        projectId={projectId}
                        projectTitle={project.title}
                        isOwner={true}
                        currentCollaborators={collaborators}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        onInvitationSent={refreshCollaborators}
                      />
                      <button className="px-6 py-3 border-2 border-orange-200 text-orange-700 font-medium rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Learn About Collaboration</span>
                      </button>
                    </div>

                    {/* Encouraging Note */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 max-w-md mx-auto">
                      <p className="text-sm text-orange-800">
                        💡 <strong>Pro tip:</strong> The best collaborations start with clear communication and shared goals. 
                        Take time to discuss roles and expectations with your team!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Collaborators List */
                  <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Collaborators</p>
                            <p className="text-2xl font-bold text-blue-900">{collaborators.length + pendingInvitations.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Active Members</p>
                            <p className="text-2xl font-bold text-green-900">
                              {collaborators.filter(c => c.status === 'active').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Revenue Share</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {collaborators.reduce((total, c) => total + (c.royalty_split || 0), 0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Invitations */}
                    {pendingInvitations.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-orange-500" />
                          <span>Pending Invitations ({pendingInvitations.length})</span>
                        </h3>
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                      {invitation.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Clock className="w-3 h-3 text-white" />
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-1">
                                    <h4 className="font-semibold text-gray-900">
                                      {invitation.profiles?.display_name || 'Unknown User'}
                                    </h4>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                      {invitation.role?.toUpperCase()}
                                    </span>
                                    {invitation.royalty_split && invitation.royalty_split > 0 && (
                                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                        {invitation.royalty_split}% revenue
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>Invited {new Date(invitation.created_at).toLocaleDateString()}</span>
                                    </span>
                                    <span className="flex items-center space-x-1 text-orange-600">
                                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                      <span>Pending Response</span>
                                    </span>
                                  </div>
                                  {invitation.message && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      "{invitation.message}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleSendMessage(
                                    invitation.invitee_id, 
                                    invitation.profiles?.display_name,
                                    invitation.profiles?.avatar_url,
                                    invitation.role
                                  )}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Send Message"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Cancel Invitation"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active Collaborators */}
                    {collaborators.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Team Members ({collaborators.length})</h3>
                        {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-xl p-6 border border-gray-200 hover:border-orange-200 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">
                                    {collaborator.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                                  collaborator.status === 'active' ? 'bg-green-500' : 
                                  collaborator.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}>
                                  {collaborator.status === 'active' && <Check className="w-3 h-3 text-white" />}
                                  {collaborator.status === 'inactive' && <Clock className="w-3 h-3 text-white" />}
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {collaborator.profiles?.display_name || 'Unknown User'}
                                  </h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    collaborator.role === 'coauthor' ? 'bg-blue-100 text-blue-700' :
                                    collaborator.role === 'editor' ? 'bg-orange-100 text-orange-700' :
                                    collaborator.role === 'translator' ? 'bg-purple-100 text-purple-700' :
                                    collaborator.role === 'producer' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {collaborator.role?.toUpperCase()}
                                  </span>
                                  {collaborator.royalty_split && collaborator.royalty_split > 0 && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                      {collaborator.royalty_split}% revenue
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Joined {new Date(collaborator.joined_at).toLocaleDateString()}</span>
                                  </span>
                                  <span className={`flex items-center space-x-1 ${
                                    collaborator.status === 'active' ? 'text-green-600' :
                                    collaborator.status === 'inactive' ? 'text-yellow-600' : 'text-gray-600'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                      collaborator.status === 'active' ? 'bg-green-500' :
                                      collaborator.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}></div>
                                    <span className="capitalize">{collaborator.status}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleSendMessage(
                                  collaborator.user_id, 
                                  collaborator.profiles?.display_name,
                                  collaborator.profiles?.avatar_url,
                                  collaborator.role
                                )}
                                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Send Message"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditCollaborator(collaborator)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Role & Permissions"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Manage collaboration permissions and revenue sharing for your team
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Comments */}
                <div className="mt-8">
                  <ProjectComments
                    projectId={projectId}
                    userId={currentUser?.id}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <ProjectHistory
            projectId={projectId}
            currentUserId={currentUser?.id}
            canRestore={project?.owner_id === currentUser?.id || false}
          />
        )}

        {activeTab === 'approved-workflow' && (
          <>
            {console.log('Rendering ApprovedWorkflow with userId:', currentUser?.id)}
            <ApprovedWorkflow
              projectId={projectId}
              userId={currentUser?.id}
              userRole={currentUserRole}
              permissions={currentUserPermissions}
              project={project}
              currentUser={currentUser}
            />
          </>
        )}
      </div>

      {/* Send Message Modal */}
      {showMessageModal && messageRecipient && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false)
            setMessageRecipient(null)
          }}
          recipient={messageRecipient}
        />
      )}

      {/* Edit Collaborator Modal */}
      {showEditModal && editingCollaborator && (
        <EditCollaboratorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingCollaborator(null)
          }}
          collaborator={editingCollaborator}
          onSave={(updates) => handleUpdateCollaborator(editingCollaborator.id, updates)}
          onRemove={() => handleRemoveCollaborator(editingCollaborator.id)}
          currentTotalSplit={collaborators.reduce((total, c) => total + (c.royalty_split || 0), 0)}
        />
      )}
    </div>
  )
}
