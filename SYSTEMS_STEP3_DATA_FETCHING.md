# Systems Panel - Step 3: Data Fetching & Derivation

## ✅ Step 3 Complete: Fetch & Derive Data

### Data Fetching Implementation

#### 1. **Supabase Query**
```typescript
const loadSystems = async () => {
  const { data, error } = await supabase
    .from('world_elements')
    .select('*')
    .eq('project_id', projectId)
    .eq('category', 'systems')
    .order('created_at', { ascending: false })

  // Filter out soft-deleted items
  const activeSystems = (data || []).filter(
    (system: any) => !system.attributes?.__deleted
  ) as SystemElement[]

  setSystems(activeSystems)
}
```

**Query Criteria:**
- ✅ Table: `world_elements`
- ✅ Filter: `project_id = currentProject`
- ✅ Filter: `category = 'systems'`
- ✅ Exclude: `attributes.__deleted != true` (soft-deleted items)
- ✅ Order: `created_at DESC` (newest first by default)

#### 2. **Effect Hooks**
```typescript
// Load on mount and project change
useEffect(() => { 
  loadSystems() 
}, [projectId])

// Handle external selection
useEffect(() => {
  if (selectedElement && selectedElement.category === 'systems') {
    setEditingSystem(selectedElement)
    setEditing(selectedElement as SystemElement)
    // ... open editor
  }
}, [selectedElement])
```

### Data Derivation

#### 1. **Computed Values**
```typescript
// Primary filtered/sorted list
const visibleSystems = applySearchSortFilter(systems, { query, sort, filters })

// Statistics
const totalSystems = systems.length
const filteredCount = visibleSystems.length
const hasActiveFilters = query.trim() !== '' || 
                        filters.types.length > 0 || 
                        filters.scopes.length > 0 || 
                        filters.status.length > 0
```

**visibleSystems** applies:
- ✅ Search query (name, description, type, scope, tags)
- ✅ Type filters (political, economic, social, etc.)
- ✅ Scope filters (global, regional, local, etc.)
- ✅ Status filters (active, historical, proposed, etc.)
- ✅ Sorting (name A→Z, Z→A, newest, oldest, type)

### Toolbar Integration

#### State Handlers Connected
```typescript
const handleClearFilters = () => {
  setFilters({ types: [], scopes: [], status: [] })
}

const handleNewSystem = () => {
  // Reset all editor state
  setEditingSystem(null)
  setEditing(null)
  setFormData({ ... })
  setShowCreateDialog(true)
  setEditorOpen(true)
}

const handleBulkModeChange = (enabled: boolean) => {
  setBulkMode(enabled)
  if (!enabled) {
    setSelectedIds(new Set()) // Clear selection when exiting
  }
}
```

#### Toolbar Props Wired
```tsx
<SystemsToolbar
  query={query}
  onQuery={setQuery}              // ✅ Updates query state
  sort={sort}
  onSort={setSort}                // ✅ Updates sort state
  filters={filters}
  onFilters={setFilters}          // ✅ Updates filter state
  view={view}
  onView={setView}                // ✅ Updates view state
  onNew={handleNewSystem}         // ✅ Opens editor
  bulkMode={bulkMode}
  onBulkMode={handleBulkModeChange} // ✅ Toggles bulk mode
  selectionCount={selectedIds.size} // ✅ Shows count
  onClearFilters={handleClearFilters} // ✅ Resets filters
/>
```

### UI Updates

#### 1. **Results Summary**
```tsx
{hasActiveFilters && (
  <div className="mb-4 text-sm text-gray-600">
    Showing <span className="font-semibold">{filteredCount}</span> of{' '}
    <span className="font-semibold">{totalSystems}</span> systems
  </div>
)}
```

#### 2. **Enhanced Empty States**
- **No systems at all:**
  - Icon, message, "Create First System" button
  
- **No results (filtered):**
  - Icon, "No systems match your filters" message
  - "Clear all filters" button to reset

#### 3. **Enhanced System Cards**
```tsx
{visibleSystems.map(system => (
  <Card>
    {/* Name & Delete button */}
    {/* Description */}
    
    {/* NEW: Type/Status/Scope badges */}
    <div className="flex gap-2 flex-wrap">
      {system.attributes?.type && (
        <Badge className={typeColor(system.attributes.type)}>
          {system.attributes.type}
        </Badge>
      )}
      {system.attributes?.status && (
        <Badge className={statusBadge(system.attributes.status).className}>
          {statusBadge(system.attributes.status).label}
        </Badge>
      )}
      {system.attributes?.scope && (
        <Badge className="bg-blue-50 text-blue-700">
          {system.attributes.scope}
        </Badge>
      )}
    </div>
    
    {/* Edit button & relative timestamp */}
    <span title={new Date(system.updated_at).toLocaleString()}>
      {relativeDate(system.updated_at)}
    </span>
  </Card>
))}
```

### Data Flow

```
User Action → State Update → Re-derive visibleSystems → Re-render Grid
     ↓              ↓                    ↓                    ↓
  Search      query = "..."    applySearchSortFilter()    Cards update
  Sort        sort = "newest"  applySearchSortFilter()    Cards reorder
  Filter      filters.types++  applySearchSortFilter()    Cards filter
  Create      POST → reload    loadSystems()              New card appears
```

### Improved Create/Update

#### Save Operation
```typescript
const handleCreateSystem = async () => {
  const systemData = {
    project_id: projectId,
    category: 'systems',
    name: formData.name,
    description: formData.description,
    attributes: {
      type: formData.type || undefined,
      scope: formData.scope || undefined,
      status: 'active', // Default status
      rules: formData.rules || undefined,
      participants: formData.participants || undefined
    },
    tags: []
  }
  
  if (editingSystem) {
    // Update existing
    const { data } = await supabase
      .from('world_elements')
      .update({ ...systemData, updated_at: new Date().toISOString() })
      .eq('id', editingSystem.id)
      .select()
      .single()
    
    // Update local state
    setSystems(prev => prev.map(s => s.id === editingSystem.id ? data : s))
  } else {
    // Create new
    const { data } = await supabase
      .from('world_elements')
      .insert(systemData)
      .select()
      .single()
    
    // Add to local state
    setSystems(prev => [data, ...prev])
  }
  
  // Emit event for timeline/other panels
  window.dispatchEvent(new CustomEvent('systemCreated', { 
    detail: { system: result, projectId } 
  }))
}
```

### Loading State

Enhanced loading skeleton:
```tsx
{loading && (
  <div className="h-full bg-white p-6 overflow-y-auto">
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
)}
```

## Reactive Updates

All state changes automatically trigger re-derivation:
- ✅ `query` change → visibleSystems updates
- ✅ `sort` change → visibleSystems re-sorts
- ✅ `filters` change → visibleSystems filters
- ✅ `systems` change (add/update/delete) → visibleSystems updates
- ✅ Any combination of above

## Performance

- Uses computed values (recalculated on each render, but fast)
- Filter/sort happens in-memory (no additional API calls)
- State updates are batched by React
- Grid renders only visible items

## Next Steps

Ready for:
- ✅ Step 4: Grid vs List view rendering
- ✅ Step 5: Bulk operations UI
- ✅ Step 6: Quick view panel
- ✅ Step 7: Full-page editor

## Testing Checklist

- [ ] Load systems on mount
- [ ] Filter by search query
- [ ] Filter by type/scope/status
- [ ] Sort by different criteria
- [ ] Combine search + filters + sort
- [ ] Create new system appears in correct sort position
- [ ] Update system maintains filter/sort
- [ ] Clear filters shows all systems
- [ ] Empty states work correctly
- [ ] Loading skeleton displays
- [ ] Relative timestamps update
- [ ] Badges show correct colors
