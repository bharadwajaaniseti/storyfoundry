'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Crown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gray-50 z-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-pink-600" />
                </div>
                Cultures
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Define the cultures, traditions, and societies of your world
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="bg-pink-500 hover:bg-pink-600 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Culture
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search cultures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Content */}
        {filteredCultures.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No cultures found' : 'No cultures yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Create the diverse cultures and societies that shape your world.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={handleCreateNew}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Culture
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCultures.map(culture => (
              <CultureCard
                key={culture.id}
                culture={culture}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
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