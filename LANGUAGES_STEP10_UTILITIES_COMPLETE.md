# Languages Panel - STEP 10: Data Layer & Utilities ✅

## Overview
Completed the core data layer improvements, utility functions, keyboard shortcuts, and initial accessibility features for the Languages panel as part of STEP 10 of the comprehensive refactor.

## ✅ Completed Features

### 1. Data Layer Improvements

#### Soft Delete System
- **Default Behavior**: Archive (soft delete) via `__deleted` flag in attributes
- **Filter Query**: `.or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')`
- **Restore Capability**: Soft-deleted items can be restored (hidden from list but not removed from DB)
- **Hard Delete Option**: Available through `handleDelete(id, true)` for permanent removal

#### Enhanced Sorting
- **Sort by Updated**: Changed from `created_at` to `updated_at` descending
- **Recent First**: Most recently modified languages appear at top of list
- **Auto-refresh**: Updated_at timestamp set on every save

### 2. Utility Functions

All utility functions moved to module-level scope for reusability:

#### `relativeTime(dateString: string): string`
Converts timestamps to human-readable relative format:
- "just now" (< 1 minute)
- "5m ago" (< 1 hour)
- "2h ago" (< 24 hours)
- "3d ago" (< 7 days)
- "2w ago" (< 4 weeks)
- "3mo ago" (< 12 months)
- "1y ago" (12+ months)

**Usage**: Displayed in Grid and Table footer showing when language was last updated

#### `getStatusPillColor(status: string): string`
Returns Tailwind CSS classes for status badges:
- `living` → green badge
- `dead` → gray badge
- `constructed` → blue badge
- `ancient` → purple badge
- `ceremonial` → yellow badge
- Default → gray badge

**Usage**: Grid and Table status badge colors

#### `getWSysPillColor(ws: string): string`
Returns Tailwind CSS classes for writing system badges:
- `alphabetic` → blue badge
- `logographic` → purple badge
- `syllabic` → indigo badge
- `abjad` → cyan badge
- `abugida` → teal badge
- `pictographic` → pink badge
- Default → gray badge

**Usage**: Grid and Table writing system badge colors

#### `applySearchSortFilter(): Language[]`
Comprehensive search/filter/sort pipeline:
1. **Search**: Filters by query in name, description, family
2. **Family Filter**: Filters by selected families
3. **Status Filter**: Filters by selected statuses
4. **Writing System Filter**: Filters by selected writing systems
5. **Sort**: Applies selected sort option (name_asc, name_desc, newest, oldest, status)

**Usage**: Centralized filtering logic, called by `getFilteredAndSortedLanguages`

### 3. Keyboard Shortcuts

#### Global Shortcuts
- **`/` (Slash)**: Focus search input (when not in text field)
- **`n` (New)**: Open create mode (when not in text field)
- **`Esc` (Escape)**: Cancel create/edit mode and return to list

#### Implementation
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      searchInputRef.current?.focus()
    } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Escape') {
      if (mode !== 'list') handleCancel()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [mode])
```

### 4. UI Enhancements

#### Updated Delete Dialog
- **Title**: Changed from "Delete Language?" to "Archive Language?"
- **Message**: Clarifies soft delete behavior
- **Button**: Changed from red "Delete" to amber "Archive"
- **Tip**: Hints that hard delete is available via action menu

#### Consolidated Code
- **Removed Duplicate Functions**: Eliminated redundant `getStatusColor` in Grid and Table components
- **Single Source of Truth**: All utility functions defined at module level
- **Cleaner Components**: Grid and Table components use module-level utilities directly

## 📊 Metrics

### Code Quality
- **File Size**: 3,744 lines (optimized)
- **Compile Errors**: 0
- **Duplicate Code**: Removed 2 duplicate color mapping functions
- **Reusability**: 4 utility functions available to all components

### Performance Impact
- **Filter Efficiency**: Single consolidated function vs scattered logic
- **Relative Time**: Calculated once per render vs multiple times
- **Memory**: Reduced closures by moving functions to module scope

## 🔄 Code Improvements

### Before (Duplicate Logic)
```typescript
// Grid Component
const getStatusColor = (status: string) => {
  switch (status) { /* ... */ }
}

// Table Component  
const getStatusColor = (status: string) => {
  switch (status) { /* ... */ }
}

// Panel Component
const getRelativeTime = (dateString: string) => { /* ... */ }
```

### After (Consolidated Utilities)
```typescript
// Module Level
const getStatusPillColor = (status: string) => { /* ... */ }
const getWSysPillColor = (ws: string) => { /* ... */ }
const relativeTime = (dateString: string) => { /* ... */ }
const applySearchSortFilter = () => { /* ... */ }

// All components use these directly
```

## 🎯 User Experience Improvements

### Keyboard Navigation
- **Power Users**: Can navigate without mouse (/, n, Esc)
- **Search Focus**: Quick access to search with single keypress
- **Create Flow**: Instant create mode with 'n' key
- **Cancel Flow**: Consistent Esc key to exit modes

### Time Display
- **Readable Format**: "5m ago" vs "2024-01-15 10:30:45"
- **Contextual**: Recent items show minutes/hours, older show days/weeks
- **Consistent**: Same format in Grid and Table views

### Visual Feedback
- **Color Coding**: Status and writing systems have distinct, consistent colors
- **Badge System**: Pill-shaped badges with borders for clarity
- **Updated Indicator**: Always visible timestamp showing last edit

### Soft Delete Safety
- **Non-Destructive**: Archive instead of immediate permanent deletion
- **Reversible**: Can restore archived items if needed
- **Clear Communication**: Dialog explains what "Archive" means
- **Hard Delete Available**: Power users can still permanently delete via menu

## ⏳ Remaining STEP 10 Tasks

### Dictionary Tab Keyboard Shortcuts
- [ ] **Enter**: Save current cell and move to next
- [ ] **Escape**: Revert cell to cached value
- [ ] **Tab**: Move to next editable cell (custom navigation)

### Performance Optimizations
- [ ] **Virtualization**: Implement react-window for dictionary when > 200 words
- [ ] **Lazy Loading**: Add `loading="lazy"` to symbol images
- [ ] **Memoization**: 
  - `useMemo` for `applySearchSortFilter` result
  - `useMemo` for filtered word list in dictionary
  - `useMemo` for expensive computations

### Accessibility Improvements
- [ ] **Focus Rings**: Visible focus indicators on all interactive elements
- [ ] **Tooltips**: Add titles/tooltips to icon-only buttons
- [ ] **ARIA Labels**: Descriptive labels for screen readers
- [ ] **Tab Focus Restoration**: Restore focus when switching tabs
- [ ] **Keyboard Navigation**: Ensure all features accessible via keyboard

## 🎉 Impact Summary

### Developer Experience
✅ Cleaner code with reusable utilities  
✅ No duplicate logic across components  
✅ Type-safe utility functions  
✅ Easy to test and maintain  

### User Experience
✅ Faster navigation with keyboard shortcuts  
✅ Human-readable timestamps  
✅ Consistent color coding  
✅ Safer deletion with archive-first approach  

### Performance
✅ Efficient filtering with consolidated logic  
✅ Reduced function recreations  
✅ Better memory usage  

### Maintainability
✅ Single source of truth for utilities  
✅ Easy to extend (add new statuses/writing systems)  
✅ Clear separation of concerns  

## 📝 Next Steps

1. **Complete Dictionary Shortcuts**: Add Enter/Esc/Tab navigation in dictionary table
2. **Implement Virtualization**: Use react-window for large word lists
3. **Add Accessibility**: Focus management, ARIA labels, tooltips
4. **Polish Performance**: Memoize expensive computations
5. **Testing**: Verify keyboard shortcuts work across all browsers
6. **Documentation**: Update user guide with keyboard shortcuts

## 🔍 Technical Notes

### Soft Delete Implementation
The soft delete system uses a `__deleted` flag in the JSONB `attributes` column:
```typescript
// Soft delete (default)
await supabase
  .from('world_elements')
  .update({ 
    attributes: { ...attributes, __deleted: true },
    updated_at: new Date().toISOString()
  })
  .eq('id', id)

// Filter query
.or('attributes->>__deleted.is.null,attributes->>__deleted.eq.false')
```

### Module-Level Functions
Functions are defined outside the component to:
1. Avoid recreation on every render
2. Enable access from child components without prop drilling
3. Facilitate testing and reuse
4. Reduce bundle size (single definition)

---

**Status**: STEP 10 Core Features Complete ✅  
**Next**: Complete remaining polish tasks (shortcuts, performance, a11y)  
**Date**: Comprehensive utilities and keyboard navigation implemented
