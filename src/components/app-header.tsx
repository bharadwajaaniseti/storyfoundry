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
import NotificationBell from '@/components/notification-bell'

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    const fetchUserProfile = async () => {
      if (!user) {
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, avatar_url, role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserProfile(profile)
      }
    }

    fetchUserProfile()
    
    // Make fetch function globally available for other components to call
    ;(window as any).refreshHeaderProfile = fetchUserProfile
    
    // Test that we can dispatch events to ourselves
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('profileUpdated'))
    }, 1000)
    
    // Listen for custom events to refresh profile
    const handleProfileUpdate = () => {
      fetchUserProfile()
    }
    
    // Add multiple event listeners to catch different scenarios
    window.addEventListener('profileUpdated', handleProfileUpdate)
    document.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'avatar_updated') {
        fetchUserProfile()
      }
    })

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      document.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('storage', handleProfileUpdate)
    }
  }, [user?.id])

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    const normalizedRole = role?.toLowerCase()
    switch (normalizedRole) {
      case 'writer':
        return <Pen className="w-3 h-3 text-yellow-400" />
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
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-400 shadow-sm'
      case 'reader':
        return 'bg-purple-500/20 text-purple-600 border-purple-400 shadow-sm'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-400'
    }
  }

  const getUserDisplayName = () => {
    if (!userProfile) return user?.email?.split('@')[0] || 'User'
    
    if (userProfile.display_name) {
      return userProfile.display_name
    }
    
    const firstName = userProfile.first_name || ''
    const lastName = userProfile.last_name || ''
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.email?.split('@')[0] || 'User'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <a href="/app/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <span className="text-xl font-bold text-gray-800">StoryFoundry</span>
            </a>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <a 
                href="/novels" 
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Novels</span>
              </a>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <UserAvatar 
                      user={{
                        first_name: userProfile?.first_name,
                        last_name: userProfile?.last_name,
                        display_name: userProfile?.display_name,
                        avatar_url: userProfile?.avatar_url
                      }}
                      size="sm"
                    />
                    <div className="hidden sm:flex flex-col items-start space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        {getUserDisplayName()}
                      </span>
                      {userProfile?.role && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0.5 h-5 font-bold border ${getRoleBadgeColor(userProfile.role)}`}
                        >
                          <span className="flex items-center space-x-1">
                            {getRoleIcon(userProfile.role)}
                            <span className="uppercase tracking-wide">{userProfile.role}</span>
                          </span>
                        </Badge>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <a
                        href="/app/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
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
      </div>
    </header>
  )
}
