"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, X } from 'lucide-react'

interface NewLocationProps {
  projectId: string
  onSave: (location: { name: string; description: string }) => void
  onCancel: () => void
}

export default function NewLocation({ projectId, onSave, onCancel }: NewLocationProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a location name')
      return
    }

    onSave({ name: name.trim(), description: description.trim() })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onCancel} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Create New Location</h1>
              <p className="text-sm text-gray-600">Add a new location to your story</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Create Location
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter location name..." className="text-lg font-medium" autoFocus />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <p className="text-sm text-gray-600">Add a brief description of this location</p>
            </CardHeader>
            <CardContent>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter location description..." className="min-h-[200px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
