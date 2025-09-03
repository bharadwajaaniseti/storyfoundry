'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  title: string
  description: string
  format: string
  genre: string
}

export default function NovelPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectId = params.id as string
        if (!projectId) return
        
        // Try to fetch from API first
        try {
          const response = await fetch(`/api/projects/${projectId}`)
          if (response.ok) {
            const projectData = await response.json()
            setProject(projectData)
            console.log('Loaded project from API:', projectData)
            return
          }
        } catch (apiError) {
          console.log('API fetch failed, using mock data')
        }

        // Fallback to mock data
        const mockProjects: Record<string, Project> = {
          '6463f622-6e12-4cd2-a9c6-063ab25acf9f': {
            id: '6463f622-6e12-4cd2-a9c6-063ab25acf9f',
            title: 'Novel Test',
            description: 'This is the test novel that I am trying for first time',
            format: 'novel',
            genre: 'Sci-Fi'
          },
          '6f27a429-0f5b-468a-a865-83713fef733c': {
            id: '6f27a429-0f5b-468a-a865-83713fef733c',
            title: 'Chapter 2: Echos in the Smoke',
            description: 'A thrilling fantasy adventure',
            format: 'Novel',
            genre: 'Fantasy'
          }
        }

        const projectData = mockProjects[projectId]
        if (projectData) {
          setProject(projectData)
          console.log('Loaded project from mock data:', projectData)
        } else {
          console.log('Project not found in mock data, ID:', projectId)
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [params])

  const handleBack = () => {
    router.push('/app/projects')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading novel...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Novel not found</h2>
          <p className="text-gray-600 mb-4">The novel you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {project.title}
              </h1>
              <p className="text-sm text-gray-500">
                {project.genre} • {project.format}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Novel Editor
            </h2>
            <h3 className="text-xl text-gray-700 mb-6">
              {project.title}
            </h3>
            <p className="text-gray-600 mb-8">
              {project.description}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                This is your dedicated novel editing space
              </h4>
              <p className="text-gray-600">
                Here you can add all the novel-specific features like:
              </p>
              <ul className="text-left text-gray-600 mt-4 space-y-2 max-w-md mx-auto">
                <li>• Chapter management</li>
                <li>• Character development</li>
                <li>• World building tools</li>
                <li>• Plot outlines</li>
                <li>• Timeline tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
