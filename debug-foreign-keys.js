const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Checking timeline_events table structure ===');
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'timeline_events')
    .eq('table_schema', 'public');
  
  if (columnsError) {
    console.error('Error getting columns:', columnsError);
  } else {
    console.log('Columns:', columns);
  }

  console.log('\n=== Checking foreign key constraints ===');
  const { data: constraints, error: constraintsError } = await supabase
    .from('information_schema.table_constraints')
    .select('constraint_name, constraint_type')
    .eq('table_name', 'timeline_events')
    .eq('table_schema', 'public')
    .eq('constraint_type', 'FOREIGN KEY');
  
  if (constraintsError) {
    console.error('Error getting constraints:', constraintsError);
  } else {
    console.log('Foreign key constraints:', constraints);
  }

  console.log('\n=== Checking specific foreign key details ===');
  const { data: fkDetails, error: fkError } = await supabase
    .from('information_schema.key_column_usage')
    .select('column_name, referenced_table_name, referenced_column_name')
    .eq('table_name', 'timeline_events')
    .eq('table_schema', 'public');
  
  if (fkError) {
    console.error('Error getting FK details:', fkError);
  } else {
    console.log('Foreign key details:', fkDetails);
  }

  console.log('\n=== Checking if timelines table exists ===');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', '%timeline%');
  
  if (tablesError) {
    console.error('Error getting tables:', tablesError);
  } else {
    console.log('Timeline-related tables:', tables);
  }

  console.log('\n=== Checking world_elements for timeline data ===');
  const { data: timelineElements, error: timelineError } = await supabase
    .from('world_elements')
    .select('id, name, category')
    .eq('category', 'timeline')
    .eq('project_id', '6463f622-6e12-4cd2-a9c6-063ab25acf9f');
  
  if (timelineError) {
    console.error('Error getting timeline elements:', timelineError);
  } else {
    console.log('Timeline elements in world_elements:', timelineElements);
  }

  console.log('\n=== Raw SQL to check foreign key constraint ===');
  const { data: rawFK, error: rawFKError } = await supabase.rpc('sql', {
    query: `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='timeline_events'
        AND tc.table_schema='public';
    `
  });
  
  if (rawFKError) {
    console.error('Error getting raw FK info:', rawFKError);
  } else {
    console.log('Raw foreign key info:', rawFK);
  }
})();