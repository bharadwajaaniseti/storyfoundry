'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
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
      <div className="space-y-3 px-6 pb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 pb-6">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading invitations: {error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="px-6 pb-6">
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No {type === 'sent' ? 'sent' : ''} invitations
          </h3>
          <p className="text-gray-600">
            {type === 'sent' 
              ? "You haven't sent any collaboration invitations yet" 
              : "No new collaboration invitations"
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-6 pb-6">
      {invitations.map((invitation) => {
        const { status, color, isExpired } = getInvitationStatus(invitation)
        const isProcessing = processingIds.has(invitation.id)
        const showActions = type === 'received' && invitation.status === 'pending' && !isExpired

        return (
          <div 
            key={invitation.id} 
            className={`group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition-all duration-200 ${isExpired ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-4">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage 
                  src={type === 'sent' ? invitation.invitee?.avatar_url : invitation.inviter?.avatar_url} 
                />
                <AvatarFallback className="bg-gray-100">
                  <User className="w-5 h-5 text-gray-600" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate text-base group-hover:text-orange-600 transition-colors">
                      {invitation.projects?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {type === 'sent' ? (
                        <>
                          Invited <span className="font-medium text-gray-800">{invitation.invitee?.display_name}</span>
                        </>
                      ) : (
                        <>
                          From <span className="font-medium text-gray-800">{invitation.inviter?.display_name}</span>
                        </>
                      )}
                      {invitation.inviter?.verified_pro && (
                        <Badge variant="outline" className="ml-2 text-xs border-purple-300 text-purple-600">
                          Pro
                        </Badge>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                      {invitation.projects?.format}
                    </Badge>
                    <Badge className={`text-xs ${ROLE_COLORS[invitation.role as keyof typeof ROLE_COLORS]}`}>
                      {invitation.role}
                    </Badge>
                  </div>
                </div>

                {invitation.message && (
                  <div className="bg-gray-50 border border-gray-100 rounded-md p-3 mb-3">
                    <p className="text-sm text-gray-700 italic">
                      "{invitation.message}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{getRelativeTime(invitation.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className={color}>
                        {status}
                      </span>
                    </div>
                    {invitation.royalty_split && (
                      <div className="flex items-center gap-1 text-orange-600 font-medium">
                        <span>{invitation.royalty_split}% split</span>
                      </div>
                    )}
                    {invitation.expires_at && !isExpired && (
                      <span className="text-amber-600">
                        Expires {getRelativeTime(invitation.expires_at)}
                      </span>
                    )}
                  </div>

                  {showActions && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponse(invitation.id, 'decline')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResponse(invitation.id, 'accept')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
