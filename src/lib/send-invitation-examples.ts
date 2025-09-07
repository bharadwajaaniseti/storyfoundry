// Example: Sending a collaboration invitation via API

import { createSupabaseClient } from '@/lib/auth-client'

export async function sendCollaborationInvitation({
  projectId,
  inviteeId,
  role,
  royaltySplit,
  message
}: {
  projectId: string
  inviteeId: string
  role: 'coauthor' | 'editor' | 'translator' | 'producer' | 'reviewer'
  royaltySplit?: number
  message?: string
}) {
  const supabase = createSupabaseClient()
  
  try {
    // Method 1: Using the database function
    const { data, error } = await supabase.rpc('invite_collaborator', {
      p_project_id: projectId,
      p_invitee_id: inviteeId,
      p_role: role,
      p_royalty_split: royaltySplit,
      p_message: message
    })
    
    if (error) throw error
    return { success: true, invitationId: data }
    
  } catch (error) {
    console.error('Failed to send invitation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Alternative Method 2: Using the API route
export async function sendInvitationViaAPI({
  projectId,
  inviteeId,
  role,
  royaltySplit,
  message
}: {
  projectId: string
  inviteeId: string
  role: string
  royaltySplit?: number
  message?: string
}) {
  try {
    const response = await fetch('/api/collaborations/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: projectId,
        invitee_id: inviteeId,
        role,
        royalty_split: royaltySplit,
        message
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to send invitation')
    }
    
    const data = await response.json()
    return { success: true, data }
    
  } catch (error) {
    console.error('Failed to send invitation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// Example usage:
const result = await sendCollaborationInvitation({
  projectId: 'project-uuid',
  inviteeId: 'user-uuid',
  role: 'editor',
  royaltySplit: 20,
  message: 'Would love to have you help edit this novel!'
})

if (result.success) {
  console.log('Invitation sent successfully!')
} else {
  console.error('Failed to send invitation:', result.error)
}
