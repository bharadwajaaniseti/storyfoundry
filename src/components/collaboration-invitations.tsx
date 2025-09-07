'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Check, 
  X, 
  Clock, 
  Mail, 
  User,
  Calendar,
  AlertCircle 
} from 'lucide-react'
import { useCollaborationInvitations } from '@/hooks/useCollaboration'
import { 
  CollaborationInvitation, 
  getInvitationStatus, 
  getRelativeTime,
  ROLE_COLORS 
} from '@/lib/collaboration-utils'

interface CollaborationInvitationsProps {
  type?: 'sent' | 'received'
}

export default function CollaborationInvitations({ type = 'received' }: CollaborationInvitationsProps) {
  const { invitations, loading, error, respondToInvitation } = useCollaborationInvitations(type)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const handleResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingIds(prev => new Set(prev).add(invitationId))
      await respondToInvitation(invitationId, action)
    } catch (err) {
      console.error('Error responding to invitation:', err)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(invitationId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading invitations: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No {type === 'sent' ? 'sent' : ''} invitations
          </h3>
          <p className="text-gray-600">
            {type === 'sent' 
              ? "You haven't sent any collaboration invitations yet" 
              : "No new collaboration invitations"
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const { status, color, isExpired } = getInvitationStatus(invitation)
        const isProcessing = processingIds.has(invitation.id)
        const showActions = type === 'received' && invitation.status === 'pending' && !isExpired

        return (
          <Card key={invitation.id} className={isExpired ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={type === 'sent' ? invitation.invitee?.avatar_url : invitation.inviter?.avatar_url} 
                      />
                      <AvatarFallback>
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {invitation.projects?.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {invitation.projects?.format}
                        </Badge>
                        <Badge className={`text-xs ${ROLE_COLORS[invitation.role as keyof typeof ROLE_COLORS]}`}>
                          {invitation.role}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {type === 'sent' ? (
                          <>
                            Invited <span className="font-medium">{invitation.invitee?.display_name}</span>
                          </>
                        ) : (
                          <>
                            From <span className="font-medium">{invitation.inviter?.display_name}</span>
                          </>
                        )}
                        {invitation.inviter?.verified_pro && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Pro
                          </Badge>
                        )}
                      </p>

                      {invitation.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
                          "{invitation.message}"
                        </p>
                      )}

                      {invitation.royalty_split && (
                        <p className="text-xs text-gray-500 mb-2">
                          Royalty split: {invitation.royalty_split}%
                        </p>
                      )}

                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{getRelativeTime(invitation.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className={color}>
                            {status}
                          </span>
                        </div>
                        {invitation.expires_at && !isExpired && (
                          <span>
                            Expires {getRelativeTime(invitation.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showActions && (
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResponse(invitation.id, 'decline')}
                      disabled={isProcessing}
                      className="hover:bg-red-50 hover:border-red-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse(invitation.id, 'accept')}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
