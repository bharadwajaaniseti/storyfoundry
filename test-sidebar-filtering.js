const { createClient } = require('@supabase/supabase-js')

// Test script to verify sidebar filtering for research elements
async function testSidebarFiltering() {
  console.log('🧪 Testing sidebar filtering for research elements...\n')
  
  // Mock the filtering logic that should be applied in the sidebar
  const mockWorldElements = [
    { id: 1, name: 'ab', category: 'research', attributes: { research_type: 'file' }, is_folder: false },
    { id: 2, name: 'Note 1', category: 'research', attributes: { research_type: 'content' }, is_folder: false },
    { id: 3, name: 'video of pubg', category: 'research', attributes: { research_type: 'content' }, is_folder: false },
    { id: 4, name: 'asdf', category: 'research', attributes: { research_type: 'content' }, is_folder: false },
    { id: 5, name: 'Character Notes', category: 'characters', attributes: {}, is_folder: false },
    { id: 6, name: 'Research Folder', category: 'research', attributes: {}, is_folder: true }
  ]
  
  console.log('📊 Mock world elements:')
  mockWorldElements.forEach(el => {
    console.log(`  - ${el.name} (${el.category}, ${el.is_folder ? 'folder' : 'element'}, research_type: ${el.attributes?.research_type || 'none'})`)
  })
  
  console.log('\n🔍 Testing filtering logic...\n')
  
  // Test the new filtering logic for research category
  const testFilteringForCategory = (categoryId) => {
    console.log(`📋 Filtering for category: ${categoryId}`)
    
    // Root elements filtering (what appears in sidebar)
    const rootElements = mockWorldElements.filter(el => {
      const matchesCategory = el.category === categoryId && !el.is_folder && !el.parent_folder_id
      if (categoryId === 'research' && el.attributes?.research_type) {
        return matchesCategory && el.attributes.research_type === 'file'
      }
      return matchesCategory
    })
    
    console.log('  Root elements that should appear in sidebar:')
    if (rootElements.length === 0) {
      console.log('    (none)')
    } else {
      rootElements.forEach(el => console.log(`    ✅ ${el.name}`))
    }
    
    // Elements that should be filtered out
    const filteredOut = mockWorldElements.filter(el => {
      const matchesCategory = el.category === categoryId && !el.is_folder && !el.parent_folder_id
      if (categoryId === 'research' && el.attributes?.research_type) {
        return matchesCategory && el.attributes.research_type !== 'file'
      }
      return false
    })
    
    console.log('  Elements filtered out (research content):')
    if (filteredOut.length === 0) {
      console.log('    (none)')
    } else {
      filteredOut.forEach(el => console.log(`    ❌ ${el.name} (research_type: ${el.attributes?.research_type})`))
    }
    console.log('')
  }
  
  // Test research category
  testFilteringForCategory('research')
  
  // Test non-research category (should not be affected)
  testFilteringForCategory('characters')
  
  console.log('✅ Expected behavior:')
  console.log('  - Only research FILES should appear in the research sidebar section')
  console.log('  - Research CONTENT items (notes, videos, images) should not appear as separate sidebar items')
  console.log('  - Non-research categories should work normally')
  console.log('  - The fix should prevent "Note 1", "video of pubg", "asdf" from cluttering the sidebar')
}

testSidebarFiltering().catch(console.error)