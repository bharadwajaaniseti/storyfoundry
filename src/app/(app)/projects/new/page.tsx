'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, FileText, Image, Film } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    format: '',
    visibility: 'private',
    logline: '',
    synopsis: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { projectId } = await response.json()
        router.push(`/projects/${projectId}`)
      } else {
        // Handle error
        console.error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white">
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-gray-300 mt-2">Start your next creative project with IP protection</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Essential details about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Project Title *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter your project title"
                    className="bg-navy-900/50 border-navy-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your project"
                    className="bg-navy-900/50 border-navy-600 text-white placeholder-gray-400 min-h-[100px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre" className="text-white">Genre *</Label>
                    <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                      <SelectTrigger className="bg-navy-900/50 border-navy-600 text-white">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-800 border-navy-700">
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format" className="text-white">Format *</Label>
                    <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                      <SelectTrigger className="bg-navy-900/50 border-navy-600 text-white">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-800 border-navy-700">
                        <SelectItem value="feature">Feature Film</SelectItem>
                        <SelectItem value="short">Short Film</SelectItem>
                        <SelectItem value="series">TV Series</SelectItem>
                        <SelectItem value="limited-series">Limited Series</SelectItem>
                        <SelectItem value="pilot">TV Pilot</SelectItem>
                        <SelectItem value="web-series">Web Series</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="visibility" className="text-white">Visibility</Label>
                  <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
                    <SelectTrigger className="bg-navy-900/50 border-navy-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-navy-800 border-navy-700">
                      <SelectItem value="private">Private - Only you can see this project</SelectItem>
                      <SelectItem value="team">Team - Only collaborators can see this project</SelectItem>
                      <SelectItem value="public">Public - Anyone can discover this project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Creative Content */}
            <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Creative Content</CardTitle>
                <CardDescription className="text-gray-300">
                  Core creative elements of your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logline" className="text-white">Logline</Label>
                  <Textarea
                    id="logline"
                    value={formData.logline}
                    onChange={(e) => handleInputChange('logline', e.target.value)}
                    placeholder="A one-sentence summary of your story (optional)"
                    className="bg-navy-900/50 border-navy-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="synopsis" className="text-white">Synopsis</Label>
                  <Textarea
                    id="synopsis"
                    value={formData.synopsis}
                    onChange={(e) => handleInputChange('synopsis', e.target.value)}
                    placeholder="A brief synopsis of your story (optional)"
                    className="bg-navy-900/50 border-navy-600 text-white placeholder-gray-400 min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isLoading || !formData.title || !formData.description || !formData.genre || !formData.format}
                className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 hover:from-gold-500 hover:to-gold-700"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
              <Button variant="outline" asChild className="border-navy-600 text-gray-300 hover:bg-navy-700">
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Steps */}
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium">Upload Assets</h4>
                  <p className="text-sm text-gray-300">Add scripts, treatments, and other files</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Image className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium">Add Visuals</h4>
                  <p className="text-sm text-gray-300">Upload concept art, mood boards, or stills</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Film className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium">Generate Coverage</h4>
                  <p className="text-sm text-gray-300">Get AI-powered script analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-navy-800/50 border-navy-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <p>• Choose a descriptive title that captures the essence of your story</p>
              <p>• Write a compelling description to attract collaborators</p>
              <p>• Select the correct genre and format for better discoverability</p>
              <p>• Consider starting with private visibility while developing</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
