// Add this to your arc creation/editing logic
// This will automatically validate character references when arcs are saved

export const validateCharacterReferences = async (supabase, projectId, characterIds) => {
  // Check if all character IDs exist
  const { data: existingCharacters } = await supabase
    .from('world_elements')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('category', 'characters')
    .in('id', characterIds)
  
  const existingIds = existingCharacters?.map(c => c.id) || []
  const invalidIds = characterIds.filter(id => !existingIds.includes(id))
  
  if (invalidIds.length > 0) {
    console.warn('⚠️ Invalid character references found:', invalidIds)
    
    // Try to find characters by name match
    const validIds = existingIds
    
    return {
      isValid: false,
      validIds,
      invalidIds,
      suggestion: `Found ${invalidIds.length} invalid character references. Using ${validIds.length} valid references.`
    }
  }
  
  return { isValid: true, validIds: characterIds, invalidIds: [] }
}

// Usage in your arc save function:
const validateAndSaveArc = async (arcData) => {
  const validation = await validateCharacterReferences(
    supabase, 
    projectId, 
    arcData.attributes.character_ids
  )
  
  if (!validation.isValid) {
    // Auto-fix by using only valid references
    arcData.attributes.character_ids = validation.validIds
    console.log('🔧 Auto-fixed character references:', validation.suggestion)
  }
  
  // Save the arc
  return await supabase.from('world_elements').insert(arcData)
}