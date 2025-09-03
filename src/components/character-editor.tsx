'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus,
  Settings,
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface CharacterAttribute {
  id: string
  name: string
  type: 'text' | 'multitext' | 'number' | 'select'
  value: string | number
  options?: string[]
}

interface CharacterSection {
  id: string
  name: string
  attributes: CharacterAttribute[]
  isCollapsed?: boolean
}

interface Character {
  id?: string
  name: string
  description: string
  image_url?: string
  sections: CharacterSection[]
  created_at?: string
  updated_at?: string
}

interface CharacterEditorProps {
  character?: Character
  projectId: string
  onSave: (character: Character) => void
  onCancel: () => void
}

// Default attribute configurations for different sections
const DEFAULT_ATTRIBUTES = {
  basicInformation: [
    { id: 'fullName', name: 'Full Name', type: 'text' as const },
    { id: 'originCountry', name: 'Origin Country', type: 'multitext' as const },
    { id: 'placeOfResidence', name: 'Place of Residence', type: 'text' as const },
    { id: 'gender', name: 'Gender', type: 'multitext' as const },
    { id: 'formalEducation', name: 'Formal Education', type: 'multitext' as const },
    { id: 'occupation', name: 'Occupation', type: 'multitext' as const }
  ],
  physicalTraits: [],
  personalityTraits: [],
  statistics: [],
  links: []
}

