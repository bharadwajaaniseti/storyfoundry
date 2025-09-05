'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight, Save,
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link, Image, Eye, Settings, Strikethrough,
  Heading1, Heading2, Heading3, Loader2, Check, AlertTriangle, X, Undo, Redo
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupabaseClient } from '@/lib/auth'

interface Chapter {
  id: string
  project_id: string
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

interface ChaptersPanelProps {
  projectId: string
}

export default function ChaptersPanel({ projectId }: ChaptersPanelProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [fontSize, setFontSize] = useState('16')
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [contentHistory, setContentHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false)

  useEffect(() => { loadChapters() }, [projectId])

  // Auto-save functionality - save changes after user stops typing for 2 seconds
  useEffect(() => {
    if (!selectedChapter || !content || content === lastSavedContent) return
    
    const autoSaveTimer = setTimeout(() => {
      autoSaveChapter()
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [content, selectedChapter, lastSavedContent])

  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content)
      setTitle(selectedChapter.title)
      setLastSavedContent(selectedChapter.content)
      const index = chapters.findIndex(c => c.id === selectedChapter.id)
      setCurrentChapterIndex(index)
      // Initialize history with current content
      setContentHistory([selectedChapter.content])
      setHistoryIndex(0)
    }
  }, [selectedChapter, chapters])

  // Track content changes for undo/redo (debounced)
  useEffect(() => {
    if (!content || isUndoRedoAction) return
    
    const historyTimer = setTimeout(() => {
      if (isUndoRedoAction) return // Double check to prevent race conditions
      
      setContentHistory(prev => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, historyIndex + 1)
        // Add new content
        newHistory.push(content)
        // Keep only last 50 states to prevent memory issues
        return newHistory.slice(-50)
      })
      setHistoryIndex(prev => Math.min(prev + 1, 49))
    }, 1000) // Add to history after 1 second of no changes

