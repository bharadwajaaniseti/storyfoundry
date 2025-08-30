"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'

interface UserProfile {
  id: string
  role: 'reader' | 'writer' | 'READER' | 'WRITER'
  display_name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [hydrated, setHydrated] = useState(false)
  
  // Handle hydration
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  useEffect(() => {
    if (!hydrated) return
    
    const supabase = createSupabaseClient()
    
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/signin')
          return
        }

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, display_name')
          .eq('id', user.id)
          .single()

        console.log('🎯 Dashboard Router: Profile data:', profile)

        if (profile) {
          setUserProfile(profile)
          console.log('🎯 Dashboard Router: User role is', profile.role)
          
          // Redirect to appropriate dashboard
          const userRole = profile.role?.toLowerCase()
          console.log('🔍 Dashboard Router: Normalized role:', userRole)
          
          if (userRole === 'reader') {
            console.log('🔴 Redirecting to reader dashboard')
            // Try multiple redirect methods
            router.push('/app/dashboard/reader')
            // Backup redirect
            setTimeout(() => {
              window.location.href = '/app/dashboard/reader'
            }, 1000)
          } else {
            console.log('🔵 Redirecting to writer dashboard')  
            router.push('/app/dashboard/writer')
            // Backup redirect
            setTimeout(() => {
              window.location.href = '/app/dashboard/writer'
            }, 1000)
          }
        } else {
          console.log('❌ No profile found')
        }
      } catch (error) {
        console.error('❌ Dashboard Router Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router, hydrated])

  // Show nothing during hydration to prevent mismatch
  if (!hydrated) {
    return null
  }

  // Show loading state while fetching profile and redirecting
  return (
    <div className="space-y-6">
      <div style={{backgroundColor: 'orange', color: 'white', padding: '20px', textAlign: 'center', fontSize: '24px'}}>
        🟠 MAIN DASHBOARD ROUTER - REDIRECTING...
      </div>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-4">Loading your dashboard...</h2>
          <p className="text-gray-300 mb-4">
            Detecting your role and redirecting to your personalized dashboard.
          </p>
          <div className="text-sm text-gray-500">
            Role: {userProfile?.role || 'Detecting...'}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Should redirect to: {userProfile?.role?.toLowerCase() === 'reader' ? '/app/dashboard/reader' : '/app/dashboard/writer'}
          </div>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => window.location.href = '/app/dashboard/reader'}
              className="block w-full bg-red-500 text-white p-2 rounded"
            >
              🔴 Manual: Go to Reader Dashboard
            </button>
            <button 
              onClick={() => window.location.href = '/app/dashboard/writer'}
              className="block w-full bg-blue-500 text-white p-2 rounded"
            >
              🔵 Manual: Go to Writer Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}