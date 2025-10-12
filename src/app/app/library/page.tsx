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
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { 
  toggleProjectBookmark, 
  isProjectBookmarked, 
  getUserBookmarks, 
  getUserBookmarkCount,
  getMultipleBookmarkStatus,
  bookmarkEvents,
  type BookmarkData 
} from '@/lib/bookmarks'
import {
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

export default function LibraryPage() {
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
  const [activeMainTab, setActiveMainTab] = useState<'library' | 'analytics'>('library')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  // Refresh data when switching to analytics tab to ensure latest progress
  useEffect(() => {
    if (activeMainTab === 'analytics' && currentUser) {
      loadLibraryData(currentUser.id)
    }
  }, [activeMainTab, currentUser])
  
  // Helper function to determine what to display for author
  const getAuthorDisplay = (profile: any) => {
    if (!profile) return 'Unknown Author'
    
    // If profile is private, show "Account is Private"
    if (profile.profile_visibility === 'private') {
      return 'Account is Private'
    }
    
    // Otherwise show display name or fallback
    return profile.display_name || 'Unknown Author'
  }

  // Helper function to check if profile interactions should be disabled
  const isProfileInteractionDisabled = (profile: any) => {
    return profile?.profile_visibility === 'private'
  }
  
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
        const ownerIds = [...new Set(progressData.map(p => (p.projects as any)?.owner_id).filter(Boolean))]
        
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, verified_pro, profile_visibility')
            .in('id', ownerIds)

          // Attach profiles to projects
          progressData.forEach(progress => {
            if (progress.projects && (progress.projects as any).owner_id) {
              (progress.projects as any).profiles = profiles?.find(p => p.id === (progress.projects as any).owner_id) || null
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
      
      if (allProjectIds.length > 0) {
        const bookmarkStatusMap = await getMultipleBookmarkStatus([...new Set(allProjectIds)], userId)
        setBookmarkStatus(bookmarkStatusMap)
      }

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
      // Set empty data as fallback
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
    const currentProjects = getFilteredProjects()
    const allIds = currentProjects.map(p => p.projects?.id || p.project_id).filter(Boolean)
    
    if (selectedProjects.size === allIds.length) {
      // If all are selected, deselect all
      setSelectedProjects(new Set())
    } else {
      // If not all are selected, select all
      setSelectedProjects(new Set(allIds))
    }
  }

  const handleClearSelection = () => {
    setSelectedProjects(new Set())
  }

  const handleClearSelectedProgress = async () => {
    if (!currentUser || selectedProjects.size === 0) return

    try {
      await clearMultipleProjectsProgress(Array.from(selectedProjects), currentUser.id)
      await loadLibraryData(currentUser.id)
      setSelectedProjects(new Set())
      setIsManagingProgress(false)
    } catch (error) {
      console.error('Error clearing selected progress:', error)
    }
  }

  const handleClearAllCompleted = async () => {
    if (!currentUser) return
    
    if (!confirm('Are you sure you want to clear all completed reading progress? This action cannot be undone.')) {
      return
    }

    try {
      await clearCompletedProgress(currentUser.id)
      await loadLibraryData(currentUser.id)
      setShowClearOptions(false)
    } catch (error) {
      console.error('Error clearing completed progress:', error)
    }
  }

  const handleClearAllProgress = async () => {
    if (!currentUser) return
    
    if (!confirm('Are you sure you want to clear ALL reading progress? This will remove all reading history and cannot be undone.')) {
      return
    }

    try {
      await clearAllUserProgress(currentUser.id)
      await loadLibraryData(currentUser.id)
      setShowClearOptions(false)
    } catch (error) {
      console.error('Error clearing all progress:', error)
    }
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
      return <Badge className="bg-blue-100 text-blue-800">Bookmarked</Badge>
    } else {
      const progress = project.progress_percentage || 0
      if (progress === 0) {
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
      } else if (progress < 25) {
        return <Badge className="bg-orange-100 text-orange-800">Just Started</Badge>
      } else if (progress < 75) {
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      } else {
        return <Badge className="bg-purple-100 text-purple-800">Almost Done</Badge>
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Library</h1>
              <p className="text-gray-600 mt-2">Your reading journey at a glance</p>
            </div>
            
            <Button asChild className="btn-primary">
              <Link href="/app/search">
                <Search className="w-4 h-4 mr-2" />
                Discover Stories
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">

        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as 'library' | 'analytics')} className="space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
                <TabsTrigger value="library" className="flex items-center space-x-2">
                  <BookMarked className="w-4 h-4" />
                  <span>My Library</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Reading Analytics</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Library Tab Content */}
          <TabsContent value="library" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Currently Reading</h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.currentlyReading}</div>
                <p className="text-xs text-gray-500">Active projects</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Keep reading!</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Completed</h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalRead}</div>
                <p className="text-xs text-gray-500">Stories finished</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-green-600">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    <span>Great progress!</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Bookmarked</h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <Bookmark className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.bookmarked}</div>
                <p className="text-xs text-gray-500">Saved for later</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-purple-600">
                    <Heart className="w-3 h-3 mr-1" />
                    <span>Ready to read</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Reading Time</h3>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{formatReadingTime(stats.totalReadingTime)}</div>
                <p className="text-xs text-gray-500">Total time spent</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-orange-600">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    <span>Time invested</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Reading Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Reading Streak</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">7 days</div>
                  <p className="text-xs text-gray-500 mb-3">Current streak</p>
                  <div className="flex items-center space-x-1">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Average Progress</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {currentlyReading.length > 0 
                      ? Math.round(currentlyReading.reduce((acc, item) => acc + (item.progress_percentage || 0), 0) / currentlyReading.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Across all stories</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${currentlyReading.length > 0 
                        ? Math.round(currentlyReading.reduce((acc, item) => acc + (item.progress_percentage || 0), 0) / currentlyReading.length)
                        : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Genres Explored</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                      <BookMarked className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {[...new Set([...readProjects, ...currentlyReading].map(item => item.projects?.genre).filter(Boolean))].length}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Different genres</p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set([...readProjects, ...currentlyReading].map(item => item.projects?.genre).filter(Boolean))].slice(0, 3).map((genre, i) => (
                      <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Words Read</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {Math.round([...readProjects, ...currentlyReading].reduce((acc, item) => {
                      const wordCount = item.projects?.word_count || 0
                      const progress = (item.progress_percentage || 0) / 100
                      return acc + (wordCount * progress)
                    }, 0) / 1000)}K
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Total words</p>
                  <div className="text-xs text-orange-600 font-medium">
                    ≈ {Math.round([...readProjects, ...currentlyReading].reduce((acc, item) => {
                      const wordCount = item.projects?.word_count || 0
                      const progress = (item.progress_percentage || 0) / 100
                      return acc + (wordCount * progress)
                    }, 0) / 250)} pages read
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genre Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                      <BookMarked className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Genre Breakdown</h3>
                      <p className="text-xs text-gray-500">Your reading diversity</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const genreCounts = [...readProjects, ...currentlyReading].reduce((acc, item) => {
                      const genre = item.projects?.genre || 'Unknown'
                      acc[genre] = (acc[genre] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    const totalBooks = Object.values(genreCounts).reduce((a, b) => a + b, 0)
                    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
                    
                    return Object.entries(genreCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([genre, count], index) => {
                        const percentage = totalBooks > 0 ? (count / totalBooks) * 100 : 0
                        return (
                          <div key={genre} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 ${colors[index]} rounded-full shadow-md`}></div>
                                <span className="text-sm font-medium text-gray-700">{genre}</span>
                                <Badge variant="outline" className="text-xs">{count}</Badge>
                              </div>
                              <span className="text-sm font-bold text-gray-800">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`${colors[index]} h-2.5 rounded-full transition-all duration-700 ease-out group-hover:opacity-80`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })
                  })()}
                  {[...readProjects, ...currentlyReading].length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Start reading to see your genre preferences</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reading Habits */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Reading Habits</h3>
                      <p className="text-xs text-gray-500">Your reading patterns</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        Avg. Reading Session
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatReadingTime(Math.round(stats.totalReadingTime / Math.max(stats.currentlyReading + stats.totalRead, 1)))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-transparent p-4 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Completion Rate
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round((stats.totalRead / Math.max(stats.totalRead + stats.currentlyReading, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((stats.totalRead / Math.max(stats.totalRead + stats.currentlyReading, 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                        Favorite Format
                      </span>
                      <span className="text-sm font-bold text-purple-600">
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
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-transparent p-4 rounded-lg border border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                        Books This Month
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {[...readProjects, ...currentlyReading].filter(item => {
                          const updatedDate = new Date(item.updated_at)
                          const now = new Date()
                          return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear()
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Recent Reading Activity</h3>
                      <p className="text-xs text-gray-500">Your latest progress updates</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Last 7 days
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {[...readProjects, ...currentlyReading]
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent p-4 rounded-lg border border-transparent hover:border-gray-200 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.progress_percentage >= 100 
                                ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-200' 
                                : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200'
                            }`}>
                              {item.progress_percentage >= 100 ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-gray-100">
                              <span className="text-xs font-bold text-gray-600">#{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                              {item.projects?.title}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`text-xs font-medium ${
                                item.progress_percentage >= 100 ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {item.progress_percentage >= 100 ? '✓ Completed' : `${Math.round(item.progress_percentage || 0)}% progress`}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {item.progress_percentage < 100 && (
                            <div className="w-16">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${item.progress_percentage || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 text-center block">
                                {Math.round(item.progress_percentage || 0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {[...readProjects, ...currentlyReading].length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium mb-1">No reading activity yet</p>
                    <p className="text-xs">Start reading stories to track your progress</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Filters and Search - Only show for Library tab */}
        {activeMainTab === 'library' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                {/* Tab Navigation */}
                <div className="flex items-center space-x-3">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleTabChange('reading')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'reading'
                        ? 'bg-white text-blue-600 shadow-sm'
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
                        ? 'bg-white text-purple-600 shadow-sm'
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
                          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
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
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                            <div className="py-1">
                              <button
                                onClick={handleClearAllCompleted}
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="recent">Recent</option>
                  <option value="title">Title</option>
                  {activeTab === 'reading' && <option value="progress">Progress</option>}
                </select>
              </div>
            </div>
            </div>

            {/* Bulk Selection Controls */}
            {isManagingProgress && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white px-2 py-1 rounded-full border border-purple-300">
                      <span className="text-sm font-medium text-purple-700">
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
                          className="px-2 py-1 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full transition-colors font-medium"
                        >
                          {selectedProjects.size === filteredProjects.length ? '☑️ Deselect All' : '📋 Select All'}
                        </button>
                        <button
                          onClick={handleClearSelection}
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
              </div>
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
                  <Button asChild>
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
                      <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-purple-300 overflow-hidden relative ${
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
                              <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-700 transition-colors duration-200">
                                {project.title}
                              </h3>
                              {getStatusBadge(item)}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              by {getAuthorDisplay(project.profiles)}
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
                                  className="w-full flex items-center justify-center space-x-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 transition-all duration-200 py-2 rounded-lg transform hover:scale-[1.02] hover:shadow-sm"
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
          </>
        )}
      </div>
    </div>
  )
}