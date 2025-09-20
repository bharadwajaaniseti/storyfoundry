const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fysgzwwqzrzvgjgtdqje.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5c2d6d3dxenJ6dmdqZ3RkcWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcyNzgyNDIsImV4cCI6MjAyMjg1NDI0Mn0.TCBZ4V5v0lrJj3xhDTSPjZh8RkEr-4Qb-_5ZFYKftF8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugResearchElements() {
  try {
    console.log('Fetching all research elements...');
    
    const { data, error } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'research')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching research elements:', error);
      return;
    }

    console.log(`\nFound ${data.length} research elements:\n`);
    
    data.forEach((element, index) => {
      console.log(`${index + 1}. ID: ${element.id}`);
      console.log(`   Name: ${element.name}`);
      console.log(`   Research Type: ${element.attributes?.research_type || 'NOT SET'}`);
      console.log(`   Research File ID: ${element.attributes?.research_file_id || 'N/A'}`);
      console.log(`   Content Type: ${element.attributes?.type || 'N/A'}`);
      console.log(`   Created: ${element.created_at}`);
      console.log(`   Attributes: ${JSON.stringify(element.attributes, null, 2)}`);
      console.log('   ---');
    });

    // Group by research_type
    const files = data.filter(el => el.attributes?.research_type === 'file');
    const content = data.filter(el => el.attributes?.research_type === 'content');
    const uncategorized = data.filter(el => !el.attributes?.research_type);

    console.log(`\nSummary:`);
    console.log(`Research Files: ${files.length}`);
    console.log(`Research Content: ${content.length}`);
    console.log(`Uncategorized (PROBLEM): ${uncategorized.length}`);

    if (uncategorized.length > 0) {
      console.log(`\nUncategorized elements (these are showing in sidebar incorrectly):`);
      uncategorized.forEach(el => {
        console.log(`- ${el.name} (ID: ${el.id})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugResearchElements();