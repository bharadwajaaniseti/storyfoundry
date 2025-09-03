'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, X } from 'lucide-react'

interface NewCharacterProps {
  projectId: string
  onSave: (character: { name: string; description: string }) => void
  onCancel: () => void
}

export default function NewCharacter({ projectId, onSave, onCancel }: NewCharacterProps) {
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')

  const handleSave = () => {
    if (!characterName.trim()) {
      alert('Please enter a character name')
      return
    }

    onSave({
      name: characterName.trim(),
      description: characterDescription.trim()
    })
  }

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
                Create New Character
              </h1>
              <p className="text-sm text-gray-600">
                Add a new character to your story
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Create Character
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Character Name */}
          <Card>
            <CardHeader>
              <CardTitle>Character Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter character name..."
                className="text-lg font-medium"
                autoFocus
              />
            </CardContent>
          </Card>

          {/* Character Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <p className="text-sm text-gray-600">
                Add a brief description of your character
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                placeholder="Enter character description..."
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCharacterDescription(prev => prev + '\n\n**Appearance:**\n')}
                >
                  Add Appearance
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCharacterDescription(prev => prev + '\n\n**Personality:**\n')}
                >
                  Add Personality
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCharacterDescription(prev => prev + '\n\n**Background:**\n')}
                >
                  Add Background
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCharacterDescription(prev => prev + '\n\n**Goals:**\n')}
                >
                  Add Goals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