const AVAILABLE_ATTRIBUTES = {
  basicInformation: [
    { id: 'fullName', name: 'Full Name', type: 'text' },
    { id: 'originCountry', name: 'Origin Country', type: 'multitext' },
    { id: 'placeOfResidence', name: 'Place of Residence', type: 'text' },
    { id: 'gender', name: 'Gender', type: 'multitext' },
    { id: 'formalEducation', name: 'Formal Education', type: 'multitext' },
    { id: 'occupation', name: 'Occupation', type: 'multitext' },
    { id: 'age', name: 'Age', type: 'number' },
    { id: 'height', name: 'Height', type: 'text' },
    { id: 'weight', name: 'Weight', type: 'text' },
    { id: 'birthDate', name: 'Birth Date', type: 'text' },
    { id: 'birthPlace', name: 'Birth Place', type: 'text' },
    { id: 'nationality', name: 'Nationality', type: 'text' },
    { id: 'ethnicity', name: 'Ethnicity', type: 'text' },
    { id: 'religion', name: 'Religion', type: 'text' },
    { id: 'politicalAffiliation', name: 'Political Affiliation', type: 'text' },
    { id: 'socialClass', name: 'Social Class', type: 'text' },
    { id: 'maritalStatus', name: 'Marital Status', type: 'text' },
    { id: 'familySize', name: 'Family Size', type: 'text' },
    { id: 'languages', name: 'Languages', type: 'multitext' }
  ],
  physicalTraits: [
    { id: 'hairColor', name: 'Hair Color', type: 'text' },
    { id: 'eyeColor', name: 'Eye Color', type: 'text' },
    { id: 'skinTone', name: 'Skin Tone', type: 'text' },
    { id: 'build', name: 'Build', type: 'text' },
    { id: 'facialFeatures', name: 'Facial Features', type: 'multitext' },
    { id: 'distinguishingMarks', name: 'Distinguishing Marks', type: 'multitext' },
    { id: 'posture', name: 'Posture', type: 'text' },
    { id: 'gait', name: 'Gait', type: 'text' },
    { id: 'voice', name: 'Voice', type: 'text' },
    { id: 'accent', name: 'Accent', type: 'text' },
    { id: 'clothing', name: 'Clothing Style', type: 'multitext' },
    { id: 'accessories', name: 'Accessories', type: 'multitext' }
  ],
  personalityTraits: [
    { id: 'coreTraits', name: 'Core Personality Traits', type: 'multitext' },
    { id: 'strengths', name: 'Strengths', type: 'multitext' },
    { id: 'weaknesses', name: 'Weaknesses', type: 'multitext' },
    { id: 'fears', name: 'Fears', type: 'multitext' },
    { id: 'desires', name: 'Desires', type: 'multitext' },
    { id: 'motivations', name: 'Motivations', type: 'multitext' },
    { id: 'habits', name: 'Habits', type: 'multitext' },
    { id: 'quirks', name: 'Quirks', type: 'multitext' },
    { id: 'hobbies', name: 'Hobbies', type: 'multitext' },
    { id: 'interests', name: 'Interests', type: 'multitext' },
    { id: 'values', name: 'Values', type: 'multitext' },
    { id: 'beliefs', name: 'Beliefs', type: 'multitext' },
    { id: 'mentalHealth', name: 'Mental Health', type: 'text' },
    { id: 'emotionalState', name: 'Emotional State', type: 'text' }
  ],
  statistics: [
    { id: 'intelligence', name: 'Intelligence', type: 'number' },
    { id: 'wisdom', name: 'Wisdom', type: 'number' },
    { id: 'charisma', name: 'Charisma', type: 'number' },
    { id: 'strength', name: 'Strength', type: 'number' },
    { id: 'dexterity', name: 'Dexterity', type: 'number' },
    { id: 'constitution', name: 'Constitution', type: 'number' },
    { id: 'willpower', name: 'Willpower', type: 'number' },
    { id: 'perception', name: 'Perception', type: 'number' },
    { id: 'luck', name: 'Luck', type: 'number' },
    { id: 'health', name: 'Health', type: 'number' }
  ],
  career: [
    { id: 'currentJob', name: 'Current Job', type: 'text' },
    { id: 'jobTitle', name: 'Job Title', type: 'text' },
    { id: 'employer', name: 'Employer', type: 'text' },
    { id: 'workExperience', name: 'Work Experience', type: 'multitext' },
    { id: 'skills', name: 'Skills', type: 'multitext' },
    { id: 'achievements', name: 'Achievements', type: 'multitext' },
    { id: 'salary', name: 'Salary', type: 'text' },
    { id: 'workSchedule', name: 'Work Schedule', type: 'text' }
  ],
  hobbiesInterests: [
    { id: 'hobbies', name: 'Hobbies', type: 'multitext' },
    { id: 'interests', name: 'Interests', type: 'multitext' },
    { id: 'sports', name: 'Sports', type: 'multitext' },
    { id: 'musicPreferences', name: 'Music Preferences', type: 'multitext' },
    { id: 'books', name: 'Favorite Books', type: 'multitext' },
    { id: 'movies', name: 'Favorite Movies', type: 'multitext' },
    { id: 'games', name: 'Games', type: 'multitext' },
    { id: 'collections', name: 'Collections', type: 'multitext' }
  ],
  magicalMartialAbilities: [
    { id: 'magicalAbilities', name: 'Magical Abilities', type: 'multitext' },
    { id: 'spells', name: 'Known Spells', type: 'multitext' },
    { id: 'martialArts', name: 'Martial Arts', type: 'multitext' },
    { id: 'combatSkills', name: 'Combat Skills', type: 'multitext' },
    { id: 'weapons', name: 'Preferred Weapons', type: 'multitext' },
    { id: 'specialAbilities', name: 'Special Abilities', type: 'multitext' },
    { id: 'powerLevel', name: 'Power Level', type: 'number' },
    { id: 'trainers', name: 'Trainers/Mentors', type: 'multitext' }
  ],
  personality: [
    { id: 'mbtiType', name: 'MBTI Type', type: 'text' },
    { id: 'enneagramType', name: 'Enneagram Type', type: 'text' },
    { id: 'temperament', name: 'Temperament', type: 'text' },
    { id: 'communicationStyle', name: 'Communication Style', type: 'text' },
    { id: 'conflictStyle', name: 'Conflict Style', type: 'text' },
    { id: 'learningStyle', name: 'Learning Style', type: 'text' },
    { id: 'stressResponse', name: 'Stress Response', type: 'text' },
    { id: 'copingMechanisms', name: 'Coping Mechanisms', type: 'multitext' }
  ],
  relationships: [
    { id: 'family', name: 'Family', type: 'multitext' },
    { id: 'friends', name: 'Friends', type: 'multitext' },
    { id: 'enemies', name: 'Enemies', type: 'multitext' },
    { id: 'allies', name: 'Allies', type: 'multitext' },
    { id: 'mentors', name: 'Mentors', type: 'multitext' },
    { id: 'students', name: 'Students', type: 'multitext' },
    { id: 'romanticInterests', name: 'Romantic Interests', type: 'multitext' },
    { id: 'rivals', name: 'Rivals', type: 'multitext' }
  ],
  attributesForGames: [
    { id: 'level', name: 'Level', type: 'number' },
    { id: 'experience', name: 'Experience Points', type: 'number' },
    { id: 'hitPoints', name: 'Hit Points', type: 'number' },
    { id: 'manaPoints', name: 'Mana Points', type: 'number' },
    { id: 'armorClass', name: 'Armor Class', type: 'number' },
    { id: 'initiative', name: 'Initiative', type: 'number' },
    { id: 'speed', name: 'Speed', type: 'number' },
    { id: 'savingThrows', name: 'Saving Throws', type: 'multitext' }
  ],
  utilities: [
    { id: 'notes', name: 'Notes', type: 'multitext' },
    { id: 'inspiration', name: 'Inspiration', type: 'multitext' },
    { id: 'references', name: 'References', type: 'multitext' },
    { id: 'plotHooks', name: 'Plot Hooks', type: 'multitext' },
    { id: 'secrets', name: 'Secrets', type: 'multitext' },
    { id: 'development', name: 'Character Development', type: 'multitext' },
    { id: 'backstory', name: 'Backstory', type: 'multitext' }
  ]
}

