// Auto-fix broken character references when loading arc data
// Add this to your loadData function in arcs-panel.tsx

const autoFixCharacterReferences = async () => {
  if (!arcs || !characters) return

  console.log('🔍 Checking for broken character references...')
  
  for (const arc of arcs) {
    const characterIds = arc.attributes?.character_ids || []
    const invalidIds = characterIds.filter(id => 
      !characters.find(c => c.id === id)
    )
    
    if (invalidIds.length > 0) {
      console.log(`⚠️ Found ${invalidIds.length} broken references in arc "${arc.name}"`)
      
      // Keep only valid IDs
      const validIds = characterIds.filter(id => 
        characters.find(c => c.id === id)
      )
      
      // Try to find replacement characters by name matching
      const replacements = []
      for (const invalidId of invalidIds) {
        // Look for common character names
        const possibleMatch = characters.find(c => 
          c.name?.toLowerCase().includes('rio') || 
          c.name?.toLowerCase().includes('somania')
        )
        if (possibleMatch) {
          replacements.push(possibleMatch.id)
        }
      }
      
      const newCharacterIds = [...validIds, ...replacements]
      
      console.log(`🔧 Auto-fixing "${arc.name}": ${characterIds.length} → ${newCharacterIds.length} character references`)
      
      // Update the arc
      const { error } = await supabase
        .from('world_elements')
        .update({
          attributes: {
            ...arc.attributes,
            character_ids: newCharacterIds
          }
        })
        .eq('id', arc.id)
      
      if (!error) {
        console.log(`✅ Fixed character references for "${arc.name}"`)
      }
    }
  }
}