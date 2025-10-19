# Screenplay Public Access Fix

## Issue
When viewing a screenplay from a reader account (non-owner), the screenplay content was not showing up even though the project was set to public or preview visibility. The title and logline displayed correctly, but the screenplay elements (scenes, dialogue, etc.) were blocked by Row Level Security (RLS) policies.

## Root Cause
The RLS policies on `screenplay_elements` and related tables only allowed access to:
- Project owners (`p.owner_id = auth.uid()`)
- Active collaborators

They did **not** check the project's `visibility` setting, so even when a project was set to `public` or `preview`, readers couldn't access the screenplay content.

## Solution
Updated the RLS policies to allow public read access when `project.visibility IN ('public', 'preview')`.

## Tables Updated
1. `screenplay_elements` - Main screenplay content
2. `screenplay_scenes` - Scene metadata
3. `screenplay_characters` - Character data
4. `screenplay_revisions` - Version history
5. `screenplay_comments` - Comments and notes

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy and paste the SQL from `supabase/migrations/20250129000000_fix_screenplay_elements_public_access.sql`
6. Click **Run**

### Option 2: Supabase CLI
```bash
supabase db push
```

## Verification
After applying the migration:

1. **As Owner**: Create or open a screenplay project
2. **Set Visibility**: Change project visibility to "Public" or "Preview"
3. **As Reader**: Sign in with a different account
4. **View Screenplay**: Navigate to the screenplay viewer (`/screenplays/[id]/read`)
5. **Verify**: Screenplay content should now be visible

## New Policy Logic
```sql
-- Anyone can SELECT if:
WHERE (
  -- 1. They own the project
  p.owner_id = auth.uid()
  -- 2. OR they are an active collaborator
  OR EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE user_id = auth.uid() AND status = 'active'
  )
  -- 3. OR the project is public/preview (NEW!)
  OR p.visibility IN ('public', 'preview')
)
```

## Files Modified
- ✅ Created: `supabase/migrations/20250129000000_fix_screenplay_elements_public_access.sql`
- ✅ Created: `apply-screenplay-public-access-fix.js` (helper script)
- ✅ Created: `SCREENPLAY_PUBLIC_ACCESS_FIX.md` (this file)

## Testing Checklist
- [ ] Apply migration via Supabase Dashboard
- [ ] Create test screenplay project
- [ ] Set project visibility to "Public"
- [ ] Sign in as different user (reader)
- [ ] Navigate to `/screenplays/[id]/read`
- [ ] Verify screenplay content displays
- [ ] Verify statistics show correct counts
- [ ] Verify "Edit Screenplay" button only shows for owners

## Related Files
- **Viewer**: `src/app/screenplays/[id]/read/page.tsx` - Screenplay viewer page
- **Editor**: `src/app/screenplays/[id]/edit/page.tsx` - Screenplay editor page
- **Schema**: `supabase/migrations/20251019000001_add_screenplay_support.sql` - Original screenplay tables

## Notes
- The migration uses `DROP POLICY IF EXISTS` so it's safe to run multiple times
- Only **SELECT** policies are updated - INSERT/UPDATE/DELETE still require ownership/collaboration
- Public users can **view** but not **edit** screenplay content
- Comments are viewable but not creatable by public users
