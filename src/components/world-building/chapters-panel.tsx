"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import {
  Plus, ChevronLeft, ChevronRight, Save,
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Undo as UndoIcon, Redo as RedoIcon,
  List, ListOrdered, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link, Image, Quote, MoreHorizontal, ChevronDown, Search, Users, MapPin, BookOpen,
  Lightbulb, Target, StickyNote, Zap, BarChart3, MousePointer, Clock, CheckCircle, FileText, X,
  Replace, Palette, Highlighter, Indent, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  VisuallyHidden
} from "@/components/ui/dialog"
import { createSupabaseClient } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"

interface Chapter {
  id: string
  project_id: string
  chapter_number: number
  title: string
  content: string // HTML
  word_count: number
  target_word_count: number
  status: 'draft' | 'in_review' | 'completed' | 'published'
  notes: string
  created_at: string
  updated_at: string
}

interface WorldElement {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: Record<string, any>
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

interface ChaptersPanelProps { 
  projectId: string 
  onNavigateToElement?: (elementId: string, category: string) => void
}

type Snapshot = { html: string; start: number; end: number }

export default function ChaptersPanel({ projectId, onNavigateToElement }: ChaptersPanelProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [lastSavedHTML, setLastSavedHTML] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showImageDropdown, setShowImageDropdown] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [availableElements, setAvailableElements] = useState<WorldElement[]>([])
  const [showCreateNewElement, setShowCreateNewElement] = useState(false)
  const [newElementName, setNewElementName] = useState('')
  const [newElementCategory, setNewElementCategory] = useState('characters')
  const [savedSelection, setSavedSelection] = useState<{start: number, end: number} | null>(null)
  
  // Writing assistance features
  const [showWritingAssistant, setShowWritingAssistant] = useState(false)
  const [showWordTargetModal, setShowWordTargetModal] = useState(false)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [chapterNotes, setChapterNotes] = useState("")
  const [writingPrompts, setWritingPrompts] = useState<string[]>([])
  const [showPrompts, setShowPrompts] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [showReadabilityStats, setShowReadabilityStats] = useState(false)
  const [newElementDescription, setNewElementDescription] = useState("")
  const [focusMode, setFocusMode] = useState(false)
  const [sprintMode, setSprintMode] = useState(false)
  const [sprintTimeLeft, setSprintTimeLeft] = useState(0)
  const [sprintStartWords, setSprintStartWords] = useState(0)
  const [sprintTarget, setSprintTarget] = useState(250)
  const [dailyWordCount, setDailyWordCount] = useState(0)
  const [writingStreak, setWritingStreak] = useState(0)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [sprintHistory, setSprintHistory] = useState<{words: number, duration: number, date: string}[]>([])
  const [dailyProgress, setDailyProgress] = useState(0)
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([])
  const [customTemplates, setCustomTemplates] = useState<{name: string, content: string}[]>([])
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [dailyGoal, setDailyGoal] = useState(1000)
  const [showSprintStats, setShowSprintStats] = useState(false)
  const [showDailyGoals, setShowDailyGoals] = useState(false)

  // Find and Replace functionality
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [textColor, setTextColor] = useState('#000000')
  const [highlightColor, setHighlightColor] = useState('#ffff00')

  // Find and Replace functionality
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [findResults, setFindResults] = useState<{start: number, end: number}[]>([])
  const [currentFindIndex, setCurrentFindIndex] = useState(-1)
  const [replaceCount, setReplaceCount] = useState(0)

  const elementCategories = [
    'characters', 'locations', 'items', 'cultures', 'systems',
    'organizations', 'events', 'concepts', 'technologies', 'languages',
    'religions', 'philosophies'
  ]

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageDropdownRef = useRef<HTMLDivElement>(null)

  // ===== Custom history with caret preservation =====
  const [history, setHistory] = useState<Snapshot[]>([])
  const [hIndex, setHIndex] = useState(-1)
  const debounceId = useRef<number | null>(null)

  const focusEditor = () => { if (editorRef.current && document.activeElement !== editorRef.current) editorRef.current.focus() }

  const getHTML = () => editorRef.current?.innerHTML || ""
  const getText = () => editorRef.current?.innerText || ""

  // --- selection offsets across text nodes ---
  const getSelectionOffsets = (): { start: number; end: number } => {
    const root = editorRef.current
    const sel = window.getSelection()
    if (!root || !sel || sel.rangeCount === 0) return { start: 0, end: 0 }
    const range = sel.getRangeAt(0)
    const it = document.createNodeIterator(root, NodeFilter.SHOW_TEXT)
    let pos = 0, start = -1, end = -1, n: Node | null
    while ((n = it.nextNode())) {
      const len = (n.nodeValue || "").length
      if (n === range.startContainer) start = pos + range.startOffset
      if (n === range.endContainer) end = pos + range.endOffset
      pos += len
    }
    if (start < 0) start = pos
    if (end < 0) end = start
    return { start, end }
  }

  const setSelectionOffsets = (start: number, end: number) => {
    const root = editorRef.current
    if (!root) return
    const it = document.createNodeIterator(root, NodeFilter.SHOW_TEXT)
    let pos = 0, n: Node | null
    let sNode: Node | null = null, sOff = 0
    let eNode: Node | null = null, eOff = 0
    while ((n = it.nextNode())) {
      const len = (n.nodeValue || "").length
      if (!sNode && start <= pos + len) { sNode = n; sOff = Math.max(0, start - pos) }
      if (!eNode && end <= pos + len) { eNode = n; eOff = Math.max(0, end - pos) }
      pos += len
      if (sNode && eNode) break
    }
    if (!sNode) { sNode = root; sOff = root.childNodes.length }
    if (!eNode) { eNode = sNode; eOff = sOff }

    const r = document.createRange()
    try {
      r.setStart(sNode, sOff)
      r.setEnd(eNode, eOff)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(r)
    } catch {}
  }

  const snapshot = (): Snapshot => ({ html: getHTML(), ...getSelectionOffsets() })

  const pushHistory = (force = false) => {
    const snap = snapshot()
    if (!force && hIndex >= 0 && history[hIndex]?.html === snap.html) return
    const next = [...history.slice(0, hIndex + 1), snap].slice(-200)
    setHistory(next)
    setHIndex(next.length - 1)
  }

  const scheduleHistoryPush = () => {
    if (debounceId.current) window.clearTimeout(debounceId.current)
    debounceId.current = window.setTimeout(() => pushHistory(false), 250)
  }

  const applyHTML = (html: string, sel?: { start: number; end: number }, recordHistory = true) => {
    const keep = sel || getSelectionOffsets()
    if (editorRef.current) editorRef.current.innerHTML = html
    setSelectionOffsets(keep.start, keep.end)
    if (recordHistory) scheduleHistoryPush()
  }

  // ===== Load & Save =====
  useEffect(() => { loadChapters() }, [projectId])

