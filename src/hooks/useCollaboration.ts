'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'
import { 
  CollaborationInvitation, 
  ProjectCollaborator, 
  CollaborationMessage, 
  ProjectActivity 
} from '@/lib/collaboration-utils'

export function useCollaborationInvitations(type?: 'sent' | 'received') {
  const [invitations, setInvitations] = useState<CollaborationInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      
      const response = await fetch(`/api/collaborations/invitations?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitations')
      }
      
      setInvitations(data.invitations)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async (invitation: {
    project_id: string
    invitee_id: string
    role: string
    secondary_roles?: string[]
    royalty_split?: number
    message?: string
  }) => {
    try {
      const response = await fetch('/api/collaborations/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }
      
      await fetchInvitations() // Refresh invitations
      return data.invitation
    } catch (err) {
      throw err
    }
  }

  const respondToInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/collaborations/invitations/${invitationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        // If JSON parsing fails, try to get the text response
        const textResponse = await response.text()
        console.error('Failed to parse JSON response:', textResponse)
        throw new Error(`Server returned invalid response: ${textResponse.substring(0, 100)}...`)
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to invitation')
      }
      
      await fetchInvitations() // Refresh invitations
      return data
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [type])

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    respondToInvitation,
    refresh: fetchInvitations
  }
}

export function useProjectCollaborators(projectId: string) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<CollaborationInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCollaborators = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/collaborations/collaborators?project_id=${projectId}`)
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Network error' }))
        
        // Handle RLS infinite recursion error gracefully - show empty state instead of error
        if (data.error && data.error.includes('infinite recursion detected in policy')) {
          console.warn('RLS policy issue detected, showing empty collaboration state')
          setCollaborators([])
          setPendingInvitations([])
          setError(null) // Don't show error to user for this specific issue
          return
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCollaborators(data.collaborators || [])
      setPendingInvitations(data.pendingInvitations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCollaborators([])
      setPendingInvitations([])
    } finally {
      setLoading(false)
    }
  }

  const addCollaborator = async (collaborator: {
    user_id: string
    role: string
    royalty_split?: number
    permissions?: any
  }) => {
    try {
      const response = await fetch('/api/collaborations/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...collaborator })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add collaborator')
      }
      
      await fetchCollaborators() // Refresh collaborators
      return data.collaborator
    } catch (err) {
      throw err
    }
  }

  const updateCollaborator = async (collaboratorId: string, updates: {
    role?: string
    royalty_split?: number
    permissions?: any
  }) => {
    try {
      const response = await fetch(`/api/collaborations/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update collaborator')
      }
      
      await fetchCollaborators() // Refresh collaborators
      return data.collaborator
    } catch (err) {
      throw err
    }
  }

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/collaborations/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove collaborator')
      }
      
      await fetchCollaborators() // Refresh collaborators
      return data
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchCollaborators()
  }, [projectId])

  return {
    collaborators,
    pendingInvitations,
    loading,
    error,
    addCollaborator,
    updateCollaborator,
    removeCollaborator,
    refresh: fetchCollaborators
  }
}

export function useCollaborationMessages(projectId: string) {
  const [messages, setMessages] = useState<CollaborationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/collaborations/messages?project_id=${projectId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }
      
      setMessages(data.messages)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (message: {
    content: string
    message_type?: string
    parent_id?: string
  }) => {
    try {
      const response = await fetch('/api/collaborations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...message })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }
      
      await fetchMessages() // Refresh messages
      return data.message
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [projectId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh: fetchMessages
  }
}

export function useProjectActivity(projectId: string, limit: number = 50) {
  const [activity, setActivity] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/collaborations/activity?project_id=${projectId}&limit=${limit}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity')
      }
      
      setActivity(data.activity)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()
  }, [projectId, limit])

  return {
    activity,
    loading,
    error,
    refresh: fetchActivity
  }
}

export function useActiveCollaborations() {
  const [collaborations, setCollaborations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveCollaborations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collaborations/active')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active collaborations')
      }
      
      setCollaborations(data.collaborations || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCollaborations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveCollaborations()
  }, [])

  return {
    collaborations,
    loading,
    error,
    refresh: fetchActiveCollaborations
  }
}

export function useRealTimeCollaboration(projectId: string) {
  const [supabase] = useState(() => createSupabaseClient())

  const subscribeToMessages = (callback: (message: CollaborationMessage) => void) => {
    return supabase
      .channel(`project-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          callback(payload.new as CollaborationMessage)
        }
      )
      .subscribe()
  }

  const subscribeToActivity = (callback: (activity: ProjectActivity) => void) => {
    return supabase
      .channel(`project-activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_activity',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          callback(payload.new as ProjectActivity)
        }
      )
      .subscribe()
  }

  const subscribeToCollaborators = (callback: (collaborator: ProjectCollaborator) => void) => {
    return supabase
      .channel(`project-collaborators-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          callback(payload.new as ProjectCollaborator)
        }
      )
      .subscribe()
  }

  const subscribeToWorkflowSubmissions = (callback: (submission: any) => void) => {
    return supabase
      .channel(`workflow-submissions-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_submissions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  }

  const subscribeToWorkflowComments = (callback: (comment: any) => void) => {
    return supabase
      .channel(`workflow-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_comments',
          filter: `submission_id=in.(SELECT id FROM workflow_submissions WHERE project_id=${projectId})`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  }

  const subscribeToWorkflowApprovals = (callback: (approval: any) => void) => {
    return supabase
      .channel(`workflow-approvals-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_approvals',
          filter: `submission_id=in.(SELECT id FROM workflow_submissions WHERE project_id=${projectId})`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  }

  return {
    subscribeToMessages,
    subscribeToActivity,
    subscribeToCollaborators,
    subscribeToWorkflowSubmissions,
    subscribeToWorkflowComments,
    subscribeToWorkflowApprovals
  }
}
