'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  MessageCircle,
  BarChart3,
  TrendingUp,
  Pen,
  Users,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { 
  toggleProjectBookmark, 
  isProjectBookmarked, 
  getUserBookmarks,
  bookmarkEvents,
  type BookmarkData 
} from '@/lib/bookmarks'
import {
  clearProjectProgress,
  clearMultipleProjectsProgress,
  clearCompletedProgress,
  clearAllUserProgress,
  resetProjectProgress
} from '@/lib/reading-progress'

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
  const [activeMainTab, setActiveMainTab] = useState<'library' | 'analytics'>('library')

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

  // Refresh data when switching to analytics tab to ensure latest progress
  useEffect(() => {
    if (activeMainTab === 'analytics' && currentUser) {
      loadLibraryData(currentUser.id)
    }
  }, [activeMainTab, currentUser])
  const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'bookmarked'>('reading')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent')
  const [searchQuery, setSearchQuery] = useState('')



















  // Progress management state
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [isManagingProgress, setIsManagingProgress] = useState(false)
  const [showClearOptions, setShowClearOptions] = useState(false)

  // Reset management state when switching to bookmarked tab
  const handleTabChange = (tab: 'reading' | 'completed' | 'bookmarked') => {
    setActiveTab(tab)
    if (tab === 'bookmarked') {
      setIsManagingProgress(false)
      setSelectedProjects(new Set())
      setShowClearOptions(false)
    }
  }

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
    console.log('Loading library data for user:', userId)
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

      console.log('Reading progress data:', progressData)
      console.log('Reading progress error:', progressError)

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

        console.log('Progress data processed:', { completed: completed.length, inProgress: inProgress.length })
        console.log('In progress items:', inProgress.map(p => ({ 
          title: p.projects?.title, 
          progress: p.progress_percentage 
        })))

        setReadProjects(completed)
        setCurrentlyReading(inProgress)
      }

      // Load bookmarked projects using centralized system
      console.log('Loading bookmarks for user:', userId)
      const bookmarks = await getUserBookmarks(userId)
      console.log('Bookmarks loaded:', bookmarks)
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

  const getProjectUrl = (project: any) => {
    // Check if it's a novel format project
    if (project.format && project.format.toLowerCase() === 'novel') {
      return `/novels/${project.id}/read?from=library`
    }
    // Default to regular project page for other formats
    return `/projects/${project.id}?from=library`
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

  // Progress management functions
  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allIds = filteredProjects.map(p => p.id || p.project_id).filter(Boolean)

    if (selectedProjects.size === allIds.length) {
      // If all are selected, deselect all
      setSelectedProjects(new Set())
    } else {
      // If not all are selected, select all
      setSelectedProjects(new Set(allIds))
    }
  }

  const handleClearSelectedProgress = async () => {
    if (!currentUser || selectedProjects.size === 0) return

    try {
      const supabase = createSupabaseClient()
      await clearMultipleProjectsProgress(Array.from(selectedProjects), currentUser.id)

      // Refresh data by calling the useEffect logic again
      if (currentUser?.id) {
        // Load progress data
        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select(`
            *,
            projects (
              id,
              title,
              description,
              genre,
              created_at,
              owner_id,
              profiles (
                id,
                display_name,
                avatar_url,
                verified_pro
              )
            )
          `)
          .eq('user_id', currentUser.id)
          .not('projects', 'is', null)
          .order('updated_at', { ascending: false })

        if (progressData) {
          const completed = progressData.filter(p => p.progress_percentage >= 100)
          const inProgress = progressData.filter(p => p.progress_percentage < 100 && p.progress_percentage > 0)

          setReadProjects(completed)
          setCurrentlyReading(inProgress)
        }

        // Load bookmarked projects
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
      }

      // Reset selection
      setSelectedProjects(new Set())
      setIsManagingProgress(false)
      setShowClearOptions(false)
    } catch (error) {
      console.error('Error clearing selected progress:', error)
    }
  }

  const handleClearCompletedProgress = async () => {
    if (!currentUser) return

    if (!confirm('Are you sure you want to clear all completed reading progress? This action cannot be undone.')) {
      return
    }

    try {
      await clearCompletedProgress(currentUser.id)

      // Refresh data by calling the useEffect logic again
      if (currentUser?.id) {
        const supabase = createSupabaseClient()
        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select(`
            *,
            projects (
              id,
              title,
              description,
              genre,
              created_at,
              owner_id,
              profiles (
                id,
                display_name,
                avatar_url,
                verified_pro
              )
            )
          `)
          .eq('user_id', currentUser.id)
          .not('projects', 'is', null)
          .order('updated_at', { ascending: false })

        if (progressData) {
          const completed = progressData.filter(p => p.progress_percentage >= 100)
          const inProgress = progressData.filter(p => p.progress_percentage < 100 && p.progress_percentage > 0)

          setReadProjects(completed)
          setCurrentlyReading(inProgress)
        }

        // Load bookmarked projects
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
      }

      setShowClearOptions(false)
    } catch (error) {
      console.error('Error clearing completed progress:', error)
    }
  }

  const handleClearAllProgress = async () => {
    if (!currentUser) return

    if (!confirm('Are you sure you want to clear ALL reading progress? This action cannot be undone.')) {
      return
    }

    try {
      await clearAllUserProgress(currentUser.id)

      // Refresh data by calling the useEffect logic again
      if (currentUser?.id) {
        const supabase = createSupabaseClient()
        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select(`
            *,
            projects (
              id,
              title,
              description,
              genre,
              created_at,
              owner_id,
              profiles (
                id,
                display_name,
                avatar_url,
                verified_pro
              )
            )
          `)
          .eq('user_id', currentUser.id)
          .not('projects', 'is', null)
          .order('updated_at', { ascending: false })

        if (progressData) {
          const completed = progressData.filter((p: any) => p.progress_percentage >= 100)
          const inProgress = progressData.filter((p: any) => p.progress_percentage < 100 && p.progress_percentage > 0)

          setReadProjects(completed)
          setCurrentlyReading(inProgress)
        }

        // Load bookmarked projects
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
      }

      // Reset selection
      setSelectedProjects(new Set())
      setIsManagingProgress(false)
      setShowClearOptions(false)
    } catch (error) {
      console.error('Error clearing all progress:', error)
    }
  }

  const handleClearProgress = async (projectId: string) => {
    if (!currentUser) return

    try {
      await clearProjectProgress(projectId, currentUser.id)

      // Refresh data by calling the useEffect logic again
      if (currentUser?.id) {
        const supabase = createSupabaseClient()
        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select(`
            *,
            projects (
              id,
              title,
              description,
              genre,
              created_at,
              owner_id,
              profiles (
                id,
                display_name,
                avatar_url,
                verified_pro
              )
            )
          `)
          .eq('user_id', currentUser.id)
          .not('projects', 'is', null)
          .order('updated_at', { ascending: false })

        if (progressData) {
          const completed = progressData.filter((p: any) => p.progress_percentage >= 100)
          const inProgress = progressData.filter((p: any) => p.progress_percentage < 100 && p.progress_percentage > 0)

          setReadProjects(completed)
          setCurrentlyReading(inProgress)
        }

        // Load bookmarked projects
        const bookmarks = await getUserBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks)
      }
    } catch (error) {
      console.error('Error clearing progress:', error)
    }
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

        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as 'library' | 'analytics')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="library" className="flex items-center space-x-2">
              <BookMarked className="w-4 h-4" />
              <span>Writer's Library</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Reading Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Library Tab Content */}
          <TabsContent value="library" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
                  <BookOpen className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.currentlyReading}</div>
                  <p className="text-xs text-muted-foreground">Active research</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRead}</div>
                  <p className="text-xs text-muted-foreground">Stories studied</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
                  <Bookmark className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bookmarked}</div>
                  <p className="text-xs text-muted-foreground">Research material</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatReadingTime(stats.totalReadingTime)}</div>
                  <p className="text-xs text-muted-foreground">Research time</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader className="py-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
              {/* Tab Navigation */}
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleTabChange('reading')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'reading'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Currently Reading ({stats.currentlyReading})
                  </button>
                  <button
                    onClick={() => handleTabChange('completed')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'completed'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Completed ({stats.totalRead})
                  </button>
                  <button
                    onClick={() => handleTabChange('bookmarked')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'bookmarked'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Bookmarked ({stats.bookmarked})
                  </button>
                </div>

                {/* Progress Management Controls */}
                {(activeTab === 'reading' || activeTab === 'completed') && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsManagingProgress(!isManagingProgress)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isManagingProgress
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                      }`}
                    >
                      {isManagingProgress ? '✕ Cancel' : '⚙️ Manage'}
                    </button>

                    {!isManagingProgress && (
                      <div className="relative">
                        <button
                          onClick={() => setShowClearOptions(!showClearOptions)}
                          className="px-3 py-1.5 text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-all duration-200 shadow-md"
                        >
                          🗑️ Clear
                        </button>

                        {showClearOptions && (
                          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                            <div className="py-1">
                              <button
                                onClick={handleClearCompletedProgress}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                              >
                                🧹 Clear All Completed
                              </button>
                              <button
                                onClick={handleClearAllProgress}
                                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                              >
                                ⚠️ Clear All Progress
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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

        {/* Bulk Selection Controls */}
        {isManagingProgress && (
          <Card className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white px-2 py-1 rounded-full border border-orange-300">
                    <span className="text-sm font-medium text-orange-700">
                      {selectedProjects.size > 0 
                        ? `${selectedProjects.size} selected`
                        : 'Select projects'
                      }
                    </span>
                  </div>

                  {filteredProjects.length > 0 && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="px-2 py-1 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full transition-colors font-medium"
                      >
                        {selectedProjects.size === filteredProjects.length ? '☑️ Deselect All' : '📋 Select All'}
                      </button>
                      <button
                        onClick={() => setSelectedProjects(new Set())}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={handleClearSelectedProgress}
                  disabled={selectedProjects.size === 0}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium text-sm"
                >
                  🗑️ Clear Selected
                </button>
              </div>
            </CardContent>
          </Card>
        )}

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
                  {/* Progress Management Overlay */}
                  {isManagingProgress && (activeTab === 'reading' || activeTab === 'completed') && (
                    <>
                      {/* Selected Watermark */}
                      {selectedProjects.has(project.id) && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          <div className="text-red-500 text-4xl font-bold opacity-20 transform rotate-12 select-none">
                            SELECTED
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div 
                    className={`block ${isManagingProgress ? 'cursor-pointer' : ''}`}
                    onClick={isManagingProgress ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectProject(project.id);
                    } : undefined}
                  >
                    <Link href={getProjectUrl(project)} className={`block ${isManagingProgress ? 'pointer-events-none' : ''}`}>
                      <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-orange-300 overflow-hidden relative ${
                        isManagingProgress && selectedProjects.has(project.id) 
                          ? 'border-red-400 shadow-lg transform scale-[1.02] bg-red-50' 
                          : isManagingProgress 
                          ? 'opacity-70 hover:opacity-90 bg-gray-50 hover:ring-2 hover:ring-gray-300' 
                          : ''
                      }`}
                      style={isManagingProgress && selectedProjects.has(project.id) ? {
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)'
                      } : {}}>
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
                          {!isManagingProgress && (
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
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </div>
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
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Reading Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Research Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">7 days</div>
                  <p className="text-xs text-muted-foreground">Current streak</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentlyReading.length > 0 
                      ? Math.round(currentlyReading.reduce((acc, item) => acc + (item.progress_percentage || 0), 0) / currentlyReading.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Across all stories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Genres Read</CardTitle>
                  <BookMarked className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {[...new Set([...readProjects, ...currentlyReading].map(item => item.projects?.genre).filter(Boolean))].length}
                  </div>
                  <p className="text-xs text-muted-foreground">Different genres</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Words Read</CardTitle>
                  <Eye className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round([...readProjects, ...currentlyReading].reduce((acc, item) => {
                      const wordCount = item.projects?.word_count || 0
                      const progress = (item.progress_percentage || 0) / 100
                      return acc + (wordCount * progress)
                    }, 0) / 1000)}K
                  </div>
                  <p className="text-xs text-muted-foreground">Total words</p>
                </CardContent>
              </Card>
            </div>

            {/* Reading Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genre Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookMarked className="w-5 h-5 text-orange-500" />
                    <span>Genre Breakdown</span>
                  </CardTitle>
                  <CardDescription>Your research preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const genreCounts = [...readProjects, ...currentlyReading].reduce((acc, item) => {
                        const genre = item.projects?.genre || 'Unknown'
                        acc[genre] = (acc[genre] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                      
                      const totalBooks = Object.values(genreCounts).reduce((a, b) => a + b, 0)
                      
                      return Object.entries(genreCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([genre, count]) => (
                          <div key={genre} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{genre}</Badge>
                              <span className="text-sm text-gray-600">{count} stories</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${totalBooks > 0 ? (count / totalBooks) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">
                                {totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ))
                    })()}
                    
                    {[...readProjects, ...currentlyReading].length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No reading data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reading Habits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span>Reading Habits</span>
                  </CardTitle>
                  <CardDescription>Your research patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg. Reading Session</span>
                      <span className="text-sm font-medium">{formatReadingTime(Math.round(stats.totalReadingTime / Math.max(stats.currentlyReading + stats.totalRead, 1)))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm font-medium">
                        {Math.round((stats.totalRead / Math.max(stats.totalRead + stats.currentlyReading, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Favorite Format</span>
                      <span className="text-sm font-medium">
                        {(() => {
                          const formatCounts = [...readProjects, ...currentlyReading].reduce((acc, item) => {
                            const format = item.projects?.format || 'Unknown'
                            acc[format] = (acc[format] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const topFormat = Object.entries(formatCounts).sort(([,a], [,b]) => b - a)[0]
                          return topFormat ? topFormat[0] : 'None'
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Books This Month</span>
                      <span className="text-sm font-medium">
                        {[...readProjects, ...currentlyReading].filter(item => {
                          const updatedDate = new Date(item.updated_at)
                          const now = new Date()
                          return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear()
                        }).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span>Recent Reading Activity</span>
                </CardTitle>
                <CardDescription>Your latest research progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...readProjects, ...currentlyReading]
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.progress_percentage >= 100 ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-sm">{item.projects?.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.progress_percentage >= 100 ? 'Completed research' : `${Math.round(item.progress_percentage || 0)}% progress`}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  
                  {[...readProjects, ...currentlyReading].length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No reading activity yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start reading stories to track your research progress</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}