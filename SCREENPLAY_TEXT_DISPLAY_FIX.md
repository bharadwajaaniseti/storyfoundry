# Screenplay Editor Text Display Fix

## Issue
When typing in the screenplay editor, users experienced:
1. **Scrollbar appearing** in textarea elements
2. **Text not fully visible** - content was cut off

## Root Cause
The textarea elements used a fixed `rows` calculation:
```tsx
rows={Math.max(1, Math.ceil(element.content.length / 60))}
```

This created a fixed height based on character count, which:
- Didn't account for line breaks
- Caused scrolling when content exceeded calculated height
- Didn't auto-resize as users typed

## Solution

### 1. Dynamic Auto-Resize on Input
Changed the textarea to auto-resize as users type:

```tsx
onChange={(e) => {
  updateElement(index, e.target.value)
  // Auto-resize textarea
  e.target.style.height = 'auto'
  e.target.style.height = e.target.scrollHeight + 'px'
}}
```

### 2. Hide Overflow
Added `overflow-hidden` class and removed the `rows` attribute:

```tsx
className="... overflow-hidden ..."
style={{ minHeight: '24px' }}
```

### 3. Auto-Resize on Load
Added a useEffect to resize all textareas when elements change (on load, after save, etc.):

```tsx
useEffect(() => {
  setTimeout(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea')
    textareas.forEach(textarea => {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  }, 0)
}, [elements])
```

## Result
✅ No scrollbars in textarea elements
✅ All text fully visible
✅ Textareas grow dynamically as you type
✅ Proper height on initial load
✅ Industry-standard screenplay formatting preserved

## Files Modified
- `src/components/screenplay-editor.tsx`

## Testing
1. Open any screenplay project
2. Type multiple lines of text in any element
3. Verify no scrollbar appears
4. Verify all text is visible
5. Reload the page and verify text displays correctly
