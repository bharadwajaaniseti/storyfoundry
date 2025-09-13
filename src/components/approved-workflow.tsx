'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useToast } from '@/components/ui/toast'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Edit3,
  Eye,
  Globe,
  Target,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Settings,
  Download,
  Upload,
  Workflow,
  ArrowRight,
  Hash,
  Flag
} from 'lucide-react'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { useWorkflow } from '@/hooks/useWorkflow'
import { PermissionGate } from '@/components/permission-gate'
import { hasRole, getAllRoles, type CollaborationRole } from '@/lib/collaboration-utils'

interface ApprovedWorkflowProps {
  projectId: string
  userId?: string
  userRole?: string | null
  permissions?: any
  project?: any
  currentUser?: any
}

interface WorkflowItem {
  id: string
  type: 'edit' | 'comment' | 'suggestion' | 'translation' | 'review' | 'task'
  title: string
  author: {
    id: string
    name: string
    avatar?: string
    role: string
    roles?: string[]
  }
  status: 'pending_approval' | 'pending_request' | 'approved' | 'needs_changes' | 'rejected'
  created_at: string
  updated_at?: string
  description?: string
  content?: string
  originalContent?: string
  reviewNotes?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'content' | 'structure' | 'language' | 'quality' | 'production'
  targetRole?: CollaborationRole
  approver?: {
    id: string
    name: string
    role: string
  }
  tags?: string[]
  wordCount?: number
  chapterReference?: string
  // Editor-specific fields
  editorChangeId?: string
  contentType?: string
  editorNotes?: string
}

interface ApprovalAction {
  type: 'approve' | 'reject' | 'request_changes'
  notes?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export default function ApprovedWorkflow({ projectId, userId, userRole: passedUserRole, permissions: passedPermissions, project, currentUser }: ApprovedWorkflowProps) {
  console.log('=== ApprovedWorkflow Component Props ===', { 
    projectId, 
    userId, 
    passedUserRole, 
    currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
    project: project ? { id: project.id, title: project.title, owner_id: project.owner_id } : null
  })
  // Get hook result for role information
  const hookResult = useRoleBasedUI(projectId, userId)
  
  // Memoize role information to prevent unnecessary re-renders
  const roleInfo = useMemo(() => {
    const isOwnerByProject = project && currentUser && project.owner_id === currentUser.id
    
    let userRole: string | null = null
    let allUserRoles: string[] = []

    if (isOwnerByProject) {
      userRole = 'owner'
      allUserRoles = ['Owner']
    } else {
      // Use the hook result which properly handles role detection
      userRole = hookResult.userRole
      allUserRoles = hookResult.getAllRoleNames()
      
      // Fallback to passed props if hook doesn't have complete info
      if (!userRole && passedUserRole) {
        userRole = passedUserRole
        if (allUserRoles.length === 0 || (allUserRoles.length === 1 && allUserRoles[0] === 'Viewer')) {
          allUserRoles = [passedUserRole.charAt(0).toUpperCase() + passedUserRole.slice(1)]
        }
      }
    }

    return {
      isOwnerByProject,
      userRole,
      allUserRoles,
      allUserRolesString: allUserRoles.join(',') // Stable string for dependencies
    }
  }, [
    project?.owner_id, 
    currentUser?.id, 
    hookResult.userRole, 
    JSON.stringify(hookResult.getAllRoleNames()), // Stringify to make stable
    passedUserRole
  ])

  const { isOwnerByProject, userRole, allUserRoles } = roleInfo

  console.log('ApprovedWorkflow role resolution:', { 
    passedUserRole, 
    hookUserRole: hookResult.userRole, 
    isOwnerByProject,
    finalUserRole: userRole,
    allUserRoles,
    hookRoleNames: hookResult.getAllRoleNames(),
    projectOwnerId: project?.owner_id,
    currentUserId: currentUser?.id
  })

  const { 
    loading, 
    error,
    processApproval,
    fetchStats 
  } = useWorkflow(projectId)

  const { addToast } = useToast()
  
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([])
  const [allWorkflowData, setAllWorkflowData] = useState<WorkflowItem[]>([]) // Store all data
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetched, setLastFetched] = useState<number>(0)
  
