'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import RoleTag from './role-tag'
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
  Sparkles
} from 'lucide-react'
import { 
  CollaborationRole,
  ROLE_DESCRIPTIONS,
  ProjectCollaborator
} from '@/lib/collaboration-utils'

interface EditCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  collaborator: ProjectCollaborator
  onSave: (updates: { role?: string; royalty_split?: number }) => Promise<void>
  onRemove: () => Promise<void>
  currentTotalSplit: number
}

export default function EditCollaboratorModal({
  isOpen,
  onClose,
  collaborator,
  onSave,
  onRemove,
  currentTotalSplit
}: EditCollaboratorModalProps) {
  const [role, setRole] = useState<CollaborationRole>(collaborator.role as CollaborationRole)
  const [royaltySplit, setRoyaltySplit] = useState<number>(collaborator.royalty_split || 0)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const otherCollaboratorsSplit = currentTotalSplit - (collaborator.royalty_split || 0)
  const maxSplit = 100 - otherCollaboratorsSplit

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const updates: { role?: string; royalty_split?: number } = {}
      
      if (role !== collaborator.role) {
        updates.role = role
      }
      
      if (royaltySplit !== (collaborator.royalty_split || 0)) {
        updates.royalty_split = royaltySplit
      }
      
      if (Object.keys(updates).length > 0) {
        await onSave(updates)
      }
      
      onClose()
    } catch (error) {
      alert('Failed to update collaborator')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${collaborator.profiles?.display_name} from this project?`)) {
      return
    }

    try {
      setRemoving(true)
      await onRemove()
      onClose()
    } catch (error) {
      alert('Failed to remove collaborator')
    } finally {
      setRemoving(false)
    }
  }

  const getRoleIcon = (roleKey: string) => {
    switch (roleKey) {
      case 'coauthor': return <Edit3 className="w-5 h-5 text-white" />
      case 'editor': return <FileCheck className="w-5 h-5 text-white" />
      case 'translator': return <Languages className="w-5 h-5 text-white" />
      case 'producer': return <Clapperboard className="w-5 h-5 text-white" />
      case 'reviewer': return <Eye className="w-5 h-5 text-white" />
      default: return <Settings className="w-5 h-5 text-white" />
    }
  }

  const getRoleColor = (roleKey: string) => {
    switch (roleKey) {
      case 'coauthor': return '#3b82f6'
      case 'editor': return '#10b981'
      case 'translator': return '#8b5cf6'
      case 'producer': return '#f97316'
      case 'reviewer': return '#6b7280'
      default: return '#9ca3af'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-0 p-0 bg-transparent shadow-none">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-amber-500/90"></div>
            <div className="relative flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  Edit Collaborator
                </DialogTitle>
                <DialogDescription className="text-orange-100 text-sm">
                  Manage role and permissions for this team member
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Collaborator Info */}
            <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-xl border border-orange-100">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-2 ring-orange-200">
                  <AvatarImage src={collaborator.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-xl">
                    {collaborator.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {collaborator.profiles?.verified_pro && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {collaborator.profiles?.display_name || 'Unknown User'}
                </h3>
                <div className="flex items-center space-x-3">
                  <div>
                    <RoleTag role={collaborator.role} />
                  </div>
                  {collaborator.profiles?.verified_pro && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Collaboration Role</span>
              </label>
              <Select value={role} onValueChange={(value) => setRole(value as CollaborationRole)}>
                <SelectTrigger className="p-4 border-2 border-gray-200 rounded-xl focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-white hover:bg-gray-50 h-auto min-h-[64px]">
                  <div className="flex items-center space-x-3 w-full">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: getRoleColor(role) }}
                    >
                      {getRoleIcon(role)}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900 text-base capitalize mb-1">{role}</div>
                      <div className="text-sm text-gray-600 leading-tight">{ROLE_DESCRIPTIONS[role]}</div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-200 rounded-xl shadow-2xl bg-white/95 backdrop-blur-xl p-2 max-w-xs">
                  {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, description]) => (
                    <SelectItem 
                      key={roleKey} 
                      value={roleKey} 
                      className="p-4 m-1 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 focus:bg-gradient-to-r focus:from-orange-50 focus:to-amber-50 cursor-pointer transition-all duration-200 border-0 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-orange-50 data-[highlighted]:to-amber-50"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
                          style={{ backgroundColor: getRoleColor(roleKey) }}
                        >
                          {getRoleIcon(roleKey)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900 text-base capitalize mb-1">{roleKey}</div>
                          <div className="text-sm text-gray-600 leading-tight">{description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Royalty Split */}
            <div className="space-y-4">
              <label className="text-base font-semibold text-gray-800 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span>Revenue Share</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Percentage of project revenue</span>
                  <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                    Available: {maxSplit}%
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={maxSplit}
                  value={royaltySplit}
                  onChange={(e) => setRoyaltySplit(Math.min(maxSplit, Math.max(0, Number(e.target.value))))}
                  className="p-4 border-2 border-gray-200 rounded-xl focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-200 text-center text-lg font-semibold"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Warning if exceeds limit */}
            {royaltySplit > maxSplit && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm font-medium">
                  Revenue share would exceed 100%. Max available: {maxSplit}%
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={removing}
                className="px-6 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200 font-medium"
              >
                <div className="flex items-center space-x-2">
                  {removing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </>
                  )}
                </div>
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving || royaltySplit > maxSplit}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
