'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Users,
  Shield,
  Clock,
  TrendingUp,
  MoreHorizontal,
  FileText,
  Calendar,
  Settings
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface Project {
  id: string
  title: string
  logline: string
  format: string
  genre: string | null
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFormat, setFilterFormat] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('updated_at')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.logline.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFormat = filterFormat === 'all' || project.format === filterFormat
    const matchesVisibility = filterVisibility === 'all' || project.visibility === filterVisibility
    
    return matchesSearch && matchesFormat && matchesVisibility
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'buzz_score':
        return b.buzz_score - a.buzz_score
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="w-4 h-4 text-green-500" />
      case 'preview': return <Users className="w-4 h-4 text-orange-500" />
      case 'private': return <Shield className="w-4 h-4 text-gray-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Projects</h1>
              <p className="text-gray-600">Manage and organize your creative work</p>
            </div>
            
            <Link
              href="/app/projects/new"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={filterFormat}
                  onChange={(e) => setFilterFormat(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Formats</option>
                  <option value="screenplay">Screenplay</option>
                  <option value="treatment">Treatment</option>
                  <option value="novel">Novel</option>
                  <option value="short-story">Short Story</option>
                  <option value="stage-play">Stage Play</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Visibility</option>
                  <option value="private">Private</option>
                  <option value="preview">Preview</option>
                  <option value="public">Public</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="created_at">Date Created</option>
                  <option value="title">Title</option>
                  <option value="buzz_score">Buzz Score</option>
                </select>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {projects.length === 0 ? (
              <>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Create your first project to get started with StoryFoundry</p>
                <Link
                  href="/app/projects/new"
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Project</span>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No projects match your filters</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterFormat('all')
                    setFilterVisibility('all')
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProjects.map((project) => {
              console.log('=== PROJECT MAP FUNCTION RUNNING ===')
              console.log('Project data:', project)
              
              // Enhanced novel detection logic
              const formatIsNovel = project.format === 'Novel' || project.format === 'novel'
              const titleHasNovel = project.title.toLowerCase().includes('novel')
              const titleHasChapter = project.title.toLowerCase().includes('chapter')
              const genreIsNovelLike = project.genre && (
                project.genre.includes('Sci-Fi') || 
                project.genre.includes('Fantasy') || 
                project.genre.includes('Romance') ||
                project.genre.includes('fantasy')
              )
              
              const isNovel = Boolean(formatIsNovel || titleHasNovel || titleHasChapter || genreIsNovelLike)
              
              // Debug log to see what's being detected
              console.log('Project:', project.title)
              console.log('  Format:', project.format, '-> formatIsNovel:', formatIsNovel)
              console.log('  Genre:', project.genre, '-> genreIsNovelLike:', genreIsNovelLike)
              console.log('  Title checks - hasNovel:', titleHasNovel, 'hasChapter:', titleHasChapter)
              console.log('  Final isNovel:', isNovel)
              console.log('---')
              
              const handleClick = () => {
                if (isNovel) {
                  console.log('NOVEL CLICKED:', project.title)
                  console.log('Navigating to:', `/novels/${project.id}`)
                  router.push(`/novels/${project.id}`)
                } else {
                  router.push(`/app/projects/${project.id}`)
                }
              }
              
              return (
                <div
                  key={project.id}
                  onClick={handleClick}
                  className={`group bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:border-orange-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] ${
                    viewMode === 'grid' ? 'p-6' : 'p-4'
                  }`}
                >
                {viewMode === 'grid' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="transform group-hover:scale-110 transition-transform duration-200">
                          {getVisibilityIcon(project.visibility)}
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors duration-200">
                          {project.format}
                        </span>
                        {project.genre && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full group-hover:bg-orange-200 transition-colors duration-200">
                            {project.genre}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/app/projects/${project.id}/settings`)
                        }}
                        className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200 transform hover:scale-110 hover:rotate-12"
                        title="Project Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                        {project.logline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                        <span>{formatDate(project.updated_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                        <span>{project.buzz_score}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-800 group-hover:text-orange-600 transition-colors duration-200">
                          {project.title}
                        </h3>
                        <div className="transform group-hover:scale-110 transition-transform duration-200">
                          {getVisibilityIcon(project.visibility)}
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors duration-200">
                          {project.format}
                        </span>
                        {project.genre && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full group-hover:bg-orange-200 transition-colors duration-200">
                            {project.genre}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors duration-200">
                        {project.logline}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                          <span>Updated {formatDate(project.updated_at)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 group-hover:text-orange-500 transition-colors duration-200" />
                          <span>{project.buzz_score} views</span>
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/app/projects/${project.id}/settings`)
                      }}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-110 hover:rotate-12 ml-4"
                      title="Project Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
