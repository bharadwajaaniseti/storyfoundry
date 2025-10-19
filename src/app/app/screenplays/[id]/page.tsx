'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/auth'
import { ArrowLeft, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  title: string
  logline: string
  synopsis?: string | null
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  owner_id: string
  created_at: string
  updated_at: string
}

export default function ScreenplayPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadScreenplayProject = async () => {
      try {
        const projectId = params.id as string
        if (!projectId) {
          setError('No project ID provided')
          setLoading(false)
          return
        }

        const supabase = createSupabaseClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Authentication error:', authError)
          router.push('/signin')
          return
        }

        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError || !projectData) {
          console.error('Error loading project:', projectError)
          setError('Project not found')
          setLoading(false)
          return
        }

        // Verify this is a screenplay project
        if (projectData.format !== 'screenplay' && projectData.format !== 'Screenplay') {
          console.log('Project is not a screenplay, redirecting...')
          router.push(`/app/projects/${projectId}`)
          return
        }

        // Check if user is owner or collaborator
        const isOwner = projectData.owner_id === user.id
        
        if (!isOwner) {
          // Check if user is a collaborator
          const { data: collaboratorData } = await supabase
            .from('project_collaborators')
            .select('*')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          if (!collaboratorData) {
            // Not owner and not collaborator - redirect to projects
            console.log('User does not have access to this screenplay')
            router.push('/app/projects')
            return
          }
        }

        setProject(projectData)
      } catch (error) {
        console.error('Error loading screenplay:', error)
        setError('Failed to load screenplay project')
      } finally {
        setLoading(false)
      }
    }

    loadScreenplayProject()
  }, [params, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screenplay...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Screenplay not found'}
          </h2>
          <p className="text-gray-600 mb-4">The screenplay you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/app/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  // Redirect to the novel-style editor route
  // We'll reuse the novel editor structure but for screenplays
  useEffect(() => {
    if (project) {
      router.push(`/screenplays/${project.id}`)
    }
  }, [project, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Film className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600">Opening screenplay editor...</p>
      </div>
    </div>
  )
}
