'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  FileText, 
  Edit3, 
  Trash2,
  Book,
  BookOpen,
  FileEdit,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notes: '',
    target_word_count: 2500
  })

  useEffect(() => {
    loadChapters()
  }, [projectId])

  const loadChapters = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_number', { ascending: true })

      if (error) {
        console.error('Error loading chapters:', error)
        return
      }

      setChapters(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createChapter = () => {
    const nextChapterNumber = Math.max(0, ...chapters.map(c => c.chapter_number)) + 1
    setFormData({ 
      title: `Chapter ${nextChapterNumber}`, 
      content: '', 
      notes: '',
      target_word_count: 2500
    })
    setEditingChapter(null)
    setIsCreating(true)
  }

  const editChapter = (chapter: Chapter) => {
    setFormData({
      title: chapter.title,
      content: chapter.content,
      notes: chapter.notes,
      target_word_count: chapter.target_word_count
    })
    setEditingChapter(chapter)
    setIsCreating(true)
  }

  const saveChapter = async () => {
    if (!formData.title.trim()) return

    try {
      const supabase = createSupabaseClient()
      const wordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length
      
      const chapterData = {
        project_id: projectId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        notes: formData.notes.trim(),
        word_count: wordCount,
        target_word_count: formData.target_word_count,
        status: 'draft' as const
      }

      if (editingChapter) {
        // Update existing chapter
        const { error } = await supabase
          .from('chapters')
          .update(chapterData)
          .eq('id', editingChapter.id)

        if (error) {
          console.error('Error updating chapter:', error)
          return
        }
      } else {
        // Create new chapter
        const nextChapterNumber = Math.max(0, ...chapters.map(c => c.chapter_number)) + 1
        const { error } = await supabase
          .from('chapters')
          .insert([{
            ...chapterData,
            chapter_number: nextChapterNumber
          }])

        if (error) {
          console.error('Error creating chapter:', error)
          return
        }
      }

      setIsCreating(false)
      setEditingChapter(null)
      loadChapters()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)

      if (error) {
        console.error('Error deleting chapter:', error)
        return
      }

      setChapters(chapters.filter(c => c.id !== chapterId))
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const updateChapterStatus = async (chapterId: string, status: Chapter['status']) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('chapters')
        .update({ status })
        .eq('id', chapterId)

      if (error) {
        console.error('Error updating chapter status:', error)
        return
      }

      setChapters(chapters.map(c => 
        c.id === chapterId ? { ...c, status } : c
      ))
      
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter({ ...selectedChapter, status })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingChapter(null)
    setFormData({ title: '', content: '', notes: '', target_word_count: 2500 })
  }

  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'published': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (wordCount: number, targetWordCount: number) => {
    return Math.min(100, Math.round((wordCount / targetWordCount) * 100))
  }

  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isCreating) {
    return (
      <div className="h-full bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingChapter ? 'Edit Chapter' : 'New Chapter'}
              </h2>
              <p className="text-gray-600">Write and organize your story chapters</p>
            </div>
            <Button onClick={cancelEdit} variant="outline">
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter chapter title..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Word Count
                </label>
                <Input
                  type="number"
                  value={formData.target_word_count}
                  onChange={(e) => setFormData({ ...formData, target_word_count: parseInt(e.target.value) || 2500 })}
                  placeholder="2500"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Content
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your chapter content here..."
                className="w-full h-64 font-mono"
              />
              <div className="text-sm text-gray-500 mt-2">
                Current word count: {formData.content.trim().split(/\s+/).filter(word => word.length > 0).length}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Chapter notes, plot points, reminders..."
                className="w-full h-24"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button onClick={cancelEdit} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={saveChapter}
                disabled={!formData.title.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {editingChapter ? 'Update Chapter' : 'Create Chapter'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chapters</h1>
              <p className="text-gray-600">Write and organize your story chapters</p>
            </div>
          </div>
          <Button onClick={createChapter} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            New Chapter
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Chapters List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                {filteredChapters.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
                    <p className="text-gray-600 mb-4">Create your first chapter to get started</p>
                    <Button onClick={createChapter} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Chapter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredChapters.map((chapter) => {
                      const progress = getProgressPercentage(chapter.word_count, chapter.target_word_count)
                      return (
                        <Card 
                          key={chapter.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedChapter?.id === chapter.id ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                          }`}
                          onClick={() => setSelectedChapter(chapter)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500">
                                    Chapter {chapter.chapter_number}
                                  </span>
                                  <Badge className={getStatusColor(chapter.status)}>
                                    {chapter.status}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">{chapter.title}</h3>
                                <div className="text-xs text-gray-500 mb-2">
                                  {chapter.word_count} / {chapter.target_word_count} words ({progress}%)
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    editChapter(chapter)
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteChapter(chapter.id)
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chapter Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedChapter ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedChapter.title}</h2>
                        <p className="text-gray-600">Chapter {selectedChapter.chapter_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedChapter.status}
                        onChange={(e) => updateChapterStatus(selectedChapter.id, e.target.value as Chapter['status'])}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="draft">Draft</option>
                        <option value="in_review">In Review</option>
                        <option value="completed">Completed</option>
                        <option value="published">Published</option>
                      </select>
                      <Button
                        onClick={() => editChapter(selectedChapter)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteChapter(selectedChapter.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Writing Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Word Count</span>
                            <span>{selectedChapter.word_count} / {selectedChapter.target_word_count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${getProgressPercentage(selectedChapter.word_count, selectedChapter.target_word_count)}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            {getProgressPercentage(selectedChapter.word_count, selectedChapter.target_word_count)}% complete
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          {selectedChapter.content ? (
                            <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                              {selectedChapter.content.substring(0, 500)}
                              {selectedChapter.content.length > 500 && '...'}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No content yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    {selectedChapter.notes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm">
                            {selectedChapter.notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <FileEdit className="w-5 h-5 mb-1 text-orange-500" />
                            <span className="text-sm">Edit Chapter</span>
                          </Button>
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <Eye className="w-5 h-5 mb-1 text-blue-500" />
                            <span className="text-sm">Preview</span>
                          </Button>
                          <Button variant="outline" className="h-auto py-3 flex flex-col items-center">
                            <Book className="w-5 h-5 mb-1 text-green-500" />
                            <span className="text-sm">Export</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chapter Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-700">Created</label>
                            <p className="text-gray-600">
                              {new Date(selectedChapter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">Last Updated</label>
                            <p className="text-gray-600">
                              {new Date(selectedChapter.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chapter</h3>
                    <p className="text-gray-600">Choose a chapter from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
