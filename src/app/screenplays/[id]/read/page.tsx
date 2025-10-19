'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Film,
  Settings,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Clock,
  User,
  Bookmark,
  BookmarkCheck,
  Download,
  Printer,
  Moon,
  Sun,
  Minus,
  Plus,
  X,
  LogOut
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { toggleProjectBookmark, isProjectBookmarked } from '@/lib/bookmarks'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user-avatar'

interface Project {
  id: string
  title: string
  logline: string
  synopsis: string | null
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
  }
}

interface ScreenplayElement {
  id: string
  element_type: string
  content: string
  character_name: string | null
  metadata: any
  sort_order: number
}

interface ReadingSettings {
  fontSize: number
  theme: 'light' | 'dark'
}

export default function ReadScreenplayPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [elements, setElements] = useState<ScreenplayElement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    scenes: 0,
    pages: 0,
    characters: 0,
    runtime: 0
  })
  
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 12,
    theme: 'light'
  })

  useEffect(() => {
    loadScreenplay()
    checkAuth()
  }, [params.id])

  const checkAuth = async () => {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user && params.id) {
      const bookmarked = await isProjectBookmarked(params.id as string, user.id)
      setIsBookmarked(bookmarked)
    }
  }

  const loadScreenplay = async () => {
    try {
      setIsLoading(true)
      const supabase = createSupabaseClient()
      
      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:owner_id (
            display_name,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Load screenplay elements
      const { data: elementsData, error: elementsError } = await supabase
        .from('screenplay_elements')
        .select('*')
        .eq('project_id', params.id)
        .order('sort_order', { ascending: true })

      if (elementsData && elementsData.length > 0) {
        setElements(elementsData)
        calculateStats(elementsData)
      } else {
        // Fallback to project_content if no elements in new table
        const { data: contentData } = await supabase
          .from('project_content')
          .select('content')
          .eq('project_id', params.id)
          .single()

        if (contentData?.content) {
          const parsedElements = JSON.parse(contentData.content)
          setElements(parsedElements)
          calculateStats(parsedElements)
        }
      }
    } catch (error) {
      console.error('Error loading screenplay:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (elements: any[]) => {
    const scenes = elements.filter(el => el.element_type === 'scene_heading' || el.type === 'scene_heading').length
    const characters = new Set(
      elements
        .filter(el => (el.element_type === 'character' || el.type === 'character') && el.content)
        .map(el => el.content?.trim().toUpperCase())
    ).size
    const pages = Math.ceil(elements.length / 8)
    const runtime = Math.round(pages * 0.8)

    setStats({ scenes, pages, characters, runtime })
  }

  const getElementStyle = (type: string) => {
    switch (type) {
      case 'scene_heading':
        return 'font-bold uppercase tracking-wide mb-4'
      case 'action':
        return 'text-left mb-3'
      case 'character':
        return 'text-center font-semibold uppercase tracking-wide mt-4 mb-1'
      case 'dialogue':
        return 'text-center max-w-md mx-auto mb-2'
      case 'parenthetical':
        return 'text-center italic text-gray-600 max-w-sm mx-auto mb-1'
      case 'transition':
        return 'text-right font-semibold uppercase tracking-wide mt-4 mb-4'
      default:
        return ''
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    await toggleProjectBookmark(params.id as string, user.id)
    setIsBookmarked(!isBookmarked)
  }

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const exportScreenplay = () => {
    const screenplayText = elements.map(el => {
      const type = el.element_type || (el as any).type
      const content = el.content
      
      switch (type) {
        case 'scene_heading':
          return `\n${content.toUpperCase()}\n`
        case 'action':
          return `\n${content}\n`
        case 'character':
          return `\n                    ${content.toUpperCase()}\n`
        case 'dialogue':
          return `              ${content}\n`
        case 'parenthetical':
          return `                (${content})\n`
        case 'transition':
          return `\n                                        ${content.toUpperCase()}\n`
        default:
          return content
      }
    }).join('')

    const blob = new Blob([screenplayText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.title?.replace(/\s+/g, '_') || 'screenplay'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screenplay...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Screenplay Not Found</h2>
          <p className="text-gray-600 mb-6">This screenplay doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const themeClasses = readingSettings.theme === 'dark'
    ? 'bg-gray-900 text-gray-100'
    : 'bg-white text-gray-900'

  return (
    <div className={`min-h-screen ${readingSettings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${readingSettings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className={readingSettings.theme === 'dark' ? 'text-gray-300 hover:text-white' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="hidden md:block">
                <h1 className={`font-bold ${readingSettings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {project.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{project.profiles?.display_name}</span>
                  {project.genre && (
                    <>
                      <span>•</span>
                      <span>{project.genre}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Stats */}
              <div className="hidden lg:flex items-center gap-4 mr-4 text-sm">
                <div className={`flex items-center gap-1 ${readingSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Film className="w-4 h-4" />
                  <span>{stats.scenes} scenes</span>
                </div>
                <div className={`flex items-center gap-1 ${readingSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Eye className="w-4 h-4" />
                  <span>{stats.pages} pages</span>
                </div>
                <div className={`flex items-center gap-1 ${readingSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Clock className="w-4 h-4" />
                  <span>~{stats.runtime} min</span>
                </div>
              </div>

              {/* Actions */}
              {user && user.id === project.owner_id && (
                <Button
                  onClick={() => router.push(`/screenplays/${params.id}/edit`)}
                  className="mr-2"
                >
                  Edit Screenplay
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={readingSettings.theme === 'dark' ? 'text-gray-300 hover:text-white' : ''}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={exportScreenplay}
                className={readingSettings.theme === 'dark' ? 'text-gray-300 hover:text-white' : ''}
              >
                <Download className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className={readingSettings.theme === 'dark' ? 'text-gray-300 hover:text-white' : ''}
              >
                <Printer className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={readingSettings.theme === 'dark' ? 'text-gray-300 hover:text-white' : ''}
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* User Avatar Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none ml-2">
                      <UserAvatar user={user} size="sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-50">
                    <DropdownMenuLabel className="font-semibold">
                      {user.email || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/app/settings')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/app/settings')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b ${readingSettings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} px-4 py-4`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${readingSettings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Reading Settings
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Font Size */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${readingSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Font Size
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReadingSettings(prev => ({ ...prev, fontSize: Math.max(10, prev.fontSize - 1) }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className={readingSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                    {readingSettings.fontSize}pt
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReadingSettings(prev => ({ ...prev, fontSize: Math.min(20, prev.fontSize + 1) }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${readingSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Theme
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={readingSettings.theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReadingSettings(prev => ({ ...prev, theme: 'light' }))}
                  >
                    <Sun className="w-4 h-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={readingSettings.theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReadingSettings(prev => ({ ...prev, theme: 'dark' }))}
                  >
                    <Moon className="w-4 h-4 mr-1" />
                    Dark
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenplay Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div 
          className={`${themeClasses} rounded-lg shadow-lg p-12 min-h-[11in]`}
          style={{
            fontFamily: 'Courier, monospace',
            fontSize: `${readingSettings.fontSize}pt`,
            lineHeight: '1.5'
          }}
        >
          {/* Title Page */}
          <div className="text-center mb-12 pb-12 border-b border-gray-300">
            <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
            {project.logline && (
              <p className="text-lg mb-6 italic">{project.logline}</p>
            )}
            <div className="space-y-2 text-sm">
              <p>Written by</p>
              <p className="font-semibold">{project.profiles?.display_name}</p>
              {project.genre && (
                <p className="mt-4 text-gray-600">{project.genre}</p>
              )}
            </div>
          </div>

          {/* Screenplay Elements */}
          <div className="space-y-2">
            {elements.map((element, index) => {
              const type = element.element_type || (element as any).type
              const content = element.content
              
              return (
                <div
                  key={element.id || index}
                  className={getElementStyle(type)}
                >
                  {content}
                </div>
              )
            })}
          </div>

          {elements.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No screenplay content available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
