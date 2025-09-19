// Debug annotation saving issues
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAnnotationSaving() {
  try {
    console.log('🔍 Debugging annotation saving...\n');
    
    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication issue:', authError?.message || 'No user logged in');
      console.log('🔑 Note: This script can\'t access browser session, but check if you\'re logged in the app');
    } else {
      console.log(`✅ Authenticated as: ${user.email}`);
    }
    
    // Check all world_elements to see what exists
    const { data: allElements, error: allError } = await supabase
      .from('world_elements')
      .select('id, name, category, project_id, attributes, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (allError) {
      console.log('❌ Error fetching world_elements:', allError.message);
      return;
    }
    
    console.log(`📋 Found ${allElements.length} world_elements:\n`);
    
    allElements.forEach(el => {
      console.log(`🗂️  ${el.name} (${el.category})`);
      console.log(`   ID: ${el.id}`);
      console.log(`   Project: ${el.project_id}`);
      
      if (el.category === 'maps') {
        console.log(`   🗺️  MAP FOUND!`);
        if (el.attributes) {
          if (el.attributes.annotations && el.attributes.annotations.length > 0) {
            console.log(`   📌 Has ${el.attributes.annotations.length} annotations:`);
            el.attributes.annotations.forEach((ann, i) => {
              console.log(`      ${i+1}. ${ann.type}: ${ann.label || ann.text || ann.measurementType || 'unlabeled'}`);
            });
          } else {
            console.log(`   📌 No annotations found in attributes`);
          }
          
          if (el.attributes.viewport) {
            console.log(`   👁️  Has viewport data`);
          }
        } else {
          console.log(`   📌 No attributes field`);
        }
      }
      console.log('');
    });
    
    // Check for any maps specifically
    const { data: maps, error: mapsError } = await supabase
      .from('world_elements')
      .select('*')
      .eq('category', 'maps');
    
    if (mapsError) {
      console.log('❌ Error fetching maps:', mapsError.message);
    } else {
      console.log(`🗺️  Total maps found: ${maps.length}`);
      
      if (maps.length > 0) {
        const latestMap = maps[0];
        console.log('\n🔍 Latest map details:');
        console.log('   Name:', latestMap.name);
        console.log('   ID:', latestMap.id);
        console.log('   Attributes:', JSON.stringify(latestMap.attributes, null, 2));
      }
    }
    
    // Check dedicated annotation tables
    console.log('\n🗃️  Checking dedicated annotation tables:\n');
    
    const tables = ['map_pins', 'map_labels', 'map_zones', 'map_measurements'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`📊 ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAnnotationSaving();