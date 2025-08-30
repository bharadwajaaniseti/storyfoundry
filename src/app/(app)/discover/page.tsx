'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter,
  Grid,
  List,
  Eye,
  Users,
  Clock,
  TrendingUp,
  FileText,
  Star,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Project {
  id: string
  title: string
  logline: string
  synopsis: string
  format: string
  genre: string
  subgenre: string
  visibility: string
  buzz_score: number
  word_count: number
  created_at: string
  updated_at: string
  profiles: {
    id: string
    display_name: string
    avatar_url: string | null
    verified_pro: boolean
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const FORMATS = [
  { value: 'all', label: 'All Formats' },
  { value: 'screenplay', label: 'Screenplay' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'novel', label: 'Novel' },
  { value: 'short_story', label: 'Short Story' },
  { value: 'pilot', label: 'TV Pilot' }
]

const GENRES = [
  { value: 'all', label: 'All Genres' },
  { value: 'Action', label: 'Action' },
  { value: 'Adventure', label: 'Adventure' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Crime', label: 'Crime' },
  { value: 'Drama', label: 'Drama' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Horror', label: 'Horror' },
  { value: 'Mystery', label: 'Mystery' },
  { value: 'Romance', label: 'Romance' },
  { value: 'Sci-Fi', label: 'Sci-Fi' },
  { value: 'Thriller', label: 'Thriller' },
  { value: 'Western', label: 'Western' }
]

const SORT_OPTIONS = [
  { value: 'buzz_score', label: 'Most Popular' },
  { value: 'created_at', label: 'Newest' },
  { value: 'updated_at', label: 'Recently Updated' },
  { value: 'title', label: 'Title A-Z' }
]

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFormat, setFilterFormat] = useState('all')
  const [filterGenre, setFilterGenre] = useState('all')
  const [sortBy, setSortBy] = useState('buzz_score')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [searchQuery, filterFormat, filterGenre, sortBy, pagination?.page])

  const loadProjects = async (page = 1) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy
      })

      if (filterFormat !== 'all') params.append('format', filterFormat)
      if (filterGenre !== 'all') params.append('genre', filterGenre)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const response = await fetch(`/api/projects/public?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProjects(data.projects)
        setPagination(data.pagination)
      } else {
        console.error('Error loading projects:', data.error)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProjects(1)
  }

  const handlePageChange = (newPage: number) => {
    loadProjects(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading public projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Projects</h1>
          <p className="text-gray-300 text-lg">
            Explore public projects from writers around the world
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search projects by title, logline, or synopsis..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-navy-900/50 border-navy-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-navy-600 text-gray-300 hover:bg-navy-700 h-12"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700 h-12 px-6"
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-navy-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                    <select
                      value={filterFormat}
                      onChange={(e) => setFilterFormat(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-900/50 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold-400"
                    >
                      {FORMATS.map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-900/50 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold-400"
                    >
                      {GENRES.map(genre => (
                        <option key={genre.value} value={genre.value}>
                          {genre.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 bg-navy-900/50 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold-400"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-300">
            {pagination && (
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-navy-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-gold-400 text-navy-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-gold-400 text-navy-900'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {projects.length === 0 ? (
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
              <p className="text-gray-300">
                {searchQuery || filterFormat !== 'all' || filterGenre !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No public projects available at the moment'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="bg-navy-800/50 border-navy-700 backdrop-blur-sm hover:border-gold-400 transition-colors group"
              >
                <CardContent className={viewMode === 'grid' ? 'p-6' : 'p-4'}>
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-navy-600 text-gray-300">
                            {project.format}
                          </Badge>
                          {project.genre && (
                            <Badge className="bg-gold-400/20 text-gold-400 border border-gold-400/30">
                              {project.genre}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-gold-400">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-medium">{project.buzz_score}</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                          <Link href={`/projects/${project.id}`}>
                            {project.title}
                          </Link>
                        </h3>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {project.logline}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 text-xs font-bold">
                              {getInitials(project.profiles.display_name || 'Writer')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-300">{project.profiles.display_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">{formatDate(project.created_at)}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="border-navy-600 text-gray-300 hover:bg-navy-700"
                        >
                          <Link href={`/projects/${project.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 font-bold">
                            {getInitials(project.profiles.display_name || 'Writer')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-gold-400 transition-colors">
                              <Link href={`/projects/${project.id}`}>
                                {project.title}
                              </Link>
                            </h3>
                            <Badge variant="outline" className="border-navy-600 text-gray-300 text-xs">
                              {project.format}
                            </Badge>
                            {project.genre && (
                              <Badge className="bg-gold-400/20 text-gold-400 border border-gold-400/30 text-xs">
                                {project.genre}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                            {project.logline}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>by {project.profiles.display_name || 'Anonymous'}</span>
                            <span>{formatDate(project.created_at)}</span>
                            <div className="flex items-center space-x-1">
                              <Flame className="w-3 h-3" />
                              <span>{project.buzz_score} buzz</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-navy-600 text-gray-300 hover:bg-navy-700 ml-4"
                      >
                        <Link href={`/projects/${project.id}`}>
                          View Project
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="border-navy-600 text-gray-300 hover:bg-navy-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                const isActive = page === pagination.page
                
                return (
                  <Button
                    key={page}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={isActive 
                      ? "bg-gold-400 text-navy-900" 
                      : "border-navy-600 text-gray-300 hover:bg-navy-700"
                    }
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="border-navy-600 text-gray-300 hover:bg-navy-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
