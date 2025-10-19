# Sidebar Element Addition Focus Fix

## Issue
When clicking on screenplay element buttons in the sidebar (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition), the element was added to the screenplay but:
- ❌ The new element was not focused automatically
- ❌ Users had to manually click on the new element to start typing
- ✅ Tab key worked because it modified the existing focused element

## Root Cause
The `addElement` function was creating new elements and adding them to the state, but wasn't setting focus on the newly created textarea element.

## Solution
Modified the `addElement` function to automatically focus the new element after it's rendered:

```tsx
const addElement = useCallback((type: ElementType) => {
  const newElement: ScreenplayElement = {
    id: generateId(),
    type,
    content: ''
  }
  setElements(prev => [...prev, newElement])
  setCurrentElement(type)
  
  // Focus the new element after it's rendered
  setTimeout(() => {
    const newElementDiv = elementRefs.current[newElement.id]
    if (newElementDiv) {
      const textarea = newElementDiv.querySelector('textarea')
      if (textarea) {
        textarea.focus()
      }
    }
  }, 50)
}, [])
```

## How It Works
1. **Create element** - Generate new element with unique ID
2. **Add to state** - Update elements array
3. **Set current type** - Update currentElement state
4. **Wait for render** - Use setTimeout to ensure DOM is updated
5. **Find element** - Use elementRefs to locate the new element's div
6. **Find textarea** - Query the textarea inside the div
7. **Focus** - Set focus on the textarea so user can immediately type

## User Experience Now
✅ Click any sidebar element button (Scene Heading, Character, etc.)
✅ New element is added AND automatically focused
✅ Cursor appears in the new element
✅ User can immediately start typing
✅ No manual clicking needed

## Affected Buttons
All sidebar element buttons now work correctly:
- 🎬 Scene Heading (INT./EXT. LOCATION)
- 📝 Action (Scene description)
- 👤 Character (Character name)
- 💬 Dialogue (Character speech)
- ⚪ Parenthetical ((wryly))
- ➡️ Transition (CUT TO:)

## Timing Considerations
- **50ms delay** - Gives React time to render the new element and create the DOM node
- **Safe fallback** - Checks if element and textarea exist before focusing
- **Non-blocking** - Uses setTimeout so it doesn't block UI rendering

## Files Modified
- `src/components/screenplay-editor.tsx`

## Testing
1. Open a screenplay project
2. Click on any sidebar element button (e.g., "Character")
3. Verify the new element is added
4. Verify the cursor appears in the new element automatically
5. Start typing without clicking
6. Repeat for all element types

## Related Features
- Tab key to cycle through element types (still works)
- Keyboard shortcuts (Tab, Shift+Tab)
- Manual element addition button at bottom
