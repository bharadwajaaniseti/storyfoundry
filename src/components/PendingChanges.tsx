'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  User, 
  Check, 
  X, 
  FileText, 
  Plus, 
  Edit, 
  Trash2,
  GitBranch,
  Calendar,
  ArrowRight
} from 'lucide-react'

interface PendingChange {
  id: string
  change_type: 'create' | 'update' | 'delete'
  table_name: string
  record_id?: string
  old_data?: any
  new_data?: any
  change_summary: string
  created_at: string
}

interface ChangeBatch {
  id: string
  title: string
  description: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  total_changes: number
  submitted_at?: string
  approved_at?: string
  rejection_reason?: string
  editor: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  approved_by_user?: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  changes: PendingChange[]
  created_at: string
}

interface PendingChangesProps {
  projectId: string
  isOwner: boolean
}

export default function PendingChanges({ projectId, isOwner }: PendingChangesProps) {
  const [batches, setBatches] = useState<ChangeBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<ChangeBatch | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    loadPendingChanges()
  }, [projectId])

  const loadPendingChanges = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pending-changes`)
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Error loading pending changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (batchId: string, action: 'approve' | 'reject') => {
    setApproving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/approve-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        await loadPendingChanges()
        setSelectedBatch(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    } finally {
      setApproving(false)
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />
      case 'update': return <Edit className="h-4 w-4 text-blue-600" />
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      submitted: 'default',
      approved: 'secondary',
      rejected: 'destructive'
    }
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>
  }

  const renderChangeDetails = (change: PendingChange) => {
    const isWorldElement = change.table_name === 'world_elements'
    const data = change.new_data || change.old_data

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {getChangeIcon(change.change_type)}
          <span className="font-medium">{change.change_summary}</span>
          <Badge variant="outline" className="text-xs">
            {isWorldElement ? 'World Element' : 'Chapter'}
          </Badge>
        </div>
        
        {data && (
          <div className="ml-6 text-sm text-muted-foreground">
            <div><strong>Name:</strong> {data.name || data.title}</div>
            {data.description && (
              <div><strong>Description:</strong> {data.description.substring(0, 100)}...</div>
            )}
            {change.change_type === 'update' && change.old_data && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <div className="font-medium">Changes:</div>
                {Object.keys(change.new_data).map(key => {
                  if (change.old_data[key] !== change.new_data[key]) {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-medium">{key}:</span>
                        <span className="line-through text-red-600">
                          {String(change.old_data[key]).substring(0, 30)}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-green-600">
                          {String(change.new_data[key]).substring(0, 30)}
                        </span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pending changes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Changes</h2>
        {isOwner && (
          <Badge variant="outline" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {batches.filter(b => b.status === 'submitted').length} awaiting approval
          </Badge>
        )}
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Changes</h3>
            <p className="text-muted-foreground text-center">
              All changes have been approved or there are no pending modifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{batch.title}</CardTitle>
                      {getStatusBadge(batch.status)}
                    </div>
                    {batch.description && (
                      <CardDescription>{batch.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={batch.editor.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {batch.editor.full_name?.charAt(0) || batch.editor.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {batch.editor.full_name || batch.editor.username}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(batch.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {batch.total_changes} changes
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedBatch(batch)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            {batch.title}
                          </DialogTitle>
                          <DialogDescription>
                            Review all changes in this batch before approval
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="max-h-[50vh] overflow-y-auto">
                          <div className="space-y-4">
                            {batch.changes.map((change, index) => (
                              <div key={change.id}>
                                {renderChangeDetails(change)}
                                {index < batch.changes.length - 1 && (
                                  <Separator className="my-4" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {isOwner && batch.status === 'submitted' && (
                          <DialogFooter className="gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" disabled={approving}>
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Changes</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting these changes.
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Reason for rejection..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <DialogFooter>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleApproval(batch.id, 'reject')}
                                    disabled={approving || !rejectionReason.trim()}
                                  >
                                    Reject Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              onClick={() => handleApproval(batch.id, 'approve')}
                              disabled={approving}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve All
                            </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>

                    {batch.status === 'approved' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Approved
                      </Badge>
                    )}
                    
                    {batch.status === 'rejected' && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {batch.changes.slice(0, 3).map((change) => (
                    <div key={change.id} className="flex items-center gap-2 text-sm">
                      {getChangeIcon(change.change_type)}
                      <span>{change.change_summary}</span>
                    </div>
                  ))}
                  {batch.changes.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{batch.changes.length - 3} more changes...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}