'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Clock, 
  Star, 
  Eye,
  Heart,
  Bookmark,
  Calendar,
  CheckCircle,
  BookMarked,
  Filter,
  Search,
  SortDesc,
  MoreHorizontal,
  ExternalLink,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  toggleProjectBookmark, 
  isProjectBookmarked, 
  getUserBookmarks,
  bookmarkEvents,
  type BookmarkData 
} from '@/lib/bookmarks'

interface Project {
  id: string
  title: string
  logline: string
  synopsis: string | null
  format: string
  genre: string | null
  word_count: number | null
  visibility: 'private' | 'preview' | 'public'
  buzz_score: number
  created_at: string
  updated_at: string
  owner_id: string
  profiles: {
    id: string
    display_name: string
    avatar_url?: string
    bio?: string
    verified_pro: boolean
  }
}

interface ReadingProgress {
  id: string
  project_id: string
  user_id: string
  progress_percentage: number
  last_position: number
  updated_at: string
  projects: Project
}

interface LibraryStats {
  totalRead: number
  currentlyReading: number
  bookmarked: number
  totalReadingTime: number
}

export default function WriterLibraryPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Library data
  const [stats, setStats] = useState<LibraryStats>({
    totalRead: 0,
    currentlyReading: 0,
    bookmarked: 0,
    totalReadingTime: 0
  })
  
  const [readProjects, setReadProjects] = useState<ReadingProgress[]>([])
  const [currentlyReading, setCurrentlyReading] = useState<ReadingProgress[]>([])
  const [bookmarkedProjects, setBookmarkedProjects] = useState<BookmarkData[]>([])
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, boolean>>({})
  
  // Filter and sort state
  const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'bookmarked'>('reading')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadUserAndLibrary()

    // Listen for bookmark changes from other pages
    const handleBookmarkChange = (projectId: string, isBookmarked: boolean) => {
      setBookmarkStatus(prev => ({
        ...prev,
        [projectId]: isBookmarked
      }))

      // Always refresh the full bookmark data to ensure accurate count
      if (currentUser) {
        getUserBookmarks(currentUser.id).then(bookmarks => {
          setBookmarkedProjects(bookmarks)
          setStats(prev => ({ ...prev, bookmarked: bookmarks.length }))
        })
      }
    }

    bookmarkEvents.on('bookmarkChanged', handleBookmarkChange)

    return () => {
      bookmarkEvents.off('bookmarkChanged', handleBookmarkChange)
    }
  }, [])

  const loadUserAndLibrary = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setCurrentUser(user)

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)

      // Load library data
      await loadLibraryData(user.id)
      
    } catch (error) {
      console.error('Error loading user and library:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLibraryData = async (userId: string) => {
    try {
      const supabase = createSupabaseClient()

      // Load reading progress
      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select(`
          *,
          projects:project_id (
            id,
            title,
            logline,
            synopsis,
            format,
            genre,
            word_count,
            visibility,
            buzz_score,
            created_at,
            updated_at,
            owner_id
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (progressError) {
        console.error('Error loading reading progress:', progressError)
      }

      // If we have progress data, fetch the profile information separately
      if (progressData && progressData.length > 0) {
        const ownerIds = [...new Set(progressData.map(p => p.projects?.owner_id).filter(Boolean))]
        
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, verified_pro')
            .in('id', ownerIds)

          // Attach profiles to projects
          progressData.forEach(progress => {
            if (progress.projects && progress.projects.owner_id) {
              progress.projects.profiles = profiles?.find(p => p.id === progress.projects.owner_id) || null
            }
          })
        }

        const completed = progressData.filter(p => p.progress_percentage >= 100)
        const inProgress = progressData.filter(p => p.progress_percentage < 100 && p.progress_percentage > 0)
        
        setReadProjects(completed)
        setCurrentlyReading(inProgress)
      }

      // Load bookmarked projects using centralized system
      const bookmarks = await getUserBookmarks(userId)
      setBookmarkedProjects(bookmarks)

      // Load bookmark status for all projects
      const allProjectIds = [
        ...progressData?.map(p => (p.projects as any)?.id).filter(Boolean) || [],
        ...bookmarks.map(b => b.project_id).filter(Boolean)
      ]
      
      const bookmarkStatusMap: Record<string, boolean> = {}
      for (const projectId of [...new Set(allProjectIds)]) {
        bookmarkStatusMap[projectId] = await isProjectBookmarked(projectId, userId)
      }
      setBookmarkStatus(bookmarkStatusMap)

      // Calculate stats
      const totalReadingTime = progressData?.reduce((acc, p) => {
        // Estimate reading time based on progress and content length
        const estimatedTotalTime = 10 // minutes per project (rough estimate)
        return acc + (estimatedTotalTime * (p.progress_percentage / 100))
      }, 0) || 0

      const completed = progressData?.filter(p => p.progress_percentage >= 100) || []
      const inProgress = progressData?.filter(p => p.progress_percentage < 100 && p.progress_percentage > 0) || []

      setStats({
        totalRead: completed.length,
        currentlyReading: inProgress.length,
        bookmarked: bookmarks.length,
        totalReadingTime: Math.round(totalReadingTime)
      })

    } catch (error) {
      console.error('Error loading library data:', error)
      setStats({
        totalRead: 0,
        currentlyReading: 0,
        bookmarked: 0,
        totalReadingTime: 0
      })
    }
  }

  const handleToggleBookmark = async (projectId: string) => {
    if (!currentUser) return

    try {
      const newBookmarkStatus = await toggleProjectBookmark(projectId, currentUser.id)
      
      // Update local bookmark status
      setBookmarkStatus(prev => ({
        ...prev,
        [projectId]: newBookmarkStatus
      }))

      if (newBookmarkStatus) {
        // Added bookmark - reload bookmarks to get the full data
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
        setStats(prev => ({ ...prev, bookmarked: bookmarks.length }))
      } else {
        // Removed bookmark - reload bookmarks to get accurate count
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
        setStats(prev => ({ ...prev, bookmarked: bookmarks.length }))
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const isBookmarked = (projectId: string) => {
    return bookmarkStatus[projectId] || false
  }

  const getFilteredProjects = () => {
    let projects: any[] = []
    
    switch (activeTab) {
      case 'reading':
        projects = currentlyReading
        break
      case 'completed':
        projects = readProjects
        break
      case 'bookmarked':
        projects = bookmarkedProjects
        break
      default:
        projects = currentlyReading
    }

    // Apply search filter
    if (searchQuery) {
      projects = projects.filter(p => 
        p.projects?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projects?.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        projects.sort((a, b) => (a.projects?.title || '').localeCompare(b.projects?.title || ''))
        break
      case 'progress':
        if (activeTab === 'reading') {
          projects.sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0))
        }
        break
      case 'recent':
      default:
        projects.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        break
    }

    return projects
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  const getStatusBadge = (project: any) => {
    if (activeTab === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else if (activeTab === 'bookmarked') {
      return <Badge className="bg-orange-100 text-orange-800">Bookmarked</Badge>
    } else {
      const progress = project.progress_percentage || 0
      if (progress === 0) {
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
      } else if (progress < 25) {
        return <Badge className="bg-orange-100 text-orange-800">Just Started</Badge>
      } else if (progress < 75) {
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      } else {
        return <Badge className="bg-orange-100 text-orange-800">Almost Done</Badge>
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <BookMarked className="w-8 h-8 text-orange-600" />
              <span>Writer's Library</span>
            </h1>
            <p className="text-gray-600 mt-2">Your reading journey for creative inspiration</p>
          </div>
          
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/app/search">
              <Search className="w-4 h-4 mr-2" />
              Discover Stories
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentlyReading}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRead}</div>
              <p className="text-xs text-muted-foreground">Stories finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
              <Bookmark className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookmarked}</div>
              <p className="text-xs text-muted-foreground">Saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatReadingTime(stats.totalReadingTime)}</div>
              <p className="text-xs text-muted-foreground">Total time spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('reading')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'reading'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Currently Reading ({stats.currentlyReading})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'completed'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Completed ({stats.totalRead})
                </button>
                <button
                  onClick={() => setActiveTab('bookmarked')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'bookmarked'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Bookmarked ({stats.bookmarked})
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="recent">Recent</option>
                  <option value="title">Title</option>
                  {activeTab === 'reading' && <option value="progress">Progress</option>}
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="lg:col-span-2 xl:col-span-3">
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {activeTab === 'reading' && 'No stories in progress'}
                    {activeTab === 'completed' && 'No completed stories yet'}
                    {activeTab === 'bookmarked' && 'No bookmarked stories'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'reading' && 'Start reading some amazing stories to see them here.'}
                    {activeTab === 'completed' && 'Complete your first story to see it here.'}
                    {activeTab === 'bookmarked' && 'Bookmark stories you want to read later.'}
                  </p>
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href="/app/search">
                      <Search className="w-4 h-4 mr-2" />
                      Discover Stories
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredProjects.map((item) => {
              const project = item.projects
              if (!project) return null

              return (
                <div key={item.id} className="group relative">
                  <Link href={`/projects/${project.id}?from=library`} className="block">
                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-orange-300 overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-orange-700 transition-colors duration-200">
                                {project.title}
                              </h3>
                              {getStatusBadge(item)}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              by {project.profiles?.display_name || 'Unknown Author'}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">{project.logline}</p>
                          </div>
                          
                          {/* Buzz Score, Word Count, and Bookmark - Top Right */}
                          <div className="flex flex-col items-end space-y-1 ml-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleBookmark(project.id);
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                  isBookmarked(project.id)
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-yellow-500'
                                }`}
                              >
                                <Bookmark className={`w-4 h-4 ${isBookmarked(project.id) ? 'fill-current' : ''}`} />
                              </button>
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Star className="w-3 h-3" />
                                <span>{project.buzz_score || 0}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {project.word_count ? `${project.word_count.toLocaleString()} words` : 'No word count'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          {/* Reading Progress (for reading and completed tabs) */}
                          {(activeTab === 'reading' || activeTab === 'completed') && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Reading Progress</span>
                                <span className="font-medium">{Math.round(item.progress_percentage || 0)}%</span>
                              </div>
                              <Progress value={item.progress_percentage || 0} className="h-2" />
                            </div>
                          )}

                          {/* Project Info */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              {project.format && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {project.format}
                                </span>
                              )}
                              {project.genre && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {project.genre}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Continue Reading Button - Animated expansion */}
                          <div className="overflow-hidden transition-all duration-300 ease-out max-h-0 group-hover:max-h-16">
                            <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-75 mt-3 pt-3 border-t border-gray-100">
                              <button 
                                className="w-full flex items-center justify-center space-x-2 text-orange-700 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200 py-2 rounded-lg transform hover:scale-[1.02] hover:shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/projects/${project.id}?from=library`);
                                }}
                              >
                                {activeTab === 'reading' && (
                                  <>
                                    <BookOpen className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
                                    <span className="font-medium">Continue Reading</span>
                                  </>
                                )}
                                {activeTab === 'completed' && (
                                  <>
                                    <Eye className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
                                    <span className="font-medium">Read Again</span>
                                  </>
                                )}
                                {activeTab === 'bookmarked' && (
                                  <>
                                    <BookOpen className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
                                    <span className="font-medium">Start Reading</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )
            })
          )}
        </div>

        {/* Empty State for no results */}
        {filteredProjects.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No stories found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse all stories.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
