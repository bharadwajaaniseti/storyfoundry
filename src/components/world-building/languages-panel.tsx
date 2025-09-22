'use client'

import React, { useState, useEffect } from 'react'
import { Plus, MessageSquare, Search, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function LanguagesPanel({ projectId, selectedElement, onLanguagesChange, onClearSelection }: any) {
  const [languages, setLanguages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' })

  const supabase = createSupabaseClient()

  const languageStatuses = ['living', 'dead', 'constructed', 'ancient', 'ceremonial']
  const writingSystems = ['alphabetic', 'logographic', 'syllabic', 'abjad', 'abugida', 'pictographic', 'none']

  useEffect(() => { loadLanguages() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'languages') {
      setEditingLanguage(selectedElement)
      setFormData({ 
        name: selectedElement.name, 
        description: selectedElement.description, 
        family: selectedElement.attributes?.family || '', 
        status: selectedElement.attributes?.status || 'living', 
        speakers: selectedElement.attributes?.speakers || '', 
        writing_system: selectedElement.attributes?.writing_system || '', 
        sample_text: selectedElement.attributes?.sample_text || '' 
      })
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'languages').order('created_at', { ascending: false })
      if (error) throw error
      setLanguages(data || [])
    } finally { setLoading(false) }
  }

  const handleCreateLanguage = async () => {
    try {
      const languageData = { project_id: projectId, category: 'languages', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: any
      if (editingLanguage) {
        const { data, error } = await supabase.from('world_elements').update({ ...languageData, updated_at: new Date().toISOString() }).eq('id', editingLanguage.id).select().single()
        if (error) throw error
        result = data
        setLanguages(prev => prev.map(l => l.id === editingLanguage.id ? result : l))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(languageData).select().single()
        if (error) throw error
        result = data
        setLanguages(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('languageCreated', { detail: { language: result, projectId } }))
      setShowCreateDialog(false)
      setEditingLanguage(null)
      setFormData({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' })
      onLanguagesChange?.()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteLanguage = async (languageId: string) => {
    try {
      const { error } = await supabase.from('world_elements').delete().eq('id', languageId)
      if (error) throw error
      setLanguages(prev => prev.filter(l => l.id !== languageId))
      onLanguagesChange?.()
    } catch (error) {
      console.error('Error deleting language:', error)
    }
  }

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div></div></div>

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-amber-500" />
              Languages
            </h2>
            <p className="text-sm text-gray-500">Create languages, dialects, and communication systems</p>
          </div>
          <Button onClick={() => { setEditingLanguage(null); setFormData({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' }); setShowCreateDialog(true) }} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="w-4 h-4 mr-2" />New Language
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search languages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {languages.filter(l => !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No languages yet</p>
            <Button onClick={() => { setEditingLanguage(null); setFormData({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' }); setShowCreateDialog(true) }} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Create First Language
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.filter(l => !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(language => (
              <Card key={language.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{language.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteLanguage(language.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  {language.attributes?.family && (
                    <div className="text-sm text-gray-500">Family: {language.attributes.family}</div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {language.description && <p className="text-sm text-gray-600 line-clamp-3">{language.description}</p>}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {language.attributes?.status && (
                        <div>
                          <span className="font-medium">Status:</span>
                          <div className={`inline-block ml-1 px-2 py-1 rounded text-xs font-medium ${
                            language.attributes.status === 'living' ? 'bg-green-100 text-green-800' :
                            language.attributes.status === 'dead' ? 'bg-gray-100 text-gray-800' :
                            language.attributes.status === 'constructed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {language.attributes.status}
                          </div>
                        </div>
                      )}
                      {language.attributes?.speakers && (
                        <div><span className="font-medium">Speakers:</span> {language.attributes.speakers}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { 
                        setEditingLanguage(language); 
                        setFormData({ 
                          name: language.name, 
                          description: language.description, 
                          family: language.attributes?.family || '', 
                          status: language.attributes?.status || 'living', 
                          speakers: language.attributes?.speakers || '', 
                          writing_system: language.attributes?.writing_system || '', 
                          sample_text: language.attributes?.sample_text || '' 
                        }); 
                        setShowCreateDialog(true) 
                      }}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(language.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingLanguage(null); setFormData({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' }); onClearSelection?.() } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLanguage ? 'Edit Language' : 'Create New Language'}</DialogTitle>
              <DialogDescription>Define a language or communication system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Language Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Language name..." />
                </div>
                <div>
                  <Label htmlFor="family">Language Family</Label>
                  <Input id="family" value={formData.family} onChange={(e) => setFormData(prev => ({ ...prev, family: e.target.value }))} placeholder="e.g., Indo-European, Sino-Tibetan..." />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this language..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="speakers">Number of Speakers</Label>
                  <Input id="speakers" value={formData.speakers} onChange={(e) => setFormData(prev => ({ ...prev, speakers: e.target.value }))} placeholder="e.g., 1 million, Few hundred..." />
                </div>
              </div>
              <div>
                <Label htmlFor="writing_system">Writing System</Label>
                <Select value={formData.writing_system} onValueChange={(value) => setFormData(prev => ({ ...prev, writing_system: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select writing system" />
                  </SelectTrigger>
                  <SelectContent>
                    {writingSystems.map(system => (
                      <SelectItem key={system} value={system}>
                        {system.charAt(0).toUpperCase() + system.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sample_text">Sample Text/Phrases</Label>
                <Textarea id="sample_text" value={formData.sample_text} onChange={(e) => setFormData(prev => ({ ...prev, sample_text: e.target.value }))} placeholder="Common phrases, greetings, or sample text in this language..." rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingLanguage(null); setFormData({ name: '', description: '', family: '', status: 'living', speakers: '', writing_system: '', sample_text: '' }); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateLanguage} className="bg-amber-500 hover:bg-amber-600 text-white" disabled={!formData.name.trim()}>
                {editingLanguage ? 'Update' : 'Create'} Language
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}