  // ===== Close color pickers when clicking outside =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTextColorPicker && !(event.target as Element).closest('.text-color-picker')) {
        setShowTextColorPicker(false)
      }
      if (showHighlightPicker && !(event.target as Element).closest('.highlight-picker')) {
        setShowHighlightPicker(false)
      }
    }

    if (showTextColorPicker || showHighlightPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTextColorPicker, showHighlightPicker])

  // ===== Handle world element link clicks =====
  useEffect(() => {
    const handleElementLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if the clicked element or its parent is a world element link
      const linkElement = target.closest('a[data-world-element-id]') as HTMLAnchorElement
      
      if (linkElement && onNavigateToElement) {
        event.preventDefault()
        event.stopPropagation()
        
        const elementId = linkElement.getAttribute('data-world-element-id')
        const category = linkElement.getAttribute('data-world-element-category')
        
        if (elementId && category) {
          onNavigateToElement(elementId, category)
        }
      }
    }

    // Add event listener to the editor
    if (editorRef.current) {
      editorRef.current.addEventListener('click', handleElementLinkClick, true)
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleElementLinkClick, true)
      }
    }
  }, [onNavigateToElement])

  useEffect(() => {
    if (!selectedChapter) return
    setTitle(selectedChapter.title)
    if (editorRef.current) editorRef.current.innerHTML = selectedChapter.content || ""
    const first = { html: getHTML(), start: 0, end: 0 }
    setHistory([first]); setHIndex(0)
    setCurrentChapterIndex(chapters.findIndex(c => c.id === selectedChapter.id))
    setLastSavedHTML(selectedChapter.content || "")
  }, [selectedChapter, chapters])

  const loadChapters = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('project_chapters').select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })
      if (error) throw error
      setChapters(data || [])
      if ((data || []).length && !selectedChapter) setSelectedChapter((data as Chapter[])[0])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const computeWordCount = useCallback(() => (getText().trim().split(/\s+/).filter(Boolean).length), [])
  
  // Writing assistance functions
  const computeReadingTime = useCallback(() => {
    const words = computeWordCount()
    return Math.ceil(words / 200) // Average reading speed: 200 words per minute
  }, [computeWordCount])
  
  const computeReadabilityStats = useCallback(() => {
    const text = getText()
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const words = computeWordCount()
    const syllables = text.toLowerCase().match(/[aeiouy]+/g)?.length || 0
    
    if (sentences === 0 || words === 0) return null
    
    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
    
    let level = ''
    if (fleschScore >= 90) level = 'Very Easy'
    else if (fleschScore >= 80) level = 'Easy'
    else if (fleschScore >= 70) level = 'Fairly Easy'
    else if (fleschScore >= 60) level = 'Standard'
    else if (fleschScore >= 50) level = 'Fairly Difficult'
    else if (fleschScore >= 30) level = 'Difficult'
    else level = 'Very Difficult'
    
    return {
      score: Math.round(fleschScore),
      level,
      avgWordsPerSentence: Math.round(words / sentences),
      avgSyllablesPerWord: Math.round((syllables / words) * 10) / 10
    }
  }, [computeWordCount])
  
  const generateWritingPrompts = () => {
    const prompts = [
      "What secret is your character hiding?",
      "Describe the setting using all five senses",
      "What does your character want most in this scene?",
      "Add a moment of internal conflict",
      "Show don't tell - reveal emotion through action",
      "What would surprise the reader here?",
      "Add subtext to the dialogue",
      "What's the worst thing that could happen right now?",
      "Describe a small detail that reveals character",
      "What question does this scene raise?"
    ]
    
    const shuffled = [...prompts].sort(() => Math.random() - 0.5)
    setWritingPrompts(shuffled.slice(0, 3))
    setShowPrompts(true)
  }
  
  const startWritingSprint = (minutes: number = 15) => {
    setSprintMode(true)
    setSprintTimeLeft(minutes * 60)
    setSprintStartWords(computeWordCount())
    setFocusMode(true)
    
    const timer = setInterval(() => {
      setSprintTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setSprintMode(false)
          const wordsWritten = computeWordCount() - sprintStartWords
          saveSprintResult(wordsWritten, minutes)
          alert(`Sprint complete! You wrote ${wordsWritten} words in ${minutes} minutes.`)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const getEncouragementMessage = (wordCount: number) => {
    if (wordCount >= 2000) return "🎉 Excellent work! You're on fire today!"
    if (wordCount >= 1000) return "🌟 Great progress! You're doing amazing!"
    if (wordCount >= 500) return "💪 Nice work! Keep the momentum going!"
    if (wordCount >= 250) return "✨ Good start! You're building something great!"
    return "📝 Every word counts! Keep writing!"
  }
  
  const insertQuickText = (text: string) => {
    const selection = window.getSelection()
    if (selection && editorRef.current) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      scheduleHistoryPush()
    }
  }
  
  const saveSprintResult = (words: number, duration: number) => {
    const newSprint = {
      words,
      duration,
      date: new Date().toISOString()
    }
    setSprintHistory(prev => [newSprint, ...prev.slice(0, 9)]) // Keep last 10 sprints
  }
  
  const toggleFavoritePrompt = (prompt: string) => {
    setFavoritePrompts(prev => 
      prev.includes(prompt) 
        ? prev.filter(p => p !== prompt)
        : [...prev, prompt]
    )
  }
  
  const addCustomTemplate = () => {
    if (newTemplateName.trim() && newTemplateContent.trim()) {
      setCustomTemplates(prev => [...prev, {
        name: newTemplateName.trim(),
        content: newTemplateContent.trim()
      }])
      setNewTemplateName("")
      setNewTemplateContent("")
    }
  }
  
  const deleteCustomTemplate = (index: number) => {
    setCustomTemplates(prev => prev.filter((_, i) => i !== index))
  }

  // Find and Replace Functions
  const findTextInEditor = (searchText: string, caseSensitive = false, wholeWordOnly = false) => {
    if (!editorRef.current || !searchText.trim()) return []

    const text = getText()
    const results: {start: number, end: number}[] = []
    let searchStart = 0

    const flags = caseSensitive ? 'g' : 'gi'
    const pattern = wholeWordOnly 
      ? new RegExp(`\\b${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags)
      : new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)

    let match
    while ((match = pattern.exec(text)) !== null) {
      results.push({
        start: match.index,
        end: match.index + match[0].length
      })
      // Prevent infinite loop
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++
      }
    }

    return results
  }

  const highlightFindResult = (index: number) => {
    if (findResults.length === 0 || index < 0 || index >= findResults.length) return

    const result = findResults[index]
    setSelectionOffsets(result.start, result.end)
    setCurrentFindIndex(index)
  }

  const findNext = () => {
    if (findResults.length === 0) return
    const nextIndex = currentFindIndex < findResults.length - 1 ? currentFindIndex + 1 : 0
    highlightFindResult(nextIndex)
  }

  const findPrevious = () => {
    if (findResults.length === 0) return
    const prevIndex = currentFindIndex > 0 ? currentFindIndex - 1 : findResults.length - 1
    highlightFindResult(prevIndex)
  }

  const performFind = () => {
    const results = findTextInEditor(findText, matchCase, wholeWord)
    setFindResults(results)
    setCurrentFindIndex(results.length > 0 ? 0 : -1)
    if (results.length > 0) {
      highlightFindResult(0)
    }
  }

  const performReplace = () => {
    if (findResults.length === 0 || currentFindIndex < 0) return

    const result = findResults[currentFindIndex]
    const text = getText()
    const beforeText = text.substring(0, result.start)
    const afterText = text.substring(result.end)
    const newText = beforeText + replaceText + afterText

    // Update the editor content
    if (editorRef.current) {
      editorRef.current.textContent = newText
      scheduleHistoryPush()
    }

    // Update results after replacement
    const updatedResults = findTextInEditor(findText, matchCase, wholeWord)
    setFindResults(updatedResults)
    setReplaceCount(prev => prev + 1)

    // Move to next result or reset
    if (updatedResults.length > 0) {
      const nextIndex = Math.min(currentFindIndex, updatedResults.length - 1)
      highlightFindResult(nextIndex)
    } else {
      setCurrentFindIndex(-1)
    }
  }

  const replaceAll = () => {
    if (!findText.trim()) return

    let count = 0
    const text = getText()
    let newText = text

    if (wholeWord) {
      const flags = matchCase ? 'g' : 'gi'
      const pattern = new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags)
      newText = text.replace(pattern, replaceText)
      count = (text.match(pattern) || []).length
    } else {
      const flags = matchCase ? 'g' : 'gi'
      const pattern = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
      newText = text.replace(pattern, replaceText)
      count = (text.match(pattern) || []).length
    }

    if (editorRef.current) {
      editorRef.current.textContent = newText
      scheduleHistoryPush()
    }

    setReplaceCount(count)
    setFindResults([])
    setCurrentFindIndex(-1)
  }

  const resetFindReplace = () => {
    setFindText('')
    setReplaceText('')
    setFindResults([])
    setCurrentFindIndex(-1)
    setReplaceCount(0)
    setMatchCase(false)
    setWholeWord(false)
  }
  
  // Enhanced formatting functions
  const applyTextColor = (color: string) => {
    focusEditor()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        // Apply color to selected text
        document.execCommand('styleWithCSS', false, 'true')
        document.execCommand('foreColor', false, color)
        scheduleHistoryPush()
      }
    }
    setShowTextColorPicker(false)
  }

  const applyHighlightColor = (color: string) => {
    focusEditor()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        // Apply background color to selected text
        document.execCommand('styleWithCSS', false, 'true')
        document.execCommand('backColor', false, color)
        scheduleHistoryPush()
      }
    }
    setShowHighlightPicker(false)
  }

  const applyIndent = () => {
    focusEditor()
    document.execCommand('indent', false)
    scheduleHistoryPush()
  }

  const applyOutdent = () => {
    focusEditor()
    document.execCommand('outdent', false)
    scheduleHistoryPush()
  }

  const clearFormatting = () => {
    focusEditor()
    document.execCommand('removeFormat', false)
    scheduleHistoryPush()
  }

  const applyBlockquote = () => {
    focusEditor()
    document.execCommand('formatBlock', false, 'blockquote')
    scheduleHistoryPush()
  }

  const getSprintStats = useCallback(() => {
    if (sprintHistory.length === 0) return null
    
    const totalWords = sprintHistory.reduce((sum, sprint) => sum + sprint.words, 0)
    const totalTime = sprintHistory.reduce((sum, sprint) => sum + sprint.duration, 0)
    const avgWordsPerMinute = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0
    const bestSprint = sprintHistory.reduce((best, current) => 
      current.words > best.words ? current : best, sprintHistory[0]
    )
    
    return {
      totalSprints: sprintHistory.length,
      totalWords,
      totalTime,
      avgWordsPerMinute,
      bestSprint
    }
  }, [sprintHistory])
  
  const getDailyProgress = useCallback(() => {
    // In a real app, this would fetch from database
    // For now, we'll simulate with local calculation
    const today = new Date().toDateString()
    const todayWords = chapters.reduce((sum, chapter) => {
      const chapterDate = new Date(chapter.updated_at).toDateString()
      return chapterDate === today ? sum + chapter.word_count : sum
    }, 0)
    return todayWords
  }, [chapters])

  // Update daily progress when chapters change
  useEffect(() => {
    setDailyProgress(getDailyProgress())
  }, [getDailyProgress])

  const saveChapter = async () => {
    if (!selectedChapter || !title.trim()) return
    setSaving(true)
    try {
      const supabase = createSupabaseClient()
      const html = getHTML()
      await supabase
        .from('project_chapters')
        .update({ title: title.trim(), content: html, word_count: computeWordCount(), updated_at: new Date().toISOString() })
        .eq('id', selectedChapter.id)
      setLastSavedHTML(html)
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  // ===== Commands =====
  const exec = (command: string, value?: string) => {
    focusEditor()
    // Add a small delay for focus to take effect, especially important for list commands
    setTimeout(() => {
      document.execCommand(command, false, value)
      scheduleHistoryPush()
    }, 10)
  }

  const insertUnordered = () => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    
    // Get current selection
    const selection = window.getSelection()
    if (!selection) return
    
    // Try the standard approach first
    try {
      document.execCommand('insertUnorderedList', false)
      scheduleHistoryPush()
      return
    } catch (error) {
      console.log('Standard approach failed, trying alternative')
    }
    
    // Alternative approach: manually create list
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    if (!range) return
    
    const ul = document.createElement('ul')
    const li = document.createElement('li')
    li.innerHTML = '&nbsp;'
    ul.appendChild(li)
    
    try {
      range.deleteContents()
      range.insertNode(ul)
      
      // Place cursor in the list item
      const newRange = document.createRange()
      newRange.selectNodeContents(li)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      scheduleHistoryPush()
    } catch (error) {
      console.error('Failed to insert list:', error)
    }
  }
  
  const insertOrdered = () => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    
    // Get current selection
    const selection = window.getSelection()
    if (!selection) return
    
    // Try the standard approach first
    try {
      document.execCommand('insertOrderedList', false)
      scheduleHistoryPush()
      return
    } catch (error) {
      console.log('Standard approach failed, trying alternative')
    }
    
    // Alternative approach: manually create list
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    if (!range) return
    
    const ol = document.createElement('ol')
    const li = document.createElement('li')
    li.innerHTML = '&nbsp;'
    ol.appendChild(li)
    
    try {
      range.deleteContents()
      range.insertNode(ol)
      
      // Place cursor in the list item
      const newRange = document.createRange()
      newRange.selectNodeContents(li)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      scheduleHistoryPush()
    } catch (error) {
      console.error('Failed to insert list:', error)
    }
  }

  // Image upload functionality
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      // Get current user
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to upload images')
        return
      }

      // Upload to storage
      const result = await uploadFile('supporting', file, user.id, projectId)
      
      // Get public URL for the uploaded image
      const { data: publicUrl } = supabase.storage
        .from('project-assets')
        .getPublicUrl(result.path)

      // Insert image into editor
      if (editorRef.current) {
        editorRef.current.focus()
        
        // Create image element
        const img = document.createElement('img')
        img.src = publicUrl.publicUrl
        img.alt = file.name
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        img.style.margin = '10px 0'

        // Insert into editor
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(img)
          
          // Move cursor after image
          range.setStartAfter(img)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }

        scheduleHistoryPush()
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerImageUpload = () => {
    setShowImageDropdown(false)
    fileInputRef.current?.click()
  }

  const handleImageFromUrl = () => {
    setShowImageDropdown(false)
    setShowUrlInput(true)
    setImageUrl("")
  }

  const importImageFromUrl = () => {
    if (!imageUrl.trim()) {
      alert('Please enter a valid image URL')
      return
    }

    if (editorRef.current) {
      editorRef.current.focus()
      
      // Create image element
      const img = document.createElement('img')
      img.src = imageUrl.trim()
      img.alt = 'Image'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      img.style.margin = '10px 0'

      // Insert into editor
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        
        // Move cursor after image
        range.setStartAfter(img)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      scheduleHistoryPush()
    }

    // Reset and close
    setShowUrlInput(false)
    setImageUrl("")
  }

  const cancelUrlInput = () => {
    setShowUrlInput(false)
    setImageUrl("")
  }

  // Link management functions
  const loadAvailableElements = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) throw error
      setAvailableElements(data || [])
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }

  const handleOpenLinkModal = () => {
    // Save current cursor position
    if (editorRef.current && document.activeElement === editorRef.current) {
      const selection = getSelectionOffsets()
      setSavedSelection(selection)
    } else {
      // If editor is not focused, place cursor at the end
      setSavedSelection(null)
    }
    
    setShowLinkModal(true)
    setLinkSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
    loadAvailableElements()
  }

  const handleCloseLinkModal = () => {
    setShowLinkModal(false)
    setLinkSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
    setSavedSelection(null)
  }

  const handleLinkElement = (element: WorldElement) => {
    if (editorRef.current) {
      editorRef.current.focus()
      
      // Restore cursor position if we have it saved, otherwise use current position
      let insertPosition = savedSelection || getSelectionOffsets()
      setSelectionOffsets(insertPosition.start, insertPosition.end)
      
      // Create a link to the world element
      const link = document.createElement('a')
      link.href = `#world-element-${element.id}`
      link.textContent = element.name
      link.style.color = '#3b82f6'
      link.style.textDecoration = 'underline'
      link.title = `${element.category}: ${element.name}`
      link.setAttribute('data-world-element-id', element.id)
      link.setAttribute('data-world-element-category', element.category)

      // Insert into editor at the cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(link)
        
        // Add a space after the link for better UX
        const space = document.createTextNode(' ')
        range.setStartAfter(link)
        range.insertNode(space)
        
        // Move cursor after the space
        range.setStartAfter(space)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Fallback: if no selection, append at the end
        editorRef.current.appendChild(link)
        editorRef.current.appendChild(document.createTextNode(' '))
      }

      scheduleHistoryPush()
    }

    handleCloseLinkModal()
  }

  const handleCreateAndLinkElement = async () => {
    if (!newElementName.trim()) return

    try {
      const supabase = createSupabaseClient()
      const newElement = {
        project_id: projectId,
        category: newElementCategory,
        name: newElementName.trim(),
        description: '',
        attributes: {},
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error

      // Link the newly created element
      handleLinkElement(data)
    } catch (error) {
      console.error('Error creating and linking element:', error)
      alert('Failed to create element. Please try again.')
    }
  }

  const getFilteredElements = () => {
    if (!linkSearchTerm.trim()) return availableElements
    
    return availableElements.filter(element =>
      element.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
      element.category.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(linkSearchTerm.toLowerCase())
    )
  }

  // Selection text size (only selected text)
  const applyTextSize = (px: number) => {
    focusEditor()
    const sel = getSelectionOffsets()
    document.execCommand('fontSize', false, '7')
    const root = editorRef.current
    if (!root) return
    const fonts = Array.from(root.querySelectorAll('font[size="7"]'))
    fonts.forEach(f => {
      const span = document.createElement('span')
      span.style.fontSize = `${px}px`
      span.innerHTML = f.innerHTML
      f.replaceWith(span)
    })
    setSelectionOffsets(sel.start, sel.end)
    scheduleHistoryPush()
  }

  // ===== Auto-save after 2s idle =====
  const [autoTick, setAutoTick] = useState(0)
  const [lastWordCount, setLastWordCount] = useState(0)
  const onInput = () => { 
    setAutoTick(t => t + 1); 
    scheduleHistoryPush()
    
    // Check for word count milestones
    const currentCount = computeWordCount()
    const milestones = [250, 500, 1000, 1500, 2000, 2500]
    const lastMilestone = milestones.filter(m => m <= lastWordCount).pop() || 0
    const currentMilestone = milestones.filter(m => m <= currentCount).pop() || 0
    
    if (currentMilestone > lastMilestone) {
      setShowEncouragement(true)
      setTimeout(() => setShowEncouragement(false), 5000) // Auto-hide after 5 seconds
    }
    
    setLastWordCount(currentCount)
  }
  useEffect(() => {
    if (!selectedChapter) return
    const html = getHTML()
    if (html === lastSavedHTML) return
    const t = setTimeout(() => { autoSaveChapter() }, 2000)
    return () => clearTimeout(t)
  }, [autoTick, selectedChapter, lastSavedHTML])

  const autoSaveChapter = async () => {
    if (!selectedChapter) return
    const html = getHTML()
    if (html === lastSavedHTML) return
    setAutoSaving(true)
    try {
      const supabase = createSupabaseClient()
      await supabase
        .from('project_chapters')
        .update({ title: title.trim() || selectedChapter.title, content: html, word_count: computeWordCount(), updated_at: new Date().toISOString() })
        .eq('id', selectedChapter.id)
      setLastSavedHTML(html)
    } catch (e) { console.error(e) } finally { setAutoSaving(false) }
  }

  // ===== Undo/Redo with caret =====
  const canUndo = hIndex > 0
  const canRedo = hIndex >= 0 && hIndex < history.length - 1
  const doUndo = () => {
    if (!canUndo) return
    const idx = hIndex - 1
    const snap = history[idx]
    applyHTML(snap.html, { start: snap.start, end: snap.end }, false)
    setHIndex(idx)
  }
  const doRedo = () => {
    if (!canRedo) return
    const idx = hIndex + 1
    const snap = history[idx]
    applyHTML(snap.html, { start: snap.start, end: snap.end }, false)
    setHIndex(idx)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const k = e.key.toLowerCase()
    if (k === 'b') { e.preventDefault(); exec('bold') }
    else if (k === 'i') { e.preventDefault(); exec('italic') }
    else if (k === 'u') { e.preventDefault(); exec('underline') }
    else if (k === 'f') { e.preventDefault(); setShowFindReplace(true) }
    else if (k === 's' && e.shiftKey) { e.preventDefault(); startWritingSprint(15) }
    else if (k === 's') { e.preventDefault(); saveChapter() }
    else if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo() }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo() }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'published': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading chapters...</div></div>

  const wordCount = computeWordCount()
  const hasUnsaved = getHTML() !== lastSavedHTML

  return (
    <div className={`h-screen overflow-hidden flex flex-col ${focusMode ? 'bg-gray-900' : ''}`}>
      <div className="flex-1 flex flex-col min-h-0">
        {selectedChapter ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`border-b border-gray-200 bg-white ${focusMode ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setSelectedChapter(chapters[currentChapterIndex - 1])} variant="ghost" size="sm" disabled={currentChapterIndex === 0} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button onClick={() => setSelectedChapter(chapters[currentChapterIndex + 1])} variant="ghost" size="sm" disabled={currentChapterIndex === chapters.length - 1} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                  <Separator orientation="vertical" className="h-6" />
                  <span className="text-sm text-gray-600">Chapter {currentChapterIndex + 1} of {chapters.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {autoSaving && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      Auto-saving...
                    </div>
                  )}
                  {!autoSaving && hasUnsaved && <div className="text-xs text-orange-600">Unsaved changes</div>}
                  {!autoSaving && !hasUnsaved && getHTML() && <div className="text-xs text-green-600">✓ Saved</div>}
                  <Button onClick={saveChapter} disabled={saving || autoSaving} size="sm" className="h-8"><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Now'}</Button>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100 bg-white">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 shadow-none" placeholder="Chapter Title" />
            </div>

            <div className={`flex-1 overflow-y-auto min-h-0 ${focusMode ? 'bg-gray-900' : 'bg-white'}`}>
              {/* Focus Mode Exit Banner */}
              {focusMode && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Focus Mode Active</span>
                    <span className="text-sm opacity-90">Distraction-free writing environment</span>
                  </div>
                  <Button 
                    onClick={() => setFocusMode(false)} 
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Exit Focus Mode
                  </Button>
                </div>
              )}

              {/* Sprint Mode Exit Banner */}
              {sprintMode && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <span className="font-medium">Sprint Mode Active</span>
                    <span className="text-sm opacity-90">
                      {formatTime(sprintTimeLeft)} remaining | +{computeWordCount() - sprintStartWords} words
                    </span>
                  </div>
                  <Button 
                    onClick={() => {
                      setSprintMode(false)
                      setFocusMode(false)
                    }} 
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <X className="h-4 w-4 mr-1" />
                    End Sprint
                  </Button>
                </div>
              )}
              {/* Google Docs Style Toolbar */}
              <div className={`sticky top-0 z-50 border-b border-gray-300 px-4 py-2 ${focusMode ? 'bg-gray-800 border-gray-600 hidden' : 'bg-white'}`}>
                {/* Top row with font and formatting options */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {/* Undo/Redo */}
                    <button 
                      onClick={doUndo} 
                      disabled={!canUndo}
                      className={`p-2 rounded hover:bg-gray-100 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Undo (Ctrl+Z)"
                    >
                      <UndoIcon className="h-4 w-4 text-gray-700" />
                    </button>
                    <button 
                      onClick={doRedo} 
                      disabled={!canRedo}
                      className={`p-2 rounded hover:bg-gray-100 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Redo (Ctrl+Y)"
                    >
                      <RedoIcon className="h-4 w-4 text-gray-700" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    {/* Font and size */}
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm min-w-[120px] focus:outline-none focus:border-blue-500">
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Calibri</option>
                      <option>Helvetica</option>
                    </select>
                    
                    <select 
                      onChange={(e) => applyTextSize(parseInt(e.target.value, 10))}
                      defaultValue="11"
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-16 focus:outline-none focus:border-blue-500"
                    >
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                      <option value="14">14</option>
                      <option value="16">16</option>
                      <option value="18">18</option>
                      <option value="20">20</option>
                      <option value="24">24</option>
                      <option value="26">26</option>
                      <option value="28">28</option>
                      <option value="36">36</option>
                      <option value="48">48</option>
                      <option value="72">72</option>
                    </select>
                    
                    {/* Find and Replace */}
                    <button 
                      onClick={() => setShowFindReplace(true)}
                      className="p-2 rounded hover:bg-gray-100 text-gray-700 ml-2"
                      title="Find and Replace (Ctrl+F)"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {wordCount} words
                  </div>
                </div>
                
                {/* Main formatting toolbar */}
                <div className="flex items-center gap-1">
                  {/* Text formatting */}
                  <button 
                    onClick={() => exec('bold')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exec('italic')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exec('underline')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* New formatting options */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      className="p-2 rounded hover:bg-gray-100 text-gray-700"
                      title="Text color"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    {showTextColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 min-w-[320px] text-color-picker">
                        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Text Color
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Color Picker</label>
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                              title="Choose color"
                            />
                          </div>

                          {/* Manual Color Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Or enter color code</label>
                            <input
                              type="text"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              placeholder="#000000, rgb(0,0,0), hsl(0,0%,0%), etc."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              title="Enter color in hex, rgb, hsl, or named format"
                            />
                          </div>

                          {/* Current Color Preview */}
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-medium text-gray-600">Preview:</div>
                            <div
                              className="w-8 h-8 rounded border-2 border-gray-300"
                              style={{ backgroundColor: textColor }}
                              title={`Current color: ${textColor}`}
                            ></div>
                            <div className="text-xs text-gray-500 font-mono">{textColor}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => applyTextColor(textColor)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
                          >
                            Apply Text Color
                          </button>
                          <button
                            onClick={() => setTextColor('#000000')}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                            title="Reset to black"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                      className="p-2 rounded hover:bg-gray-100 text-gray-700"
                      title="Background highlight"
                    >
                      <Highlighter className="h-4 w-4" />
                    </button>
                    {showHighlightPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 min-w-[320px] highlight-picker">
                        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Highlighter className="h-4 w-4" />
                          Highlight Color
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Color Picker</label>
                            <input
                              type="color"
                              value={highlightColor}
                              onChange={(e) => setHighlightColor(e.target.value)}
                              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                              title="Choose highlight color"
                            />
                          </div>

                          {/* Manual Color Input */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Or enter color code</label>
                            <input
                              type="text"
                              value={highlightColor}
                              onChange={(e) => setHighlightColor(e.target.value)}
                              placeholder="#FFFF00, rgb(255,255,0), hsl(60,100%,50%), etc."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                              title="Enter highlight color in hex, rgb, hsl, or named format"
                            />
                          </div>

                          {/* Current Color Preview */}
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-medium text-gray-600">Preview:</div>
                            <div
                              className="w-8 h-8 rounded border-2 border-gray-300"
                              style={{ backgroundColor: highlightColor }}
                              title={`Current highlight: ${highlightColor}`}
                            ></div>
                            <div className="text-xs text-gray-500 font-mono">{highlightColor}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => applyHighlightColor(highlightColor)}
                            className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors font-medium"
                          >
                            Apply Highlight
                          </button>
                          <button
                            onClick={() => setHighlightColor('#FFFF00')}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                            title="Reset to yellow"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={applyIndent}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Increase indent"
                  >
                    <Indent className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={applyOutdent}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Decrease indent"
                  >
                    <Indent className="h-4 w-4 transform rotate-180" />
                  </button>
                  <button 
                    onClick={clearFormatting}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Clear formatting"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={applyBlockquote}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Blockquote"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Text alignment */}
                  <button 
                    onClick={() => exec('justifyLeft')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Align left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exec('justifyCenter')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Align center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exec('justifyRight')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Align right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exec('justifyFull')}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Justify"
                  >
                    <AlignJustify className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Lists */}
                  <button 
                    onClick={insertUnordered}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Bulleted list"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={insertOrdered}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Numbered list"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  {/* Insert options */}
                  <button 
                    onClick={handleOpenLinkModal}
                    className="p-2 rounded hover:bg-gray-100 text-gray-700"
                    title="Link to world element"
                  >
                    <Link className="h-4 w-4" />
                  </button>
                  
                  {/* Image dropdown */}
                  <div className="relative" ref={imageDropdownRef}>
                    <button 
                      onClick={() => setShowImageDropdown(!showImageDropdown)}
                      disabled={uploadingImage}
                      className={`p-2 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-1 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={uploadingImage ? "Uploading..." : "Insert image"}
                    >
                      <Image className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {showImageDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={triggerImageUpload}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Image className="h-4 w-4" />
                          Upload from device
                        </button>
                        <button
                          onClick={handleImageFromUrl}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          Enter URL
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowWritingAssistant(!showWritingAssistant)}
                      className="p-2 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-1" 
                      title="Writing Assistant"
                    >
                      <Lightbulb className="h-4 w-4" />
                      {showWritingAssistant && <ChevronDown className="h-3 w-3" />}
                      {!showWritingAssistant && <ChevronRight className="h-3 w-3" />}
                    </button>
                    
                    {showWritingAssistant && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48">
                        <button
                          onClick={() => {
                            setShowWordTargetModal(true)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Target className="h-4 w-4" />
                          Set Word Target
                        </button>
                        <button
                          onClick={() => {
                            setShowNotesPanel(!showNotesPanel)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <StickyNote className="h-4 w-4" />
                          Chapter Notes
                        </button>
                        <button
                          onClick={() => {
                            generateWritingPrompts()
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          Writing Prompts
                        </button>
                        <button
                          onClick={() => {
                            setShowSprintStats(true)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Sprint Statistics
                        </button>
                        <button
                          onClick={() => {
                            setShowDailyGoals(true)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Target className="h-4 w-4" />
                          Daily Goals
                        </button>
                        <button
                          onClick={() => {
                            setShowTemplateManager(true)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Manage Templates
                        </button>
                        <button
                          onClick={() => {
                            const selection = window.getSelection()
                            if (selection && selection.toString().length > 0) {
                              const text = selection.toString()
                              const wordCount = text.trim().split(/\s+/).length
                              alert(`Selected text: ${wordCount} words, ~${Math.ceil(wordCount / 200)} min read`)
                            } else {
                              alert('Please select some text first')
                            }
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <MousePointer className="h-4 w-4" />
                          Analyze Selection
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setFocusMode(!focusMode)
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Target className="h-4 w-4" />
                          {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
                        </button>
                        <button
                          onClick={() => {
                            if (!sprintMode) {
                              const minutes = prompt('Sprint duration (minutes):', '15')
                              if (minutes) {
                                startWritingSprint(parseInt(minutes))
                              }
                            } else {
                              setSprintMode(false)
                              setFocusMode(false)
                            }
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          {sprintMode ? 'Stop Sprint' : 'Start Writing Sprint'}
                        </button>
                        {!sprintMode && (
                          <div className="px-3 py-1">
                            <div className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Start</div>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                onClick={() => {
                                  startWritingSprint(5)
                                  setShowWritingAssistant(false)
                                }}
                                className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded"
                              >
                                5min
                              </button>
                              <button
                                onClick={() => {
                                  startWritingSprint(15)
                                  setShowWritingAssistant(false)
                                }}
                                className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded"
                              >
                                15min
                              </button>
                              <button
                                onClick={() => {
                                  startWritingSprint(25)
                                  setShowWritingAssistant(false)
                                }}
                                className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded"
                              >
                                25min
                              </button>
                            </div>
                          </div>
                        )}
                        <hr className="my-1" />
                        <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">Quick Insert</div>
                        <button
                          onClick={() => {
                            insertQuickText('[SCENE BREAK]\n\n')
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Scene Break
                        </button>
                        <button
                          onClick={() => {
                            insertQuickText('[TIME SKIP]\n\n')
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Time Skip
                        </button>
                        <button
                          onClick={() => {
                            insertQuickText('[POV CHANGE]\n\n')
                            setShowWritingAssistant(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          POV Change
                        </button>
                        <hr className="my-1" />
                        <div className="px-3 py-1">
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Keyboard Shortcuts</div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Ctrl+B: Bold</div>
                            <div>Ctrl+I: Italic</div>
                            <div>Ctrl+F: Find and Replace</div>
                            <div>Ctrl+Shift+S: Start 15min Sprint</div>
                            <div>Ctrl+S: Save</div>
                            <div>Tab: Indent</div>
                            <div>Shift+Tab: Outdent</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* URL Input Field */}
              {showUrlInput && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-blue-900">
                        Enter image URL:
                      </label>
                      <Input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 max-w-md"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            importImageFromUrl()
                          } else if (e.key === 'Escape') {
                            cancelUrlInput()
                          }
                        }}
                      />
                      <Button
                        onClick={importImageFromUrl}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Import
                      </Button>
                      <Button
                        onClick={cancelUrlInput}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Docs Style Editor */}
              <div className="bg-gray-100 min-h-full">
                <div className="max-w-4xl mx-auto py-8">
                  <div className={`shadow-sm min-h-[800px] mx-4 ${focusMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Document styling */}
                    <style jsx global>{`
                      .google-docs-editor {
                        font-family: 'Arial', sans-serif !important;
                        font-size: 11pt !important;
                        line-height: 1.5 !important;
                        color: ${focusMode ? '#e5e7eb' : '#000'} !important;
                        background-color: ${focusMode ? '#374151' : '#ffffff'} !important;
                        padding: 96px 96px 96px 96px; /* 1 inch margins */
                        font-weight: 400 !important;
                      }
                      .google-docs-editor * {
                        font-family: inherit !important;
                      }
                      .google-docs-editor:empty:before {
                        content: "Start writing...";
                        color: ${focusMode ? '#6b7280' : '#9aa0a6'};
                        pointer-events: none;
                      }
                      .google-docs-editor:focus {
                        outline: none;
                      }
                      .google-docs-editor h1 {
                        font-size: 20pt !important;
                        font-weight: 400 !important;
                        margin: 12pt 0 6pt 0 !important;
                        padding: 0 !important;
                        line-height: 1.2 !important;
                      }
                      .google-docs-editor h2 {
                        font-size: 16pt !important;
                        font-weight: 400 !important;
                        margin: 10pt 0 6pt 0 !important;
                        padding: 0 !important;
                        line-height: 1.2 !important;
                      }
                      .google-docs-editor h3 {
                        font-size: 14pt !important;
                        font-weight: 400 !important;
                        margin: 8pt 0 6pt 0 !important;
                        padding: 0 !important;
                        line-height: 1.2 !important;
                      }
                      .google-docs-editor p {
                        margin: 0 0 6pt 0 !important;
                        font-size: 11pt !important;
                        font-weight: 400 !important;
                        line-height: 1.5 !important;
                      }
                      .google-docs-editor ul, .google-docs-editor ol {
                        margin: 0 0 6pt 0;
                        padding-left: 18pt;
                        list-style-position: outside;
                      }
                      .google-docs-editor ul {
                        list-style-type: disc;
                      }
                      .google-docs-editor ol {
                        list-style-type: decimal;
                      }
                      .google-docs-editor li {
                        margin: 0 0 6pt 0;
                        padding-left: 0;
                      }
                      .google-docs-editor ul ul {
                        list-style-type: circle;
                      }
                      .google-docs-editor ul ul ul {
                        list-style-type: square;
                      }
                      .google-docs-editor blockquote {
                        margin: 12pt 0;
                        padding: 8pt 16pt;
                        border-left: 4px solid #e5e7eb;
                        background-color: #f9fafb;
                        font-style: italic;
                        color: #6b7280;
                      }
                      .google-docs-editor [style*="color"] {
                        /* Preserve text colors */
                      }
                      .google-docs-editor [style*="background-color"] {
                        /* Preserve background colors */
                      }
                      /* Simulate page breaks */
                      .page-break {
                        page-break-before: always;
                        border-top: 1px dashed #ccc;
                        margin-top: 48pt;
                        padding-top: 48pt;
                      }
                    `}</style>
                    
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => { setAutoTick(t => t + 1); scheduleHistoryPush() }}
                      onKeyDown={(e) => {
                        // Handle Tab for indent/outdent
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          if (e.shiftKey) {
                            applyOutdent()
                          } else {
                            applyIndent()
                          }
                        }
                        // Handle other shortcuts
                        if (!(e.ctrlKey || e.metaKey)) return
                        const k = e.key.toLowerCase()
                        if (k === 'b') { e.preventDefault(); exec('bold') }
                        else if (k === 'i') { e.preventDefault(); exec('italic') }
                        else if (k === 'u') { e.preventDefault(); exec('underline') }
                        else if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo() }
                        else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo() }
                        else if (k === 's') { e.preventDefault(); saveChapter() }
                      }}
                      className="google-docs-editor"
                    />
                    
                    {/* Hidden file input for image upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Words: {wordCount}</span>
                <span>Target: {selectedChapter?.target_word_count}</span>
                <Badge variant="outline" className={getStatusColor(selectedChapter?.status || 'draft')}>{selectedChapter?.status}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{computeReadingTime()} min read
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Daily: {getDailyProgress()}/{dailyGoal}
                  <div className="ml-2 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300" 
                      style={{ width: `${Math.min(100, (getDailyProgress() / dailyGoal) * 100)}%` }}
                    ></div>
                  </div>
                </span>
                {sprintMode && (
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <Zap className="h-3 w-3" />
                    Sprint: {formatTime(sprintTimeLeft)} | Words: +{computeWordCount() - sprintStartWords}
                  </span>
                )}
                {focusMode && !sprintMode && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <Target className="h-3 w-3" />
                    Focus Mode
                  </span>
                )}
                {uploadingImage && <span className="text-blue-600">Uploading image...</span>}
              </div>
              <div>Last updated: {new Date(selectedChapter?.updated_at || '').toLocaleDateString()}</div>
            </div>

            {/* Writing Assistant Panels */}
            {showEncouragement && (
              <div className="border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-800">
                        {getEncouragementMessage(computeWordCount())}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowEncouragement(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {showNotesPanel && (
              <div className="border-t border-gray-200 bg-yellow-50">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Chapter Notes
                    </h4>
                    <button
                      onClick={() => setShowNotesPanel(false)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    value={chapterNotes}
                    onChange={(e) => setChapterNotes(e.target.value)}
                    placeholder="Add notes, ideas, or reminders for this chapter..."
                    className="w-full h-20 p-2 text-sm border border-yellow-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>
            )}

            {showPrompts && (
              <div className="border-t border-gray-200 bg-blue-50">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-800 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Writing Prompts
                    </h4>
                    <button
                      onClick={() => setShowPrompts(false)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2">
                    {writingPrompts.map((prompt, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 flex-1">{prompt}</span>
                          <button
                            onClick={() => toggleFavoritePrompt(prompt)}
                            className={`ml-2 p-1 rounded ${
                              favoritePrompts.includes(prompt) 
                                ? 'text-yellow-500 hover:text-yellow-600' 
                                : 'text-gray-400 hover:text-gray-500'
                            }`}
                            title={favoritePrompts.includes(prompt) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            ★
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={generateWritingPrompts}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Generate New Prompts
                  </button>
                  {favoritePrompts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">⭐ Favorite Prompts</h5>
                      <div className="space-y-1">
                        {favoritePrompts.map((prompt, index) => (
                          <div key={index} className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm text-gray-700">
                            {prompt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showReadabilityStats && (
              <div className="border-t border-gray-200 bg-green-50">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Readability Analysis
                    </h4>
                    <button
                      onClick={() => setShowReadabilityStats(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                  {(() => {
                    const stats = computeReadabilityStats()
                    return stats ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-700">Reading Level</div>
                          <div className="text-gray-600">{stats.level}</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700">Flesch Score</div>
                          <div className="text-gray-600">{stats.score}/100</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700">Avg Words/Sentence</div>
                          <div className="text-gray-600">{stats.avgWordsPerSentence}</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700">Avg Syllables/Word</div>
                          <div className="text-gray-600">{stats.avgSyllablesPerWord}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Start writing to see readability statistics</div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-500 mb-4">No chapter selected</div>
              <Button onClick={() => {
                const nextChapterNumber = Math.max(0, ...chapters.map(c => c.chapter_number)) + 1
                const newTitle = `Chapter ${nextChapterNumber}`
                createSupabaseClient().from('project_chapters').insert({
                  project_id: projectId,
                  chapter_number: nextChapterNumber,
                  title: newTitle,
                  content: '',
                  word_count: 0,
                  target_word_count: 2500,
                  status: 'draft',
                  notes: ''
                }).select().single().then(({ data }) => {
                  if (data) {
                    const newCh = data as Chapter
                    setChapters(prev => [...prev, newCh])
                    setSelectedChapter(newCh)
                    setTitle(newTitle)
                    if (editorRef.current) editorRef.current.innerHTML = ''
                  }
                })
              }}>
                <Plus className="h-4 w-4 mr-2" />Create your first chapter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Link Element Modal */}
      {showLinkModal && (
        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-100 pb-6 bg-gradient-to-r from-blue-50 to-purple-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Link className="w-5 h-5 text-white" />
                </div>
                Link to World Element
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Link to characters, locations, and other world building elements in your story.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col h-full pt-6">
              {/* Tabs */}
              <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 mb-6 shadow-inner">
                <button
                  onClick={() => setShowCreateNewElement(false)}
                  className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    !showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Select Element
                </button>
                <button
                  onClick={() => setShowCreateNewElement(true)}
                  className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Create New Element
                </button>
              </div>

              {!showCreateNewElement ? (
                /* Select Element Tab */
                <div className="space-y-6 pb-6">
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Search elements..."
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Elements List */}
                  <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-xl">
                    {getFilteredElements().length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {getFilteredElements().map((element) => (
                          <button
                            key={element.id}
                            onClick={() => handleLinkElement(element)}
                            className="w-full p-4 text-left hover:bg-blue-50 transition-colors group"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  {element.category.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-medium text-gray-900 truncate">{element.name}</div>
                                <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                                {element.description && (
                                  <div className="text-sm text-gray-400 truncate mt-1">{element.description}</div>
                                )}
                              </div>
                              <div className="text-gray-400 group-hover:text-blue-600">
                                {element.category === 'characters' ? <Users className="w-5 h-5" /> : 
                                 element.category === 'locations' ? <MapPin className="w-5 h-5" /> : 
                                 <BookOpen className="w-5 h-5" />}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">No elements found</p>
                        {linkSearchTerm && (
                          <p className="text-sm text-gray-500">Try a different search term</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Create New Element Tab */
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Element Name</label>
                      <Input
                        placeholder="Enter element name..."
                        value={newElementName}
                        onChange={(e) => setNewElementName(e.target.value)}
                        className="w-full py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Category</label>
                      <select
                        value={newElementCategory}
                        onChange={(e) => setNewElementCategory(e.target.value)}
                        className="w-full py-3 px-4 text-base border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        {elementCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Create and link element</p>
                        <p className="text-xs text-gray-500">This will create a new world building element and link it in your chapter</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleCloseLinkModal}
                      className="flex-1 h-12 px-6 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAndLinkElement}
                      disabled={!newElementName.trim()}
                      className="flex-1 h-12 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create Element and Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Word Target Modal */}
      {showWordTargetModal && (
        <Dialog open={showWordTargetModal} onOpenChange={setShowWordTargetModal}>
          <DialogContent className="max-w-md bg-gradient-to-br from-white to-orange-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-orange-100 pb-6 bg-gradient-to-r from-orange-50 to-yellow-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Set Word Target
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Set a target word count for this chapter to track your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Target Word Count</label>
                <Input
                  type="number"
                  defaultValue={selectedChapter?.target_word_count || 2500}
                  onChange={(e) => {
                    if (selectedChapter) {
                      const target = parseInt(e.target.value) || 0
                      // Update the chapter target
                      createSupabaseClient()
                        .from('project_chapters')
                        .update({ target_word_count: target })
                        .eq('id', selectedChapter.id)
                        .then(() => {
                          setSelectedChapter(prev => prev ? { ...prev, target_word_count: target } : null)
                        })
                    }
                  }}
                  placeholder="2500"
                  className="w-full py-3 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-100">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-2">Current Progress</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{computeWordCount()} words</div>
                  {selectedChapter?.target_word_count && (
                    <div className="text-sm text-gray-600">
                      Progress: {Math.round((computeWordCount() / selectedChapter.target_word_count) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowWordTargetModal(false)} className="border-gray-300 hover:bg-gray-50">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sprint Statistics Modal */}
      {showSprintStats && (
        <Dialog open={showSprintStats} onOpenChange={setShowSprintStats}>
          <DialogContent className="max-w-md bg-gradient-to-br from-white to-purple-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-purple-100 pb-6 bg-gradient-to-r from-purple-50 to-pink-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Writing Sprint Statistics
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Your sprint performance over time
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {(() => {
                const stats = getSprintStats()
                return stats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalSprints}</div>
                        <div className="text-sm text-blue-700 font-medium">Total Sprints</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                        <div className="text-3xl font-bold text-green-600 mb-1">{stats.avgWordsPerMinute}</div>
                        <div className="text-sm text-green-700 font-medium">Avg WPM</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{stats.bestSprint.words} words</div>
                      <div className="text-sm text-purple-700 font-medium">Best Sprint ({stats.bestSprint.duration}min)</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Sprints</h4>
                      <div className="space-y-2">
                        {sprintHistory.slice(0, 5).map((sprint, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{new Date(sprint.date).toLocaleDateString()}</span>
                            <span className="text-sm font-medium text-gray-900">{sprint.words} words in {sprint.duration}min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No sprint data yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete your first sprint to see statistics!</p>
                  </div>
                )
              })()}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowSprintStats(false)} className="border-gray-300 hover:bg-gray-50">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Daily Goals Modal */}
      {showDailyGoals && (
        <Dialog open={showDailyGoals} onOpenChange={setShowDailyGoals}>
          <DialogContent className="max-w-md bg-gradient-to-br from-white to-green-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-green-100 pb-6 bg-gradient-to-r from-green-50 to-emerald-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Daily Writing Goals
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Set and track your daily writing targets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Daily Word Goal</label>
                <Input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1000)}
                  className="w-full py-3 text-lg border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-4xl font-bold text-gray-900 mb-2">{getDailyProgress()}</div>
                <div className="text-lg text-gray-700 mb-4">Words written today</div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (getDailyProgress() / dailyGoal) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {Math.round((getDailyProgress() / dailyGoal) * 100)}% of daily goal
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowDailyGoals(false)} className="border-gray-300 hover:bg-gray-50">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-white to-indigo-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-indigo-100 pb-6 bg-gradient-to-r from-indigo-50 to-purple-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Custom Templates
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Create and manage your quick text templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 overflow-y-auto max-h-96">
              {/* Add New Template */}
              <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Add New Template
                </h4>
                <div className="space-y-4">
                  <Input
                    placeholder="Template name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Template content"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    className="w-full h-24 p-3 border border-indigo-200 rounded-lg resize-none focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Button 
                    onClick={addCustomTemplate} 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>

              {/* Existing Templates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Your Templates</h4>
                {customTemplates.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No custom templates yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add one above to get started!</p>
                  </div>
                ) : (
                  customTemplates.map((template, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">{template.name}</h5>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => insertQuickText(template.content)}
                            className="border-indigo-200 hover:bg-indigo-50"
                          >
                            Insert
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteCustomTemplate(index)}
                            className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                        {template.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowTemplateManager(false)} className="border-gray-300 hover:bg-gray-50">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Find and Replace Modal */}
      {showFindReplace && (
        <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-white to-cyan-50 border-0 shadow-2xl">
            <DialogHeader className="border-b border-cyan-100 pb-6 bg-gradient-to-r from-cyan-50 to-blue-50 -m-6 mb-6 p-6 rounded-t-lg">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Find and Replace
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Search for text and replace it throughout your chapter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Find Text */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Find</label>
                <Input
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Enter text to find..."
                  className="w-full py-3 text-base border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      performFind()
                    }
                  }}
                />
              </div>

              {/* Replace Text */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Replace with</label>
                <Input
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Enter replacement text..."
                  className="w-full py-3 text-base border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={(e) => setMatchCase(e.target.checked)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Match case
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wholeWord}
                    onChange={(e) => setWholeWord(e.target.checked)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Whole words only
                </label>
              </div>

              {/* Results */}
              {findResults.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-2">
                      Found {findResults.length} match{findResults.length !== 1 ? 'es' : ''}
                      {currentFindIndex >= 0 && ` (showing ${currentFindIndex + 1} of ${findResults.length})`}
                    </div>
                    {replaceCount > 0 && (
                      <div className="text-green-600 font-medium">
                        Replaced {replaceCount} instance{replaceCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={performFind}
                  disabled={!findText.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find
                </Button>
                <Button
                  onClick={findNext}
                  disabled={findResults.length === 0}
                  variant="outline"
                  className="border-cyan-200 hover:bg-cyan-50"
                >
                  Next
                </Button>
                <Button
                  onClick={findPrevious}
                  disabled={findResults.length === 0}
                  variant="outline"
                  className="border-cyan-200 hover:bg-cyan-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={performReplace}
                  disabled={findResults.length === 0 || currentFindIndex < 0}
                  variant="outline"
                  className="border-orange-200 hover:bg-orange-50 text-orange-700"
                >
                  <Replace className="w-4 h-4 mr-2" />
                  Replace
                </Button>
                <Button
                  onClick={replaceAll}
                  disabled={!findText.trim()}
                  variant="outline"
                  className="border-red-200 hover:bg-red-50 text-red-700"
                >
                  Replace All
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  resetFindReplace()
                  setShowFindReplace(false)
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