export default function CharacterEditor({ character, projectId, onSave, onCancel }: CharacterEditorProps) {
  const [characterData, setCharacterData] = useState<Character>(() => {
    if (character) return character
    
    return {
      name: '',
      description: '',
      sections: [
        {
          id: 'basicInformation',
          name: 'Basic Information',
          attributes: DEFAULT_ATTRIBUTES.basicInformation.map(attr => ({
            ...attr,
            value: ''
          }))
        },
        {
          id: 'bio',
          name: 'Bio',
          attributes: [
            { id: 'bio', name: 'Bio', type: 'multitext' as const, value: '' }
          ]
        },
        {
          id: 'physicalTraits',
          name: 'Physical Traits',
          attributes: []
        },
        {
          id: 'personalityTraits',
          name: 'Personality Traits',
          attributes: []
        },
        {
          id: 'statistics',
          name: 'Statistics',
          attributes: []
        },
        {
          id: 'links',
          name: 'Links',
          attributes: []
        }
      ]
    }
  })

  const [selectedSection, setSelectedSection] = useState('basicInformation')
  const [showAttributeModal, setShowAttributeModal] = useState(false)
  const [modalSection, setModalSection] = useState('')
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])

  // Update bio section when character is loaded
  useEffect(() => {
    if (character) {
      setCharacterData(prev => ({
        ...prev,
        sections: prev.sections.map(section =>
          section.id === 'bio'
            ? {
                ...section,
                attributes: [{
                  id: 'bio',
                  name: 'Bio',
                  type: 'multitext' as const,
                  value: character.description || ''
                }]
              }
            : section
        )
      }))
    }
  }, [character])

  const handleSave = () => {
    // Update description from bio section
    const bioSection = characterData.sections.find(s => s.id === 'bio')
    const bioAttribute = bioSection?.attributes.find(a => a.id === 'bio')
    const updatedCharacter = {
      ...characterData,
      description: bioAttribute?.value as string || characterData.description
    }
    onSave(updatedCharacter)
  }

  const updateCharacterField = (field: string, value: any) => {
    setCharacterData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateSectionAttribute = (sectionId: string, attributeId: string, value: any) => {
    setCharacterData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              attributes: section.attributes.map(attr =>
                attr.id === attributeId ? { ...attr, value } : attr
              )
            }
          : section
      )
    }))
  }

  const addAttributesToSection = (sectionId: string, attributeIds: string[]) => {
    const availableAttrs = AVAILABLE_ATTRIBUTES[sectionId as keyof typeof AVAILABLE_ATTRIBUTES] || []
    const newAttributes = attributeIds.map(id => {
      const template = availableAttrs.find(attr => attr.id === id)
      return template ? { ...template, value: template.type === 'number' ? 0 : '' } : null
    }).filter(Boolean) as CharacterAttribute[]

    setCharacterData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              attributes: [...section.attributes, ...newAttributes]
            }
          : section
      )
    }))
  }

  const removeAttributeFromSection = (sectionId: string, attributeId: string) => {
    setCharacterData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              attributes: section.attributes.filter(attr => attr.id !== attributeId)
            }
          : section
      )
    }))
  }

  const openAttributeModal = (sectionId: string) => {
    setModalSection(sectionId)
    setSelectedAttributes([])
    setShowAttributeModal(true)
  }

  const handleAttributeSelection = () => {
    addAttributesToSection(modalSection, selectedAttributes)
    setShowAttributeModal(false)
    setSelectedAttributes([])
    setModalSection('')
  }

  const getCurrentSection = () => {
    return characterData.sections.find(section => section.id === selectedSection)
  }

  const renderAttributeField = (attribute: CharacterAttribute, sectionId: string) => {
    const value = attribute.value

    switch (attribute.type) {
      case 'text':
        return (
          <Input
            value={value as string}
            onChange={(e) => updateSectionAttribute(sectionId, attribute.id, e.target.value)}
            placeholder="Enter some text..."
          />
        )
      case 'multitext':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => updateSectionAttribute(sectionId, attribute.id, e.target.value)}
            placeholder="Enter some text..."
            className="min-h-[80px]"
          />
        )
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value as number}
              onChange={(e) => updateSectionAttribute(sectionId, attribute.id, parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <span className="text-sm text-gray-500">Unit</span>
          </div>
        )
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => updateSectionAttribute(sectionId, attribute.id, e.target.value)}
            placeholder="Enter some text..."
          />
        )
    }
  }

  const section = getCurrentSection()

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onCancel} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {character ? 'Edit Character' : 'New Character'}
              </h1>
              <p className="text-sm text-gray-600">
                {character ? `Editing ${character.name}` : 'Create a new character for your story'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {characterData.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedSection === section.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {section && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">{section.name}</h2>
                {section.id !== 'bio' && (
                  <Button
                    onClick={() => openAttributeModal(section.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attributes
                  </Button>
                )}
              </div>

              {/* Character Name (only show in Basic Information) */}
              {section.id === 'basicInformation' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Character Name</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={characterData.name}
                      onChange={(e) => updateCharacterField('name', e.target.value)}
                      placeholder="Enter character name..."
                      className="text-lg font-medium"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Bio Section */}
              {section.id === 'bio' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                    <p className="text-sm text-gray-600">
                      Type here to add notes, backstories, and anything else you need in this Text Panel!
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={section.attributes[0]?.value as string || ''}
                      onChange={(e) => updateSectionAttribute(section.id, 'bio', e.target.value)}
                      placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                      className="min-h-[200px]"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Image Section (only show in Basic Information) */}
              {section.id === 'basicInformation' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Image</CardTitle>
                    <p className="text-sm text-gray-600">
                      Upload new images or choose from your Image Gallery!
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">
                        Click <Button variant="outline" size="sm" className="mx-1">
                          <Upload className="w-3 h-3 mr-1" />
                          Select Images
                        </Button> below to get started.
                      </p>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Select Images
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regular Attributes */}
              {section.attributes.length > 0 && section.id !== 'bio' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.attributes.map((attribute) => (
                    <Card key={attribute.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base">{attribute.name}</CardTitle>
                        <Button
                          onClick={() => removeAttributeFromSection(section.id, attribute.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {renderAttributeField(attribute, section.id)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State for sections without attributes */}
              {section.attributes.length === 0 && section.id !== 'bio' && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Lists help organize your work. Organize list items by adding sections.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Click + <strong>Add List Item</strong> below to begin.
                    </p>
                    <Button
                      onClick={() => openAttributeModal(section.id)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add List Item
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attribute Selection Modal */}
      <Dialog open={showAttributeModal} onOpenChange={setShowAttributeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Attributes</DialogTitle>
            <p className="text-sm text-gray-600">
              Select any number of attributes below to add them to this Attributes Panel (uncheck them to remove attributes).
            </p>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">🟠 Currently Selected</h4>
              {/* Show currently added attributes */}
              {section?.attributes.map((attr) => (
                <div key={attr.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={true}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        removeAttributeFromSection(section.id, attr.id)
                      }
                    }}
                  />
                  <label className="text-sm">{attr.name}</label>
                  <span className="text-xs text-gray-500 ml-auto">
                    {attr.type === 'multitext' ? 'Multi-Text' : attr.type === 'number' ? 'Number' : 'Text'}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Available Attributes</h4>
              {AVAILABLE_ATTRIBUTES[modalSection as keyof typeof AVAILABLE_ATTRIBUTES]?.map((attr) => {
                const isAlreadyAdded = section?.attributes.some(a => a.id === attr.id)
                if (isAlreadyAdded) return null
                
                return (
                  <div key={attr.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAttributes.includes(attr.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAttributes([...selectedAttributes, attr.id])
                        } else {
                          setSelectedAttributes(selectedAttributes.filter(id => id !== attr.id))
                        }
                      }}
                    />
                    <label className="text-sm">{attr.name}</label>
                    <span className="text-xs text-gray-500 ml-auto">
                      {attr.type === 'multitext' ? 'Multi-Text' : attr.type === 'number' ? 'Number' : 'Text'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAttributeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAttributeSelection}>
              Select Attributes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
