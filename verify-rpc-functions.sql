-- Verify RPC function exists and check its signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('save_screenplay_elements', 'create_screenplay_revision');

-- Test the save_screenplay_elements function with sample data
-- You can run this manually in Supabase SQL Editor
/*
SELECT save_screenplay_elements(
    'YOUR_PROJECT_ID_HERE'::uuid,
    '[
        {
            "type": "scene_heading",
            "content": "INT. COFFEE SHOP - DAY",
            "characterName": null,
            "metadata": {},
            "sortOrder": 0
        },
        {
            "type": "action",
            "content": "A busy coffee shop bustles with activity.",
            "characterName": null,
            "metadata": {},
            "sortOrder": 1
        }
    ]'::jsonb
);
*/

-- Check if screenplay_elements table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'screenplay_elements'
ORDER BY ordinal_position;

-- Check RLS policies on screenplay_elements
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'screenplay_elements';
