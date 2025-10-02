// Run this script to create the item-images storage bucket
// Usage: node create-item-images-bucket.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createItemImagesBucket() {
  console.log('🚀 Creating item-images storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const existingBucket = buckets.find(b => b.id === 'item-images')
    
    if (existingBucket) {
      console.log('ℹ️  Bucket "item-images" already exists')
      console.log('   Public:', existingBucket.public)
      console.log('   Created:', existingBucket.created_at)
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('item-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp'
      ]
    })

    if (error) {
      throw error
    }

    console.log('✅ Successfully created bucket "item-images"')
    console.log('   Public: true')
    console.log('   File size limit: 5MB')
    console.log('   Allowed types: PNG, JPEG, JPG, GIF, WEBP\n')
    console.log('📝 Bucket is ready to use!')

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message)
    console.error('\n💡 Alternative: Create the bucket manually in Supabase Dashboard:')
    console.error('   1. Go to Storage in your Supabase project')
    console.error('   2. Click "Create a new bucket"')
    console.error('   3. Name: item-images')
    console.error('   4. Public: Yes')
    console.error('   5. File size limit: 5242880 (5MB)')
    console.error('   6. Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp')
    process.exit(1)
  }
}

createItemImagesBucket()
