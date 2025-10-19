-- =====================================================
-- TEST RPC FUNCTION
-- =====================================================
-- This will help diagnose the RPC insert issue

-- Step 1: Get your user ID and a project ID you own
SELECT 
    auth.uid() as current_user_id,
    p.id as project_id,
    p.title as project_title,
    p.owner_id,
    p.owner_id = auth.uid() as you_are_owner
FROM projects p
WHERE p.owner_id = auth.uid()
  AND p.format = 'screenplay'  -- Fixed: use 'format' column
LIMIT 1;

-- Step 2: Test direct INSERT (this should work if you're the owner)
-- Replace 'YOUR_PROJECT_ID' with the project_id from Step 1
/*
INSERT INTO screenplay_elements (
  project_id,
  element_type,
  content,
  character_name,
  metadata,
  sort_order
) VALUES (
  'YOUR_PROJECT_ID'::uuid,
  'action',
  'Test direct insert - this is a test.',
  null,
  '{}'::jsonb,
  999
);
*/

-- Step 3: Check if the insert worked
-- SELECT * FROM screenplay_elements WHERE sort_order = 999;

-- Step 4: Clean up test data
-- DELETE FROM screenplay_elements WHERE sort_order = 999;

-- Step 5: Test the RPC function
-- Replace 'YOUR_PROJECT_ID' with the project_id from Step 1
/*
SELECT save_screenplay_elements(
    'YOUR_PROJECT_ID'::uuid,
    '[
        {
            "type": "scene_heading",
            "content": "INT. TEST SCENE - DAY",
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
        },
        {
            "type": "character",
            "content": "JOHN",
            "characterName": "JOHN",
            "metadata": {},
            "sortOrder": 2
        },
        {
            "type": "dialogue",
            "content": "This is a test of the RPC function.",
            "characterName": "JOHN",
            "metadata": {},
            "sortOrder": 3
        }
    ]'::jsonb
);
*/

-- Step 6: Verify the RPC insert worked
-- SELECT * FROM screenplay_elements WHERE project_id = 'YOUR_PROJECT_ID'::uuid ORDER BY sort_order;

-- Step 7: Check for any errors in the RPC function
-- If the RPC returns an error, check the function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'save_screenplay_elements';

-- =====================================================
-- DEBUGGING: Check if RLS is blocking the RPC function
-- =====================================================

-- The issue might be that SECURITY DEFINER functions still 
-- respect RLS policies. We may need to grant the function
-- permission to bypass RLS for inserts.

-- Check current grants on the function
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'save_screenplay_elements';

-- =====================================================
-- POTENTIAL FIX: Grant authenticator role permission
-- =====================================================

-- If the RPC is failing due to RLS, we need to ensure the
-- function can insert as the current user. The SECURITY DEFINER
-- should handle this, but let's verify the function has proper
-- SET search_path or role settings.

-- Check if we need to modify the RPC function to SET ROLE
-- (Don't run this yet - it's for reference)
/*
CREATE OR REPLACE FUNCTION save_screenplay_elements(
  p_project_id UUID,
  p_elements JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_element JSONB;
  v_element_id UUID;
  v_result JSONB;
BEGIN
  -- Delete existing elements for this project
  DELETE FROM public.screenplay_elements 
  WHERE project_id = p_project_id;
  
  -- Insert new elements
  FOR v_element IN SELECT * FROM jsonb_array_elements(p_elements)
  LOOP
    INSERT INTO public.screenplay_elements (
      project_id,
      element_type,
      content,
      character_name,
      metadata,
      sort_order
    ) VALUES (
      p_project_id,
      v_element->>'type',
      v_element->>'content',
      v_element->>'characterName',
      COALESCE(v_element->'metadata', '{}'::jsonb),
      (v_element->>'sortOrder')::INTEGER
    ) RETURNING id INTO v_element_id;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Screenplay elements saved successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;  -- Add this to ensure proper schema access
*/
