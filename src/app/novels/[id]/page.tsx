'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Users, Save, Settings, Eye, FileText, Map, Clock, Target, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NovelPageProps {
  params: Promise<{
    id: string
  }>
}

interface Project {
  id: string
  title: string
  description: string
  format: string
  genre: string
}

export default function NovelPage({ params }: NovelPageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const resolvedParams = await params
        
        // Try to fetch from API first
        try {
          const response = await fetch(`/api/projects/${resolvedParams.id}`)
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

        const projectData = mockProjects[resolvedParams.id]
        if (projectData) {
          setProject(projectData)
          console.log('Loaded project from mock data:', projectData)
        } else {
          console.log('Project not found in mock data, ID:', resolvedParams.id)
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
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your novel...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Novel not found</h2>
          <p className="text-gray-600 mb-6">The novel you're looking for doesn't exist.</p>
          <Button onClick={handleBack} className="bg-orange-500 hover:bg-orange-600 text-white">
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - matches StoryFoundry design */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {project.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {project.genre} • {project.format}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                <Users className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gradient mb-4">
            Novel Editor
          </h2>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            {project.title}
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {project.description}
          </p>
        </div>
        
        {/* Feature Grid - matches StoryFoundry card design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Chapter Management
            </h4>
            <p className="text-gray-600 text-sm">
              Organize and structure your novel chapters with intuitive drag-and-drop functionality.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Character Development
            </h4>
            <p className="text-gray-600 text-sm">
              Create detailed character profiles, track relationships, and develop compelling character arcs.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              World Building
            </h4>
            <p className="text-gray-600 text-sm">
              Build immersive worlds with detailed locations, cultures, histories, and magical systems.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Plot Outlines
            </h4>
            <p className="text-gray-600 text-sm">
              Structure your story with detailed plot outlines, story beats, and narrative arcs.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Timeline Tracking
            </h4>
            <p className="text-gray-600 text-sm">
              Keep track of your story's chronology, important events, and character development over time.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Writing Goals
            </h4>
            <p className="text-gray-600 text-sm">
              Set and track your daily writing goals, monitor progress, and stay motivated.
            </p>
          </div>
        </div>

        {/* Call to Action - matches StoryFoundry style */}
        <div className="text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-8 border border-orange-200">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to start writing?
              </h4>
              <p className="text-gray-700 mb-6 text-lg">
                This is your dedicated novel writing workspace, designed specifically for long-form storytelling.
              </p>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg font-semibold">
                Start Writing
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
