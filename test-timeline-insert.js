const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('=== Executing raw SQL to check foreign key constraints ===');
    
    // Use direct SQL execution through Supabase SQL function (if available)
    // Otherwise, we'll manually query what we can
    
    console.log('\n=== Checking timeline_events table columns ===');
    const { data: tableInfo, error: tableError } = await supabase
      .from('timeline_events')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('Timeline events table structure error:', tableError);
    } else {
      console.log('Timeline events table accessible, sample data keys:', tableInfo[0] ? Object.keys(tableInfo[0]) : 'No data');
    }

    console.log('\n=== Attempting to create a test timeline event ===');
    const testEvent = {
      title: 'Test Event',
      description: 'Test description',
      date: '2025-01-01',
      timeline_id: '381f21bc-b4ab-4829-a8e2-27c4b4032636',
      project_id: '6463f622-6e12-4cd2-a9c6-063ab25acf9f',
      category: 'plot'
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('timeline_events')
      .insert(testEvent)
      .select();
    
    if (testError) {
      console.log('Test insert error:', testError);
      console.log('Error code:', testError.code);
      console.log('Error details:', testError.details);
      console.log('Error hint:', testError.hint);
    } else {
      console.log('Test insert successful:', testResult);
      
      // Clean up test data
      if (testResult && testResult[0]) {
        await supabase
          .from('timeline_events')
          .delete()
          .eq('id', testResult[0].id);
        console.log('Test data cleaned up');
      }
    }

    console.log('\n=== Checking world_elements timeline exists ===');
    const { data: timelineCheck, error: timelineCheckError } = await supabase
      .from('world_elements')
      .select('id, name, category, project_id')
      .eq('id', '381f21bc-b4ab-4829-a8e2-27c4b4032636');
    
    if (timelineCheckError) {
      console.log('Timeline check error:', timelineCheckError);
    } else {
      console.log('Timeline exists in world_elements:', timelineCheck);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
})();