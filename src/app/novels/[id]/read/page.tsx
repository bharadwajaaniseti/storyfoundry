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
  Type,
  X
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { toggleProjectBookmark, isProjectBookmarked } from '@/lib/bookmarks'
import ChapterComments from '@/components/chapter-comments'

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
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null)
  const [timeSpentReading, setTimeSpentReading] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [lastSavedProgress, setLastSavedProgress] = useState(0)
  
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'Inter',
    theme: 'light',
    lineHeight: 1.6,
    maxWidth: 700
  })

  // Function to process and render chapter content
  const renderChapterContent = (content: string) => {
    // If content contains HTML tags, render as HTML
    if (content.includes('<') && content.includes('>')) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: content }}
          className="prose prose-lg max-w-none leading-relaxed chapter-content rich-content"
          style={{
            fontFamily: readingSettings.fontFamily,
            fontSize: `${readingSettings.fontSize}px`,
            lineHeight: readingSettings.lineHeight
          }}
        />
      )
    }
    
    // Otherwise, process plain text with proper paragraph handling
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    
    return (
      <div 
        className="prose prose-lg max-w-none leading-relaxed chapter-content"
        style={{
          fontFamily: readingSettings.fontFamily,
          fontSize: `${readingSettings.fontSize}px`,
          lineHeight: readingSettings.lineHeight
        }}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-6 text-justify whitespace-pre-wrap">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    )
  }

  const novelId = params.id as string

  // Reading progress tracking functions
  const saveReadingProgress = async (percentage: number, position: number) => {
    if (!user) return

    try {
      const supabase = createSupabaseClient()

      console.log('Saving reading progress:', { 
        project_id: novelId, 
        user_id: user.id, 
        progress_percentage: percentage, 
        last_position: position 
      })

      // First try to check if a record exists
      const { data: existingProgress } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('project_id', novelId)
        .eq('user_id', user.id)
        .single()

      let result
      if (existingProgress) {
        // Update existing record
        result = await supabase
          .from('reading_progress')
          .update({
            progress_percentage: percentage,
            last_position: position,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', novelId)
          .eq('user_id', user.id)
      } else {
        // Insert new record
        result = await supabase
          .from('reading_progress')
          .insert({
            project_id: novelId,
            user_id: user.id,
            progress_percentage: percentage,
            last_position: position,
            updated_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('Error saving reading progress:', result.error)
        console.error('Error details:', JSON.stringify(result.error, null, 2))
      } else {
        console.log('Reading progress saved successfully:', result.data)
      }

    } catch (error) {
      console.error('Error saving reading progress (catch):', error)
    }
  }

  const markStoryCompleted = async (percentage: number, position: number, readingTimeMinutes?: number) => {
    if (!user) return

    try {
      const supabase = createSupabaseClient()

      await supabase
        .from('reading_progress')
        .upsert({
          project_id: novelId,
          user_id: user.id,
          progress_percentage: percentage,
          last_position: position,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reading_time_minutes: readingTimeMinutes || 0
        })

      console.log(`Novel marked as completed! Reading time: ${readingTimeMinutes?.toFixed(1)}min`)

    } catch (error) {
      console.error('Error marking novel as completed:', error)
    }
  }

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

  // Enhanced reading progress tracking with database saving
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1) * 100
      
      setReadingProgress(progress)
      setLastScrollPosition(scrollTop)
      
      // Start tracking reading time when user first scrolls
      if (readingStartTime === null && progress > 1) {
        setReadingStartTime(Date.now())
      }
      
      // Update time spent reading
      if (readingStartTime) {
        setTimeSpentReading(Date.now() - readingStartTime)
      }
      
      // Save progress to database (only save every 5% change to reduce database calls)
      if (user && progress > 0) {
        const progressRounded = Math.floor(progress / 5) * 5 // Round to nearest 5%
        if (progressRounded !== lastSavedProgress && progressRounded > lastSavedProgress) {
          setLastSavedProgress(progressRounded)
          saveReadingProgress(progress, scrollTop)
        }
      }
      
      // Mark as completed when reaching 95% or more (novels can be long)
      if (progress >= 95 && !isCompleted && user) {
        const timeSpentMinutes = timeSpentReading / (1000 * 60)
        setIsCompleted(true)
        markStoryCompleted(progress, scrollTop, timeSpentMinutes)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [user, readingStartTime, timeSpentReading, isCompleted, lastSavedProgress])

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && readingProgress > 0) {
        saveReadingProgress(readingProgress, lastScrollPosition)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user, readingProgress, lastScrollPosition])

  const loadUser = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if bookmarked using centralized system
        const bookmarkStatus = await isProjectBookmarked(novelId, user.id)
        setIsBookmarked(bookmarkStatus)
        
        // Load existing reading progress
        const { data: progress, error: progressError } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('project_id', novelId)
          .eq('user_id', user.id)
          .single()

        if (!progressError && progress) {
          setReadingProgress(progress.progress_percentage || 0)
          setIsCompleted(progress.is_completed || false)
          
          // Scroll to last position if user wants to continue
          if (progress.last_position > 0) {
            setTimeout(() => {
              window.scrollTo(0, progress.last_position)
            }, 1000) // Delay to allow content to load
          }
        }
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
      const newBookmarkStatus = await toggleProjectBookmark(novelId, user.id)
      setIsBookmarked(newBookmarkStatus)
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
      {/* Enhanced Header */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        readingSettings.theme === 'dark' 
          ? 'bg-gray-800/95 border-gray-700' 
          : readingSettings.theme === 'sepia'
          ? 'bg-amber-50/95 border-amber-200'
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-md shadow-sm`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/app/search"
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{novel.title}</h1>
                  <p className="text-sm text-gray-600">
                    by {novel.profiles?.profile_visibility === 'private' ? 'Anonymous Writer' : novel.profiles?.display_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Chapter Navigation */}
              {chapters.length > 1 && (
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-1">
                  <button
                    onClick={() => navigateChapter('prev')}
                    disabled={currentChapterIndex === 0}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm px-4 py-2 bg-white rounded-lg font-medium shadow-sm">
                    {currentChapterIndex + 1} / {chapters.length}
                  </span>
                  
                  <button
                    onClick={() => navigateChapter('next')}
                    disabled={currentChapterIndex === chapters.length - 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChapterList(!showChapterList)}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    showChapterList 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Chapter List"
                >
                  <List className="w-5 h-5" />
                </button>

                {user && (
                  <button
                    onClick={toggleBookmark}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      isBookmarked 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    showSettings 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Reading Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Reading Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>Reading Progress</span>
              <span>{Math.round(readingProgress)}% Complete</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Enhanced Chapter List Sidebar */}
        {showChapterList && (
          <div className={`w-80 border-r transition-colors duration-300 ${
            readingSettings.theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : readingSettings.theme === 'sepia'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Chapters</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {chapters.length} total
                </span>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setCurrentChapterIndex(index)
                      setShowChapterList(false)
                      window.scrollTo(0, 0)
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                      index === currentChapterIndex
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'hover:bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm mb-1 ${
                          index === currentChapterIndex ? 'text-white' : 'text-gray-900'
                        }`}>
                          Chapter {chapter.chapter_number}
                        </div>
                        <div className={`font-medium mb-2 truncate ${
                          index === currentChapterIndex ? 'text-white' : 'text-gray-800'
                        }`}>
                          {chapter.title}
                        </div>
                        <div className={`text-xs flex items-center space-x-2 ${
                          index === currentChapterIndex ? 'text-orange-100' : 'text-gray-500'
                        }`}>
                          <span>{chapter.word_count.toLocaleString()} words</span>
                          <span>•</span>
                          <span>~{Math.ceil(chapter.word_count / 200)} min read</span>
                        </div>
                      </div>
                      {index === currentChapterIndex && (
                        <div className="ml-3 bg-white/20 rounded-full p-1">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Settings Sidebar */}
        {showSettings && (
          <div className={`w-80 border-r transition-colors duration-300 ${
            readingSettings.theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : readingSettings.theme === 'sepia'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Reading Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Reading Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'light', icon: Sun, label: 'Light', color: 'bg-white border-gray-300' },
                      { key: 'dark', icon: Moon, label: 'Dark', color: 'bg-gray-800 border-gray-600 text-white' },
                      { key: 'sepia', icon: Palette, label: 'Sepia', color: 'bg-amber-50 border-amber-300 text-amber-900' }
                    ].map(({ key, icon: Icon, label, color }) => (
                      <button
                        key={key}
                        onClick={() => saveReadingSettings({ ...readingSettings, theme: key as any })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${color} ${
                          readingSettings.theme === key
                            ? 'ring-2 ring-orange-500 ring-offset-2'
                            : 'hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2" />
                        <div className="text-xs font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Font Size</label>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <button
                      onClick={() => saveReadingSettings({ 
                        ...readingSettings, 
                        fontSize: Math.max(12, readingSettings.fontSize - 1) 
                      })}
                      className="p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                      disabled={readingSettings.fontSize <= 12}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="bg-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm">
                      {readingSettings.fontSize}px
                    </div>
                    <button
                      onClick={() => saveReadingSettings({ 
                        ...readingSettings, 
                        fontSize: Math.min(24, readingSettings.fontSize + 1) 
                      })}
                      className="p-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                      disabled={readingSettings.fontSize >= 24}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Font Family</label>
                  <select
                    value={readingSettings.fontFamily}
                    onChange={(e) => saveReadingSettings({ ...readingSettings, fontFamily: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="Inter">Inter (Modern)</option>
                    <option value="Georgia">Georgia (Classic)</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial (Clean)</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>

                {/* Line Height */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Line Height</label>
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-sm text-center mt-2 text-gray-600">{readingSettings.lineHeight}x</div>
                </div>

                {/* Max Width */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Content Width</label>
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-sm text-center mt-2 text-gray-600">{readingSettings.maxWidth}px</div>
                </div>

                {/* Reset to Defaults */}
                <button
                  onClick={() => saveReadingSettings({
                    fontSize: 16,
                    fontFamily: 'Inter',
                    theme: 'light',
                    lineHeight: 1.6,
                    maxWidth: 700
                  })}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-6 py-8">
            <div 
              className="mx-auto"
              style={{ maxWidth: `${readingSettings.maxWidth}px` }}
            >
              {/* Enhanced Novel Info Card */}
              <div className={`glass-card p-8 mb-8 transition-all duration-300 ${getContentThemeClasses()} ${
                readingSettings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              } shadow-lg hover:shadow-xl`}>
                <div className="flex items-start space-x-6 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-3 text-gradient">{novel.title}</h1>
                    <p className="text-xl text-gray-600 mb-4 leading-relaxed">{novel.logline}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {novel.profiles?.profile_visibility === 'private' ? 'Anonymous Writer' : novel.profiles?.display_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-700">{chapters.length} chapters</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                        <Type className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-700">{novel.word_count?.toLocaleString()} words</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                        <Eye className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-purple-700">{novel.buzz_score} views</span>
                      </div>
                    </div>
                  </div>
                </div>

                {novel.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed text-lg">{novel.description}</p>
                  </div>
                )}
              </div>

              {/* Enhanced Chapter Content */}
              {currentChapter ? (
                <div className={`glass-card p-8 transition-all duration-300 ${getContentThemeClasses()} ${
                  readingSettings.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                } shadow-lg`}>
                  {/* Chapter Header */}
                  <div className="mb-8 text-center">
                    <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full mb-4 shadow-lg">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-semibold">Chapter {currentChapter.chapter_number}</span>
                    </div>
                    <h2 
                      className="text-3xl font-bold mb-3 text-gradient"
                      style={{ 
                        fontFamily: readingSettings.fontFamily,
                        fontSize: `${readingSettings.fontSize + 12}px`
                      }}
                    >
                      {currentChapter.title}
                    </h2>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Type className="w-4 h-4" />
                        <span>{currentChapter.word_count.toLocaleString()} words</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>~{Math.ceil(currentChapter.word_count / 200)} min read</span>
                      </span>
                    </div>
                  </div>

                  {/* Chapter Content */}
                  {renderChapterContent(currentChapter.content)}

                  {/* Enhanced Chapter Navigation */}
                  <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-200">
                    <button
                      onClick={() => navigateChapter('prev')}
                      disabled={currentChapterIndex === 0}
                      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <div className="text-left">
                        <div className="text-xs opacity-75">Previous</div>
                        <div className="font-semibold">Chapter {currentChapterIndex}</div>
                      </div>
                    </button>

                    <div className="text-center bg-gray-50 px-6 py-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Reading Progress</div>
                      <div className="font-semibold text-gray-700">
                        Chapter {currentChapterIndex + 1} of {chapters.length}
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigateChapter('next')}
                      disabled={currentChapterIndex === chapters.length - 1}
                      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <div className="text-right">
                        <div className="text-xs opacity-75">Next</div>
                        <div className="font-semibold">Chapter {currentChapterIndex + 2}</div>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">No chapters available</h3>
                  <p className="text-gray-500 text-lg">This novel doesn't have any chapters yet.</p>
                </div>
              )}

              {/* Chapter Comments & Reviews Section */}
              {currentChapter && (
                <ChapterComments 
                  chapterId={currentChapter.id} 
                  className="mt-8"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
