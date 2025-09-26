import { createSupabaseClient } from './auth'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface UploadOptions {
  projectId: string
  entryId: string
  mediaType: 'images' | 'videos' | 'audio'
  file: File
}

/**
 * Upload a file to Supabase storage for encyclopedia media
 */
export async function uploadEncyclopediaMedia({
  projectId,
  entryId,
  mediaType,
  file
}: UploadOptions): Promise<UploadResult> {
  try {
    const supabase = createSupabaseClient()

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${entryId}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `${projectId}/${mediaType}/${fileName}`

    // Validate file size (10MB limit for now)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit'
      }
    }

    // Validate file type
    const allowedTypes = {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a']
    }

    if (!allowedTypes[mediaType].includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type for ${mediaType}. Allowed: ${allowedTypes[mediaType].join(', ')}`
      }
    }

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('encyclopedia-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('encyclopedia-media')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('Upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteEncyclopediaMedia(filePath: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase.storage
      .from('encyclopedia-media')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

/**
 * Extract file path from Supabase public URL for deletion
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase URLs follow pattern: 
    // https://{project}.supabase.co/storage/v1/object/public/encyclopedia-media/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/encyclopedia-media\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate if URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/encyclopedia-media/')
}