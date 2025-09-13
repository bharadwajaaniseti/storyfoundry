'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/auth'
import { ProjectCollaborator, CollaborationPermissions, DEFAULT_ROLE_PERMISSIONS, canUserPerformAction, getCollaboratorPermissions, getAllRoles } from '@/lib/collaboration-utils'

interface UserProjectPermissions {
  isOwner: boolean
  isCollaborator: boolean
  collaborator: ProjectCollaborator | null
  permissions: CollaborationPermissions
  canRead: boolean
  canWrite: boolean
  canComment: boolean
  canInvite: boolean
  canManageCollaborators: boolean
  canEditProjectSettings: boolean
}

export function useProjectPermissions(projectId: string, userId?: string) {
  const [permissions, setPermissions] = useState<UserProjectPermissions>({
    isOwner: false,
    isCollaborator: false,
    collaborator: null,
    permissions: {
      read: false,
      write: false,
      comment: false,
      invite: false
    },
    canRead: false,
    canWrite: false,
    canComment: false,
    canInvite: false,
    canManageCollaborators: false,
    canEditProjectSettings: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPermissions() {
      if (!projectId || !userId) {
        setLoading(false)
        return
      }

      try {
        const supabase = createSupabaseClient()

        // Check if user is project owner
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id')
          .eq('id', projectId)
          .single()

        console.log('usePermissions debug:', { 
          projectId, 
          userId, 
          project, 
          projectOwnerId: project?.owner_id,
          isOwner: project?.owner_id === userId 
        })

        const isOwner = project?.owner_id === userId

        // Check if user is a collaborator
        let collaborator = null
        // TEMPORARY FIX: Skip collaborator check to prevent infinite loop
        // This will be re-enabled once RLS policies are fixed
        if (false && !isOwner) {
          try {
            const { data } = await supabase
              .from('project_collaborators')
              .select(`
                *,
                profiles!project_collaborators_user_id_fkey (
                  id,
                  display_name,
                  avatar_url,
                  verified_pro
                )
              `)
              .eq('project_id', projectId)
              .eq('user_id', userId)
              .eq('status', 'active')
              .single()
            
            collaborator = data
          } catch (error) {
            console.log('Collaboration table not available, user will have owner-only access:', error)
            // If collaboration check fails, user will only get owner permissions if they are the owner
          }
        }

        // Determine permissions
        let userPermissions: CollaborationPermissions = {
          read: false,
          write: false,
          comment: false,
          invite: false
        }

        if (isOwner) {
          // Owners have all permissions
          userPermissions = {
            read: true,
            write: true,
            comment: true,
            invite: true
          }
        } else if (collaborator) {
          // Get effective permissions considering all roles
          userPermissions = getCollaboratorPermissions(collaborator)
        }

        const finalPermissions = {
          isOwner,
          isCollaborator: !!collaborator,
          collaborator,
          permissions: userPermissions,
          canRead: isOwner || userPermissions.read,
          canWrite: isOwner || userPermissions.write,
          canComment: isOwner || userPermissions.comment,
          canInvite: isOwner || userPermissions.invite,
          canManageCollaborators: isOwner,
          canEditProjectSettings: isOwner
        }

        console.log('Setting permissions:', finalPermissions)
        setPermissions(finalPermissions)
      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    // Add debounce to prevent rapid calls
    const timeoutId = setTimeout(() => {
      checkPermissions()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [projectId, userId])

  return { permissions, loading, refetch: () => setLoading(true) }
}

// Hook for checking specific actions
export function useCanPerformAction(
  projectId: string,
  action: keyof CollaborationPermissions,
  userId?: string
) {
  const { permissions, loading } = useProjectPermissions(projectId, userId)
  
  return {
    canPerform: permissions.permissions[action] || permissions.isOwner,
    loading,
    permissions
  }
}

// Hook for role-specific UI elements
export function useRoleBasedUI(
  projectId: string,
  userId?: string
) {
  const { permissions, loading } = useProjectPermissions(projectId, userId)
  
  const showElement = (requiredPermission: keyof CollaborationPermissions) => {
    return permissions.permissions[requiredPermission] || permissions.isOwner
  }

  const showOwnerOnly = () => permissions.isOwner
  
  const getRoleColor = () => {
    if (permissions.isOwner) return 'bg-yellow-100 text-yellow-800'
    if (!permissions.collaborator) return 'bg-gray-100 text-gray-800'
    
    const roleColors = {
      coauthor: 'bg-blue-100 text-blue-800',
      editor: 'bg-green-100 text-green-800',
      translator: 'bg-purple-100 text-purple-800',
      producer: 'bg-orange-100 text-orange-800',
      reviewer: 'bg-gray-100 text-gray-800'
    }
    
    // For multiple roles, use primary role color
    return roleColors[permissions.collaborator.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleDisplayName = () => {
    if (permissions.isOwner) return 'Owner'
    if (!permissions.collaborator) return 'Viewer'
    
    const allRoles = getAllRoles(permissions.collaborator)
    if (allRoles.length === 1) {
      return allRoles[0]
    }
    
    // For multiple roles, show primary + count
    return `${permissions.collaborator.role} +${allRoles.length - 1}`
  }

  const getAllRoleNames = () => {
    if (permissions.isOwner) return ['Owner']
    if (!permissions.collaborator) return ['Viewer']
    
    return getAllRoles(permissions.collaborator)
  }

  const result = {
    permissions,
    loading,
    showElement,
    showOwnerOnly,
    getRoleColor,
    getRoleDisplayName,
    getAllRoleNames,
    userRole: permissions.isOwner ? 'owner' : permissions.collaborator?.role || null
  }

  console.log('useRoleBasedUI result:', { 
    isOwner: permissions.isOwner,
    userRole: result.userRole,
    allRoleNames: getAllRoleNames(),
    permissionsObject: permissions
  })

  return result
}
