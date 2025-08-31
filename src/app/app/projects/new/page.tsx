'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  FileText,
  Shield,
  Users,
  Eye,
  Upload,
  Sparkles,
  Clock,
  AlertCircle,
  Check
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

const PROJECT_FORMATS = [
  { value: 'screenplay', label: 'Screenplay', description: 'Feature film, TV pilot, or short film script' },
  { value: 'treatment', label: 'Treatment', description: 'Story outline and treatment document' },
  { value: 'novel', label: 'Novel', description: 'Full-length novel or novella' },
  { value: 'short_story', label: 'Short Story', description: 'Short fiction piece' },
  { value: 'pilot', label: 'TV Pilot', description: 'Television pilot episode script' }
]

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western', 'Other'
]

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can view this project',
    icon: Shield
  },
  {
    value: 'preview',
    label: 'Preview',
    description: 'Share with selected collaborators',
    icon: Users
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view (with IP protection)',
    icon: Eye
  }
]

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    logline: '',
    format: '',
    genre: '',
    visibility: 'private',
    description: '',
    enableTimestamp: true,
    enableAI: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step >= 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'Project title is required'
      }
      if (!formData.logline.trim()) {
        newErrors.logline = 'Logline is required'
      }
      if (!formData.format) {
        newErrors.format = 'Project format is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(1)) return
    
    setIsSubmitting(true)

    try {
      // First, verify we're authenticated by checking with the client
      const supabase = createSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Client auth check failed:', authError)
        router.push('/signin')
        return
      }

      console.log('Client auth check passed for user:', user.id)

      // Get the session token for API authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      // Use the API endpoint instead of direct Supabase client
      console.log('Making API request to create project...')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('Added Authorization header')
      }
      
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          title: formData.title.trim(),
          logline: formData.logline.trim(),
          description: formData.description.trim() || null,
          format: formData.format,
          genre: formData.genre || null,
          visibility: formData.visibility,
          ai_enabled: formData.enableAI,
          ip_protection_enabled: formData.enableTimestamp
        }),
      })

      console.log('API response status:', response.status)
      const result = await response.json()
      console.log('API response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project')
      }

      if (result.success && result.project) {
        router.push(`/app/projects/${result.project.id}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create project. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Project</h1>
          <p className="text-gray-600">Start your creative journey with IP protection and AI assistance</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Details</h2>
              
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your project title"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Logline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logline *
                  </label>
                  <textarea
                    value={formData.logline}
                    onChange={(e) => setFormData({ ...formData, logline: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.logline ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="A one or two sentence summary of your story"
                  />
                  {errors.logline && (
                    <p className="text-red-500 text-sm mt-1">{errors.logline}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    Keep it concise and compelling - this helps others understand your project
                  </p>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Format *
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {PROJECT_FORMATS.map((format) => (
                      <label
                        key={format.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.format === format.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={formData.format === format.value}
                          onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                          className="sr-only"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{format.label}</div>
                          <div className="text-sm text-gray-600">{format.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.format && (
                    <p className="text-red-500 text-sm mt-1">{errors.format}</p>
                  )}
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre (Optional)
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a genre</option>
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Visibility Settings */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy & Sharing</h2>
                
                <div className="space-y-4">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    return (
                      <label
                        key={option.value}
                        className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.visibility === option.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.visibility === option.value}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                          className="mt-1"
                        />
                        <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-800">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Features</h2>
                
                <div className="space-y-6">
                  <label className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.enableTimestamp}
                      onChange={(e) => setFormData({ ...formData, enableTimestamp: e.target.checked })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">IP Protection & Timestamping</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Automatically timestamp your content for intellectual property protection
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={formData.enableAI}
                      onChange={(e) => setFormData({ ...formData, enableAI: e.target.checked })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800">AI Writing Assistant</span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Pro</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Get AI-powered suggestions for character development, plot points, and dialogue
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Provide more details about your project, themes, or inspiration..."
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                {errors.submit && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">{errors.submit}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Project...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
