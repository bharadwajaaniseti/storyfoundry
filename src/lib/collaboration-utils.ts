import { Database } from './database.types'

export type CollaborationRole = 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'

export type CollaborationInvitation = Database['public']['Tables']['collaboration_invitations']['Row'] & {
  secondary_roles?: CollaborationRole[]
  projects?: {
    id: string
    title: string
    format: string
    genre?: string
    profiles?: {
      display_name: string
      avatar_url?: string
      verified_pro: boolean
    }
  }
  inviter?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
  }
  invitee?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
  }
  profiles?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
    bio?: string
  }
}

export type ProjectCollaborator = Database['public']['Tables']['project_collaborators']['Row'] & {
  secondary_roles?: CollaborationRole[]
  all_roles?: CollaborationRole[]
  computed_permissions?: CollaborationPermissions
  profiles?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
    bio?: string
  }
}

export type CollaborationMessage = Database['public']['Tables']['collaboration_messages']['Row'] & {
  sender?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
  }
  replies?: CollaborationMessage[]
}

export type ProjectActivity = Database['public']['Tables']['project_activity']['Row'] & {
  user?: {
    id: string
    display_name: string
    avatar_url?: string
    verified_pro: boolean
  }
}

export interface CollaborationPermissions {
  read: boolean
  write: boolean
  comment: boolean
  invite: boolean
}

export const DEFAULT_ROLE_PERMISSIONS: Record<CollaborationRole, CollaborationPermissions> = {
  coauthor: {
    read: true,
    write: true,
    comment: true,
    invite: false
  },
  editor: {
    read: true,
    write: true,
    comment: true,
    invite: false
  },
  translator: {
    read: true,
    write: true,
    comment: true,
    invite: false
  },
  producer: {
    read: true,
    write: false,
    comment: true,
    invite: true
  },
  reviewer: {
    read: true,
    write: false,
    comment: true,
    invite: false
  }
}

// Merge permissions from multiple roles (OR logic)
export function mergeRolePermissions(roles: CollaborationRole[]): CollaborationPermissions {
  const initialPermissions: CollaborationPermissions = {
    read: false,
    write: false,
    comment: false,
    invite: false
  }

  return roles.reduce((merged, role) => {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role]
    return {
      read: merged.read || rolePermissions.read,
      write: merged.write || rolePermissions.write,
      comment: merged.comment || rolePermissions.comment,
      invite: merged.invite || rolePermissions.invite
    }
  }, initialPermissions)
}

// Get all roles for a collaborator (primary + secondary)
export function getAllRoles(collaborator: ProjectCollaborator): CollaborationRole[] {
  const roles: CollaborationRole[] = [collaborator.role as CollaborationRole]
  if (collaborator.secondary_roles) {
    roles.push(...(collaborator.secondary_roles as CollaborationRole[]))
  }
  return [...new Set(roles)] // Remove duplicates
}

// Check if collaborator has a specific role
export function hasRole(collaborator: ProjectCollaborator, role: CollaborationRole): boolean {
  const allRoles = getAllRoles(collaborator)
  return allRoles.includes(role)
}

// Get effective permissions for a collaborator considering all their roles
export function getCollaboratorPermissions(collaborator: ProjectCollaborator): CollaborationPermissions {
  // Use computed permissions if available, otherwise calculate from roles
  if (collaborator.computed_permissions) {
    return collaborator.computed_permissions as CollaborationPermissions
  }
  
  // Use custom permissions if set, otherwise merge role permissions
  if (collaborator.permissions && typeof collaborator.permissions === 'object') {
    try {
      return collaborator.permissions as unknown as CollaborationPermissions
    } catch {
      // Fall through to role-based calculation
    }
  }
  
  const allRoles = getAllRoles(collaborator)
  return mergeRolePermissions(allRoles)
}

export const ROLE_DESCRIPTIONS: Record<CollaborationRole, string> = {
  coauthor: 'Co-write and develop the story together',
  editor: 'Review, edit, and refine the content',
  translator: 'Translate content to other languages',
  producer: 'Manage project development and coordination',
  reviewer: 'Provide feedback and suggestions'
}

export const ROLE_COLORS: Record<CollaborationRole, string> = {
  coauthor: 'bg-blue-100 text-blue-800',
  editor: 'bg-green-100 text-green-800',
  translator: 'bg-purple-100 text-purple-800',
  producer: 'bg-orange-100 text-orange-800',
  reviewer: 'bg-gray-100 text-gray-800'
}

export function formatActivityDescription(activity: ProjectActivity): string {
  const user = activity.user?.display_name || 'Someone'
  
  switch (activity.activity_type) {
    case 'project_created':
      return `${user} created the project`
    case 'project_updated':
      return `${user} updated the project`
    case 'collaborator_added':
      return activity.description || `${user} added a collaborator`
    case 'collaborator_removed':
      return activity.description || `${user} removed a collaborator`
    case 'chapter_created':
      return `${user} created a new chapter`
    case 'chapter_updated':
      return `${user} updated a chapter`
    case 'chapter_deleted':
      return `${user} deleted a chapter`
    case 'comment_added':
      return `${user} added a comment`
    case 'message_sent':
      return activity.description || `${user} sent a message`
    case 'file_uploaded':
      return `${user} uploaded a file`
    case 'permission_changed':
      return activity.description || `${user} changed permissions`
    default:
      return activity.description || `${user} performed an action`
  }
}

export function getRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return past.toLocaleDateString()
  }
}

export function calculateTotalRoyaltySplit(collaborators: ProjectCollaborator[]): number {
  return collaborators.reduce((total, collab) => {
    return total + (collab.royalty_split || 0)
  }, 0)
}

export function validateRoyaltySplit(
  collaborators: ProjectCollaborator[],
  newSplit: number,
  excludeId?: string
): boolean {
  const filteredCollaborators = excludeId 
    ? collaborators.filter(c => c.id !== excludeId)
    : collaborators
  
  const currentTotal = calculateTotalRoyaltySplit(filteredCollaborators)
  return (currentTotal + newSplit) <= 100
}

export function canUserPerformAction(
  collaborator: ProjectCollaborator | null,
  action: keyof CollaborationPermissions,
  isOwner: boolean = false
): boolean {
  if (isOwner) return true
  if (!collaborator || collaborator.status !== 'active') return false
  
  const permissions = collaborator.permissions as unknown as CollaborationPermissions
  return permissions?.[action] || false
}

export function getInvitationStatus(invitation: CollaborationInvitation): {
  status: string
  color: string
  isExpired: boolean
} {
  const now = new Date()
  const expiresAt = invitation.expires_at ? new Date(invitation.expires_at) : null
  const isExpired = expiresAt ? now > expiresAt : false

  if (isExpired && invitation.status === 'pending') {
    return { status: 'Expired', color: 'text-red-600', isExpired: true }
  }

  switch (invitation.status) {
    case 'pending':
      return { status: 'Pending', color: 'text-yellow-600', isExpired: false }
    case 'accepted':
      return { status: 'Accepted', color: 'text-green-600', isExpired: false }
    case 'declined':
      return { status: 'Declined', color: 'text-red-600', isExpired: false }
    case 'cancelled':
      return { status: 'Cancelled', color: 'text-gray-600', isExpired: false }
    default:
      return { status: 'Unknown', color: 'text-gray-600', isExpired: false }
  }
}
