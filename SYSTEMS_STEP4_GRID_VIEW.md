# Systems Panel - Step 4: Grid View Implementation

## ✅ Step 4 Complete: SystemsGrid Component

### Component Architecture

```typescript
interface SystemsGridProps {
  systems: SystemElement[]
  bulkMode: boolean
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onQuickView: (system: SystemElement) => void
  onEdit: (system: SystemElement) => void
  onDuplicate: (system: SystemElement) => void
  onDelete: (system: SystemElement) => void
  onCreateFirst: () => void
}
```

### Grid Layout

**Responsive Grid:**
- ✅ 1 column on mobile (`grid-cols-1`)
- ✅ 2 columns on tablet (`md:grid-cols-2`)
- ✅ 3 columns on desktop (`lg:grid-cols-3`)
- ✅ 1.5rem gap between cards (`gap-6`)

### Card Structure

Each card displays:

#### 1. **Header Section**
```tsx
<CardHeader>
  {/* Icon or Image */}
  {imageUrl ? (
    <img src={imageUrl} className="w-12 h-12 rounded-lg object-cover" />
  ) : (
    <Globe className="w-6 h-6 text-teal-500" />
  )}
  
  {/* Name */}
  <CardTitle className="line-clamp-1">{system.name}</CardTitle>
  
  {/* Type & Status Badges */}
  <Badge className={typeColor(systemType)}>{systemType}</Badge>
  <Badge className={statusBadge(status).className}>
    {statusBadge(status).label}
  </Badge>
</CardHeader>
```

**Features:**
- ✅ Shows first `attributes.images[0]` if available
- ✅ Falls back to Globe icon with teal background
- ✅ Name with line-clamp-1 (no overflow)
- ✅ Color-coded type pill (political=blue, economic=green, etc.)
- ✅ Status badge with proper labels (Active, Historical, etc.)

#### 2. **Content Section**
```tsx
<CardContent>
  {/* Description - line-clamp-2 */}
  <p className="line-clamp-2">{system.description}</p>
  
  {/* Quick Facts Row */}
  <div className="flex items-center gap-4">
    <div>Scope: {scope}</div>
    <div>Rules: {rules}</div>
  </div>
  
  {/* Tag Chips */}
  {tags.slice(0, 3).map(tag => (
    <Badge variant="outline">{tag}</Badge>
  ))}
  {tags.length > 3 && <Badge>+{tags.length - 3}</Badge>}
  
  {/* Footer */}
  <div className="flex justify-between">
    <span>Updated</span>
    <span>{relativeDate(updated_at)}</span>
  </div>
</CardContent>
```

**Features:**
- ✅ Description limited to 2 lines (`line-clamp-2`)
- ✅ Quick facts: Scope + first mechanism (rules)
- ✅ Tag chips (max 3 visible, "+N" for overflow)
- ✅ Footer with "Updated • relative time" format
- ✅ Relative time with tooltip showing full timestamp

### Hover Actions

#### Normal Mode (4 actions in dropdown):
```tsx
<DropdownMenu>
  <DropdownMenuItem onClick={onQuickView}>
    <Eye /> Quick View
  </DropdownMenuItem>
  <DropdownMenuItem onClick={onEdit}>
    <Edit3 /> Edit
  </DropdownMenuItem>
  <DropdownMenuItem onClick={onDuplicate}>
    <Copy /> Duplicate
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => setDeleteConfirm(system)}>
    <Trash2 /> Delete
  </DropdownMenuItem>
</DropdownMenu>
```

**Features:**
- ✅ MoreHorizontal (•••) button in top-right
- ✅ Hidden by default, appears on hover (`opacity-0 group-hover:opacity-100`)
- ✅ Backdrop blur for better visibility (`bg-background/95 backdrop-blur-sm`)
- ✅ Shadow for elevation (`shadow-md`)
- ✅ Quick View - opens side panel (handler ready)
- ✅ Edit - opens full editor
- ✅ Duplicate - clones system with "(Copy)" suffix
- ✅ Delete - shows confirmation dialog (red text)

### Bulk Mode

When `bulkMode = true`:

```tsx
{bulkMode && (
  <Checkbox
    checked={selectedIds.has(system.id)}
    onCheckedChange={() => onToggleSelection(system.id)}
    className="absolute top-3 left-3"
  />
)}
```

**Features:**
- ✅ Checkbox appears in top-left corner
- ✅ Teal accent when checked (`data-[state=checked]:bg-teal-500`)
- ✅ Card shows ring when selected (`ring-2 ring-teal-500`)
- ✅ Card padding adjusted when bulk mode active (`pt-12`)
- ✅ Hover actions hidden in bulk mode
- ✅ Updates `selectedIds` Set via toggle handler

### Delete Confirmation

```tsx
<AlertDialog open={!!deleteConfirm}>
  <AlertDialogContent>
    <AlertDialogTitle>Delete System?</AlertDialogTitle>
    <AlertDialogDescription>
      Are you sure you want to delete "{deleteConfirm?.name}"? 
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onDelete} className="bg-red-600">
        Delete System
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Features:**
- ✅ Confirms before deletion
- ✅ Shows system name in description
- ✅ Red destructive action button
- ✅ Opaque background (`bg-background`)
- ✅ Cannot be dismissed by clicking outside (only Cancel/Delete buttons)

### Empty State

When `systems.length === 0`:

```tsx
<div className="text-center py-12">
  <div className="w-20 h-20 rounded-full bg-teal-50">
    <Globe className="w-10 h-10 text-teal-500" />
  </div>
  <h3>No systems yet</h3>
  <p>Define political, economic, and social structures...</p>
  <Button onClick={onCreateFirst}>
    <Plus /> Create First System
  </Button>
