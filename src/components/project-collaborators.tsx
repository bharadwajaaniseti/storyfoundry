'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  UserPlus, 
  MoreVertical, 
  Crown, 
  AlertCircle,
  Settings
} from 'lucide-react'
import { useProjectCollaborators } from '@/hooks/useCollaboration'
import { 
  ProjectCollaborator, 
  ROLE_COLORS, 
  ROLE_DESCRIPTIONS,
  calculateTotalRoyaltySplit 
} from '@/lib/collaboration-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectCollaboratorsProps {
  projectId: string
  isOwner?: boolean
  onInviteClick?: () => void
}

export default function ProjectCollaborators({ 
  projectId, 
  isOwner = false, 
  onInviteClick 
}: ProjectCollaboratorsProps) {
  const { collaborators, loading, error, removeCollaborator } = useProjectCollaborators(projectId)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const totalRoyaltySplit = calculateTotalRoyaltySplit(collaborators)

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    try {
      setProcessingIds(prev => new Set(prev).add(collaboratorId))
      await removeCollaborator(collaboratorId)
    } catch (err) {
      console.error('Error removing collaborator:', err)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(collaboratorId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Collaborators</span>
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading collaborators: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Collaborators</span>
              <Badge variant="outline" className="text-xs">
                {collaborators.length}
              </Badge>
            </CardTitle>
            {totalRoyaltySplit > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Total royalty split: {totalRoyaltySplit}%
              </p>
            )}
          </div>
          {isOwner && onInviteClick && (
            <Button size="sm" onClick={onInviteClick}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-800 mb-1">No collaborators yet</h3>
            <p className="text-xs text-gray-600">
              {isOwner ? 'Invite team members to start collaborating' : 'No other collaborators on this project'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborators.map((collaborator) => {
              const isProcessing = processingIds.has(collaborator.id)
              
              return (
                <div 
                  key={collaborator.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={collaborator.profiles?.avatar_url} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800 truncate">
                          {collaborator.profiles?.display_name || 'Unknown User'}
                        </h4>
                        {collaborator.profiles?.verified_pro && (
                          <Badge variant="outline" className="text-xs">
                            Pro
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${ROLE_COLORS[collaborator.role as keyof typeof ROLE_COLORS]}`}>
                          {collaborator.role}
                        </Badge>
                        
                        {collaborator.royalty_split && (
                          <span className="text-xs text-gray-500">
                            {collaborator.royalty_split}% royalty
                          </span>
                        )}
                      </div>

                      {collaborator.profiles?.bio && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {collaborator.profiles.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          disabled={isProcessing}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-red-600"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalRoyaltySplit > 100 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Warning: Total royalty split exceeds 100% ({totalRoyaltySplit}%)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
