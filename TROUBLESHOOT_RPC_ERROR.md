# Troubleshooting RPC Error - save_screenplay_elements

## Current Issue
The `save_screenplay_elements` RPC function is returning an empty error object `{}` when called from the frontend.

## Enhanced Debugging (Added to Code)
The save function now includes detailed logging:
- Project ID
- Element count
- Sample element structure
- Full error details with JSON.stringify
- Fallback success/failure messages

## Potential Causes & Solutions

### 1. Authentication Issue (Most Likely)
**Symptoms:** Empty error object, RPC fails silently
**Cause:** User not authenticated or session expired

**Test:**
```typescript
// Add this before the RPC call in screenplay-editor.tsx
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
if (!user) {
  console.error('User not authenticated!')
}
```

**Solution:**
- Ensure user is logged in
- Check if Supabase session is valid
- Verify auth token in browser dev tools (Application > Storage > Local Storage)

### 2. RLS Policy Blocking Insert
**Symptoms:** Empty error, data doesn't save
**Cause:** RLS policies on `screenplay_elements` blocking the insert

**Test in Supabase SQL Editor:**
```sql
-- Check if you can insert directly
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
  'Test content',
  null,
  '{}'::jsonb,
  0
);
```

**Solution:**
If this fails, check RLS policies:
```sql
-- Verify you have insert permission
SELECT EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = 'YOUR_PROJECT_ID'::uuid
  AND (
    p.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = p.id
      AND pc.user_id = auth.uid()
      AND pc.status = 'active'
    )
  )
);
```

### 3. Project ID Format Issue
**Symptoms:** RPC fails with empty error
**Cause:** Project ID not being passed as UUID

**Test:**
```typescript
// In screenplay-editor.tsx, add before RPC call:
console.log('Project ID type:', typeof projectId)
console.log('Project ID value:', projectId)
```

**Solution:**
Ensure projectId is a valid UUID string, not undefined or malformed.

### 4. JSONB Structure Mismatch
**Symptoms:** RPC fails during LOOP
**Cause:** Elements array has unexpected structure

**Test:**
Check console output for "Saving screenplay elements" - verify the sample element has all required fields.

**Expected format:**
```json
{
  "type": "scene_heading",
  "content": "INT. COFFEE SHOP - DAY",
  "characterName": null,
  "metadata": {},
  "sortOrder": 0
}
```

### 5. Function Not Found
**Symptoms:** Error message about function not existing
**Cause:** Migration not applied or function dropped

**Test:**
```sql
-- Run in Supabase SQL Editor
SELECT proname FROM pg_proc 
WHERE proname = 'save_screenplay_elements';
```

**Solution:**
Re-apply the migration file if function doesn't exist.

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try saving the screenplay
4. Look for the enhanced log messages:
   - "Saving screenplay elements:" with project details
   - "Error details:" with full error object
   - "Falling back to project_content..." or "Saved to screenplay_elements successfully"

### Step 2: Check Network Tab
1. Open DevTools > Network tab
2. Filter by "Fetch/XHR"
3. Try saving the screenplay
4. Look for the RPC request to Supabase
5. Check the request payload and response

### Step 3: Test RPC Directly in Supabase
1. Go to Supabase Dashboard > SQL Editor
2. Run the verification script from `verify-rpc-functions.sql`
3. Then test the function manually:

```sql
-- Replace YOUR_PROJECT_ID with an actual project ID you own
SELECT save_screenplay_elements(
    'YOUR_PROJECT_ID'::uuid,
    '[
        {
            "type": "scene_heading",
            "content": "INT. TEST SCENE - DAY",
            "characterName": null,
            "metadata": {},
            "sortOrder": 0
        }
    ]'::jsonb
);
```

### Step 4: Check Authentication
```typescript
// Add to handleSave in screenplay-editor.tsx
const { data: { session } } = await supabase.auth.getSession()
console.log('Session exists:', !!session)
console.log('Session user:', session?.user?.id)
```

## Expected Outcome

### Success Logs:
```
Saving screenplay elements: { projectId: "...", elementCount: 5, sample: {...} }
Saved to screenplay_elements successfully: { success: true, message: "..." }
```

### Fallback Logs (if RPC fails):
```
Saving screenplay elements: { projectId: "...", elementCount: 5, sample: {...} }
Error saving to screenplay_elements: { ... }
Error details: { ... full error object ... }
Falling back to project_content (JSON storage)...
Saved to project_content successfully (fallback)
```

## Quick Fix Options

### Option A: Force Fallback (Temporary)
If you need to continue working, the fallback to `project_content` will work:
- Data saves as JSON in the old format
- Everything continues to work
- But you won't get the benefits of the new structured tables

### Option B: Simplify RPC Function
Create a simpler test version:
```sql
CREATE OR REPLACE FUNCTION test_save_elements(p_project_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object('success', true, 'project_id', p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Call it from frontend:
```typescript
const { data, error } = await supabase.rpc('test_save_elements', {
  p_project_id: projectId
})
console.log('Test result:', data, error)
```

## Next Steps

1. **Check the enhanced console logs** - They will show exactly what's being sent
2. **Run the verification SQL** - Confirms the function exists and works
3. **Test authentication** - Verify user is logged in
4. **Report back** with:
   - Console log output
   - Network tab request/response
   - SQL verification results
   - Authentication status

This will help identify the exact issue blocking the RPC call.
