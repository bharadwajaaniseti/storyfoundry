'use client'

import React, { useState } from 'react'
import { CollaborationRole, ROLE_DESCRIPTIONS, ROLE_COLORS } from '@/lib/collaboration-utils'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MultipleRoleSelectorProps {
  primaryRole: CollaborationRole
  secondaryRoles: CollaborationRole[]
  onPrimaryRoleChange: (role: CollaborationRole) => void
  onSecondaryRolesChange: (roles: CollaborationRole[]) => void
  disabled?: boolean
  className?: string
}

const roleIcons = {
  coauthor: '🖋️',
  editor: '📝',
  translator: '🌐',
  producer: '🎬',
  reviewer: '👀'
}

export default function MultipleRoleSelector({
  primaryRole,
  secondaryRoles,
  onPrimaryRoleChange,
  onSecondaryRolesChange,
  disabled = false,
  className = ''
}: MultipleRoleSelectorProps) {
  const [showSecondarySelector, setShowSecondarySelector] = useState(secondaryRoles.length > 0)

  const allRoles: CollaborationRole[] = ['coauthor', 'editor', 'translator', 'producer', 'reviewer']
  const availableSecondaryRoles = allRoles.filter(role => role !== primaryRole)

  const handleSecondaryRoleToggle = (role: CollaborationRole) => {
    if (secondaryRoles.includes(role)) {
      onSecondaryRolesChange(secondaryRoles.filter(r => r !== role))
    } else {
      onSecondaryRolesChange([...secondaryRoles, role])
    }
  }

  const handleRemoveSecondaryRole = (role: CollaborationRole) => {
    onSecondaryRolesChange(secondaryRoles.filter(r => r !== role))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Role *
        </label>
        <div className="grid grid-cols-1 gap-2">
          {allRoles.map((role) => (
            <button
              key={role}
              type="button"
              disabled={disabled}
              onClick={() => {
                onPrimaryRoleChange(role)
                // Remove from secondary roles if selected as primary
                if (secondaryRoles.includes(role)) {
                  onSecondaryRolesChange(secondaryRoles.filter(r => r !== role))
                }
              }}
              className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition-colors ${
                primaryRole === role
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center text-lg">
                {roleIcons[role]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 capitalize">
                    {role}
                  </h3>
                  {primaryRole === role && (
                    <Check className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Roles Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Roles (Optional)
          </label>
          {!showSecondarySelector && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSecondarySelector(true)}
              disabled={disabled}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Role
            </Button>
          )}
        </div>

        {showSecondarySelector && (
          <div className="space-y-3">
            {/* Selected Secondary Roles */}
            {secondaryRoles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Selected additional roles:</p>
                <div className="flex flex-wrap gap-2">
                  {secondaryRoles.map((role) => (
                    <div
                      key={role}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm"
                    >
                      <span>{roleIcons[role]}</span>
                      <span className="capitalize">{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSecondaryRole(role)}
                        disabled={disabled}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Secondary Roles */}
            <div className="grid grid-cols-1 gap-2">
              {availableSecondaryRoles.map((role) => {
                const isSelected = secondaryRoles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSecondaryRoleToggle(role)}
                    className={`flex items-center space-x-3 p-2 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded border flex items-center justify-center text-sm">
                      {roleIcons[role]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {role}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {secondaryRoles.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecondarySelector(false)}
                disabled={disabled}
                className="text-xs text-gray-500"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Role Summary */}
      {(primaryRole || secondaryRoles.length > 0) && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Role Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">Primary:</span> {roleIcons[primaryRole]} {primaryRole}
            </div>
            {secondaryRoles.length > 0 && (
              <div>
                <span className="font-medium">Additional:</span>{' '}
                {secondaryRoles.map((role, index) => (
                  <span key={role}>
                    {roleIcons[role]} {role}
                    {index < secondaryRoles.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              This user will have combined permissions from all selected roles.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
