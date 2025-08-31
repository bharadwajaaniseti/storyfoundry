'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'

export const useProfileModal = () => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('reader')

  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setCurrentUserRole(profile?.role || 'reader')
        }
      } catch (error) {
        console.error('Error getting user role:', error)
      }
    }
    
    getCurrentUserRole()
  }, [])

  const openProfileModal = (profileId: string) => {
    if (profileId) {
      setSelectedProfileId(profileId)
    }
  }

  const closeProfileModal = () => {
    setSelectedProfileId(null)
  }

  return {
    selectedProfileId,
    currentUserRole,
    openProfileModal,
    closeProfileModal,
    isProfileModalOpen: !!selectedProfileId
  }
}
