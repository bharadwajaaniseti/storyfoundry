# Religions Panel - Sidebar Update Events ✅ IMPLEMENTED

## Custom Events Dispatched

The Religions panel dispatches specific custom events that the sidebar listens to for automatic updates.

### 1. **religionCreated** ✅
Dispatched when a new religion is created.

```typescript
window.dispatchEvent(new CustomEvent('religionCreated', {
  detail: { religion: data, projectId }
}))
```

**Triggers:**
- Creating a new religion via the form
- Duplicating an existing religion

**Event Detail:**
- `religion`: The newly created religion object
- `projectId`: The current project ID

**Sidebar Handler:** ✅ Active
```typescript
const handleReligionCreated = (e: CustomEvent) => {
  if (e.detail?.projectId !== params.id) return
  const religion = e.detail?.religion
  if (religion) {
    setWorldElements(prev => {
      const exists = prev.some(el => el.id === religion.id)
      if (exists) return prev
      return [...prev, religion]
    })
  }
}
```

---

### 2. **religionUpdated** ✅
Dispatched when an existing religion is updated.

```typescript
window.dispatchEvent(new CustomEvent('religionUpdated', {
  detail: { religion: data, projectId }
}))
```

**Triggers:**
- Saving changes to an existing religion

**Event Detail:**
- `religion`: The updated religion object
- `projectId`: The current project ID

**Sidebar Handler:** ✅ Active
```typescript
const handleReligionUpdated = (e: CustomEvent) => {
  if (e.detail?.projectId !== params.id) return
  const religion = e.detail?.religion
  if (religion) {
    setWorldElements(prev => {
      return prev.map(el => el.id === religion.id ? religion : el)
    })
  }
}
```

---

### 3. **religionDeleted** ✅
Dispatched when a religion is deleted (hard or soft delete).

```typescript
window.dispatchEvent(new CustomEvent('religionDeleted', {
  detail: { religionId: deletedReligion.id, projectId }
}))
```

**Triggers:**
- Hard delete (permanent removal from database)
- Soft delete (setting `__deleted` flag)

**Event Detail:**
- `religionId`: The ID of the deleted religion
- `projectId`: The current project ID

**Sidebar Handler:** ✅ Active
```typescript
const handleReligionDeleted = (e: CustomEvent) => {
  if (e.detail?.projectId !== params.id) return
  const religionId = e.detail?.religionId
  if (religionId) {
    setWorldElements(prev => {
      return prev.filter(el => el.id !== religionId)
    })
  }
}
```

---

## ✅ Sidebar Integration Complete

The main page (`src/app/novels/[id]/page.tsx`) now listens to all three events:

```typescript
window.addEventListener('religionCreated', handleReligionCreated as EventListener)
window.addEventListener('religionUpdated', handleReligionUpdated as EventListener)
window.addEventListener('religionDeleted', handleReligionDeleted as EventListener)
```

### What This Means:

✅ **Create Religion** → Sidebar updates instantly (count increases)
✅ **Update Religion** → Sidebar reflects changes immediately  
✅ **Delete Religion** → Sidebar count decreases without page refresh
✅ **Duplicate Religion** → Sidebar count increases (uses create event)

---

## Delete Error Troubleshooting

### Error: `Error in confirmDelete: {}`

This empty error object typically indicates one of these issues:

#### 1. **Row Level Security (RLS) Policy Issue**
The most common cause. Check your RLS policies:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'world_elements';

-- Ensure delete policy exists
CREATE POLICY "Users can delete their own world elements"
ON world_elements
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM projects 
    WHERE id = world_elements.project_id
  )
);
```

#### 2. **Foreign Key Constraint**
If the religion is referenced by other tables:

```sql
-- Check for foreign key constraints
SELECT
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'world_elements';
```

#### 3. **Network/Connection Issue**
The Supabase client might not be properly authenticated.

### Enhanced Error Logging

The delete function now logs detailed error information:

```typescript
console.error('Delete error details:', {
  error,
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code
})
```

Check your browser console for:
- `message`: Human-readable error message
- `details`: Technical details about what went wrong
- `hint`: Suggested fix from PostgreSQL
- `code`: PostgreSQL error code

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `42501` | Insufficient privilege | Check RLS policies |
| `23503` | Foreign key violation | Delete or update related records first |
| `23505` | Unique constraint violation | Handle duplicate values |
| `P0001` | Custom policy violation | Review your RLS policy logic |

---

## Testing Events

To test if events are being dispatched:

```typescript
// Add to browser console
window.addEventListener('religionCreated', (e) => console.log('Created:', e.detail))
window.addEventListener('religionUpdated', (e) => console.log('Updated:', e.detail))
window.addEventListener('religionDeleted', (e) => console.log('Deleted:', e.detail))
```

---

**Date:** October 3, 2025
**Status:** ✅ Events implemented and documented