  // Determine default tab based on user role
  const getDefaultTab = useCallback(() => {
    if (isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')) {
      return 'pending_approvals' // Owners see pending approvals by default
    } else {
      return 'my_submissions' // Others see their own submissions by default
    }
  }, [isOwnerByProject, allUserRoles])

  const [activeTab, setActiveTab] = useState<'pending_approvals' | 'all_requests' | 'my_submissions'>(() => getDefaultTab())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  console.log('ApprovedWorkflow debug:', { 
    allUserRoles,
    canApproveCheck: isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
  })

  // Fetch all workflow data once and cache it
  const fetchAllWorkflowData = useCallback(async () => {
    if (!projectId) return

    console.log('🌐 Fetching all workflow data...')
    setIsLoading(true)

    try {
      // Fetch from unified approvals endpoint only
      const response = await fetch(`/api/projects/${projectId}/approvals`)
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow data: ${response.status}`)
      }
      
      const data = await response.json()
      const items = data.items || []
      
      // Transform unified API data to match WorkflowItem interface
      const transformedItems: WorkflowItem[] = items.map((item: any) => ({
        id: item.type === 'editor_change' ? `editor-${item.id}` : item.id,
        type: item.type === 'editor_change' ? 'edit' as const : item.type,
        title: item.title,
        author: {
          id: item.author.id,
          name: item.author.name,
          avatar: item.author.avatar,
          role: item.author.role,
          roles: item.author.roles || [item.author.role]
        },
        status: item.type === 'editor_change' ? 
          (item.status === 'pending' ? 'pending_approval' :
           item.status === 'approved' ? 'approved' :
           item.status === 'rejected' ? 'rejected' :
           item.status === 'needs_revision' ? 'needs_changes' : 'pending_approval') :
          item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        description: item.description,
        content: item.content,
        originalContent: item.original_content,
        reviewNotes: item.editor_notes,
        priority: item.priority || 'medium',
        category: item.content_type || item.submission_type || 'content',
        targetRole: 'owner' as CollaborationRole,
        tags: item.tags || (item.type === 'editor_change' ? ['editor-approval'] : []),
        wordCount: item.content_metadata?.proposed_word_count,
        chapterReference: item.chapter?.title || item.title,
        editorChangeId: item.type === 'editor_change' ? item.id : undefined,
        contentType: item.content_type,
        editorNotes: item.editor_notes,
        approval_deadline: item.approval_deadline,
        chapter_id: item.chapter_id
      }))

      console.log('📋 Fetched', transformedItems.length, 'total workflow items')
      setAllWorkflowData(transformedItems)
      setLastFetched(Date.now())
      
    } catch (error) {
      console.error('Error fetching workflow data:', error)
      setAllWorkflowData([])
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Filter data based on current tab without re-fetching
  const filterDataForCurrentTab = useCallback(() => {
    console.log('🔄 Filtering data for tab:', activeTab)
    
    let filteredItems = allWorkflowData

    switch (activeTab) {
      case 'pending_approvals':
        filteredItems = allWorkflowData.filter(item => item.status === 'pending_approval')
        break
      case 'my_submissions':
        filteredItems = allWorkflowData.filter(item => item.author.id === userId)
        break
      case 'all_requests':
        // Show everything
        filteredItems = allWorkflowData
        break
    }

    console.log('📋 Filtered to', filteredItems.length, 'items for', activeTab)
    setWorkflowItems(filteredItems)
  }, [activeTab, allWorkflowData, userId])

  // Fetch all data once when component mounts or key dependencies change
  useEffect(() => {
    if (projectId && userRole) {
      const age = Date.now() - lastFetched
      // Only fetch if we don't have data or it's older than 5 minutes
      if (allWorkflowData.length === 0 || age > 300000) {
        fetchAllWorkflowData()
      }
    }
  }, [projectId, userRole, fetchAllWorkflowData, allWorkflowData.length, lastFetched])

  // Filter data whenever tab changes or data updates
  useEffect(() => {
    if (allWorkflowData.length > 0) {
      filterDataForCurrentTab()
    }
  }, [filterDataForCurrentTab])

  // Simplified fetch function that uses cached data from fetchAllWorkflowData
  const fetchWorkflowData = useCallback(async (forceRefresh = false) => {
    if (!projectId) return

    console.log('🔄 fetchWorkflowData called:', { activeTab, forceRefresh })

    // If we need fresh data or don't have any cached data, fetch everything first
    if (forceRefresh || allWorkflowData.length === 0) {
      await fetchAllWorkflowData()
      return
    }

    // Otherwise, just filter the existing cached data
    filterDataForCurrentTab()
  }, [projectId, activeTab, allWorkflowData.length, fetchAllWorkflowData, filterDataForCurrentTab])

  // Load workflow data from API
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { projectId, activeTab, userId, userRole, allUserRoles })
    fetchWorkflowData()
  }, [fetchWorkflowData]) // Simplified dependencies

  // Optimized tab switching handler - no more API calls, just filtering!
  const handleTabChange = useCallback((newTab: 'pending_approvals' | 'all_requests' | 'my_submissions') => {
    console.log('🔄 Tab switch:', activeTab, '->', newTab)
    setActiveTab(newTab)
    // The useEffect for filterDataForCurrentTab will handle the filtering automatically
  }, [activeTab])

  const handleApprovalAction = async (itemId: string, action: ApprovalAction) => {
    try {
      // Check if this is an editor change (ID starts with "editor-")
      const isEditorChange = itemId.startsWith('editor-')
      
      if (isEditorChange) {
        // Handle editor approval using the editor approval API
        const editorChangeId = workflowItems.find(item => item.id === itemId)?.editorChangeId
        if (!editorChangeId) {
          throw new Error('Editor change ID not found')
        }

        const requestPayload = {
          pendingChangeId: editorChangeId,
          decision: action.type === 'approve' ? 'approve' : 
                   action.type === 'reject' ? 'reject' : 'request_revision',
          feedbackNotes: action.notes,
          suggestedChanges: action.type === 'request_changes' ? action.notes : null
        }

        console.log('Sending approval request:', {
          url: `/api/projects/${projectId}/approvals`,
          method: 'POST',
          payload: requestPayload,
          fullUrl: window.location.origin + `/api/projects/${projectId}/approvals`
        })

        const response = await fetch(`/api/projects/${projectId}/approvals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          })
          throw new Error(`Failed to process editor approval: ${response.status} ${response.statusText} - ${errorData}`)
        }

