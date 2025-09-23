const { createClient } = require('@supabase/supabase-js')

// Using your actual Supabase credentials from .env.local
const supabaseUrl = 'https://sejryxeefedjwuwhqpgu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanJ5eGVlZmVkand1d2hxcGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjI3NDgsImV4cCI6MjA3MjEzODc0OH0.nrX1V3TFkRjmDbqNuBfetVaLPKdvejYp9Ks686jIMZU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCharacters() {
  try {
    console.log('Checking database connection...')
    
    const projectId = '6463f622-6e12-4cd2-a9c6-063ab25acf9f' // From the debug info
    
    // Check project_chapters structure
    const { data: chapters, error: chapError } = await supabase
      .from('project_chapters')
      .select('*')
      .eq('project_id', projectId)
    
    if (chapError) {
      console.error('Error fetching chapters for project:', chapError)
    } else {
      console.log(`Chapters in project ${projectId}:`, chapters?.length || 0)
      if (chapters && chapters.length > 0) {
        console.log('First chapter structure:', Object.keys(chapters[0]))
        chapters.forEach((chapter, index) => {
          console.log(`- Chapter ${index + 1}: ${chapter.title} (ID: ${chapter.id})`)
        })
      }
    }
    
    // Check all world_elements for this project to see what categories exist
    const { data: allElements, error: allError } = await supabase
      .from('world_elements')
      .select('id, name, category')
      .eq('project_id', projectId)
    
    if (allError) {
      console.error('Error fetching all elements:', allError)
    } else {
      console.log(`Total world elements in project ${projectId}:`, allElements?.length || 0)
      if (allElements && allElements.length > 0) {
        const categories = [...new Set(allElements.map(el => el.category).filter(Boolean))]
        console.log('Categories found:', categories)
        
        allElements.forEach(element => {
          console.log(`- ${element.name} (Category: ${element.category}, ID: ${element.id})`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCharacters()