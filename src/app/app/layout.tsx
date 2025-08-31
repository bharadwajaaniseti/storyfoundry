'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  FileText,
  Search,
  Settings,
  Users,
  Bell,
  User,
  LogOut,
  Plus,
  Calendar,
  Pen,
  BookOpen,
  Star
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

const WRITER_NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    icon: Home
  },
  {
    name: 'Projects',
    href: '/app/projects',
    icon: FileText
  },
  {
    name: 'Search',
    href: '/app/search',
    icon: Search
  },
  {
    name: 'Pitch Rooms',
    href: '/app/pitch-rooms',
    icon: Calendar
  },
  {
    name: 'Collaborations',
    href: '/app/collab',
    icon: Users
  }
]

const READER_NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    icon: Home
  },
  {
    name: 'Discover Stories',
    href: '/app/search',
    icon: Search
  },
  {
    name: 'My Library',
    href: '/app/library',
    icon: BookOpen
  },
  {
    name: 'Following',
    href: '/app/following',
    icon: Users
  },
  {
    name: 'Favorites',
    href: '/app/favorites',
    icon: Star
  }
]

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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/signin')
        return
      }
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUser({ ...user, profile })
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/app/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <span className="text-xl font-bold text-gray-800">StoryFoundry</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.profile?.display_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    {user?.profile?.role && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 h-5 font-bold border ${getRoleBadgeColor(user.profile.role)}`}
                      >
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(user.profile.role)}
                          <span className="uppercase tracking-wide">{user.profile.role}</span>
                        </span>
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      href="/app/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
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
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16">
          <div className="p-6">
            {/* Quick Actions - Different for Reader vs Writer */}
            <div className="mb-8">
              {user?.profile?.role?.toLowerCase() === 'reader' ? (
                <Link
                  href="/app/search"
                  className="flex items-center justify-center space-x-2 w-full bg-purple-500 text-white py-2.5 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  <Search className="w-4 h-4" />
                  <span>Discover Stories</span>
                </Link>
              ) : (
                <Link
                  href="/app/projects/new"
                  className="flex items-center justify-center space-x-2 w-full bg-green-500 text-white py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </Link>
              )}
            </div>

            {/* Navigation Links - Different for Reader vs Writer */}
            <ul className="space-y-2">
              {(user?.profile?.role?.toLowerCase() === 'reader' ? READER_NAVIGATION_ITEMS : WRITER_NAVIGATION_ITEMS).map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? user?.profile?.role?.toLowerCase() === 'reader'
                            ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-500'
                            : 'bg-orange-50 text-orange-600 border-r-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Settings at bottom */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                href="/app/settings"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  pathname === '/app/settings'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
