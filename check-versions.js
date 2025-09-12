const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVersions() {
  const projectId = '56fe2ef2-3e48-4415-8053-39da66fa466e';
  
  console.log('\n=== CHECKING project_content_versions TABLE ===');
  const { data: versions, error } = await supabase
    .from('project_content_versions')
    .select('id, version_number, created_at, approval_status, project_id')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });
    
  if (error) {
    console.error('Error fetching versions:', error);
    return;
  }
  
  console.log('Found ' + versions.length + ' versions in project_content_versions:');
  versions.forEach((v, i) => {
    console.log((i + 1) + '. ID: ' + v.id);
    console.log('   Version: ' + v.version_number);
    console.log('   Created: ' + v.created_at);
    console.log('   Status: ' + (v.approval_status || 'not set'));
    console.log('   Project ID: ' + v.project_id);
    console.log('');
  });
  
  // Test fetching a specific version
  if (versions.length > 0) {
    const testId = versions[0].id;
    console.log('=== TESTING SPECIFIC VERSION FETCH: ' + testId + ' ===');
    
    const { data: singleVersion, error: singleError } = await supabase
      .from('project_content_versions')
      .select('id, content, version_number, project_id')
      .eq('id', testId)
      .eq('project_id', projectId)
      .single();
      
    if (singleError) {
      console.error('Error fetching single version:', singleError);
    } else {
      console.log('Successfully fetched version:', singleVersion.id);
      console.log('Content length:', singleVersion.content?.length || 0);
      console.log('Project ID matches:', singleVersion.project_id === projectId);
    }
  }
}

checkVersions().catch(console.error);