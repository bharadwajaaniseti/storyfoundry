# Enhanced Encyclopedia System - Feature Implementation Guide

## Overview
This enhanced encyclopedia system brings advanced features inspired by Campfire Writing's encyclopedia module, providing a comprehensive wiki-style knowledge base for worldbuilding projects.

## Key Features Implemented

### 1. **Flexible Section-Based Articles**
- **Dynamic Sections**: Articles are now composed of flexible, reorderable sections
- **Section Types**:
  - **Subheader**: For organizing content with headers
  - **Paragraph**: For rich text content
  - **Table/Stats**: For structured data and statistics
  - **Image**: For visual content with captions
  - **Summary Box**: For key facts and quick reference data

### 2. **Advanced Organization System**
- **Folders**: Create colored folders to organize articles by category
- **Hierarchical Structure**: Nested folder support for complex organization schemes
- **Expandable/Collapsible**: Folders can be expanded or collapsed for better navigation

### 3. **Template System**
- **Default Template**: Pre-configured article structure with common sections
- **Custom Templates**: Create and save custom templates for different article types
- **Template-Based Creation**: New articles inherit structure from templates

### 4. **Enhanced Content Management**
- **Drag-and-Drop**: Reorder sections within articles
- **Section Visibility**: Show/hide sections without deleting content
- **Section Duplication**: Quickly duplicate sections with similar content
- **Rich Metadata**: Enhanced tags, types, and categorization

### 5. **Improved User Experience**
- **Dual-Pane Interface**: Sidebar navigation with detailed content view
- **Live Search**: Real-time search across article content and metadata
- **Multi-Filter System**: Filter by type, folder, and search terms
- **Visual Indicators**: Color-coded types and folder organization

## Database Schema Changes

### New Tables
1. **encyclopedia_folders**: Manages folder organization
2. **encyclopedia_templates**: Stores article templates

### Enhanced Columns
- **world_elements.sections**: JSONB array of article sections
- **world_elements.folder_id**: Reference to organizing folder
- **world_elements.template_id**: Reference to template used

## Section Structure

Each article section follows this structure:
```json
{
  "id": "unique-section-id",
  "type": "subheader|paragraph|table|stats|image|summary",
  "title": "Optional section title",
  "content": "Section content (varies by type)",
  "order": 0,
  "visible": true
}
```

### Section Content Types

#### Paragraph Section
```json
{
  "type": "paragraph",
  "content": "Plain text content with line breaks preserved"
}
```

#### Table/Stats Section
```json
{
  "type": "stats",
  "content": {
    "rows": [
      {"key": "Label", "value": "Value"},
      {"key": "Another Label", "value": "Another Value"}
    ]
  }
}
```

#### Image Section
```json
{
  "type": "image",
  "content": {
    "url": "https://example.com/image.jpg",
    "caption": "Optional image caption"
  }
}
```

#### Summary Box Section
```json
{
  "type": "summary",
  "content": {
    "facts": [
      {"label": "Fact Label", "value": "Fact Value"},
      {"label": "Another Fact", "value": "Another Value"}
    ]
  }
}
```

## Advanced Features Beyond Campfire Writing

### 1. **Enhanced Search & Filtering**
- Multi-criteria filtering (type, folder, search)
- Real-time search across all content
- Tag-based filtering with visual indicators

### 2. **Improved Section Management**
- Visual drag-and-drop reordering
- Section visibility toggling
- One-click section duplication
- Contextual section menus

### 3. **Better Organization**
- Colored folder system
- Entry count indicators
- Expandable folder tree
- Folder-based filtering

### 4. **Enhanced Metadata**
- Comprehensive tagging system
- Type-based color coding
- Pronunciation guides
- Etymology tracking
- Related terms linking

## Usage Guide

### Creating a New Article
1. Click "Add Entry" button
2. Choose article type and folder (optional)
3. Add title and basic metadata
4. Use section-based editor to build content
5. Drag sections to reorder as needed
6. Save when complete

### Organizing with Folders
1. Click the folder+ icon to create new folders
2. Choose folder colors for visual organization
3. Drag entries into folders or use folder dropdown
4. Expand/collapse folders for better navigation

### Working with Sections
- **Add Sections**: Use dropdown to add different section types
- **Reorder**: Drag sections using the handle icon
- **Edit Content**: Click into sections to edit content
- **Toggle Visibility**: Use eye icon to show/hide sections
- **Duplicate**: Use copy icon to duplicate sections
- **Delete**: Use trash icon to remove sections

### Search and Filter
- Use search bar for real-time content search
- Filter by article type using dropdown
- Filter by folder to focus on specific categories
- Combine filters for precise results

## Implementation Notes

### Performance Considerations
- JSONB indexing for fast section queries
- Lazy loading for large article lists
- Optimized re-rendering for drag operations

### Accessibility Features
- Keyboard navigation support
- Screen reader compatible
- High contrast visual indicators
- Focus management for modals

### Future Enhancements
- **Cross-Reference Links**: Link articles to each other
- **Version History**: Track article changes over time
- **Export Options**: PDF, Markdown, or HTML export
- **Collaborative Editing**: Real-time collaborative editing
- **Advanced Templates**: More complex template options
- **Import/Export**: Bulk import/export of articles

## Migration Notes

Existing encyclopedia entries will continue to work with the enhanced system:
- Legacy entries display using fallback rendering
- Can be edited to use new section system
- Automatic migration to new format on first edit

## Technical Integration

The enhanced encyclopedia integrates with:
- Existing project permission system
- Real-time collaboration features
- Search and indexing systems
- Export and backup functionality

This implementation provides a robust, scalable encyclopedia system that matches and exceeds the functionality of commercial worldbuilding tools while maintaining compatibility with existing data.