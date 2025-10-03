// Run this script to create the religion-images storage bucket
// Usage: node create-religion-images-bucket.js

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

async function createReligionImagesBucket() {
  console.log('🚀 Creating religion-images storage bucket...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const existingBucket = buckets.find(b => b.id === 'religion-images')
    
    if (existingBucket) {
      console.log('ℹ️  Bucket "religion-images" already exists')
      console.log('   Public:', existingBucket.public)
      console.log('   Created:', existingBucket.created_at)
      return
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('religion-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    })

    if (error) {
      throw error
    }

    console.log('✅ Successfully created bucket "religion-images"')
    console.log('   Public: true')
    console.log('   File size limit: 10MB')
    console.log('   Allowed types: PNG, JPEG, JPG, GIF, WEBP, SVG\n')

    // Set up RLS policies
    console.log('📝 Setting up RLS policies...')
    
    // Policy 1: Allow authenticated users to upload
    const { error: uploadPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'religion-images',
      policy_name: 'Allow authenticated uploads',
      definition: `(bucket_id = 'religion-images' AND auth.role() = 'authenticated')`
    }).catch(() => {
      // RPC might not exist, we'll create policies manually via SQL
      console.log('   Note: Run the SQL policies manually if needed')
    })

    console.log('✅ Bucket is ready to use!')
    console.log('\n📝 Next steps:')
    console.log('   1. Bucket created at: religion-images')
    console.log('   2. Access pattern: {project}/storage/v1/object/public/religion-images/{filename}')
    console.log('   3. Update your code to use supabase.storage.from("religion-images")')

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message)
    console.error('\n💡 Alternative: Create the bucket manually in Supabase Dashboard:')
    console.error('   1. Go to Storage in your Supabase project')
    console.error('   2. Click "Create a new bucket"')
    console.error('   3. Name: religion-images')
    console.error('   4. Public: Yes')
    console.error('   5. File size limit: 10485760 (10MB)')
    console.error('   6. Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml')
    console.error('\n   Then run this SQL for RLS policies:')
    console.error(`
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'religion-images');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'religion-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'religion-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'religion-images');
    `)
    process.exit(1)
  }
}

createReligionImagesBucket()
