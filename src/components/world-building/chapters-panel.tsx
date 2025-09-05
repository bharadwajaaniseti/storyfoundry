'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight, Save,
  Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link, Image, Eye, Settings
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
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [fontSize, setFontSize] = useState('16')
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null)
  const [lastSavedContent, setLastSavedContent] = useState('')

  useEffect(() => { loadChapters() }, [projectId])

  // Auto-save functionality - save changes after user stops typing for 2 seconds
  useEffect(() => {
    if (!selectedChapter || !isEditing || !content || content === lastSavedContent) return
    
    const autoSaveTimer = setTimeout(() => {
      autoSaveChapter()
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [content, selectedChapter, isEditing, lastSavedContent])

  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content)
      setTitle(selectedChapter.title)
      setLastSavedContent(selectedChapter.content)
      const index = chapters.findIndex(c => c.id === selectedChapter.id)
      setCurrentChapterIndex(index)
    }
  }, [selectedChapter, chapters])

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
      setIsEditing(true)
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
      setIsEditing(false)
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
    if (!textareaRef || !isEditing) return

    const start = textareaRef.selectionStart
    const end = textareaRef.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end)
    setContent(newText)

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + prefix.length + selectedText.length + suffix.length
        textareaRef.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.focus()
      }
    }, 0)
  }

  const insertText = (text: string) => {
    if (!textareaRef || !isEditing) return

    const start = textareaRef.selectionStart
    const newText = content.substring(0, start) + text + content.substring(start)
    setContent(newText)

    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + text.length
        textareaRef.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.focus()
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
                  
                  {!autoSaving && isEditing && content !== lastSavedContent && (
                    <div className="text-xs text-orange-600">
                      Unsaved changes
                    </div>
                  )}
                  
                  {!autoSaving && isEditing && content === lastSavedContent && content && (
                    <div className="text-xs text-green-600">
                      ✓ Saved
                    </div>
                  )}
                  
                  <Button onClick={() => setIsEditing(!isEditing)} variant="ghost" size="sm" className="h-8">
                    {isEditing ? <Eye className="h-4 w-4 mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                  {isEditing && (
                    <Button onClick={saveChapter} disabled={saving || autoSaving} size="sm" className="h-8">
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? 'Saving...' : 'Save Now'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Title (non-scrolling) */}
            <div className="p-4 border-b border-gray-100 bg-white">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
                  placeholder="Chapter Title"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{selectedChapter?.title}</h1>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {/* Sticky Toolbar inside the scrollable region */}
              <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-3 shadow-sm">
                <div className="flex items-center gap-1">
                  {/* Font Size */}
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="h-8 w-16 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                      <SelectItem value="20">20px</SelectItem>
                      <SelectItem value="24">24px</SelectItem>
                    </SelectContent>
                  </Select>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Text Formatting */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => formatText('**', '**')}
                    disabled={!isEditing}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('*', '*')}
                    disabled={!isEditing}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('<u>', '</u>')}
                    disabled={!isEditing}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <Type className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Headers */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-sm font-medium"
                    onClick={() => insertHeading(1)}
                    disabled={!isEditing}
                    title="Heading 1"
                  >
                    H1
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-sm font-medium"
                    onClick={() => insertHeading(2)}
                    disabled={!isEditing}
                    title="Heading 2"
                  >
                    H2
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-sm font-medium"
                    onClick={() => insertHeading(3)}
                    disabled={!isEditing}
                    title="Heading 3"
                  >
                    H3
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Alignment */}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <AlignJustify className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Lists */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => insertText('\n• ')}
                    disabled={!isEditing}
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => insertText('\n1. ')}
                    disabled={!isEditing}
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('\n> ', '')}
                    disabled={!isEditing}
                    title="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Insert Options */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={insertLink}
                    disabled={!isEditing}
                    title="Insert Link"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!isEditing}>
                    <Image className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-2" />

                  {/* Special Breaks */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-sm"
                    onClick={() => insertText('\n---\n')}
                    disabled={!isEditing}
                    title="Scene Break"
                  >
                    Scene Break
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-sm"
                    onClick={() => insertText('\n\n* * *\n\n')}
                    disabled={!isEditing}
                    title="Chapter Break"
                  >
                    Chapter Break
                  </Button>
                </div>

                {/* Word Count */}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span className="text-blue-600 font-semibold">
                      {isEditing ? content.trim().split(/\s+/).filter(word => word.length > 0).length : selectedChapter?.word_count || 0} words
                    </span>
                    <span>| {content.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="p-4">
                {isEditing ? (
                  <Textarea
                    ref={(el) => setTextareaRef(el)}
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
                        } else if (e.key === 's') {
                          e.preventDefault()
                          saveChapter()
                        }
                      }
                    }}
                  />
                ) : (
                  <div
                    className="w-full prose prose-gray max-w-none"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                  >
                    {content ? (
                      <div className="whitespace-pre-wrap">{content}</div>
                    ) : (
                      <div className="text-gray-500 italic">No content yet. Click Edit to start writing.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Status (non-scrolling) */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Words: {isEditing ? content.trim().split(/\s+/).filter(word => word.length > 0).length : selectedChapter?.word_count}</span>
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
