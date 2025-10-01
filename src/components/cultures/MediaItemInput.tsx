'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Link as LinkIcon, Image as ImageIcon, ExternalLink, Trash2, Eye } from 'lucide-react'
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
  const [viewingImage, setViewingImage] = useState<string | null>(null)
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Handle multiple files
      const filesArray = Array.from(e.dataTransfer.files)
      await uploadMultipleFiles(filesArray)
    }
  }

  const uploadMultipleFiles = async (files: File[]) => {
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = createSupabaseClient()
      const uploadedUrls: string[] = []

      // Upload all files and collect URLs
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.error('Skipping non-image file:', file.name)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error('Skipping file larger than 5MB:', file.name)
          continue
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Error uploading file:', file.name, error)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      // Update with all new URLs at once - no race condition!
      if (uploadedUrls.length > 0) {
        const currentImages = item.imageUrls || []
        onUpdate(index, { ...item, imageUrls: [...currentImages, ...uploadedUrls] })
      } else if (files.length > 0) {
        setUploadError('No valid images were uploaded. Please check file types and sizes.')
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      setUploadError('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    await uploadMultipleFiles(Array.from(files))
  }

  const handleRemoveImage = (imageUrl: string) => {
    const currentImages = item.imageUrls || []
    const updatedImages = currentImages.filter(url => url !== imageUrl)
    onUpdate(index, { ...item, imageUrls: updatedImages.length > 0 ? updatedImages : undefined })
  }

  return (
    <>
      <div className="relative border-2 border-gray-300 rounded-xl p-4 bg-white hover:border-pink-300 hover:shadow-lg transition-all duration-200">
        {/* Delete Button - Top Right */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 z-10"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="flex gap-4">
          {/* Left Side - Image Gallery */}
          <div className="w-64 flex-shrink-0">
            <Label className="text-xs font-medium text-gray-600 mb-2 block">Images</Label>
            
            {/* Image Gallery - Compact Grid */}
            {item.imageUrls && item.imageUrls.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {item.imageUrls.map((imageUrl, imgIdx) => (
                    <div key={imgIdx} className="relative group">
                      <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-300 bg-white">
                        <img
                          src={imageUrl}
                          alt={`Image ${imgIdx + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          style={{ display: 'block' }}
                          onClick={() => setViewingImage(imageUrl)}
                        />
                      </div>
                      {/* View icon on hover */}
                      <div 
                        className="absolute inset-0 group-hover:bg-black group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center cursor-pointer pointer-events-none"
                        onClick={() => setViewingImage(imageUrl)}
                      >
                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      {/* Remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(imageUrl)
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
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
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600 py-2">
                  <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-2">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] text-gray-500">
                    {item.imageUrls && item.imageUrls.length > 0 ? 'Add more' : 'Click or drag'}
                  </span>
                </div>
              )}
            </div>
            
            {uploadError && (
              <p className="text-[10px] text-red-600 mt-1">{uploadError}</p>
            )}
          </div>

          {/* Right Side - Name and Link */}
          <div className="flex-1 space-y-3 pr-8">
            {/* Name Input */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Name</Label>
              <Input
                value={item.name}
                onChange={(e) => onUpdate(index, { ...item, name: e.target.value })}
                placeholder={placeholder}
                className="font-medium"
              />
            </div>

            {/* Link Section - Editable */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Link (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={item.link || ''}
                  onChange={(e) => onUpdate(index, { ...item, link: e.target.value })}
                  placeholder="https://example.com"
                  className="text-sm flex-1"
                />
                {item.link && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                    className="h-9 w-9 p-0 flex-shrink-0 text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 h-10 w-10 p-0 text-white hover:text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={viewingImage}
            alt="Full view"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
