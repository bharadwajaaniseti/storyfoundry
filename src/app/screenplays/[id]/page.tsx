'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * Redirect page for screenplay projects
 * Redirects /screenplays/[id] to /screenplays/[id]/read for viewing
 */
export default function ScreenplayRedirect() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to the read (viewer) page
    router.replace(`/screenplays/${params.id}/read`)
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading screenplay...</p>
      </div>
    </div>
  )
}

// ORIGINAL FILE MOVED TO: /screenplays/[id]/edit/page.tsx
// This file now only redirects to the viewer at /screenplays/[id]/read/page.tsx
