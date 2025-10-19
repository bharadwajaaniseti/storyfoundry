# Preview Mode Feature

## Overview
Added a **Preview Mode** toggle button that shows exactly how the screenplay looks to readers, without any editing controls.

## What is Preview Mode?

### Visual Changes
When you click "Preview", the screenplay transforms into a clean, read-only view:

**Hidden in Preview Mode:**
- ❌ Textareas (no edit boxes)
- ❌ Sidebar element buttons
- ❌ Element type badges
- ❌ Duplicate/Delete buttons
- ❌ "Add element" button
- ❌ Element hover effects

**Visible in Preview Mode:**
✅ Clean formatted text (exactly as it will print)
✅ Industry-standard screenplay formatting
✅ All content properly spaced and aligned
✅ Scene Cards, Outline, Characters, Analytics tabs
✅ Export and Print buttons
✅ Statistics (scenes, pages, word count, runtime)

## How to Use

### Enter Preview Mode
1. Click the **"Preview"** button in the header toolbar
2. Button turns blue and label changes to "Edit Mode"
3. Screenplay displays as clean, formatted text
4. Sidebar tools disappear
5. Content fills the full width

### Exit Preview Mode
1. Click the **"Edit Mode"** button (same button, now blue)
2. Returns to edit mode
3. Sidebar tools reappear
4. Textareas become editable again

## Button States

### Edit Mode (Default)
```
┌──────────┐
│ 👁 Preview │  ← Gray outline button
└──────────┘
```

### Preview Mode (Active)
```
┌──────────────┐
│ 👁 Edit Mode │  ← Blue filled button
└──────────────┘
```

## Use Cases

### 1. Check Formatting
**Before exporting or printing:**
- Enter Preview Mode
- See exactly how screenplay looks
- Check spacing, alignment, formatting
- Ensure professional appearance
- Exit and make adjustments if needed

### 2. Read Through
**Focus on content, not editing:**
- Enter Preview Mode
- Read screenplay without distractions
- No textareas or buttons to distract
- Experience it as a reader would
- Take notes or make mental changes

### 3. Share Screen
**When presenting to collaborators:**
- Enter Preview Mode
- Share your screen in a meeting
- Show clean, professional view
- No messy editing interface
- Switch back to edit when discussing changes

### 4. Check Reader Experience
**See what collaborators see:**
- Enter Preview Mode
- This is what view-only users see
- Verify content is clear
- Ensure formatting is correct
- Check for typos in final format

## Preview Mode vs Export

| Feature | Preview Mode | Export |
|---------|-------------|--------|
| **Purpose** | Quick preview in browser | Download file |
| **Location** | In the editor | External file |
| **Switching** | Instant toggle | Requires download |
| **Editing** | One click back to edit | Must return to editor |
| **Format** | HTML (in browser) | .txt file |
| **Best For** | Quick checks, presentations | Sharing, printing, archiving |

## Technical Implementation

### State Management
```tsx
const [isPreviewMode, setIsPreviewMode] = useState(false)
```

### Preview Button
```tsx
<Button
  variant={isPreviewMode ? "default" : "outline"}
  size="sm"
  onClick={() => setIsPreviewMode(!isPreviewMode)}
  className={isPreviewMode ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
>
  <Eye className="w-4 h-4 mr-2" />
  {isPreviewMode ? 'Edit Mode' : 'Preview'}
</Button>
```

### Content Rendering
```tsx
{isPreviewMode ? (
  // Static formatted text
  <div className={`${getElementStyle(element.type)} whitespace-pre-wrap`}>
    {element.content || ' '}
  </div>
) : (
  // Editable textarea
  <textarea {...editProps} />
)}
```

### Sidebar Hiding
```tsx
{showFormatting && !isPreviewMode && (
  <div className="col-span-3 space-y-4">
    {/* Sidebar tools */}
  </div>
)}
```

### Dynamic Width
```tsx
<div className={(showFormatting && !isPreviewMode) ? 'col-span-9' : 'col-span-12'}>
  {/* Editor content */}
</div>
```

## Formatting Preserved

All industry-standard formatting is maintained:

### Scene Headings
```
INT. COFFEE SHOP - DAY
```
- Bold
- Uppercase
- Left-aligned

### Action
```
The Cafe is bustling. Anna sits alone at a small table.
```
- Regular weight
- Left-aligned
- Full width

### Character
```
                    ANNA
```
- Bold
- Uppercase
- Centered

### Dialogue
```
              This is exactly what readers will see.
```
- Regular weight
- Centered
- Medium width

### Parenthetical
```
                (wryly)
```
- Italic
- Centered
- Narrow width

### Transition
```
                                        CUT TO:
```
- Bold
- Uppercase
- Right-aligned

## Keyboard Shortcut (Future Enhancement)

Could add:
- **Ctrl+P** or **Cmd+P** - Toggle Preview Mode
- Quick way to switch without clicking

## Benefits

### For Writers
✅ **Quick validation** - Instantly see final format
✅ **No export needed** - Preview in-browser
✅ **Fast iteration** - Toggle between edit and preview
✅ **Confidence** - Know exactly what readers see

### For Collaborators
✅ **Clean presentations** - Show professional view
✅ **Focus on content** - No editing clutter
✅ **Better feedback** - Review as readers experience it

### For Readers
✅ **Professional appearance** - Industry-standard format
✅ **Easy to read** - No distracting UI elements
✅ **Print-ready** - Exactly as it will print

## Files Modified
- `src/components/screenplay-editor.tsx`

## Related Features
- Export (download as .txt)
- Print (browser print dialog)
- Fullscreen mode (distraction-free editing)
- Read-only permissions (view-only users)
