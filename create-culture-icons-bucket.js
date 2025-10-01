// Run this script to create the culture-icons storage bucket
// Usage: node create-culture-icons-bucket.js

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

async function createCultureIconsBucket() {
  console.log('🚀 Creating culture-icons storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const existingBucket = buckets.find(b => b.id === 'culture-icons')
    
    if (existingBucket) {
      console.log('ℹ️  Bucket "culture-icons" already exists')
      console.log('   Public:', existingBucket.public)
      console.log('   Created:', existingBucket.created_at)
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('culture-icons', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp'
      ]
    })

    if (error) {
      throw error
    }

    console.log('✅ Successfully created bucket "culture-icons"')
    console.log('   Public: true')
    console.log('   File size limit: 2MB')
    console.log('   Allowed types: PNG, JPEG, JPG, SVG, WEBP\n')
    console.log('📝 Next step: Run the SQL policies in setup-culture-icons-storage.sql')

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message)
    console.error('\n💡 Alternative: Create the bucket manually in Supabase Dashboard:')
    console.error('   1. Go to Storage in your Supabase project')
    console.error('   2. Click "Create a new bucket"')
    console.error('   3. Name: culture-icons')
    console.error('   4. Public: Yes')
    console.error('   5. File size limit: 2097152 (2MB)')
    console.error('   6. Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp')
    process.exit(1)
  }
}

createCultureIconsBucket()
