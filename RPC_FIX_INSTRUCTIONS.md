# RPC Function Fix - Add SET search_path

## The Problem
The RPC functions `save_screenplay_elements` and `create_screenplay_revision` were failing with empty error objects because they're missing the `SET search_path = public` clause.

This is a **common security issue** with `SECURITY DEFINER` functions in PostgreSQL/Supabase. Without an explicit `search_path`, the function may not be able to access the tables correctly.

## The Solution

I've created `fix-rpc-search-path.sql` which recreates both RPC functions with the proper `SET search_path = public` clause.

## Steps to Apply the Fix

### 1. Run the Fix in Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on **SQL Editor**
3. Open the file `fix-rpc-search-path.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

You should see:
```
Success. No rows returned
```

### 2. Test the RPC Function

After applying the fix, test it manually in the SQL Editor:

1. First, get a project ID you own:
```sql
SELECT id, title FROM projects 
WHERE owner_id = auth.uid() 
  AND format = 'screenplay' 
LIMIT 1;
```

2. Then test the RPC function (replace `YOUR_PROJECT_ID`):
```sql
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
            "content": "This is a test.",
            "characterName": null,
            "metadata": {},
            "sortOrder": 1
        }
    ]'::jsonb
);
```

Expected result:
```json
{
  "success": true,
  "message": "Screenplay elements saved successfully"
}
```

3. Verify the data was inserted:
```sql
SELECT * FROM screenplay_elements 
WHERE project_id = 'YOUR_PROJECT_ID'::uuid 
ORDER BY sort_order;
```

### 3. Test in the Frontend

After confirming the RPC works in SQL:

1. Open your screenplay project in the app
2. Open the browser console (F12 > Console)
3. Try saving the screenplay
4. Look for the enhanced log messages:
   - "Saving screenplay elements:" (shows data being sent)
   - "Saved to screenplay_elements successfully:" (success!)

### 4. Clean Up Test Data (Optional)

If you want to remove the test data:
```sql
DELETE FROM screenplay_elements 
WHERE project_id = 'YOUR_PROJECT_ID'::uuid;
```

## What This Fix Does

The `SET search_path = public` clause ensures that:
- The function can properly access tables in the `public` schema
- The function executes with the correct security context
- RLS policies are properly evaluated
- The function has the necessary permissions to insert/delete/update data

## Why Was This Needed?

When you create a `SECURITY DEFINER` function without `SET search_path`, PostgreSQL uses the search path of the role that created the function, which may not include the `public` schema or may have it in the wrong position. This causes the function to fail silently or return empty errors.

By explicitly setting `search_path = public`, we ensure the function always looks in the correct schema for tables, regardless of who calls it or what their default search path is.

## Next Steps

After applying this fix:
1. ✅ Test the RPC function in SQL Editor
2. ✅ Test saving in the frontend
3. ✅ Verify data appears in `screenplay_elements` table
4. 🎉 Enjoy your working screenplay editor with structured database storage!
