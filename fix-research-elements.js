const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fysgzwwqzrzvgjgtdqje.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for this script');
  console.log('Please set your service role key from Supabase dashboard -> Settings -> API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixResearchElements() {
  try {
    console.log('🔍 Analyzing research elements...\n');
    
    // Get all research elements
    const { data: allResearch, error: fetchError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching research elements:', fetchError);
      return;
    }

    console.log(`Found ${allResearch.length} research elements`);

    // Categorize them
    const files = allResearch.filter(el => el.attributes?.research_type === 'file');
    const content = allResearch.filter(el => el.attributes?.research_type === 'content');
    const problematic = allResearch.filter(el => !el.attributes?.research_type || el.attributes.research_type === '');

    console.log(`📁 Research Files: ${files.length}`);
    console.log(`📄 Research Content: ${content.length}`);
    console.log(`⚠️  Problematic (no research_type): ${problematic.length}\n`);

    if (problematic.length === 0) {
      console.log('✅ No problematic research elements found! Your data is clean.');
      return;
    }

    console.log('Problematic elements that are showing incorrectly in sidebar:');
    problematic.forEach((el, index) => {
      console.log(`${index + 1}. "${el.name}" (ID: ${el.id.substring(0, 8)}...)`);
      console.log(`   Created: ${new Date(el.created_at).toLocaleDateString()}`);
      console.log(`   Attributes: ${JSON.stringify(el.attributes)}`);
    });

    console.log('\n🔧 Recommended fixes:');
    console.log('1. Elements that look like content should be deleted or moved to a research file');
    console.log('2. Elements that should be research files should get research_type: "file"');
    
    // For now, let's just identify them. In a real scenario, you'd want to:
    // - Check if any of these problematic elements are referenced by other content
    // - Decide whether to delete them or fix their attributes
    // - Make the appropriate updates

    console.log('\n💡 Next steps:');
    console.log('1. Review the problematic elements listed above');
    console.log('2. Decide which ones to delete vs. which ones to fix');
    console.log('3. Run targeted UPDATE or DELETE queries in your Supabase SQL editor');
    
    // Example of what you might do (commented out for safety):
    /*
    console.log('\n🗑️  Would delete problematic elements...');
    const { error: deleteError } = await supabase
      .from('world_elements')
      .delete()
      .in('id', problematic.map(el => el.id));
    
    if (deleteError) {
      console.error('Error deleting elements:', deleteError);
    } else {
      console.log(`✅ Deleted ${problematic.length} problematic research elements`);
    }
    */

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  fixResearchElements();
}

module.exports = { fixResearchElements };