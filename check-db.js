// Simple script to check database contents
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database contents...')
  
  // Check project_chapters table
  const { data: chapters, error: chaptersError } = await supabase
    .from('project_chapters')
    .select('*')
  
  console.log('📚 Chapters in project_chapters table:', chapters?.length || 0)
  if (chapters) {
    chapters.forEach(ch => {
      console.log(`  - ${ch.title} (category: ${ch.category || 'undefined'})`)
    })
  }
  
  // Check world_elements table for any chapter-like data
  const { data: elements, error: elementsError } = await supabase
    .from('world_elements')
    .select('*')
  
  console.log('🌍 Elements in world_elements table:', elements?.length || 0)
  const elementsByCategory = elements?.reduce((acc, el) => {
    const cat = el.category || 'undefined'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  console.log('📊 Elements by category:', elementsByCategory)
  
  // Look for anything that might be a chapter in world_elements
  const possibleChapters = elements?.filter(el => 
    el.name?.toLowerCase().includes('chapter') || 
    el.category === 'chapters'
  )
  
  if (possibleChapters && possibleChapters.length > 0) {
    console.log('🚨 Found possible chapters in world_elements table:')
    possibleChapters.forEach(el => {
      console.log(`  - ${el.name} (category: ${el.category})`)
    })
  }
}

checkDatabase().catch(console.error)
