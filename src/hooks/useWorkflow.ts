import { useState, useCallback, useEffect } from 'react'
import { useRealTimeCollaboration } from './useCollaboration'

export interface WorkflowSubmission {
  id: string
  project_id: string
  submitter_id: string
  submission_type: 'edit' | 'comment' | 'suggestion' | 'translation' | 'review' | 'task'
  title: string
  description?: string
  content?: string
  original_content?: string
  status: 'pending_approval' | 'pending_request' | 'approved' | 'needs_changes' | 'rejected'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: 'content' | 'structure' | 'language' | 'quality' | 'production'
  target_role?: string
  tags?: string[]
  word_count?: number
  chapter_reference?: string
  review_notes?: string
  created_at: string
  updated_at?: string
  submitter?: {
    id: string
    display_name: string
    email: string
    avatar_url?: string
    role?: string
    roles?: string[]
  }
  approvals?: Array<{
    id: string
    status: string
    review_notes?: string
    created_at: string
    reviewer: {
      id: string
      display_name: string
      role?: string
    }
  }>
}

export interface WorkflowComment {
  id: string
  submission_id: string
  author_id: string
  content: string
  comment_type: 'comment' | 'review' | 'suggestion'
  parent_comment_id?: string
  created_at: string
  updated_at?: string
  author: {
    id: string
    display_name: string
    avatar_url?: string
  }
  replies?: WorkflowComment[]
}

export interface WorkflowAttachment {
  id: string
  submission_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  created_at: string
  uploader: {
    display_name: string
    avatar_url?: string
  }
}

export function useWorkflow(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<WorkflowSubmission[]>([])
  const { 
    subscribeToWorkflowSubmissions, 
    subscribeToWorkflowComments, 
    subscribeToWorkflowApprovals 
  } = useRealTimeCollaboration(projectId)

  // Real-time subscriptions
  useEffect(() => {
    const submissionChannel = subscribeToWorkflowSubmissions((submission) => {
      setSubmissions(prev => {
        const exists = prev.find(s => s.id === submission.id)
        if (exists) {
          return prev.map(s => s.id === submission.id ? submission : s)
        }
        return [...prev, submission]
      })
    })

    return () => {
      submissionChannel.unsubscribe()
    }
  }, [projectId, subscribeToWorkflowSubmissions])

  // Subscribe to workflow comments and approvals for real-time updates
  const subscribeToSubmissionUpdates = useCallback((submissionId: string, onUpdate: () => void) => {
    const commentChannel = subscribeToWorkflowComments((comment) => {
      if (comment.submission_id === submissionId) {
        onUpdate()
      }
    })

    const approvalChannel = subscribeToWorkflowApprovals((approval) => {
      if (approval.submission_id === submissionId) {
        onUpdate()
      }
    })

    return () => {
      commentChannel.unsubscribe()
      approvalChannel.unsubscribe()
    }
  }, [subscribeToWorkflowComments, subscribeToWorkflowApprovals])

  const fetchSubmissions = useCallback(async (filters?: {
    status?: string
    submitter_id?: string
    submission_type?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ project_id: projectId })
      if (filters?.status) params.append('status', filters.status)
      if (filters?.submitter_id) params.append('submitter_id', filters.submitter_id)
      if (filters?.submission_type) params.append('submission_type', filters.submission_type)
      
      const response = await fetch(`/api/workflows/submissions?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      
      const data = await response.json()
      return data.submissions as WorkflowSubmission[]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
      return []
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createSubmission = useCallback(async (submission: Omit<WorkflowSubmission, 'id' | 'created_at' | 'submitter_id' | 'project_id'>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/workflows/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submission,
          project_id: projectId
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create submission')
      }
      
      const data = await response.json()
      return data.submission as WorkflowSubmission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const processApproval = useCallback(async (submissionId: string, approval: {
    status: 'approved' | 'rejected' | 'needs_changes'
    review_notes?: string
    priority?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/workflows/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_id: submissionId,
          ...approval
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to process approval')
      }
      
      const data = await response.json()
      return data.approval
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchComments = useCallback(async (submissionId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/workflows/comments?submission_id=${submissionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      
      const data = await response.json()
      return data.comments as WorkflowComment[]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const addComment = useCallback(async (comment: {
    submission_id: string
    content: string
    comment_type?: string
    parent_comment_id?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/workflows/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comment),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add comment')
      }
      
      const data = await response.json()
      return data.comment as WorkflowComment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAttachments = useCallback(async (submissionId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/workflows/attachments?submission_id=${submissionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }
      
      const data = await response.json()
      return data.attachments as WorkflowAttachment[]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attachments')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadAttachment = useCallback(async (submissionId: string, file: File) => {
    try {
      setLoading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('submission_id', submissionId)
      
      const response = await fetch('/api/workflows/attachments', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload attachment')
      }
      
      const data = await response.json()
      return data.attachment as WorkflowAttachment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/workflows/stats?project_id=${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workflow statistics')
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
      return null
    } finally {
      setLoading(false)
    }
  }, [projectId])

  return {
    loading,
    error,
    submissions,
    fetchSubmissions,
    createSubmission,
    processApproval,
    fetchComments,
    addComment,
    fetchAttachments,
    uploadAttachment,
    fetchStats,
    subscribeToSubmissionUpdates
  }
}