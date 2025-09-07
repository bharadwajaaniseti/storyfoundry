'use client'

import React from 'react'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { CollaborationPermissions } from '@/lib/collaboration-utils'
import { Shield, Lock } from 'lucide-react'

interface PermissionGateProps {
  projectId: string
  userId?: string
  requiredPermission?: keyof CollaborationPermissions
  ownerOnly?: boolean
  fallback?: React.ReactNode
  showFallback?: boolean
  children: React.ReactNode
}

function SimpleAlert({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      {children}
    </div>
  )
}

export function PermissionGate({
  projectId,
  userId,
  requiredPermission,
  ownerOnly = false,
  fallback,
  showFallback = false,
  children
}: PermissionGateProps) {
  const { permissions, loading, showElement, showOwnerOnly } = useRoleBasedUI(projectId, userId)

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
  }

  // Check owner-only access
  if (ownerOnly && !showOwnerOnly()) {
    if (showFallback && fallback) {
      return <>{fallback}</>
    }
    if (showFallback) {
      return (
        <SimpleAlert className="border-amber-200 bg-amber-50">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">This feature is only available to the project owner.</span>
          </div>
        </SimpleAlert>
      )
    }
    return null
  }

  // Check specific permission
  if (requiredPermission && !showElement(requiredPermission)) {
    if (showFallback && fallback) {
      return <>{fallback}</>
    }
    if (showFallback) {
      return (
        <SimpleAlert className="border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">You don't have permission to access this feature.</span>
          </div>
        </SimpleAlert>
      )
    }
    return null
  }

  return <>{children}</>
}

interface RoleBadgeProps {
  projectId: string
  userId?: string
  className?: string
  showAllRoles?: boolean
}

export function RoleBadge({ projectId, userId, className = '', showAllRoles = false }: RoleBadgeProps) {
  const { getRoleColor, getRoleDisplayName, getAllRoleNames, loading } = useRoleBasedUI(projectId, userId)

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
  }

  if (showAllRoles) {
    const allRoles = getAllRoleNames()
    return (
      <div className="flex flex-wrap gap-1">
        {allRoles.map((role, index) => (
          <span 
            key={role} 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              index === 0 ? getRoleColor() : 'bg-gray-100 text-gray-700'
            } ${className}`}
          >
            {role}
          </span>
        ))}
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor()} ${className}`}>
      {getRoleDisplayName()}
    </span>
  )
}

interface PermissionIndicatorProps {
  projectId: string
  userId?: string
  showPermissions?: boolean
  className?: string
}

export function PermissionIndicator({ 
  projectId, 
  userId, 
  showPermissions = true,
  className = '' 
}: PermissionIndicatorProps) {
  const { permissions, getRoleDisplayName, loading } = useRoleBasedUI(projectId, userId)

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
  }

  if (!showPermissions) {
    return <RoleBadge projectId={projectId} userId={userId} className={className} />
  }

  const permissionIcons = {
    read: '👁️',
    write: '✏️', 
    comment: '💬',
    invite: '👥'
  }

  const permissionNames = {
    read: 'View',
    write: 'Edit',
    comment: 'Comment', 
    invite: 'Invite'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <RoleBadge projectId={projectId} userId={userId} />
      
      {showPermissions && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(permissions.permissions).map(([key, hasPermission]) => (
            <div 
              key={key}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${
                hasPermission ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <span>{permissionIcons[key as keyof typeof permissionIcons]}</span>
              <span>{permissionNames[key as keyof typeof permissionNames]}</span>
              {hasPermission ? <span className="text-green-500">✓</span> : <span className="text-gray-300">✗</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
