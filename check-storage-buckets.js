const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBuckets() {
  console.log('Checking storage buckets...\n');

  // Check if buckets exist
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
    return;
  }

  console.log('Available buckets:');
  buckets.forEach(bucket => {
    console.log(`- ${bucket.name} (id: ${bucket.id}, public: ${bucket.public})`);
  });

  // Check specifically for project-assets bucket
  const projectAssetsBucket = buckets.find(b => b.name === 'project-assets');
  
  if (projectAssetsBucket) {
    console.log('\n✅ project-assets bucket exists!');
    
    // Test creating a folder structure
    console.log('\nTesting upload permissions...');
    
    try {
      // Create a test file
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      // Try to upload to maps folder
      const testPath = `maps/test-user/test-project/test.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(testPath, testFile);
        
      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
      } else {
        console.log('✅ Upload succeeded:', uploadData.path);
        
        // Clean up test file
        await supabase.storage.from('project-assets').remove([testPath]);
        console.log('✅ Test file cleaned up');
      }
    } catch (error) {
      console.error('❌ Upload test failed:', error);
    }
  } else {
    console.log('\n❌ project-assets bucket not found!');
    
    // Try to create it
    console.log('Attempting to create project-assets bucket...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('project-assets', {
      public: false,
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/*']
    });
    
    if (createError) {
      console.error('❌ Failed to create bucket:', createError);
    } else {
      console.log('✅ Bucket created successfully:', createData);
    }
  }

  // Check storage policies
  console.log('\nChecking storage policies...');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .like('tablename', '%objects%')
    .like('policyname', '%project_assets%');
    
  if (policiesError) {
    console.error('Error checking policies:', policiesError);
  } else {
    console.log('Storage policies for project-assets:');
    policies.forEach(policy => {
      console.log(`- ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
    });
  }
}

checkBuckets().catch(console.error);