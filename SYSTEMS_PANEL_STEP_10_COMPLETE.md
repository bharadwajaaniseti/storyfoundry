# Systems Panel - Step 10 Complete ✅

## Bulk Actions Bar Implementation

### Features Implemented

#### 1. **BulkActionsBar Component**
- Sticky bar positioned below toolbar (top-[73px])
- Teal accent background (bg-teal-50) for visual distinction
- Only visible when `bulkMode && selectedIds.size > 0`
- Shows selection count prominently

#### 2. **Bulk Actions**

##### Set Status (Select Dropdown)
- Update status for all selected systems
- Options: Active, Historical, Proposed, Defunct, Evolving
- Optimistic UI update with rollback on error
- Shows undo toast after success

##### Add Tag (Dialog)
- Opens modal dialog to add tag to selected systems
- Input field with Enter key support
- Shows existing unique tags from selection (clickable to populate input)
- Only adds tag if it doesn't already exist on a system
- Optimistic update with rollback
- Shows undo toast after success

##### Soft Delete
- Bulk soft delete all selected systems
- Sets `__deleted` flag and `deleted_at` timestamp
- Optimistic removal from UI
- Shows undo toast after success

##### Export JSON
- Client-side export using Blob API
- Downloads `systems-export-YYYY-MM-DD.json`
- Pretty-printed JSON (2-space indent)
- Includes all system data for selected items

##### Export CSV
- Client-side CSV generation
- Downloads `systems-export-YYYY-MM-DD.csv`
- Columns: ID, Name, Type, Scope, Status, Description, Governance, Rules, Tags, Created, Updated
- Properly escaped quotes in CSV fields
- Tags joined with commas

#### 3. **Undo Functionality**
- Snapshot system: stores previous state before bulk operations
- `createSnapshot()` - saves current systems array and selectedIds
- `handleUndo()` - restores snapshot and clears it
- Undo button appears in BulkActionsBar when snapshot exists
- Teal button with Undo2 icon
- Toast notifications include undo callback
- Clears snapshot on error (rollback)

#### 4. **Unique Tag Merge**
- `getSelectedTags()` - extracts all unique tags from selected systems
- Uses Set for deduplication
- Sorted alphabetically
- Displayed in BulkActionsBar (shows first 3 + count)
- Displayed in Add Tag Dialog (all tags, clickable)

#### 5. **UI/UX Enhancements**
- Bulk actions bar visually distinct with teal theme
- Action buttons with icons (Tag, Download, Trash2, Undo2)
- Status dropdown with all 5 status options
- Export buttons grouped together
- Delete button has red accent (border-red-300, text-red-600)
- Undo button stands out with solid teal background
- Responsive flexbox layout with gap-3

### Technical Implementation

#### State Added
```typescript
const [showAddTagDialog, setShowAddTagDialog] = useState(false)
const [newTag, setNewTag] = useState('')
const [undoSnapshot, setUndoSnapshot] = useState<{
  systems: SystemElement[]
  selectedIds: Set<string>
} | null>(null)
```

#### New Handlers
- `createSnapshot()` - Create undo snapshot
- `handleUndo()` - Restore from snapshot
- `handleBulkSetStatus(status)` - Update status for all selected
- `handleBulkAddTag(tag)` - Add tag to all selected (skip if exists)
- `getSelectedTags()` - Get unique tags from selection
- `handleExportJSON()` - Download JSON file
- `handleExportCSV()` - Download CSV file

#### Toast Enhancement
- Updated signature: `showToast(message, type, onUndo?)`
- Supports optional undo callback
- Logs undo availability in console

### Component Structure
```
SystemsPanel
├── SystemsToolbar
├── BulkActionsBar (conditional)
│   ├── Selection count
│   ├── Set Status dropdown
│   ├── Add Tag button
│   ├── Unique tags display
│   ├── Export JSON button
│   ├── Export CSV button
│   ├── Delete button
│   └── Undo button (conditional)
├── Content (Grid/List)
└── Dialogs
    ├── SystemEditorDialog
    ├── SystemQuickView
    └── Add Tag Dialog (new)
```

### Optimistic Updates Pattern
All bulk operations follow this pattern:
1. Create snapshot for undo
2. Store previous state
3. Update UI optimistically
4. Perform database operations
5. Show success toast with undo callback
6. On error: rollback + clear snapshot + error toast

### File Exports
Both JSON and CSV exports:
- Client-side only (no server request)
- Use Blob API for file creation
- Trigger automatic download
- Filename includes current date (YYYY-MM-DD)
- Clean up object URLs after download

## Status
**COMPLETE** - All Step 10 requirements implemented and tested without errors.
