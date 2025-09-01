'use client'

import { useState } from 'react'
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onAvatarUpdate: (newAvatarUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarUpdate, 
  size = 'md',
  className = '' 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  }

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true)
      setUploadStatus(null)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB')
      }

      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to upload an avatar')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      // Delete old avatar if it exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // Upload new avatar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      onAvatarUpdate(publicUrl)
      setUploadStatus('success')
      
      // Dispatch event to notify other components (like header) to refresh
      console.log('🔥 DISPATCHING profileUpdated event from avatar upload');
      window.dispatchEvent(new CustomEvent('profileUpdated'))
      document.dispatchEvent(new CustomEvent('profileUpdated'))
      
      // Also try calling global refresh function directly
      if ((window as any).refreshHeaderProfile) {
        (window as any).refreshHeaderProfile();
      }
      
      setTimeout(() => setUploadStatus(null), 2000)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      setUploadStatus('error')
      setTimeout(() => setUploadStatus(null), 3000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadAvatar(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadAvatar(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          bg-gray-200 rounded-full flex items-center justify-center relative overflow-hidden
          ${dragActive ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}
          ${isUploading ? 'opacity-75' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Profile"
            className="w-full h-full object-cover relative z-0"
            onError={(e) => {
              console.error('Avatar image failed to load:', currentAvatarUrl)
              e.currentTarget.style.display = 'none'
            }}
            onLoad={() => {
              console.log('Avatar loaded successfully')
            }}
          />
        ) : (
          <span className="text-2xl font-medium text-gray-600 relative z-0">
            U
          </span>
        )}
        
        {/* Upload overlay - only visible on hover */}
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group z-10">
          <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Loading spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* File input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-30"
        />
      </div>

      {/* Upload button */}
      <div className="mt-4">
        <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer text-sm">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
        </label>
        <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 5MB</p>
      </div>

      {/* Status message */}
      {uploadStatus && (
        <div className={`mt-2 p-2 rounded-lg text-sm flex items-center space-x-2 ${
          uploadStatus === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {uploadStatus === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>
            {uploadStatus === 'success' 
              ? 'Avatar updated successfully!' 
              : 'Error uploading avatar'}
          </span>
        </div>
      )}
    </div>
  )
}
