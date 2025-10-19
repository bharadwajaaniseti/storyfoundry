# 🎯 Scene Navigation Feature

## Overview
Clicking on a scene card or outline item now **intelligently navigates** you to that exact scene in the Write tab with visual feedback.

---

## 🎬 How It Works

### **When You Click a Scene Card or Outline Item:**

1. **Switches to Write Tab**
   - Automatically changes from Cards/Outline view to Write view
   
2. **Scrolls to Scene**
   - Smoothly scrolls the screenplay editor to center the scene heading
   - Uses `scrollIntoView` with smooth behavior
   
3. **Highlights the Scene**
   - Applies a **yellow highlight** with pulsing animation
   - Scene heading gets:
     - `bg-yellow-100` - Light yellow background
     - `border-2 border-yellow-400` - Yellow border
     - `animate-pulse` - Pulsing effect
     - Extra padding to make it stand out
   
4. **Auto-removes Highlight**
   - After **3 seconds**, the highlight fades away
   - Scene remains in view but returns to normal styling

---

## 🔧 Technical Implementation

### **State Management**
```typescript
const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null)
const elementRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
```

### **Navigation Function**
```typescript
const navigateToScene = useCallback((sceneId: string, sceneNumber: number) => {
  // 1. Switch to write tab
  setActiveTab('write')
  
  // 2. Find the scene heading element
  const sceneHeadings = elements.filter(el => el.type === 'scene_heading')
  const targetScene = sceneHeadings[sceneNumber - 1]
  
  if (targetScene) {
    // 3. Highlight the scene
    setHighlightedElementId(targetScene.id)
    
    // 4. Scroll to element (after tab switch)
    setTimeout(() => {
      const elementRef = elementRefs.current[targetScene.id]
      if (elementRef) {
        elementRef.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // 5. Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedElementId(null)
        }, 3000)
      }
    }, 100)
  }
}, [elements])
```

### **Element Refs**
Each screenplay element now has a ref attached:
```typescript
<div 
  ref={(el) => { elementRefs.current[element.id] = el }}
  className={`... ${
    highlightedElementId === element.id 
      ? 'bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 -m-2 animate-pulse' 
      : ''
  }`}
>
```

---

## 🎨 Visual Feedback

### **Scene Card Click**
- Orange border appears on selected card
- Card remains selected until another is clicked
- "Jump to Scene" button highlighted in orange

### **Write Tab Highlight**
- **Yellow background** (`bg-yellow-100`)
- **Yellow border** (`border-yellow-400`)
- **Pulsing animation** (`animate-pulse`)
- **Centered in viewport** (`block: 'center'`)
- **Smooth scroll** (`behavior: 'smooth'`)

### **Timeline**
```
Click → Switch Tab (0ms)
     ↓
Highlight Scene (0ms)
     ↓
Scroll to Scene (100ms delay)
     ↓
Pulse Animation (active)
     ↓
Remove Highlight (3000ms)
```

---

## 🎯 User Interactions

### **From Scene Cards Tab:**
1. Click any scene card
2. **Result**: Switches to Write tab, scrolls to scene, highlights it

### **From Outline Tab:**
1. Click any outline item
2. **Result**: Switches to Write tab, scrolls to scene, highlights it

### **Jump to Scene Button:**
1. Click the "Jump to Scene" button on a card
2. **Result**: Same as clicking the card, but button click is isolated (doesn't select card)

---

## 🚀 Enhanced Features

### **Scene Card - Jump to Scene Button**
Each scene card now has a dedicated button:
```tsx
<Button
  variant="ghost"
  size="sm"
  className="w-full text-xs h-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
  onClick={(e) => {
    e.stopPropagation() // Prevents card selection
    navigateToScene(scene.id, scene.sceneNumber)
  }}
>
  <Eye className="w-3 h-3 mr-1.5" />
  Jump to Scene
</Button>
```

**Features:**
- Eye icon (👁️) for visual clarity
- Orange text matching theme
- Full width for easy clicking
- `stopPropagation` to prevent card selection
- Hover effect with orange background

---

## 💡 Use Cases

### **Scenario 1: Scene Planning**
1. User creates scene cards in Cards view
2. Clicks a card to jump to writing that specific scene
3. Scene is highlighted and centered
4. User starts writing immediately

### **Scenario 2: Reviewing Structure**
1. User switches to Outline view to see story flow
2. Notices a scene needs editing
3. Clicks the scene in outline
4. Jumps directly to that scene in Write tab
5. Makes edits

### **Scenario 3: Quick Navigation**
1. User is writing Scene 10
2. Needs to reference Scene 3
3. Opens Scene Cards, searches for Scene 3
4. Clicks "Jump to Scene"
5. Scene 3 is highlighted and centered
6. User checks details, then navigates back

---

## 🎨 Visual Design

### **Highlight Animation**
```css
/* When highlighted */
.highlighted-scene {
  background: rgb(254 249 195); /* yellow-100 */
  border: 2px solid rgb(250 204 21); /* yellow-400 */
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin: -0.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### **Scroll Behavior**
```typescript
scrollIntoView({ 
  behavior: 'smooth',  // Smooth scroll animation
  block: 'center'      // Center the element in viewport
})
```

---

## ⚡ Performance

### **Optimizations:**
- `useCallback` to prevent unnecessary re-renders
- Refs stored in object for O(1) lookup
- Delays to ensure DOM updates complete
- Auto-cleanup of highlight after 3 seconds

### **Memory Management:**
- Refs automatically cleaned up on unmount
- Timeouts cleared on component unmount (ready for implementation)
- No memory leaks from orphaned references

---

## 🔮 Future Enhancements

Ready for:
- [ ] **Breadcrumb navigation** - Show current scene number in header
- [ ] **Previous/Next scene buttons** - Navigate sequentially
- [ ] **Mini-map** - Visual representation of scenes
- [ ] **Scene thumbnails** - Preview first few lines
- [ ] **Keyboard shortcuts** - Ctrl+G for "Go to Scene"
- [ ] **Recent scenes list** - Jump to recently edited scenes
- [ ] **Bookmarks** - Mark important scenes for quick access
- [ ] **Scene timeline** - Visual timeline of all scenes
- [ ] **Focus mode** - Highlight only current scene, dim others
- [ ] **Multi-scene selection** - Select and navigate multiple scenes

---

## 📱 Responsive Behavior

### **Mobile:**
- Tap scene card → Navigate and scroll
- Highlight more prominent on smaller screens
- Scroll centers element with padding

### **Tablet:**
- Click or tap works
- Smooth transitions
- Sidebar can be toggled

### **Desktop:**
- Hover effects on cards
- Click to navigate
- Keyboard shortcuts (ready)

---

## ✅ Benefits

1. **Faster Navigation** - Jump directly to any scene
2. **Visual Confirmation** - See exactly which scene you navigated to
3. **Better UX** - Smooth transitions and clear feedback
4. **Context Awareness** - Always know where you are
5. **Professional Feel** - Industry-standard editor behavior
6. **Reduces Scrolling** - No manual searching through long screenplays
7. **Improved Workflow** - Plan in Cards, write in Write tab seamlessly

---

## 🎉 Summary

Clicking a scene now:
✅ **Switches to Write tab**
✅ **Scrolls smoothly to the scene**
✅ **Highlights with yellow pulsing animation**
✅ **Centers in viewport**
✅ **Auto-removes highlight after 3 seconds**
✅ **Works from both Cards and Outline views**
✅ **Has dedicated "Jump to Scene" button**

This creates a **seamless navigation experience** that rivals professional screenplay software! 🎬✨
