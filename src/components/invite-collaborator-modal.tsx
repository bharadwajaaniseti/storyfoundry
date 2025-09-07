'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  User, 
  Mail,
  AlertCircle,
  Users,
  Crown,
  Edit3,
  Eye,
  UserCheck,
  ArrowLeft,
  Check,
  Sparkles,
  Languages,
  Clapperboard,
  FileCheck
} from 'lucide-react'
import { useCollaborationInvitations } from '@/hooks/useCollaboration'
import { 
  CollaborationRole,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  validateRoyaltySplit
} from '@/lib/collaboration-utils'
import { createSupabaseClient } from '@/lib/auth-client'
import MultipleRoleSelector from '@/components/multiple-role-selector'

interface Profile {
  id: string
  display_name: string
  avatar_url?: string
  verified_pro: boolean
  bio?: string
}

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  currentCollaborators?: any[]
  onInvitationSent?: () => void // Add callback to refresh parent data
}

export default function InviteCollaboratorModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  currentCollaborators = [],
  onInvitationSent
}: InviteCollaboratorModalProps) {
  const { sendInvitation } = useCollaborationInvitations()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<CollaborationRole>('editor')
  const [secondaryRoles, setSecondaryRoles] = useState<CollaborationRole[]>([])
  const [royaltySplit, setRoyaltySplit] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTotalSplit = currentCollaborators.reduce((total, collab) => {
    return total + (collab.royalty_split || 0)
  }, 0)

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const supabase = createSupabaseClient()
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, verified_pro, bio')
        .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(10)

      if (error) throw error

      // Filter out current collaborators and project owner
      const collaboratorIds = currentCollaborators.map(c => c.user_id)
      const filtered = profiles?.filter(profile => 
        !collaboratorIds.includes(profile.id)
      ) || []

      setSearchResults(filtered)
    } catch (err) {
      console.error('Error searching users:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSendInvitation = async () => {
    if (!selectedUser) return

    if (royaltySplit > 0 && !validateRoyaltySplit(currentCollaborators, royaltySplit)) {
      setError(`Royalty split would exceed 100%. Current total: ${currentTotalSplit}%`)
      return
    }

    try {
      setSending(true)
      setError(null)
      
      await sendInvitation({
        project_id: projectId,
        invitee_id: selectedUser.id,
        role,
        secondary_roles: secondaryRoles.length > 0 ? secondaryRoles : undefined,
        royalty_split: royaltySplit > 0 ? royaltySplit : undefined,
        message: message.trim() || undefined
      })

      // Reset form
      setSelectedUser(null)
      setRole('editor')
      setSecondaryRoles([])
      setRoyaltySplit(0)
      setMessage('')
      setSearchQuery('')
      setSearchResults([])
      
      // Trigger refresh of parent component data
      if (onInvitationSent) {
        onInvitationSent()
      }
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setRole('editor')
    setSecondaryRoles([])
    setRoyaltySplit(0)
    setMessage('')
    setSearchQuery('')
    setSearchResults([])
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-0 p-0 bg-transparent shadow-none">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-amber-500/90"></div>
            <div className="relative flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  Invite Collaborator
                </DialogTitle>
                <DialogDescription className="text-orange-100 text-sm">
                  Invite someone to collaborate on "{projectTitle}"
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!selectedUser ? (
              // User Search Section
              <div className="space-y-6">
                {/* Search Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Your Collaborator</h3>
                  <p className="text-gray-600">Search for writers, editors, or other creators to join your project</p>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search for users by name or bio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Loading State */}
                {searching && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Searching for creators...</div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-gray-700 px-2">Found {searchResults.length} creator{searchResults.length !== 1 ? 's' : ''}</h4>
                    {searchResults.map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => setSelectedUser(profile)}
                        className="group flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12 ring-2 ring-gray-200 group-hover:ring-orange-300 transition-all duration-200">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-semibold">
                              {profile.display_name?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {profile.verified_pro && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                              {profile.display_name}
                            </h4>
                            {profile.verified_pro && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                          </div>
                          {profile.bio && (
                            <p className="text-sm text-gray-600 truncate group-hover:text-gray-700 transition-colors">
                              {profile.bio}
                            </p>
                          )}
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">No creators found</h4>
                    <p className="text-sm text-gray-600">Try adjusting your search terms or check the spelling</p>
                  </div>
                )}

                {/* Helper Text */}
                {searchQuery.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Start typing to search for creators to collaborate with</p>
                  </div>
                )}
              </div>
            ) : (
              // Invitation Form Section
              <div className="space-y-8">
                {/* Back Button & Selected User */}
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to search</span>
                  </button>

                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-xl border border-orange-100">
                    <div className="relative">
                      <Avatar className="w-14 h-14 ring-2 ring-orange-200">
                        <AvatarImage src={selectedUser.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-lg">
                          {selectedUser.display_name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {selectedUser.verified_pro && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {selectedUser.display_name}
                        </h4>
                        {selectedUser.verified_pro && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro Creator
                          </Badge>
                        )}
                      </div>
                      {selectedUser.bio && (
                        <p className="text-sm text-gray-600">{selectedUser.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span>Collaboration Roles</span>
                  </label>
                  <MultipleRoleSelector
                    primaryRole={role}
                    secondaryRoles={secondaryRoles}
                    onPrimaryRoleChange={setRole}
                    onSecondaryRolesChange={setSecondaryRoles}
                    disabled={sending}
                  />
                </div>

                {/* Royalty Split */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <span>Revenue Share</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Percentage of project revenue</span>
                      <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        Current total: {currentTotalSplit}%
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={100 - currentTotalSplit}
                      value={royaltySplit}
                      onChange={(e) => setRoyaltySplit(Number(e.target.value))}
                      placeholder="0"
                      className="p-4 border-2 border-gray-200 rounded-xl focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <span>Personal Message</span>
                    <span className="text-sm font-normal text-gray-500">(optional)</span>
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message to your invitation..."
                    rows={4}
                    className="p-4 border-2 border-gray-200 rounded-xl focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendInvitation} 
                    disabled={sending}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Invitation</span>
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
