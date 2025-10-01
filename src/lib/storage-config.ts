import { createSupabaseClient } from './auth'

export const STORAGE_BUCKETS = {
  SPECIES_IMAGES: 'species-images'
} as const

export const initializeStorage = async () => {
  const supabase = createSupabaseClient()
  
  // Create species images bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets()
  
  if (!buckets?.find(b => b.name === STORAGE_BUCKETS.SPECIES_IMAGES)) {
    await supabase.storage.createBucket(STORAGE_BUCKETS.SPECIES_IMAGES, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    })
  }
}