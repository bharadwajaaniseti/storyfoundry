// Run this script to create language-related storage buckets
// Usage: node create-language-storage.js

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\n💡 Make sure .env.local exists with these variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createLanguageStorageBuckets() {
  console.log('🚀 Creating language storage buckets...\n')

  const buckets = [
    {
      name: 'language-symbols',
      description: 'Storage for language writing system symbols and glyphs',
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp',
        'image/gif'
      ]
    },
    {
      name: 'language-images',
      description: 'Storage for language reference images, calligraphy samples, and charts',
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/webp',
        'image/gif'
      ]
    }
  ]

  try {
    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    for (const bucket of buckets) {
      const exists = existingBuckets.find(b => b.id === bucket.name)
      
      if (exists) {
        console.log(`ℹ️  Bucket "${bucket.name}" already exists`)
        console.log(`   Public: ${exists.public}`)
        console.log(`   Created: ${exists.created_at}\n`)
        continue
      }

      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: true,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      })

      if (error) {
        throw error
      }

      console.log(`✅ Successfully created bucket "${bucket.name}"`)
      console.log(`   ${bucket.description}`)
      console.log(`   Public: true`)
      console.log(`   File size limit: ${(bucket.fileSizeLimit / 1024 / 1024).toFixed(0)}MB`)
      console.log(`   Allowed types: ${bucket.allowedMimeTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}\n`)
    }

    console.log('📝 Next step: Run the SQL policies in setup-language-storage-policies.sql')
    console.log('   This will set up Row Level Security policies for the buckets\n')

  } catch (error) {
    console.error('❌ Error creating buckets:', error.message)
    console.error('\n💡 Alternative: Create the buckets manually in Supabase Dashboard:')
    console.error('   1. Go to Storage in your Supabase project')
    console.error('   2. Click "Create a new bucket"')
    console.error('   3. Create these buckets:')
    console.error('      - language-symbols (5MB limit, images only)')
    console.error('      - language-images (10MB limit, images only)')
    console.error('   4. Set both as Public')
    console.error('   5. Then run the SQL policies file')
    process.exit(1)
  }
}

createLanguageStorageBuckets()