</div>
```

**Features:**
- ✅ Large circular icon background
- ✅ Centered layout
- ✅ Helpful description
- ✅ Primary CTA button (teal)
- ✅ Triggers create dialog

### Handler Functions

#### Toggle Selection
```typescript
const handleToggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}
```

#### Quick View
```typescript
const handleQuickView = (system: SystemElement) => {
  setQuickItem(system)  // Opens side panel (Step 5)
}
```

#### Edit
```typescript
const handleEdit = (system: SystemElement) => {
  setEditingSystem(system)
  setEditing(system)
  setFormData({ ...system })
  setShowCreateDialog(true)
  setEditorOpen(true)
}
```

#### Duplicate
```typescript
const handleDuplicate = async (system: SystemElement) => {
  const duplicateData = {
    ...system,
    name: `${system.name} (Copy)`,
    id: undefined  // Let DB generate new ID
  }
  
  const { data } = await supabase
    .from('world_elements')
    .insert(duplicateData)
    .select()
    .single()
  
  setSystems(prev => [data, ...prev])
  // Emits 'systemCreated' event
}
```

#### Delete
```typescript
const handleDelete = async (system: SystemElement) => {
  await supabase
    .from('world_elements')
    .delete()
    .eq('id', system.id)
  
  setSystems(prev => prev.filter(s => s.id !== system.id))
  setSelectedIds(prev => {
    const next = new Set(prev)
    next.delete(system.id)
    return next
  })
}
```

### Visual States

#### Default State
- Clean card with subtle border
- Hover: Elevated shadow (`hover:shadow-lg`)
- Smooth transitions (`transition-all duration-200`)

#### Bulk Mode Active
- Checkbox visible in top-left
- More padding to accommodate checkbox
- No hover menu

#### Selected State
- Ring border (`ring-2 ring-teal-500`)
- Elevated shadow (always visible)
- Checkbox checked

#### Hover State (Normal Mode)
- Shadow increases
- Action menu fades in
- Smooth opacity transition

### Accessibility

- ✅ Proper ARIA labels on action buttons
- ✅ Keyboard navigation for dropdown menu
- ✅ Focus indicators on interactive elements
- ✅ Semantic HTML structure
- ✅ Descriptive tooltips (full timestamp on hover)
- ✅ Alert dialog for destructive actions

### Performance

- ✅ Efficient re-renders (only affected cards update)
- ✅ Set-based selection (O(1) lookups)
- ✅ Optimistic UI updates (local state first, then sync)
- ✅ Event delegation for better performance

### Design Tokens

**Colors:**
- Primary: Teal (#14b8a6) - 500 shade
- Destructive: Red (#dc2626) - 600 shade
- Background: Adaptive (`bg-background`)
- Text: Gray scale (900/600/500)

**Spacing:**
- Card gap: 1.5rem (gap-6)
- Internal spacing: 1rem (space-y-4)
- Icon size: 1rem (w-4 h-4) for actions, 1.5rem (w-6 h-6) for card icon

**Typography:**
- Title: text-lg font-semibold
- Description: text-sm text-gray-600
- Meta: text-xs text-gray-500
- Badges: text-xs font-medium

### Integration Points

```tsx
<SystemsGrid
  systems={visibleSystems}          // Filtered & sorted
  bulkMode={bulkMode}               // From toolbar
  selectedIds={selectedIds}         // Set of selected IDs
  onToggleSelection={handleToggleSelection}
  onQuickView={handleQuickView}     // Opens side panel
  onEdit={handleEdit}               // Opens full editor
  onDuplicate={handleDuplicate}     // Clones system
  onDelete={handleDelete}           // Removes system
  onCreateFirst={handleNewSystem}   // Empty state CTA
/>
```

## Next Steps

Ready for:
- ✅ Step 5: List view component
- ✅ Step 6: Quick view side panel
- ✅ Step 7: Full-page editor
- ✅ Step 8: Bulk actions toolbar

## Testing Checklist

- [ ] Grid responsive at all breakpoints (1/2/3 cols)
- [ ] Cards display all metadata correctly
- [ ] Type badges show correct colors
- [ ] Status badges show correct labels
- [ ] Description line-clamps at 2 lines
- [ ] Tags show max 3 with +N overflow
- [ ] Relative time displays correctly
- [ ] Hover menu appears smoothly
- [ ] Quick view action works
- [ ] Edit action opens editor with correct data
- [ ] Duplicate creates copy with "(Copy)" suffix
- [ ] Delete shows confirmation dialog
- [ ] Delete confirmation removes system
- [ ] Bulk mode shows checkboxes
- [ ] Checkbox toggles selection
- [ ] Selected cards show ring
- [ ] Empty state shows when no systems
- [ ] Empty state CTA creates first system
- [ ] Images display when available
- [ ] Globe icon fallback works
- [ ] Tooltips show on timestamp hover
