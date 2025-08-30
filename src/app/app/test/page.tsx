"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'

interface UserData {
  id: string
  email: string
  full_name?: string
  role?: 'reader' | 'writer'
  display_name?: string
}

export default function TestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createSupabaseClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(`Auth Error: ${authError.message}`)
          return
        }

        if (!user) {
          router.push('/signin')
          return
        }

        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Combine auth user data with profile data
        const combinedData: UserData = {
          id: user.id,
          email: user.email || 'No email',
          full_name: user.user_metadata?.full_name || 'No full name',
          role: profile?.role || 'No role',
          display_name: profile?.display_name || 'No display name'
        }

        setUserData(combinedData)
        
        if (profileError) {
          setError(`Profile Error: ${profileError.message}`)
        }

      } catch (err) {
        setError(`Unexpected Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔍 User Data Test Page
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {userData ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">User ID</h3>
                  <p className="text-blue-700 font-mono text-sm break-all">{userData.id}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Email</h3>
                  <p className="text-green-700">{userData.email}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Full Name (from Auth)</h3>
                  <p className="text-purple-700">{userData.full_name}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Display Name (from Profile)</h3>
                  <p className="text-orange-700">{userData.display_name}</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Role (from Profile)</h3>
                  <p className="text-red-700 text-lg font-bold">
                    {userData.role ? userData.role.toUpperCase() : 'NO ROLE FOUND'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Raw Data (JSON)</h3>
                <pre className="text-gray-700 text-xs overflow-auto bg-white p-3 rounded border">
{JSON.stringify(userData, null, 2)}
                </pre>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => router.push('/app/dashboard')}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>No user data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
