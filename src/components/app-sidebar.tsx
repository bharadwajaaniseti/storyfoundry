'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Home, 
  FolderOpen, 
  Search, 
  Users, 
  MessageSquare, 
  Settings,
  Plus,
  Compass,
  BookMarked
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'My Library', href: '/app/library', icon: BookMarked },
  { name: 'Projects', href: '/app/projects', icon: FolderOpen },
  { name: 'Discover', href: '/app/search', icon: Compass },
  { name: 'Collaboration', href: '/app/collab', icon: Users },
  { name: 'Pitch Rooms', href: '/app/pitch-rooms', icon: MessageSquare },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()

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
          <Link href="/app/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
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
