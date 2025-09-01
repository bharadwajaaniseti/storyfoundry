'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/user-avatar'
import { 
  Check, 
  X, 
  Clock, 
  Trash2,
  UserMinus,
  MessageCircle,
  AlertCircle
} from 'lucide-react'

interface AccessRequest {
  id: string
  requester_id: string
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  profiles: {
    display_name: string
    avatar_url: string | null
    role: string
  } | null
}

interface AccessGrant {
  id: string
  granted_to_id: string
  created_at: string
  profiles: {
    display_name: string
    avatar_url: string | null
    role: string
  } | null
}

interface ProfileAccessManagerProps {
  userId: string
}

export default function ProfileAccessManager({ userId }: ProfileAccessManagerProps) {
  const { addToast } = useToast()
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPreviousRequests, setShowPreviousRequests] = useState(false)

  const loadAccessData = async () => {
    try {
      const supabase = createSupabaseClient()

      // Load pending access requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('profile_access_requests')
        .select(`
          id,
          requester_id,
          message,
          status,
          created_at,
          requester:requester_id (
            display_name,
            avatar_url,
            role
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error loading access requests:', requestsError)
      } else {
        // Transform the data to match our interface
        const transformedRequests = requestsData?.map(req => ({
          ...req,
          profiles: Array.isArray(req.requester) ? req.requester[0] : req.requester
        })) || []
        setAccessRequests(transformedRequests)
      }

      // Load granted access
      const { data: grantsData, error: grantsError } = await supabase
        .from('profile_access_grants')
        .select(`
          id,
          granted_to_id,
          created_at,
          grantee:granted_to_id (
            display_name,
            avatar_url,
            role
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (grantsError) {
        console.error('Error loading access grants:', grantsError)
      } else {
        // Transform the data to match our interface
        const transformedGrants = grantsData?.map(grant => ({
          ...grant,
          profiles: Array.isArray(grant.grantee) ? grant.grantee[0] : grant.grantee
        })) || []
        setAccessGrants(transformedGrants)
      }
    } catch (error) {
      console.error('Error loading access data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessDecision = async (requestId: string, decision: 'approved' | 'denied') => {
    try {
      const supabase = createSupabaseClient()

      // First try the database function
      const { data, error } = await supabase.rpc('handle_profile_access_decision', {
        p_request_id: requestId,
        p_status: decision
      })

      if (error) {
        console.error('RPC function error, trying manual approach:', error)
        
        // Fallback: Handle manually
        // 1. Get the request details
        const { data: requestData, error: requestError } = await supabase
          .from('profile_access_requests')
          .select('*')
          .eq('id', requestId)
          .single()

        if (requestError || !requestData) {
          console.error('Error getting request data:', requestError)
          return
        }

        // 2. Update the request status
        const { error: updateError } = await supabase
          .from('profile_access_requests')
          .update({ 
            status: decision, 
            decided_at: new Date().toISOString() 
          })
          .eq('id', requestId)

        if (updateError) {
          console.error('Error updating request status:', updateError)
          return
        }

        // 3. If approved, create access grant
        if (decision === 'approved') {
          const { error: grantError } = await supabase
            .from('profile_access_grants')
            .insert({
              profile_id: requestData.profile_id,
              granted_to_id: requestData.requester_id,
              granted_by_id: userId
            })

          if (grantError) {
            console.error('Error creating access grant:', grantError)
            return
          }
        }

        // 4. Create notification
        const notificationTitle = decision === 'approved' ? 'Profile Access Granted' : 'Profile Access Denied'
        const notificationMessage = decision === 'approved' 
          ? 'Your request to view this profile has been approved.'
          : 'Your request to view this profile has been denied.'

        await supabase.rpc('create_notification', {
          p_user_id: requestData.requester_id,
          p_type: `profile_access_${decision}`,
          p_title: notificationTitle,
          p_message: notificationMessage,
          p_data: { profile_id: requestData.profile_id }
        })
      }
      
      // Show success toast
      const requesterName = accessRequests.find(r => r.id === requestId)?.profiles?.display_name || 'User'
      addToast({
        type: 'success',
        title: `Access ${decision === 'approved' ? 'Granted' : 'Denied'}`,
        message: `You've ${decision === 'approved' ? 'granted' : 'denied'} ${requesterName}'s request to view your profile.`
      })
      
      // Reload data to reflect changes
      await loadAccessData()
    } catch (error) {
      console.error('Error handling access decision:', error)
      addToast({
        type: 'error',
        title: 'Failed to Process Request',
        message: 'Unable to process the access request. Please try again.'
      })
    }
  }

  const revokeAccess = async (grantId: string) => {
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('profile_access_grants')
        .delete()
        .eq('id', grantId)

      if (error) {
        console.error('Error revoking access:', error)
        return
      }

      // Reload data to reflect changes
      await loadAccessData()
    } catch (error) {
      console.error('Error revoking access:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      loadAccessData()
    }

    // Listen for profile access updates
    const handleAccessUpdate = () => {
      if (userId) {
        loadAccessData()
      }
    }

    window.addEventListener('profileAccessUpdated', handleAccessUpdate)
    
    return () => {
      window.removeEventListener('profileAccessUpdated', handleAccessUpdate)
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const pendingRequests = accessRequests.filter(req => req.status === 'pending')
  const approvedRequests = accessRequests.filter(req => req.status === 'approved')
  const hasAnyActivity = pendingRequests.length > 0 || approvedRequests.length > 0 || accessGrants.length > 0

  if (!hasAnyActivity) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No access requests yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pending Access Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div 
                key={request.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserAvatar 
                      user={request.profiles || { display_name: 'Unknown User', avatar_url: null }}
                      size="sm"
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {request.profiles?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccessDecision(request.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAccessDecision(request.id, 'denied')}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white h-8 px-3"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
                {request.message && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    {request.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests without Grants (Revoked Access) */}
      {approvedRequests.length > 0 && (
        <div>
          <button
            onClick={() => setShowPreviousRequests(!showPreviousRequests)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-800 mb-3 hover:text-gray-600 transition-colors"
          >
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
              Previous Requests ({approvedRequests.length})
            </div>
            <div className="flex items-center text-xs text-gray-500">
              {showPreviousRequests ? (
                <>
                  <span className="mr-1">Hide</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="mr-1">Show</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </div>
          </button>
          
          {showPreviousRequests && (
            <div className="space-y-2">
              {approvedRequests.map((request) => {
                // Check if this approved request has a corresponding grant
                const hasGrant = accessGrants.some(grant => grant.granted_to_id === request.requester_id)
                
                return (
                  <div 
                    key={request.id}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserAvatar 
                          user={request.profiles || { display_name: 'Unknown User', avatar_url: null }}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {request.profiles?.display_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hasGrant ? 'Currently has access' : 'Access was revoked'} • {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          {request.status}
                        </span>
                      </div>
                    </div>
                    {request.message && (
                      <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-gray-600">
                        <MessageCircle className="w-3 h-3 inline mr-1" />
                        {request.message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Granted Access */}
      {accessGrants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
            <Check className="w-4 h-4 mr-2 text-green-500" />
            Granted Access ({accessGrants.length})
          </h4>
          <div className="space-y-2">
            {accessGrants.map((grant) => (
              <div 
                key={grant.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserAvatar 
                      user={grant.profiles || { display_name: 'Unknown User', avatar_url: null }}
                      size="sm"
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {grant.profiles?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Access granted {new Date(grant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revokeAccess(grant.id)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white h-8 px-3"
                  >
                    <UserMinus className="w-3 h-3 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
