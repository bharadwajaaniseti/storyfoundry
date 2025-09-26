'use client'

import React, { useReducer, useEffect, useCallback, useState } from 'react'
import { Plus, Save, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupabaseClient } from '@/lib/auth'
import { EncyclopediaEntry, EncyclopediaBlock, EntryType, BlockType } from '@/types/encyclopedia'
import { ENTRY_TYPES, BLOCK_TYPES } from '@/lib/encyclopedia-config'
import { BlockShell } from './BlockShell'
import { createBlock } from './blocks'
import { EntryRightSidebar } from './EntryRightSidebar'
import { EntryPreview } from './EntryPreview'

interface EntryBuilderState {
  entry: EncyclopediaEntry
  blocks: EncyclopediaBlock[]
  isPreviewMode: boolean
  isSaving: boolean
  lastSaved?: string
}

type EntryBuilderAction = 
  | { type: 'SET_ENTRY'; payload: EncyclopediaEntry }
  | { type: 'SET_BLOCKS'; payload: EncyclopediaBlock[] }
  | { type: 'ADD_BLOCK'; payload: { type: BlockType; position: number } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; data: any; title?: string } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'REORDER_BLOCKS'; payload: { oldIndex: number; newIndex: number } }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: string }
  | { type: 'UPDATE_ENTRY_FIELD'; payload: { field: keyof EncyclopediaEntry; value: any } }

