'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ToastProvider } from '@/components/ui/toast'
import AppHeader from '@/components/app-header'
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
  MessageSquare
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

const NAVIGATION_ITEMS = [
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
    name: 'Messages',
    href: '/app/messages',
    icon: MessageSquare
  },
  {
    name: 'Pitch Rooms',
    href: '/app/pitch-rooms',
    icon: Calendar
  },
  {
    name: 'Collaborations',
    href: '/app/collaborations',
    icon: Users
  }
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/signin')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/signin')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <AppHeader user={user} />
        
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen sticky top-16">
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-4">
              Quick Actions
            </div>
            <Link
              href="/app/projects/new"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </Link>
          </div>
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.user_metadata?.first_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="/app/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === '/app/settings'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}
