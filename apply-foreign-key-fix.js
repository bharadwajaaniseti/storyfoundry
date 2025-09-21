const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('=== Applying foreign key fix ===');
    
    const sqlScript = fs.readFileSync('fix-timeline-foreign-key.sql', 'utf8');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('sql', { query: sqlScript });
    
    if (error) {
      console.error('Error executing SQL script:', error);
    } else {
      console.log('SQL script executed successfully');
      console.log('Result:', data);
    }

    console.log('\n=== Testing timeline event creation after fix ===');
    
    const testEvent = {
      title: 'Test Event After Fix',
      description: 'Test description',
      date: '2025-01-01',
      start_date: '2025-01-01',
      end_date: '2025-01-01',
      event_type: 'story',
      importance: 'medium',
      lane: 'plot',
      participants: [],
      location: '',
      consequences: '',
      tags: [],
      attributes: {},
      project_id: '6463f622-6e12-4cd2-a9c6-063ab25acf9f',
      timeline_id: '381f21bc-b4ab-4829-a8e2-27c4b4032636'
    };
    
    console.log('Attempting to insert test event:', testEvent);
    
    const { data: testResult, error: testError } = await supabase
      .from('timeline_events')
      .insert(testEvent)
      .select();
    
    if (testError) {
      console.log('Test insert error:', testError);
      console.log('Error code:', testError.code);
      console.log('Error details:', testError.details);
      console.log('Error message:', testError.message);
    } else {
      console.log('Test insert successful!');
      console.log('Created event:', testResult);
      
      // Clean up test data
      if (testResult && testResult[0]) {
        await supabase
          .from('timeline_events')
          .delete()
          .eq('id', testResult[0].id);
        console.log('Test data cleaned up');
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
})();