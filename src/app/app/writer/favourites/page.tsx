'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  Search, 
  Filter,
  Star,
  BookOpen,
  Calendar,
  Eye,
  Clock,
  TrendingUp,
  FileText,
  User,
  MoreHorizontal,
  Share2,
  Bookmark
} from 'lucide-react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'

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

interface FavouriteProject {
  id: string
  project_id: string
  actor_id: string
  kind: string
  weight: number
  created_at: string
  projects: Project
}

interface FavouritesStats {
  totalFavourites: number
  screenplays: number
  novels: number
  addedThisMonth: number
}

export default function WriterFavouritesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [favourites, setFavourites] = useState<FavouriteProject[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'screenplay' | 'novel' | 'treatment'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'popular' | 'oldest'>('recent')
  
  const [stats, setStats] = useState<FavouritesStats>({
    totalFavourites: 0,
    screenplays: 0,
    novels: 0,
    addedThisMonth: 0
  })

  useEffect(() => {
    loadUserAndFavourites()
  }, [])

  const loadUserAndFavourites = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setCurrentUser(user)

      // Load favourites data
      await loadFavouritesData(user.id)
      
    } catch (error) {
      console.error('Error loading user and favourites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFavouritesData = async (userId: string) => {
    try {
      const supabase = createSupabaseClient()

      // Load favourited projects (projects the user liked/hearted)
      const { data: favouritesData, error: favouritesError } = await supabase
        .from('engagement_events')
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
        .eq('actor_id', userId)
        .eq('kind', 'like')
        .order('created_at', { ascending: false })

      if (favouritesError) {
        console.error('Error loading favourites:', favouritesError)
        return
      }

      // If we have favourites data, fetch the profile information separately
      if (favouritesData && favouritesData.length > 0) {
        const ownerIds = [...new Set(favouritesData.map(f => f.projects?.owner_id).filter(Boolean))]
        
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, verified_pro')
            .in('id', ownerIds)

          // Attach profiles to projects
          favouritesData.forEach(favourite => {
            if (favourite.projects && favourite.projects.owner_id) {
              favourite.projects.profiles = profiles?.find(p => p.id === favourite.projects.owner_id) || null
            }
          })
        }

        setFavourites(favouritesData)

        // Calculate stats
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const screenplays = favouritesData.filter(f => 
          f.projects?.format === 'screenplay'
        ).length
        
        const novels = favouritesData.filter(f => 
          f.projects?.format === 'novel'
        ).length
        
        const addedThisMonth = favouritesData.filter(f => 
          new Date(f.created_at) >= thisMonth
        ).length

        setStats({
          totalFavourites: favouritesData.length,
          screenplays,
          novels,
          addedThisMonth
        })
      }

    } catch (error) {
      console.error('Error loading favourites data:', error)
    }
  }

  const handleUnfavourite = async (projectId: string) => {
    if (!confirm('Remove this project from your favourites?')) return

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('engagement_events')
        .delete()
        .eq('actor_id', currentUser.id)
        .eq('project_id', projectId)
        .eq('kind', 'like')

      if (error) throw error

      // Remove from local state
      setFavourites(prev => prev.filter(f => f.project_id !== projectId))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalFavourites: prev.totalFavourites - 1
      }))

    } catch (error) {
      console.error('Error removing favourite:', error)
    }
  }

  const getFilteredFavourites = () => {
    let filtered = favourites

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.projects?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.projects?.logline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.projects?.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply format filter
    if (filter !== 'all') {
      filtered = filtered.filter(f => f.projects?.format === filter)
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => 
          (a.projects?.title || '').localeCompare(b.projects?.title || '')
        )
        break
      case 'popular':
        filtered.sort((a, b) => 
          (b.projects?.buzz_score || 0) - (a.projects?.buzz_score || 0)
        )
        break
      case 'oldest':
        filtered.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        break
      case 'recent':
      default:
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return filtered
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favourites...</p>
        </div>
      </div>
    )
  }

  const filteredFavourites = getFilteredFavourites()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <Heart className="w-8 h-8 text-orange-600 fill-current" />
              <span>Favourites</span>
            </h1>
            <p className="text-gray-600 mt-2">Projects you've loved and want to revisit</p>
          </div>
          
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/app/search">
              <Search className="w-4 h-4 mr-2" />
              Discover More
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Favourites</CardTitle>
              <Heart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFavourites}</div>
              <p className="text-xs text-muted-foreground">Loved projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Screenplays</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.screenplays}</div>
              <p className="text-xs text-muted-foreground">Film & TV scripts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novels</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.novels}</div>
              <p className="text-xs text-muted-foreground">Books & stories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.addedThisMonth}</div>
              <p className="text-xs text-muted-foreground">Recently loved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All ({stats.totalFavourites})
                </button>
                <button
                  onClick={() => setFilter('screenplay')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'screenplay'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Screenplays ({stats.screenplays})
                </button>
                <button
                  onClick={() => setFilter('novel')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'novel'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Novels ({stats.novels})
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search favourites..."
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
                  <option value="recent">Recently Added</option>
                  <option value="title">Title A-Z</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Favourites Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFavourites.length === 0 ? (
            <div className="lg:col-span-2 xl:col-span-3">
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {searchQuery ? 'No favourites found' : 'No favourites yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms.'
                      : 'Start favouriting amazing projects to see them here.'
                    }
                  </p>
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href="/app/search">
                      <Search className="w-4 h-4 mr-2" />
                      Discover Projects
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredFavourites.map((favourite) => {
              const project = favourite.projects
              if (!project) return null

              return (
                <div key={favourite.id} className="group relative">
                  <Link href={`/projects/${project.id}?from=favourites`} className="block">
                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-[1.02] group-hover:border-orange-300 overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-orange-700 transition-colors duration-200">
                                {project.title}
                              </h3>
                              <Heart className="w-4 h-4 text-orange-500 fill-current flex-shrink-0" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              by {project.profiles?.display_name || 'Unknown Author'}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">{project.logline}</p>
                          </div>
                          
                          {/* Action Menu */}
                          <div className="flex flex-col items-end space-y-1 ml-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleUnfavourite(project.id)
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Remove from favourites"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                            <div className="text-xs text-gray-400">
                              {project.word_count ? `${project.word_count.toLocaleString()} words` : 'No word count'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          {/* Project Stats */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{project.buzz_score || 0} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>Favourited</span>
                            </div>
                          </div>

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
                                {new Date(favourite.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Action Button - Animated expansion */}
                          <div className="overflow-hidden transition-all duration-300 ease-out max-h-0 group-hover:max-h-16">
                            <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-75 mt-3 pt-3 border-t border-gray-100">
                              <button 
                                className="w-full flex items-center justify-center space-x-2 text-orange-700 hover:text-orange-800 hover:bg-orange-50 transition-all duration-200 py-2 rounded-lg transform hover:scale-[1.02] hover:shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/projects/${project.id}?from=favourites`);
                                }}
                              >
                                <BookOpen className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-200" />
                                <span className="font-medium">Read Project</span>
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
        {filteredFavourites.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No favourites found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse all favourites.
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