        const result = await response.json()
        console.log('✅ Approval succeeded:', result)
        
        // Clear all cached data and refresh from API
        console.log('🔄 Clearing cache and refreshing data...')
        setAllWorkflowData([])
        setWorkflowItems([])
        
        // Trigger a fresh data fetch for all tabs
        await fetchAllWorkflowData()
        console.log('✅ Data refreshed successfully')
        
        // Show success notification
        addToast({
          type: 'success',
          title: `Changes ${action.type.charAt(0).toUpperCase() + action.type.slice(1)}d`,
          message: result.message || `Editor changes ${action.type}d successfully!`
        })
      } else {
        // Handle regular workflow approval using the hook
        const approval = await processApproval(itemId, {
          status: action.type === 'approve' ? 'approved' : 
                 action.type === 'reject' ? 'rejected' : 'needs_changes',
          review_notes: action.notes,
          priority: action.priority
        })
        
        // Update the local state with the API response
        setWorkflowItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              status: approval.status,
              reviewNotes: approval.review_notes,
              updated_at: approval.created_at,
              approver: approval.reviewer ? {
                id: approval.reviewer.id,
                name: approval.reviewer.display_name,
                role: approval.reviewer.role || 'Reviewer'
              } : undefined
            }
          }
          return item
        }))
        
        // Show success notification
        addToast({
          type: 'success',
          title: `Item ${action.type.charAt(0).toUpperCase() + action.type.slice(1)}d`,
          message: `Item ${action.type}d successfully!`
        })
      }
    } catch (error) {
      console.error('❌ Failed to process approval:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: 'Failed to process approval: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedItems.size === 0) return
    
    try {
      // Process bulk approval/rejection
      for (const itemId of selectedItems) {
        await handleApprovalAction(itemId, { type: action })
      }
      setSelectedItems(new Set())
      addToast({
        type: 'success',
        title: 'Bulk Action Complete',
        message: `${selectedItems.size} items ${action}d successfully!`
      })
    } catch (error) {
      console.error('Bulk action failed:', error)
      addToast({
        type: 'error',
        title: 'Bulk Action Failed',
        message: 'The bulk action could not be completed. Please try again.'
      })
    }
  }

  const getStatusCounts = () => {
    return {
      pending_approvals: allWorkflowData.filter(item => item.status === 'pending_approval').length,
      pending_requests: allWorkflowData.filter(item => item.status === 'pending_request').length,
      approved: allWorkflowData.filter(item => item.status === 'approved').length,
      needs_changes: allWorkflowData.filter(item => item.status === 'needs_changes' || item.status === 'rejected').length
    }
  }

  const counts = getStatusCounts()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'pending_request':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'needs_changes':
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pending_request':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'needs_changes':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="w-4 h-4 text-red-500" />
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return <Edit3 className="w-4 h-4" />
      case 'structure':
        return <Target className="w-4 h-4" />
      case 'language':
        return <Globe className="w-4 h-4" />
      case 'quality':
        return <Star className="w-4 h-4" />
      case 'production':
        return <Settings className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'coauthor': 'bg-blue-100 text-blue-800',
      'editor': 'bg-green-100 text-green-800',
      'reviewer': 'bg-purple-100 text-purple-800',
      'translator': 'bg-pink-100 text-pink-800',
      'producer': 'bg-orange-100 text-orange-800',
      'owner': 'bg-yellow-100 text-yellow-800'
    }
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const canApprove = (item: WorkflowItem) => {
    // Only project owners can approve editor submissions to maintain approval workflow integrity
    if (isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')) return true
    
    // For editor changes (type 'edit'), only owners can approve - editors cannot approve their own work
    if (item.type === 'edit') {
      return false // Editors cannot approve their own edits
    }
    
    // Role-specific approval permissions for other types of submissions
    switch (item.type) {
      case 'suggestion':
        return allUserRoles.includes('coauthor') // Only coauthors can approve suggestions
      case 'translation':
        return allUserRoles.includes('reviewer') // Only reviewers can approve translations
      case 'review':
        return allUserRoles.includes('coauthor') || allUserRoles.includes('producer')
      case 'task':
        return allUserRoles.includes('producer') || allUserRoles.includes('coauthor')
      default:
        return false
    }
  }

  // Determine which tabs should be visible for the current user
  const getVisibleTabs = () => {
    const isOwner = isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
    const hasApprovalPermissions = isOwner || allUserRoles.some(role => 
      ['coauthor', 'editor', 'reviewer', 'producer'].includes(role.toLowerCase())
    )

    return {
      showPendingApprovals: hasApprovalPermissions,
      showAllRequests: isOwner || allUserRoles.length > 0, // Anyone with a role can see all requests
      showMySubmissions: userId ? true : false // Anyone can see their own submissions if they have a userId
    }
  }

  const visibleTabs = getVisibleTabs()

  const filteredItems = workflowItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesRole = filterRole === 'all' || item.author.role.toLowerCase() === filterRole.toLowerCase()
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    
    const matchesTab = activeTab === 'pending_approvals' 
      ? item.status === 'pending_approval'
      : activeTab === 'my_submissions'
      ? item.author.id === userId
      : true
    
    return matchesSearch && matchesStatus && matchesRole && matchesCategory && matchesTab
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading workflow data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Workflow className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Collaboration Review</h2>
                <p className="text-sm text-gray-600">Review and approve collaborator contributions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Role indicator */}
              <div className="text-sm text-gray-600">
                Your roles: {allUserRoles.length > 0 ? allUserRoles.map(role => (
                  <span key={role} className={`inline-block px-2 py-1 rounded-full text-xs mr-1 ${getRoleColor(role)}`}>
                    {role}
                  </span>
                )) : (
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    Viewer
                  </span>
                )}
              </div>
              
              {/* Role-specific status indicator */}
              {(() => {
                const isOwner = isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
                const isEditor = allUserRoles.includes('editor')
                const hasApprovalRights = isOwner || allUserRoles.some(role => 
                  ['coauthor', 'reviewer', 'producer'].includes(role.toLowerCase())
                )
                
                if (isOwner) {
                  return (
                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      ✓ Can approve all submissions
                    </div>
                  )
                } else if (hasApprovalRights) {
                  return (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      ✓ Can review specific submissions
                    </div>
                  )
                } else if (isEditor) {
                  return (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ✓ Can submit content for approval
                    </div>
                  )
                } else {
                  return (
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      View-only access
                    </div>
                  )
                }
              })()}
              
              <PermissionGate projectId={projectId} userId={userId} requiredPermission="write">
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Configure Workflow
                </button>
              </PermissionGate>
            </div>
          </div>
          
          {/* Alert for pending approvals */}
          {counts.pending_approvals > 0 && (
            <div className="mt-3 flex items-center justify-between bg-orange-100 border border-orange-200 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {counts.pending_approvals} item{counts.pending_approvals > 1 ? 's' : ''} awaiting your approval
                </span>
              </div>
              {selectedItems.size > 0 && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleBulkAction('approve')}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                    Approve Selected ({selectedItems.size})
                  </button>
                  <button 
                    onClick={() => handleBulkAction('reject')}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3 inline mr-1" />
                    Reject Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-900">{counts.pending_approvals}</p>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Pending Requests</p>
                  <p className="text-2xl font-bold text-blue-900">{counts.pending_requests}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{counts.approved}</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Needs Changes</p>
                  <p className="text-2xl font-bold text-red-900">{counts.needs_changes}</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {visibleTabs.showPendingApprovals && (
              <button
                onClick={() => handleTabChange('pending_approvals')}
                className={`py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'pending_approvals'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Approvals</span>
                  {counts.pending_approvals > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                      {counts.pending_approvals}
                    </span>
                  )}
                </div>
              </button>
            )}
            {visibleTabs.showAllRequests && (
              <button
                onClick={() => handleTabChange('all_requests')}
                className={`py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'all_requests'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>All Requests</span>
                </div>
              </button>
            )}
            {visibleTabs.showMySubmissions && (
              <button
                onClick={() => setActiveTab('my_submissions')}
                className={`py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'my_submissions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>My Submissions</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {workflowItems.filter(item => item.author.id === userId).length}
                  </span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="pending_request">Pending Request</option>
                  <option value="approved">Approved</option>
                  <option value="needs_changes">Needs Changes</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Roles</option>
                <option value="coauthor">Coauthor</option>
                <option value="editor">Editor</option>
                <option value="reviewer">Reviewer</option>
                <option value="translator">Translator</option>
                <option value="producer">Producer</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Categories</option>
                <option value="content">Content</option>
                <option value="structure">Structure</option>
                <option value="language">Language</option>
                <option value="quality">Quality</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {(() => {
                  const isOwner = isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
                  
                  if (activeTab === 'pending_approvals') {
                    return isOwner ? 'No Pending Approvals' : 'No Items Awaiting Your Review'
                  } else if (activeTab === 'my_submissions') {
                    return 'No Submissions Found'
                  } else {
                    return 'No Workflow Items Found'
                  }
                })()}
              </h3>
              <p className="text-gray-600">
                {(() => {
                  const isOwner = isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
                  
                  if (activeTab === 'pending_approvals') {
                    return isOwner 
                      ? 'All submitted contributions have been reviewed'
                      : 'No contributions are currently awaiting your review. Check back later or visit the "My Submissions" tab to track your own contributions.'
                  } else if (activeTab === 'my_submissions') {
                    return 'You haven\'t submitted any contributions yet. Once you submit content for review, it will appear here.'
                  } else {
                    return 'No workflow items match your current filters'
                  }
                })()}
              </p>
              
              {/* Role-specific helpful information */}
              {(() => {
                const isOwner = isOwnerByProject || allUserRoles.includes('owner') || allUserRoles.includes('Owner')
                const isEditor = allUserRoles.includes('editor')
                
                if (activeTab === 'pending_approvals' && !isOwner && allUserRoles.length > 0) {
                  return (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Your Review Permissions</h4>
                      <p className="text-sm text-blue-600">
                        As a <strong>{allUserRoles.join(', ')}</strong>, you can review specific types of contributions. 
                        When items need your approval, they'll appear here.
                      </p>
                    </div>
                  )
                } else if (activeTab === 'my_submissions' && isEditor) {
                  return (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Editor Submission Info</h4>
                      <p className="text-sm text-green-600">
                        As an Editor, your content changes are automatically submitted for owner approval. 
                        You'll see the status of your submissions here.
                      </p>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg hover:border-orange-200 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Selection checkbox for approval actions */}
                        {canApprove(item) && item.status === 'pending_approval' && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedItems)
                              if (e.target.checked) {
                                newSelected.add(item.id)
                              } else {
                                newSelected.delete(item.id)
                              }
                              setSelectedItems(newSelected)
                            }}
                            className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(item.author.role)}`}>
                              {item.author.role}
                            </span>
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(item.category)}
                              <span className="text-xs text-gray-500">{item.category}</span>
                            </div>
                            {getPriorityIcon(item.priority)}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{item.author.name}</span>
                              {item.author.roles && item.author.roles.length > 1 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                  +{item.author.roles.length - 1} role{item.author.roles.length > 2 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            {item.wordCount && (
                              <div className="flex items-center space-x-1">
                                <Hash className="w-4 h-4" />
                                <span>{item.wordCount.toLocaleString()} words</span>
                              </div>
                            )}
                            {item.chapterReference && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                {item.chapterReference}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                          )}

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.map(tag => (
                                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Expandable content preview */}
                          {item.content && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Content Preview</span>
                                <button
                                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                  className="text-xs text-orange-600 hover:text-orange-800"
                                >
                                  {expandedItem === item.id ? 'Collapse' : 'Expand'}
                                </button>
                              </div>
                              <p className={`text-sm text-gray-700 ${expandedItem === item.id ? '' : 'line-clamp-2'}`}>
                                "{item.content}"
                              </p>
                              {item.originalContent && expandedItem === item.id && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-xs font-medium text-gray-700 block mb-1">Original Content</span>
                                  <p className="text-sm text-gray-600 italic">"{item.originalContent}"</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Review notes for rejected/needs changes items */}
                          {item.reviewNotes && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                              <span className="text-xs font-medium text-red-700 block mb-1">Review Notes</span>
                              <p className="text-sm text-red-700">{item.reviewNotes}</p>
                            </div>
                          )}

                          {/* Approval info for approved items */}
                          {item.approver && item.status === 'approved' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center space-x-2 text-sm text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span>Approved by {item.approver.name} on {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Unknown date'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(item.status)}
                        
                        {/* Action buttons based on status and user permissions */}
                        {item.status === 'pending_approval' && canApprove(item) && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApprovalAction(item.id, { type: 'approve' })}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => {
                                const notes = prompt('Enter review notes (optional):')
                                handleApprovalAction(item.id, { 
                                  type: 'request_changes', 
                                  notes: notes || undefined 
                                })
                              }}
                              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                              Changes
                            </button>
                            <button 
                              onClick={() => {
                                const notes = prompt('Enter rejection reason (optional):')
                                handleApprovalAction(item.id, { 
                                  type: 'reject', 
                                  notes: notes || undefined 
                                })
                              }}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* View/Download actions */}
                        <div className="flex space-x-1">
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Send Message">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {(item.type === 'translation' || item.type === 'edit') && (
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}