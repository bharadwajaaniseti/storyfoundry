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
import { Bell, Settings, LogOut, User as UserIcon, Crown, BookOpen } from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface AppHeaderProps {
  user: User
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
      console.log('🔍 Header: Fetching user profile for:', user.id)
      
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
  }, [user.id])

  const handleSignOut = async () => {
    // This will be handled by the auth system
    window.location.href = '/auth/signout'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'writer':
        return <Crown className="w-3 h-3 text-gold-400" />
      case 'reader':
        return <BookOpen className="w-3 h-3 text-purple-400" />
      default:
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'writer':
        return 'bg-gold-400/20 text-gold-300 border-gold-400/30'
      case 'reader':
        return 'bg-purple-400/20 text-purple-300 border-purple-400/30'
      default:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50 bg-navy-900/50 backdrop-blur-sm">
      {/* Search or Page Title */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative text-gray-300 hover:text-white">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-400 text-navy-900 text-xs font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 text-gray-300 hover:text-white">
              <Avatar className="w-8 h-8">
                <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-navy-900" />
                </div>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{userProfile?.display_name || user.email}</div>
                {userProfile && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0 h-4 ${getRoleBadgeColor(userProfile.role)}`}
                  >
                    <span className="flex items-center space-x-1">
                      {getRoleIcon(userProfile.role)}
                      <span className="capitalize">{userProfile.role}</span>
                    </span>
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-navy-800 border-navy-700">
            <DropdownMenuLabel className="text-white">
              <div className="flex flex-col space-y-1">
                <span>My Account</span>
                {userProfile && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs w-fit ${getRoleBadgeColor(userProfile.role)}`}
                  >
                    <span className="flex items-center space-x-1">
                      {getRoleIcon(userProfile.role)}
                      <span className="capitalize">{userProfile.role}</span>
                    </span>
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-navy-700" />
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-navy-700 cursor-pointer">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-navy-700 cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {userProfile?.role === 'reader' && (
              <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-navy-700 cursor-pointer">
                <Crown className="w-4 h-4 mr-2 text-gold-400" />
                Upgrade to Writer
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-navy-700" />
            <DropdownMenuItem 
              className="text-gray-300 hover:text-white hover:bg-navy-700 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