    return () => clearTimeout(historyTimer)
  }, [content, isUndoRedoAction, historyIndex])

  const autoSaveChapter = async () => {
    if (!selectedChapter || !title.trim() || content === lastSavedContent) return
    
    setAutoSaving(true)
    try {
      const supabase = createSupabaseClient()
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length
      const { error } = await supabase
        .from('project_chapters')
        .update({
          title: title.trim(),
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChapter.id)

      if (error) { console.error('Error auto-saving chapter:', error); return }

      setChapters(prev => prev.map(chapter =>
        chapter.id === selectedChapter.id
          ? { ...chapter, title: title.trim(), content, word_count: wordCount }
          : chapter
      ))
      setSelectedChapter(prev => prev ? { ...prev, title: title.trim(), content, word_count: wordCount } : null)
      setLastSavedContent(content)
    } catch (error) {
      console.error('Error auto-saving:', error)
    } finally {
      setAutoSaving(false)
    }
  }

  const loadChapters = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })

      if (error) {
        console.error('Error loading chapters:', error)
        return
      }

      setChapters(data || [])
      if (data && data.length > 0 && !selectedChapter) setSelectedChapter(data[0])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewChapter = async () => {
    const nextChapterNumber = Math.max(0, ...chapters.map(c => c.chapter_number)) + 1
    const newTitle = `Chapter ${nextChapterNumber}`
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters')
        .insert({
          project_id: projectId,
          chapter_number: nextChapterNumber,
          title: newTitle,
          content: '',
          word_count: 0,
          target_word_count: 2500,
          status: 'draft',
          notes: ''
        })
        .select()
        .single()

      if (error) { console.error('Error creating chapter:', error); return }

      const newChapter = data as Chapter
      setChapters(prev => [...prev, newChapter])
      setSelectedChapter(newChapter)
      setTitle(newTitle)
      setContent('')
      setIsCreating(false)
    } catch (error) { console.error('Error:', error) }
  }

  const saveChapter = async () => {
    if (!selectedChapter || !title.trim()) return
    setSaving(true)
    try {
      const supabase = createSupabaseClient()
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length
      const { error } = await supabase
        .from('project_chapters')
        .update({
          title: title.trim(),
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChapter.id)

      if (error) { console.error('Error saving chapter:', error); return }

      setChapters(prev => prev.map(chapter =>
        chapter.id === selectedChapter.id
          ? { ...chapter, title: title.trim(), content, word_count: wordCount }
          : chapter
      ))
      setSelectedChapter(prev => prev ? { ...prev, title: title.trim(), content, word_count: wordCount } : null)
    } catch (error) {
      console.error('Error:', error)
    } finally { setSaving(false) }
  }

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from('project_chapters').delete().eq('id', chapterId)
      if (error) { console.error('Error deleting chapter:', error); return }
      setChapters(prev => prev.filter(c => c.id !== chapterId))
      if (selectedChapter?.id === chapterId) {
        const remaining = chapters.filter(c => c.id !== chapterId)
        setSelectedChapter(remaining.length > 0 ? remaining[0] : null)
      }
    } catch (error) { console.error('Error:', error) }
  }

  const navigateChapter = (direction: 'prev' | 'next') => {
    const currentIndex = chapters.findIndex(c => c.id === selectedChapter?.id)
    if (direction === 'prev' && currentIndex > 0) setSelectedChapter(chapters[currentIndex - 1])
    else if (direction === 'next' && currentIndex < chapters.length - 1) setSelectedChapter(chapters[currentIndex + 1])
  }

  // Text formatting functions
  const formatText = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end)
    setContent(newText)

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + prefix.length + selectedText.length + suffix.length
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const insertText = (text: string) => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const newText = content.substring(0, start) + text + content.substring(start)
    setContent(newText)

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + text.length
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' '
    insertText('\n' + prefix)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    const text = prompt('Enter link text:') || 'link'
    if (url) {
      formatText(`[${text}](`, `${url})`)
    }
  }

  const applyAlignment = (alignment: string) => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const content_text = content
    
    // Find the start of the current line
    let lineStart = start
    while (lineStart > 0 && content_text[lineStart - 1] !== '\n') {
      lineStart--
    }
    
    // Find the end of the current line
    let lineEnd = start
    while (lineEnd < content_text.length && content_text[lineEnd] !== '\n') {
      lineEnd++
    }
    
    const lineContent = content_text.substring(lineStart, lineEnd)
    let newLineContent
    
    // Remove existing alignment tags
    const cleanLine = lineContent.replace(/^<div style="text-align: (left|center|right|justify);">|<\/div>$/g, '')
    
    if (alignment === 'left') {
      newLineContent = cleanLine
    } else {
      newLineContent = `<div style="text-align: ${alignment};">${cleanLine}</div>`
    }
    
    const newContent = content_text.substring(0, lineStart) + newLineContent + content_text.substring(lineEnd)
    setContent(newContent)
  }

  const findAndReplace = (findStr: string, replaceStr: string, replaceAll: boolean = false) => {
    if (!findStr) return

    let newContent = content
    if (replaceAll) {
      // Use split and join for broader compatibility instead of replaceAll
      newContent = newContent.split(findStr).join(replaceStr)
    } else {
      newContent = newContent.replace(findStr, replaceStr)
    }

    setContent(newContent)
  }

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true)
      const previousContent = contentHistory[historyIndex - 1]
      setContent(previousContent)
      setHistoryIndex(prev => prev - 1)
      setTimeout(() => setIsUndoRedoAction(false), 0)
    }
  }

  const redo = () => {
    if (historyIndex < contentHistory.length - 1) {
      setIsUndoRedoAction(true)
      const nextContent = contentHistory[historyIndex + 1]
      setContent(nextContent)
      setHistoryIndex(prev => prev + 1)
      setTimeout(() => setIsUndoRedoAction(false), 0)
    }
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < contentHistory.length - 1

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'published': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading chapters...</div>
      </div>
    )
  }

  return (
    // Lock page height and hide page scrollbars
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedChapter ? (
          // Fill remaining height and allow inner scroll only
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header (non-scrolling) */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigateChapter('prev')} variant="ghost" size="sm" disabled={currentChapterIndex === 0} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigateChapter('next')} variant="ghost" size="sm" disabled={currentChapterIndex === chapters.length - 1} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <span className="text-sm text-gray-600">Chapter {currentChapterIndex + 1} of {chapters.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Auto-save status indicator */}
                  {autoSaving && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      Auto-saving...
                    </div>
                  )}
                  
                  {!autoSaving && content !== lastSavedContent && (
                    <div className="text-xs text-orange-600">
                      Unsaved changes
                    </div>
                  )}
                  
                  {!autoSaving && content === lastSavedContent && content && (
                    <div className="text-xs text-green-600">
                      ✓ Saved
                    </div>
                  )}
                  
                  {/* Manual save button */}
                  <Button onClick={saveChapter} disabled={saving || autoSaving} size="sm" className="h-8">
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save Now'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Title (non-scrolling) */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
                placeholder="Chapter Title"
              />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {/* Sticky Toolbar inside the scrollable region */}
              <div className="sticky top-0 z-50 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/80 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Font Size */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <Type className="w-4 h-4 text-gray-500" />
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        className="text-sm bg-transparent border-none outline-none text-gray-600 cursor-pointer"
                      >
                        <option value="12">12px</option>
                        <option value="14">14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                        <option value="20">20px</option>
                        <option value="24">24px</option>
                      </select>
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={undo}
                        disabled={!canUndo}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          canUndo 
                            ? 'hover:bg-purple-50 hover:text-purple-600 text-gray-600' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={redo}
                        disabled={!canRedo}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          canRedo 
                            ? 'hover:bg-purple-50 hover:text-purple-600 text-gray-600' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Basic formatting */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={() => formatText('**', '**')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => formatText('*', '*')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => formatText('<u>', '</u>')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => formatText('~~', '~~')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Strikethrough"
                      >
                        <Strikethrough className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Headers */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={() => insertHeading(1)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 1"
                      >
                        <Heading1 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => insertHeading(2)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 2"
                      >
                        <Heading2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => insertHeading(3)}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Heading 3"
                      >
                        <Heading3 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={() => applyAlignment('left')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Align Left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => applyAlignment('center')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Align Center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => applyAlignment('right')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Align Right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => applyAlignment('justify')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Justify"
                      >
                        <AlignJustify className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Lists and quotes */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={() => insertText('\n• ')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Bullet List"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => insertText('\n1. ')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Numbered List"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => formatText('\n> ', '')}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Quote"
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Insert elements */}
                    <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-2 shadow-sm">
                      <button 
                        onClick={insertLink}
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Insert Link"
                      >
                        <Link className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all duration-200 text-gray-600"
                        title="Insert Image"
                      >
                        <Image className="h-4 w-4" />
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
                      <span className="text-purple-600 font-semibold">
                        {content.trim().split(/\s+/).filter(word => word.length > 0).length}
                      </span> words | <span className="text-gray-500">{content.length}</span> chars
                    </div>
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

              {/* Content Editor */}
              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full resize-none border-none p-0 focus-visible:ring-0 shadow-none min-h-[600px]"
                  placeholder="Start writing your chapter..."
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                  onKeyDown={(e) => {
                    // Word-like keyboard shortcuts
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 'b') {
                        e.preventDefault()
                        formatText('**', '**')
                      } else if (e.key === 'i') {
                        e.preventDefault()
                        formatText('*', '*')
                      } else if (e.key === 'u') {
                        e.preventDefault()
                        formatText('<u>', '</u>')
                      } else if (e.key === 'f') {
                        e.preventDefault()
                        setShowFindReplace(!showFindReplace)
                      } else if (e.key === 'z' && !e.shiftKey) {
                        e.preventDefault()
                        undo()
                      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                        e.preventDefault()
                        redo()
                      } else if (e.key === 's') {
                        e.preventDefault()
                        saveChapter()
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Footer / Status (non-scrolling) */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Words: {content.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                <span>Target: {selectedChapter?.target_word_count}</span>
                <Badge variant="outline" className={getStatusColor(selectedChapter?.status || 'draft')}>
                  {selectedChapter?.status}
                </Badge>
              </div>
              <div>Last updated: {new Date(selectedChapter?.updated_at || '').toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No chapter selected</div>
              <Button onClick={createNewChapter}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first chapter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
