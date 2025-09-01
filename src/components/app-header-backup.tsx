'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Settings, LogOut, User as UserIcon, Pen, BookOpen } from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface AppHeaderProps {
  user?: User | null
}

interface UserProfile {
  id: string
  role: 'reader' | 'writer'
  display_name: string
  avatar_url?: string | null
  first_name?: string | null
  last_name?: string | null
}

export default function AppHeader({ user }: AppHeaderProps) {
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    const fetchUserProfile = async () => {
      console.log('🔍 Header: fetchUserProfile called at', new Date().toISOString(), 'user ID:', user?.id)
      if (!user) {
        console.log('❌ Header: No user, returning')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, avatar_url, role')
        .eq('id', user.id)
        .single()

      console.log('🗃️ Header: Profile data received at', new Date().toISOString(), ':', profile)
      
      if (profile) {
        setUserProfile(profile)
        console.log('✅ Header: Profile set successfully:', profile)
      } else {
        console.log('❌ Header: No profile found!')
      }
    }

    fetchUserProfile()
    
    // Make fetch function globally available for other components to call
    ;(window as any).refreshHeaderProfile = fetchUserProfile
    
    // Listen for custom events to refresh profile
    const handleProfileUpdate = () => {
      console.log('📢 RECEIVED profileUpdated event in header!')
      fetchUserProfile()
    }
    
    // Add multiple event listeners to catch different scenarios
    console.log('🎧 SETTING UP event listeners in header')
    window.addEventListener('profileUpdated', handleProfileUpdate)
    document.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'avatar_updated') {
        console.log('📢 RECEIVED storage event in header!')
        fetchUserProfile()
      }
    })

    return () => {
      console.log('🧹 CLEANING UP event listeners in header')
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      document.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('storage', handleProfileUpdate)
    }
  }, [user?.id])

  const handleSignOut = async () => {
    // This will be handled by the auth system
    window.location.href = '/auth/signout'
  }

  const getRoleIcon = (role: string) => {
    const normalizedRole = role?.toLowerCase()
    switch (normalizedRole) {
      case 'writer':
        return <Pen className="w-3 h-3 text-orange-400" />
      case 'reader':
        return <BookOpen className="w-3 h-3 text-purple-400" />
      default:
        return <UserIcon className="w-3 h-3 text-gray-400" />
    }
  }

  const getUserDisplayName = () => {
    if (!userProfile) return 'Loading...'
    
    if (userProfile.display_name) {
      return userProfile.display_name
    }
    
    const firstName = userProfile.first_name || ''
    const lastName = userProfile.last_name || ''
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User'
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800">StoryFoundry</h1>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Temporary debug button */}
            <button 
              onClick={() => {
                console.log('🔄 Manual refresh clicked')
                const fetchUserProfile = async () => {
                  console.log('🔍 Manual: Fetching user profile for:', user.id)
                  const supabase = createSupabaseClient()
                  const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('id, role, display_name, avatar_url, first_name, last_name')
                    .eq('id', user.id)
                    .single()

                  console.log('📋 Manual: Profile data:', profile)
                  console.log('❌ Manual: Profile error:', error)
                  
                  if (profile) {
                    setUserProfile(profile)
                    console.log('✅ Manual: Profile updated!')
                  }
                }
                fetchUserProfile()
              }}
              className="px-2 py-1 text-xs bg-gray-200 rounded"
            >
              Refresh
            </button>

            {/* Notification Icon */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <UserAvatar 
                    user={{
                      first_name: userProfile?.first_name,
                      last_name: userProfile?.last_name,
                      display_name: userProfile?.display_name,
                      avatar_url: userProfile?.avatar_url
                    }}
                    size="sm"
                  />
                  <div className="flex flex-col items-start">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                      {userProfile?.role && getRoleIcon(userProfile.role)}
                    </div>
                    {userProfile?.role && (
                      <span className="text-xs text-gray-500 capitalize">{userProfile.role}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/app/settings'}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => window.location.href = '/signin'}>
              Sign In
            </Button>
            <Button onClick={() => window.location.href = '/signup'}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
