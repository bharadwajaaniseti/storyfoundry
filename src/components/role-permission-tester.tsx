'use client'

import React, { useState } from 'react'
import { useRoleBasedUI } from '@/hooks/usePermissions'
import { useProjectPermissions } from '@/hooks/usePermissions'
import { PermissionGate, RoleBadge } from '@/components/permission-gate'
import { 
  CheckCircle2,
  XCircle,
  Shield,
  Users,
  Edit3,
  Eye,
  Send,
  Settings,
  MessageSquare,
  UserPlus,
  Star,
  Globe,
  Download,
  Upload,
  Trash2
} from 'lucide-react'

interface RolePermissionTesterProps {
  projectId: string
  userId?: string
}

export default function RolePermissionTester({ projectId, userId }: RolePermissionTesterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    userRole, 
    getAllRoleNames, 
    showElement
  } = useRoleBasedUI(projectId, userId)

  const { permissions: userPermissions } = useProjectPermissions(projectId, userId)

  if (!userId) return null

  const allRoles = getAllRoleNames()
  
  const permissions = [
    { name: 'Read Content', key: 'read', hasPermission: userPermissions.canRead, icon: Eye },
    { name: 'Write Content', key: 'write', hasPermission: userPermissions.canWrite, icon: Edit3 },
    { name: 'Add Comments', key: 'comment', hasPermission: userPermissions.canComment, icon: MessageSquare },
    { name: 'Invite Users', key: 'invite', hasPermission: userPermissions.canInvite, icon: UserPlus },
    { name: 'Manage Settings', key: 'owner', hasPermission: userPermissions.isOwner, icon: Settings },
    { name: 'Download Content', key: 'read', hasPermission: userPermissions.canRead, icon: Download },
    { name: 'Upload Assets', key: 'write', hasPermission: userPermissions.canWrite, icon: Upload },
    { name: 'Delete Content', key: 'owner', hasPermission: userPermissions.isOwner, icon: Trash2 }
  ]

  const testComponents = [
    {
      name: 'Save Button',
      requiredPermission: 'write',
      component: (
        <PermissionGate projectId={projectId} userId={userId} requiredPermission="write">
          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save</button>
        </PermissionGate>
      )
    },
    {
      name: 'Share Button', 
      requiredPermission: 'read',
      component: (
        <PermissionGate projectId={projectId} userId={userId} requiredPermission="read">
          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Share</button>
        </PermissionGate>
      )
    },
    {
      name: 'Settings Button',
      requiredPermission: 'invite',
      component: userPermissions.isOwner ? (
        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Settings</button>
      ) : (
        <span className="text-gray-400 text-sm">Settings (Owner only)</span>
      )
    },
    {
      name: 'Invite Button',
      requiredPermission: 'invite',
      component: (
        <PermissionGate projectId={projectId} userId={userId} requiredPermission="invite">
          <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm">Invite</button>
        </PermissionGate>
      )
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div 
        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Role & Permission Tester</h3>
            {process.env.NODE_ENV === 'development' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">DEV ONLY</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <RoleBadge projectId={projectId} userId={userId} showAllRoles />
            <button className="text-gray-500 hover:text-gray-700">
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Role Information */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Your Roles & Permissions</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Primary Role:</span>
                  <p className="font-medium">{userRole || 'No role assigned'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">All Roles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allRoles.length > 0 ? allRoles.map(role => (
                      <span key={role} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {role}
                      </span>
                    )) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {permissions.map(permission => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    {permission.hasPermission ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <permission.icon className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm ${permission.hasPermission ? 'text-green-700' : 'text-red-700'}`}>
                      {permission.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Gate Tests */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Component Visibility Tests</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {testComponents.map(test => (
                  <div key={test.name} className="space-y-2">
                    <div className="text-sm text-gray-600">{test.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      Requires: {test.requiredPermission}
                    </div>
                    <div className="min-h-[32px] flex items-center">
                      {test.component}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Testing */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Manual Permission Checks</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">canWrite:</span>
                  <span className={userPermissions.canWrite ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {userPermissions.canWrite ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">canInvite:</span>
                  <span className={userPermissions.canInvite ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {userPermissions.canInvite ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">canComment:</span>
                  <span className={userPermissions.canComment ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {userPermissions.canComment ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">isOwner:</span>
                  <span className={userPermissions.isOwner ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {userPermissions.isOwner ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">canRead:</span>
                  <span className={userPermissions.canRead ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {userPermissions.canRead ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">roles.length:</span>
                  <span className="text-blue-600 font-medium">{allRoles.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">How to Use This Tester</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your current roles and permissions above</li>
              <li>• Test buttons should appear/disappear based on your permissions</li>
              <li>• Manual checks show the raw boolean values from permission hooks</li>
              <li>• Add/remove roles via collaboration settings to test different scenarios</li>
              <li>• This component only appears in development mode</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
