'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Globe, Search, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function SystemsPanel({ projectId, selectedElement, onSystemsChange, onClearSelection }: any) {
  const [systems, setSystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSystem, setEditingSystem] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: '', scope: '', rules: '', participants: '' })

  const supabase = createSupabaseClient()

  useEffect(() => { loadSystems() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'systems') {
      setEditingSystem(selectedElement)
      setFormData({ name: selectedElement.name, description: selectedElement.description, type: selectedElement.attributes?.type || '', scope: selectedElement.attributes?.scope || '', rules: selectedElement.attributes?.rules || '', participants: selectedElement.attributes?.participants || '' })
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadSystems = async () => {
    try {
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'systems').order('created_at', { ascending: false })
      if (error) throw error
      setSystems(data || [])
    } finally { setLoading(false) }
  }

  const handleCreateSystem = async () => {
    try {
      const systemData = { project_id: projectId, category: 'systems', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: any
      if (editingSystem) {
        const { data, error } = await supabase.from('world_elements').update({ ...systemData, updated_at: new Date().toISOString() }).eq('id', editingSystem.id).select().single()
        if (error) throw error
        result = data
        setSystems(prev => prev.map(s => s.id === editingSystem.id ? result : s))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(systemData).select().single()
        if (error) throw error
        result = data
        setSystems(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('systemCreated', { detail: { system: result, projectId } }))
      setShowCreateDialog(false)
      setEditingSystem(null)
      setFormData({ name: '', description: '', type: '', scope: '', rules: '', participants: '' })
      onSystemsChange?.()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div></div></div>

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-7 h-7 text-teal-500" />
              Systems
            </h2>
            <p className="text-sm text-gray-500">Define political, economic, and social structures</p>
          </div>
          <Button onClick={() => { setEditingSystem(null); setFormData({ name: '', description: '', type: '', scope: '', rules: '', participants: '' }); setShowCreateDialog(true) }} className="bg-teal-500 hover:bg-teal-600 text-white">
            <Plus className="w-4 h-4 mr-2" />New System
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search systems..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {systems.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No systems yet</p>
            <Button onClick={() => { setEditingSystem(null); setFormData({ name: '', description: '', type: '', scope: '', rules: '', participants: '' }); setShowCreateDialog(true) }} className="bg-teal-500 hover:bg-teal-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Create First System
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(system => (
              <Card key={system.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{system.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSystems(prev => prev.filter(s => s.id !== system.id))}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {system.description && <p className="text-sm text-gray-600 line-clamp-3">{system.description}</p>}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSystem(system); setFormData({ name: system.name, description: system.description, type: system.attributes?.type || '', scope: system.attributes?.scope || '', rules: system.attributes?.rules || '', participants: system.attributes?.participants || '' }); setShowCreateDialog(true) }}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(system.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingSystem(null); setFormData({ name: '', description: '', type: '', scope: '', rules: '', participants: '' }); onClearSelection?.() } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSystem ? 'Edit System' : 'Create New System'}</DialogTitle>
              <DialogDescription>Define a political, economic, or social system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="name">System Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="System name..." />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this system..." rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingSystem(null); setFormData({ name: '', description: '', type: '', scope: '', rules: '', participants: '' }); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateSystem} className="bg-teal-500 hover:bg-teal-600 text-white" disabled={!formData.name.trim()}>
                {editingSystem ? 'Update' : 'Create'} System
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}