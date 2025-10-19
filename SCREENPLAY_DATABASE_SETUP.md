# Screenplay Database Setup Guide

## Overview

The screenplay editor currently uses a simple JSON storage approach via `project_content` table. This document explains the current implementation and provides migration instructions for the enhanced screenplay-specific database schema.

---

## Current Implementation

### How Saving Works Now

**File:** `src/components/screenplay-editor.tsx`

```typescript
const handleSave = async () => {
  if (!permissions.canEdit) return

  setIsSaving(true)
  try {
    const supabase = createSupabaseClient()
    
    // Save screenplay content as JSON
    const { error } = await supabase
      .from('project_content')
      .upsert({
        project_id: projectId,
        content: JSON.stringify(elements), // Array of ScreenplayElement objects
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    setLastSaved(new Date())
  } catch (error) {
    console.error('Error saving screenplay:', error)
  } finally {
    setIsSaving(false)
  }
}
```

**Auto-save:** Automatically saves every 30 seconds

**Data Structure Saved:**
```json
[
  {
    "id": "abc123",
    "type": "scene_heading",
    "content": "INT. COFFEE SHOP - DAY"
  },
  {
    "id": "def456",
    "type": "action",
    "content": "John enters the coffee shop, looking around nervously."
  },
  {
    "id": "ghi789",
    "type": "character",
    "content": "JOHN"
  },
  {
    "id": "jkl012",
    "type": "dialogue",
    "content": "One coffee, please. Black."
  }
]
```

---

## Enhanced Database Schema (Recommended)

### Why Upgrade?

The current JSON approach works but has limitations:

❌ **Current Limitations:**
- No structured scene management
- Can't query by specific scenes or characters
- No revision history
- No element-level comments
- Limited collaboration features
- No scene metadata (location, time of day, etc.)

✅ **Enhanced Schema Benefits:**
- **Structured Scenes:** Individual scene records with metadata
- **Granular Elements:** Query and filter screenplay elements
- **Character Tracking:** Automatic character discovery and statistics
- **Revision History:** Industry-standard screenplay revisions (blue pages, pink pages, etc.)
- **Element Comments:** Collaboration with line-by-line feedback
- **Better Performance:** Faster queries and updates
- **Analytics:** Scene count, page count, character appearances, etc.

---

## Migration Instructions

### Step 1: Apply the Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/20251019000001_add_screenplay_support.sql`
5. Paste and run the SQL
6. Verify tables were created successfully

**Option B: Using Supabase CLI**

```bash
# Navigate to your project directory
cd "e:\Personal\My Sites\storyfoundry"

# Run the migration
supabase db push
```

---

