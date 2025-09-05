'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Clock,
  User,
  Bookmark,
  BookmarkCheck,
  Moon,
  Sun,
  Minus,
  Plus,
  Palette,
  Type
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface Novel {
  id: string
  title: string
  logline: string
  description: string | null
  genre: string | null
  word_count: number
  buzz_score: number
  created_at: string
  updated_at: string
  owner_id: string
  visibility: 'private' | 'preview' | 'public'
  profiles: {
    display_name: string
    avatar_url?: string
    profile_visibility: string
  }
}

interface Chapter {
  id: string
  title: string
  content: string
  chapter_number: number
  word_count: number
  created_at: string
  updated_at: string
}

interface ReadingSettings {
  fontSize: number
  fontFamily: string
  theme: 'light' | 'dark' | 'sepia'
  lineHeight: number
  maxWidth: number
}

export default function ReadNovelPage() {
  const router = useRouter()
  const params = useParams()
  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showChapterList, setShowChapterList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [readingProgress, setReadingProgress] = useState(0)
  
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'Inter',
    theme: 'light',
    lineHeight: 1.6,
    maxWidth: 700
  })

  const novelId = params.id as string

  useEffect(() => {
    loadNovel()
    loadUser()
    loadReadingSettings()
  }, [novelId])

  useEffect(() => {
    if (chapters.length > 0 && currentChapterIndex >= 0) {
      setCurrentChapter(chapters[currentChapterIndex])
    }
  }, [chapters, currentChapterIndex])

  // Save reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1) * 100
      setReadingProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadUser = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if bookmarked
        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', novelId)
          .single()
        
        setIsBookmarked(!!bookmark)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadReadingSettings = () => {
    try {
      const saved = localStorage.getItem('novel-reading-settings')
      if (saved) {
        setReadingSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading reading settings:', error)
    }
  }

  const saveReadingSettings = (settings: ReadingSettings) => {
    setReadingSettings(settings)
    localStorage.setItem('novel-reading-settings', JSON.stringify(settings))
  }

  const loadNovel = async () => {
    try {
      // Load novel data from API
      const response = await fetch(`/api/novels/${novelId}`)
      console.log('Novel API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Novel API error:', errorData)
        
        if (response.status === 404) {
          console.error('Novel not found:', errorData.error || 'Unknown error')
          router.push('/app/search')
          return
        }
        if (response.status === 403) {
          console.error('Novel is private:', errorData.error || 'Access denied')
          router.push('/app/search')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`)
      }

      const { novel: novelData, chapters: chaptersData } = await response.json()
      setNovel(novelData)
      setChapters(chaptersData || [])

    } catch (error) {
      console.error('Error loading novel:', error)
      router.push('/app/search')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBookmark = async () => {
    if (!user) return

    try {
      const supabase = createSupabaseClient()

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', novelId)
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            project_id: novelId
          })
      }

      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1)
      window.scrollTo(0, 0)
    } else if (direction === 'next' && currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1)
      window.scrollTo(0, 0)
    }
  }

  const getThemeClasses = () => {
    switch (readingSettings.theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100'
      case 'sepia':
        return 'bg-amber-50 text-amber-900'
      default:
        return 'bg-white text-gray-900'
    }
  }

  const getContentThemeClasses = () => {
    switch (readingSettings.theme) {
      case 'dark':
        return 'bg-gray-800 text-gray-100'
      case 'sepia':
        return 'bg-amber-25 text-amber-900'
      default:
        return 'bg-white text-gray-900'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading novel...</p>
        </div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Novel not found</h2>
          <p className="text-gray-600 mb-4">The novel you're looking for doesn't exist or isn't available.</p>
          <Link
            href="/app/search"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        readingSettings.theme === 'dark' 
          ? 'bg-gray-800/95 border-gray-700' 
          : readingSettings.theme === 'sepia'
          ? 'bg-amber-50/95 border-amber-200'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/app/search"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="font-semibold text-lg">{novel.title}</h1>
                  <p className="text-sm opacity-75">
                    by {novel.profiles?.profile_visibility === 'private' ? 'Anonymous Writer' : novel.profiles?.display_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Chapter Navigation */}
              {chapters.length > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => navigateChapter('prev')}
                    disabled={currentChapterIndex === 0}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm px-3 py-1 bg-gray-100 rounded-lg">
                    {currentChapterIndex + 1} / {chapters.length}
                  </span>
                  
                  <button
                    onClick={() => navigateChapter('next')}
                    disabled={currentChapterIndex === chapters.length - 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Chapter List"
              >
                <List className="w-5 h-5" />
              </button>

              {user && (
                <button
                  onClick={toggleBookmark}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
              )}

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Reading Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reading Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Chapter List Sidebar */}
        {showChapterList && (
          <div className={`w-80 border-r transition-colors duration-300 ${
            readingSettings.theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : readingSettings.theme === 'sepia'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              <h3 className="font-semibold mb-4">Chapters</h3>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setCurrentChapterIndex(index)
                      setShowChapterList(false)
                      window.scrollTo(0, 0)
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentChapterIndex
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{chapter.title}</div>
                    <div className="text-sm opacity-75">{chapter.word_count.toLocaleString()} words</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Sidebar */}
        {showSettings && (
          <div className={`w-80 border-r transition-colors duration-300 ${
            readingSettings.theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : readingSettings.theme === 'sepia'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              <h3 className="font-semibold mb-4">Reading Settings</h3>
              
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'light', icon: Sun, label: 'Light' },
                      { key: 'dark', icon: Moon, label: 'Dark' },
                      { key: 'sepia', icon: Palette, label: 'Sepia' }
                    ].map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => saveReadingSettings({ ...readingSettings, theme: key as any })}
                        className={`p-2 rounded-lg border transition-colors ${
                          readingSettings.theme === key
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => saveReadingSettings({ 
                        ...readingSettings, 
                        fontSize: Math.max(12, readingSettings.fontSize - 1) 
                      })}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm w-12 text-center">{readingSettings.fontSize}px</span>
                    <button
                      onClick={() => saveReadingSettings({ 
                        ...readingSettings, 
                        fontSize: Math.min(24, readingSettings.fontSize + 1) 
                      })}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium mb-2">Font</label>
                  <select
                    value={readingSettings.fontFamily}
                    onChange={(e) => saveReadingSettings({ ...readingSettings, fontFamily: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>

                {/* Line Height */}
                <div>
                  <label className="block text-sm font-medium mb-2">Line Height</label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={readingSettings.lineHeight}
                    onChange={(e) => saveReadingSettings({ 
                      ...readingSettings, 
                      lineHeight: parseFloat(e.target.value) 
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-center mt-1">{readingSettings.lineHeight}x</div>
                </div>

                {/* Max Width */}
                <div>
                  <label className="block text-sm font-medium mb-2">Content Width</label>
                  <input
                    type="range"
                    min="500"
                    max="900"
                    step="50"
                    value={readingSettings.maxWidth}
                    onChange={(e) => saveReadingSettings({ 
                      ...readingSettings, 
                      maxWidth: parseInt(e.target.value) 
                    })}
                    className="w-full"
                  />
                  <div className="text-sm text-center mt-1">{readingSettings.maxWidth}px</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div 
              className="mx-auto"
              style={{ maxWidth: `${readingSettings.maxWidth}px` }}
            >
              {/* Novel Info */}
              <div className={`rounded-xl border p-6 mb-8 transition-colors duration-300 ${getContentThemeClasses()} ${
                readingSettings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
                <p className="text-lg opacity-75 mb-4">{novel.logline}</p>
                
                <div className="flex items-center space-x-6 text-sm opacity-75">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{novel.profiles?.profile_visibility === 'private' ? 'Anonymous Writer' : novel.profiles?.display_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{chapters.length} chapters</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Type className="w-4 h-4" />
                    <span>{novel.word_count?.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{novel.buzz_score} views</span>
                  </div>
                </div>

                {novel.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="opacity-75">{novel.description}</p>
                  </div>
                )}
              </div>

              {/* Chapter Content */}
              {currentChapter ? (
                <div className={`rounded-xl border p-8 transition-colors duration-300 ${getContentThemeClasses()} ${
                  readingSettings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="mb-8">
                    <h2 
                      className="text-2xl font-bold mb-2"
                      style={{ 
                        fontFamily: readingSettings.fontFamily,
                        fontSize: `${readingSettings.fontSize + 8}px`
                      }}
                    >
                      {currentChapter.title}
                    </h2>
                    <div className="text-sm opacity-50">
                      Chapter {currentChapter.chapter_number} • {currentChapter.word_count.toLocaleString()} words
                    </div>
                  </div>

                  <div 
                    className="prose prose-lg max-w-none leading-relaxed"
                    style={{
                      fontFamily: readingSettings.fontFamily,
                      fontSize: `${readingSettings.fontSize}px`,
                      lineHeight: readingSettings.lineHeight
                    }}
                  >
                    {currentChapter.content.split('\n').map((paragraph, index) => (
                      paragraph.trim() ? (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ) : (
                        <div key={index} className="mb-4"></div>
                      )
                    ))}
                  </div>

                  {/* Chapter Navigation */}
                  <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={currentChapterIndex === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous Chapter</span>
                    </button>

                    <span className="text-sm opacity-75">
                      Chapter {currentChapterIndex + 1} of {chapters.length}
                    </span>

                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={currentChapterIndex === chapters.length - 1}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next Chapter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No chapters available</h3>
                  <p className="text-gray-600">This novel doesn't have any chapters yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
