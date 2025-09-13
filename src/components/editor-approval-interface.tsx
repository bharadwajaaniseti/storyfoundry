'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  User, 
  FileText, 
  Check, 
  X, 
  MessageSquare, 
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit3,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  Diff
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PendingChange {
  id: string
  project_id: string
  editor_id: string
  chapter_id?: string
  content_type: 'chapter' | 'project_content' | 'outline'
  original_content: string
  proposed_content: string
  change_description?: string
  editor_notes?: string
  content_title?: string
  content_metadata: {
    original_word_count: number
    proposed_word_count: number
    submitted_at: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  created_at: string
  updated_at: string
  editor: {
    name: string
    email: string
    avatar_url?: string
  }
  project: {
    title: string
  }
  chapter?: {
    title: string
    chapter_number: number
  }
}

interface EditorApprovalInterfaceProps {
  projectId: string
  onApprovalProcessed?: () => void
}

export default function EditorApprovalInterface({ projectId, onApprovalProcessed }: EditorApprovalInterfaceProps) {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [suggestedChanges, setSuggestedChanges] = useState('')
  const [showDiff, setShowDiff] = useState<string | null>(null)

  useEffect(() => {
    loadPendingChanges()
  }, [projectId])

  const loadPendingChanges = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/approvals`)
      const data = await response.json()

      if (data.success) {
        setPendingChanges(data.pendingChanges || [])
      } else {
        console.error('Failed to load pending changes:', data.error)
      }
    } catch (error) {
      console.error('Error loading pending changes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processApproval = async (changeId: string, decision: 'approve' | 'reject' | 'request_revision') => {
    try {
      setProcessingId(changeId)
      
      const response = await fetch(`/api/projects/${projectId}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pendingChangeId: changeId,
          decision,
          feedbackNotes: feedbackNotes.trim() || null,
          suggestedChanges: suggestedChanges.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the pending changes
        await loadPendingChanges()
        
        // Clear form
        setSelectedChange(null)
        setFeedbackNotes('')
        setSuggestedChanges('')
        
        // Notify parent component
        onApprovalProcessed?.()
      } else {
        console.error('Failed to process approval:', data.error)
        alert('Failed to process approval: ' + data.error)
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      alert('An error occurred while processing the approval')
    } finally {
      setProcessingId(null)
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

  const calculateWordCountChange = (change: PendingChange) => {
    const original = change.content_metadata.original_word_count || 0
    const proposed = change.content_metadata.proposed_word_count || 0
    const diff = proposed - original
    return {
      original,
      proposed,
      diff,
      percentage: original > 0 ? ((diff / original) * 100).toFixed(1) : '0'
    }
  }

  const renderContentPreview = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const renderDiffView = (change: PendingChange) => {
    // Simple diff visualization - in a real app you might use a proper diff library
    const original = change.original_content
    const proposed = change.proposed_content
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <XCircle className="w-4 h-4 mr-1 text-red-500" />
              Original Content
            </h4>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">{original}</pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
              Proposed Content
            </h4>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">{proposed}</pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    )
  }

  if (pendingChanges.length === 0) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Pending Approvals</h3>
        <p className="text-gray-600">All editor changes have been reviewed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editor Changes Awaiting Approval</h2>
          <p className="text-gray-600">{pendingChanges.length} changes need your review</p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          {pendingChanges.length} Pending
        </Badge>
      </div>

      <div className="space-y-4">
        {pendingChanges.map((change) => {
          const wordStats = calculateWordCountChange(change)
          const isSelected = selectedChange?.id === change.id
          const isExpanded = showDiff === change.id

          return (
            <Card key={change.id} className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-purple-300 shadow-md' : 'hover:shadow-sm'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg">
                        {change.content_title || `${change.content_type} changes`}
                      </CardTitle>
                      <Badge className={getStatusColor(change.status)}>
                        {getStatusIcon(change.status)}
                        <span className="ml-1 capitalize">{change.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {change.editor.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(change.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {change.content_type}
                      </div>
                      {change.chapter && (
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 mr-1" />
                          Chapter {change.chapter.chapter_number}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Word Count Change</div>
                    <div className={`text-lg font-semibold ${wordStats.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {wordStats.diff >= 0 ? '+' : ''}{wordStats.diff}
                      <span className="text-xs ml-1">({wordStats.percentage}%)</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {wordStats.original} → {wordStats.proposed}
                    </div>
                  </div>
                </div>

                {change.change_description && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Change Description:</div>
                    <div className="text-sm text-gray-600">{change.change_description}</div>
                  </div>
                )}

                {change.editor_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-1">Editor Notes:</div>
                    <div className="text-sm text-blue-600">{change.editor_notes}</div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Content Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">Content Preview</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDiff(isExpanded ? null : change.id)}
                      >
                        <Diff className="w-4 h-4 mr-1" />
                        {isExpanded ? 'Hide' : 'Show'} Diff
                        {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                      </Button>
                    </div>
                    
                    {isExpanded ? (
                      renderDiffView(change)
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="text-gray-600">
                          {renderContentPreview(change.proposed_content)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => setSelectedChange(isSelected ? null : change)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {isSelected ? 'Selected' : 'Review'}
                    </Button>
                    
                    <Button
                      onClick={() => processApproval(change.id, 'approve')}
                      disabled={processingId === change.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {processingId === change.id ? 'Processing...' : 'Approve'}
                    </Button>
                    
                    <Button
                      onClick={() => processApproval(change.id, 'reject')}
                      disabled={processingId === change.id}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {processingId === change.id ? 'Processing...' : 'Reject'}
                    </Button>
                    
                    <Button
                      onClick={() => processApproval(change.id, 'request_revision')}
                      disabled={processingId === change.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      {processingId === change.id ? 'Processing...' : 'Request Revision'}
                    </Button>
                  </div>

                  {/* Feedback Form - shown when change is selected */}
                  {isSelected && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="text-sm font-medium text-purple-800 mb-3">Provide Feedback (Optional)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-purple-700 block mb-1">
                            Feedback Notes
                          </label>
                          <Textarea
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            placeholder="Provide feedback on the changes..."
                            className="min-h-[80px] text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-purple-700 block mb-1">
                            Suggested Changes
                          </label>
                          <Textarea
                            value={suggestedChanges}
                            onChange={(e) => setSuggestedChanges(e.target.value)}
                            placeholder="Suggest specific changes if requesting revision..."
                            className="min-h-[60px] text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}