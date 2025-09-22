'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Crown, Search, Trash2, Edit3, Users, Heart, Globe, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Culture {
  id: string
  name: string
  description: string
  attributes: {
    government?: string
    religion?: string
    values?: string[]
    traditions?: string[]
    technology_level?: string
    primary_language?: string
    territory?: string
    population?: string
    notable_figures?: string[]
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCulture, setEditingCulture] = useState<Culture | null>(null)

  const [formData, setFormData] = useState({
    name: '', description: '', government: '', religion: '', values: [] as string[],
    traditions: [] as string[], technology_level: '', primary_language: '',
    territory: '', population: '', notable_figures: [] as string[]
  })

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadCultures()
  }, [projectId])

  useEffect(() => {
    if (selectedElement && selectedElement.category === 'cultures') {
      setEditingCulture(selectedElement)
      populateFormData(selectedElement)
      setShowCreateDialog(true)
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
      setCultures(data || [])
    } catch (error) {
      console.error('Error loading cultures:', error)
    } finally {
      setLoading(false)
    }
  }

  const populateFormData = (culture: Culture) => {
    setFormData({
      name: culture.name,
      description: culture.description,
      government: culture.attributes?.government || '',
      religion: culture.attributes?.religion || '',
      values: culture.attributes?.values || [],
      traditions: culture.attributes?.traditions || [],
      technology_level: culture.attributes?.technology_level || '',
      primary_language: culture.attributes?.primary_language || '',
      territory: culture.attributes?.territory || '',
      population: culture.attributes?.population || '',
      notable_figures: culture.attributes?.notable_figures || []
    })
  }

  const handleCreateCulture = async () => {
    try {
      const cultureData = {
        project_id: projectId,
        category: 'cultures',
        name: formData.name,
        description: formData.description,
        attributes: { ...formData },
        tags: []
      }

      let result: Culture
      if (editingCulture) {
        const { data, error } = await supabase
          .from('world_elements')
          .update({ ...cultureData, updated_at: new Date().toISOString() })
          .eq('id', editingCulture.id)
          .select()
          .single()

        if (error) throw error
        result = data as Culture
        setCultures(prev => prev.map(c => c.id === editingCulture.id ? result : c))
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(cultureData)
          .select()
          .single()

        if (error) throw error
        result = data as Culture
        setCultures(prev => [result, ...prev])
      }

      window.dispatchEvent(new CustomEvent('cultureCreated', { detail: { culture: result, projectId } }))
      setShowCreateDialog(false)
      setEditingCulture(null)
      resetForm()
      onCulturesChange?.()
    } catch (error) {
      console.error('Error creating/updating culture:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', description: '', government: '', religion: '', values: [],
      traditions: [], technology_level: '', primary_language: '',
      territory: '', population: '', notable_figures: []
    })
  }

  const filteredCultures = cultures.filter(c => 
    !searchTerm || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
        </div>
      </div>
    </div>
  }

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-7 h-7 text-pink-500" />
              Cultures
            </h2>
            <p className="text-sm text-gray-500">Define the cultures, traditions, and societies of your world</p>
          </div>
          <Button onClick={() => { setEditingCulture(null); resetForm(); setShowCreateDialog(true) }} className="bg-pink-500 hover:bg-pink-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Culture
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search cultures..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {filteredCultures.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No cultures yet</p>
            <p className="text-gray-500 mb-6">Create the diverse cultures and societies that shape your world.</p>
            <Button onClick={() => { setEditingCulture(null); resetForm(); setShowCreateDialog(true) }} className="bg-pink-500 hover:bg-pink-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create First Culture
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCultures.map(culture => (
              <Card key={culture.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-pink-500" />
                      <CardTitle className="text-lg font-semibold">{culture.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCultures(prev => prev.filter(c => c.id !== culture.id))}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {culture.description && <p className="text-sm text-gray-600 line-clamp-3">{culture.description}</p>}
                    
                    <div className="text-sm space-y-1">
                      {culture.attributes?.government && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Government:</span>
                          <span>{culture.attributes.government}</span>
                        </div>
                      )}
                      {culture.attributes?.primary_language && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Language:</span>
                          <span>{culture.attributes.primary_language}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCulture(culture); populateFormData(culture); setShowCreateDialog(true) }}>
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(culture.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) { setEditingCulture(null); resetForm(); onClearSelection?.() }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCulture ? 'Edit Culture' : 'Create New Culture'}</DialogTitle>
              <DialogDescription>Define a culture or society in your world.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="name">Culture Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Culture name..." />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this culture..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="government">Government Type</Label>
                  <Input id="government" value={formData.government} onChange={(e) => setFormData(prev => ({ ...prev, government: e.target.value }))} placeholder="e.g., monarchy, democracy" />
                </div>
                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Input id="religion" value={formData.religion} onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))} placeholder="e.g., polytheistic, monotheistic" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_language">Primary Language</Label>
                  <Input id="primary_language" value={formData.primary_language} onChange={(e) => setFormData(prev => ({ ...prev, primary_language: e.target.value }))} placeholder="Main language spoken" />
                </div>
                <div>
                  <Label htmlFor="technology_level">Technology Level</Label>
                  <Input id="technology_level" value={formData.technology_level} onChange={(e) => setFormData(prev => ({ ...prev, technology_level: e.target.value }))} placeholder="e.g., medieval, modern, futuristic" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingCulture(null); resetForm(); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateCulture} className="bg-pink-500 hover:bg-pink-600 text-white" disabled={!formData.name.trim()}>
                {editingCulture ? 'Update' : 'Create'} Culture
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}