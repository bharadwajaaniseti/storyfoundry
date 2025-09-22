'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Palette, Search, Trash2, Edit3, Star, Gem, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Item {
  id: string
  name: string
  description: string
  attributes: {
    type?: string
    rarity?: string
    value?: string
    weight?: string
    properties?: string[]
    history?: string
    location?: string
    owner?: string
    [key: string]: any
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

export default function ItemsPanel({ projectId, selectedElement, onItemsChange, onClearSelection }: any) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [] as string[], history: '', location: '', owner: ''
  })

  const supabase = createSupabaseClient()

  useEffect(() => { loadItems() }, [projectId])
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'items') {
      setEditingItem(selectedElement)
      setFormData({
        name: selectedElement.name, description: selectedElement.description,
        type: selectedElement.attributes?.type || '', rarity: selectedElement.attributes?.rarity || 'common',
        value: selectedElement.attributes?.value || '', weight: selectedElement.attributes?.weight || '',
        properties: selectedElement.attributes?.properties || [], history: selectedElement.attributes?.history || '',
        location: selectedElement.attributes?.location || '', owner: selectedElement.attributes?.owner || ''
      })
      setShowCreateDialog(true)
    }
  }, [selectedElement])

  const loadItems = async () => {
    try {
      const { data, error } = await supabase.from('world_elements').select('*').eq('project_id', projectId).eq('category', 'items').order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    try {
      const itemData = { project_id: projectId, category: 'items', name: formData.name, description: formData.description, attributes: { ...formData }, tags: [] }
      let result: Item
      if (editingItem) {
        const { data, error } = await supabase.from('world_elements').update({ ...itemData, updated_at: new Date().toISOString() }).eq('id', editingItem.id).select().single()
        if (error) throw error
        result = data as Item
        setItems(prev => prev.map(i => i.id === editingItem.id ? result : i))
      } else {
        const { data, error } = await supabase.from('world_elements').insert(itemData).select().single()
        if (error) throw error
        result = data as Item
        setItems(prev => [result, ...prev])
      }
      window.dispatchEvent(new CustomEvent('itemCreated', { detail: { item: result, projectId } }))
      setShowCreateDialog(false)
      setEditingItem(null)
      setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' })
      onItemsChange?.()
    } catch (error) {
      console.error('Error creating/updating item:', error)
    }
  }

  const filteredItems = items.filter(i => !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.description.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="h-full bg-white p-6 overflow-y-auto"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div><div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}</div></div></div>

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-7 h-7 text-indigo-500" />
              Items & Artifacts
            </h2>
            <p className="text-sm text-gray-500">Catalog important objects, artifacts, and possessions</p>
          </div>
          <Button onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); setShowCreateDialog(true) }} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Plus className="w-4 h-4 mr-2" />New Item
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No items yet</p>
            <p className="text-gray-500 mb-6">Create important objects and artifacts for your world.</p>
            <Button onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); setShowCreateDialog(true) }} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Create First Item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Gem className="w-5 h-5 text-indigo-500" />
                      <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.description && <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>}
                    <div className="text-sm space-y-1">
                      {item.attributes?.rarity && <div className="flex justify-between"><span className="text-gray-500">Rarity:</span><span>{item.attributes.rarity}</span></div>}
                      {item.attributes?.value && <div className="flex justify-between"><span className="text-gray-500">Value:</span><span>{item.attributes.value}</span></div>}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setFormData({ name: item.name, description: item.description, type: item.attributes?.type || '', rarity: item.attributes?.rarity || 'common', value: item.attributes?.value || '', weight: item.attributes?.weight || '', properties: item.attributes?.properties || [], history: item.attributes?.history || '', location: item.attributes?.location || '', owner: item.attributes?.owner || '' }); setShowCreateDialog(true) }}>
                        <Edit3 className="w-4 h-4 mr-1" />Edit
                      </Button>
                      <span className="text-xs text-gray-500">{new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); onClearSelection?.() } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
              <DialogDescription>Define an important object or artifact.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Item name..." />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this item..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} placeholder="e.g., weapon, armor, tool" />
                </div>
                <div>
                  <Label htmlFor="rarity">Rarity</Label>
                  <Input id="rarity" value={formData.rarity} onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))} placeholder="common, rare, legendary" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingItem(null); setFormData({ name: '', description: '', type: '', rarity: 'common', value: '', weight: '', properties: [], history: '', location: '', owner: '' }); onClearSelection?.() }}>Cancel</Button>
              <Button onClick={handleCreateItem} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={!formData.name.trim()}>
                {editingItem ? 'Update' : 'Create'} Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}