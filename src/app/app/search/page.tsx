'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search,
  Filter,
  TrendingUp,
  Eye,
  Star,
  Clock,
  Users,
  Shield,
  Flame,
  Calendar,
  Bookmark,
  Share2,
  FileText
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import ProfileModal from '@/components/profile-modal'
import UserAvatar from '@/components/user-avatar'
import { 
  toggleProjectBookmark, 
  isProjectBookmarked,
  getMultipleBookmarkStatus
} from '@/lib/bookmarks'

interface PublicProject {
  id: string
  title: string
  logline: string
  format: string
  genre: string | null
  buzz_score: number
  word_count: number | null
  created_at: string
  updated_at: string
  profiles: {
    id: string
    display_name: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string
  } | null
}

const TRENDING_SEARCHES = [
  'Sci-fi thriller', 'Romance comedy', 'Horror screenplay', 'Fantasy novel',
  'Crime drama', 'Action adventure', 'Mystery thriller', 'Period drama'
]

const FEATURED_GENRES = [
  { name: 'Action', color: 'bg-red-100 text-red-600', count: 45 },
  { name: 'Comedy', color: 'bg-yellow-100 text-yellow-600', count: 32 },
  { name: 'Drama', color: 'bg-blue-100 text-blue-600', count: 67 },
  { name: 'Horror', color: 'bg-purple-100 text-purple-600', count: 28 },
  { name: 'Romance', color: 'bg-pink-100 text-pink-600', count: 41 },
  { name: 'Sci-Fi', color: 'bg-green-100 text-green-600', count: 35 }
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<PublicProject[]>([])
  const [featuredProjects, setFeaturedProjects] = useState<PublicProject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [userRole, setUserRole] = useState<string>('reader')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, boolean>>({})
  const [filters, setFilters] = useState({
    format: 'all',
    genre: 'all',
    sortBy: 'buzz_score'
  })
  
  // Profile modal state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  // Helper function to determine what to display for author
  const getAuthorDisplay = (profile: any) => {
    if (!profile) return 'Unknown Writer'
    
    // If profile is private, show "Account is Private"
    if (profile.profile_visibility === 'private') {
      return 'Account is Private'
    }
    
    // Otherwise show display name or fallback
    return profile.display_name || 'Unknown Writer'
  }

  // Helper function to check if profile interactions should be disabled
  const isProfileInteractionDisabled = (profile: any) => {
    return profile?.profile_visibility === 'private'
  }

  useEffect(() => {
    loadFeaturedProjects()
    loadUserRole()
  }, [])

  const loadUserRole = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setCurrentUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profile?.role?.toLowerCase() || 'reader')
      }
    } catch (error) {
      console.error('Error loading user role:', error)
      setUserRole('reader')
    }
  }

  // Color schemes based on user role
  const getColorScheme = () => {
    return userRole === 'writer' ? {
      primary: 'orange-500',
      primaryHover: 'orange-600',
      primaryLight: 'orange-50',
      primaryMedium: 'orange-100',
      primaryText: 'orange-600',
      primaryTextDark: 'orange-700',
      border: 'orange-500',
      borderLight: 'orange-300',
      ring: 'orange-500/20'
    } : {
      primary: 'purple-500',
      primaryHover: 'purple-600',
      primaryLight: 'purple-50',
      primaryMedium: 'purple-100',
      primaryText: 'purple-600',
      primaryTextDark: 'purple-700',
      border: 'purple-500',
      borderLight: 'purple-300',
      ring: 'purple-500/20'
    }
  }

  const colors = getColorScheme()

  const loadFeaturedProjects = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Load top projects with highest buzz scores
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          logline,
          format,
          genre,
          buzz_score,
          word_count,
          created_at,
          updated_at,
          profiles!owner_id!inner (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_visibility,
            discoverable
          )
        `)
        .eq('visibility', 'public')
        .eq('profiles.discoverable', true)
        .order('buzz_score', { ascending: false })
        .limit(6)

      console.log('🔍 Featured projects query:', { data, error, count: data?.length })
      if (data?.length > 0) {
        console.log('🔍 First featured project:', data[0])
      }

      if (data) {
        setFeaturedProjects(data as any || [])
      }
    } catch (error) {
      console.error('Error loading featured projects:', error)
    }
  }

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const supabase = createSupabaseClient()
      
      let queryBuilder = supabase
        .from('projects')
        .select(`
          id,
          title,
          logline,
          format,
          genre,
          buzz_score,
          word_count,
          created_at,
          updated_at,
          profiles!owner_id!inner (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_visibility,
            discoverable
          )
        `)
        .eq('visibility', 'public')

      // Filter to only show projects from discoverable authors
      queryBuilder = queryBuilder.eq('profiles.discoverable', true)

      // Apply text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,logline.ilike.%${query}%,genre.ilike.%${query}%`
        )
      }

      // Apply filters
      if (filters.format !== 'all') {
        queryBuilder = queryBuilder.eq('format', filters.format)
      }
      if (filters.genre !== 'all') {
        queryBuilder = queryBuilder.eq('genre', filters.genre)
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          queryBuilder = queryBuilder.order('created_at', { ascending: false })
          break
        case 'title':
          queryBuilder = queryBuilder.order('title', { ascending: true })
          break
        default:
          queryBuilder = queryBuilder.order('buzz_score', { ascending: false })
      }

      const { data, error } = await queryBuilder.limit(20)

      console.log('🔍 Search results query:', { data, error, count: data?.length })
      if (data?.length > 0) {
        console.log('🔍 First search result:', data[0])
      }

      if (data) {
        setProjects(data as any || [])
      }
    } catch (error) {
      console.error('Error searching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const loadBookmarkStatus = async (projectIds: string[]) => {
    if (!currentUser || projectIds.length === 0) return
    
    const statusMap = await getMultipleBookmarkStatus(projectIds, currentUser.id)
    setBookmarkStatus(statusMap)
  }

  // Load bookmark status when projects change
  useEffect(() => {
    const allProjectIds = [...projects.map(p => p.id), ...featuredProjects.map(p => p.id)]
    if (allProjectIds.length > 0 && currentUser) {
      loadBookmarkStatus(allProjectIds)
    }
  }, [projects, featuredProjects, currentUser])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Discover Amazing Stories
            </h1>
            <p className="text-gray-600 mb-8">
              Explore screenplays, novels, and creative works from writers around the world
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for stories, genres, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full pl-12 pr-24 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none transition-colors ${
                  userRole === 'writer' 
                    ? 'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20' 
                    : 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
              />
              <button
                onClick={() => handleSearch()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-white px-4 py-2 rounded-lg transition-colors font-medium ${
                  userRole === 'writer'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                Search
              </button>
            </div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {TRENDING_SEARCHES.map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(term)
                    handleSearch(term)
                  }}
                  className={`px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full transition-colors ${
                    userRole === 'writer'
                      ? 'hover:text-orange-600 hover:bg-orange-50'
                      : 'hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Results */}
        {hasSearched ? (
          <div className="mb-8">
            {/* Search Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.format}
                    onChange={(e) => {
                      setFilters({ ...filters, format: e.target.value })
                      handleSearch()
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Formats</option>
                    <option value="screenplay">Screenplay</option>
                    <option value="treatment">Treatment</option>
                    <option value="novel">Novel</option>
                    <option value="short_story">Short Story</option>
                    <option value="pilot">TV Pilot</option>
                  </select>

                  <select
                    value={filters.genre}
                    onChange={(e) => {
                      setFilters({ ...filters, genre: e.target.value })
                      handleSearch()
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Genres</option>
                    {FEATURED_GENRES.map(genre => (
                      <option key={genre.name} value={genre.name}>{genre.name}</option>
                    ))}
                  </select>

                  <select
                    value={filters.sortBy}
                    onChange={(e) => {
                      setFilters({ ...filters, sortBy: e.target.value })
                      handleSearch()
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="buzz_score">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
                  userRole === 'writer' 
                    ? 'border-orange-500' 
                    : 'border-purple-500'
                }`}></div>
                <p className="text-gray-600">Searching...</p>
              </div>
            ) : projects.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Search Results ({projects.length})
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}?from=search`}>
                      <div className={`group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer ${
                        userRole === 'writer' 
                          ? 'hover:border-orange-300' 
                          : 'hover:border-purple-300'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:bg-orange-50 group-hover:text-orange-700'
                                : 'group-hover:bg-purple-50 group-hover:text-purple-700'
                            }`}>
                              {project.format}
                            </span>
                            {project.genre && (
                              <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                                userRole === 'writer'
                                  ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'
                                  : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                              }`}>
                                {project.genre}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleToggleBookmark(project.id)
                              }}
                              className={`p-1 transition-all duration-200 transform hover:scale-110 ${
                                bookmarkStatus[project.id]
                                  ? `text-${colors.primary} hover:text-${colors.primaryHover}`
                                  : `text-gray-400 hover:text-${colors.primary}`
                              }`}
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarkStatus[project.id] ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Handle share action
                              }}
                              className="p-1 text-gray-400 hover:text-orange-500 transition-all duration-200 transform hover:scale-110"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-200">
                          {project.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                          {project.logline}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 group-hover:text-gray-600 transition-colors duration-200">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className={`w-3 h-3 transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:text-orange-500'
                                : 'group-hover:text-purple-500'
                            }`} />
                            <span>{project.buzz_score} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className={`w-3 h-3 transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:text-orange-500'
                                : 'group-hover:text-purple-500'
                            }`} />
                            <span>{formatDate(project.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 group-hover:text-gray-600 transition-colors duration-200">
                          <div className="flex items-center space-x-1">
                            <FileText className={`w-3 h-3 transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:text-orange-500'
                                : 'group-hover:text-purple-500'
                            }`} />
                            <span>{project.word_count ? `${project.word_count.toLocaleString()} words` : 'No word count'}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <UserAvatar 
                            user={{
                              avatar_url: project.profiles?.avatar_url,
                              display_name: project.profiles?.display_name,
                              first_name: project.profiles?.first_name,
                              last_name: project.profiles?.last_name
                            }}
                            size="custom"
                            className={`w-6 h-6 transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:bg-orange-100'
                                : 'group-hover:bg-purple-100'
                            }`}
                            fallbackClassName={`text-xs font-medium text-gray-600 transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'group-hover:text-orange-700'
                                : 'group-hover:text-purple-700'
                            }`}
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                            by{' '}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!isProfileInteractionDisabled(project.profiles)) {
                                  setSelectedProfileId(project.profiles?.id || null)
                                }
                              }}
                              disabled={isProfileInteractionDisabled(project.profiles)}
                              className={`transition-colors ${
                                isProfileInteractionDisabled(project.profiles)
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'hover:text-purple-600 hover:underline'
                              }`}
                            >
                              {getAuthorDisplay(project.profiles)}
                            </button>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Projects */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Flame className={`w-5 h-5 ${
                  userRole === 'writer' ? 'text-orange-500' : 'text-purple-500'
                }`} />
                <h2 className="text-2xl font-bold text-gray-800">Trending Stories</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}?from=search`}>
                    <div className={`group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer ${
                      userRole === 'writer' 
                        ? 'hover:border-orange-300' 
                        : 'hover:border-purple-300'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full transition-colors duration-200 ${
                            userRole === 'writer'
                              ? 'group-hover:bg-orange-50 group-hover:text-orange-700'
                              : 'group-hover:bg-purple-50 group-hover:text-purple-700'
                          }`}>
                            {project.format}
                          </span>
                          {project.genre && (
                            <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                              userRole === 'writer'
                                ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'
                                : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                            }`}>
                              {project.genre}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-purple-500 group-hover:text-purple-600 transition-colors duration-200">
                          <Flame className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-xs font-medium">{project.buzz_score}</span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-200">
                        {project.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                        {project.logline}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 group-hover:text-gray-600 transition-colors duration-200">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 group-hover:text-purple-500 transition-colors duration-200" />
                          <span>{project.word_count ? `${project.word_count.toLocaleString()} words` : 'No word count'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                        <div className="flex items-center space-x-2">
                          <UserAvatar 
                            user={{
                              avatar_url: project.profiles?.avatar_url,
                              display_name: project.profiles?.display_name,
                              first_name: project.profiles?.first_name,
                              last_name: project.profiles?.last_name
                            }}
                            size="custom"
                            className="w-6 h-6 group-hover:bg-purple-100 transition-colors duration-200"
                            fallbackClassName="text-xs font-medium text-gray-600 group-hover:text-purple-700 transition-colors duration-200"
                          />
                          <span className="group-hover:text-gray-700 transition-colors duration-200">
                            {getAuthorDisplay(project.profiles)}
                          </span>
                        </div>
                        <span className="group-hover:text-gray-700 transition-colors duration-200">{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Browse by Genre */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse by Genre</h2>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                {FEATURED_GENRES.map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => {
                      setSearchQuery(genre.name)
                      setFilters({ ...filters, genre: genre.name })
                      handleSearch(genre.name)
                    }}
                    className="p-4 text-center rounded-xl border border-gray-200 hover:border-purple-300 transition-colors group"
                  >
                    <div className={`w-12 h-12 ${genre.color} rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="text-lg font-semibold">{genre.name[0]}</span>
                    </div>
                    <div className="font-medium text-gray-800 mb-1">{genre.name}</div>
                    <div className="text-xs text-gray-500">{genre.count} stories</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfileId && (
        <ProfileModal
          profileId={selectedProfileId}
          currentUserRole={userRole}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  )
}