# Screenplay Preview & Reader View Guide

## Current Features

### 1. Export Screenplay (Download)
**Location:** Header toolbar → "Export" button

**What it does:**
- Converts your screenplay elements to industry-standard formatted text
- Downloads as a `.txt` file
- Properly formats:
  - Scene headings (uppercase, left-aligned)
  - Action lines (left-aligned)
  - Character names (centered, uppercase)
  - Dialogue (centered)
  - Parentheticals (centered, in parentheses)
  - Transitions (right-aligned, uppercase)

**How to use:**
1. Click the "Export" button in the header
2. File downloads automatically
3. Open in any text editor or screenwriting software

**File format:**
```
INT. COFFEE SHOP - DAY

The Cafe is bustling. Anna sits alone at a small table, typing furiously on the laptop.

                    ANNA
              This is a test of the export function.

OUT. OUTSIDE COFFE SHOP - EVENING

                    ANNY
              Only if it comes with a completed third act.
```

### 2. Print Screenplay
**Location:** Sidebar → Quick Actions → "Print Script"

**What it does:**
- Opens browser's print dialog
- Shows properly formatted screenplay
- Can save as PDF or print to paper

**How to use:**
1. Click "Print Script" in sidebar
2. Browser print dialog opens
3. Choose printer or "Save as PDF"
4. Screenplay maintains industry-standard formatting

### 3. Fullscreen Mode
**Location:** Header toolbar → Maximize icon

**What it does:**
- Expands editor to fullscreen
- Hides browser chrome
- Focus mode for distraction-free writing

**How to use:**
1. Click maximize icon (⛶) in header
2. Editor goes fullscreen
3. Click minimize icon (⊡) to exit

## What Readers See

Currently, when someone views your screenplay (as a collaborator or with preview access):

### For Readers (View-Only Access)
1. **Textareas are disabled** - They see all text but can't edit
2. **No sidebar tools** - Element addition buttons hidden
3. **No save button** - Only Export and Print available
4. **All tabs available** - Write, Scene Cards, Outline, Characters, Analytics
5. **Professional formatting** - Industry-standard screenplay format
6. **Live stats** - See scenes, pages, word count, characters

### Permission-Based Features
```tsx
// In the code:
disabled={!permissions.canEdit}  // Textareas
{permissions.canEdit && (...)}   // Edit buttons
```

## Recommendation: Add Preview Mode

I can add a dedicated "Preview Mode" that shows exactly how the screenplay looks to readers:

### Proposed Preview Mode Features
1. **Toggle button** - Switch between Edit and Preview modes
2. **Clean view** - Hide all editing controls
3. **Read-only** - Show formatted screenplay
4. **No distractions** - Focus on content
5. **Professional layout** - Exactly as readers see it

### Would you like me to implement this?

The preview mode would:
- Add a "Preview" button next to Export
- Show the screenplay without textareas (just formatted text)
- Hide sidebar tools
- Show exactly what readers with view-only access see
- Toggle back to edit mode easily

## Current Reader Experience

### If user has `canEdit: false` permission:
```tsx
✅ Can view all screenplay content
✅ Can see Scene Cards, Outline, Characters, Analytics
✅ Can export and print
✅ Can see live statistics
❌ Cannot edit any text
❌ Cannot add/delete elements
❌ Cannot save changes
❌ No sidebar element tools visible
```

### Industry-Standard Formatting Preserved:
- **12pt Courier font** - Industry standard
- **1.5 line spacing** - Proper screenplay spacing
- **Proper margins** - Standard screenplay margins
- **Element-specific formatting:**
  - Scene Headings: Bold, uppercase, left-aligned
  - Action: Normal, left-aligned
  - Character: Bold, uppercase, centered
  - Dialogue: Centered, medium width
  - Parenthetical: Italic, centered, narrow width
  - Transition: Right-aligned, uppercase

## Sharing Options

### 1. Private
- Only you can view
- No one else has access

### 2. Preview
- Share with specific collaborators
- They get view-only or edit access based on their role

### 3. Public
- Anyone with the link can view (read-only)
- Great for sharing with potential producers, agents, etc.

## Next Steps

Would you like me to:
1. **Add a Preview Mode toggle** - See exactly what readers see
2. **Enhance export options** - PDF export, Final Draft format, etc.
3. **Add sharing controls** - Directly from the editor
4. **Create a public view page** - Dedicated reader-friendly page

Let me know what you'd like to add!
