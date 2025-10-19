# setState During Render Fix

## Error
```
Cannot update a component (`ScreenplayEditor`) while rendering a different component (`ScreenplayPageInner`). 
To locate the bad setState() call inside `ScreenplayPageInner`
```

## Root Cause
The `setAddElementCallback` state setter function was being passed directly as a prop to the `ScreenplayEditor` component. When the component called this function during initialization (in a `useEffect`), it caused a state update in the parent component (`ScreenplayPageInner`) while that parent was still rendering, violating React's rendering rules.

### The Problem Code
```tsx
// In page.tsx - Parent Component
const [addElementCallback, setAddElementCallback] = useState(...)

// Passed directly - causes re-renders
<ScreenplayEditor
  onAddElementCallback={setAddElementCallback}  // ❌ setState passed directly
  ...
/>
```

When `ScreenplayEditor` calls `onAddElementCallback(wrappedAddElement)` in its useEffect, it's directly calling `setAddElementCallback`, which updates parent state during render.

## Solution
Wrapped `setAddElementCallback` in a `useCallback` to create a stable reference that doesn't change on every render:

```tsx
// In page.tsx - Parent Component
const [addElementCallback, setAddElementCallback] = useState<((type: string) => void) | null>(null)

// Wrap in useCallback to prevent re-renders
const handleAddElementCallback = useCallback((callback: (type: string) => void) => {
  setAddElementCallback(() => callback)
}, [])

// Pass the stable callback
<ScreenplayEditor
  onAddElementCallback={handleAddElementCallback}  // ✅ Stable reference
  ...
/>
```

## How It Works

### Before (Broken)
1. Parent renders
2. `setAddElementCallback` function is created
3. Passed to child as prop
4. Child's `useEffect` runs
5. Calls `onAddElementCallback(wrappedAddElement)`
6. This calls `setAddElementCallback` directly
7. **Parent state updates during render** ❌
8. React throws error

### After (Fixed)
1. Parent renders
2. `handleAddElementCallback` is created with `useCallback` (stable)
3. Passed to child as prop
4. Child's `useEffect` runs
5. Calls `onAddElementCallback(wrappedAddElement)`
6. This calls the stable `handleAddElementCallback`
7. Which safely updates state
8. **Parent state updates after render completes** ✅
9. No error

## Technical Details

### useCallback Dependency
```tsx
const handleAddElementCallback = useCallback((callback: (type: string) => void) => {
  setAddElementCallback(() => callback)
}, [])  // Empty deps - function never changes
```

The empty dependency array `[]` ensures the function reference never changes across renders, preventing the child component's `useEffect` from running repeatedly.

### setState Function Form
```tsx
setAddElementCallback(() => callback)
```

We use the function form of setState `() => callback` to set the callback as the new state value. This is different from the updater form `(prev) => newValue`.

## Related Changes

This fix complements the earlier "Latest Ref Pattern" fix in the screenplay editor:

### In screenplay-editor.tsx
```tsx
// Keep a ref to the latest addElement function
const addElementRef = useRef(addElement)
useEffect(() => {
  addElementRef.current = addElement
}, [addElement])

// Expose callback only once
useEffect(() => {
  if (onAddElementCallback) {
    const wrappedAddElement = (type: string) => {
      addElementRef.current(type as ElementType)
    }
    onAddElementCallback(wrappedAddElement)
  }
}, [onAddElementCallback])  // Only when callback prop changes
```

Together, these two fixes ensure:
1. **Parent provides stable callback** (this fix)
2. **Child uses latest logic** (ref pattern)
3. **No infinite loops** (stable dependencies)
4. **No setState during render** (proper useCallback)

## Files Modified
- `src/app/screenplays/[id]/page.tsx`

## Testing
1. ✅ Load screenplay editor
2. ✅ Verify no console errors
3. ✅ Click sidebar element buttons
4. ✅ Elements add correctly
5. ✅ Focus element and click button
6. ✅ Element type changes correctly
7. ✅ No "setState during render" warnings

## React Rules Followed

### Rule: Don't Call setState During Render
✅ **Fixed**: All state updates now happen in event handlers or effects, not during render

### Rule: Keep Components Pure
✅ **Fixed**: Parent component doesn't have side effects during render

### Rule: Use useCallback for Stable References
✅ **Fixed**: Callback prop is now stable across renders

## Benefits
✅ **No console errors** - Clean React warnings
✅ **Better performance** - Fewer unnecessary re-renders
✅ **Stable references** - Child component doesn't re-mount
✅ **Correct behavior** - State updates happen at the right time
✅ **Maintainable code** - Follows React best practices

## Pattern Summary

**When passing setState or callbacks to child components:**
```tsx
// ❌ Don't do this
<ChildComponent onCallback={setState} />

// ✅ Do this
const handleCallback = useCallback((value) => {
  setState(value)
}, [])

<ChildComponent onCallback={handleCallback} />
```

This pattern ensures the prop reference is stable and doesn't trigger unnecessary re-renders or setState-during-render errors.
