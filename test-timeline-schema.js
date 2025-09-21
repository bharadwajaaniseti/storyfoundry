const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('=== Testing timeline event insertion with correct schema ===');
    
    const testEvent = {
      title: 'Test Event',
      description: 'Test description',
      date: '2025-01-01',
      event_type: 'story',
      importance: 'medium',
      project_id: '6463f622-6e12-4cd2-a9c6-063ab25acf9f'
      // Removed timeline_id and category as they may not exist
    };
    
    console.log('Attempting to insert with basic schema:', testEvent);
    
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

    console.log('\n=== Testing insert with timeline_id ===');
    
    const testEventWithTimeline = {
      title: 'Test Event with Timeline',
      description: 'Test description',
      date: '2025-01-01',
      event_type: 'story',
      importance: 'medium',
      project_id: '6463f622-6e12-4cd2-a9c6-063ab25acf9f',
      timeline_id: '381f21bc-b4ab-4829-a8e2-27c4b4032636'
    };
    
    console.log('Attempting to insert with timeline_id:', testEventWithTimeline);
    
    const { data: timelineResult, error: timelineError } = await supabase
      .from('timeline_events')
      .insert(testEventWithTimeline)
      .select();
    
    if (timelineError) {
      console.log('Timeline insert error:', timelineError);
      console.log('Error code:', timelineError.code);
      console.log('Error details:', timelineError.details);
      console.log('Error message:', timelineError.message);
    } else {
      console.log('Timeline insert successful:', timelineResult);
      
      // Clean up test data
      if (timelineResult && timelineResult[0]) {
        await supabase
          .from('timeline_events')
          .delete()
          .eq('id', timelineResult[0].id);
        console.log('Timeline test data cleaned up');
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
})();