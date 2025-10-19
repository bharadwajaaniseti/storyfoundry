# Ctrl+S Save Fix for Screenplay Editor

## Issue
When pressing **Ctrl+S** (or **Cmd+S** on Mac) in the screenplay editor, the browser's default "Save As" dialog was opening instead of saving the screenplay to the database.

## Root Cause
The browser's default behavior for `Ctrl+S` / `Cmd+S` is to save the current webpage as an HTML file. This wasn't being intercepted by the application.

## Solution
Added a keyboard event listener that:
1. **Detects Ctrl+S or Cmd+S** key combination
2. **Prevents the default browser behavior** using `e.preventDefault()`
3. **Triggers the screenplay save function** instead

## Implementation

```tsx
// Handle Ctrl+S / Cmd+S to save (prevent browser default)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault() // Prevent browser's save dialog
      if (permissions.canEdit) {
        handleSave()
      }
    }
  }

  // Add event listener
  document.addEventListener('keydown', handleKeyDown)

  // Cleanup
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [permissions.canEdit, elements])
```

## Features
✅ Works on **Windows/Linux** (Ctrl+S)
✅ Works on **Mac** (Cmd+S)
✅ Prevents browser's default save dialog
✅ Saves screenplay to database
✅ Respects edit permissions (only saves if user can edit)
✅ Shows "Saving..." feedback in UI
✅ Proper cleanup on component unmount

## User Experience
- Press **Ctrl+S** (or **Cmd+S**)
- Screenplay saves to database
- "Saving..." button shows progress
- "Saved [time]" indicator updates
- No browser save dialog appears

## Files Modified
- `src/components/screenplay-editor.tsx`

## Related Features
- Auto-save every 30 seconds
- Manual save button
- Last saved timestamp display
- Database save with fallback to JSON
