'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
}

export default function AppHeader({ user }: AppHeaderProps) {
  const [notifications, setNotifications] = useState(3) // Mock notification count
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        console.log('🔍 Header: No user available')
        return
      }

      console.log('🔍 Header: Fetching user profile for:', user.id)
      console.log('🔍 Header: User object:', user)
      
      const supabase = createSupabaseClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', user.id)
        .single()

      console.log('📋 Header: Profile data:', profile)
      console.log('❌ Header: Profile error:', error)

      if (profile) {
        console.log('✅ Header: Setting user profile:', profile)
        setUserProfile(profile)
      } else {
        console.log('❌ Header: No profile found!')
      }
    }

    fetchUserProfile()
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
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const normalizedRole = role?.toLowerCase()
    switch (normalizedRole) {
      case 'writer':
        return 'bg-orange-500 text-black font-bold'
      case 'reader':
        return 'bg-purple-500/30 text-purple-200 border-purple-400'
      default:
        return 'bg-gray-500/30 text-gray-200 border-gray-400'
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-black border-b border-gray-800 fixed top-0 left-0 right-0 z-[9999] shadow-lg">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">SF</span>
        </div>
        <h1 className="text-xl font-semibold text-white">StoryFoundry</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-orange-400 hover:text-orange-300 hover:bg-gray-900">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 text-white hover:bg-gray-900 px-3 py-2">
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-sm font-medium text-white">{userProfile?.display_name || user.email}</div>
                    {userProfile && (
                      <Badge 
                        className={`text-xs px-2 py-0.5 h-5 font-bold rounded-md ${getRoleBadgeColor(userProfile.role)} border-0`}
                      >
                        <span className="uppercase tracking-wide text-[10px]">{userProfile.role}</span>
                      </Badge>
                    )}
                  </div>
                  <Avatar className="w-8 h-8">
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black border-gray-800 shadow-xl">
                <DropdownMenuLabel className="text-white px-4 py-3">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium">My Account</span>
                    {userProfile && (
                      <Badge 
                        className={`text-xs w-fit font-bold px-3 py-1 h-6 rounded-md ${getRoleBadgeColor(userProfile.role)} border-0`}
                      >
                        <span className="flex items-center space-x-1">
                          <span className="uppercase tracking-wide">{userProfile.role}</span>
                        </span>
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-900 cursor-pointer px-4 py-2.5">
                  <UserIcon className="w-4 h-4 mr-3" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-900 cursor-pointer px-4 py-2.5">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                {userProfile?.role === 'reader' && (
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-900 cursor-pointer px-4 py-2.5">
                    <Pen className="w-4 h-4 mr-3 text-orange-400" />
                    Upgrade to Writer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem 
                  className="text-gray-300 hover:text-white hover:bg-gray-900 cursor-pointer px-4 py-2.5"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          /* Guest actions */
          <div className="flex items-center space-x-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-900" onClick={() => window.location.href = '/signin'}>
              Sign In
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-black font-medium" onClick={() => window.location.href = '/signup'}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
