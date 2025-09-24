// Fix Character References in Arc
// This script will find your Rio Somania character and update the arc to reference it correctly

const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase credentials here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixCharacterReferences() {
  try {
    console.log('🔍 Finding characters...')
    
    // Get all characters
    const { data: characters, error: charError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'characters')
    
    if (charError) throw charError
    
    console.log('📝 Available characters:')
    characters.forEach(char => {
      console.log(`  - ${char.name} (ID: ${char.id})`)
    })
    
    // Find Rio Somania
    const rioCharacter = characters.find(c => 
      c.name?.toLowerCase().includes('rio') || 
      c.name?.toLowerCase().includes('somania')
    )
    
    if (!rioCharacter) {
      console.log('❌ Could not find Rio Somania character')
      return
    }
    
    console.log(`✅ Found Rio Somania: ${rioCharacter.name} (ID: ${rioCharacter.id})`)
    
    // Get the Entry Arc
    const { data: arcs, error: arcError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'arcs')
      .eq('name', 'Entry Arc')
    
    if (arcError) throw arcError
    
    if (arcs.length === 0) {
      console.log('❌ Could not find Entry Arc')
      return
    }
    
    const entryArc = arcs[0]
    console.log(`🎯 Found Entry Arc: ${entryArc.name} (ID: ${entryArc.id})`)
    console.log(`🔍 Current character_ids:`, entryArc.attributes?.character_ids)
    
    // Update the arc to reference the correct character
    const updatedAttributes = {
      ...entryArc.attributes,
      character_ids: [rioCharacter.id]
    }
    
    const { error: updateError } = await supabase
      .from('world_elements')
      .update({ attributes: updatedAttributes })
      .eq('id', entryArc.id)
    
    if (updateError) throw updateError
    
    console.log('✅ Successfully updated Entry Arc character reference!')
    console.log(`🎉 Entry Arc now references: ${rioCharacter.name} (${rioCharacter.id})`)
    
  } catch (error) {
    console.error('❌ Error fixing character references:', error)
  }
}

fixCharacterReferences()