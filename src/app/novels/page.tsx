'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NovelsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to search page with novel filter
    router.replace('/app/search')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to search...</p>
      </div>
    </div>
  )
}
