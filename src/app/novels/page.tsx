'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen,
  Eye,
  User,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Heart
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface PublicNovel {
  id: string
  title: string
  logline: string
  description: string | null
  genre: string | null
  word_count: number
  buzz_score: number
  created_at: string
  updated_at: string
  profiles: {
    display_name: string
    avatar_url?: string
    profile_visibility: string
  }
}

export default function NovelsPage() {
  const router = useRouter()
  const [novels, setNovels] = useState<PublicNovel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('buzz_score')
  
  const genres = [
    'all', 'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller', 
    'Literary Fiction', 'Historical Fiction', 'Horror', 'Adventure', 'Drama'
  ]

  useEffect(() => {
    loadNovels()
  }, [selectedGenre, sortBy])

  const loadNovels = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()
      
      let query = supabase
        .from('projects')
        .select(`
          id,
          title,
          logline,
          description,
          genre,
          word_count,
          buzz_score,
          created_at,
          updated_at,
          profiles!owner_id (
            display_name,
            avatar_url,
            profile_visibility,
            discoverable
          )
        `)
        .eq('format', 'novel')
        .eq('visibility', 'public')
        .eq('profiles.discoverable', true)

      if (selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre)
      }

      // Sort order
      if (sortBy === 'buzz_score') {
        query = query.order('buzz_score', { ascending: false })
      } else if (sortBy === 'created_at') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'updated_at') {
        query = query.order('updated_at', { ascending: false })
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: true })
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error loading novels:', error)
      } else {
        // Transform the data to match our interface
        const transformedNovels = (data || []).map(novel => ({
          ...novel,
          profiles: Array.isArray(novel.profiles) ? novel.profiles[0] : novel.profiles
        })) as PublicNovel[]
        setNovels(transformedNovels)
      }
    } catch (error) {
      console.error('Error loading novels:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNovels = novels.filter(novel =>
    novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    novel.logline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    novel.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Discover Novels
              </h1>
              <p className="text-gray-600 mt-2">Explore amazing stories from talented writers</p>
            </div>
            
            <Link 
              href="/app/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search novels, authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="buzz_score">Most Popular</option>
              <option value="created_at">Recently Published</option>
              <option value="updated_at">Recently Updated</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${filteredNovels.length} novels found`}
          </p>
        </div>

        {/* Novels Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNovels.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No novels found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNovels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => router.push(`/novels/${novel.id}/read`)}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {novel.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {novel.logline}
                  </p>
                  
                  {novel.genre && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {novel.genre}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{novel.buzz_score}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{novel.word_count?.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {novel.profiles?.profile_visibility === 'private' 
                        ? 'Anonymous Writer' 
                        : novel.profiles?.display_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(novel.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredNovels.length > 0 && filteredNovels.length % 50 === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadNovels}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load More Novels
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
