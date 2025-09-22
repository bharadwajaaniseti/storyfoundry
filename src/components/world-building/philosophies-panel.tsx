'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Brain, Search, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PhilosophiesPanel({ projectId, selectedElement, onPhilosophiesChange, onClearSelection }: any) {
  const [philosophies, setPhilosophies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPhilosophy, setEditingPhilosophy] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' })

  const supabase = createSupabaseClient()

  const philosophySchools = ['ethics', 'metaphysics', 'epistemology', 'logic', 'aesthetics', 'political', 'natural', 'moral', 'existential', 'mystical']

  useEffect(() => { loadPhilosophies() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'philosophies') {
      setEditingPhilosophy(selectedElement)
      setFormData({ 
        name: selectedElement.name, 
        description: selectedElement.description, 
        school: selectedElement.attributes?.school || '', 
        founder: selectedElement.attributes?.founder || '', 
        principles: selectedElement.attributes?.principles || '', 
        influence: selectedElement.attributes?.influence || '', 
        practitioners: selectedElement.attributes?.practitioners || '', 
        texts: selectedElement.attributes?.texts || '' 
      })
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadPhilosophies = async () => {
    try {
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'philosophies').order('created_at', { ascending: false })
      if (error) throw error
      setPhilosophies(data || [])
    } finally { setLoading(false) }
  }

  const handleCreatePhilosophy = async () => {
    try {
      const philosophyData = { project_id: projectId, category: 'philosophies', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: any
      if (editingPhilosophy) {
        const { data, error } = await supabase.from('world_elements').update({ ...philosophyData, updated_at: new Date().toISOString() }).eq('id', editingPhilosophy.id).select().single()
        if (error) throw error
        result = data
        setPhilosophies(prev => prev.map(p => p.id === editingPhilosophy.id ? result : p))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(philosophyData).select().single()
        if (error) throw error
        result = data
        setPhilosophies(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('philosophyCreated', { detail: { philosophy: result, projectId } }))
      setShowCreateDialog(false)
      setEditingPhilosophy(null)
      setFormData({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' })
      onPhilosophiesChange?.()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deletePhilosophy = async (philosophyId: string) => {
    try {
      const { error } = await supabase.from('world_elements').delete().eq('id', philosophyId)
      if (error) throw error
      setPhilosophies(prev => prev.filter(p => p.id !== philosophyId))
      onPhilosophiesChange?.()
    } catch (error) {
      console.error('Error deleting philosophy:', error)
    }
  }

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div></div></div>

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-indigo-500" />
              Philosophies
            </h2>
            <p className="text-sm text-gray-500">Define schools of thought, wisdom traditions, and intellectual movements</p>
          </div>
          <Button onClick={() => { setEditingPhilosophy(null); setFormData({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' }); setShowCreateDialog(true) }} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Plus className="w-4 h-4 mr-2" />New Philosophy
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search philosophies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {philosophies.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No philosophies yet</p>
            <Button onClick={() => { setEditingPhilosophy(null); setFormData({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' }); setShowCreateDialog(true) }} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Create First Philosophy
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {philosophies.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(philosophy => (
              <Card key={philosophy.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{philosophy.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deletePhilosophy(philosophy.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  {philosophy.attributes?.school && (
                    <div className="text-sm text-gray-500">School: {philosophy.attributes.school}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {philosophy.description && <p className="text-sm text-gray-600 line-clamp-3">{philosophy.description}</p>}
                    <div className="space-y-1 text-xs">
                      {philosophy.attributes?.founder && (
                        <div><span className="font-medium">Founder:</span> {philosophy.attributes.founder}</div>
                      )}
                      {philosophy.attributes?.practitioners && (
                        <div><span className="font-medium">Practitioners:</span> {philosophy.attributes.practitioners}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { 
                        setEditingPhilosophy(philosophy); 
                        setFormData({ 
                          name: philosophy.name, 
                          description: philosophy.description, 
                          school: philosophy.attributes?.school || '', 
                          founder: philosophy.attributes?.founder || '', 
                          principles: philosophy.attributes?.principles || '', 
                          influence: philosophy.attributes?.influence || '', 
                          practitioners: philosophy.attributes?.practitioners || '', 
                          texts: philosophy.attributes?.texts || '' 
                        }); 
                        setShowCreateDialog(true) 
                      }}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(philosophy.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingPhilosophy(null); setFormData({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' }); onClearSelection?.() } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPhilosophy ? 'Edit Philosophy' : 'Create New Philosophy'}</DialogTitle>
              <DialogDescription>Define a school of thought or intellectual tradition.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Philosophy Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Philosophy name..." />
                </div>
                <div>
                  <Label htmlFor="school">School of Thought</Label>
                  <Select value={formData.school} onValueChange={(value) => setFormData(prev => ({ ...prev, school: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {philosophySchools.map(school => (
                        <SelectItem key={school} value={school}>
                          {school.charAt(0).toUpperCase() + school.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this philosophy..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="founder">Founder/Originator</Label>
                  <Input id="founder" value={formData.founder} onChange={(e) => setFormData(prev => ({ ...prev, founder: e.target.value }))} placeholder="Who founded or originated this..." />
                </div>
                <div>
                  <Label htmlFor="practitioners">Practitioners</Label>
                  <Input id="practitioners" value={formData.practitioners} onChange={(e) => setFormData(prev => ({ ...prev, practitioners: e.target.value }))} placeholder="Who follows this philosophy..." />
                </div>
              </div>
              <div>
                <Label htmlFor="principles">Core Principles</Label>
                <Textarea id="principles" value={formData.principles} onChange={(e) => setFormData(prev => ({ ...prev, principles: e.target.value }))} placeholder="Main ideas, tenets, and beliefs..." rows={3} />
              </div>
              <div>
                <Label htmlFor="influence">Influence & Impact</Label>
                <Textarea id="influence" value={formData.influence} onChange={(e) => setFormData(prev => ({ ...prev, influence: e.target.value }))} placeholder="How this philosophy affects society, politics, etc..." rows={2} />
              </div>
              <div>
                <Label htmlFor="texts">Important Texts</Label>
                <Textarea id="texts" value={formData.texts} onChange={(e) => setFormData(prev => ({ ...prev, texts: e.target.value }))} placeholder="Key writings, books, or documents..." rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingPhilosophy(null); setFormData({ name: '', description: '', school: '', founder: '', principles: '', influence: '', practitioners: '', texts: '' }); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreatePhilosophy} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={!formData.name.trim()}>
                {editingPhilosophy ? 'Update' : 'Create'} Philosophy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}