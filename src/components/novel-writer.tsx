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
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Replace,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Table,
  Strikethrough,
  Code,
  Hash,
  AlignJustify
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EditorWorkflowManager from './editor-workflow-manager'

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null)
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [currentAlignment, setCurrentAlignment] = useState('left')
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'other' | null>(null)
  const [originalChapterContent, setOriginalChapterContent] = useState('')

  const [showTopHint, setShowTopHint] = useState(false)
  const [showBottomHint, setShowBottomHint] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // Show top hint only if we're not at the top
    setShowTopHint(scrollTop > 0)
    
    // Show bottom hint only if we're not at the bottom
    setShowBottomHint(scrollTop < scrollHeight - clientHeight - 10)
  }

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    // Set height to scrollHeight with minimum of 150px
    textarea.style.height = Math.max(textarea.scrollHeight, 150) + 'px'
  }

  // Text formatting functions
  const formatText = (prefix: string, suffix: string = '') => {
    if (!textareaRef || !activeChapter) return

    const start = textareaRef.selectionStart
    const end = textareaRef.selectionEnd
    const selectedText = activeChapter.content.substring(start, end)
    
    let newText
    if (selectedText) {
      // If text is selected, wrap it
      newText = activeChapter.content.substring(0, start) + 
                prefix + selectedText + suffix + 
                activeChapter.content.substring(end)
    } else {
      // If no text is selected, insert prefix/suffix at cursor
      newText = activeChapter.content.substring(0, start) + 
                prefix + suffix + 
                activeChapter.content.substring(start)
    }

    updateActiveChapter({ content: newText })
    
    // Restore cursor position
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = selectedText ? 
          start + prefix.length + selectedText.length + suffix.length :
          start + prefix.length
        textareaRef.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.focus()
      }
    }, 0)
  }

  const insertText = (text: string) => {
    if (!textareaRef || !activeChapter) return

    const start = textareaRef.selectionStart
    const newText = activeChapter.content.substring(0, start) + 
                    text + 
                    activeChapter.content.substring(start)

    updateActiveChapter({ content: newText })
    
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + text.length
        textareaRef.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.focus()
      }
    }, 0)
  }

  const findAndReplace = (findStr: string, replaceStr: string, replaceAll: boolean = false) => {
    if (!activeChapter || !findStr) return

    let newContent = activeChapter.content
    if (replaceAll) {
      newContent = newContent.replaceAll(findStr, replaceStr)
    } else {
      newContent = newContent.replace(findStr, replaceStr)
    }

    updateActiveChapter({ content: newContent })
  }

  const applyAlignment = (alignment: string) => {
    if (!textareaRef || !activeChapter) return

    const start = textareaRef.selectionStart
    const content = activeChapter.content
    
    // Find the start of the current line
    let lineStart = start
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
      lineStart--
    }
    
    // Find the end of the current line
    let lineEnd = start
    while (lineEnd < content.length && content[lineEnd] !== '\n') {
      lineEnd++
    }
    
    const lineContent = content.substring(lineStart, lineEnd)
    let newLineContent
    
    // Remove existing alignment tags
    const cleanLine = lineContent.replace(/^<div style="text-align: (left|center|right|justify);">|<\/div>$/g, '')
    
    if (alignment === 'left') {
      newLineContent = cleanLine
    } else {
      newLineContent = `<div style="text-align: ${alignment};">${cleanLine}</div>`
    }
    
    const newContent = content.substring(0, lineStart) + newLineContent + content.substring(lineEnd)
    updateActiveChapter({ content: newContent })
    setCurrentAlignment(alignment)
  }

  const insertHeading = (level: number) => {
    const headingText = '#'.repeat(level) + ' '
    insertText('\n' + headingText)
  }

  const insertTable = () => {
    const tableText = '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data     | Data     |\n| Row 2    | Data     | Data     |\n'
    insertText(tableText)
  }

  const insertLink = () => {
    formatText('[Link Text](', 'https://example.com)')
  }

  const changeFontSize = (newSize: number) => {
    setFontSize(newSize)
  }

  useEffect(() => {
    loadChapters()
    checkUserRole()
  }, [projectId])

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef && activeChapter) {
      autoResizeTextarea(textareaRef)
    }
  }, [activeChapter?.content, textareaRef])

  // Store original content when chapter changes
  useEffect(() => {
    if (activeChapter) {
      setOriginalChapterContent(activeChapter.content)
    }
  }, [activeChapter?.id])

  const checkUserRole = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Check if user is project owner
      const { data: projectData } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (projectData?.owner_id === user.id) {
        setUserRole('owner')
        return
      }

      // Check if user is a collaborator and their role
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('role, secondary_roles')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (collaborator) {
        const isEditor = collaborator.role === 'editor' || 
                        (collaborator.secondary_roles && collaborator.secondary_roles.includes('editor'))
        setUserRole(isEditor ? 'editor' : 'other')
      } else {
        setUserRole('other')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      setUserRole('other')
    }
  }

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
      // Error loading chapters
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
      // Error creating chapter
    }
  }

  const saveChapter = async (chapter: Chapter) => {
    if (!chapter) return

    // For editors, we don't save directly - they use the approval workflow
    if (userRole === 'editor') {
      // This function is only called for non-editors now
      return
    }

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
      
      // Update original content after successful save
      setOriginalChapterContent(chapter.content)
      
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (error) {
      // Error saving chapter
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleWorkflowComplete = (success: boolean, message: string) => {
    if (success) {
      setSaveStatus('saved')
      // Show the message to user - in a real app you'd use a toast notification
      console.log(message)
    } else {
      setSaveStatus('error')
      console.error(message)
    }
    setTimeout(() => setSaveStatus(null), 3000)
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
      
      // Close the confirmation modal
      setDeleteConfirmOpen(false)
      setChapterToDelete(null)
    } catch (error) {
      // Error deleting chapter
    }
  }

  const confirmDeleteChapter = (chapterId: string) => {
    setChapterToDelete(chapterId)
    setDeleteConfirmOpen(true)
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
      // Error updating chapter
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
      default: return <FileText className="w-3 h-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your novel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Chapter Sidebar */}
      <div className={`${showChapterList ? 'w-80' : 'w-12'} bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={`font-semibold text-gray-800 ${showChapterList ? 'block' : 'hidden'}`}>
                Chapters ({chapters.length})
              </h2>
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            
            {showChapterList && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Novel Progress</div>
                <Progress value={getTotalProgress()} className="mb-1" />
                <div className="text-xs text-gray-600">
                  {chapters.reduce((sum, chapter) => sum + chapter.word_count, 0).toLocaleString()} words
                </div>
              </div>
            )}
          </div>

          {showChapterList && (
            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
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
                    className="w-full h-10 bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chapter
                  </Button>
                </div>
              )}

              {/* Chapter List */}
              <div className="space-y-2 p-4">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`mx-1 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeChapter?.id === chapter.id
                        ? 'bg-orange-25 border-2 border-orange-300 shadow-lg shadow-orange-300/60'
                        : 'bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm'
                    }`}
                    onClick={() => setActiveChapter(chapter)}
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
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none scrollbar-hide"
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
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-base text-gray-800 mb-1">
                              {chapter.title || `Chapter ${chapter.chapter_number}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingChapter(chapter)
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit chapter"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDeleteChapter(chapter.id)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Badge className={`text-xs px-2 py-1 ${getStatusColor(chapter.status)}`}>
                              {getStatusIcon(chapter.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Progress 
                            value={Math.min((chapter.word_count / chapter.target_word_count) * 100, 100)} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="font-medium">{chapter.word_count} words</span>
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

                    {/* Only show direct save button for non-editors */}
                    {userRole !== 'editor' && (
                      <Button
                        onClick={() => saveChapter(activeChapter)}
                        disabled={isSaving}
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    )}
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
              <div className="flex-1 flex flex-col relative">
                {/* Text Formatting Toolbar */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/80 p-4 flex items-center justify-between flex-wrap gap-3 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Font Size */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <Type className="w-4 h-4 text-gray-500" />
                      <select
                        value={fontSize}
                        onChange={(e) => changeFontSize(Number(e.target.value))}
                        className="text-sm bg-transparent border-none outline-none text-gray-600 cursor-pointer"
                      >
                        <option value={12}>12px</option>
                        <option value={14}>14px</option>
                        <option value={16}>16px</option>
                        <option value={18}>18px</option>
                        <option value={20}>20px</option>
                        <option value={24}>24px</option>
                      </select>
                    </div>

                    {/* Basic formatting */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={() => formatText('**', '**')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => formatText('*', '*')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => formatText('<u>', '</u>')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => formatText('~~', '~~')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => formatText('`', '`')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Inline Code"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={() => insertHeading(1)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => insertHeading(2)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => insertHeading(3)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={() => applyAlignment('left')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentAlignment === 'left' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => applyAlignment('center')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentAlignment === 'center' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => applyAlignment('right')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentAlignment === 'right' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => applyAlignment('justify')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentAlignment === 'justify' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                        title="Justify"
                      >
                        <AlignJustify className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lists and quotes */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={() => insertText('\n• ')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => insertText('\n1. ')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => formatText('\n> ', '')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Insert elements */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={insertLink}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Insert Link"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                      <button
                        onClick={insertTable}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Insert Table"
                      >
                        <Table className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Special inserts */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button
                        onClick={() => insertText('\n---\n')}
                        className="px-3 py-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600 text-xs font-medium"
                        title="Scene Break"
                      >
                        Scene Break
                      </button>
                      <button
                        onClick={() => insertText('\n\n* * *\n\n')}
                        className="px-3 py-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600 text-xs font-medium"
                        title="Chapter Break"
                      >
                        Chapter Break
                      </button>
                    </div>
                  </div>

                  {/* Find/Replace and Word Count */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowFindReplace(!showFindReplace)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        showFindReplace 
                          ? 'bg-purple-100 text-purple-600 shadow-sm' 
                          : 'hover:bg-purple-50 hover:text-purple-600 text-gray-600'
                      }`}
                      title="Find & Replace (Ctrl+F)"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <div className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/60 shadow-sm font-medium">
                      <span className="text-purple-600 font-semibold">{activeChapter.word_count}</span> words | <span className="text-gray-500">{activeChapter.content.length}</span> chars
                    </div>
                  </div>
                </div>

                {/* Find/Replace Panel */}
                {showFindReplace && (
                  <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/60 backdrop-blur-sm border-b border-purple-200/50 p-4 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Find..."
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-purple-200/60 rounded-xl text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Replace with..."
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-purple-200/60 rounded-xl text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => findAndReplace(findText, replaceText, false)}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => findAndReplace(findText, replaceText, true)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Replace All
                        </button>
                        <button
                          onClick={() => setShowFindReplace(false)}
                          className="p-2 hover:bg-white/60 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 bg-white relative group overflow-auto">
                  <textarea
                    ref={(ref) => {
                      setTextareaRef(ref)
                      if (ref) {
                        // Initial resize
                        autoResizeTextarea(ref)
                      }
                    }}
                    value={activeChapter.content}
                    onChange={(e) => {
                      updateActiveChapter({ content: e.target.value })
                      autoResizeTextarea(e.target)
                    }}
                    onScroll={handleScroll}
                    onKeyDown={(e) => {
                      // Handle keyboard shortcuts
                      if (e.ctrlKey || e.metaKey) {
                        switch (e.key) {
                          case 'b':
                            e.preventDefault()
                            formatText('**', '**')
                            break
                          case 'i':
                            e.preventDefault()
                            formatText('*', '*')
                            break
                          case 'u':
                            e.preventDefault()
                            formatText('<u>', '</u>')
                            break
                          case 'f':
                            e.preventDefault()
                            setShowFindReplace(!showFindReplace)
                            break
                          case 's':
                            e.preventDefault()
                            saveChapter(activeChapter)
                            break
                        }
                      }
                    }}
                    className="w-full border-none outline-none resize-none text-gray-800 leading-relaxed p-6 peer overflow-auto"
                    style={{ 
                      fontFamily: 'Georgia, serif', 
                      fontSize: `${fontSize}px`, 
                      lineHeight: '1.7',
                      minHeight: '150px',
                      height: 'auto'
                    }}
                    placeholder="Start writing your chapter..."
                  />
                  
                  {/* Scroll hint at top - only show when there's content above and on hover */}
                  {showTopHint && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/95 via-white/60 to-transparent pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
                        Scroll up
                      </div>
                    </>
                  )}
                  
                  {/* Scroll hint at bottom - only show when there's content below and on hover */}
                  {showBottomHint && (
                    <>
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/95 via-white/60 to-transparent pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
                        Scroll down
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Editor Workflow Manager for editors */}
              {userRole === 'editor' && activeChapter && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <EditorWorkflowManager
                    projectId={projectId}
                    chapterId={activeChapter.id}
                    contentType="chapter"
                    originalContent={originalChapterContent}
                    currentContent={activeChapter.content}
                    contentTitle={activeChapter.title}
                    isEditor={true}
                    onSaveComplete={handleWorkflowComplete}
                  />
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-lg flex items-center justify-center z-50 overflow-hidden">
          {/* Flowing recycle bins animation - bottom to top */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Large bins */}
            <div className="absolute left-1/4 w-8 h-8 text-red-400/60 animate-float-up-wiggle" style={{ animationDelay: '0s', animationDuration: '6s', filter: 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.6))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            <div className="absolute right-1/3 w-10 h-10 text-red-500/50 animate-float-up" style={{ animationDelay: '1.5s', animationDuration: '7s', filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.7))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            
            {/* Medium bins */}
            <div className="absolute left-1/6 w-6 h-6 text-red-400/40 animate-float-up" style={{ animationDelay: '0.8s', animationDuration: '5.5s', filter: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.4))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            <div className="absolute right-1/4 w-7 h-7 text-red-500/45 animate-float-up-wiggle" style={{ animationDelay: '2.2s', animationDuration: '6.5s', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            <div className="absolute left-1/2 w-6 h-6 text-red-400/35 animate-float-up" style={{ animationDelay: '3s', animationDuration: '5s', filter: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.4))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            
            {/* Small bins */}
            <div className="absolute left-1/3 w-4 h-4 text-red-300/50 animate-float-up-wiggle" style={{ animationDelay: '0.3s', animationDuration: '4.5s', filter: 'drop-shadow(0 0 4px rgba(252, 165, 165, 0.6))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            <div className="absolute right-1/6 w-5 h-5 text-red-400/30 animate-float-up" style={{ animationDelay: '1.8s', animationDuration: '5.8s', filter: 'drop-shadow(0 0 5px rgba(248, 113, 113, 0.3))' }}>
              <Trash2 className="w-full h-full" />
            </div>
            <div className="absolute right-1/2 w-4 h-4 text-red-300/40 animate-float-up-wiggle" style={{ animationDelay: '2.5s', animationDuration: '4.2s', filter: 'drop-shadow(0 0 4px rgba(252, 165, 165, 0.5))' }}>
              <Trash2 className="w-full h-full" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-2xl border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Chapter</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chapter? This action cannot be undone and all content will be permanently lost.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setChapterToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => chapterToDelete && deleteChapter(chapterToDelete)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chapter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
