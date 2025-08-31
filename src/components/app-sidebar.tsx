'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createSupabaseClient } from '@/lib/auth'
import { 
  Home, 
  FolderOpen, 
  Search, 
  Users, 
  MessageSquare, 
  Settings,
  Plus,
  Compass,
  BookMarked,
  Heart,
  UserPlus
} from 'lucide-react'

const readerNavigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'My Library', href: '/app/library', icon: BookMarked },
  { name: 'Discover', href: '/app/search', icon: Compass },
  { name: 'Pitch Rooms', href: '/app/pitch-rooms', icon: MessageSquare },
]

const writerNavigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'Projects', href: '/app/projects', icon: FolderOpen },
  { name: 'Discover', href: '/app/search', icon: Compass },
  { name: 'Collaboration', href: '/app/collab', icon: Users },
  { name: 'My Library', href: '/app/writer/library', icon: BookMarked },
  { name: 'Following', href: '/app/writer/following', icon: UserPlus },
  { name: 'Favourites', href: '/app/writer/favourites', icon: Heart },
  { name: 'Pitch Rooms', href: '/app/pitch-rooms', icon: MessageSquare },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUserRole() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          console.log('User profile data:', profile) // Debug log
          const role = profile?.role?.toLowerCase() || 'reader'
          console.log('Detected role:', role) // Debug log
          setUserRole(role)
        }
      } catch (error) {
        console.error('Error loading user role:', error)
        setUserRole('reader') // Default to reader
      } finally {
        setIsLoading(false)
      }
    }

    loadUserRole()
  }, [])

  // Choose navigation based on role
  // Temporarily force writer navigation for testing
  const navigation = writerNavigation  // Force writer nav for now
  
  console.log('Current userRole:', userRole) // Debug log
  console.log('Using navigation:', 'writer (forced)') // Debug log
  console.log('Navigation array:', navigation) // Debug log

  if (isLoading) {
    return (
      <div className="flex flex-col w-64 bg-navy-900/80 backdrop-blur-sm border-r border-navy-700/50">
        <div className="flex items-center justify-center h-16 border-b border-navy-700/50">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-64 bg-navy-900/80 backdrop-blur-sm border-r border-navy-700/50">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-navy-700/50">
        <Link href="/app/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
            <span className="text-navy-900 font-bold text-sm">SF</span>
          </div>
          <span className="text-lg font-bold text-white">StoryFoundry</span>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-b border-navy-700/50">
        <Button 
          asChild
          size="sm" 
          className="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700"
        >
          <Link href={userRole === 'writer' ? '/app/projects/new' : '/app/search'}>
            <Plus className="w-4 h-4 mr-2" />
            {userRole === 'writer' ? 'New Project' : 'Discover Stories'}
          </Link>
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold-400/10 text-gold-400'
                  : 'text-gray-300 hover:text-white hover:bg-navy-800/50'
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-4 py-4 border-t border-navy-700/50">
        {secondaryNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold-400/10 text-gold-400'
                  : 'text-gray-300 hover:text-white hover:bg-navy-800/50'
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
