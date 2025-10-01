'use client'

import React, { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// Preset field definitions
const PRESET_FIELDS = [
  // Cultural Structure
  { id: 'clan_structure', label: 'Clan Structure', type: 'Text', category: 'Structure' },
  { id: 'social_hierarchy', label: 'Social Hierarchy', type: 'Text', category: 'Structure' },
  { id: 'family_structure', label: 'Family Structure', type: 'Text', category: 'Structure' },
  
  // Customs
  { id: 'dress_code', label: 'Dress Code', type: 'Multi-Text', category: 'Customs' },
  { id: 'marriage_customs', label: 'Marriage Customs', type: 'Text', category: 'Customs' },
  { id: 'naming_conventions', label: 'Naming Conventions', type: 'Text', category: 'Customs' },
  { id: 'burial_practices', label: 'Burial Practices', type: 'Text', category: 'Customs' },
  { id: 'coming_of_age', label: 'Coming of Age Rituals', type: 'Text', category: 'Customs' },
  
  // Education & Skills
  { id: 'education_system', label: 'Education System', type: 'Text', category: 'Education' },
  { id: 'apprenticeship', label: 'Apprenticeship Model', type: 'Text', category: 'Education' },
  { id: 'valued_skills', label: 'Valued Skills', type: 'Multi-Text', category: 'Education' },
  
  // Economy
  { id: 'economic_model', label: 'Economic Model', type: 'Text', category: 'Economy' },
  { id: 'currency', label: 'Currency', type: 'Text', category: 'Economy' },
  { id: 'trade_goods', label: 'Trade Goods', type: 'Multi-Text', category: 'Economy' },
  { id: 'wealth_distribution', label: 'Wealth Distribution', type: 'Slider', category: 'Economy' },
  
  // Military
  { id: 'military_structure', label: 'Military Structure', type: 'Text', category: 'Military' },
  { id: 'combat_style', label: 'Combat Style', type: 'Text', category: 'Military' },
  { id: 'warrior_code', label: 'Warrior Code', type: 'Text', category: 'Military' },
  
  // Religion & Beliefs
  { id: 'religious_beliefs', label: 'Religious Beliefs', type: 'Text', category: 'Beliefs' },
  { id: 'deities', label: 'Deities', type: 'Multi-Text', category: 'Beliefs' },
  { id: 'superstitions', label: 'Superstitions', type: 'Multi-Text', category: 'Beliefs' },
  { id: 'taboos', label: 'Taboos', type: 'Multi-Text', category: 'Beliefs' },
  
  // Communication
  { id: 'greeting_customs', label: 'Greeting Customs', type: 'Text', category: 'Communication' },
  { id: 'body_language', label: 'Body Language', type: 'Text', category: 'Communication' },
  { id: 'written_system', label: 'Written System', type: 'Text', category: 'Communication' },
  
  // Misc
  { id: 'holidays', label: 'Holidays & Festivals', type: 'Multi-Text', category: 'Misc' },
  { id: 'symbols', label: 'Cultural Symbols', type: 'Multi-Text', category: 'Misc' },
  { id: 'colors_significance', label: 'Color Significance', type: 'Text', category: 'Misc' },
  { id: 'time_keeping', label: 'Time Keeping', type: 'Text', category: 'Misc' }
]

interface AttributeField {
  key: string
  label: string
  type: 'Text' | 'Multi-Text' | 'Number' | 'Select' | 'Slider' | 'Boolean' | 'RichText'
  options?: string[]
  min?: number
  max?: number
}

interface AttributePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (fields: AttributeField[]) => void
  existingKeys: string[]
}

export default function AttributePicker({ open, onOpenChange, onAdd, existingKeys }: AttributePickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customField, setCustomField] = useState({
    label: '',
    type: 'Text' as AttributeField['type']
  })

  const categories = ['All', ...Array.from(new Set(PRESET_FIELDS.map(f => f.category)))]

  const filteredPresets = PRESET_FIELDS.filter(field => {
    if (existingKeys.includes(field.id)) return false
    if (selectedCategory !== 'All' && field.category !== selectedCategory) return false
    if (searchTerm && !field.label.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleToggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    )
  }

  const handleAddCustomField = () => {
    if (!customField.label.trim()) return

    const key = customField.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const newField: AttributeField = {
      key,
      label: customField.label,
      type: customField.type
    }

    onAdd([newField])
    setCustomField({ label: '', type: 'Text' })
    setShowCustomForm(false)
  }

  const handleAddSelected = () => {
    const fields: AttributeField[] = selectedFields.map(id => {
      const preset = PRESET_FIELDS.find(f => f.id === id)!
      return {
        key: preset.id,
        label: preset.label,
        type: preset.type as AttributeField['type']
      }
    })

    onAdd(fields)
    setSelectedFields([])
    onOpenChange(false)
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedFields([])
    setShowCustomForm(false)
    setCustomField({ label: '', type: 'Text' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-6xl !h-[85vh] overflow-hidden !bg-white shadow-xl border border-gray-200 flex flex-col sm:!max-w-6xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add Custom Fields
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Choose from preset fields or create your own custom attributes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Left sidebar - Categories */}
          <div className="w-48 flex-shrink-0 border-r border-gray-200 pr-4 overflow-y-auto">
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search and custom field button */}
            <div className="flex-shrink-0 space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {!showCustomForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full border-2 border-dashed border-pink-300 hover:border-pink-400 hover:bg-pink-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Field
                </Button>
              )}

              {showCustomForm && (
                <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-pink-900">Create Custom Field</h4>
                    <button
                      onClick={() => {
                        setShowCustomForm(false)
                        setCustomField({ label: '', type: 'Text' })
                      }}
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <Label htmlFor="custom-label" className="text-xs font-medium text-gray-700">
                      Field Name
                    </Label>
                    <Input
                      id="custom-label"
                      placeholder="Enter field name..."
                      value={customField.label}
                      onChange={(e) => setCustomField(prev => ({ ...prev, label: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-type" className="text-xs font-medium text-gray-700">
                      Field Type
                    </Label>
                    <select
                      id="custom-type"
                      value={customField.type}
                      onChange={(e) =>
                        setCustomField(prev => ({ ...prev, type: e.target.value as AttributeField['type'] }))
                      }
                      className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                    >
                      <option value="Text">Text</option>
                      <option value="Multi-Text">Multi-Text (Array)</option>
                      <option value="Number">Number</option>
                      <option value="Slider">Slider (0-10)</option>
                      <option value="Boolean">Yes/No</option>
                      <option value="RichText">Rich Text (Long)</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleAddCustomField}
                    disabled={!customField.label.trim()}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    Add Custom Field
                  </Button>
                </div>
              )}
            </div>

            {/* Selected fields indicator */}
            {selectedFields.length > 0 && (
              <div className="flex-shrink-0 mb-3 p-3 bg-gray-100 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  {selectedFields.length} field{selectedFields.length > 1 ? 's' : ''} selected
                </div>
              </div>
            )}

            {/* Preset fields list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  No fields found matching your search.
                </div>
              ) : (
                filteredPresets.map(field => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors bg-white"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => handleToggleField(field.id)}
                        className="w-4 h-4 rounded border-2 border-pink-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {field.label}
                        </div>
                        <div className="text-xs text-gray-500">{field.category}</div>
                      </div>
                    </label>
                    <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-300 rounded-full px-2 py-1">
                      {field.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedFields.length === 0}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Add {selectedFields.length > 0 ? `${selectedFields.length} ` : ''}Field{selectedFields.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
