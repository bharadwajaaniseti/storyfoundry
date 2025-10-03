// Migration script: Convert system images from string[] to MediaItem[] format
// Usage: node migrate-system-images.js
// 
// This script will:
// 1. Find all systems with images in old format (string[])
// 2. Convert them to new format (MediaItem[])
// 3. Update the database
// 4. Show a summary of changes

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

/**
 * Check if images are in old format (string[])
 */
function isOldFormat(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return false
  }
  
  // If first element is a string, it's old format
  // If first element is an object with 'name' property, it's new format
  return typeof images[0] === 'string'
}

/**
 * Convert old format (string[]) to new format (MediaItem[])
 */
function migrateImagesToMediaItems(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return []
  }
  
  // Already in new format
  if (typeof images[0] === 'object' && 'name' in images[0]) {
    return images
  }
  
  // Convert old format: each string URL becomes a MediaItem with empty name
  return images.map(url => ({
    name: '',
    imageUrls: [url],
    link: undefined
  }))
}

async function migrateSystemImages() {
  console.log('🚀 Starting system images migration...\n')
  
  try {
    // Fetch all systems with images
    console.log('📊 Fetching all systems from database...')
    const { data: systems, error: fetchError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'systems')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`   Found ${systems.length} total systems\n`)
    
    // Filter systems that need migration
    const systemsToMigrate = systems.filter(system => {
      const images = system.attributes?.images
      return images && isOldFormat(images)
    })
    
    if (systemsToMigrate.length === 0) {
      console.log('✅ No systems need migration!')
      console.log('   All systems are already using the new MediaItem[] format.\n')
      return
    }
    
    console.log(`🔄 Found ${systemsToMigrate.length} systems that need migration:\n`)
    
    // Show preview
    systemsToMigrate.slice(0, 5).forEach((system, idx) => {
      console.log(`   ${idx + 1}. "${system.name}"`)
      console.log(`      Old format: ${system.attributes.images.length} image URL(s)`)
      console.log(`      → ${system.attributes.images[0].substring(0, 60)}...`)
    })
    
    if (systemsToMigrate.length > 5) {
      console.log(`   ... and ${systemsToMigrate.length - 5} more`)
    }
    
    console.log('\n⚠️  This will update these systems in the database.')
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n')
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Migrate each system
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    console.log('🔨 Migrating systems...\n')
    
    for (const system of systemsToMigrate) {
      try {
        const oldImages = system.attributes.images
        const newImages = migrateImagesToMediaItems(oldImages)
        
        // Update the system with new format
        const { error: updateError } = await supabase
          .from('world_elements')
          .update({
            attributes: {
              ...system.attributes,
              images: newImages
            }
          })
          .eq('id', system.id)
        
        if (updateError) {
          throw updateError
        }
        
        successCount++
        console.log(`   ✓ Migrated: "${system.name}" (${oldImages.length} → ${newImages.length} items)`)
        
      } catch (error) {
        errorCount++
        errors.push({ system: system.name, error: error.message })
        console.log(`   ✗ Failed: "${system.name}" - ${error.message}`)
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 Migration Summary')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${successCount} systems`)
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} systems`)
      console.log('\nErrors:')
      errors.forEach(({ system, error }) => {
        console.log(`   - ${system}: ${error}`)
      })
    }
    console.log('='.repeat(60))
    console.log('\n✨ Migration complete!\n')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

// Dry run function - shows what would be changed without modifying data
async function dryRun() {
  console.log('🔍 DRY RUN MODE - No changes will be made\n')
  
  try {
    const { data: systems, error: fetchError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'systems')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📊 Total systems: ${systems.length}`)
    
    const systemsToMigrate = systems.filter(system => {
      const images = system.attributes?.images
      return images && isOldFormat(images)
    })
    
    const alreadyMigrated = systems.filter(system => {
      const images = system.attributes?.images
      return images && !isOldFormat(images)
    })
    
    const noImages = systems.filter(system => {
      const images = system.attributes?.images
      return !images || !Array.isArray(images) || images.length === 0
    })
    
    console.log(`   ├─ Need migration: ${systemsToMigrate.length}`)
    console.log(`   ├─ Already migrated: ${alreadyMigrated.length}`)
    console.log(`   └─ No images: ${noImages.length}\n`)
    
    if (systemsToMigrate.length > 0) {
      console.log('Systems that need migration:')
      systemsToMigrate.forEach((system, idx) => {
        const oldImages = system.attributes.images
        const newImages = migrateImagesToMediaItems(oldImages)
        
        console.log(`\n${idx + 1}. "${system.name}" (ID: ${system.id})`)
        console.log(`   Old format (${oldImages.length} URLs):`)
        oldImages.slice(0, 2).forEach((url, i) => {
          console.log(`      [${i}] ${url.substring(0, 70)}...`)
        })
        if (oldImages.length > 2) {
          console.log(`      ... and ${oldImages.length - 2} more`)
        }
        
        console.log(`   New format (${newImages.length} MediaItems):`)
        newImages.slice(0, 2).forEach((item, i) => {
          console.log(`      [${i}] { name: "${item.name}", imageUrls: [${item.imageUrls.length}], link: ${item.link || 'none'} }`)
        })
        if (newImages.length > 2) {
          console.log(`      ... and ${newImages.length - 2} more`)
        }
      })
      
      console.log('\n' + '='.repeat(60))
      console.log(`To migrate these ${systemsToMigrate.length} systems, run:`)
      console.log('   node migrate-system-images.js --migrate')
      console.log('='.repeat(60) + '\n')
    } else {
      console.log('✅ All systems are already in the new format!\n')
    }
    
  } catch (error) {
    console.error('❌ Dry run failed:', error.message)
    process.exit(1)
  }
}

// Check command line arguments
const args = process.argv.slice(2)

if (args.includes('--migrate') || args.includes('-m')) {
  // Run actual migration
  migrateSystemImages()
} else if (args.includes('--help') || args.includes('-h')) {
  // Show help
  console.log(`
System Images Migration Tool
============================

This script migrates system images from the old format (string[]) 
to the new format (MediaItem[]).

Usage:
  node migrate-system-images.js              # Dry run (preview only)
  node migrate-system-images.js --migrate    # Run actual migration
  node migrate-system-images.js --help       # Show this help

Options:
  --migrate, -m    Run the actual migration (modifies database)
  --help, -h       Show this help message

Old Format:
  images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]

New Format:
  images: [
    { name: "", imageUrls: ["https://example.com/img1.jpg"], link: undefined },
    { name: "", imageUrls: ["https://example.com/img2.jpg"], link: undefined }
  ]

Note: The migration is automatic in the UI, but this script is useful for:
  - Batch migrating existing data
  - Previewing what will change
  - Database cleanup
`)
} else {
  // Default: dry run
  dryRun()
}
