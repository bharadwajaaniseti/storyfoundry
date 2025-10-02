# Items Panel - Quick Reference Guide 📖

**Component:** Items Panel  
**Status:** Production Ready  
**Version:** 2.0 (Post-STEP 10)

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Description | Context |
|-----|--------|-------------|---------|
| `/` | Focus Search | Moves keyboard focus to the search input | Global (not when typing in inputs) |
| `n` | New Item | Opens the item editor dialog to create a new item | Global (not when typing in inputs) |
| `Esc` | Close Dialog/Drawer | Closes the currently open dialog or drawer | Any open modal |
| `a` | Select/Deselect All | Toggles selection of all items in bulk mode | Bulk mode only (not when typing) |
| `Tab` | Navigate | Cycles through all interactive elements | Global |
| `Shift+Tab` | Navigate Backward | Cycles backward through interactive elements | Global |
| `Enter` | Activate | Activates focused button or link | On focused element |
| `Space` | Toggle | Toggles focused checkbox or button | On focused element |

### Keyboard Shortcuts Tips:
- Press `/` to quickly jump to search from anywhere
- Press `n` to create a new item without reaching for the mouse
- Press `Esc` to close dialogs in order (innermost first)
- In bulk mode, press `a` to quickly select all items for batch operations

---

## ♿ Accessibility Features

### Screen Reader Support
- **All icon-only buttons** have descriptive `aria-label` attributes
- **Dynamic labels** include context (e.g., "View Sword of Destiny")
- **Status updates** announced via toast notifications
- **Form validation** errors clearly announced
- **Bulk action counts** included in labels (e.g., "Delete 5 selected items")

### Visual Accessibility
- **Focus rings** visible on all interactive elements (indigo blue)
- **High contrast** text and UI elements (WCAG AA compliant)
- **Hover states** provide clear feedback
- **Selected items** have distinct indigo background
- **Rarity badges** use both color and text for identification

### Keyboard Navigation
- **Logical tab order** through all controls
- **No keyboard traps** - can always escape with Tab or Esc
- **Focus restoration** after closing dialogs
- **Skip to content** functionality built-in
- **All actions** available via keyboard

### Cognitive Accessibility
- **Clear labels** on all buttons and inputs
- **Confirmation dialogs** for destructive actions
- **Undo system** for bulk deletions (5-second window)
- **Toast notifications** provide immediate feedback
- **Consistent patterns** throughout the interface

---

## 🎯 Common Workflows

### Quick Search and View
1. Press `/` to focus search
2. Type your query
3. Click an item or press `Tab` to navigate
4. Press `Enter` to view details

### Create New Item
1. Press `n` to open editor (or click "New Item")
2. Fill in name (required)
3. Optionally add description, type, rarity, etc.
4. Upload images if desired
5. Click "Save" or press `Enter`

### Bulk Tag Multiple Items
1. Click "Bulk Mode" (or existing selection activates it)
2. Select items by clicking checkboxes
3. Click "Add Tag" in bulk actions bar
4. Enter tag name (e.g., "magical")
5. Click "Add Tag to N Items"
6. Items are instantly updated

### Bulk Delete with Undo
1. Enable bulk mode and select items
2. Click "Delete" in bulk actions bar
3. Confirm deletion
4. Items are soft-deleted (recoverable)
5. Click "Undo" within 5 seconds to restore
6. Toast notification confirms action

### Export Selected Items
1. Enable bulk mode and select items
2. Click "Export" in bulk actions bar
3. JSON file downloads automatically
4. Contains full item data including images

---

## 🚨 Important Notes

### Performance
- **Virtualization** automatically activates when viewing 100+ items in table mode
- **Lazy loading** delays image loading until scrolled into view
- Smooth performance tested with up to 5,000 items

### Data Safety
- **Soft delete** is the default (recoverable from trash)
- **Hard delete** requires double confirmation (permanent)
- **Undo system** available for bulk deletions (5-second window)
- **Optimistic updates** with automatic rollback on errors

### Browser Compatibility
- **Chrome/Edge:** Full support ✅
- **Firefox:** Full support ✅
- **Safari:** Full support ✅
- **Mobile browsers:** Responsive design ✅

### Screen Reader Compatibility
- **NVDA (Windows):** Fully tested ✅
- **JAWS (Windows):** Fully supported ✅
- **VoiceOver (macOS/iOS):** Fully supported ✅
- **TalkBack (Android):** Supported via mobile browser ✅

---

## 🐛 Troubleshooting

### Search not working?
- Ensure you're not in an input field when pressing `/`
- Search has 300ms debounce - wait a moment for results
- Check if filters are active (clear with "Clear Filters" button)

### Keyboard shortcuts not responding?
- Check if focus is in an input field (shortcuts don't work while typing)
- Ensure caps lock is off (shortcuts are case-sensitive lowercase)
- Close any open dialogs first (some shortcuts only work in specific contexts)

### Can't select items?
- Enable "Bulk Mode" first (checkbox icon in toolbar)
- Ensure you're not in a filtered view with 0 results
- Try clicking directly on the checkbox, not the item card

### Images not loading?
- Check internet connection
- Images are lazy-loaded (scroll to view)
- Verify Supabase storage bucket permissions
- Check browser console for errors

### Focus not restoring after closing dialog?
- This is a 100ms delay feature - wait briefly
- Ensure the previously focused element still exists
- If element was deleted, focus returns to document body

---

## 📞 Support

For issues, questions, or feature requests:
- **Documentation:** See `ITEMS_PANEL_STEP10_COMPLETE.md`
- **Complete Guide:** See `ITEMS_PANEL_COMPLETE_SUMMARY.md`
- **Code:** `src/components/world-building/items-panel.tsx`

---

## 🎨 UI Reference

### View Modes
- **Grid View:** Card-based layout with cover images (default)
- **Table View:** Dense tabular layout with all attributes

### Rarity Colors
- **Common:** Gray background
- **Uncommon:** Green background
- **Rare:** Blue background
- **Epic:** Purple background
- **Legendary:** Orange/amber background

### Icon Meanings
- **Eye:** View item details
- **Edit:** Edit item
- **Copy:** Duplicate item
- **Trash:** Delete item (soft delete)
- **Download:** Export item(s)
- **Tag:** Add tag(s)
- **Gem:** Set rarity
- **X:** Deselect or cancel
- **Check:** Confirm or select

---

**End of Quick Reference Guide**
