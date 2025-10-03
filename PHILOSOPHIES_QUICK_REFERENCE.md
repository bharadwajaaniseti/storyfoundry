# Philosophies Panel - Quick Reference Card

## 🚀 Quick Start

### Create New Philosophy
1. Press `n` (or click "+ New Philosophy")
2. Fill in Overview tab (name required)
3. Switch between 12 tabs
4. Changes auto-save after 600ms
5. Click "Save" or let autosave handle it

### Edit Existing Philosophy
1. Click philosophy card/row
2. Modify any field
3. Changes auto-save
4. Click "Back to List" to return

### Delete Philosophy
1. Click trash icon (or Delete button in workspace)
2. Confirm in dialog
3. **Soft delete**: Default (recoverable)
4. **Hard delete**: Check "Permanently delete" (cannot be undone)

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `/` | Focus search | List mode only |
| `n` | Create new | List mode only |
| `Enter` | Add practice | Practices tab |
| `Escape` | Blur input | Any input |

---

## 📋 12 Tabs Reference

| # | Tab | Key Fields | Special Features |
|---|-----|------------|------------------|
| 1 | Overview | name*, type, founder, status | Status badges |
| 2 | Tenets | core_principles[] | Drag-drop, templates |
| 3 | Practices | practices[], precepts, rituals | Inline table, cadence |
| 4 | Key Texts | key_texts[] | Import/export JSON/CSV |
| 5 | Ethics | virtues[], vices[], ethics | Chip selectors (16+16) |
| 6 | Meaning | purpose, meaning, outlook | Enhanced textareas |
| 7 | History | history, founder, origin | 12-row long-form |
| 8 | Impact | metrics{}, commonality | Numeric chips 0-10 |
| 9 | Relationships | links[] | 8 types, search picker |
| 10 | Media | images[] | Upload, reorder, cover |
| 11 | Notes | notes | Private notes |
| 12 | Tags | tags[] | Tag management |

*Required field

---

## 🔧 CRUD Operations

### Create
```typescript
handleCreateNew()
→ mode = 'create'
→ Edit → autosave → handleSave()
→ supabase.insert()
→ mode = 'edit' (switches after save)
```

### Read
```typescript
loadPhilosophies()
→ supabase.select()
→ .or('__deleted.is.null,__deleted.eq.false') // filters soft-deleted
→ .order('updated_at', {ascending: false}) // newest first
```

### Update
```typescript
triggerAutosave() // 600ms debounce
→ handleSave()
→ supabase.update({ attributes: {...}, updated_at })
```

### Delete
```typescript
confirmDelete(id, name) // opens dialog
→ user confirms
→ deletePhilosophy(id, hard)
  if (hard) supabase.delete() // permanent
  else supabase.update({ __deleted: true }) // recoverable
```

---

## 🎨 Data Types

### Tenet
```typescript
{ id: string, title: string, details: string }
```

### Practice
```typescript
{ 
  id: string, 
  name: string, 
  notes: string, 
  cadence: 'Daily'|'Weekly'|'Monthly'|'Yearly'|'Seasonal'|'Occasional' 
}
```

### TextRef
```typescript
{ id: string, title: string, author: string, year: string, summary: string }
```

### Link
```typescript
{ 
  type: 'character'|'location'|'faction'|'item'|'system'|'language'|'religion'|'philosophy',
  id: string,
  name: string
}
```

---

## 🎯 Quick Templates (Tenets Tab)

Click dropdown → select template → instant population:

1. **Consequentialism** (3 principles)
   - Greatest Good
   - Outcome-Based
   - Utility Maximization

2. **Deontology** (4 principles)
   - Categorical Imperative
   - Duty-Based Ethics
   - Respect for Persons
   - Universal Law

3. **Virtue Ethics** (3 principles)
   - Character Excellence
   - Golden Mean
   - Practical Wisdom

4. **Natural Law** (4 principles)
   - Universal Order
   - Human Nature
   - Reason-Based Morality
   - Common Good

5. **Social Contract** (3 principles)
   - Mutual Agreement
   - Rights & Obligations
   - Collective Welfare

---

## 🗂️ Import/Export (Key Texts Tab)

### Export JSON
```json
[
  {
    "title": "The Republic",
    "author": "Plato",
    "year": "380 BCE",
    "summary": "Dialogue on justice..."
  }
]
```

### Export CSV
```csv
Title,Author,Year,Summary
"The Republic","Plato","380 BCE","Dialogue on justice..."
```

### Import
1. Click "Import JSON" or "Import CSV"
2. Select file
3. Texts auto-populate
4. Autosave triggers

---

## 🏷️ Badge Colors

### Status (Overview)
- **Active**: Green
- **Historic**: Gray
- **Revival**: Amber

### Virtues (Ethics)
- All virtues: Green bg-green-100

### Vices (Ethics)
- All vices: Red bg-red-100

### Impact Metrics (Impact)
- **Education**: Blue bg-blue-100
- **Politics**: Purple bg-purple-100
- **Art**: Amber bg-amber-100