### Step 2: Verify Tables Created

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'screenplay%'
ORDER BY table_name;
```

You should see:
- `screenplay_characters`
- `screenplay_comments`
- `screenplay_elements`
- `screenplay_revisions`
- `screenplay_scenes`

---

### Step 3: Update the Screenplay Editor (Optional)

To use the new structured tables instead of JSON, update the save function:

**Current (JSON approach):**
```typescript
const handleSave = async () => {
  const { error } = await supabase
    .from('project_content')
    .upsert({
      project_id: projectId,
      content: JSON.stringify(elements)
    })
}
```

**Enhanced (Structured approach):**
```typescript
const handleSave = async () => {
  const { data, error } = await supabase
    .rpc('save_screenplay_elements', {
      p_project_id: projectId,
      p_elements: elements
    })
}
```

---

## Database Schema Details

### Tables Created

#### 1. `screenplay_scenes`
Stores individual scenes with metadata.

**Key Fields:**
- `scene_number` - Scene number in screenplay
- `heading` - Full scene heading (e.g., "INT. COFFEE SHOP - DAY")
- `location` - Extracted location
- `int_ext` - Interior/Exterior indicator
- `time_of_day` - Day, Night, Dawn, Dusk, etc.
- `status` - draft, in_review, completed, published

#### 2. `screenplay_elements`
Stores individual screenplay elements (the actual screenplay text).

**Element Types:**
- `scene_heading` - Scene headings
- `action` - Action lines/description
- `character` - Character names
- `dialogue` - Character dialogue
- `parenthetical` - (action during dialogue)
- `transition` - CUT TO:, FADE OUT:, etc.
- `shot` - Camera shots
- `note` - Production notes

**Key Fields:**
- `element_type` - Type of element
- `content` - The actual text
- `character_name` - For dialogue elements
- `metadata` - JSONB for additional data
- `sort_order` - Order in screenplay

#### 3. `screenplay_characters`
Automatically tracks characters that appear.

**Key Fields:**
- `name` - Character name
- `role` - lead, supporting, minor, extra
- `dialogue_count` - Number of dialogue lines
- `scene_count` - Number of scenes character appears in
- `first_appearance_scene_id` - First scene reference

#### 4. `screenplay_revisions`
Industry-standard revision tracking.

**Key Fields:**
- `revision_number` - Sequential revision number
- `revision_name` - e.g., "First Draft", "Blue Revision"
- `revision_color` - Industry colors: white, blue, pink, yellow, green, goldenrod, buff, salmon, cherry
- `elements_snapshot` - Full JSONB snapshot of screenplay at revision time
- `stats` - Scene count, page count, etc.

#### 5. `screenplay_comments`
Element-level commenting for collaboration.

**Key Fields:**
- `element_id` - Reference to specific screenplay element
- `type` - note, suggestion, question, approval
- `resolved` - Track if comment has been addressed
- `parent_comment_id` - For threaded discussions

---

## Helper Functions Provided

### 1. `save_screenplay_elements(project_id, elements)`

Saves an array of screenplay elements to the database.

**Usage:**
```typescript
const { data, error } = await supabase.rpc('save_screenplay_elements', {
  p_project_id: projectId,
  p_elements: [
    {
      type: 'scene_heading',
      content: 'INT. COFFEE SHOP - DAY',
      sortOrder: 0
    },
    {
      type: 'action',
      content: 'John enters nervously.',
      sortOrder: 1
    }
  ]
})
```

### 2. `create_screenplay_revision(project_id, revision_name, color, description)`

Creates a snapshot revision of the current screenplay.

**Usage:**
```typescript
const { data, error } = await supabase.rpc('create_screenplay_revision', {
  p_project_id: projectId,
  p_revision_name: 'Blue Revision',
  p_revision_color: 'blue',
  p_description: 'Updated Act 2 based on producer notes'
})
```

---

## Security (RLS Policies)

All tables have Row Level Security enabled with policies for:

✅ **Owners** can do everything
✅ **Collaborators** (editors/writers) can read and write
✅ **Viewers** can only read (for future implementation)
✅ **Comment authors** can edit/delete their own comments

---

## Migration Path

### Option 1: Keep Current JSON Approach (Simpler)
- Continue using `project_content` table with JSON
- Apply migration but don't use new tables yet
- Good for MVP/quick development

### Option 2: Migrate to Structured Tables (Recommended)
- Apply migration
- Update `handleSave` to use `save_screenplay_elements` RPC
- Update load logic to fetch from `screenplay_elements`
- Enables advanced features like revisions, comments, character tracking

### Option 3: Hybrid Approach
- Keep JSON for backward compatibility
- Use new tables for new features (revisions, comments)
- Gradually migrate existing data

---

## Example: Loading Screenplay

### Current (JSON):
```typescript
const loadScreenplay = async () => {
  const { data } = await supabase
    .from('project_content')
    .select('content')
    .eq('project_id', projectId)
    .single()
  
  if (data) {
    setElements(JSON.parse(data.content))
  }
}
```

### Enhanced (Structured):
```typescript
const loadScreenplay = async () => {
  const { data } = await supabase
    .from('screenplay_elements')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
  
  if (data) {
    setElements(data.map(el => ({
      id: el.id,
      type: el.element_type,
      content: el.content,
      characterName: el.character_name,
      metadata: el.metadata
    })))
  }
}
```

---

## Testing the Migration

After applying the migration, test with this SQL:

```sql
-- Test insert screenplay element
INSERT INTO screenplay_elements (
  project_id,
  element_type,
  content,
  sort_order
) VALUES (
  'your-project-uuid-here',
  'scene_heading',
  'INT. TEST SCENE - DAY',
  0
);

-- Verify it was inserted
SELECT * FROM screenplay_elements WHERE project_id = 'your-project-uuid-here';

-- Test RPC function
SELECT save_screenplay_elements(
  'your-project-uuid-here'::uuid,
  '[
    {"type": "scene_heading", "content": "INT. COFFEE SHOP - DAY", "sortOrder": 0},
    {"type": "action", "content": "Test action line", "sortOrder": 1}
  ]'::jsonb
);

-- Verify elements
SELECT * FROM screenplay_elements WHERE project_id = 'your-project-uuid-here' ORDER BY sort_order;
```

---

## Next Steps

1. ✅ Apply migration in Supabase
2. ✅ Verify tables created
3. ⚠️ **Decision:** Keep JSON or migrate to structured tables?
4. If migrating: Update `handleSave` and load logic
5. Enable advanced features:
   - Scene metadata extraction
   - Character tracking
   - Revision system
   - Element-level comments

---

## Support

If you encounter issues:
1. Check Supabase logs for SQL errors
2. Verify RLS policies aren't blocking access
3. Ensure user is authenticated when testing
4. Check that `project_collaborators` table exists (for collaboration RLS)

---

## Summary

**Current State:** ✅ Working with JSON storage in `project_content`
**Migration File:** `supabase/migrations/20251019000001_add_screenplay_support.sql`
**Action Required:** Apply migration manually in Supabase SQL Editor
**Breaking Changes:** None (migration is additive, doesn't affect current functionality)
**Recommendation:** Apply migration now, migrate to structured tables when ready for advanced features
