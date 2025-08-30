"use client"
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/auth'

export default function DebugRolePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    const fetchData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        setProfile(profile)
        console.log('🔍 Debug: User profile data', profile)
      }
      
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Role Information</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Profile Info:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Role Check:</h2>
        <p>Role: <strong>{profile?.role || 'No role found'}</strong></p>
        <p>Dashboard would show: <strong>{profile?.role === 'reader' ? 'ReaderDashboard' : 'WriterDashboard'}</strong></p>
      </div>
    </div>
  )
}