const entryBuilderReducer = (state: EntryBuilderState, action: EntryBuilderAction): EntryBuilderState => {
  switch (action.type) {
    case 'SET_ENTRY':
      return { ...state, entry: action.payload }
    
    case 'SET_BLOCKS':
      return { ...state, blocks: action.payload }
    
    case 'ADD_BLOCK': {
      const newBlock: EncyclopediaBlock = {
        id: `temp-${Date.now()}`,
        entry_id: state.entry.id,
        type: action.payload.type,
        position: action.payload.position,
        title: BLOCK_TYPES[action.payload.type].label,
        data: BLOCK_TYPES[action.payload.type].defaultData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const updatedBlocks = [...state.blocks]
      updatedBlocks.splice(action.payload.position, 0, newBlock)
      
      // Update positions
      updatedBlocks.forEach((block, index) => {
        block.position = index
      })
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(block =>
          block.id === action.payload.id
            ? { 
                ...block, 
                data: action.payload.data,
                title: action.payload.title ?? block.title,
                updated_at: new Date().toISOString()
              }
            : block
        )
      }
    
    case 'DELETE_BLOCK': {
      const updatedBlocks = state.blocks
        .filter(block => block.id !== action.payload)
        .map((block, index) => ({ ...block, position: index }))
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'REORDER_BLOCKS': {
      const { oldIndex, newIndex } = action.payload
      const updatedBlocks = [...state.blocks]
      const [movedBlock] = updatedBlocks.splice(oldIndex, 1)
      updatedBlocks.splice(newIndex, 0, movedBlock)
      
      // Update positions
      updatedBlocks.forEach((block, index) => {
        block.position = index
      })
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'DUPLICATE_BLOCK': {
      const blockToDuplicate = state.blocks.find(b => b.id === action.payload)
      if (!blockToDuplicate) return state
      
      const duplicatedBlock: EncyclopediaBlock = {
        ...blockToDuplicate,
        id: `temp-${Date.now()}`,
        title: `${blockToDuplicate.title} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const insertIndex = blockToDuplicate.position + 1
      const updatedBlocks = [...state.blocks]
      updatedBlocks.splice(insertIndex, 0, duplicatedBlock)
      
      // Update positions
      updatedBlocks.forEach((block, index) => {
        block.position = index
      })
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'TOGGLE_PREVIEW':
      return { ...state, isPreviewMode: !state.isPreviewMode }
    
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload }
    
    case 'UPDATE_ENTRY_FIELD':
      return {
        ...state,
        entry: {
          ...state.entry,
          [action.payload.field]: action.payload.value,
          updated_at: new Date().toISOString()
        }
      }
    
    default:
      return state
  }
}

interface EntryBuilderProps {
  projectId: string
  entryId?: string
  onSave?: (entry: EncyclopediaEntry) => void
  onCancel?: () => void
}

export default function EntryBuilder({ projectId, entryId, onSave, onCancel }: EntryBuilderProps) {
  const supabase = createSupabaseClient()
  
  const [state, dispatch] = useReducer(entryBuilderReducer, {
    entry: {
      id: entryId || `temp-${Date.now()}`,
      project_id: projectId,
      title: 'New Encyclopedia Entry',
      type: 'concept' as EntryType,
      slug: '',
      tags: [],
      pronunciation: '',
      status: 'draft' as const,
      visibility: 'private' as const,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    blocks: [],
    isPreviewMode: false,
    isSaving: false
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load existing entry if editing
  useEffect(() => {
    if (entryId && entryId !== state.entry.id) {
      loadEntry(entryId)
    }
  }, [entryId])

  const loadEntry = async (id: string) => {
    try {
      const { data: entry, error: entryError } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (entryError) throw entryError

      const { data: blocks, error: blocksError } = await supabase
        .from('encyclopedia_blocks')
        .select('*')
        .eq('entry_id', id)
        .order('position', { ascending: true })

      if (blocksError) throw blocksError

      dispatch({ type: 'SET_ENTRY', payload: entry })
      dispatch({ type: 'SET_BLOCKS', payload: blocks || [] })
    } catch (error) {
      console.error('Error loading entry:', error)
    }
  }

  // Simple autosave with setTimeout
  useEffect(() => {
    if (state.entry.title.trim() === '') return
    
    const timeout = setTimeout(() => {
      saveEntry()
    }, 1500)
    
    return () => clearTimeout(timeout)
  }, [state.entry, state.blocks])

  const saveEntry = async () => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true })
      
      const isNewEntry = state.entry.id.startsWith('temp-')
      
      if (isNewEntry) {
        // Create new entry
        const { id, created_at, updated_at, ...entryData } = state.entry
        entryData.slug = entryData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        const { data: newEntry, error: entryError } = await supabase
          .from('encyclopedia_entries')
          .insert(entryData)
          .select()
          .single()

        if (entryError) throw entryError

        // Save blocks
        const blocksToSave = state.blocks.map(block => ({
          ...block,
          entry_id: newEntry.id,
          id: block.id.startsWith('temp-') ? undefined : block.id
        }))

        if (blocksToSave.length > 0) {
          const { error: blocksError } = await supabase
            .from('encyclopedia_blocks')
            .insert(blocksToSave)

          if (blocksError) throw blocksError
        }

        dispatch({ type: 'SET_ENTRY', payload: newEntry })
        onSave?.(newEntry)
      } else {
        // Update existing entry
        const { id, created_at, ...entryData } = state.entry
        
        const { data: updatedEntry, error: entryError } = await supabase
          .from('encyclopedia_entries')
          .update(entryData)
          .eq('id', id)
          .select()
          .single()

        if (entryError) throw entryError

        // Update blocks - delete and recreate for simplicity
        await supabase
          .from('encyclopedia_blocks')
          .delete()
          .eq('entry_id', id)

        const blocksToSave = state.blocks.map(block => ({
          ...block,
          id: block.id.startsWith('temp-') ? undefined : block.id
        }))

        if (blocksToSave.length > 0) {
          const { error: blocksError } = await supabase
            .from('encyclopedia_blocks')
            .insert(blocksToSave)

          if (blocksError) throw blocksError
        }

        dispatch({ type: 'SET_ENTRY', payload: updatedEntry })
        onSave?.(updatedEntry)
      }

      dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
    } catch (error) {
      console.error('Error saving entry:', error)
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }

  const addBlock = (type: BlockType, position: number) => {
    dispatch({ type: 'ADD_BLOCK', payload: { type, position } })
  }

  const updateBlock = (id: string, data: any, title?: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, data, title } })
  }

  const deleteBlock = (id: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: id })
  }

  const duplicateBlock = (id: string) => {
    dispatch({ type: 'DUPLICATE_BLOCK', payload: id })
  }

  const entryTypeConfig = ENTRY_TYPES[state.entry.type]

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className={`p-2 rounded-lg ${entryTypeConfig.bgColor} ${entryTypeConfig.borderColor} border`}>
                <entryTypeConfig.icon className={`w-5 h-5 ${entryTypeConfig.color}`} />
              </div>
              
              <div className="flex-1 max-w-md">
                <Input
                  value={state.entry.title}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_ENTRY_FIELD', 
                    payload: { field: 'title', value: e.target.value }
                  })}
                  placeholder="Entry title..."
                  className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <Select 
                value={state.entry.type} 
                onValueChange={(value: EntryType) => dispatch({ 
                  type: 'UPDATE_ENTRY_FIELD', 
                  payload: { field: 'type', value }
                })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ENTRY_TYPES).map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {state.isSaving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              {state.lastSaved && !state.isSaving && (
                <span className="text-sm text-gray-400">
                  Saved {new Date(state.lastSaved).toLocaleTimeString()}
                </span>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
              >
                <Eye className="w-4 h-4 mr-1" />
                {state.isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              
              <Button
                size="sm"
                onClick={saveEntry}
                disabled={state.isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Secondary header with tags and pronunciation */}
          <div className="flex items-center gap-4 mt-3">
            <Input
              value={state.entry.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                dispatch({ type: 'UPDATE_ENTRY_FIELD', payload: { field: 'tags', value: tags } })
              }}
              placeholder="Tags (comma separated)..."
              className="flex-1 text-sm"
            />
            <Input
              value={state.entry.pronunciation || ''}
              onChange={(e) => dispatch({ 
                type: 'UPDATE_ENTRY_FIELD', 
                payload: { field: 'pronunciation', value: e.target.value }
              })}
              placeholder="Pronunciation..."
              className="w-48 text-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {state.isPreviewMode ? (
            <EntryPreview entry={state.entry} blocks={state.blocks} />
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {state.blocks.map((block, index) => (
                  <BlockShell
                    key={block.id}
                    block={block}
                    onUpdate={(data: any, title?: string) => updateBlock(block.id, data, title)}
                    onDelete={() => deleteBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onAddAfter={(type: BlockType) => addBlock(type, index + 1)}
                  >
                    {createBlock(block, (data: any) => updateBlock(block.id, data))}
                  </BlockShell>
                ))}

                {/* Add first block */}
                {state.blocks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Plus className="w-12 h-12 mx-auto mb-2" />
                      <p>Start building your encyclopedia entry</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.values(BLOCK_TYPES).slice(0, 4).map(blockType => (
                        <Button
                          key={blockType.id}
                          variant="outline"
                          onClick={() => addBlock(blockType.id, 0)}
                          className="flex items-center gap-2"
                        >
                          <blockType.icon className={`w-4 h-4 ${blockType.color}`} />
                          {blockType.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {sidebarOpen && (
        <EntryRightSidebar
          entry={state.entry}
          onLoadTemplate={(blocks: EncyclopediaBlock[]) => dispatch({ type: 'SET_BLOCKS', payload: blocks })}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

interface EntryBuilderState {
  entry: EncyclopediaEntry
  blocks: EncyclopediaBlock[]
  isPreviewMode: boolean
  isSaving: boolean
  lastSaved?: string
}

type EntryBuilderAction = 
  | { type: 'SET_ENTRY'; payload: EncyclopediaEntry }
  | { type: 'SET_BLOCKS'; payload: EncyclopediaBlock[] }
  | { type: 'ADD_BLOCK'; payload: { type: BlockType; position: number } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; data: any; title?: string } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'REORDER_BLOCKS'; payload: { oldIndex: number; newIndex: number } }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: string }
  | { type: 'UPDATE_ENTRY_FIELD'; payload: { field: keyof EncyclopediaEntry; value: any } }

const entryBuilderReducer = (state: EntryBuilderState, action: EntryBuilderAction): EntryBuilderState => {
  switch (action.type) {
    case 'SET_ENTRY':
      return { ...state, entry: action.payload }
    
    case 'SET_BLOCKS':
      return { ...state, blocks: action.payload }
    
    case 'ADD_BLOCK': {
      const newBlock: EncyclopediaBlock = {
        id: `temp-${Date.now()}`,
        entry_id: state.entry.id,
        type: action.payload.type,
        position: action.payload.position,
        title: BLOCK_TYPES[action.payload.type].label,
        data: BLOCK_TYPES[action.payload.type].defaultData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const updatedBlocks = [...state.blocks]
      updatedBlocks.splice(action.payload.position, 0, newBlock)
      
      // Update positions
      updatedBlocks.forEach((block, index) => {
        block.position = index
      })
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(block =>
          block.id === action.payload.id
            ? { 
                ...block, 
                data: action.payload.data,
                title: action.payload.title ?? block.title,
                updated_at: new Date().toISOString()
              }
            : block
        )
      }
    
    case 'DELETE_BLOCK': {
      const updatedBlocks = state.blocks
        .filter(block => block.id !== action.payload)
        .map((block, index) => ({ ...block, position: index }))
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'REORDER_BLOCKS': {
      const updatedBlocks = arrayMove(state.blocks, action.payload.oldIndex, action.payload.newIndex)
        .map((block, index) => ({ ...block, position: index }))
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'DUPLICATE_BLOCK': {
      const blockToDuplicate = state.blocks.find(b => b.id === action.payload)
      if (!blockToDuplicate) return state
      
      const duplicatedBlock: EncyclopediaBlock = {
        ...blockToDuplicate,
        id: `temp-${Date.now()}`,
        title: `${blockToDuplicate.title} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const insertIndex = blockToDuplicate.position + 1
      const updatedBlocks = [...state.blocks]
      updatedBlocks.splice(insertIndex, 0, duplicatedBlock)
      
      // Update positions
      updatedBlocks.forEach((block, index) => {
        block.position = index
      })
      
      return { ...state, blocks: updatedBlocks }
    }
    
    case 'TOGGLE_PREVIEW':
      return { ...state, isPreviewMode: !state.isPreviewMode }
    
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload }
    
    case 'UPDATE_ENTRY_FIELD':
      return {
        ...state,
        entry: {
          ...state.entry,
          [action.payload.field]: action.payload.value,
          updated_at: new Date().toISOString()
        }
      }
    
    default:
      return state
  }
}

interface EntryBuilderProps {
  projectId: string
  entryId?: string
  onSave?: (entry: EncyclopediaEntry) => void
  onCancel?: () => void
}

export default function EntryBuilder({ projectId, entryId, onSave, onCancel }: EntryBuilderProps) {
  const supabase = createSupabaseClient()
  
  const [state, dispatch] = useReducer(entryBuilderReducer, {
    entry: {
      id: entryId || `temp-${Date.now()}`,
      project_id: projectId,
      title: 'New Encyclopedia Entry',
      type: 'concept' as EntryType,
      slug: '',
      tags: [],
      pronunciation: '',
      status: 'draft' as const,
      visibility: 'private' as const,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    blocks: [],
    isPreviewMode: false,
    isSaving: false
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load existing entry if editing
  useEffect(() => {
    if (entryId && entryId !== state.entry.id) {
      loadEntry(entryId)
    }
  }, [entryId])

  const loadEntry = async (id: string) => {
    try {
      const { data: entry, error: entryError } = await supabase
        .from('encyclopedia_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (entryError) throw entryError

      const { data: blocks, error: blocksError } = await supabase
        .from('encyclopedia_blocks')
        .select('*')
        .eq('entry_id', id)
        .order('position', { ascending: true })

      if (blocksError) throw blocksError

      dispatch({ type: 'SET_ENTRY', payload: entry })
      dispatch({ type: 'SET_BLOCKS', payload: blocks || [] })
    } catch (error) {
      console.error('Error loading entry:', error)
    }
  }

  // Autosave with debounce
  const debouncedSave = useDebouncedCallback(async () => {
    if (state.entry.title.trim() === '') return
    
    await saveEntry()
  }, 1500)

  useEffect(() => {
    debouncedSave()
  }, [state.entry, state.blocks])

  const saveEntry = async () => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true })
      
      const isNewEntry = state.entry.id.startsWith('temp-')
      
      if (isNewEntry) {
        // Create new entry
        const { id, created_at, updated_at, ...entryData } = state.entry
        entryData.slug = entryData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        const { data: newEntry, error: entryError } = await supabase
          .from('encyclopedia_entries')
          .insert(entryData)
          .select()
          .single()

        if (entryError) throw entryError

        // Save blocks
        const blocksToSave = state.blocks.map(block => ({
          ...block,
          entry_id: newEntry.id,
          id: block.id.startsWith('temp-') ? undefined : block.id
        }))

        if (blocksToSave.length > 0) {
          const { error: blocksError } = await supabase
            .from('encyclopedia_blocks')
            .insert(blocksToSave)

          if (blocksError) throw blocksError
        }

        dispatch({ type: 'SET_ENTRY', payload: newEntry })
        onSave?.(newEntry)
      } else {
        // Update existing entry
        const { id, created_at, ...entryData } = state.entry
        
        const { data: updatedEntry, error: entryError } = await supabase
          .from('encyclopedia_entries')
          .update(entryData)
          .eq('id', id)
          .select()
          .single()

        if (entryError) throw entryError

        // Update blocks - delete and recreate for simplicity
        await supabase
          .from('encyclopedia_blocks')
          .delete()
          .eq('entry_id', id)

        const blocksToSave = state.blocks.map(block => ({
          ...block,
          id: block.id.startsWith('temp-') ? undefined : block.id
        }))

        if (blocksToSave.length > 0) {
          const { error: blocksError } = await supabase
            .from('encyclopedia_blocks')
            .insert(blocksToSave)

          if (blocksError) throw blocksError
        }

        dispatch({ type: 'SET_ENTRY', payload: updatedEntry })
        onSave?.(updatedEntry)
      }

      dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
    } catch (error) {
      console.error('Error saving entry:', error)
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = state.blocks.findIndex(block => block.id === active.id)
      const newIndex = state.blocks.findIndex(block => block.id === over.id)

      dispatch({ type: 'REORDER_BLOCKS', payload: { oldIndex, newIndex } })
    }
  }

  const addBlock = (type: BlockType, position: number) => {
    dispatch({ type: 'ADD_BLOCK', payload: { type, position } })
  }

  const updateBlock = (id: string, data: any, title?: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, data, title } })
  }

  const deleteBlock = (id: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: id })
  }

  const duplicateBlock = (id: string) => {
    dispatch({ type: 'DUPLICATE_BLOCK', payload: id })
  }

  const entryTypeConfig = ENTRY_TYPES[state.entry.type]

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className={`p-2 rounded-lg ${entryTypeConfig.bgColor} ${entryTypeConfig.borderColor} border`}>
                <entryTypeConfig.icon className={`w-5 h-5 ${entryTypeConfig.color}`} />
              </div>
              
              <div className="flex-1 max-w-md">
                <Input
                  value={state.entry.title}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_ENTRY_FIELD', 
                    payload: { field: 'title', value: e.target.value }
                  })}
                  placeholder="Entry title..."
                  className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <Select 
                value={state.entry.type} 
                onValueChange={(value: EntryType) => dispatch({ 
                  type: 'UPDATE_ENTRY_FIELD', 
                  payload: { field: 'type', value }
                })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ENTRY_TYPES).map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {state.isSaving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              {state.lastSaved && !state.isSaving && (
                <span className="text-sm text-gray-400">
                  Saved {new Date(state.lastSaved).toLocaleTimeString()}
                </span>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
              >
                <Eye className="w-4 h-4 mr-1" />
                {state.isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              
              <Button
                size="sm"
                onClick={saveEntry}
                disabled={state.isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Secondary header with tags and pronunciation */}
          <div className="flex items-center gap-4 mt-3">
            <Input
              value={state.entry.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                dispatch({ type: 'UPDATE_ENTRY_FIELD', payload: { field: 'tags', value: tags } })
              }}
              placeholder="Tags (comma separated)..."
              className="flex-1 text-sm"
            />
            <Input
              value={state.entry.pronunciation || ''}
              onChange={(e) => dispatch({ 
                type: 'UPDATE_ENTRY_FIELD', 
                payload: { field: 'pronunciation', value: e.target.value }
              })}
              placeholder="Pronunciation..."
              className="w-48 text-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {state.isPreviewMode ? (
            <EntryPreview entry={state.entry} blocks={state.blocks} />
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={state.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {state.blocks.map((block, index) => (
                      <BlockShell
                        key={block.id}
                        block={block}
                        onUpdate={(data, title) => updateBlock(block.id, data, title)}
                        onDelete={() => deleteBlock(block.id)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onAddAfter={(type) => addBlock(type, index + 1)}
                      >
                        {createBlock(block, (data) => updateBlock(block.id, data))}
                      </BlockShell>
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Add first block */}
                {state.blocks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Plus className="w-12 h-12 mx-auto mb-2" />
                      <p>Start building your encyclopedia entry</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.values(BLOCK_TYPES).slice(0, 4).map(blockType => (
                        <Button
                          key={blockType.id}
                          variant="outline"
                          onClick={() => addBlock(blockType.id, 0)}
                          className="flex items-center gap-2"
                        >
                          <blockType.icon className={`w-4 h-4 ${blockType.color}`} />
                          {blockType.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {sidebarOpen && (
        <EntryRightSidebar
          entry={state.entry}
          onLoadTemplate={(blocks) => dispatch({ type: 'SET_BLOCKS', payload: blocks })}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}