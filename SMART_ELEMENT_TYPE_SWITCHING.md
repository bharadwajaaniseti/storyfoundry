# Smart Sidebar Element Type Change

## Issue
When clicking sidebar element buttons (Character, Parenthetical, Transition, etc.):
- ❌ Always added a new element at the end
- ❌ Couldn't change the type of an existing element
- ❌ Had to manually delete and recreate elements to change their type
- ✅ Tab key worked to cycle types, but only in sequence

## User Story
**Scenario:** User has a CHARACTER element with text, wants to change it to PARENTHETICAL
**Before:** Had to create new element, copy text, delete old element
**After:** Click on the element, then click "Parenthetical" button - type changes instantly!

## Solution
Implemented **smart element type switching**:

### Behavior 1: Focused Element
**When a textarea is focused:**
- Clicking a sidebar button **changes the type** of the focused element
- Content is preserved
- Focus remains on the element
- User can immediately see the formatting change

### Behavior 2: No Focus
**When no element is focused:**
- Clicking a sidebar button **adds a new element** at the end
- New element is auto-focused
- User can immediately start typing

## Implementation Details

### 1. Track Focused Element
Added state to track which element is currently focused:
```tsx
const [focusedElementIndex, setFocusedElementIndex] = useState<number | null>(null)
```

### 2. Update on Focus/Blur
Added event handlers to textareas:
```tsx
onFocus={() => setFocusedElementIndex(index)}
onBlur={() => setFocusedElementIndex(null)}
```

### 3. Smart addElement Function
Modified to check for focused element:
```tsx
const addElement = useCallback((type: ElementType) => {
  if (focusedElementIndex !== null && elements[focusedElementIndex]) {
    // Change type of focused element
    const newElements = [...elements]
    newElements[focusedElementIndex].type = type
    setElements(newElements)
    // Keep focus
  } else {
    // Add new element at end
    const newElement = { id: generateId(), type, content: '' }
    setElements(prev => [...prev, newElement])
    // Auto-focus new element
  }
}, [focusedElementIndex, elements])
```

## User Experience

### Changing Element Type
1. **Click on any existing element** (e.g., "CHARACTER" with some text)
2. **Element gets focus** - cursor appears
3. **Click sidebar button** (e.g., "Parenthetical")
4. **Type changes instantly** - text preserved, formatting changes
5. **Focus stays on element** - continue editing immediately

### Adding New Element
1. **Click anywhere outside elements** (or after last element)
2. **No element is focused**
3. **Click sidebar button** (e.g., "Dialogue")
4. **New element appears** at the end
5. **Cursor appears** in new element automatically

## Element Types Affected
All sidebar buttons work with smart switching:
- 🎬 **Scene Heading** - INT./EXT. LOCATION - DAY/NIGHT
- 📝 **Action** - Scene description, action lines
- 👤 **Character** - Character name (centered, uppercase)
- 💬 **Dialogue** - Character speech (centered)
- ⚪ **Parenthetical** - (wryly), (under breath), etc.
- ➡️ **Transition** - CUT TO:, FADE IN:, etc.

## Keyboard Shortcuts Still Work
- **Tab** - Cycle to next element type
- **Shift+Tab** - Cycle to previous element type
- **Enter** - Create new element (type depends on current)
- **Ctrl+S** - Save screenplay

## Files Modified
- `src/components/screenplay-editor.tsx`

## Testing Scenarios

### Test 1: Change Existing Element
1. Type "JOHN" in a CHARACTER element
2. Keep cursor in that element (focused)
3. Click "Parenthetical" in sidebar
4. ✅ Verify element changes to parenthetical format
5. ✅ Verify "JOHN" text is preserved
6. ✅ Verify cursor stays in element

### Test 2: Add New Element
1. Click somewhere outside all elements (blur focus)
2. Click "Dialogue" in sidebar
3. ✅ Verify new dialogue element appears at end
4. ✅ Verify cursor is in new element
5. ✅ Verify can immediately type

### Test 3: Change Then Type
1. Focus on element with text
2. Click different type button
3. ✅ Verify type changes
4. Start typing
5. ✅ Verify text is added/modified correctly

### Test 4: Empty Element Change
1. Focus on empty CHARACTER element
2. Click "Action" button
3. ✅ Verify changes to Action
4. Type some text
5. ✅ Verify formatting is correct

## Benefits
✅ Intuitive behavior - changes what you're focused on
✅ Faster editing - no copy/paste/delete needed
✅ Preserves content when changing types
✅ Still works for adding new elements
✅ Consistent with Tab key behavior
✅ Reduces clicks and cognitive load
