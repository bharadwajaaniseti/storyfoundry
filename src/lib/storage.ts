import { createSupabaseServer, createSupabaseAdmin } from './auth-server'
import { env } from './env'

export type StorageFolder = 'covers' | 'samples' | 'full-pdfs' | 'supporting'

export interface UploadResult {
  path: string
  url: string
  size: number
}

// Upload file to Supabase Storage
export async function uploadFile(
  folder: StorageFolder,
  file: File,
  userId: string,
  projectId?: string
): Promise<UploadResult> {
  const supabase = await createSupabaseServer()
  
  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const path = projectId 
    ? `${folder}/${userId}/${projectId}/${fileName}`
    : `${folder}/${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('project-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL (for covers) or create signed URL (for protected content)
  let url: string
  if (folder === 'covers') {
    const { data: publicUrl } = supabase.storage
      .from('project-assets')
      .getPublicUrl(path)
    url = publicUrl.publicUrl
  } else {
    // For protected content, we'll generate signed URLs on demand
    url = ''
  }

  return {
    path: data.path,
    url,
    size: file.size
  }
}

// Generate signed URL for protected content
export async function signUrl(
  path: string, 
  ttlSeconds: number = 3600,
  download?: string
): Promise<string> {
  const supabase = await createSupabaseServer()

  const options: any = { expiresIn: ttlSeconds }
  if (download) {
    options.download = download
  }

  const { data, error } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(path, ttlSeconds, options)

  if (error) {
    console.error('Signed URL error:', error)
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// Delete file from storage
export async function deleteFile(path: string): Promise<void> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.storage
    .from('project-assets')
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

// List files in a folder
export async function listFiles(
  folder: StorageFolder,
  userId: string,
  projectId?: string
): Promise<Array<{ name: string; path: string; size: number; lastModified: string }>> {
  const supabase = await createSupabaseServer()
  
  const path = projectId 
    ? `${folder}/${userId}/${projectId}`
    : `${folder}/${userId}`

  const { data, error } = await supabase.storage
    .from('project-assets')
    .list(path)

  if (error) {
    console.error('List files error:', error)
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data?.map(file => ({
    name: file.name,
    path: `${path}/${file.name}`,
    size: file.metadata?.size || 0,
    lastModified: file.updated_at || file.created_at || ''
  })) || []
}

// Get file metadata
export async function getFileMetadata(path: string) {
  const supabase = await createSupabaseServer()

  // Try to get file info from storage
  const pathParts = path.split('/')
  const fileName = pathParts.pop()
  const folderPath = pathParts.join('/')

  const { data, error } = await supabase.storage
    .from('project-assets')
    .list(folderPath)

  if (error) {
    console.error('Get metadata error:', error)
    return null
  }

  return data?.find(file => file.name === fileName) || null
}

// Admin function to clean up orphaned files
export async function cleanupOrphanedFiles(): Promise<void> {
  const supabase = createSupabaseAdmin()

  try {
    // Get all storage files
    const { data: files, error: listError } = await supabase.storage
      .from('project-assets')
      .list('', { limit: 1000 })

    if (listError) {
      throw listError
    }

    // Get all referenced paths from database
    const { data: assets, error: dbError } = await supabase
      .from('project_assets')
      .select('storage_path')

    if (dbError) {
      throw dbError
    }

    const referencedPaths = new Set(assets?.map(a => a.storage_path) || [])

    // Find orphaned files
    const orphanedFiles = files?.filter(file => {
      const fullPath = file.name
      return !referencedPaths.has(fullPath)
    }) || []

    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      const pathsToDelete = orphanedFiles.map(f => f.name)
      
      const { error: deleteError } = await supabase.storage
        .from('project-assets')
        .remove(pathsToDelete)

      if (deleteError) {
        throw deleteError
      }

      console.log(`Cleaned up ${orphanedFiles.length} orphaned files`)
    }
  } catch (error) {
    console.error('Cleanup error:', error)
    throw error
  }
}
