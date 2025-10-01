'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Crown, Search, Grid3x3, List, Eye, X, Edit3, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createSupabaseClient } from '@/lib/auth'

import { Culture } from '@/lib/validation/cultureSchema'
import CultureCard from '@/components/cultures/CultureCard'
import CultureEditor from '@/components/cultures/CultureEditor'
import DeleteConfirmDialog from '@/components/cultures/DeleteConfirmDialog'

interface CulturesPanelProps {
  projectId: string
  selectedElement?: any
  onCulturesChange?: () => void
  onClearSelection?: () => void
}

export default function CulturesPanel({ projectId, selectedElement, onCulturesChange, onClearSelection }: CulturesPanelProps) {
  const [cultures, setCultures] = useState<Culture[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingCulture, setEditingCulture] = useState<Partial<Culture> | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cultureToDelete, setCultureToDelete] = useState<Culture | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewCulture, setPreviewCulture] = useState<Culture | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadCultures()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'cultures') {
      // Transform selectedElement to Culture format
      const culture: Partial<Culture> = {
        id: selectedElement.id,
        name: selectedElement.name,
        description: selectedElement.description,
        attributes: selectedElement.attributes || {},
        tags: selectedElement.tags || [],
        project_id: selectedElement.project_id,
        created_at: selectedElement.created_at,
        updated_at: selectedElement.updated_at,
        category: 'cultures'
      }
      setEditingCulture(culture)
      setIsCreating(false)
    }
  }, [selectedElement])

  const loadCultures = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'cultures')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedCultures: Culture[] = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        category: 'cultures',
        name: item.name,
        description: item.description || '',
        tags: item.tags || [],
        attributes: item.attributes || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      }))

      setCultures(transformedCultures)
    } catch (error) {
      console.error('Error loading cultures:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingCulture({
      name: '',
      description: '',
      tags: [],
      attributes: {},
      project_id: projectId,
      category: 'cultures'
    })
    setIsCreating(true)
  }

  const handleEdit = (culture: Culture) => {
    setEditingCulture(culture)
    setIsCreating(false)
  }

  const handleDelete = (culture: Culture) => {
    setCultureToDelete(culture)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!cultureToDelete) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', cultureToDelete.id)

      if (error) throw error

      setCultures(prev => prev.filter(c => c.id !== cultureToDelete.id))
      setDeleteDialogOpen(false)
      setCultureToDelete(null)
      onCulturesChange?.()
    } catch (error) {
      console.error('Error deleting culture:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!editingCulture || !editingCulture.name?.trim()) return

    setSaving(true)
    try {
      const cultureData = {
        project_id: projectId,
        category: 'cultures',
        name: editingCulture.name,
        description: editingCulture.description || '',
        attributes: editingCulture.attributes || {},
        tags: editingCulture.tags || []
      }

      let result: Culture

      if (editingCulture.id) {
        // Update existing
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...cultureData, updated_at: new Date().toISOString() })
          .eq('id', editingCulture.id)
          .select()
          .single()

        if (error) throw error
        result = {
          ...data,
          category: 'cultures',
          description: data.description || '',
          tags: data.tags || [],
          attributes: data.attributes || {}
        } as Culture

        setCultures(prev => prev.map(c => c.id === editingCulture.id ? result : c))
      } else {
        // Create new
        const { data, error } = await supabase
          .from('world_elements')
          .insert(cultureData)
          .select()
          .single()

        if (error) throw error
        result = {
          ...data,
          category: 'cultures',
          description: data.description || '',
          tags: data.tags || [],
          attributes: data.attributes || {}
        } as Culture

        setCultures(prev => [result, ...prev])
      }

      // Dispatch custom event for sidebar refresh
      window.dispatchEvent(new CustomEvent('cultureCreated', {
        detail: { culture: result, projectId }
      }))

      setEditingCulture(null)
      setIsCreating(false)
      onClearSelection?.()
      onCulturesChange?.()
    } catch (error) {
      console.error('Error saving culture:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingCulture(null)
    setIsCreating(false)
    onClearSelection?.()
  }

  const handleEditorChange = (patch: Partial<Culture>) => {
    setEditingCulture(prev => ({ ...prev, ...patch }))
  }

  const filteredCultures = cultures.filter(c =>
    !searchTerm ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cultures...</p>
        </div>
      </div>
    )
  }

  // Edit/Create view - show editor in main content area
  if (editingCulture) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
        {/* Header with Back button */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl px-3 py-1.5 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                  <span className="font-medium">Back</span>
                </Button>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {editingCulture.id ? `Edit ${editingCulture.name}` : 'Create New Culture'}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {editingCulture.id ? 'Modify the details of this culture.' : 'Define a new culture for your world.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl px-3 py-1.5 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving || !editingCulture.name?.trim()}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-1.5 text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingCulture.id ? 'Update Culture' : 'Create Culture'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="px-6">
          <CultureEditor
            value={editingCulture}
            onChange={handleEditorChange}
            onSubmit={handleSave}
            onCancel={handleCancel}
            saving={saving}
            projectId={projectId}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        {cultureToDelete && (
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            cultureName={cultureToDelete.name}
            onConfirm={confirmDelete}
            isDeleting={deleting}
          />
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-6">
      <div className="max-w-full mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 z-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Cultures
                  </h2>
                  <p className="text-sm text-gray-500">
                    {cultures.length} {cultures.length === 1 ? 'culture' : 'cultures'} defined
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-16">
                Define the cultures, traditions, and societies of your world
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Culture
            </Button>
          </div>

          {/* Search and View Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search cultures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 ${
                  viewMode === 'grid'
                    ? 'bg-pink-100 text-pink-600 hover:bg-pink-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 ${
                  viewMode === 'list'
                    ? 'bg-pink-100 text-pink-600 hover:bg-pink-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredCultures.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-pink-50 rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center shadow-xl">
                <Crown className="w-16 h-16 text-pink-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No cultures found' : 'Begin Your World\'s Cultures'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
              {searchTerm
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'Create the diverse cultures, traditions, and societies that bring your world to life. Each culture tells a unique story.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Culture
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'flex flex-col gap-4'
          }>
            {filteredCultures.map(culture => (
              <CultureCard
                key={culture.id}
                culture={culture}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={(culture) => {
                  setPreviewCulture(culture)
                  setPreviewOpen(true)
                }}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal - Enhanced */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-white">
          {previewCulture && (
            <div className="flex flex-col h-full">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-lg">
                      {previewCulture.attributes.iconImage ? (
                        <img
                          src={previewCulture.attributes.iconImage}
                          alt={previewCulture.name}
                          className="w-full h-full object-cover"
                        />
                      ) : previewCulture.attributes.icon ? (
                        <span className="text-3xl">{previewCulture.attributes.icon}</span>
                      ) : (
                        <Crown className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-bold mb-1 text-white">{previewCulture.name}</DialogTitle>
                      {previewCulture.attributes.government && (
                        <p className="text-pink-100 text-sm">
                          <span className="font-medium">Government:</span> {previewCulture.attributes.government}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Tags in header */}
                {previewCulture.tags && previewCulture.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {previewCulture.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Summary - Hero Section */}
                  {previewCulture.attributes.summary && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-pink-600" />
                        About This Culture
                      </h3>
                      <p className="text-gray-700 text-lg leading-relaxed">{previewCulture.attributes.summary}</p>
                    </div>
                  )}

                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previewCulture.attributes.government && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Government</h4>
                        <p className="text-gray-900 font-medium">{previewCulture.attributes.government}</p>
                      </div>
                    )}
                    {previewCulture.attributes.primary_language && (
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Primary Language</h4>
                        <p className="text-gray-900 font-medium">{previewCulture.attributes.primary_language}</p>
                      </div>
                    )}
                  </div>

                  {/* Political Parties */}
                  {previewCulture.attributes.political_parties && (previewCulture.attributes.political_parties as any[]).length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-pink-600" />
                        Political Parties ({(previewCulture.attributes.political_parties as any[]).length})
                      </h3>
                      <div className="grid gap-4">
                        {(previewCulture.attributes.political_parties as any[]).map((party: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900 text-lg mb-2">{party.name}</p>
                            {party.link && (
                              <a href={party.link} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:text-pink-700 mb-2 inline-block">
                                🔗 View reference
                              </a>
                            )}
                            {party.imageUrls && party.imageUrls.length > 0 && (
                              <div className="flex gap-3 mt-3">
                                {party.imageUrls.map((url: string, i: number) => (
                                  <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historical Events */}
                  {previewCulture.attributes.historical_events && (previewCulture.attributes.historical_events as any[]).length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        📅 Historical Events ({(previewCulture.attributes.historical_events as any[]).length})
                      </h3>
                      <div className="grid gap-4">
                        {(previewCulture.attributes.historical_events as any[]).map((event: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900 text-lg mb-2">{event.name}</p>
                            {event.link && (
                              <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:text-pink-700 mb-2 inline-block">
                                🔗 View reference
                              </a>
                            )}
                            {event.imageUrls && event.imageUrls.length > 0 && (
                              <div className="flex gap-3 mt-3">
                                {event.imageUrls.map((url: string, i: number) => (
                                  <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Figures */}
                  {previewCulture.attributes.important_figures && (previewCulture.attributes.important_figures as any[]).length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        👤 Important Figures ({(previewCulture.attributes.important_figures as any[]).length})
                      </h3>
                      <div className="grid gap-4">
                        {(previewCulture.attributes.important_figures as any[]).map((figure: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900 text-lg mb-2">{figure.name}</p>
                            {figure.link && (
                              <a href={figure.link} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:text-pink-700 mb-2 inline-block">
                                🔗 View reference
                              </a>
                            )}
                            {figure.imageUrls && figure.imageUrls.length > 0 && (
                              <div className="flex gap-3 mt-3">
                                {figure.imageUrls.map((url: string, i: number) => (
                                  <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer - Sticky */}
              <div className="flex justify-between items-center gap-3 p-4 border-t bg-white">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(previewCulture.updated_at).toLocaleDateString()}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setPreviewOpen(false)
                      handleEdit(previewCulture)
                    }}
                    className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Culture
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {cultureToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          cultureName={cultureToDelete.name}
          onConfirm={confirmDelete}
          isDeleting={deleting}
        />
      )}
    </div>
  )
}