'use client'

import React, { useState, useEffect } from 'react'
import { 
  Save, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Edit3,
  Send,
  Eye,
  MessageSquare,
  Bell
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PendingChange {
  id: string
  content_type: string
  content_title?: string
  change_description?: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  created_at: string
  decisions?: Array<{
    decision: string
    feedback_notes?: string
    suggested_changes?: string
    created_at: string
  }>
}

interface EditorWorkflowManagerProps {
  projectId: string
  chapterId?: string
  contentType: 'chapter' | 'project_content' | 'outline'
  originalContent: string
  currentContent: string
  contentTitle?: string
  isEditor: boolean
  onSaveComplete?: (success: boolean, message: string) => void
}

export default function EditorWorkflowManager({
  projectId,
  chapterId,
  contentType,
  originalContent,
  currentContent,
  contentTitle,
  isEditor,
  onSaveComplete
}: EditorWorkflowManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'pending' | null>(null)
  const [changeDescription, setChangeDescription] = useState('')
  const [editorNotes, setEditorNotes] = useState('')
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  useEffect(() => {
    if (isEditor) {
      loadPendingChanges()
    }
  }, [projectId, isEditor])

  const loadPendingChanges = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/editor-changes`)
      const data = await response.json()

      if (data.success) {
        setPendingChanges(data.pendingChanges || [])
      }
    } catch (error) {
      console.error('Error loading pending changes:', error)
    }
  }

  const hasContentChanged = () => {
    return originalContent.trim() !== currentContent.trim()
  }

  const submitForApproval = async () => {
    if (!hasContentChanged()) {
      alert('No changes detected to submit for approval')
      return
    }

    try {
      setIsSubmitting(true)
      setSaveStatus('saving')

      const response = await fetch(`/api/projects/${projectId}/editor-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapterId || null,
          contentType,
          originalContent,
          proposedContent: currentContent,
          changeDescription: changeDescription.trim() || null,
          editorNotes: editorNotes.trim() || null,
          contentTitle: contentTitle || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveStatus('pending')
        setChangeDescription('')
        setEditorNotes('')
        setShowSubmissionForm(false)
        
        // Refresh pending changes
        await loadPendingChanges()
        
        onSaveComplete?.(true, 'Changes submitted for owner approval')
      } else {
        setSaveStatus('error')
        onSaveComplete?.(false, data.error || 'Failed to submit changes')
      }
    } catch (error) {
      setSaveStatus('error')
      onSaveComplete?.(false, 'An error occurred while submitting changes')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'needs_revision': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'needs_revision': return <Edit3 className="w-3 h-3" />
      case 'approved': return <CheckCircle className="w-3 h-3" />
      case 'rejected': return <XCircle className="w-3 h-3" />
      default: return <AlertCircle className="w-3 h-3" />
    }
  }

  if (!isEditor) {
    return null
  }

  const hasActivePendingChanges = pendingChanges.some(change => 
    change.status === 'pending' || change.status === 'needs_revision'
  )

  return (
    <div className="space-y-4">
      {/* Save Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {saveStatus && (
            <div className="flex items-center space-x-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-orange-600">Submitting for approval...</span>
                </>
              )}
              {saveStatus === 'pending' && (
                <>
                  <Clock className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-600">Awaiting owner approval</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Changes approved and saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Error submitting changes</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {pendingChanges.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              <Bell className="w-3 h-3 mr-1" />
              {pendingChanges.length} Pending
            </Badge>
          )}
          
          {hasContentChanged() && (
            <Button
              onClick={() => setShowSubmissionForm(true)}
              disabled={isSubmitting || hasActivePendingChanges}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-800">Submit Changes for Approval</CardTitle>
            <p className="text-sm text-purple-600">
              Describe your changes to help the project owner review them
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-purple-700 block mb-1">
                Change Description
              </label>
              <Textarea
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="Briefly describe what you changed and why..."
                className="min-h-[80px]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-purple-700 block mb-1">
                Notes for Owner (Optional)
              </label>
              <Textarea
                value={editorNotes}
                onChange={(e) => setEditorNotes(e.target.value)}
                placeholder="Any additional notes or context for the owner..."
                className="min-h-[60px]"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                onClick={submitForApproval}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
              <Button
                onClick={() => setShowSubmissionForm(false)}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Changes List */}
      {pendingChanges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Your Pending Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium text-gray-800">
                        {change.content_title || change.content_type}
                      </span>
                      <Badge className={getStatusColor(change.status)}>
                        {getStatusIcon(change.status)}
                        <span className="ml-1 capitalize">{change.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    {change.change_description && (
                      <p className="text-sm text-gray-600">{change.change_description}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Submitted {new Date(change.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {change.decisions && change.decisions.length > 0 && (
                    <div className="ml-4">
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View Feedback
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning about pending changes */}
      {hasActivePendingChanges && hasContentChanged() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
            <div className="text-sm text-yellow-800">
              You have pending changes awaiting approval. Please wait for them to be reviewed before submitting new changes.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}