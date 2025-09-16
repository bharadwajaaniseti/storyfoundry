'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Star,
  Bookmark,
  Eye,
  Calendar,
  TrendingUp,
  Search,
  Settings,
  X,
  Trash2
} from 'lucide-react'

interface ReadingProgressItem {
  id: string
  project_id: string
  progress_percentage: number
  updated_at: string
  is_completed: boolean
  completed_at?: string
  projects: {
    id: string
    title: string
    description?: string
    logline?: string
    synopsis?: string
    owner_id: string
    word_count: number
    estimated_reading_time: number
    cover_image: string | null
    buzz_score: number
    profiles: {
      display_name: string
      avatar_url: string | null
    }
  }
}

interface BookmarkedProject {
  id: string
  project_id: string
  actor_id: string
  created_at: string
  projects: {
    id: string
    title: string
    description?: string
    logline?: string
    synopsis?: string
    owner_id: string
    word_count: number
    estimated_reading_time?: number
    cover_image: string | null
    buzz_score: number
    profiles: {
      display_name: string
      avatar_url: string | null
    }
  }
}

interface ReadingProgressProps {
  userId: string
}

export default function ReadingProgress({ userId }: ReadingProgressProps) {
  const [readingProgress, setReadingProgress] = useState<ReadingProgressItem[]>([])
  const [bookmarkedProjects, setBookmarkedProjects] = useState<BookmarkedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'bookmarked'>('reading')
  const [searchQuery, setSearchQuery] = useState('')
  const [isManaging, setIsManaging] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent')

  const loadData = async () => {
    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()

      console.log('Loading data for userId:', userId)
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current authenticated user:', user?.id)
      console.log('Auth error:', authError)
      
      if (authError || !user) {
        console.error('Authentication issue:', authError)
        setError('Please sign in to view your reading progress.')
        setIsLoading(false)
        return
      }

      // Load reading progress with project details
      console.log('Querying reading_progress table...')
      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select(`
          *,
          projects (
            id,
            title,
            logline,
            synopsis,
            owner_id,
            word_count,
            buzz_score,
            profiles!projects_owner_id_fkey (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      console.log('Reading progress query result:', { progressData, progressError })

      if (progressError) {
        console.error('Error loading reading progress:', progressError)
        console.error('Error details:', JSON.stringify(progressError, null, 2))
        console.error('Error code:', progressError.code)
        console.error('Error message:', progressError.message)
        if (progressError.code === 'PGRST301' || progressError.message?.includes('permission')) {
          setError('You do not have permission to access reading progress data.')
          setIsLoading(false)
          return
        }
      } else {
        console.log('Loaded reading progress data:', progressData)
        console.log('First reading progress item:', progressData?.[0])
        // Transform the data to match our interface
        const transformedProgress = (progressData || []).map(item => {
          const project = Array.isArray(item.projects) ? item.projects[0] : item.projects
          if (!project) return null
          
          const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
          
          return {
            ...item,
            projects: {
              ...project,
              description: project.logline || project.synopsis || '',
              estimated_reading_time: Math.ceil((project.word_count || 0) / 250),
              cover_image: null, // No cover image column in current schema
              profiles: profile || { display_name: 'Unknown Author', avatar_url: null }
            }
          }
        }).filter(Boolean) // Remove null items
        
        console.log('Transformed reading progress:', transformedProgress)
        setReadingProgress(transformedProgress as ReadingProgressItem[])
      }

      // Load bookmarked projects with project details
      console.log('Querying engagement_events table...')
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('engagement_events')
        .select(`
          id,
          project_id,
          actor_id,
          created_at,
          projects:project_id (
            id,
            title,
            logline,
            synopsis,
            word_count,
            buzz_score,
            owner_id,
            profiles!projects_owner_id_fkey (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('actor_id', userId)
        .eq('kind', 'save')
        .order('created_at', { ascending: false })

      console.log('Bookmark query result:', { bookmarkData, bookmarkError })

      if (bookmarkError) {
        console.error('Error loading bookmarks:', bookmarkError)
        console.error('Bookmark error details:', JSON.stringify(bookmarkError, null, 2))
        console.error('Bookmark error code:', bookmarkError.code)
        console.error('Bookmark error message:', bookmarkError.message)
        if (bookmarkError.code === 'PGRST301' || bookmarkError.message?.includes('permission')) {
          setError('You do not have permission to access bookmark data.')
          setIsLoading(false)
          return
        }
      } else {
        console.log('Loaded bookmarks data:', bookmarkData)
        console.log('First bookmark item:', bookmarkData?.[0])
        // Transform the data to match our interface
        const transformedBookmarks = (bookmarkData || []).map(item => {
          const project = Array.isArray(item.projects) ? item.projects[0] : item.projects
          if (!project) return null
          
          const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles
          
          return {
            ...item,
            projects: {
              ...project,
              description: project.logline || project.synopsis || '',
              estimated_reading_time: Math.ceil((project.word_count || 0) / 250),
              cover_image: null, // No cover image column in current schema
              profiles: profile || { display_name: 'Unknown Author', avatar_url: null }
            }
          }
        }).filter(Boolean) // Remove null items
        
        console.log('Transformed bookmarks:', transformedBookmarks)
        setBookmarkedProjects(transformedBookmarks as BookmarkedProject[])
      }

    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load reading progress data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      console.log('Loading data for userId:', userId)
      loadData()
    }
  }, [userId])

  const getCurrentTabData = (): (ReadingProgressItem | BookmarkedProject)[] => {
    switch (activeTab) {
      case 'reading':
        return readingProgress.filter(item => !item.is_completed && item.progress_percentage > 0)
      case 'completed':
        return readingProgress.filter(item => item.is_completed)
      case 'bookmarked':
        return bookmarkedProjects
      default:
        return []
    }
  }

  const getFilteredAndSortedData = (): (ReadingProgressItem | BookmarkedProject)[] => {
    let data = getCurrentTabData()
    
    // Filter by search query
    if (searchQuery) {
      data = data.filter(item => 
        item.projects.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projects.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort data
    data.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.projects.title.localeCompare(b.projects.title)
        case 'progress':
          if (activeTab === 'bookmarked') return 0
          const aProgress = 'progress_percentage' in a ? (a as ReadingProgressItem).progress_percentage : 0
          const bProgress = 'progress_percentage' in b ? (b as ReadingProgressItem).progress_percentage : 0
          return bProgress - aProgress
        case 'recent':
        default:
          const aDate = 'updated_at' in a ? (a as ReadingProgressItem).updated_at : a.created_at
          const bDate = 'updated_at' in b ? (b as ReadingProgressItem).updated_at : b.created_at
          return new Date(bDate).getTime() - new Date(aDate).getTime()
      }
    })

    return data
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(getFilteredAndSortedData().map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    }
  }

  const handleClearSelected = async () => {
    if (selectedItems.length === 0) return

    try {
      const supabase = createSupabaseClient()
      
      if (activeTab === 'bookmarked') {
        // Remove bookmarks from engagement_events
        const { error: deleteError } = await supabase
          .from('engagement_events')
          .delete()
          .eq('actor_id', userId)
          .eq('kind', 'save')
          .in('id', selectedItems)
        
        if (deleteError) {
          console.error('Error deleting bookmarks:', deleteError)
          return
        }
      } else {
        // Remove reading progress
        await supabase
          .from('reading_progress')
          .delete()
          .in('id', selectedItems)
      }

      // Reload data
      await loadData()
      setSelectedItems([])
      setIsManaging(false)
    } catch (error) {
      console.error('Error clearing selected items:', error)
    }
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const currentTabData = getFilteredAndSortedData()
  const currentlyReadingCount = readingProgress.filter(item => !item.is_completed && item.progress_percentage > 0).length
  const completedCount = readingProgress.filter(item => item.is_completed).length
  const bookmarkedCount = bookmarkedProjects.length

  console.log('ReadingProgress Component State:', {
    userId,
    activeTab,
    currentlyReadingCount,
    completedCount,
    bookmarkedCount,
    readingProgressLength: readingProgress.length,
    bookmarkedProjectsLength: bookmarkedProjects.length,
    currentTabDataLength: currentTabData.length
  })

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              setIsLoading(true)
              loadData()
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('reading')
                setIsManaging(false)
                setSelectedItems([])
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reading'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Currently Reading ({currentlyReadingCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('completed')
                setIsManaging(false)
                setSelectedItems([])
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('bookmarked')
                setIsManaging(false)
                setSelectedItems([])
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bookmarked'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bookmarked ({bookmarkedCount})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {!isManaging ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManaging(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsManaging(false)
                  setSelectedItems([])
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="title">Title</option>
            {activeTab !== 'bookmarked' && <option value="progress">Progress</option>}
          </select>
        </div>
      </div>

      {/* Management Controls */}
      {isManaging && currentTabData.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.length === currentTabData.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select All'}
                </span>
              </div>
              {selectedItems.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
                    Deselect All
                  </Button>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">Clear</span>
                </div>
              )}
            </div>
            
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSelected}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {currentTabData.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery 
              ? 'No results found' 
              : activeTab === 'completed' 
                ? 'No completed projects yet' 
                : activeTab === 'reading' 
                  ? 'No projects currently being read' 
                  : 'No bookmarked projects yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search terms.' 
              : activeTab === 'bookmarked' 
                ? 'Bookmark some interesting stories to see them here.' 
                : 'Start reading some projects to track your progress!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentTabData.map((item) => {
            const isSelected = selectedItems.includes(item.id)
            const isProgress = 'progress_percentage' in item
            const progressValue = isProgress ? (item as ReadingProgressItem).progress_percentage : 0
            
            return (
              <div 
                key={item.id} 
                className={`group relative transition-all duration-300 ease-in-out cursor-pointer rounded-lg border ${
                  isSelected 
                    ? 'bg-pink-50 border-red-500 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
                onClick={() => {
                  if (isManaging) {
                    handleSelectItem(item.id, !isSelected)
                  }
                }}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      SELECTED
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  {/* Header: Title and Status/Star */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-base leading-tight">
                        {item.projects.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {activeTab === 'reading' && progressValue >= 75 && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">
                          Almost Done
                        </span>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-500">0</span>
                      </div>
                    </div>
                  </div>

                  {/* Author and Word Count */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>by {item.projects.profiles.display_name || 'Account is Private'}</span>
                    <span>{item.projects.word_count || 369} words</span>
                  </div>

                  {/* Description */}
                  {(item.projects.description || item.projects.logline) && (
                    <p className="text-sm text-gray-600 mb-4">
                      {item.projects.description || item.projects.logline}
                    </p>
                  )}

                  {/* Progress Section */}
                  {isProgress && activeTab !== 'bookmarked' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Reading Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {progressValue}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer: Tags and Date */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        treatment
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        fantasy
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(
                          'updated_at' in item ? item.updated_at : item.created_at
                        ).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Continue Reading Button - Hidden by default, shows on hover */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    !isManaging && !isSelected 
                      ? 'opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-16' 
                      : 'opacity-0 max-h-0'
                  }`}>
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/novels/${item.project_id}`
                        }}
                        className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded transition-all duration-200"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Continue Reading
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
