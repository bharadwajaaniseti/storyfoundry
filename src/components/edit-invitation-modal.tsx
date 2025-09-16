'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Settings, 
  Save, 
  X, 
  Crown,
  Edit3,
  FileCheck,
  Languages,
  Clapperboard,
  Eye,
  AlertCircle,
  Trash2,
  Users,
  Sparkles,
  Clock
} from 'lucide-react'
import { 
  CollaborationRole,
  ROLE_DESCRIPTIONS,
  CollaborationInvitation
} from '@/lib/collaboration-utils'

interface EditInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  invitation: CollaborationInvitation
  onSave: (updates: { role?: string; royalty_split?: number }) => Promise<void>
  onCancel: () => Promise<void>
  currentTotalSplit: number
}

const ROLE_ICONS: Record<CollaborationRole, any> = {
  coauthor: Crown,
  editor: Edit3,
  translator: Languages,
  producer: Clapperboard,
  reviewer: Eye
}

const ROLE_COLORS: Record<CollaborationRole, string> = {
  coauthor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  editor: 'bg-blue-100 text-blue-800 border-blue-200',
  translator: 'bg-green-100 text-green-800 border-green-200',
  producer: 'bg-purple-100 text-purple-800 border-purple-200',
  reviewer: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function EditInvitationModal({
  isOpen,
  onClose,
  invitation,
  onSave,
  onCancel,
  currentTotalSplit
}: EditInvitationModalProps) {
  const [selectedRole, setSelectedRole] = useState<CollaborationRole>(invitation.role)
  const [royaltySplit, setRoyaltySplit] = useState(invitation.royalty_split || 0)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave({
        role: selectedRole,
        royalty_split: royaltySplit
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      await onCancel()
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = invitation.profiles?.display_name || invitation.invitee?.display_name || 'Unknown User'
  const avatarUrl = invitation.profiles?.avatar_url || invitation.invitee?.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  const maxAllowedSplit = 100 - (currentTotalSplit - (invitation.royalty_split || 0))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span>Edit Invitation</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Modify the role and revenue share for this pending invitation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {initials}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">{displayName}</h4>
              <p className="text-sm text-gray-600">
                Invited {new Date(invitation.created_at).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  Pending Response
                </span>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-900">
              Collaboration Role
            </label>
            <Select value={selectedRole} onValueChange={(value: CollaborationRole) => setSelectedRole(value)}>
              <SelectTrigger className="w-full h-12 border-gray-300 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-xl">
                {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => {
                  const IconComponent = ROLE_ICONS[role as CollaborationRole]
                  return (
                    <SelectItem key={role} value={role} className="hover:bg-orange-50 focus:bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          role === 'coauthor' ? 'bg-yellow-100' :
                          role === 'editor' ? 'bg-blue-100' :
                          role === 'translator' ? 'bg-green-100' :
                          role === 'producer' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            role === 'coauthor' ? 'text-yellow-600' :
                            role === 'editor' ? 'text-blue-600' :
                            role === 'translator' ? 'text-green-600' :
                            role === 'producer' ? 'text-purple-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <span className="font-medium capitalize">{role}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            
            {/* Role Description */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-medium">{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}:</span> {ROLE_DESCRIPTIONS[selectedRole]}
              </p>
            </div>
          </div>

          {/* Revenue Share */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-900">
              Revenue Share
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  min="0"
                  max={maxAllowedSplit}
                  value={royaltySplit}
                  onChange={(e) => setRoyaltySplit(Math.min(maxAllowedSplit, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="h-12 text-center text-lg font-semibold border-gray-300 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <span className="font-medium">Available:</span> {maxAllowedSplit}% • <span className="font-medium">Current total:</span> {currentTotalSplit}%
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isLoading}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
            
            {/* Cancel Invitation Button */}
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isLoading}
              className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? 'Canceling...' : 'Cancel Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}