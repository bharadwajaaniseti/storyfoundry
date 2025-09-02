'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit3, 
  Save, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Target,
  Calendar,
  Clock,
  BookOpen,
  Trash2,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Check,
  X
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  content: string
  word_count: number
  target_word_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  created_at: string
  updated_at: string
}

interface NovelProject {
  id: string
  title: string
  word_count: number
  target_word_count?: number
  format: string
}

interface NovelWriterProps {
  projectId: string
  project: NovelProject
}

export default function NovelWriter({ projectId, project }: NovelWriterProps) {
  const router = useRouter()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [showChapterList, setShowChapterList] = useState(true)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [showNewChapterForm, setShowNewChapterForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editChapterTitle, setEditChapterTitle] = useState('')
  const [editChapterNotes, setEditChapterNotes] = useState('')

  useEffect(() => {
    loadChapters()
  }, [projectId])

  const loadChapters = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: chaptersData, error } = await supabase
        .from('project_chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })

      if (error) throw error

      setChapters(chaptersData || [])
      
      // Set first chapter as active if exists
      if (chaptersData && chaptersData.length > 0) {
        setActiveChapter(chaptersData[0])
      }
    } catch (error) {
      console.error('Error loading chapters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChapter = async () => {
    if (!newChapterTitle.trim()) return

    try {
      const supabase = createSupabaseClient()
      const nextChapterNumber = Math.max(...chapters.map(c => c.chapter_number), 0) + 1

      const { data: newChapter, error } = await supabase
        .from('project_chapters')
        .insert({
          project_id: projectId,
          chapter_number: nextChapterNumber,
          title: newChapterTitle.trim(),
          content: '',
          target_word_count: 10000
        })
        .select()
        .single()

      if (error) throw error

      setChapters([...chapters, newChapter])
      setActiveChapter(newChapter)
      setNewChapterTitle('')
      setShowNewChapterForm(false)
    } catch (error) {
      console.error('Error creating chapter:', error)
    }
  }

  const saveChapter = async (chapter: Chapter) => {
    if (!chapter) return

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('project_chapters')
        .update({
          title: chapter.title,
          content: chapter.content,
          target_word_count: chapter.target_word_count,
          status: chapter.status,
          notes: chapter.notes
        })
        .eq('id', chapter.id)

      if (error) throw error

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (error) {
      console.error('Error saving chapter:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const updateActiveChapter = (updates: Partial<Chapter>) => {
    if (!activeChapter) return

    const updatedChapter = { ...activeChapter, ...updates }
    
    // Calculate word count if content changed
    if (updates.content !== undefined) {
      const wordCount = updates.content.trim().split(/\s+/).filter(word => word.length > 0).length
      updatedChapter.word_count = wordCount
    }
    
    setActiveChapter(updatedChapter)
    
    // Update in chapters array
    setChapters(chapters.map(c => 
      c.id === activeChapter.id ? updatedChapter : c
    ))
  }

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('project_chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error

      const updatedChapters = chapters.filter(c => c.id !== chapterId)
      setChapters(updatedChapters)
      
      if (activeChapter?.id === chapterId) {
        setActiveChapter(updatedChapters[0] || null)
      }
    } catch (error) {
      console.error('Error deleting chapter:', error)
    }
  }

  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapter(chapter.id)
    setEditChapterTitle(chapter.title)
    setEditChapterNotes(chapter.notes || '')
  }

  const saveChapterEdit = async (chapterId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('project_chapters')
        .update({
          title: editChapterTitle,
          notes: editChapterNotes
        })
        .eq('id', chapterId)

      if (error) throw error

      // Update local state
      setChapters(chapters.map(c => 
        c.id === chapterId 
          ? { ...c, title: editChapterTitle, notes: editChapterNotes }
          : c
      ))

      if (activeChapter?.id === chapterId) {
        setActiveChapter({ ...activeChapter, title: editChapterTitle, notes: editChapterNotes })
      }

      setEditingChapter(null)
    } catch (error) {
      console.error('Error updating chapter:', error)
    }
  }

  const cancelChapterEdit = () => {
    setEditingChapter(null)
    setEditChapterTitle('')
    setEditChapterNotes('')
  }

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!activeChapter) return

    const currentIndex = chapters.findIndex(c => c.id === activeChapter.id)
    let nextIndex

    if (direction === 'prev') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : chapters.length - 1
    } else {
      nextIndex = currentIndex < chapters.length - 1 ? currentIndex + 1 : 0
    }

    setActiveChapter(chapters[nextIndex])
  }

  const getChapterProgress = () => {
    if (!activeChapter) return 0
    return Math.min((activeChapter.word_count / activeChapter.target_word_count) * 100, 100)
  }

  const getTotalProgress = () => {
    const totalWords = chapters.reduce((sum, chapter) => sum + chapter.word_count, 0)
    const targetWords = project.target_word_count || chapters.reduce((sum, chapter) => sum + chapter.target_word_count, 0)
    return targetWords > 0 ? Math.min((totalWords / targetWords) * 100, 100) : 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-orange-100 text-orange-800'
      case 'published': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />
      case 'in_review': return <Eye className="w-3 h-3" />
      case 'published': return <BookOpen className="w-3 h-3" />
      default: return <Edit3 className="w-3 h-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your novel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Chapter Sidebar */}
        <div className={`${showChapterList ? 'w-80' : 'w-12'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={`font-semibold text-gray-800 ${showChapterList ? 'block' : 'hidden'}`}>
                Chapters
              </h2>
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            
            {showChapterList && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Novel Progress</div>
                <Progress value={getTotalProgress()} className="mb-2" />
                <div className="text-xs text-gray-600">
                  {chapters.reduce((sum, chapter) => sum + chapter.word_count, 0).toLocaleString()} words
                </div>
              </div>
            )}
          </div>

          {showChapterList && (
            <div className="flex-1 overflow-y-auto">
              {/* New Chapter Form */}
              {showNewChapterForm ? (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Chapter title..."
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') createNewChapter()
                      if (e.key === 'Escape') setShowNewChapterForm(false)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={createNewChapter}>Create</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewChapterForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-gray-200">
                  <Button
                    onClick={() => setShowNewChapterForm(true)}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chapter
                  </Button>
                </div>
              )}

              {/* Chapter List */}
              <div className="space-y-1 p-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`p-3 rounded-lg transition-colors ${
                      activeChapter?.id === chapter.id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {editingChapter === chapter.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editChapterTitle}
                          onChange={(e) => setEditChapterTitle(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Chapter title..."
                        />
                        <textarea
                          value={editChapterNotes}
                          onChange={(e) => setEditChapterNotes(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none"
                          placeholder="Chapter notes..."
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveChapterEdit(chapter.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelChapterEdit}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setActiveChapter(chapter)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-800">
                              Chapter {chapter.chapter_number}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-1">
                              {chapter.title || 'Untitled'}
                            </div>
                            {chapter.notes && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {chapter.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingChapter(chapter)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <Badge className={`text-xs ${getStatusColor(chapter.status)}`}>
                              {getStatusIcon(chapter.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min((chapter.word_count / chapter.target_word_count) * 100, 100)} 
                            className="h-1"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{chapter.word_count} words</span>
                            <span>{chapter.target_word_count} target</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {activeChapter ? (
            <>
              {/* Chapter Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateChapter('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={chapters.length <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div>
                      <input
                        type="text"
                        value={activeChapter.title}
                        onChange={(e) => updateActiveChapter({ title: e.target.value })}
                        className="text-xl font-semibold text-gray-800 bg-transparent border-none outline-none"
                        placeholder="Chapter title..."
                      />
                      <div className="text-sm text-gray-500">
                        Chapter {activeChapter.chapter_number}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigateChapter('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={chapters.length <= 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Save Status */}
                    {saveStatus && (
                      <div className="flex items-center space-x-1 text-sm">
                        {saveStatus === 'saving' && (
                          <>
                            <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-orange-600">Saving...</span>
                          </>
                        )}
                        {saveStatus === 'saved' && (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-600">Saved</span>
                          </>
                        )}
                        {saveStatus === 'error' && (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-red-600">Error saving</span>
                          </>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => saveChapter(activeChapter)}
                      disabled={isSaving}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* Chapter Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{activeChapter.word_count} / {activeChapter.target_word_count} words</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={getChapterProgress()} className="h-2" />
                  </div>
                  <select
                    value={activeChapter.status}
                    onChange={(e) => updateActiveChapter({ status: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 p-6">
                <div className="bg-white rounded-lg border border-gray-200 h-full">
                  <div className="h-full p-6">
                    <textarea
                      value={activeChapter.content}
                      onChange={(e) => updateActiveChapter({ content: e.target.value })}
                      className="w-full h-full border-none outline-none resize-none text-gray-800 leading-relaxed"
                      placeholder="Start writing your chapter..."
                      style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: '1.7' }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">No chapters yet</h3>
                <p className="text-gray-600 mb-6">Create your first chapter to start writing your novel</p>
                <Button onClick={() => setShowNewChapterForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Chapter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
