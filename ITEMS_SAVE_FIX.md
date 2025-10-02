# Items Panel - Database Save Fix ✅

## Issue
When creating a new item through the full-page editor, the item was **not being saved to the database**. The item would appear temporarily in the UI but would disappear on page refresh.

## Root Cause
The `onSave` handler in the full-page editor view was only updating **local state** without actually calling the database save function.

### Before (BROKEN)
```typescript
// Full-page view - Line 3250
<ItemEditorDialog
  ...
  onSave={async (savedItem) => {
    // ❌ Only updates local state - NO DATABASE SAVE!
    if (isCreating) {
      setItems(prev => [savedItem as Item, ...prev])
    } else {
      setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem as Item : i))
    }
    resetForm()
    onItemsChange?.()
  }}
  ...
/>
```

**Problem**: 
- Local state was updated immediately (optimistic update)
- But no database INSERT/UPDATE was happening
- Item disappeared on page refresh because it was never persisted

## Solution
Use the existing `handleSaveItem` function which properly saves to the database with optimistic updates and error handling.

### After (FIXED)
```typescript
// Full-page view - Line 3250
<ItemEditorDialog
  ...
  onSave={async (savedItem) => {
    // ✅ Actually saves to database
    await handleSaveItem(savedItem)
    resetForm()
  }}
  ...
/>
```

## How `handleSaveItem` Works

### For New Items (CREATE)
```typescript
// 1. Create temporary ID for optimistic UI update
const tempId = `temp_${Date.now()}`

// 2. Show item immediately in UI
setItems(prev => [optimisticItem, ...prev])

// 3. Save to database
const { data, error } = await supabase
  .from('world_elements')
  .insert({
    name: itemData.name,
    description: itemData.description,
    tags: itemData.tags,
    attributes: itemData.attributes || {},
    project_id: projectId,
    category: 'item'
  })
  .select()
  .single()

// 4. Replace temp item with real item from DB
setItems(prev => prev.map(item => 
  item.id === tempId ? (data as Item) : item
))
```

### For Existing Items (UPDATE)
```typescript
// 1. Optimistic update in UI
setItems(prev => prev.map(item => 
  item.id === itemData.id ? optimisticItem : item
))

// 2. Update in database
const { data, error } = await supabase
  .from('world_elements')
  .update({
    name: itemData.name,
    description: itemData.description,
    tags: itemData.tags,
    attributes: itemData.attributes
  })
  .eq('id', itemData.id)
  .select()
  .single()

// 3. Update with server response
setItems(prev => prev.map(item => 
  item.id === itemData.id ? (data as Item) : item
))
```

## Benefits of This Approach

### ✅ Optimistic Updates
- Item appears instantly in UI
- Users don't wait for database round-trip
- Smooth, responsive experience

### ✅ Error Handling
- If database save fails, local state is rolled back
- User sees error message
- Data consistency maintained

### ✅ Database Persistence
- Items are actually saved to `world_elements` table
- Persists across page refreshes
- Proper timestamps from Supabase

### ✅ Code Reuse
- Same `handleSaveItem` function used for:
  - Full-page editor
  - Modal editor
  - Quick edits
- Single source of truth for save logic

## Comparison with Modal Editor

### Modal Editor (Already Working)
```typescript
// Line 3479 - Modal uses handleSaveItem correctly
<ItemEditorDialog
  open={editorOpen}
  onOpenChange={setEditorOpen}
  initial={editing}
  onSave={handleSaveItem}  // ✅ Direct reference
  ...
/>
```

### Full-Page Editor (Now Fixed)
```typescript
// Line 3243 - Now also uses handleSaveItem
<ItemEditorDialog
  open={true}
  initial={editing}
  onSave={async (savedItem) => {
    await handleSaveItem(savedItem)  // ✅ Calls the function
    resetForm()
  }}
  inline={true}
  ...
/>
```

**Why the difference?**
- Modal editor can pass `handleSaveItem` directly
- Full-page editor needs to wrap it because:
  1. We call `resetForm()` after save to return to list view
  2. We don't want `onItemsChange?.()` called (already in `handleSaveItem`)

## Testing Checklist

- [x] Create new item via full-page editor → Saves to database
- [x] Item appears in list after creation
- [x] Item persists after page refresh
- [x] Edit existing item → Updates in database
- [x] Updates reflect after page refresh
- [x] Error handling works (rollback on failure)
- [ ] Test with different item attributes (images, properties, etc.)
- [ ] Test with tags
- [ ] Test with custom fields
- [ ] Test with stats

## Database Schema Reference

### `world_elements` Table
```sql
CREATE TABLE world_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  category TEXT NOT NULL,  -- 'item' for items
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Item Attributes Structure
```typescript
{
  type?: string           // e.g., 'weapon', 'armor', 'relic'
  rarity?: Rarity        // 'Common', 'Rare', 'Legendary', etc.
  value?: number         // Monetary value
  weight?: number        // Physical weight
  properties?: PropertyItem[]  // Special abilities
  images?: string[]      // Image URLs
  history?: string       // Backstory
  stats?: Record<string, number>  // Custom stats
  links?: LinkRef[]      // Related elements
  custom?: Record<string, any>    // Custom fields
}
```

## Related Files

### Modified
- `src/components/world-building/items-panel.tsx` - Line 3250

### Reference
- `src/components/world-building/items-panel.tsx` - Line 2564 (`handleSaveItem` function)
- `src/components/world-building/species-panel.tsx` - Reference pattern

---

**Status**: ✅ Fixed  
**Date**: October 2, 2025  
**Issue**: Items not saving to database  
**Fix**: Use `handleSaveItem` in full-page editor  
**Lines Changed**: 1 (Line 3250-3258)
