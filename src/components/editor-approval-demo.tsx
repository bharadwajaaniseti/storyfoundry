'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Send, 
  User,
  FileText,
  MessageSquare
} from 'lucide-react'

interface EditorApprovalDemoProps {
  projectId: string
}

export default function EditorApprovalDemo({ projectId }: EditorApprovalDemoProps) {
  const [userRole, setUserRole] = useState<'owner' | 'editor'>('editor')
  const [pendingChanges, setPendingChanges] = useState([
    {
      id: '1',
      editor_name: 'Jane Editor',
      content_title: 'Chapter 1: The Beginning',
      change_description: 'Fixed grammar issues and improved dialogue flow',
      status: 'pending',
      created_at: new Date().toISOString(),
      original_content: 'The old content was here with some typos and awkward phrasing.',
      proposed_content: 'The new content is here with corrected grammar and improved dialogue flow.',
      word_count_change: 15
    }
  ])
  const [feedbackNotes, setFeedbackNotes] = useState('')
  
  const handleApproval = (changeId: string, decision: 'approve' | 'reject' | 'request_revision') => {
    setPendingChanges(changes => 
      changes.map(change => 
        change.id === changeId 
          ? { ...change, status: decision === 'approve' ? 'approved' : decision }
          : change
      )
    )
    alert(`Change ${decision}d successfully!`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'request_revision': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'approved': return <CheckCircle className="w-3 h-3" />
      case 'rejected': return <XCircle className="w-3 h-3" />
      case 'request_revision': return <Edit3 className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Editor Approval Workflow Demo</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View as:</span>
          <Button 
            onClick={() => setUserRole(userRole === 'owner' ? 'editor' : 'owner')}
            variant="outline"
            size="sm"
          >
            {userRole === 'owner' ? 'Project Owner' : 'Editor'}
          </Button>
        </div>
      </div>

      {userRole === 'editor' ? (
        // Editor View
        <div className="space-y-6">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Edit3 className="w-5 h-5 mr-2" />
                Editor Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-purple-700 block mb-2">
                  Content Changes
                </label>
                <Textarea
                  placeholder="Make your changes here..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-purple-700 block mb-2">
                  Change Description
                </label>
                <Textarea
                  placeholder="Describe what you changed and why..."
                  className="min-h-[80px]"
                />
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
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
                          {change.content_title}
                        </span>
                        <Badge className={getStatusColor(change.status)}>
                          {getStatusIcon(change.status)}
                          <span className="ml-1 capitalize">{change.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{change.change_description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Submitted {new Date(change.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Owner View
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                  Editor Changes Awaiting Approval
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {pendingChanges.filter(c => c.status === 'pending').length} Pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pendingChanges.map((change) => (
                  <Card key={change.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CardTitle className="text-lg">
                              {change.content_title}
                            </CardTitle>
                            <Badge className={getStatusColor(change.status)}>
                              {getStatusIcon(change.status)}
                              <span className="ml-1 capitalize">{change.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {change.editor_name}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              +{change.word_count_change} words
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-1">Change Description:</div>
                        <div className="text-sm text-gray-600">{change.change_description}</div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Content Diff */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Content Changes</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                Original
                              </h4>
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                                {change.original_content}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                                Proposed
                              </h4>
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                                {change.proposed_content}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {change.status === 'pending' && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Feedback Notes (Optional)
                              </label>
                              <Textarea
                                value={feedbackNotes}
                                onChange={(e) => setFeedbackNotes(e.target.value)}
                                placeholder="Provide feedback on the changes..."
                                className="min-h-[80px] text-sm"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Button
                                onClick={() => handleApproval(change.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              
                              <Button
                                onClick={() => handleApproval(change.id, 'reject')}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              
                              <Button
                                onClick={() => handleApproval(change.id, 'request_revision')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Request Revision
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}