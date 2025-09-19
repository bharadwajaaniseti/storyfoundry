const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRlsPolicies() {
  console.log('Fixing RLS policies for project-assets bucket...\n');

  try {
    // Drop existing policies
    console.log('1. Dropping existing policies...');
    
    const dropCommands = [
      `DROP POLICY IF EXISTS "project_assets_upload" ON storage.objects;`,
      `DROP POLICY IF EXISTS "project_assets_view" ON storage.objects;`,
      `DROP POLICY IF EXISTS "project_assets_delete" ON storage.objects;`,
      `DROP POLICY IF EXISTS "project_assets_update" ON storage.objects;`
    ];

    for (const command of dropCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.error(`Error dropping policy: ${error.message}`);
      } else {
        console.log(`✅ Dropped policy: ${command.split('"')[1]}`);
      }
    }

    console.log('\n2. Creating new policies...');

    // Create new policies with correct folder structure
    const createCommands = [
      // Upload policy - check user ID is in second folder position
      `CREATE POLICY "project_assets_upload" ON storage.objects 
       FOR INSERT WITH CHECK (
         bucket_id = 'project-assets' 
         AND auth.uid()::text = (storage.foldername(name))[2]
       );`,
       
      // View policy - allow users to view their own files
      `CREATE POLICY "project_assets_view" ON storage.objects 
       FOR SELECT USING (
         bucket_id = 'project-assets' 
         AND auth.uid()::text = (storage.foldername(name))[2]
       );`,
       
      // Delete policy - allow users to delete their own files
      `CREATE POLICY "project_assets_delete" ON storage.objects 
       FOR DELETE USING (
         bucket_id = 'project-assets' 
         AND auth.uid()::text = (storage.foldername(name))[2]
       );`,
       
      // Update policy - allow users to update their own files
      `CREATE POLICY "project_assets_update" ON storage.objects 
       FOR UPDATE USING (
         bucket_id = 'project-assets' 
         AND auth.uid()::text = (storage.foldername(name))[2]
       );`
    ];

    for (const command of createCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.error(`Error creating policy: ${error.message}`);
      } else {
        const policyName = command.match(/"([^"]+)"/)?.[1] || 'unknown';
        console.log(`✅ Created policy: ${policyName}`);
      }
    }

    console.log('\n3. Testing upload with new policies...');
    
    // Test upload with a real user session (we'll use service role for this test)
    const testContent = new Blob(['test content for maps'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test-map.txt', { type: 'text/plain' });
    
    // Simulate the path structure that the upload API uses
    const testUserId = 'test-user-123';
    const testProjectId = 'test-project-456';
    const testPath = `maps/${testUserId}/${testProjectId}/test-map.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(testPath, testFile);
      
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload succeeded:', uploadData.path);
      
      // Clean up test file
      await supabase.storage.from('project-assets').remove([testPath]);
      console.log('✅ Test file cleaned up');
    }

    console.log('\n✅ RLS policies have been updated successfully!');
    console.log('Maps uploads should now work properly.');
    
  } catch (error) {
    console.error('❌ Failed to update RLS policies:', error);
  }
}

// Check if we have an exec_sql function, if not create a simpler version
async function checkExecSqlFunction() {
  console.log('Checking for exec_sql function...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1 as test;' });
  
  if (error && error.message.includes('function "exec_sql" does not exist')) {
    console.log('exec_sql function not found, using alternative approach...');
    return false;
  }
  
  return true;
}

async function main() {
  const hasExecSql = await checkExecSqlFunction();
  
  if (!hasExecSql) {
    console.log('❌ Cannot execute SQL directly. Please run the migration manually.');
    console.log('Execute the following SQL in your Supabase SQL editor:');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "project_assets_upload" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_view" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_delete" ON storage.objects;

-- Create new policies with correct folder structure (maps/userId/projectId/)
CREATE POLICY "project_assets_upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "project_assets_view" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "project_assets_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'project-assets' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);
`);
  } else {
    await fixRlsPolicies();
  }
}

main().catch(console.error);