### Element Types (Relationships)
- **Character**: Blue
- **Location**: Green
- **Faction**: Purple
- **Item**: Amber
- **System**: Cyan
- **Language**: Pink
- **Religion**: Indigo
- **Philosophy**: Rose

---

## 💾 Autosave Behavior

### Trigger Conditions
- Field change (after 600ms idle)
- Tab switch
- Manual "Save" button click

### What Gets Saved
- All 30+ form fields
- Nested arrays (principles, practices, texts)
- Objects (impact_metrics)
- Timestamps (updated_at)

### Visual Feedback
- "Saving..." indicator (if shown)
- No error → success
- Error → alert notification

---

## 🔍 Search & Filter

### Search (Top toolbar)
- Searches: name, description, tags
- Case-insensitive
- Live updates
- Press `/` to focus

### Filters
- **Systems**: Multi-select dropdown
- **Types**: Philosophy types (15 options)
- **Status**: active/historic/revival
- Clear all with "Clear Filters" button

### Sort Options
- Name A-Z
- Name Z-A
- Newest First
- Oldest First
- By Type

---

## 🖼️ Image Gallery (Media Tab)

### Actions
1. **Upload**: Click "Upload Images" → select files
2. **Select**: Click "Select from Library" (hook)
3. **Reorder**: Use ↑↓ buttons
4. **Set Cover**: Click "Set as Cover" (first image auto-set)
5. **Delete**: Click trash icon → confirm

### Display
- 4-column responsive grid
- Cover image has amber badge
- Hover shows actions
- Images stored as URL strings

---

## 🔗 Relationships (Links)

### Adding Links
1. Click "+ Add Link"
2. Search in popup
3. Click element to add
4. Badge appears with type color
5. Click X to remove

### Element Types
- Character, Location, Faction, Item
- System, Language, Religion, Philosophy

### Display
- Grouped by type
- Color-coded badges
- Searchable popup
- Multi-select

---

## 📊 Impact Metrics

### Numeric Chips (0-10 scale)
- **Education**: Influence on learning/academia
- **Politics**: Influence on governance
- **Art**: Influence on culture/arts

### Click to Select
- Click chip 0-10
- Selected chip highlighted
- Auto-saves

### Other Impact Fields
- **Commonality**: Slider 0-10
- **Adherents**: Text (e.g., "1 million")
- **Geographic Area**: Text (e.g., "East Asia")

---

## 🚨 Error Handling

### Validation
- Required fields marked with *
- Red outline on invalid fields
- Inline error messages

### Network Errors
- Toast notification
- Retry option
- No data loss (optimistic updates)

### Autosave Failures
- Highlighted in UI
- Manual save still available
- Error logged to console

---

## 🎯 Best Practices

### Creating Philosophies
1. ✅ Start with Overview (name, type)
2. ✅ Use templates for Tenets
3. ✅ Add Key Texts early
4. ✅ Set status (active/historic/revival)
5. ✅ Add relationships last

### Organizing
1. ✅ Use consistent naming
2. ✅ Tag appropriately
3. ✅ Link related elements
4. ✅ Add cover images
5. ✅ Fill impact metrics

### Performance
1. ✅ Let autosave work
2. ✅ Use soft delete (recoverable)
3. ✅ Batch imports (JSON/CSV)
4. ✅ Filter before scrolling

---

## 🆘 Troubleshooting

### Autosave Not Working
- Check network connection
- Look for error toasts
- Try manual save
- Check browser console

### Can't Delete Philosophy
- Check permissions
- Verify dialog confirmation
- Try soft delete first
- Check database logs

### Import Failed
- Verify JSON/CSV format
- Check for special characters
- Ensure proper encoding
- Use export as template

### Lost Changes
- Check autosave logs
- Look in database (soft-deleted?)
- Check browser console
- Contact support

---

## 📞 Support

### Documentation
- STEP_13_CRUD_COMPLETE.md (technical)
- PHILOSOPHIES_FEATURE_COMPLETE.md (overview)
- This quick reference

### Debugging
- Open browser console (F12)
- Check network tab
- Look for red errors
- Copy error messages

### Contact
- GitHub Issues (for bugs)
- Team Slack (for questions)
- Email: support@storyfoundry.com

---

## 🎓 Learning Path

### Beginner
1. Create first philosophy
2. Fill Overview tab
3. Try templates in Tenets
4. Add some virtues/vices
5. Save and view in list

### Intermediate
1. Import key texts (CSV)
2. Add relationships
3. Upload images
4. Use drag-and-drop
5. Duplicate philosophy

### Advanced
1. Create custom templates
2. Batch operations
3. Complex filtering
4. Export/import workflows
5. Performance tuning

---

## 📈 Metrics to Track

### Per Philosophy
- Completion % (tabs filled)
- Last updated
- Link count
- Image count
- Text reference count

### Project-Wide
- Total philosophies
- Active vs historic
- Most common types
- Average complexity
- Tag usage

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**File**: philosophies-panel.tsx (3,409 lines)

---

💡 **Pro Tip**: Use keyboard shortcuts (`/`, `n`) for fastest workflow!
