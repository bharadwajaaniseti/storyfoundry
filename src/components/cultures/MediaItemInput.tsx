'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Link as LinkIcon, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseClient } from '@/lib/auth'

export interface MediaItem {
  name: string
  imageUrls?: string[]  // Changed to array for multiple images
  link?: string
}

interface MediaItemInputProps {
  item: MediaItem
  index: number
  placeholder: string
  onUpdate: (index: number, item: MediaItem) => void
  onRemove: (index: number) => void
  projectId: string
  storageBucket: string
}

export default function MediaItemInput({
  item,
  index,
  placeholder,
  onUpdate,
  onRemove,
  projectId,
  storageBucket
}: MediaItemInputProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(fileName)

      // Add to existing images array
      const currentImages = item.imageUrls || []
      onUpdate(index, { ...item, imageUrls: [...currentImages, publicUrl] })
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    // Upload all selected files
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i])
    }
  }

  const handleRemoveImage = (imageUrl: string) => {
    const currentImages = item.imageUrls || []
    const updatedImages = currentImages.filter(url => url !== imageUrl)
    onUpdate(index, { ...item, imageUrls: updatedImages.length > 0 ? updatedImages : undefined })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:border-pink-200 transition-colors">
      {/* Name Input */}
      <div>
        <Input
          value={item.name}
          onChange={(e) => onUpdate(index, { ...item, name: e.target.value })}
          placeholder={placeholder}
          className="font-medium"
        />
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-600">Images (optional)</Label>
        
        {/* Image Gallery */}
        {item.imageUrls && item.imageUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {item.imageUrls.map((imageUrl, imgIdx) => (
              <div key={imgIdx} className="relative group">
                <img
                  src={imageUrl}
                  alt={`${item.name || 'Image'} ${imgIdx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveImage(imageUrl)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
            dragActive 
              ? 'border-pink-400 bg-pink-50' 
              : 'border-gray-300 hover:border-pink-300 hover:bg-pink-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">
                {item.imageUrls && item.imageUrls.length > 0 ? 'Add more images' : 'Click or drag images'}
              </span>
              <span className="text-[10px] text-gray-400">Multiple files supported</span>
            </div>
          )}
        </div>
        
        {uploadError && (
          <p className="text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Link Input */}
      <div>
        <Label className="text-xs font-medium text-gray-600">Link (optional)</Label>
        <div className="flex items-center gap-2 mt-1">
          {item.link ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
              className="h-8 w-8 p-0 flex-shrink-0 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
              title="Open link in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          ) : (
            <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <Input
            value={item.link || ''}
            onChange={(e) => onUpdate(index, { ...item, link: e.target.value })}
            placeholder="https://example.com"
            className="text-sm"
          />
        </div>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="w-3 h-3 mr-1" />
        Remove
      </Button>
    </div>
  )
}
