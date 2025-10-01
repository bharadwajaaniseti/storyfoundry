'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Image as ImageIcon } from 'lucide-react'
import { Culture } from '@/lib/validation/cultureSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import AttributePicker from './AttributePicker'
import IconPicker from './IconPicker'

interface CultureEditorProps {
  value: Partial<Culture>
  onChange: (patch: Partial<Culture>) => void
  onSubmit: () => void
  onCancel: () => void
  saving?: boolean
  projectId: string
}

export default function CultureEditor({ value, onChange, onSubmit, onCancel, saving, projectId }: CultureEditorProps) {
  const [showAttributePicker, setShowAttributePicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>(value.attributes || {})

  useEffect(() => {
    setCustomAttributes(value.attributes || {})
  }, [value.attributes])

  const updateAttribute = (key: string, attrValue: any) => {
    const updated = { ...customAttributes, [key]: attrValue }
    setCustomAttributes(updated)
    onChange({ attributes: updated })
  }

  const updateArrayAttribute = (key: string, index: number, newValue: string) => {
    const arr = (customAttributes[key] || []) as string[]
    const updated = [...arr]
    updated[index] = newValue
    updateAttribute(key, updated)
  }

  const addArrayItem = (key: string) => {
    const arr = (customAttributes[key] || []) as string[]
    updateAttribute(key, [...arr, ''])
  }

  const removeArrayItem = (key: string, index: number) => {
    const arr = (customAttributes[key] || []) as string[]
    updateAttribute(key, arr.filter((_, i) => i !== index))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !value.tags?.includes(tagInput.trim())) {
      onChange({ tags: [...(value.tags || []), tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    onChange({ tags: value.tags?.filter(t => t !== tag) || [] })
  }

  const handleAddCustomFields = (fields: Array<{ key: string; label: string; type: string }>) => {
    const updates: Record<string, any> = { ...customAttributes }
    fields.forEach(field => {
      if (field.type === 'Multi-Text') {
        updates[field.key] = []
      } else if (field.type === 'Number' || field.type === 'Slider') {
        updates[field.key] = 0
      } else if (field.type === 'Boolean') {
        updates[field.key] = false
      } else {
        updates[field.key] = ''
      }
    })
    setCustomAttributes(updates)
    onChange({ attributes: updates })
  }

  const renderCustomField = (key: string) => {
    const fieldValue = customAttributes[key]

    // Detect type based on value
    if (Array.isArray(fieldValue)) {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/_/g, ' ')}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newAttrs = { ...customAttributes }
                delete newAttrs[key]
                setCustomAttributes(newAttrs)
                onChange({ attributes: newAttrs })
              }}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {fieldValue.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayAttribute(key, idx, e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem(key, idx)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(key)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </div>
      )
    }

    if (typeof fieldValue === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 capitalize">
            {key.replace(/_/g, ' ')}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fieldValue}
              onChange={(e) => updateAttribute(key, e.target.checked)}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newAttrs = { ...customAttributes }
                delete newAttrs[key]
                setCustomAttributes(newAttrs)
                onChange({ attributes: newAttrs })
              }}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )
    }

    if (typeof fieldValue === 'number') {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/_/g, ' ')}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newAttrs = { ...customAttributes }
                delete newAttrs[key]
                setCustomAttributes(newAttrs)
                onChange({ attributes: newAttrs })
              }}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            type="number"
            value={fieldValue}
            onChange={(e) => updateAttribute(key, parseFloat(e.target.value) || 0)}
          />
        </div>
      )
    }

    // Default to text
    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 capitalize">
            {key.replace(/_/g, ' ')}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newAttrs = { ...customAttributes }
              delete newAttrs[key]
              setCustomAttributes(newAttrs)
              onChange({ attributes: newAttrs })
            }}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        <Textarea
          value={fieldValue || ''}
          onChange={(e) => updateAttribute(key, e.target.value)}
          rows={3}
        />
      </div>
    )
  }

  // Filter out core fields from custom attributes
  const coreFields = [
    'icon', 'summary', 'government', 'political_parties', 'distribution_of_authority',
    'representation', 'primary_language', 'origins_homeland', 'history', 'openness',
    'communication', 'values', 'social_expectations', 'famous_works', 'literature_style',
    'poetry_style', 'music_style', 'access_to_art', 'dishes', 'secular_traditions', 'sacred_traditions'
  ]
  const customFieldKeys = Object.keys(customAttributes).filter(key => !coreFields.includes(key))

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="origins">Origins</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="society">Society</TabsTrigger>
          <TabsTrigger value="arts">Arts & Food</TabsTrigger>
          <TabsTrigger value="traditions">Traditions</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Culture Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={value.name || ''}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Enter culture name..."
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Culture Symbol
              </Label>
              <div className="mt-2 flex items-center gap-4">
                {/* Display current symbol */}
                <div className="flex-shrink-0">
                  {customAttributes.iconImage ? (
                    <div className="w-20 h-20 rounded-xl border-2 border-pink-200 bg-white p-2 shadow-sm">
                      <img
                        src={customAttributes.iconImage}
                        alt="Culture symbol"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : customAttributes.icon ? (
                    <div className="w-20 h-20 rounded-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white flex items-center justify-center text-4xl shadow-sm">
                      {customAttributes.icon}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Button to open picker */}
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full border-2 border-pink-200 hover:border-pink-300 hover:bg-pink-50"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {customAttributes.icon || customAttributes.iconImage ? 'Change Symbol' : 'Choose Symbol'}
                  </Button>
                  {(customAttributes.icon || customAttributes.iconImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Update both attributes at once to avoid race condition
                        const updated = { ...customAttributes, icon: '', iconImage: '' }
                        setCustomAttributes(updated)
                        onChange({ attributes: updated })
                      }}
                      className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove Symbol
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose an emoji or upload a custom image to represent this culture
              </p>
            </div>

            <div>
              <Label htmlFor="summary" className="text-sm font-medium text-gray-700">
                Summary
              </Label>
              <Textarea
                id="summary"
                value={customAttributes.summary || ''}
                onChange={(e) => updateAttribute('summary', e.target.value)}
                placeholder="Brief overview of this culture..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {value.tags?.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Basics Tab */}
          <TabsContent value="basics" className="space-y-4 mt-0">
            <div>
              <Label htmlFor="government" className="text-sm font-medium text-gray-700">
                Government Type
              </Label>
              <Input
                id="government"
                value={customAttributes.government || ''}
                onChange={(e) => updateAttribute('government', e.target.value)}
                placeholder="e.g., Monarchy, Democracy, Theocracy..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Political Parties</Label>
              <div className="space-y-2 mt-1">
                {(customAttributes.political_parties || []).map((party: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={party}
                      onChange={(e) => updateArrayAttribute('political_parties', idx, e.target.value)}
                      placeholder={`Party ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('political_parties', idx)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove party"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('political_parties')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Political Party
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="distribution" className="text-sm font-medium text-gray-700">
                Distribution of Authority
              </Label>
              <Textarea
                id="distribution"
                value={customAttributes.distribution_of_authority || ''}
                onChange={(e) => updateAttribute('distribution_of_authority', e.target.value)}
                placeholder="Describe how power is distributed..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Representation (0 = None, 10 = Full Democracy)
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[customAttributes.representation || 5]}
                  onValueChange={([val]: number[]) => updateAttribute('representation', val)}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">
                  Value: {customAttributes.representation ?? 5}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                Primary Language
              </Label>
              <Input
                id="language"
                value={customAttributes.primary_language || ''}
                onChange={(e) => updateAttribute('primary_language', e.target.value)}
                placeholder="Main language spoken..."
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Origins & Homeland Tab */}
          <TabsContent value="origins" className="space-y-4 mt-0">
            <div>
              <Label htmlFor="origins" className="text-sm font-medium text-gray-700">
                Origins & Homeland
              </Label>
              <Textarea
                id="origins"
                value={customAttributes.origins_homeland || ''}
                onChange={(e) => updateAttribute('origins_homeland', e.target.value)}
                placeholder="Describe the culture's origins, homeland, migration history..."
                rows={12}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-0">
            <div>
              <Label htmlFor="history" className="text-sm font-medium text-gray-700">
                History
              </Label>
              <Textarea
                id="history"
                value={customAttributes.history || ''}
                onChange={(e) => updateAttribute('history', e.target.value)}
                placeholder="Key historical events, wars, alliances, important figures..."
                rows={12}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Society Tab */}
          <TabsContent value="society" className="space-y-4 mt-0">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Openness to Outsiders (0 = Closed, 10 = Very Open)
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[customAttributes.openness || 5]}
                  onValueChange={([val]: number[]) => updateAttribute('openness', val)}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">
                  Value: {customAttributes.openness ?? 5}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Communication Style (0 = Indirect, 10 = Very Direct)
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[customAttributes.communication || 5]}
                  onValueChange={([val]: number[]) => updateAttribute('communication', val)}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">
                  Value: {customAttributes.communication ?? 5}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Core Values</Label>
              <div className="space-y-2 mt-1">
                {(customAttributes.values || []).map((val: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={val}
                      onChange={(e) => updateArrayAttribute('values', idx, e.target.value)}
                      placeholder={`Value ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('values', idx)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove value"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('values')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Value
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="social_expectations" className="text-sm font-medium text-gray-700">
                Social Expectations
              </Label>
              <Textarea
                id="social_expectations"
                value={customAttributes.social_expectations || ''}
                onChange={(e) => updateAttribute('social_expectations', e.target.value)}
                placeholder="Behavioral norms, etiquette, social roles..."
                rows={4}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Arts & Food Tab */}
          <TabsContent value="arts" className="space-y-4 mt-0">
            <div>
              <Label className="text-sm font-medium text-gray-700">Famous Works</Label>
              <div className="space-y-2 mt-1">
                {(customAttributes.famous_works || []).map((work: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={work}
                      onChange={(e) => updateArrayAttribute('famous_works', idx, e.target.value)}
                      placeholder={`Work ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('famous_works', idx)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove work"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('famous_works')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Famous Work
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="literature" className="text-sm font-medium text-gray-700">
                  Literature Style
                </Label>
                <Input
                  id="literature"
                  value={customAttributes.literature_style || ''}
                  onChange={(e) => updateAttribute('literature_style', e.target.value)}
                  placeholder="e.g., Epic, Romantic..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="poetry" className="text-sm font-medium text-gray-700">
                  Poetry Style
                </Label>
                <Input
                  id="poetry"
                  value={customAttributes.poetry_style || ''}
                  onChange={(e) => updateAttribute('poetry_style', e.target.value)}
                  placeholder="e.g., Haiku, Free verse..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="music" className="text-sm font-medium text-gray-700">
                Music Style
              </Label>
              <Input
                id="music"
                value={customAttributes.music_style || ''}
                onChange={(e) => updateAttribute('music_style', e.target.value)}
                placeholder="Describe musical traditions..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="art_access" className="text-sm font-medium text-gray-700">
                Access to Art
              </Label>
              <Textarea
                id="art_access"
                value={customAttributes.access_to_art || ''}
                onChange={(e) => updateAttribute('access_to_art', e.target.value)}
                placeholder="Who has access to art? How is it distributed?"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Traditional Dishes</Label>
              <div className="space-y-2 mt-1">
                {(customAttributes.dishes || []).map((dish: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={dish}
                      onChange={(e) => updateArrayAttribute('dishes', idx, e.target.value)}
                      placeholder={`Dish ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('dishes', idx)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove dish"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('dishes')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Dish
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Traditions Tab */}
          <TabsContent value="traditions" className="space-y-4 mt-0">
            <div>
              <Label htmlFor="secular" className="text-sm font-medium text-gray-700">
                Secular Traditions
              </Label>
              <Textarea
                id="secular"
                value={customAttributes.secular_traditions || ''}
                onChange={(e) => updateAttribute('secular_traditions', e.target.value)}
                placeholder="Non-religious traditions, festivals, ceremonies..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sacred" className="text-sm font-medium text-gray-700">
                Sacred Traditions
              </Label>
              <Textarea
                id="sacred"
                value={customAttributes.sacred_traditions || ''}
                onChange={(e) => updateAttribute('sacred_traditions', e.target.value)}
                placeholder="Religious traditions, rituals, holy days..."
                rows={6}
                className="mt-1"
              />
            </div>

            {/* Custom attributes section */}
            {customFieldKeys.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Custom Attributes</h4>
                <div className="space-y-4">
                  {customFieldKeys.map(key => renderCustomField(key))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setShowAttributePicker(true)}
              className="w-full border-2 border-dashed border-pink-300 hover:border-pink-400 hover:bg-pink-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Field
            </Button>
          </TabsContent>
        </div>
      </Tabs>

      {/* Attribute Picker Modal */}
      <AttributePicker
        open={showAttributePicker}
        onOpenChange={setShowAttributePicker}
        onAdd={handleAddCustomFields}
        existingKeys={Object.keys(customAttributes)}
      />

      {/* Icon Picker Modal */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        currentIcon={customAttributes.icon}
        currentImage={customAttributes.iconImage}
        onSelect={(icon, imageUrl) => {
          if (imageUrl) {
            // Update both attributes at once to avoid race condition
            const updated = { ...customAttributes, iconImage: imageUrl, icon: '' }
            setCustomAttributes(updated)
            onChange({ attributes: updated })
          } else if (icon) {
            // Update both attributes at once to avoid race condition
            const updated = { ...customAttributes, icon: icon, iconImage: '' }
            setCustomAttributes(updated)
            onChange({ attributes: updated })
          }
          setShowIconPicker(false)
        }}
        projectId={projectId}
      />
    </div>
  )
}
