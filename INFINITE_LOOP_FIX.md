# Infinite Loop Fix - Element Addition

## Issue
Elements were being added infinitely when the screenplay editor loaded, filling the page with "TEXT..." placeholders.

## Root Cause
The infinite loop was caused by a chain reaction in the `useEffect` that exposes the `addElement` callback to the parent component:

1. **Initial render** - `addElement` function is created with `useCallback`
2. **useEffect runs** - Calls `onAddElementCallback(wrappedAddElement)`
3. **Parent updates** - Stores the callback in state with `setAddElementCallback`
4. **Parent re-renders** - Cause sidebar buttons to be recreated
5. **useEffect dependency changes** - `addElement` changes because its dependency `focusedElementIndex` might change
6. **useEffect runs again** - Calls `onAddElementCallback` again
7. **Cycle repeats** - Infinite loop!

### The Problem Code
```tsx
useEffect(() => {
  if (onAddElementCallback) {
    const wrappedAddElement = (type: string) => {
      setTimeout(() => addElement(type as ElementType), 0)
    }
    onAddElementCallback(wrappedAddElement)
  }
}, [onAddElementCallback, addElement])  // ❌ addElement changes frequently!
```

## Solution
Used a **ref pattern** to store the latest `addElement` function without triggering re-renders:

### The Fix
```tsx
// Keep a ref to the latest addElement function
const addElementRef = useRef(addElement)
useEffect(() => {
  addElementRef.current = addElement
}, [addElement])

// Expose addElement callback to parent component (only once)
useEffect(() => {
  if (onAddElementCallback) {
    const wrappedAddElement = (type: string) => {
      // Use the ref to get the latest addElement function
      addElementRef.current(type as ElementType)
    }
    onAddElementCallback(wrappedAddElement)
  }
  // Only run once when component mounts
}, [onAddElementCallback])  // ✅ Only depends on onAddElementCallback
```

## How It Works

### 1. Ref Updates
```tsx
const addElementRef = useRef(addElement)
useEffect(() => {
  addElementRef.current = addElement
}, [addElement])
```
- Creates a ref that always points to the latest `addElement` function
- Updates the ref whenever `addElement` changes
- **Does NOT** cause re-renders or trigger other useEffects

### 2. Stable Callback
```tsx
useEffect(() => {
  if (onAddElementCallback) {
    const wrappedAddElement = (type: string) => {
      addElementRef.current(type as ElementType)  // Always uses latest version
    }
    onAddElementCallback(wrappedAddElement)
  }
}, [onAddElementCallback])  // Only runs when callback prop changes
```
- Creates a stable wrapper function
- The wrapper always calls `addElementRef.current` (which is always up-to-date)
- Only runs once on mount (unless `onAddElementCallback` prop changes)
- Prevents infinite loop

## Benefits
✅ **Stable callback** - Only created once, doesn't change
✅ **Latest function** - Always uses the current `addElement` logic
✅ **No infinite loops** - useEffect runs only when needed
✅ **Performance** - Prevents unnecessary re-renders in parent
✅ **Memory efficient** - Only one callback instance

## Related Fixes
This complements the earlier fix where we removed `elements` from `addElement`'s dependency array by using functional setState:

```tsx
const addElement = useCallback((type: ElementType) => {
  if (focusedElementIndex !== null) {
    setElements(prev => {  // Uses 'prev' instead of 'elements'
      // ...
    })
  }
}, [focusedElementIndex])  // Only depends on focusedElementIndex
```

## Testing
1. ✅ Load screenplay editor
2. ✅ Verify no infinite element additions
3. ✅ Click sidebar buttons to add elements
4. ✅ Verify elements are added correctly
5. ✅ Focus on element and click sidebar button
6. ✅ Verify element type changes
7. ✅ Check console - no errors or warnings

## Files Modified
- `src/components/screenplay-editor.tsx`

## Pattern Used
This is the **"Latest Ref Pattern"** - a common React pattern for keeping a stable callback that always uses the latest values:

```tsx
// 1. Store latest value in ref
const latestValueRef = useRef(value)
useEffect(() => {
  latestValueRef.current = value
}, [value])

// 2. Use ref in stable callback
const stableCallback = useCallback(() => {
  doSomething(latestValueRef.current)
}, [])  // Empty deps - stable!
```

This pattern is especially useful for:
- Event handlers passed to child components
- Callbacks passed to external libraries
- Avoiding infinite loops in useEffect
- Optimizing performance by reducing re-renders
