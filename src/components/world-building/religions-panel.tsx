'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Church, Search, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ReligionsPanel({ projectId, selectedElement, onReligionsChange, onClearSelection }: any) {
  const [religions, setReligions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReligion, setEditingReligion] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' })

  const supabase = createSupabaseClient()

  const religionTypes = ['monotheistic', 'polytheistic', 'pantheistic', 'animistic', 'atheistic', 'philosophical', 'nature-based', 'ancestral']

  useEffect(() => { loadReligions() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'religions') {
      setEditingReligion(selectedElement)
      setFormData({ 
        name: selectedElement.name, 
        description: selectedElement.description, 
        type: selectedElement.attributes?.type || '', 
        deities: selectedElement.attributes?.deities || '', 
        practices: selectedElement.attributes?.practices || '', 
        beliefs: selectedElement.attributes?.beliefs || '', 
        holy_sites: selectedElement.attributes?.holy_sites || '', 
        followers: selectedElement.attributes?.followers || '' 
      })
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadReligions = async () => {
    try {
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'religions').order('created_at', { ascending: false })
      if (error) throw error
      setReligions(data || [])
    } finally { setLoading(false) }
  }

  const handleCreateReligion = async () => {
    try {
      const religionData = { project_id: projectId, category: 'religions', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: any
      if (editingReligion) {
        const { data, error } = await supabase.from('world_elements').update({ ...religionData, updated_at: new Date().toISOString() }).eq('id', editingReligion.id).select().single()
        if (error) throw error
        result = data
        setReligions(prev => prev.map(r => r.id === editingReligion.id ? result : r))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(religionData).select().single()
        if (error) throw error
        result = data
        setReligions(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('religionCreated', { detail: { religion: result, projectId } }))
      setShowCreateDialog(false)
      setEditingReligion(null)
      setFormData({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' })
      onReligionsChange?.()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteReligion = async (religionId: string) => {
    try {
      const { error } = await supabase.from('world_elements').delete().eq('id', religionId)
      if (error) throw error
      setReligions(prev => prev.filter(r => r.id !== religionId))
      onReligionsChange?.()
    } catch (error) {
      console.error('Error deleting religion:', error)
    }
  }

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div></div></div>

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Church className="w-7 h-7 text-purple-500" />
              Religions
            </h2>
            <p className="text-sm text-gray-500">Define belief systems, deities, and spiritual practices</p>
          </div>
          <Button onClick={() => { setEditingReligion(null); setFormData({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' }); setShowCreateDialog(true) }} className="bg-purple-500 hover:bg-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />New Religion
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search religions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {religions.filter(r => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="text-center py-12">
            <Church className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No religions yet</p>
            <Button onClick={() => { setEditingReligion(null); setFormData({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' }); setShowCreateDialog(true) }} className="bg-purple-500 hover:bg-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Create First Religion
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {religions.filter(r => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(religion => (
              <Card key={religion.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{religion.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteReligion(religion.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  {religion.attributes?.type && (
                    <div className="text-sm text-gray-500">Type: {religion.attributes.type}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {religion.description && <p className="text-sm text-gray-600 line-clamp-3">{religion.description}</p>}
                    <div className="space-y-1 text-xs">
                      {religion.attributes?.deities && (
                        <div><span className="font-medium">Deities:</span> {religion.attributes.deities}</div>
                      )}
                      {religion.attributes?.followers && (
                        <div><span className="font-medium">Followers:</span> {religion.attributes.followers}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { 
                        setEditingReligion(religion); 
                        setFormData({ 
                          name: religion.name, 
                          description: religion.description, 
                          type: religion.attributes?.type || '', 
                          deities: religion.attributes?.deities || '', 
                          practices: religion.attributes?.practices || '', 
                          beliefs: religion.attributes?.beliefs || '', 
                          holy_sites: religion.attributes?.holy_sites || '', 
                          followers: religion.attributes?.followers || '' 
                        }); 
                        setShowCreateDialog(true) 
                      }}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(religion.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingReligion(null); setFormData({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' }); onClearSelection?.() } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReligion ? 'Edit Religion' : 'Create New Religion'}</DialogTitle>
              <DialogDescription>Define a belief system or spiritual practice.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Religion Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Religion name..." />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {religionTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this religion..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deities">Deities/Divine Figures</Label>
                  <Textarea id="deities" value={formData.deities} onChange={(e) => setFormData(prev => ({ ...prev, deities: e.target.value }))} placeholder="List gods, goddesses, spirits..." rows={2} />
                </div>
                <div>
                  <Label htmlFor="followers">Followers</Label>
                  <Input id="followers" value={formData.followers} onChange={(e) => setFormData(prev => ({ ...prev, followers: e.target.value }))} placeholder="Who follows this religion..." />
                </div>
              </div>
              <div>
                <Label htmlFor="beliefs">Core Beliefs</Label>
                <Textarea id="beliefs" value={formData.beliefs} onChange={(e) => setFormData(prev => ({ ...prev, beliefs: e.target.value }))} placeholder="Central tenets, doctrines, worldview..." rows={3} />
              </div>
              <div>
                <Label htmlFor="practices">Practices & Rituals</Label>
                <Textarea id="practices" value={formData.practices} onChange={(e) => setFormData(prev => ({ ...prev, practices: e.target.value }))} placeholder="Ceremonies, holidays, daily practices..." rows={2} />
              </div>
              <div>
                <Label htmlFor="holy_sites">Holy Sites</Label>
                <Textarea id="holy_sites" value={formData.holy_sites} onChange={(e) => setFormData(prev => ({ ...prev, holy_sites: e.target.value }))} placeholder="Temples, shrines, sacred locations..." rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingReligion(null); setFormData({ name: '', description: '', type: '', deities: '', practices: '', beliefs: '', holy_sites: '', followers: '' }); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateReligion} className="bg-purple-500 hover:bg-purple-600 text-white" disabled={!formData.name.trim()}>
                {editingReligion ? 'Update' : 'Create'} Religion
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}