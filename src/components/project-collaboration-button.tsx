'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import InviteCollaboratorModal from '@/components/invite-collaborator-modal'

interface ProjectCollaborationButtonProps {
  projectId: string
  projectTitle: string
  isOwner: boolean
  currentCollaborators?: any[]
  className?: string
  onInvitationSent?: () => void // Add callback to refresh parent data
}

export default function ProjectCollaborationButton({
  projectId,
  projectTitle,
  isOwner,
  currentCollaborators = [],
  className,
  onInvitationSent
}: ProjectCollaborationButtonProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (!isOwner) {
    return null // Only project owners can invite collaborators
  }

  return (
    <>
      <Button
        onClick={() => setShowInviteModal(true)}
        variant="outline"
        className={`flex items-center space-x-2 ${className || ''}`}
      >
        <Users className="w-4 h-4" />
        <span>Invite Collaborator</span>
      </Button>

      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={projectId}
        projectTitle={projectTitle}
        currentCollaborators={currentCollaborators}
        onInvitationSent={onInvitationSent}
      />
    </>
  )
}
