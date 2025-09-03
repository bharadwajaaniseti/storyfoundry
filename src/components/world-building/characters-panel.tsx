'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Users, Upload, MoreVertical, Image, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'

interface Character {
  id: string
  name: string
  description: string
  attributes: {
    full_name?: string
    origin_country?: string
    place_of_residence?: string
    gender?: string
    formal_education?: string
    occupation?: string
    bio?: string
    physical_traits?: Array<{name: string, description: string}>
    personality_traits?: Array<{name: string, description: string}>
    statistics?: Array<{name: string, value: number, unit?: string}>
    image_url?: string
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface WorldElement {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: Record<string, any>
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
  is_folder?: boolean
  parent_folder_id?: string
  sort_order?: number
  icon_color?: string
}

interface CharactersPanelProps {
  projectId: string
  selectedElement?: WorldElement | null // Element to edit when clicked from sidebar
  onCharactersChange?: () => void // Callback to notify when characters are added/updated/deleted
  onClearSelection?: () => void // Callback to clear selected element
}

export default function CharactersPanel({ projectId, selectedElement, onCharactersChange, onClearSelection }: CharactersPanelProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    bio: true,
    physical: true,
    personality: true,
    stats: true,
    image: true,
    links: true
  })
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [panelColors, setPanelColors] = useState<{[key: string]: string}>({
    basic: '',
    bio: '',
    physical: '',
    personality: '',
    image: '',
    stats: '',
    links: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (activeDropdown && !target.closest('.dropdown-container')) {
        setActiveDropdown(null)
      }
      if (showColorPicker && !target.closest('.color-picker-container')) {
        setShowColorPicker(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown, showColorPicker])

  // Load selected element into edit mode
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'characters') {
      const character: Character = {
        id: selectedElement.id,
        name: selectedElement.name,
        description: selectedElement.description,
        attributes: {
          full_name: selectedElement.attributes?.full_name || '',
          origin_country: selectedElement.attributes?.origin_country || '',
          place_of_residence: selectedElement.attributes?.place_of_residence || '',
          gender: selectedElement.attributes?.gender || '',
          formal_education: selectedElement.attributes?.formal_education || '',
          occupation: selectedElement.attributes?.occupation || '',
          bio: selectedElement.attributes?.bio || '',
          physical_traits: selectedElement.attributes?.physical_traits || [],
          personality_traits: selectedElement.attributes?.personality_traits || [],
          statistics: selectedElement.attributes?.statistics || [],
          image_url: selectedElement.attributes?.image_url || ''
        },
        tags: selectedElement.tags || [],
        project_id: selectedElement.project_id,
        created_at: selectedElement.created_at,
        updated_at: selectedElement.updated_at,
        category: selectedElement.category
      }
      
      setEditingCharacter(character)
      setIsCreating(false)
      
      // Load panel colors if available
      if (selectedElement.attributes?.panel_colors) {
        setPanelColors(selectedElement.attributes.panel_colors)
      }
    }
  }, [selectedElement])

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'characters')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const transformedCharacters = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        attributes: {
          full_name: item.attributes?.full_name || '',
          origin_country: item.attributes?.origin_country || '',
          place_of_residence: item.attributes?.place_of_residence || '',
          gender: item.attributes?.gender || '',
          formal_education: item.attributes?.formal_education || '',
          occupation: item.attributes?.occupation || '',
          bio: item.attributes?.bio || '',
          physical_traits: item.attributes?.physical_traits || [],
          personality_traits: item.attributes?.personality_traits || [],
          statistics: item.attributes?.statistics || [],
          image_url: item.attributes?.image_url || ''
        },
        tags: item.tags || [],
        project_id: item.project_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.category
      }))
      
      setCharacters(transformedCharacters)
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCharacter = () => {
    setError(null) // Clear any previous errors
    setSuccessMessage(null) // Clear any success messages
    onClearSelection?.() // Clear any selected element from parent
    setIsCreating(true)
    setEditingCharacter({
      id: '',
      name: 'New Character',
      description: '',
      attributes: {
        full_name: '',
        origin_country: '',
        place_of_residence: '',
        gender: '',
        formal_education: '',
        occupation: '',
        bio: '',
        physical_traits: [],
        personality_traits: [],
        statistics: [],
        image_url: ''
      },
      tags: [],
      project_id: projectId,
      created_at: '',
      updated_at: '',
      category: 'characters'
    })
    
    // Reset panel colors to defaults
    setPanelColors({
      basic: '',
      bio: '',
      physical: '',
      personality: '',
      image: '',
      stats: '',
      links: ''
    })
  }

  const saveCharacter = async () => {
    if (!editingCharacter) return

    // Clear previous errors
    setError(null)

    // Validation
    if (!editingCharacter.attributes.full_name?.trim()) {
      setError('Character name is required')
      return
    }

    setSaving(true)

    try {
      const characterData = {
        project_id: projectId,
        category: 'characters',
        name: editingCharacter.attributes.full_name, // Use full_name as the main name
        description: editingCharacter.description,
        attributes: {
          ...editingCharacter.attributes,
          panel_colors: panelColors // Save panel colors
        },
        tags: editingCharacter.tags
      }

      if (isCreating) {
        const { data, error } = await supabase
          .from('world_elements')
          .insert(characterData)
          .select()
          .single()

        if (error) throw error
        if (data) {
          const newCharacter = {
            ...editingCharacter,
            id: data.id,
            name: data.name,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
          setCharacters(prev => [newCharacter, ...prev])
        }
      } else {
        const { data, error } = await supabase
          .from('world_elements')
          .update(characterData)
          .eq('id', editingCharacter.id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          const updatedCharacter = {
            ...editingCharacter,
            name: data.name,
            updated_at: data.updated_at
          }
          setCharacters(prev => prev.map(char => char.id === editingCharacter.id ? updatedCharacter : char))
        }
      }

      setIsCreating(false)
      setEditingCharacter(null)
      setSuccessMessage(isCreating ? 'Character created successfully!' : 'Character updated successfully!')
      
      // Clear selected element to return to list view
      onClearSelection?.()
      
      // Notify parent component that characters have changed
      onCharactersChange?.()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving character:', error)
      setError(error.message || 'Failed to save character. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleDropdown = (section: string) => {
    setActiveDropdown(activeDropdown === section ? null : section)
  }

  const handleMenuAction = (action: string, section: string) => {
    if (action === 'setColor') {
      setShowColorPicker(section)
      setActiveDropdown(null)
    } else if (action === 'delete') {
      console.log(`Delete action for section: ${section}`)
      setActiveDropdown(null)
    } else {
      console.log(`Action: ${action} on section: ${section}`)
      setActiveDropdown(null)
    }
  }

  const [customColors, setCustomColors] = useState<{[key: string]: string}>({})

  const handleColorSelect = (section: string, color: string) => {
    setPanelColors(prev => ({
      ...prev,
      [section]: color
    }))
    // Clear any custom color for this section
    setCustomColors(prev => {
      const newColors = { ...prev }
      delete newColors[section]
      return newColors
    })
    setShowColorPicker(null)
  }

  const handleCustomColorChange = (section: string, hexColor: string) => {
    // Store the custom hex color
    setCustomColors(prev => ({
      ...prev,
      [section]: hexColor
    }))
    
    // Clear the predefined color selection
    setPanelColors(prev => ({
      ...prev,
      [section]: ''
    }))
  }

  const predefinedColors = [
    { name: 'Default', value: '', class: 'bg-white' },
    { name: 'Blue', value: 'bg-blue-50 border-blue-200', class: 'bg-blue-100' },
    { name: 'Green', value: 'bg-green-50 border-green-200', class: 'bg-green-100' },
    { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200', class: 'bg-yellow-100' },
    { name: 'Red', value: 'bg-red-50 border-red-200', class: 'bg-red-100' },
    { name: 'Purple', value: 'bg-purple-50 border-purple-200', class: 'bg-purple-100' },
    { name: 'Pink', value: 'bg-pink-50 border-pink-200', class: 'bg-pink-100' },
    { name: 'Orange', value: 'bg-orange-50 border-orange-200', class: 'bg-orange-100' }
  ]

  const getPanelStyle = (section: string) => {
    const customColor = customColors[section]
    const predefinedColor = panelColors[section]
    
    if (customColor) {
      return {
        backgroundColor: customColor,
        borderColor: customColor,
        borderWidth: '1px'
      }
    }
    
    return {}
  }

  const getPanelClassName = (section: string) => {
    const customColor = customColors[section]
    const predefinedColor = panelColors[section]
    
    if (customColor) {
      return 'rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200'
    }
    
    return `rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 ${predefinedColor || 'bg-white border-gray-200'}`
  }

  const addTrait = (type: 'physical_traits' | 'personality_traits') => {
    if (!editingCharacter) return
    
    const newTrait = { name: 'New Item Name', description: 'Add a description...' }
    const currentTraits = editingCharacter.attributes[type] || []
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        [type]: [...currentTraits, newTrait]
      }
    })
  }

  const addStatistic = () => {
    if (!editingCharacter) return
    
    const newStat = { name: 'Name', value: 0, unit: 'Unit' }
    const currentStats = editingCharacter.attributes.statistics || []
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        statistics: [...currentStats, newStat]
      }
    })
  }

  const updateTrait = (type: 'physical_traits' | 'personality_traits', index: number, field: 'name' | 'description', value: string) => {
    if (!editingCharacter) return
    
    const traits = [...(editingCharacter.attributes[type] || [])]
    traits[index] = { ...traits[index], [field]: value }
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        [type]: traits
      }
    })
  }

  const updateStatistic = (index: number, field: 'name' | 'value' | 'unit', value: string | number) => {
    if (!editingCharacter) return
    
    const stats = [...(editingCharacter.attributes.statistics || [])]
    stats[index] = { ...stats[index], [field]: value }
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        statistics: stats
      }
    })
  }

  const removeTrait = (type: 'physical_traits' | 'personality_traits', index: number) => {
    if (!editingCharacter) return
    
    const traits = [...(editingCharacter.attributes[type] || [])]
    traits.splice(index, 1)
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        [type]: traits
      }
    })
  }

  const removeStatistic = (index: number) => {
    if (!editingCharacter) return
    
    const stats = [...(editingCharacter.attributes.statistics || [])]
    stats.splice(index, 1)
    
    setEditingCharacter({
      ...editingCharacter,
      attributes: {
        ...editingCharacter.attributes,
        statistics: stats
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading characters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {editingCharacter ? (
        // Edit/Create Form
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isCreating ? 'Create New Character' : 'Edit Character'}
                  </h1>
                  <p className="text-gray-600">Build detailed character profiles for your story</p>
                  {error && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setEditingCharacter(null)
                      setIsCreating(false)
                      setError(null)
                      onClearSelection?.() // Clear selected element when cancelling
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCharacter}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isCreating ? 'Create Character' : 'Save Changes'}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className={getPanelClassName('basic')} style={getPanelStyle('basic')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('basic')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'basic' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'basic')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'basic')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'basic' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.basic || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('basic', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('basic', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.basic === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.basic && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter character's full name..."
                        value={editingCharacter.attributes.full_name || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          name: e.target.value,
                          attributes: { ...editingCharacter.attributes, full_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Origin Country
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        value={editingCharacter.attributes.origin_country || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          attributes: { ...editingCharacter.attributes, origin_country: e.target.value }
                        })}
                      >
                        <option value="">Select or Type...</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Place of Residence
                      </label>
                      <input
                        type="text"
                        placeholder="Enter current residence..."
                        value={editingCharacter.attributes.place_of_residence || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          attributes: { ...editingCharacter.attributes, place_of_residence: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        value={editingCharacter.attributes.gender || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          attributes: { ...editingCharacter.attributes, gender: e.target.value }
                        })}
                      >
                        <option value="">Select or Type...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formal Education
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        value={editingCharacter.attributes.formal_education || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          attributes: { ...editingCharacter.attributes, formal_education: e.target.value }
                        })}
                      >
                        <option value="">Select or Type...</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Occupation
                      </label>
                      <input
                        type="text"
                        placeholder="Enter occupation..."
                        value={editingCharacter.attributes.occupation || ''}
                        onChange={(e) => setEditingCharacter({
                          ...editingCharacter,
                          attributes: { ...editingCharacter.attributes, occupation: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className={getPanelClassName('bio')} style={getPanelStyle('bio')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Bio</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('bio')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'bio' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'bio')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'bio')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'bio' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.bio || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('bio', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('bio', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.bio === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.bio && (
                  <div>
                    <textarea
                      placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                      value={editingCharacter.attributes.bio || ''}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        attributes: { ...editingCharacter.attributes, bio: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 h-40 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Physical Traits */}
              <div className={getPanelClassName('physical')} style={getPanelStyle('physical')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Physical Traits</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('physical')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'physical' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'physical')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'physical')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'physical' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.physical || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('physical', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('physical', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.physical === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.physical && (
                  <div className="space-y-3">
                    {editingCharacter.attributes.physical_traits?.map((trait, index) => (
                      <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          placeholder="Trait name..."
                          value={trait.name}
                          onChange={(e) => updateTrait('physical_traits', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={trait.description}
                          onChange={(e) => updateTrait('physical_traits', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={() => removeTrait('physical_traits', index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addTrait('physical_traits')}
                      className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Physical Trait</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Personality Traits */}
              <div className={getPanelClassName('personality')} style={getPanelStyle('personality')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Personality Traits</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('personality')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'personality' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'personality')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'personality')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'personality' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.personality || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('personality', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('personality', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.personality === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.personality && (
                  <div className="space-y-3">
                    {editingCharacter.attributes.personality_traits?.map((trait, index) => (
                      <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          placeholder="Trait name..."
                          value={trait.name}
                          onChange={(e) => updateTrait('personality_traits', index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Add a description..."
                          value={trait.description}
                          onChange={(e) => updateTrait('personality_traits', index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={() => removeTrait('personality_traits', index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addTrait('personality_traits')}
                      className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Personality Trait</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Image */}
              <div className={getPanelClassName('image')} style={getPanelStyle('image')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Image</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('image')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'image' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'image')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'image')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'image' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.image || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('image', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('image', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.image === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.image && (
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-300 transition-colors">
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload new images or choose from your <strong>Image Gallery</strong>!
                      </p>
                      <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors mx-auto">
                        <Upload className="w-4 h-4" />
                        <span>Select Images</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className={getPanelClassName('stats')} style={getPanelStyle('stats')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('stats')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'stats' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'stats')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'stats')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'stats' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.stats || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('stats', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('stats', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.stats === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.stats && (
                  <div className="space-y-3">
                    {editingCharacter.attributes.statistics?.map((stat, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          placeholder="Name"
                          value={stat.name}
                          onChange={(e) => updateStatistic(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="number"
                          value={stat.value}
                          onChange={(e) => updateStatistic(index, 'value', parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={stat.unit}
                          onChange={(e) => updateStatistic(index, 'unit', e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={() => removeStatistic(index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addStatistic}
                      className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Statistic</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className={`lg:col-span-2 ${getPanelClassName('links')}`} style={getPanelStyle('links')}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Links</h3>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => toggleDropdown('links')}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === 'links' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleMenuAction('setColor', 'links')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          Set Panel Color
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', 'links')}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Delete Panel
                        </button>
                      </div>
                    )}
                    {showColorPicker === 'links' && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 color-picker-container">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Panel Color</h4>
                        
                        {/* Custom Color Picker */}
                        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColors.links || '#ffffff'}
                              onChange={(e) => handleCustomColorChange('links', e.target.value)}
                              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <span className="text-xs text-gray-500">Pick any color</span>
                          </div>
                        </div>

                        {/* Predefined Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Preset Colors</label>
                          <div className="grid grid-cols-4 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color.name}
                                onClick={() => handleColorSelect('links', color.value)}
                                className={`w-12 h-12 rounded-lg border-2 ${color.class} hover:scale-110 transition-transform duration-200 ${panelColors.links === color.value ? 'ring-2 ring-orange-500' : 'border-gray-300'}`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedSections.links && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Links connect <strong>{editingCharacter.name || 'New Character'}</strong> with any other elements within your story.
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Click <strong>+ Add Link</strong> below to add a link to an existing element.
                    </p>
                    <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                      <Plus className="w-4 h-4" />
                      <span>Add Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty State - Just shows the create character button
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            {successMessage && (
              <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
                {successMessage}
              </div>
            )}
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No character selected</h3>
            <p className="text-sm text-gray-600 mb-4">Create a new character to get started</p>
            <button
              onClick={createCharacter}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Character</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
