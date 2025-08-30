'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Settings, LogOut, User as UserIcon } from 'lucide-react'

interface AppHeaderProps {
  user: User
}

export default function AppHeader({ user }: AppHeaderProps) {
  const [notifications, setNotifications] = useState(3) // Mock notification count

  const handleSignOut = async () => {
    // This will be handled by the auth system
    window.location.href = '/auth/signout'
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
            <Button variant="ghost" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <Avatar className="w-8 h-8">
                <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-navy-900" />
                </div>
              </Avatar>
              <span className="hidden md:block">{user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-navy-800 border-navy-700">
            <DropdownMenuLabel className="text-white">
              My Account
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
