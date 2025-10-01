'use client'

import React, { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Smile, X, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createSupabaseClient } from '@/lib/auth'

interface IconPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIcon?: string
  currentImage?: string
  onSelect: (icon: string, imageUrl?: string) => void
  projectId: string
}

// Curated emoji icons for cultures
const CULTURE_EMOJIS = [
  // Crowns & Royalty
  '👑', '⚜️', '🏰', '🗡️', '🛡️', '⚔️',
  // Nature & Elements
  '🌿', '🌳', '🌸', '🌺', '🍃', '🌾', '🌊', '⛰️', '🏔️', '🌋', '🔥', '💧', '🌪️', '⚡',
  // Animals & Creatures
  '🦅', '🦉', '🐺', '🦁', '🐉', '🐲', '🦋', '🐝', '🦊', '🐻', '🦌', '🐎', '🦚',
  // Celestial & Mystical
  '⭐', '✨', '🌙', '☀️', '🌟', '💫', '🔮', '🪬', '🧿',
  // Cultural Symbols
  '☯️', '🕉️', '☪️', '✝️', '🔯', '☮️', '🎭', '🎨', '🎵', '🎶',
  // Tools & Crafts
  '⚒️', '🔨', '⚙️', '🪓', '🏹', '🎣', '⚓', '🧭',
  // Plants & Agriculture
  '🌽', '🌾', '🌻', '🌹', '🌷', '🪴', '🍇', '🍎',
  // Architecture & Landmarks
  '🏛️', '🕌', '⛩️', '🗿', '🗼', '🏯', '🕍',
  // Geometric & Abstract
  '◆', '◇', '○', '●', '△', '▽', '■', '□', '★', '☆', '♦', '♠', '♣', '♥',
]

const EMOJI_CATEGORIES = [
  { id: 'all', label: 'All', icons: CULTURE_EMOJIS },
  { id: 'royalty', label: 'Royalty', icons: ['👑', '⚜️', '🏰', '🗡️', '🛡️', '⚔️'] },
  { id: 'nature', label: 'Nature', icons: ['🌿', '🌳', '🌸', '🌺', '🍃', '🌾', '🌊', '⛰️', '🏔️', '🌋'] },
  { id: 'elements', label: 'Elements', icons: ['🔥', '💧', '🌪️', '⚡', '☀️', '🌙'] },
  { id: 'animals', label: 'Animals', icons: ['🦅', '🦉', '🐺', '🦁', '🐉', '🐲', '🦋', '🐝', '🦊', '🐻', '🦌', '🐎', '🦚'] },
  { id: 'celestial', label: 'Celestial', icons: ['⭐', '✨', '🌙', '☀️', '🌟', '💫', '🔮', '🪬', '🧿'] },
  { id: 'symbols', label: 'Symbols', icons: ['☯️', '🕉️', '☪️', '✝️', '🔯', '☮️', '🎭', '🎨', '🎵', '🎶'] },
  { id: 'crafts', label: 'Crafts', icons: ['⚒️', '🔨', '⚙️', '🪓', '🏹', '🎣', '⚓', '🧭'] },
  { id: 'architecture', label: 'Buildings', icons: ['🏛️', '🕌', '⛩️', '🗿', '🗼', '🏯', '🕍'] },
]

export default function IconPicker({ 
  open, 
  onOpenChange, 
  currentIcon, 
  currentImage, 
  onSelect, 
  projectId 
}: IconPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedEmoji, setSelectedEmoji] = useState(currentIcon || '')
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(currentImage)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const category = EMOJI_CATEGORIES.find(cat => cat.id === selectedCategory) || EMOJI_CATEGORIES[0]

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    setUploadedImage(undefined)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const supabase = createSupabaseClient()
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Upload to Supabase Storage (culture-icons bucket)
      const { data, error } = await supabase.storage
        .from('culture-icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('culture-icons')
        .getPublicUrl(fileName)

      setUploadedImage(publicUrl)
      setSelectedEmoji('') // Clear emoji selection when image is uploaded
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleConfirm = () => {
    if (uploadedImage) {
      onSelect('', uploadedImage)
    } else if (selectedEmoji) {
      onSelect(selectedEmoji, undefined)
    }
    // Don't close here - let parent handle closing after state update
  }

  const handleRemoveImage = () => {
    setUploadedImage(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !h-[80vh] overflow-hidden !bg-white shadow-xl border border-gray-200 flex flex-col sm:!max-w-4xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Choose Culture Symbol
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Select an emoji or upload a custom symbol image for your culture
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="emoji" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="emoji" className="flex items-center gap-2">
              <Smile className="w-4 h-4" />
              Emoji Icons
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Image
            </TabsTrigger>
          </TabsList>

          {/* Emoji Tab */}
          <TabsContent value="emoji" className="flex-1 flex gap-4 min-h-0 overflow-hidden mt-0">
            {/* Categories Sidebar */}
            <div className="w-32 flex-shrink-0 border-r border-gray-200 pr-3 overflow-y-auto">
              <div className="space-y-1">
                {EMOJI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-pink-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {category.icons.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`relative aspect-square flex items-center justify-center text-3xl rounded-xl border-2 transition-all hover:scale-110 hover:shadow-md ${
                      selectedEmoji === emoji
                        ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-pink-300'
                    }`}
                  >
                    {emoji}
                    {selectedEmoji === emoji && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-0">
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Upload Area */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Upload Custom Symbol
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-pink-500 bg-pink-100' 
                      : 'border-pink-300 hover:border-pink-400 hover:bg-pink-50'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, SVG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadError && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Preview Uploaded Image */}
              {uploadedImage && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Preview
                  </Label>
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-xl border-2 border-pink-500 bg-white p-3 shadow-lg">
                      <img
                        src={uploadedImage}
                        alt="Culture symbol"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Current Image (if editing) */}
              {currentImage && !uploadedImage && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Current Symbol
                  </Label>
                  <div className="w-32 h-32 rounded-xl border-2 border-gray-200 bg-white p-3">
                    <img
                      src={currentImage}
                      alt="Current culture symbol"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Guidelines */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-pink-900 mb-2">Image Guidelines</h4>
                <ul className="text-xs text-pink-800 space-y-1 list-disc list-inside">
                  <li>Use square images for best results (e.g., 512x512px)</li>
                  <li>Simple, iconic designs work best as symbols</li>
                  <li>Transparent backgrounds (PNG) are recommended</li>
                  <li>High contrast images are more recognizable</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedEmoji && !uploadedImage}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
