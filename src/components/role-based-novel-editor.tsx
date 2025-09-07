// Example implementation for role-based novel editor
'use client'

import React, { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'
import { PermissionGate, RoleBadge } from '@/components/permission-gate'
import { Button } from '@/components/ui/button'
import { Edit3, MessageSquare, UserPlus, Settings, Save, Eye } from 'lucide-react'

interface RoleBasedNovelEditorProps {
  projectId: string
  content: string
  onContentChange: (content: string) => void
  onSave: () => void
  isLoading: boolean
}

export function RoleBasedNovelEditor({
  projectId,
  content,
  onContentChange,
  onSave,
  isLoading
}: RoleBasedNovelEditorProps) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with role indicator and permissions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Novel Editor</h1>
          <RoleBadge projectId={projectId} userId={user?.id} />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Save Button - Only for users with write permission */}
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            requiredPermission="write"
          >
            <Button onClick={onSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </PermissionGate>

          {/* Settings - Owner only */}
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            ownerOnly
          >
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </PermissionGate>

          {/* Invite Collaborators - Users with invite permission */}
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            requiredPermission="invite"
          >
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content Editor */}
        <div className="lg:col-span-3">
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            requiredPermission="write"
            fallback={
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">Read-Only View</span>
                </div>
                <div className="prose max-w-none text-gray-700">
                  {content || 'No content yet...'}
                </div>
              </div>
            }
            showFallback
          >
            <div className="border rounded-lg">
              <div className="border-b p-3 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Content Editor</span>
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-96 p-4 border-0 resize-none focus:ring-0 focus:outline-none"
                placeholder="Start writing your story..."
              />
            </div>
          </PermissionGate>
        </div>

        {/* Sidebar with role-specific features */}
        <div className="space-y-4">
          {/* Comments Section - Users with comment permission */}
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            requiredPermission="comment"
          >
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Comments</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">No comments yet</p>
                <Button size="sm" variant="outline" className="w-full">
                  Add Comment
                </Button>
              </div>
            </div>
          </PermissionGate>

          {/* Producer Dashboard - Producer role only */}
          <PermissionGate 
            projectId={projectId} 
            userId={user?.id} 
            requiredPermission="invite"
          >
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="font-medium mb-2">Producer Dashboard</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline:</span>
                  <span className="text-orange-600">2 weeks</span>
                </div>
                <Button size="sm" className="w-full mt-2">
                  Manage Timeline
                </Button>
              </div>
            </div>
          </PermissionGate>

          {/* Translation Tools - Translator role */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <h3 className="font-medium mb-2">Translation Tools</h3>
            <p className="text-sm text-gray-600 mb-2">Available for translators</p>
            <select className="w-full text-sm border rounded p-2">
              <option>Select Language</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleBasedNovelEditor
