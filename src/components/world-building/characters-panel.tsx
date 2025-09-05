'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Users, Upload, MoreVertical, Image, Trash2, Search, X, MapPin, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

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
    image_urls?: string[] // Support for multiple images
    links?: Link[] // Support for links to other elements
    [key: string]: any // Allow dynamic attributes
  }
  tags: string[]
  project_id: string
  created_at: string
  updated_at: string
  category: string
}

interface Link {
  id: string
  target_element_id: string
  target_element_name: string
  target_element_category: string
  description?: string
  created_at: string
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
  const [basicInfoModalOpen, setBasicInfoModalOpen] = useState(false)
  const [useDefaultOptions, setUseDefaultOptions] = useState(true)
  const defaultBasicAttributes = ['full_name','origin_country','place_of_residence','gender','formal_education','occupation']
  const [basicSelectedAttributes, setBasicSelectedAttributes] = useState<string[]>(defaultBasicAttributes)
  const [careerSelectedAttributes, setCareerSelectedAttributes] = useState<string[]>([])
  const [hobbiesSelectedAttributes, setHobbiesSelectedAttributes] = useState<string[]>([])
  const [magicalSelectedAttributes, setMagicalSelectedAttributes] = useState<string[]>([])
  const [personalitySelectedAttributes, setPersonalitySelectedAttributes] = useState<string[]>([])
  const [physicalSelectedAttributes, setPhysicalSelectedAttributes] = useState<string[]>([])
  const [relationshipsSelectedAttributes, setRelationshipsSelectedAttributes] = useState<string[]>([])
  const [gamesSelectedAttributes, setGamesSelectedAttributes] = useState<string[]>([])
  const [utilitiesSelectedAttributes, setUtilitiesSelectedAttributes] = useState<string[]>([])
  const [basicSearch, setBasicSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('basic_information')
  const [showCustomAttributeForm, setShowCustomAttributeForm] = useState(false)
  const [customAttribute, setCustomAttribute] = useState({ name: '', type: 'Text' })
  const [customAttributes, setCustomAttributes] = useState<{[category: string]: Array<{id: string, label: string, type: string, isCustom: boolean}>}>({})
  
  // Image management state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const maxImages = 50 // Maximum number of images allowed

  // Link management state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [availableElements, setAvailableElements] = useState<WorldElement[]>([])
  const [recentlyViewedElements, setRecentlyViewedElements] = useState<WorldElement[]>([])
  const [showCreateNewElement, setShowCreateNewElement] = useState(false)
  const [newElementName, setNewElementName] = useState('')
  const [newElementCategory, setNewElementCategory] = useState('characters')

  const elementCategories = [
    'characters', 'locations', 'items', 'cultures', 'systems', 
    'languages', 'religions', 'philosophies', 'maps', 'species'
  ]

  // Comprehensive attribute definitions for all categories
  const allAttributeDefinitions = {
    basic_information: [
      { id: 'full_name', label: 'Full Name', type: 'Text' },
      { id: 'given_name', label: 'Given Name', type: 'Text' },
      { id: 'nickname', label: 'Nickname', type: 'Multi-Text' },
      { id: 'preferred_name', label: 'Preferred Name', type: 'Text' },
      { id: 'pronouns', label: 'Pronouns', type: 'Text' },
      { id: 'former_names', label: 'Former Names', type: 'Multi-Text' },
      { id: 'origin_country', label: 'Origin Country', type: 'Multi-Text' },
      { id: 'place_of_residence', label: 'Place of Residence', type: 'Text' },
      { id: 'residential_status', label: 'Residential Status', type: 'Multi-Text' },
      { id: 'dwelling', label: 'Dwelling', type: 'Multi-Text' },
      { id: 'gender', label: 'Gender & Sexuality', type: 'Multi-Text' },
      { id: 'sexual_orientation', label: 'Sexual Orientation', type: 'Multi-Text' },
      { id: 'age', label: 'Age', type: 'Number' },
      { id: 'birthday', label: 'Birthday', type: 'Text' },
      { id: 'birthplace', label: 'Birthplace', type: 'Text' },
      { id: 'astrological_sign', label: 'Astrological Sign', type: 'Multi-Text' },
      { id: 'zodiac_sign', label: 'Zodiac Sign', type: 'Multi-Text' },
      { id: 'patron_deity', label: 'Patron Deity', type: 'Multi-Text' },
      { id: 'religion_sect', label: 'Religion (Sect)', type: 'Text' },
      { id: 'world_religions', label: 'World Religions', type: 'Multi-Text' }
    ],
    career: [
      { id: 'formal_education', label: 'Formal Education', type: 'Multi-Text' },
      { id: 'alternative_education', label: 'Alternative Education', type: 'Multi-Text' },
      { id: 'school_name', label: 'School Name', type: 'Text' },
      { id: 'school_sports', label: 'School Sports', type: 'Multi-Text' },
      { id: 'clubs_extracurriculars', label: 'Clubs or Extracurriculars', type: 'Multi-Text' },
      { id: 'educators', label: 'Educator(s)', type: 'Text' },
      { id: 'grade_point_average', label: 'Grade Point Average', type: 'Number' },
      { id: 'skills', label: 'Skills', type: 'Multi-Text' },
      { id: 'student_stereotype', label: 'Student Stereotype', type: 'Multi-Text' },
      { id: 'occupation', label: 'Occupation', type: 'Multi-Text' },
      { id: 'debt', label: 'Debt', type: 'Number' },
      { id: 'money', label: 'Money', type: 'Number' }
    ],
    hobbies_interests: [
      { id: 'competitive_hobbies', label: 'Competitive Hobbies', type: 'Multi-Text' },
      { id: 'indoor_collecting_hobbies', label: 'Indoor Collecting Hobbies', type: 'Multi-Text' },
      { id: 'indoor_hobbies', label: 'Indoor Hobbies', type: 'Multi-Text' },
      { id: 'observation_hobbies', label: 'Observation Hobbies', type: 'Multi-Text' },
      { id: 'outdoor_collecting_hobbies', label: 'Outdoor Collecting Hobbies', type: 'Multi-Text' },
      { id: 'outdoor_hobbies', label: 'Outdoor Hobbies', type: 'Multi-Text' },
      { id: 'skills_hobbies', label: 'Skills', type: 'Multi-Text' },
      { id: 'educational_interests', label: 'Educational Interests', type: 'Multi-Text' },
      { id: 'personal_interests', label: 'Personal Interests', type: 'Multi-Text' }
    ],
    magical_martial: [
      { id: 'fantastical_conditions', label: 'Fantastical Conditions', type: 'Multi-Text' },
      { id: 'maximum_spell_level', label: 'Maximum Spell Level', type: 'Number' },
      { id: 'supernatural_abilities', label: 'Supernatural Abilities', type: 'Multi-Text' },
      { id: 'dominant_hand', label: 'Dominant Hand', type: 'Multi-Text' },
      { id: 'fighting_style', label: 'Fighting Style', type: 'Multi-Text' },
      { id: 'preferred_weapon', label: 'Preferred Weapon', type: 'Multi-Text' },
      { id: 'speed', label: 'Speed', type: 'Number' }
    ],
    personality: [
      { id: 'character_archetypes', label: 'Character Archetypes', type: 'Multi-Text' },
      { id: 'big_five_personality', label: 'Big Five Personality Traits', type: 'Multi-Text' },
      { id: 'enneagram_personality', label: 'Enneagram Personality Traits', type: 'Multi-Text' },
      { id: 'competence', label: 'Competence', type: 'Slider' },
      { id: 'proactivity', label: 'Proactivity', type: 'Slider' },
      { id: 'sympathy', label: 'Sympathy', type: 'Slider' },
      { id: 'aggression', label: 'Aggression', type: 'Slider' },
      { id: 'disobedience', label: 'Disobedience', type: 'Slider' },
      { id: 'confidence', label: 'Confidence', type: 'Slider' },
      { id: 'passion', label: 'Passion', type: 'Slider' },
      { id: 'drive', label: 'Drive', type: 'Slider' },
      { id: 'enthusiasm', label: 'Enthusiasm', type: 'Slider' },
      { id: 'tolerance', label: 'Tolerance', type: 'Slider' },
      { id: 'honesty', label: 'Honesty', type: 'Slider' },
      { id: 'extraversion', label: 'Extraversion', type: 'Slider' },
      { id: 'agreeableness', label: 'Agreeableness', type: 'Slider' },
      { id: 'openness', label: 'Openness', type: 'Slider' },
      { id: 'conscientiousness', label: 'Conscientiousness', type: 'Slider' },
      { id: 'neuroticism', label: 'Neuroticism', type: 'Slider' },
      { id: 'reformer', label: 'The Reformer', type: 'Slider' },
      { id: 'helper', label: 'The Helper', type: 'Slider' }
    ],
    physical_traits: [
      { id: 'height', label: 'Height', type: 'Text' },
      { id: 'weight', label: 'Weight', type: 'Text' },
      { id: 'body_type', label: 'Body Type', type: 'Multi-Text' },
      { id: 'hair_color', label: 'Hair Color', type: 'Multi-Text' },
      { id: 'hair_style', label: 'Hair Style', type: 'Multi-Text' },
      { id: 'eye_color', label: 'Eye Color', type: 'Multi-Text' },
      { id: 'skin_tone', label: 'Skin Tone', type: 'Multi-Text' },
      { id: 'distinguishing_marks', label: 'Distinguishing Marks', type: 'Multi-Text' },
      { id: 'tattoos', label: 'Tattoos', type: 'Multi-Text' },
      { id: 'scars', label: 'Scars', type: 'Multi-Text' },
      { id: 'clothing_style', label: 'Clothing Style', type: 'Multi-Text' },
      { id: 'accessories', label: 'Accessories', type: 'Multi-Text' }
    ],
    relationships: [
      { id: 'family_members', label: 'Family Members', type: 'Multi-Text' },
      { id: 'parents', label: 'Parents', type: 'Multi-Text' },
      { id: 'siblings', label: 'Siblings', type: 'Multi-Text' },
      { id: 'children', label: 'Children', type: 'Multi-Text' },
      { id: 'spouse_partner', label: 'Spouse/Partner', type: 'Text' },
      { id: 'friends', label: 'Friends', type: 'Multi-Text' },
      { id: 'enemies', label: 'Enemies', type: 'Multi-Text' },
      { id: 'mentors', label: 'Mentors', type: 'Multi-Text' },
      { id: 'allies', label: 'Allies', type: 'Multi-Text' },
      { id: 'romantic_interests', label: 'Romantic Interests', type: 'Multi-Text' }
    ],
    attributes_games: [
      { id: 'strength', label: 'Strength', type: 'Number' },
      { id: 'dexterity', label: 'Dexterity', type: 'Number' },
      { id: 'constitution', label: 'Constitution', type: 'Number' },
      { id: 'intelligence', label: 'Intelligence', type: 'Number' },
      { id: 'wisdom', label: 'Wisdom', type: 'Number' },
      { id: 'charisma', label: 'Charisma', type: 'Number' },
      { id: 'luck', label: 'Luck', type: 'Number' },
      { id: 'health_points', label: 'Health Points', type: 'Number' },
      { id: 'mana_points', label: 'Mana Points', type: 'Number' },
      { id: 'armor_class', label: 'Armor Class', type: 'Number' },
      { id: 'level', label: 'Level', type: 'Number' },
      { id: 'experience_points', label: 'Experience Points', type: 'Number' }
    ],
    utilities: [
      { id: 'notes', label: 'Notes', type: 'Multi-Text' },
      { id: 'tags', label: 'Tags', type: 'Multi-Text' },
      { id: 'inspiration', label: 'Inspiration', type: 'Multi-Text' },
      { id: 'references', label: 'References', type: 'Multi-Text' },
      { id: 'creation_date', label: 'Creation Date', type: 'Text' },
      { id: 'last_modified', label: 'Last Modified', type: 'Text' },
      { id: 'status', label: 'Status', type: 'Multi-Text' },
      { id: 'version', label: 'Version', type: 'Text' }
    ]
  }

  const categoryInfo = {
    basic_information: { name: 'Basic Information', icon: '●', selectedAttributes: basicSelectedAttributes },
    career: { name: 'Career', icon: '💼', selectedAttributes: careerSelectedAttributes },
    hobbies_interests: { name: 'Hobbies & Interests', icon: '⭐', selectedAttributes: hobbiesSelectedAttributes },
    magical_martial: { name: 'Magical & Martial Abilities', icon: '⚔️', selectedAttributes: magicalSelectedAttributes },
    personality: { name: 'Personality', icon: '🧠', selectedAttributes: personalitySelectedAttributes },
    physical_traits: { name: 'Physical Traits', icon: '👤', selectedAttributes: physicalSelectedAttributes },
    relationships: { name: 'Relationships', icon: '👥', selectedAttributes: relationshipsSelectedAttributes },
    attributes_games: { name: 'Attributes for Games', icon: '🎲', selectedAttributes: gamesSelectedAttributes },
    utilities: { name: 'Utilities', icon: '🔧', selectedAttributes: utilitiesSelectedAttributes }
  }

  const getCurrentAttributes = () => {
    const baseAttributes = allAttributeDefinitions[activeCategory as keyof typeof allAttributeDefinitions] || []
    const categoryCustomAttributes = customAttributes[activeCategory] || []
    return [...baseAttributes, ...categoryCustomAttributes]
  }
  const getCurrentSelectedAttributes = () => {
    switch (activeCategory) {
      case 'basic_information': return basicSelectedAttributes
      case 'career': return careerSelectedAttributes
      case 'hobbies_interests': return hobbiesSelectedAttributes
      case 'magical_martial': return magicalSelectedAttributes
      case 'personality': return personalitySelectedAttributes
      case 'physical_traits': return physicalSelectedAttributes
      case 'relationships': return relationshipsSelectedAttributes
      case 'attributes_games': return gamesSelectedAttributes
      case 'utilities': return utilitiesSelectedAttributes
      default: return []
    }
  }

  const getFilteredAttributes = () => {
    const currentAttrs = getCurrentAttributes()
    return currentAttrs.filter(a =>
      a.label.toLowerCase().includes(basicSearch.toLowerCase().trim())
    )
  }

  const toggleAttribute = (id: string) => {
    const toggle = (prev: string[]) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    
    switch (activeCategory) {
      case 'basic_information':
        setBasicSelectedAttributes(toggle)
        break
      case 'career':
        setCareerSelectedAttributes(toggle)
        break
      case 'hobbies_interests':
        setHobbiesSelectedAttributes(toggle)
        break
      case 'magical_martial':
        setMagicalSelectedAttributes(toggle)
        break
      case 'personality':
        setPersonalitySelectedAttributes(toggle)
        break
      case 'physical_traits':
        setPhysicalSelectedAttributes(toggle)
        break
      case 'relationships':
        setRelationshipsSelectedAttributes(toggle)
        break
      case 'attributes_games':
        setGamesSelectedAttributes(toggle)
        break
      case 'utilities':
        setUtilitiesSelectedAttributes(toggle)
        break
    }
  }

  // Helper function to remove an attribute from the selected lists
  const removeAttribute = (attributeId: string) => {
    // Remove from basic_information
    if (basicSelectedAttributes.includes(attributeId)) {
      setBasicSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    // Remove from other categories
    if (careerSelectedAttributes.includes(attributeId)) {
      setCareerSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (hobbiesSelectedAttributes.includes(attributeId)) {
      setHobbiesSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (magicalSelectedAttributes.includes(attributeId)) {
      setMagicalSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (personalitySelectedAttributes.includes(attributeId)) {
      setPersonalitySelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (physicalSelectedAttributes.includes(attributeId)) {
      setPhysicalSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (relationshipsSelectedAttributes.includes(attributeId)) {
      setRelationshipsSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (gamesSelectedAttributes.includes(attributeId)) {
      setGamesSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
    if (utilitiesSelectedAttributes.includes(attributeId)) {
      setUtilitiesSelectedAttributes(prev => prev.filter(id => id !== attributeId))
      return
    }
  }

  // Helper function to get attribute definition by ID from any category
  const getAttributeDefinition = (attributeId: string) => {
    // First check in predefined attributes
    for (const category of Object.values(allAttributeDefinitions)) {
      const attr = category.find(a => a.id === attributeId)
      if (attr) return attr
    }
    
    // Then check in custom attributes
    for (const category of Object.values(customAttributes)) {
      const attr = category.find(a => a.id === attributeId)
      if (attr) return attr
    }
    
    return null
  }

  // Helper function to render form field based on attribute type
  const renderFormField = (attributeId: string) => {
    const attrDef = getAttributeDefinition(attributeId)
    if (!attrDef || !editingCharacter) return null

    const value = editingCharacter.attributes[attributeId] || ''
    const updateAttribute = (newValue: any) => {
      if (!editingCharacter) return
      setEditingCharacter({
        ...editingCharacter,
        attributes: { ...editingCharacter.attributes, [attributeId]: newValue }
      })
    }

    const renderFieldContent = () => {
      switch (attrDef.type) {
        case 'Text':
          return (
            <input
              type="text"
              placeholder={`Enter ${attrDef.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => updateAttribute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          )
        
        case 'Multi-Text':
          return (
            <textarea
              placeholder={`Enter ${attrDef.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => updateAttribute(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          )
        
        case 'Number':
          return (
            <input
              type="number"
              placeholder={`Enter ${attrDef.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => updateAttribute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          )
        
        case 'Slider':
          return (
            <div>
              <div className="mb-2 text-sm text-gray-500">Value: {value || 0}</div>
              <input
                type="range"
                min="0"
                max="100"
                value={value || 0}
                onChange={(e) => updateAttribute(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )
        
        default:
          return (
            <input
              type="text"
              placeholder={`Enter ${attrDef.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => updateAttribute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          )
      }
    }

    return (
      <div key={attributeId} className="group flex items-start gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {attrDef.label}
          </label>
          {renderFieldContent()}
        </div>
        <button
          onClick={() => removeAttribute(attributeId)}
          className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          title={`Remove ${attrDef.label}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const supabase = createSupabaseClient()

  // Load existing countries from all characters in the project
  const loadExistingCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('attributes')
        .eq('project_id', projectId)
        .eq('category', 'characters')

      if (error) throw error
      
      const countries = new Set<string>()
      data?.forEach(item => {
        const country = item.attributes?.origin_country
        if (country && typeof country === 'string' && country.trim()) {
          countries.add(country.trim())
        }
      })
      
      setExistingCountries(Array.from(countries).sort())
    } catch (error) {
      console.error('Error loading existing countries:', error)
    }
  }

  // Load existing genders from all characters in the project
  const loadExistingGenders = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('attributes')
        .eq('project_id', projectId)
        .eq('category', 'characters')

      if (error) throw error
      
      const genders = new Set<string>()
      data?.forEach(item => {
        const gender = item.attributes?.gender
        if (gender && typeof gender === 'string' && gender.trim()) {
          genders.add(gender.trim())
        }
      })
      
      setExistingGenders(Array.from(genders).sort())
    } catch (error) {
      console.error('Error loading existing genders:', error)
    }
  }

  // Load existing educations from all characters in the project
  const loadExistingEducations = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('attributes')
        .eq('project_id', projectId)
        .eq('category', 'characters')

      if (error) throw error
      
      const educations = new Set<string>()
      data?.forEach(item => {
        const education = item.attributes?.formal_education
        if (education && typeof education === 'string' && education.trim()) {
          educations.add(education.trim())
        }
      })
      
      setExistingEducations(Array.from(educations).sort())
    } catch (error) {
      console.error('Error loading existing educations:', error)
    }
  }

  // Load existing occupations from all characters in the project
  const loadExistingOccupations = async () => {
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('attributes')
        .eq('project_id', projectId)
        .eq('category', 'characters')

      if (error) throw error
      
      const occupations = new Set<string>()
      data?.forEach(item => {
        const occupation = item.attributes?.occupation
        if (occupation && typeof occupation === 'string' && occupation.trim()) {
          occupations.add(occupation.trim())
        }
      })
      
      setExistingOccupations(Array.from(occupations).sort())
    } catch (error) {
      console.error('Error loading existing occupations:', error)
    }
  }

  // Image handling functions
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the limit
    if (uploadedImages.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can upload ${maxImages - uploadedImages.length} more images.`)
      return
    }

    setIsUploading(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select only image files.')
          continue
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image files must be smaller than 5MB.')
          continue
        }

        // Create a data URL for preview (in a real app, you'd upload to a storage service)
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        
        newImages.push(dataUrl)
      }

      // Update the uploaded images state
      setUploadedImages(prev => {
        const combined = [...prev, ...newImages]
        const finalImages = combined.slice(0, maxImages) // Ensure we don't exceed the limit
        
        // Update the character's image arrays
        if (editingCharacter) {
          setEditingCharacter(prevChar => prevChar ? {
            ...prevChar,
            attributes: {
              ...prevChar.attributes,
              image_url: finalImages[0] || '', // Keep first image as primary
              image_urls: finalImages // Store all images
            }
          } : null)
        }
        
        return finalImages
      })

      setError(null)
      setSuccessMessage(`${newImages.length} image(s) uploaded successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error uploading images:', error)
      setError('Failed to upload images. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => {
      const updated = prev.filter((_, i) => i !== index)
      
      // Adjust current index if needed
      if (index <= currentImageIndex && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1)
      } else if (updated.length === 0) {
        setCurrentImageIndex(0)
      } else if (currentImageIndex >= updated.length) {
        setCurrentImageIndex(updated.length - 1)
      }
      
      // Update character's image arrays
      if (editingCharacter) {
        setEditingCharacter(prevChar => prevChar ? {
          ...prevChar,
          attributes: {
            ...prevChar.attributes,
            image_url: updated[0] || '', // First image as primary
            image_urls: updated // All images
          }
        } : null)
      }
      
      return updated
    })
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => Math.max(0, prev - 2))
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => {
      const maxIndex = uploadedImages.length - 1
      return Math.min(maxIndex, prev + 2)
    })
  }

  const handleImageSelect = (index: number) => {
    setCurrentImageIndex(index)
    // Update character's primary image_url to the selected image
    if (editingCharacter && uploadedImages[index]) {
      setEditingCharacter(prev => prev ? {
        ...prev,
        attributes: {
          ...prev.attributes,
          image_url: uploadedImages[index] // Set selected image as primary
        }
      } : null)
    }
  }

  const handleImageChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        handleImageUpload(files)
      }
    }
    input.click()
  }

  // Link management functions
  const loadAvailableElements = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .neq('id', editingCharacter?.id || '') // Exclude current character
        .order('name', { ascending: true })

      if (error) throw error
      setAvailableElements(data || [])
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }

  const handleOpenLinkModal = () => {
    setShowLinkModal(true)
    setLinkSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
    loadAvailableElements()
  }

  const handleCloseLinkModal = () => {
    setShowLinkModal(false)
    setLinkSearchTerm('')
    setShowCreateNewElement(false)
    setNewElementName('')
  }

  const handleLinkElement = async (targetElement: WorldElement) => {
    if (!editingCharacter) return

    try {
      const supabase = createSupabaseClient()
      
      // Create the link
      const newLink: Omit<Link, 'id' | 'created_at'> = {
        target_element_id: targetElement.id,
        target_element_name: targetElement.name,
        target_element_category: targetElement.category,
        description: ''
      }

      // Add to recently viewed
      setRecentlyViewedElements(prev => {
        const filtered = prev.filter(el => el.id !== targetElement.id)
        return [targetElement, ...filtered].slice(0, 5)
      })

      // Update character with new link
      const updatedLinks = [...(editingCharacter.attributes.links || []), {
        ...newLink,
        id: `link_${Date.now()}`,
        created_at: new Date().toISOString()
      }]

      setEditingCharacter(prev => prev ? {
        ...prev,
        attributes: {
          ...prev.attributes,
          links: updatedLinks
        }
      } : null)

      setSuccessMessage(`Linked to ${targetElement.name}`)
      setTimeout(() => setSuccessMessage(null), 3000)
      handleCloseLinkModal()
    } catch (error) {
      console.error('Error creating link:', error)
      setError('Failed to create link. Please try again.')
    }
  }

  const handleCreateAndLinkElement = async () => {
    if (!newElementName.trim() || !editingCharacter) return

    try {
      const supabase = createSupabaseClient()
      
      // Create the new element
      const newElement = {
        project_id: projectId,
        category: newElementCategory,
        name: newElementName.trim(),
        description: '',
        attributes: {},
        tags: []
      }

      const { data, error } = await supabase
        .from('world_elements')
        .insert(newElement)
        .select()
        .single()

      if (error) throw error

      // If we created a character, refresh the characters list
      if (newElementCategory === 'characters') {
        await loadCharacters()
      }

      // Refresh the available elements list for future linking
      await loadAvailableElements()

      // Link to the new element
      await handleLinkElement(data)
      
      // Reset form
      setNewElementName('')
      setNewElementCategory('characters')
      
      // Notify parent component that elements have changed (for sidebar refresh)
      // This should happen after all operations are complete
      onCharactersChange?.()
      
    } catch (error) {
      console.error('Error creating and linking element:', error)
      setError('Failed to create element. Please try again.')
    }
  }

  const handleRemoveLink = (linkId: string) => {
    if (!editingCharacter) return

    setEditingCharacter(prev => prev ? {
      ...prev,
      attributes: {
        ...prev.attributes,
        links: (prev.attributes.links || []).filter(link => link.id !== linkId)
      }
    } : null)
  }

  const getFilteredElements = () => {
    if (!linkSearchTerm.trim()) return availableElements.slice(0, 10)
    
    return availableElements.filter(element =>
      element.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
      element.category.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(linkSearchTerm.toLowerCase())
    )
  }

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
          // Preserve all attributes from database, including custom ones
          ...selectedElement.attributes,
          // Ensure core attributes have defaults if missing
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
          image_url: selectedElement.attributes?.image_url || '',
          image_urls: selectedElement.attributes?.image_urls || [],
          links: selectedElement.attributes?.links || []
        },
        tags: selectedElement.tags || [],
        project_id: selectedElement.project_id,
        created_at: selectedElement.created_at,
        updated_at: selectedElement.updated_at,
        category: selectedElement.category
      }
      
      setEditingCharacter(character)
      setIsCreating(false)
      
      // Initialize uploaded images from character data
      const images = selectedElement.attributes?.image_urls || 
                    (selectedElement.attributes?.image_url ? [selectedElement.attributes.image_url] : [])
      setUploadedImages(images)
      setCurrentImageIndex(images.length > 0 ? 0 : 0)
      
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
          image_url: item.attributes?.image_url || '',
          image_urls: item.attributes?.image_urls || [],
          links: item.attributes?.links || []
        },
        tags: item.tags || [],
        project_id: item.project_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.category
      }))
      
      setCharacters(transformedCharacters)
      
      // Also reload dropdown options when characters are loaded
      await Promise.all([
        loadExistingCountries(),
        loadExistingGenders(),
        loadExistingEducations(),
        loadExistingOccupations()
      ])
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
        image_url: '',
        image_urls: [],
        links: []
      },
      tags: [],
      project_id: projectId,
      created_at: '',
      updated_at: '',
      category: 'characters'
    })
    
    // Reset uploaded images
    setUploadedImages([])
    setCurrentImageIndex(0)
    
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

  // Handle adding a new country
  const handleAddNewCountry = () => {
    if (!editingCharacter) return
    
    const trimmedName = newCountryName.trim()
    if (trimmedName && !existingCountries.includes(trimmedName)) {
      setExistingCountries(prev => [...prev, trimmedName].sort())
      setEditingCharacter({
        ...editingCharacter,
        attributes: { ...editingCharacter.attributes, origin_country: trimmedName }
      })
      setNewCountryName('')
      setShowNewCountryInput(false)
    }
  }

  // Handle adding a new gender
  const handleAddNewGender = () => {
    if (!editingCharacter) return
    
    const trimmedName = newGenderName.trim()
    if (trimmedName && !existingGenders.includes(trimmedName)) {
      setExistingGenders(prev => [...prev, trimmedName].sort())
      setEditingCharacter({
        ...editingCharacter,
        attributes: { ...editingCharacter.attributes, gender: trimmedName }
      })
      setNewGenderName('')
      setShowNewGenderInput(false)
    }
  }

  // Handle adding a new education
  const handleAddNewEducation = () => {
    if (!editingCharacter) return
    
    const trimmedName = newEducationName.trim()
    if (trimmedName && !existingEducations.includes(trimmedName)) {
      setExistingEducations(prev => [...prev, trimmedName].sort())
      setEditingCharacter({
        ...editingCharacter,
        attributes: { ...editingCharacter.attributes, formal_education: trimmedName }
      })
      setNewEducationName('')
      setShowNewEducationInput(false)
    }
  }

  // Handle adding a new occupation
  const handleAddNewOccupation = () => {
    if (!editingCharacter) return
    
    const trimmedName = newOccupationName.trim()
    if (trimmedName && !existingOccupations.includes(trimmedName)) {
      setExistingOccupations(prev => [...prev, trimmedName].sort())
      setEditingCharacter({
        ...editingCharacter,
        attributes: { ...editingCharacter.attributes, occupation: trimmedName }
      })
      setNewOccupationName('')
      setShowNewOccupationInput(false)
    }
  }

  const handleNewCountryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNewCountry()
    } else if (e.key === 'Escape') {
      setNewCountryName('')
      setShowNewCountryInput(false)
    }
  }

  const handleNewGenderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNewGender()
    } else if (e.key === 'Escape') {
      setNewGenderName('')
      setShowNewGenderInput(false)
    }
  }

  const handleNewEducationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNewEducation()
    } else if (e.key === 'Escape') {
      setNewEducationName('')
      setShowNewEducationInput(false)
    }
  }

  const handleNewOccupationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNewOccupation()
    } else if (e.key === 'Escape') {
      setNewOccupationName('')
      setShowNewOccupationInput(false)
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
  const [existingCountries, setExistingCountries] = useState<string[]>([])
  const [existingGenders, setExistingGenders] = useState<string[]>([])
  const [existingEducations, setExistingEducations] = useState<string[]>([])
  const [existingOccupations, setExistingOccupations] = useState<string[]>([])
  const [showNewCountryInput, setShowNewCountryInput] = useState(false)
  const [showNewGenderInput, setShowNewGenderInput] = useState(false)
  const [showNewEducationInput, setShowNewEducationInput] = useState(false)
  const [showNewOccupationInput, setShowNewOccupationInput] = useState(false)
  const [newCountryName, setNewCountryName] = useState('')
  const [newGenderName, setNewGenderName] = useState('')
  const [newEducationName, setNewEducationName] = useState('')
  const [newOccupationName, setNewOccupationName] = useState('')

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
              <div className={`${getPanelClassName('basic')} max-h-[567px] flex flex-col`} style={getPanelStyle('basic')}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                  <div className="flex items-center gap-2 relative dropdown-container">
                    {/* Add (+) icon to open modal */}
                    <button
                      onClick={() => setBasicInfoModalOpen(true)}
                      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                      title="Add"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
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
                {/* Modal for Basic Information actions */}
                <Dialog open={basicInfoModalOpen} onOpenChange={setBasicInfoModalOpen}>
                  <DialogContent className="sm:max-w-4xl p-0 rounded-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl overflow-hidden" showCloseButton={false}>
                    <VisuallyHidden>
                      <DialogTitle>Manage Attributes</DialogTitle>
                    </VisuallyHidden>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Manage Attributes</h2>
                        <p className="text-sm text-gray-600">Select any number of attributes below to add them to this Attributes Panel (uncheck them to remove attributes).</p>
                      </div>
                      <button
                        onClick={() => setBasicInfoModalOpen(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Two-column layout */}
                    <div className="flex min-h-[500px]">
                      {/* Left sidebar - Category buttons */}
                      <div className="w-1/3 bg-gray-50/50 border-r border-gray-200/50 p-4">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 mb-3 px-2">Currently Selected</div>
                          
                          {/* Category buttons */}
                          <button 
                            onClick={() => setActiveCategory('basic_information')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                              activeCategory === 'basic_information' 
                                ? 'bg-orange-500 text-white shadow-sm' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            ● Basic Information
                          </button>
                          <button 
                            onClick={() => setActiveCategory('career')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'career' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            💼 Career
                          </button>
                          <button 
                            onClick={() => setActiveCategory('hobbies_interests')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'hobbies_interests' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            ⭐ Hobbies & Interests
                          </button>
                          <button 
                            onClick={() => setActiveCategory('magical_martial')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'magical_martial' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                          >
                            ⚔️ Magical & Martial Abilities
                          </button>
                          <button 
                            onClick={() => setActiveCategory('personality')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'personality' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            🧠 Personality
                          </button>
                          <button 
                            onClick={() => setActiveCategory('physical_traits')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'physical_traits' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            👤 Physical Traits
                          </button>
                          <button 
                            onClick={() => setActiveCategory('relationships')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'relationships' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            👥 Relationships
                          </button>
                          <button 
                            onClick={() => setActiveCategory('attributes_games')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'attributes_games' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            🎲 Attributes for Games
                          </button>
                          <button 
                            onClick={() => setActiveCategory('utilities')}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              activeCategory === 'utilities' 
                                ? 'bg-orange-500 text-white shadow-sm font-medium' 
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            🔧 Utilities
                          </button>
                        </div>

                        {/* Use Default Options toggle */}
                        <div className="mt-6 pt-4 border-t border-gray-200/50">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              checked={useDefaultOptions}
                              onCheckedChange={(checked) => {
                                const val = Boolean(checked)
                                setUseDefaultOptions(val)
                                if (val) {
                                  setBasicSelectedAttributes(['full_name','origin_country','place_of_residence','gender','formal_education','occupation'])
                                }
                              }}
                              className="w-4 h-4 rounded border-2 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Use Default Options</span>
                              <div className="text-xs text-gray-500">🛡️</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Right content area */}
                      <div className="flex-1 p-6">
                        {/* Selected attributes tags */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2 min-h-[2rem]">
                            {getCurrentSelectedAttributes().length > 0 ? (
                              getCurrentSelectedAttributes().map((attrId) => {
                                const attr = getCurrentAttributes().find(a => a.id === attrId)
                                return attr ? (
                                  <span key={attrId} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                                    {attr.label}
                                    <span className="text-gray-500">({getCurrentSelectedAttributes().filter(id => id === attrId).length})</span>
                                  </span>
                                ) : null
                              })
                            ) : (
                              <span className="text-sm text-gray-400 italic">No attributes selected</span>
                            )}
                          </div>
                        </div>

                        {/* Custom Attribute Form */}
                        {showCustomAttributeForm && (
                          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <h4 className="text-sm font-semibold text-orange-800 mb-3">Create Custom Attribute</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Attribute Name</label>
                                <Input
                                  placeholder="Enter attribute name..."
                                  value={customAttribute.name}
                                  onChange={(e) => setCustomAttribute(prev => ({ ...prev, name: e.target.value }))}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Attribute Type</label>
                                <select
                                  value={customAttribute.type}
                                  onChange={(e) => setCustomAttribute(prev => ({ ...prev, type: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-300"
                                >
                                  <option value="Text">Text</option>
                                  <option value="Multi-Text">Multi-Text</option>
                                  <option value="Number">Number</option>
                                  <option value="Slider">Slider</option>
                                  <option value="Date">Date</option>
                                  <option value="Boolean">Yes/No</option>
                                </select>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (customAttribute.name.trim()) {
                                      // Add custom attribute to current category
                                      const newId = `custom_${Date.now()}`
                                      const newAttr = {
                                        id: newId,
                                        label: customAttribute.name,
                                        type: customAttribute.type,
                                        isCustom: true
                                      }
                                      
                                      // Add to custom attributes for current category
                                      setCustomAttributes(prev => ({
                                        ...prev,
                                        [activeCategory]: [...(prev[activeCategory] || []), newAttr]
                                      }))
                                      
                                      // Auto-select the new custom attribute
                                      toggleAttribute(newId)
                                      
                                      // Reset form
                                      setCustomAttribute({ name: '', type: 'Text' })
                                      setShowCustomAttributeForm(false)
                                    }
                                  }}
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs"
                                >
                                  Add Attribute
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowCustomAttributeForm(false)
                                    setCustomAttribute({ name: '', type: 'Text' })
                                  }}
                                  className="px-3 py-1 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Search and Add Custom Attribute */}
                        <div className="mb-4 space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="Search attributes..." 
                              className="pl-9 rounded-xl border-gray-200 focus:border-orange-300 focus:ring-orange-100" 
                              value={basicSearch} 
                              onChange={(e) => setBasicSearch(e.target.value)} 
                            />
                          </div>
                          
                          {!showCustomAttributeForm && (
                            <button
                              onClick={() => setShowCustomAttributeForm(true)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Add Custom Attribute
                            </button>
                          )}
                        </div>

                        {/* Attribute list */}
                        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                          {getFilteredAttributes().map((attr) => (
                            <div key={attr.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                              (attr as any).isCustom 
                                ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 hover:shadow-sm' 
                                : 'border-gray-200 bg-gray-50 hover:bg-white hover:shadow-sm'
                            }`}>
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <Checkbox 
                                  checked={getCurrentSelectedAttributes().includes(attr.id)} 
                                  onCheckedChange={() => toggleAttribute(attr.id)}
                                  className="w-4 h-4 rounded border-2 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">{attr.label}</span>
                                  {(attr as any).isCustom && (
                                    <span className="ml-2 text-xs text-orange-600 font-medium">Custom</span>
                                  )}
                                </div>
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-full px-2 py-1">
                                  {attr.type}
                                </span>
                                {(attr as any).isCustom && (
                                  <button
                                    onClick={() => {
                                      // Remove from custom attributes
                                      setCustomAttributes(prev => ({
                                        ...prev,
                                        [activeCategory]: prev[activeCategory]?.filter(a => a.id !== attr.id) || []
                                      }))
                                      // Remove from selected if it was selected
                                      if (getCurrentSelectedAttributes().includes(attr.id)) {
                                        toggleAttribute(attr.id)
                                      }
                                    }}
                                    className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                                    title="Delete custom attribute"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {getFilteredAttributes().length === 0 && (
                            <div className="text-center py-12 text-sm text-gray-500">
                              No attributes match your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => setBasicInfoModalOpen(false)}
                        className="px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setBasicInfoModalOpen(false)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                      >
                        Select Attributes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {expandedSections.basic && (
                  <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                    {basicSelectedAttributes.includes('full_name') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
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
                      <button
                        onClick={() => removeAttribute('full_name')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Full Name"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}
                    
                    {basicSelectedAttributes.includes('origin_country') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origin Country
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                          value={editingCharacter.attributes.origin_country || ''}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewCountryInput(true)
                            } else {
                              setEditingCharacter({
                                ...editingCharacter,
                                attributes: { ...editingCharacter.attributes, origin_country: e.target.value }
                              })
                            }
                          }}
                        >
                          <option value="">Select Country...</option>
                          {existingCountries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                          <option value="ADD_NEW">+ Add New Country</option>
                        </select>
                        
                        {showNewCountryInput && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Enter new country name..."
                              value={newCountryName}
                              onChange={(e) => setNewCountryName(e.target.value)}
                              onKeyDown={handleNewCountryKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleAddNewCountry}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                disabled={!newCountryName.trim()}
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewCountryInput(false)
                                  setNewCountryName('')
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAttribute('origin_country')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Origin Country"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}

                    {basicSelectedAttributes.includes('place_of_residence') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
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
                      <button
                        onClick={() => removeAttribute('place_of_residence')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Place of Residence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}

                    {basicSelectedAttributes.includes('gender') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                          value={editingCharacter.attributes.gender || ''}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewGenderInput(true)
                            } else {
                              setEditingCharacter({
                                ...editingCharacter,
                                attributes: { ...editingCharacter.attributes, gender: e.target.value }
                              })
                            }
                          }}
                        >
                          <option value="">Select Gender...</option>
                          {existingGenders.map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                          <option value="ADD_NEW">+ Add New Gender</option>
                        </select>
                        
                        {showNewGenderInput && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Enter new gender..."
                              value={newGenderName}
                              onChange={(e) => setNewGenderName(e.target.value)}
                              onKeyDown={handleNewGenderKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleAddNewGender}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                disabled={!newGenderName.trim()}
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewGenderInput(false)
                                  setNewGenderName('')
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAttribute('gender')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Gender"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}

                    {basicSelectedAttributes.includes('formal_education') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Formal Education
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                          value={editingCharacter.attributes.formal_education || ''}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewEducationInput(true)
                            } else {
                              setEditingCharacter({
                                ...editingCharacter,
                                attributes: { ...editingCharacter.attributes, formal_education: e.target.value }
                              })
                            }
                          }}
                        >
                          <option value="">Select Education...</option>
                          {existingEducations.map(education => (
                            <option key={education} value={education}>{education}</option>
                          ))}
                          <option value="ADD_NEW">+ Add New Education</option>
                        </select>
                        
                        {showNewEducationInput && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Enter new education level..."
                              value={newEducationName}
                              onChange={(e) => setNewEducationName(e.target.value)}
                              onKeyDown={handleNewEducationKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleAddNewEducation}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                disabled={!newEducationName.trim()}
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewEducationInput(false)
                                  setNewEducationName('')
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAttribute('formal_education')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Formal Education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}

                    {basicSelectedAttributes.includes('occupation') && (
                    <div className="group flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupation
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                          value={editingCharacter.attributes.occupation || ''}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewOccupationInput(true)
                            } else {
                              setEditingCharacter({
                                ...editingCharacter,
                                attributes: { ...editingCharacter.attributes, occupation: e.target.value }
                              })
                            }
                          }}
                        >
                          <option value="">Select Occupation...</option>
                          {existingOccupations.map(occupation => (
                            <option key={occupation} value={occupation}>{occupation}</option>
                          ))}
                          <option value="ADD_NEW">+ Add New Occupation</option>
                        </select>
                        
                        {showNewOccupationInput && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Enter new occupation..."
                              value={newOccupationName}
                              onChange={(e) => setNewOccupationName(e.target.value)}
                              onKeyDown={handleNewOccupationKeyDown}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleAddNewOccupation}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                disabled={!newOccupationName.trim()}
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowNewOccupationInput(false)
                                  setNewOccupationName('')
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeAttribute('occupation')}
                        className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="Remove Occupation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}

                    {/* Dynamic rendering of selected attributes from all categories */}
                    {/* Render basic_information attributes that aren't handled by custom form fields above */}
                    {basicSelectedAttributes
                      .filter(attrId => !['full_name', 'origin_country', 'place_of_residence', 'gender', 'formal_education', 'occupation'].includes(attrId))
                      .map(attrId => renderFormField(attrId))}
                    
                    {careerSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {hobbiesSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {magicalSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {personalitySelectedAttributes.map(attrId => renderFormField(attrId))}
                    {physicalSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {relationshipsSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {gamesSelectedAttributes.map(attrId => renderFormField(attrId))}
                    {utilitiesSelectedAttributes.map(attrId => renderFormField(attrId))}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 resize-none"
                      style={{ height: '435px' }}
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
                      <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 space-y-2">
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
                        </div>
                        <button
                          onClick={() => removeTrait('physical_traits', index)}
                          className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
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
                      <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 space-y-2">
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
                        </div>
                        <button
                          onClick={() => removeTrait('personality_traits', index)}
                          className="mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
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
                  <div className="space-y-4">
                    {/* Display uploaded images */}
                    {uploadedImages.length > 0 ? (
                      <div className="space-y-4">
                        {/* Two images side by side */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* First image slot */}
                          <div className="relative group">
                            {uploadedImages[currentImageIndex] ? (
                              <>
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                  <img 
                                    src={uploadedImages[currentImageIndex]} 
                                    alt={`Character ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {/* Remove button for first image */}
                                <button
                                  onClick={() => handleImageRemove(currentImageIndex)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No image</span>
                              </div>
                            )}
                          </div>

                          {/* Second image slot */}
                          <div className="relative group">
                            {uploadedImages[currentImageIndex + 1] ? (
                              <>
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                  <img 
                                    src={uploadedImages[currentImageIndex + 1]} 
                                    alt={`Character ${currentImageIndex + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {/* Remove button for second image */}
                                <button
                                  onClick={() => handleImageRemove(currentImageIndex + 1)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No image</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Navigation controls (only show if more than 2 images) */}
                        {uploadedImages.length > 2 && (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={handlePreviousImage}
                              disabled={currentImageIndex === 0}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors text-sm"
                              title="Previous images"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Previous
                            </button>
                            
                            {/* Page indicator */}
                            <div className="text-sm text-gray-600">
                              {Math.floor(currentImageIndex / 2) + 1} / {Math.ceil(uploadedImages.length / 2)}
                            </div>
                            
                            <button
                              onClick={handleNextImage}
                              disabled={currentImageIndex + 2 >= uploadedImages.length}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors text-sm"
                              title="Next images"
                            >
                              Next
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                        
                        {/* Image capacity and action buttons */}
                        <div className="space-y-3">
                          {/* Capacity indicator */}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Images: {uploadedImages.length}/{maxImages}</span>
                            <span className="text-xs">Max {maxImages} images allowed</span>
                          </div>
                          
                          {/* File size limit */}
                          <div className="text-xs text-gray-500 text-center">
                            Maximum size: 5MB per image
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleImageChange}
                              disabled={isUploading || uploadedImages.length >= maxImages}
                              className="flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Change Images</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setUploadedImages([])
                                setCurrentImageIndex(0)
                                if (editingCharacter) {
                                  setEditingCharacter(prev => prev ? {
                                    ...prev,
                                    attributes: { 
                                      ...prev.attributes, 
                                      image_url: '',
                                      image_urls: []
                                    }
                                  } : null)
                                }
                              }}
                              className="flex items-center space-x-2 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove All</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Upload area for new images */
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-300 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50"
                        onClick={handleImageChange}
                      >
                        <div className="text-center">
                          {isUploading ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mb-3" />
                              <p className="text-sm text-gray-600">Uploading images...</p>
                            </div>
                          ) : (
                            <>
                              <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-sm text-gray-600 mb-2">
                                Upload up to <strong>{maxImages} images</strong> for your character
                              </p>
                              <p className="text-xs text-gray-500 mb-4">
                                Click here or drag and drop images (max 5MB each)
                              </p>
                              <button 
                                type="button"
                                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors mx-auto"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Select Images</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
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
                  <div className="space-y-4">
                    {/* Existing Links */}
                    {editingCharacter.attributes.links && editingCharacter.attributes.links.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Linked Elements</h4>
                        {editingCharacter.attributes.links.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {link.target_element_category.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">{link.target_element_name}</div>
                                <div className="text-xs text-gray-500 capitalize">{link.target_element_category}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveLink(link.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove link"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Links connect <strong>{editingCharacter.name || 'New Character'}</strong> with any other elements within your story.
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Click <strong>+ Add Link</strong> below to add a link to an existing element.
                      </p>
                    </div>

                    {/* Add Link Button */}
                    <button 
                      onClick={handleOpenLinkModal}
                      className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
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

      {/* Link Element Modal */}
      {showLinkModal && (
        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-100 pb-6">
              <DialogTitle className="text-2xl font-semibold text-gray-900">Link Element</DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Select an element to create a two-way link. This link will be available in links panels on either of the two elements.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col h-full pt-6">
              {/* Tabs */}
              <div className="flex bg-gray-50 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setShowCreateNewElement(false)}
                  className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    !showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Select Element
                </button>
                <button
                  onClick={() => setShowCreateNewElement(true)}
                  className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    showCreateNewElement
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Create New Element
                </button>
              </div>

              {!showCreateNewElement ? (
                /* Select Element Tab */
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Search */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search for an element..."
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-base border-gray-200 focus:border-gray-400 focus:ring-0 bg-gray-50"
                    />
                  </div>

                  {/* Recently Viewed */}
                  {recentlyViewedElements.length > 0 && !linkSearchTerm && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Recently Viewed</h4>
                      <div className="space-y-2">
                        {recentlyViewedElements.map((element) => (
                          <button
                            key={element.id}
                            onClick={() => handleLinkElement(element)}
                            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 border border-transparent hover:border-gray-200"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <span className="text-sm font-bold text-white">
                                {element.category.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-medium text-gray-900 truncate">{element.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                            </div>
                            <div className="text-gray-400">
                              {element.category === 'characters' ? <Users className="w-5 h-5" /> : 
                               element.category === 'locations' ? <MapPin className="w-5 h-5" /> : 
                               <BookOpen className="w-5 h-5" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {linkSearchTerm && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Search Results</h4>
                    )}
                    <div className="space-y-2 pb-4">
                      {getFilteredElements().map((element) => (
                        <button
                          key={element.id}
                          onClick={() => handleLinkElement(element)}
                          className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 border border-transparent hover:border-gray-200"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {element.category.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-gray-900 truncate">{element.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{element.category}</div>
                            {element.description && (
                              <div className="text-sm text-gray-400 truncate mt-1 max-w-md">{element.description}</div>
                            )}
                          </div>
                          <div className="text-gray-400">
                            {element.category === 'characters' ? <Users className="w-5 h-5" /> : 
                             element.category === 'locations' ? <MapPin className="w-5 h-5" /> : 
                             <BookOpen className="w-5 h-5" />}
                          </div>
                        </button>
                      ))}
                    </div>
                    {getFilteredElements().length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">No elements found</p>
                        {linkSearchTerm && (
                          <p className="text-sm text-gray-500">Try a different search term</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Create New Element Tab */
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Element Name</label>
                      <Input
                        placeholder="Enter element name..."
                        value={newElementName}
                        onChange={(e) => setNewElementName(e.target.value)}
                        className="h-12 text-base border-gray-200 focus:border-gray-400 focus:ring-0 bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Category</label>
                      <select
                        value={newElementCategory}
                        onChange={(e) => setNewElementCategory(e.target.value)}
                        className="w-full h-12 px-4 text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-0 focus:border-gray-400 transition-colors"
                      >
                        {elementCategories.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Add a thumbnail image</p>
                        <p className="text-xs text-gray-500">Optional - You can add this later</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleCloseLinkModal}
                      className="flex-1 h-12 px-6 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAndLinkElement}
                      disabled={!newElementName.trim()}
                      className="flex-1 h-12 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Create Element and Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
