'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Plus, 
  Globe, 
  Search, 
  Trash2, 
  Edit3, 
  Filter, 
  X, 
  Grid3x3, 
  List, 
  CheckSquare,
  ArrowUpDown,
  Eye,
  Copy,
  MoreHorizontal,
  Download,
  Tag,
  Undo2,
  ArrowLeft,
  AlertCircle,
  MoreVertical,
  Package,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  FileText, 
  Network, 
  Activity, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sliders 
} from 'lucide-react'
import MediaItemInput, { MediaItem } from '@/components/cultures/MediaItemInput'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SystemType = 
  | 'political'
  | 'economic'
  | 'social'
  | 'religious'
  | 'legal'
  | 'military'
  | 'educational'
  | 'cultural'
  | 'magical'
  | 'technological'

export type SystemScope = 
  | 'global'
  | 'regional'
  | 'local'
  | 'organizational'
  | 'individual'

export type SystemStatus = 
  | 'active'
  | 'historical'
  | 'proposed'
  | 'defunct'
  | 'evolving'

export interface LinkRef {
  id: string
  name: string
  category: string
}

export interface SystemElement {
  id: string
  project_id: string
  category: 'systems'
  name: string
  description: string
  attributes?: {
    type?: SystemType
    scope?: SystemScope
    status?: SystemStatus
    rules?: string
    participants?: string
    images?: MediaItem[] | string[]  // Support both formats for backward compatibility
    [key: string]: any
  }
  tags?: string[]
  links?: LinkRef[]
  created_at: string
  updated_at: string
}

export type ViewMode = 'grid' | 'list'
export type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'type_asc'

export interface FilterState {
  types: string[]
  scopes: string[]
  status: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply search, sort, and filter to a list of systems
 */
export function applySearchSortFilter(
  list: SystemElement[],
  options: {
    query: string
    sort: SortOption
    filters: FilterState
  }
): SystemElement[] {
  let filtered = [...list]

  // Apply search query
  if (options.query.trim()) {
    const q = options.query.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.attributes?.type?.toLowerCase().includes(q) ||
      item.attributes?.scope?.toLowerCase().includes(q) ||
      item.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }

  // Apply type filters
  if (options.filters.types.length > 0) {
    filtered = filtered.filter(item => 
      item.attributes?.type && options.filters.types.includes(item.attributes.type)
    )
  }

  // Apply scope filters
  if (options.filters.scopes.length > 0) {
    filtered = filtered.filter(item => 
      item.attributes?.scope && options.filters.scopes.includes(item.attributes.scope)
    )
  }

  // Apply status filters
  if (options.filters.status.length > 0) {
    filtered = filtered.filter(item => 
      item.attributes?.status && options.filters.status.includes(item.attributes.status)
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (options.sort) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'type_asc':
        return (a.attributes?.type || '').localeCompare(b.attributes?.type || '')
      default:
        return 0
    }
  })

  return filtered
}

/**
 * Convert ISO date string to relative time
 */
export function relativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

/**
 * Get color class for system type
 */
export function typeColor(type: SystemType | string | undefined): string {
  switch (type) {
    case 'political': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'economic': return 'bg-green-100 text-green-700 border-green-200'
    case 'social': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'religious': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'legal': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'military': return 'bg-red-100 text-red-700 border-red-200'
    case 'educational': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'cultural': return 'bg-pink-100 text-pink-700 border-pink-200'
    case 'magical': return 'bg-violet-100 text-violet-700 border-violet-200'
    case 'technological': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

/**
 * Generate badge component for system status
 */
export function statusBadge(status: SystemStatus | string | undefined): {
  label: string
  className: string
} {
  switch (status) {
    case 'active':
      return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' }
    case 'historical':
      return { label: 'Historical', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'proposed':
      return { label: 'Proposed', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'defunct':
      return { label: 'Defunct', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    case 'evolving':
      return { label: 'Evolving', className: 'bg-purple-100 text-purple-700 border-purple-200' }
    default:
      return { label: 'Unknown', className: 'bg-gray-100 text-gray-500 border-gray-200' }
  }
}

/**
 * Extract the first image URL from either MediaItem[] or string[] format
 */
function getFirstImageUrl(images: MediaItem[] | string[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined
  
  // Check if it's the new MediaItem[] format
  if (typeof images[0] === 'object' && 'imageUrls' in images[0]) {
    const firstItem = images[0] as MediaItem
    return firstItem.imageUrls?.[0]
  }
  
  // Old string[] format
  return images[0] as string
}

/**
 * Extract all image URLs from either MediaItem[] or string[] format
 */
function getAllImageUrls(images: MediaItem[] | string[] | undefined): string[] {
  if (!images || images.length === 0) return []
  
  // Check if it's the new MediaItem[] format
  if (typeof images[0] === 'object' && 'imageUrls' in images[0]) {
    return (images as MediaItem[]).flatMap(item => item.imageUrls || [])
  }
  
  // Old string[] format
  return images as string[]
}

/**
 * Delete all images from storage for a system
 */
async function deleteSystemImages(system: SystemElement, storageBucket: string = 'system-images') {
  const images = system.attributes?.images
  if (!images || !Array.isArray(images) || images.length === 0) {
    return // No images to delete
  }

  try {
    const supabase = createSupabaseClient()
    const filePaths: string[] = []

    // Handle both old string[] and new MediaItem[] formats
    if (typeof images[0] === 'string') {
      // Old format: array of URL strings
      for (const imageUrl of images as string[]) {
        const urlParts = imageUrl.split(`/${storageBucket}/`)
        if (urlParts.length === 2) {
          filePaths.push(urlParts[1])
        }
      }
    } else if (typeof images[0] === 'object' && 'imageUrls' in images[0]) {
      // New format: MediaItem[]
      for (const item of images as MediaItem[]) {
        if (item.imageUrls) {
          for (const imageUrl of item.imageUrls) {
            const urlParts = imageUrl.split(`/${storageBucket}/`)
            if (urlParts.length === 2) {
              filePaths.push(urlParts[1])
            }
          }
        }
      }
    }

    // Delete all files from storage
    if (filePaths.length > 0) {
      const { error } = await supabase.storage
        .from(storageBucket)
        .remove(filePaths)

      if (error) {
        console.error('Error deleting system images from storage:', error)
      } else {
        console.log(`✓ Deleted ${filePaths.length} image(s) from storage for system: ${system.name}`)
      }
    }
  } catch (error) {
    console.error('Error during system image deletion:', error)
  }
}

// ============================================================================
// GRID VIEW COMPONENT
// ============================================================================

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
  viewMode?: 'grid' | 'list'
}

function SystemsGrid({
  systems,
  bulkMode,
  selectedIds,
  onToggleSelection,
  onQuickView,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateFirst,
  viewMode = 'grid'
}: SystemsGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<SystemElement | null>(null)

  // Empty state
  if (systems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 mb-6 shadow-sm">
          <Globe className="w-10 h-10 text-teal-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No systems yet</h3>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Define political, economic, and social structures that shape your world
        </p>
        <Button 
          onClick={onCreateFirst} 
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2.5 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First System
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' 
        : 'flex flex-col gap-3'
      }>
        {systems.map(system => {
          const isSelected = selectedIds.has(system.id)
          const systemType = system.attributes?.type
          const status = system.attributes?.status
          const scope = system.attributes?.scope
          const imageUrl = getFirstImageUrl(system.attributes?.images)
          const statusInfo = statusBadge(status)

          // List View Rendering
          if (viewMode === 'list') {
            return (
              <Card 
                key={system.id} 
                className={`group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-teal-500/0 before:via-teal-500/5 before:to-emerald-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 ${
                  isSelected ? 'ring-2 ring-teal-500 shadow-md' : ''
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
                  if (!bulkMode) onQuickView(system);
                }}
              >
                <CardContent className="p-3.5 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Icon Column */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                      {imageUrl ? (
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-teal-200/60 group-hover:border-teal-300 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <img 
                            src={imageUrl} 
                            alt={system.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-teal-50 via-teal-50 to-emerald-50 flex items-center justify-center border border-teal-200/60 group-hover:border-teal-300 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <Globe className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      {bulkMode && (
                        <div className="absolute -top-1 -left-1 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelection(system.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white shadow-md border-2"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Name & Description Column */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-teal-700 transition-colors duration-300">
                        {system.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-1 leading-snug group-hover:text-gray-700 transition-colors duration-300">
                        {system.description || 'No description provided'}
                      </p>
                    </div>
                    
                    {/* Type Column */}
                    <div className="hidden md:flex items-center justify-center min-w-[120px]">
                      {systemType ? (
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/80 text-xs font-medium px-2.5 py-1 group-hover:border-teal-200 group-hover:from-teal-50 group-hover:to-teal-50/50 transition-all duration-300 capitalize"
                        >
                          {systemType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    
                    {/* Scope Column */}
                    <div className="hidden lg:flex items-center justify-center min-w-[100px]">
                      {scope ? (
                        <Badge 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-300 text-xs font-medium px-2.5 py-1 transition-all duration-300 capitalize"
                        >
                          {scope}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    
                    {/* Status Column */}
                    <div className="hidden lg:flex items-center justify-center min-w-[100px]">
                      {status ? (
                        <Badge 
                          className={`${statusInfo.className} text-xs font-medium px-2.5 py-1 transition-all duration-300`}
                        >
                          {statusInfo.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    
                    {/* Tags Column */}
                    <div className="hidden xl:flex items-center gap-1 min-w-[120px]">
                      {system.tags && system.tags.length > 0 ? (
                        <>
                          <Tag className="w-3 h-3 text-gray-400 group-hover:text-teal-500 transition-colors duration-300" />
                          <span className="text-xs text-gray-600 font-medium">{system.tags.length}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    
                    {/* Actions Column */}
                    {!bulkMode && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onDuplicate(system); }}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-white/90 hover:shadow-md rounded-lg transition-all duration-200 backdrop-blur-sm dropdown-trigger"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(system); }}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-white/90 hover:shadow-md rounded-lg transition-all duration-200 backdrop-blur-sm dropdown-trigger"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Animated Bottom Border on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
                </CardContent>
              </Card>
            )
          }

          // Grid View Rendering (existing code)
          return (
            <Card 
              key={system.id} 
              className={`group relative rounded-2xl border-2 border-gray-200/60 bg-white shadow-md hover:shadow-2xl hover:border-teal-400/60 transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-teal-500/0 before:via-teal-500/5 before:to-emerald-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 ${
                isSelected ? 'ring-4 ring-teal-500/50 ring-offset-2 shadow-xl border-teal-400' : ''
              }`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.dropdown-trigger')) return;
                if (!bulkMode) onQuickView(system);
              }}
            >
              <CardContent className="p-5 relative z-10">
                {/* Action buttons - positioned absolute top-right */}
                {!bulkMode && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDuplicate(system); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-white/95 hover:shadow-lg rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-200/50 hover:border-green-300"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(system); }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-white/95 hover:shadow-lg rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-200/50 hover:border-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Bulk mode checkbox */}
                {bulkMode && (
                  <div className="absolute top-3 left-3 z-20">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(system.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white shadow-md border-2"
                    />
                  </div>
                )}

                {/* Content Section with Image */}
                <div className="flex items-start gap-4">
                  {/* Small Image/Icon Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                    {imageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-teal-200/60 group-hover:border-teal-300 group-hover:shadow-lg transition-all duration-300">
                        <img 
                          src={imageUrl} 
                          alt={system.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 flex items-center justify-center border-2 border-teal-200/60 group-hover:border-teal-300 group-hover:shadow-lg transition-all duration-300">
                        <Globe className="w-8 h-8 text-teal-600/70 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-500" />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-3.5">
                    {/* Name & Description */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-teal-700 transition-colors duration-300">
                        {system.name}
                      </h3>
                      {system.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                          {system.description}
                        </p>
                      )}
                    </div>

                    {/* Badges Row */}
                    <div className="flex gap-1.5 flex-wrap min-h-[24px]">
                      {systemType && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-medium px-2.5 py-0.5 ${typeColor(systemType)} group-hover:scale-105 transition-transform duration-200 shadow-sm`}
                        >
                          {systemType}
                        </Badge>
                      )}
                      {status && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-medium px-2.5 py-0.5 ${statusBadge(status).className} group-hover:scale-105 transition-transform duration-200 shadow-sm`}
                        >
                          {statusBadge(status).label}
                        </Badge>
                      )}
                      {scope && (
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium px-2.5 py-0.5 capitalize bg-blue-50 text-blue-700 border-blue-300/60 group-hover:border-blue-400 group-hover:bg-blue-100 group-hover:shadow-sm transition-all duration-200"
                        >
                          {scope}
                        </Badge>
                      )}
                    </div>

                    {/* Footer Info Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/80">
                      {/* Tags Count */}
                      <div className="flex items-center gap-2">
                        {system.tags && system.tags.length > 0 ? (
                          <>
                            <div className="p-1 rounded-md bg-teal-50 group-hover:bg-teal-100 transition-colors duration-300">
                              <Tag className="w-3.5 h-3.5 text-teal-600 group-hover:text-teal-700 transition-colors duration-300" />
                            </div>
                            <span className="text-xs text-gray-600 font-semibold group-hover:text-teal-700 transition-colors duration-300">
                              {system.tags.length} {system.tags.length === 1 ? 'tag' : 'tags'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tags</span>
                        )}
                      </div>

                      {/* Updated Date */}
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-gray-50 group-hover:bg-gray-100 transition-colors duration-300">
                          <Clock className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-600 transition-colors duration-300" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition-colors duration-300">
                          {relativeDate(system.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Bottom Border on Hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out shadow-lg shadow-teal-500/50"></div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm)
                  setDeleteConfirm(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================================
// QUICK VIEW DRAWER COMPONENT
// ============================================================================

interface SystemsTableProps {
  systems: SystemElement[]
  bulkMode: boolean
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onToggleAll: () => void
  onQuickView: (system: SystemElement) => void
  onEdit: (system: SystemElement) => void
  onDuplicate: (system: SystemElement) => void
  onDelete: (system: SystemElement) => void
  onCreateFirst: () => void
}

function SystemsTable({
  systems,
  bulkMode,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onQuickView,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateFirst
}: SystemsTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<SystemElement | null>(null)

  // Empty state
  if (systems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 mb-6 shadow-sm">
          <Globe className="w-10 h-10 text-teal-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No systems yet</h3>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Define political, economic, and social structures that shape your world
        </p>
        <Button 
          onClick={onCreateFirst} 
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2.5 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First System
        </Button>
      </div>
    )
  }

  // Check if all visible systems are selected
  const allSelected = systems.length > 0 && systems.every(s => selectedIds.has(s.id))
  const someSelected = systems.some(s => selectedIds.has(s.id)) && !allSelected

  // Virtualization: Only render visible rows for large lists
  const shouldVirtualize = systems.length > 100
  const displaySystems = shouldVirtualize ? systems.slice(0, 100) : systems

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
        {shouldVirtualize && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/50 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Showing first 100 of {systems.length} systems. Use filters to narrow down results.</span>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {bulkMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={onToggleAll}
                    className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                    aria-label="Select all on page"
                  />
                </TableHead>
              )}
              <TableHead className="w-16">Icon</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Type</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Scope</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Status</TableHead>
              <TableHead className="hidden xl:table-cell font-semibold">Tags</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">Updated</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displaySystems.map(system => {
              const isSelected = selectedIds.has(system.id)
              const systemType = system.attributes?.type
              const scope = system.attributes?.scope
              const status = system.attributes?.status
              const statusInfo = statusBadge(status)
              const imageUrl = getFirstImageUrl(system.attributes?.images)

              return (
                <TableRow 
                  key={system.id}
                  className={`group transition-colors ${
                    isSelected 
                      ? 'bg-teal-50 hover:bg-teal-100/70' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {bulkMode && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(system.id)}
                        className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                        aria-label={`Select ${system.name}`}
                      />
                    </TableCell>
                  )}
                  
                  {/* Icon/Image */}
                  <TableCell>
                    <button 
                      className="w-10 h-10 rounded-md overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-teal-300 transition-all focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                      onClick={() => onQuickView(system)}
                      aria-label={`View ${system.name}`}
                    >
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={system.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          style={{ backgroundColor: '#ccfbf1' }}
                        />
                      ) : (
                        <Globe className="w-5 h-5 text-teal-400" />
                      )}
                    </button>
                  </TableCell>
                  
                  {/* Name & Description */}
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => onQuickView(system)}
                  >
                    <div className="flex flex-col gap-1 min-w-[150px]">
                      <span className="font-semibold text-sm group-hover:text-teal-600 transition-colors line-clamp-1">
                        {system.name}
                      </span>
                      {system.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {system.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Type */}
                  <TableCell className="hidden md:table-cell">
                    {systemType ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-sm capitalize">{systemType}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Scope */}
                  <TableCell className="hidden lg:table-cell">
                    {scope ? (
                      <Badge 
                        variant="outline" 
                        className="text-xs capitalize font-medium bg-blue-50 text-blue-700 border-blue-300"
                      >
                        {scope}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell className="hidden lg:table-cell">
                    {status ? (
                      <Badge 
                        className={`${statusInfo.className} font-medium`}
                      >
                        {statusInfo.label}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Tags */}
                  <TableCell className="hidden xl:table-cell">
                    {system.tags && system.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {system.tags.slice(0, 2).map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs font-normal"
                          >
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {system.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{system.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  {/* Updated */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">
                        {relativeDate(system.updated_at)}
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 data-[state=open]:bg-muted focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          aria-label={`Actions for ${system.name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 w-48 rounded-2xl shadow-xl">
                        <DropdownMenuItem onClick={() => onQuickView(system)} className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" />
                          Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(system)} className="cursor-pointer">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(system)} className="cursor-pointer">
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(system)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm)
                  setDeleteConfirm(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================================
// QUICK VIEW DRAWER COMPONENT
// ============================================================================

interface SystemQuickViewProps {
  item: SystemElement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (system: SystemElement) => void
  onDuplicate: (system: SystemElement) => void
  onDelete: (system: SystemElement) => void
}

function SystemQuickView({
  item,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete
}: SystemQuickViewProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  if (!item) return null

  const systemType = item.attributes?.type
  const scope = item.attributes?.scope
  const status = item.attributes?.status
  const statusInfo = statusBadge(status)

  // Parse mechanisms, participants, inputs, outputs from attributes
  const mechanisms = item.attributes?.mechanisms || []
  const participants = item.attributes?.participants?.split(',').map((p: string) => p.trim()).filter(Boolean) || []
  const inputs = item.attributes?.inputs || []
  const outputs = item.attributes?.outputs || []
  const stats = item.attributes?.stats || {}
  const images = item.attributes?.images || []

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-white max-w-2xl mx-auto max-h-[90vh] rounded-t-2xl shadow-2xl">
          <DrawerHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {getFirstImageUrl(item.attributes?.images) ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-xl opacity-20 blur-md"></div>
                      <img 
                        src={getFirstImageUrl(item.attributes?.images)} 
                        alt={item.name}
                        loading="lazy"
                        className="relative w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-50 via-teal-50 to-emerald-50 flex items-center justify-center border-2 border-teal-200/40 shadow-md">
                      <Globe className="w-7 h-7 text-teal-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <DrawerTitle className="text-xl font-bold text-gray-900 truncate mb-1.5">
                      {item.name}
                    </DrawerTitle>
                    <div className="flex gap-1.5 flex-wrap">
                      {systemType && (
                        <Badge variant="secondary" className={`text-xs font-medium ${typeColor(systemType)}`}>
                          {systemType}
                        </Badge>
                      )}
                      {status && (
                        <Badge variant="secondary" className={`text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      )}
                      {scope && (
                        <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-300">
                          {scope}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DrawerDescription className="text-sm text-gray-500 font-medium">
                  Last updated {relativeDate(item.updated_at)}
                </DrawerDescription>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(item)
                    onOpenChange(false)
                  }}
                  className="hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-all duration-200"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-gray-50 transition-all duration-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 rounded-xl shadow-xl">
                    <DropdownMenuItem onClick={() => {
                      onDuplicate(item)
                      onOpenChange(false)
                    }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirm(true)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DrawerHeader>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6 bg-gray-50/30">
            {/* Overview */}
            {item.description && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  Overview
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </section>
            )}

            {/* Images */}
            {item.attributes?.images && getAllImageUrls(item.attributes.images).length > 0 && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  Images
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getAllImageUrls(item.attributes.images).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-teal-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    >
                      <img
                        src={url}
                        alt={`${item.name} ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Governance */}
            {item.attributes?.governance && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-teal-600" />
                  Governance
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.attributes.governance}
                </p>
              </section>
            )}

            {/* Rules */}
            {item.attributes?.rules && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Rules
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.attributes.rules}
                </p>
              </section>
            )}

            {/* Mechanisms */}
            {mechanisms.length > 0 && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Network className="w-4 h-4 text-teal-600" />
                  Mechanisms
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {mechanisms.map((mechanism: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200/60 font-medium hover:bg-purple-100 transition-colors duration-200">
                      {mechanism}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Participants
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {participants.map((participant: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Inputs/Outputs */}
            {(inputs.length > 0 || outputs.length > 0) && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  Inputs & Outputs
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Inputs */}
                  <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                    <h4 className="text-xs font-semibold text-blue-900 mb-2">Inputs</h4>
                    {inputs.length > 0 ? (
                      <ul className="space-y-1.5">
                        {inputs.map((input: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-teal-500 mt-0.5 font-bold">•</span>
                            <span>{input}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">None specified</p>
                    )}
                  </div>

                  {/* Outputs */}
                  <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                    <h4 className="text-xs font-semibold text-emerald-900 mb-2">Outputs</h4>
                    {outputs.length > 0 ? (
                      <ul className="space-y-1.5">
                        {outputs.map((output: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-teal-500 mt-0.5 font-bold">•</span>
                            <span>{output}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">None specified</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Links */}
            {item.links && item.links.length > 0 && (
              <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-teal-600" />
                  Related Elements
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {item.links.map((link: LinkRef) => (
                    <Badge 
                      key={link.id} 
                      variant="outline" 
                      className="bg-indigo-50 text-indigo-700 border-indigo-200/60 font-medium hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
                    >
                      <span className="text-xs text-indigo-500 mr-1.5 font-semibold">{link.category}</span>
                      {link.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Stats */}
            {Object.keys(stats).length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Images */}
            {item.attributes?.images && getAllImageUrls(item.attributes.images).length > 1 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  {getAllImageUrls(item.attributes.images).map((imageUrl, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`${item.name} ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {item.tags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="bg-gray-50 text-gray-600 border-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          <DrawerFooter className="border-t">
            <div className="flex justify-between items-center w-full">
              <div className="text-xs text-gray-500">
                Created {new Date(item.created_at).toLocaleDateString()}
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation from Quick View */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{item.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(item)
                setDeleteConfirm(false)
                onOpenChange(false)
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================================================
// EDITOR DIALOG COMPONENT
// ============================================================================

interface SystemPreset {
  name: string
  systemType: SystemType
  scope: SystemScope
  status: SystemStatus
  description: string
  governance: string
  rules: string
  mechanisms: string[]
  participants: string[]
  inputs: string[]
  outputs: string[]
}

const SYSTEM_PRESETS: SystemPreset[] = [
  {
    name: 'Political State',
    systemType: 'political',
    scope: 'regional',
    status: 'active',
    description: 'A governmental body that exercises authority over a defined territory and population through established political institutions.',
    governance: 'Organized through elected or appointed officials who form legislative, executive, and judicial branches.',
    rules: 'Constitutional framework defining powers, rights, and responsibilities of government and citizens.',
    mechanisms: ['Elections', 'Bureaucracy', 'Legislation', 'Law Enforcement'],
    participants: ['Citizens', 'Officials', 'Representatives', 'Judges'],
    inputs: ['Taxes', 'Public Support', 'Resources'],
    outputs: ['Laws', 'Public Services', 'Infrastructure', 'Security']
  },
  {
    name: 'Market Economy',
    systemType: 'economic',
    scope: 'regional',
    status: 'active',
    description: 'An economic system based on supply and demand with minimal government intervention, where prices are determined by market forces.',
    governance: 'Self-regulating through market mechanisms, with some oversight by trade associations and regulatory bodies.',
    rules: 'Property rights, contract law, fair trading practices, and anti-monopoly regulations.',
    mechanisms: ['Trade', 'Currency Exchange', 'Banking', 'Competition'],
    participants: ['Merchants', 'Consumers', 'Producers', 'Banks'],
    inputs: ['Capital', 'Labor', 'Raw Materials', 'Demand'],
    outputs: ['Goods', 'Services', 'Employment', 'Wealth']
  },
  {
    name: 'Secret Society',
    systemType: 'social',
    scope: 'organizational',
    status: 'active',
    description: 'A clandestine organization operating beneath public awareness, bound by oaths of secrecy and shared esoteric knowledge.',
    governance: 'Hierarchical structure with inner circles wielding greater authority and knowledge. Leadership often shrouded in mystery.',
    rules: 'Strict codes of secrecy, initiation rituals, loyalty oaths, and severe penalties for betrayal.',
    mechanisms: ['Initiation', 'Secret Communication', 'Hidden Networks', 'Ritual'],
    participants: ['Initiates', 'Masters', 'Agents', 'Informants'],
    inputs: ['Discretion', 'Resources', 'Information', 'Loyalty'],
    outputs: ['Influence', 'Protection', 'Knowledge', 'Hidden Power']
  },
  {
    name: 'Church Order',
    systemType: 'religious',
    scope: 'regional',
    status: 'active',
    description: 'An organized religious institution that provides spiritual guidance, performs sacred rites, and maintains theological traditions.',
    governance: 'Hierarchical clergy structure led by high priests or religious councils, following divine law and sacred texts.',
    rules: 'Religious doctrine, moral codes, liturgical practices, and ecclesiastical law governing both clergy and faithful.',
    mechanisms: ['Worship', 'Sacraments', 'Prayer', 'Religious Education'],
    participants: ['Clergy', 'Believers', 'Monks', 'Pilgrims'],
    inputs: ['Faith', 'Tithes', 'Devotion', 'Sacred Texts'],
    outputs: ['Spiritual Guidance', 'Community', 'Moral Framework', 'Blessings']
  },
  {
    name: 'Magical Bureau',
    systemType: 'magical',
    scope: 'organizational',
    status: 'active',
    description: 'A formal institution regulating magical practice, training practitioners, and managing supernatural phenomena within society.',
    governance: 'Council of master mages oversees departments for research, enforcement, and education. Strict licensing system.',
    rules: 'Laws governing magical use, restrictions on forbidden spells, registration of practitioners, and containment protocols.',
    mechanisms: ['Spell Regulation', 'Magical Training', 'Artifact Control', 'Enforcement'],
    participants: ['Mages', 'Apprentices', 'Enforcers', 'Researchers'],
    inputs: ['Magical Energy', 'Talent', 'Ancient Knowledge', 'Resources'],
    outputs: ['Trained Mages', 'Magical Services', 'Protection', 'Innovation']
  }
]

interface SystemEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: SystemElement | null
  onSave: (data: Partial<SystemElement>) => Promise<void>
  onDuplicate?: (system: SystemElement) => void
  onDelete?: (system: SystemElement) => void
  projectId: string
  inline?: boolean
}

function SystemEditorDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  onDuplicate,
  onDelete,
  projectId,
  inline = false
}: SystemEditorDialogProps) {
  const [activeTab, setActiveTab] = useState('basics')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [systemType, setSystemType] = useState<SystemType | ''>('')
  const [scope, setScope] = useState<SystemScope | ''>('')
  const [status, setStatus] = useState<SystemStatus>('active')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [description, setDescription] = useState('')
  const [symbols, setSymbols] = useState<string[]>([])
  const [symbolInput, setSymbolInput] = useState('')

  const [governance, setGovernance] = useState('')
  const [rules, setRules] = useState('')
  const [mechanisms, setMechanisms] = useState<string[]>([])
  const [mechanismInput, setMechanismInput] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [participantInput, setParticipantInput] = useState('')

  const [inputs, setInputs] = useState<string[]>([])
  const [inputInput, setInputInput] = useState('')
  const [outputs, setOutputs] = useState<string[]>([])
  const [outputInput, setOutputInput] = useState('')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [statKey, setStatKey] = useState('')
  const [statValue, setStatValue] = useState('')

  const [history, setHistory] = useState('')
  const [images, setImages] = useState<MediaItem[]>([])
  const [coverImage, setCoverImage] = useState<number | null>(null)

  // Helper function to migrate old string[] format to MediaItem[]
  const migrateImagesToMediaItems = (images: string[] | MediaItem[] | undefined): MediaItem[] => {
    if (!images || images.length === 0) return []
    
    // Check if already in new format
    if (typeof images[0] === 'object' && 'name' in images[0]) {
      return images as MediaItem[]
    }
    
    // Migrate old format: convert string URLs to MediaItem objects
    return (images as string[]).map(url => ({
      name: '',
      imageUrls: [url],
      link: undefined
    }))
  }

  const [links, setLinks] = useState<LinkRef[]>([])
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [customType, setCustomType] = useState<'text' | 'number'>('text')
  
  // Link management state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [availableElements, setAvailableElements] = useState<LinkRef[]>([])
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<string>('all')

  // Preset state
  const [presetOpen, setPresetOpen] = useState(false)

  // Initialize form when initial data changes
  useEffect(() => {
    if (open && initial) {
      setName(initial.name || '')
      setSystemType((initial.attributes?.type as SystemType) || '')
      setScope((initial.attributes?.scope as SystemScope) || '')
      setStatus((initial.attributes?.status as SystemStatus) || 'active')
      setTags(initial.tags || [])
      setDescription(initial.description || '')
      setSymbols(initial.attributes?.symbols || [])
      setGovernance(initial.attributes?.governance || '')
      setRules(initial.attributes?.rules || '')
      setMechanisms(initial.attributes?.mechanisms || [])
      setParticipants(initial.attributes?.participants?.split(',').map((p: string) => p.trim()).filter(Boolean) || [])
      setInputs(initial.attributes?.inputs || [])
      setOutputs(initial.attributes?.outputs || [])
      setStats(initial.attributes?.stats || {})
      setHistory(initial.attributes?.history || '')
      setImages(migrateImagesToMediaItems(initial.attributes?.images))
      setCoverImage(initial.attributes?.coverImage ?? null)
      setLinks(initial.links || [])
      setCustomFields(initial.attributes?.custom || {})
    } else if (open && !initial) {
      // Reset for new system
      resetForm()
    }
  }, [open, initial])

  const resetForm = () => {
    setName('')
    setSystemType('')
    setScope('')
    setStatus('active')
    setTags([])
    setDescription('')
    setSymbols([])
    setGovernance('')
    setRules('')
    setMechanisms([])
    setParticipants([])
    setInputs([])
    setOutputs([])
    setStats({})
    setHistory('')
    setImages([])
    setCoverImage(null)
    setLinks([])
    setCustomFields({})
    setActiveTab('basics')
  }

  const handleSave = async (closeAfter: boolean = false) => {
    if (!name.trim()) {
      alert('Name is required')
      setActiveTab('basics')
      return
    }

    try {
      setSaving(true)

      const systemData: Partial<SystemElement> = {
        name: name.trim(),
        description: description.trim(),
        tags,
        attributes: {
          type: systemType || undefined,
          scope: scope || undefined,
          status,
          symbols,
          governance: governance.trim() || undefined,
          rules: rules.trim() || undefined,
          mechanisms,
          participants: participants.join(', '),
          inputs,
          outputs,
          stats,
          history: history.trim() || undefined,
          images: coverImage !== null && coverImage > 0 ? [images[coverImage], ...images.filter((_, i) => i !== coverImage)] : images,
          coverImage: coverImage ?? null,
          custom: customFields,
          links // Move links into attributes
        }
      }

      if (initial?.id) {
        systemData.id = initial.id
      }

      await onSave(systemData)

      if (closeAfter) {
        onOpenChange(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving system:', error)
      alert('Failed to save system')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const addSymbol = () => {
    if (symbolInput.trim() && !symbols.includes(symbolInput.trim())) {
      setSymbols([...symbols, symbolInput.trim()])
      setSymbolInput('')
    }
  }

  const removeSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol))
  }

  const addMechanism = () => {
    if (mechanismInput.trim() && !mechanisms.includes(mechanismInput.trim())) {
      setMechanisms([...mechanisms, mechanismInput.trim()])
      setMechanismInput('')
    }
  }

  const removeMechanism = (mechanism: string) => {
    setMechanisms(mechanisms.filter(m => m !== mechanism))
  }

  const addParticipant = () => {
    if (participantInput.trim() && !participants.includes(participantInput.trim())) {
      setParticipants([...participants, participantInput.trim()])
      setParticipantInput('')
    }
  }

  const removeParticipant = (participant: string) => {
    setParticipants(participants.filter(p => p !== participant))
  }

  const addInput = () => {
    if (inputInput.trim() && !inputs.includes(inputInput.trim())) {
      setInputs([...inputs, inputInput.trim()])
      setInputInput('')
    }
  }

  const removeInput = (input: string) => {
    setInputs(inputs.filter(i => i !== input))
  }

  const addOutput = () => {
    if (outputInput.trim() && !outputs.includes(outputInput.trim())) {
      setOutputs([...outputs, outputInput.trim()])
      setOutputInput('')
    }
  }

  const removeOutput = (output: string) => {
    setOutputs(outputs.filter(o => o !== output))
  }

  const addStat = () => {
    if (statKey.trim() && statValue.trim()) {
      const numValue = parseFloat(statValue)
      if (!isNaN(numValue)) {
        setStats({ ...stats, [statKey.trim()]: numValue })
        setStatKey('')
        setStatValue('')
      }
    }
  }

  const removeStat = (key: string) => {
    const newStats = { ...stats }
    delete newStats[key]
    setStats(newStats)
  }

  const addCustomField = () => {
    if (customKey.trim()) {
      const value = customType === 'number' ? parseFloat(customValue) : customValue
      setCustomFields({ ...customFields, [customKey.trim()]: value })
      setCustomKey('')
      setCustomValue('')
    }
  }

  const removeCustomField = (key: string) => {
    const newFields = { ...customFields }
    delete newFields[key]
    setCustomFields(newFields)
  }

  // Link management functions
  const loadAvailableElements = async () => {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('world_elements')
      .select('id, name, category')
      .eq('project_id', projectId)
      .neq('category', 'systems') // Don't show other systems
      .order('name')

    if (!error && data) {
      setAvailableElements(data.map((el: any) => ({ id: el.id, name: el.name, category: el.category })))
    }
  }

  const handleOpenLinkModal = () => {
    loadAvailableElements()
    setShowLinkModal(true)
  }

  const handleCloseLinkModal = () => {
    setShowLinkModal(false)
    setLinkSearchTerm('')
    setLinkCategoryFilter('all')
  }

  const handleAddLink = (element: LinkRef) => {
    if (!links.find(l => l.id === element.id)) {
      setLinks([...links, element])
    }
    handleCloseLinkModal()
  }

  const handleRemoveLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId))
  }

  const applyPreset = (preset: SystemPreset) => {
    // Only fill empty fields, never override existing values
    if (!name.trim()) setName(preset.name)
    if (!systemType) setSystemType(preset.systemType)
    if (!scope) setScope(preset.scope)
    if (status === 'active' && !initial) setStatus(preset.status)
    if (!description.trim()) setDescription(preset.description)
    if (!governance.trim()) setGovernance(preset.governance)
    if (!rules.trim()) setRules(preset.rules)
    if (mechanisms.length === 0) setMechanisms([...preset.mechanisms])
    if (participants.length === 0) setParticipants([...preset.participants])
    if (inputs.length === 0) setInputs([...preset.inputs])
    if (outputs.length === 0) setOutputs([...preset.outputs])
    
    setPresetOpen(false)
  }

  // Form Content Component - used both in Dialog and inline mode
  const FormContent = useMemo(() => {
    return (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-white shadow-sm px-0 h-auto py-0 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
              <div className="w-full max-w-7xl mx-auto px-6 flex items-center overflow-x-auto scrollbar-hide">
                <TabsTrigger 
                  value="basics" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 hover:bg-gray-50 data-[state=active]:bg-teal-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500 group-data-[state=active]:text-teal-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-teal-900 transition-colors">Basics</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="overview" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 hover:bg-gray-50 data-[state=active]:bg-blue-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500 group-data-[state=active]:text-blue-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-blue-900 transition-colors">Overview</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="structure" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 hover:bg-gray-50 data-[state=active]:bg-purple-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-gray-500 group-data-[state=active]:text-purple-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-purple-900 transition-colors">Structure</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="operations" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 hover:bg-gray-50 data-[state=active]:bg-amber-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500 group-data-[state=active]:text-amber-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-amber-900 transition-colors">Operations</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="media" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 hover:bg-gray-50 data-[state=active]:bg-emerald-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-500 group-data-[state=active]:text-emerald-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-emerald-900 transition-colors">History & Media</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="relationships" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 hover:bg-gray-50 data-[state=active]:bg-rose-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500 group-data-[state=active]:text-rose-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-rose-900 transition-colors">Relationships</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
                
                <TabsTrigger 
                  value="custom" 
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 hover:bg-gray-50 data-[state=active]:bg-violet-50/50 transition-all duration-200 gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-gray-500 group-data-[state=active]:text-violet-600 transition-colors" />
                    <span className="text-gray-600 group-data-[state=active]:text-violet-900 transition-colors">Custom</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-full" />
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-8 bg-gradient-to-br from-gray-50/40 via-white to-gray-50/40">
              {/* BASICS TAB */}
              <TabsContent value="basics" className="mt-0 space-y-6">
                {/* Preset Button */}
                <div className="flex justify-end">
                  <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 rounded-xl border-2 border-gray-300 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 shadow-sm hover:shadow">
                        <Settings className="w-4 h-4" />
                        Apply Preset
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4" align="end">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-bold text-base text-gray-900">System Presets</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Apply a preset to quickly fill in default values. Only empty fields will be filled.
                          </p>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {SYSTEM_PRESETS.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-teal-50 rounded-xl transition-all duration-200 border border-transparent hover:border-teal-200"
                              onClick={() => applyPreset(preset)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900">{preset.name}</div>
                                <div className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                                  {preset.description}
                                </div>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ml-2 shrink-0 ${typeColor(preset.systemType)}`}
                              >
                                {preset.systemType}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900 mb-2 block">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Imperial Senate, Trade Guild System"
                    className="rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-semibold text-gray-900 mb-2 block">System Type</Label>
                    <Select value={systemType} onValueChange={(v) => setSystemType(v as SystemType)}>
                      <SelectTrigger id="type" className="rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                        <SelectItem value="political">Political</SelectItem>
                        <SelectItem value="economic">Economic</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="religious">Religious</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="military">Military</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="magical">Magical</SelectItem>
                        <SelectItem value="technological">Technological</SelectItem>
                      </SelectContent>
                    </Select>
                    {systemType && (
                      <Badge className={`mt-2 ${typeColor(systemType)} shadow-sm`}>
                        {systemType}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="scope" className="text-sm font-semibold text-gray-900 mb-2 block">Scope</Label>
                    <Select value={scope} onValueChange={(v) => setScope(v as SystemScope)}>
                      <SelectTrigger id="scope" className="rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                        <SelectValue placeholder="Select scope..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="organizational">Organizational</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-semibold text-gray-900 mb-2 block">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as SystemStatus)}>
                      <SelectTrigger id="status" className="rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="historical">Historical</SelectItem>
                        <SelectItem value="proposed">Proposed</SelectItem>
                        <SelectItem value="defunct">Defunct</SelectItem>
                        <SelectItem value="evolving">Evolving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <Button type="button" onClick={addTag} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200/60">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1.5 pr-1.5 bg-white border-2 border-gray-300 hover:border-teal-300 transition-all duration-200 shadow-sm">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTag(tag)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-900 mb-2 block">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose, function, and key characteristics of this system..."
                    rows={8}
                    className="rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Symbols</Label>
                  <p className="text-xs text-gray-500 mb-2">Key symbols or emblems associated with this system</p>
                  <div className="flex gap-2">
                    <Input
                      value={symbolInput}
                      onChange={(e) => setSymbolInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymbol())}
                      placeholder="e.g., Eagle, Crown, Scales..."
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Button type="button" onClick={addSymbol} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {symbols.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3 p-4 bg-gradient-to-br from-indigo-50/40 to-white rounded-xl border-2 border-gray-200/60">
                      {symbols.map((symbol) => (
                        <Badge key={symbol} variant="secondary" className="gap-1.5 pr-1.5 bg-white border-2 border-gray-300 hover:border-indigo-300 transition-all duration-200 shadow-sm">
                          {symbol}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSymbol(symbol)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* STRUCTURE TAB */}
              <TabsContent value="structure" className="mt-0 space-y-6">
                <div>
                  <Label htmlFor="governance" className="text-sm font-semibold text-gray-900 mb-2 block">Governance</Label>
                  <p className="text-xs text-gray-500 mb-2">How is this system organized and governed?</p>
                  <Textarea
                    id="governance"
                    value={governance}
                    onChange={(e) => setGovernance(e.target.value)}
                    placeholder="Describe the governance structure, hierarchy, and decision-making processes..."
                    rows={5}
                    className="rounded-xl border-2 border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <Label htmlFor="rules" className="text-sm font-semibold text-gray-900 mb-2 block">Rules</Label>
                  <p className="text-xs text-gray-500 mb-2">Core rules and regulations that govern the system</p>
                  <Textarea
                    id="rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="List the key rules, laws, or principles..."
                    rows={5}
                    className="rounded-xl border-2 border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Mechanisms</Label>
                  <p className="text-xs text-gray-500 mb-2">How does this system operate?</p>
                  <div className="flex gap-2">
                    <Input
                      value={mechanismInput}
                      onChange={(e) => setMechanismInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMechanism())}
                      placeholder="e.g., Voting, Taxation, Enforcement..."
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <Button type="button" onClick={addMechanism} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {mechanisms.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-gray-200/60">
                      {mechanisms.map((mechanism) => (
                        <Badge key={mechanism} variant="secondary" className="bg-purple-100 text-purple-700 border-2 border-purple-200 hover:border-purple-300 gap-1.5 pr-1.5 shadow-sm transition-all duration-200">
                          {mechanism}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMechanism(mechanism)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Participants</Label>
                  <p className="text-xs text-gray-500 mb-2">Who participates in or is affected by this system?</p>
                  <div className="flex gap-2">
                    <Input
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                      placeholder="e.g., Citizens, Nobles, Merchants..."
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <Button type="button" onClick={addParticipant} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {participants.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3 p-4 bg-gradient-to-br from-violet-50/40 to-white rounded-xl border-2 border-gray-200/60">
                      {participants.map((participant) => (
                        <Badge key={participant} variant="secondary" className="gap-1.5 pr-1.5 bg-white border-2 border-gray-300 hover:border-violet-300 transition-all duration-200 shadow-sm">
                          {participant}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParticipant(participant)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* OPERATIONS TAB */}
              <TabsContent value="operations" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">Inputs</Label>
                    <p className="text-xs text-gray-500 mb-2">What does this system require?</p>
                    <div className="flex gap-2">
                      <Input
                        value={inputInput}
                        onChange={(e) => setInputInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInput())}
                        placeholder="e.g., Taxes, Labor..."
                        className="flex-1 rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <Button type="button" onClick={addInput} variant="outline" size="sm" className="rounded-xl border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {inputs.length > 0 && (
                      <ul className="space-y-2 mt-3">
                        {inputs.map((input, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-emerald-50/50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                            <span className="text-gray-700 font-medium">{input}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInput(input)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-2 block">Outputs</Label>
                    <p className="text-xs text-gray-500 mb-2">What does this system produce?</p>
                    <div className="flex gap-2">
                      <Input
                        value={outputInput}
                        onChange={(e) => setOutputInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOutput())}
                        placeholder="e.g., Services, Order..."
                        className="flex-1 rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <Button type="button" onClick={addOutput} variant="outline" size="sm" className="rounded-xl border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {outputs.length > 0 && (
                      <ul className="space-y-2 mt-3">
                        {outputs.map((output, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-emerald-50/50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                            <span className="text-gray-700 font-medium">{output}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOutput(output)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Statistics</Label>
                  <p className="text-xs text-gray-500 mb-2">Numerical metrics for this system</p>
                  <div className="flex gap-2">
                    <Input
                      value={statKey}
                      onChange={(e) => setStatKey(e.target.value)}
                      placeholder="Key (e.g., members)"
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Input
                      type="number"
                      value={statValue}
                      onChange={(e) => setStatValue(e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Button type="button" onClick={addStat} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {Object.keys(stats).length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                          <div>
                            <div className="text-xs text-gray-500 capitalize font-medium">{key.replace(/_/g, ' ')}</div>
                            <div className="text-xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStat(key)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* HISTORY & MEDIA TAB */}
              <TabsContent value="media" className="mt-0 space-y-6">
                <div>
                  <Label htmlFor="history" className="text-sm font-semibold text-gray-900 mb-2 block">History</Label>
                  <p className="text-xs text-gray-500 mb-2">Historical background and evolution of this system</p>
                  <Textarea
                    id="history"
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Describe how this system came to be and how it has evolved..."
                    rows={6}
                    className="rounded-xl border-2 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-500" />
                    Images
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Add images of this system. You can include multiple images with names, descriptions, and reference links.</p>
                  <div className="space-y-3 mt-2">
                    {images.map((image, idx) => (
                      <MediaItemInput
                        key={idx}
                        item={image}
                        index={idx}
                        placeholder="e.g., Structure diagram, Historical document, Symbol..."
                        onUpdate={(index, updatedItem) => {
                          const updatedImages = [...images]
                          updatedImages[index] = updatedItem
                          setImages(updatedImages)
                        }}
                        onRemove={(index) => {
                          const updatedImages = [...images]
                          updatedImages.splice(index, 1)
                          setImages(updatedImages)
                        }}
                        projectId={projectId}
                        storageBucket="system-images"
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImages([...images, { name: '', imageUrls: undefined, link: undefined }])}
                      className="w-full border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 rounded-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Image
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* RELATIONSHIPS TAB */}
              <TabsContent value="relationships" className="mt-0 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900 mb-1 block">Linked Elements</Label>
                      <p className="text-xs text-gray-500">Connect to related characters, locations, factions, items, and other elements</p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleOpenLinkModal}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Link
                    </Button>
                  </div>
                  
                  {links.length > 0 ? (
                    <div className="grid gap-3">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-2 border-blue-200 capitalize shadow-sm">
                              {link.category}
                            </Badge>
                            <span className="font-medium text-gray-900">{link.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLink(link.id)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-100"
                          >
                            <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
                      <LinkIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 font-medium">No linked elements yet</p>
                      <p className="text-xs text-gray-500 mt-1">Click "Add Link" to connect related elements</p>
                    </div>
                  )}
                </div>

                {/* Link Selection Modal */}
                <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
                  <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Linked Element</DialogTitle>
                      <DialogDescription>
                        Select an element to link to this system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search elements..."
                          value={linkSearchTerm}
                          onChange={(e) => setLinkSearchTerm(e.target.value)}
                          className="flex-1 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <Select value={linkCategoryFilter} onValueChange={setLinkCategoryFilter}>
                          <SelectTrigger className="w-40 rounded-xl border-2 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl rounded-xl">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="characters">Characters</SelectItem>
                            <SelectItem value="locations">Locations</SelectItem>
                            <SelectItem value="factions">Factions</SelectItem>
                            <SelectItem value="items">Items</SelectItem>
                            <SelectItem value="cultures">Cultures</SelectItem>
                            <SelectItem value="magic">Magic</SelectItem>
                            <SelectItem value="species">Species</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {availableElements
                          .filter(el => {
                            const matchesSearch = el.name.toLowerCase().includes(linkSearchTerm.toLowerCase())
                            const matchesCategory = linkCategoryFilter === 'all' || el.category === linkCategoryFilter
                            const notAlreadyLinked = !links.find(l => l.id === el.id)
                            return matchesSearch && matchesCategory && notAlreadyLinked
                          })
                          .map(element => (
                            <div
                              key={element.id}
                              onClick={() => handleAddLink(element)}
                              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="capitalize">
                                  {element.category}
                                </Badge>
                                <span className="font-medium text-gray-900">{element.name}</span>
                              </div>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* CUSTOM TAB */}
              <TabsContent value="custom" className="mt-0 space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">Custom Fields</Label>
                  <p className="text-xs text-gray-500 mb-3">Add any custom attributes specific to this system</p>
                  
                  <div className="flex gap-2">
                    <Input
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="Field name"
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <Select value={customType} onValueChange={(v: 'text' | 'number') => setCustomType(v)}>
                      <SelectTrigger className="w-32 rounded-xl border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 shadow-xl rounded-xl">
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type={customType === 'number' ? 'number' : 'text'}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-xl border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <Button type="button" onClick={addCustomField} variant="outline" className="rounded-xl border-2 border-gray-300 hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {Object.keys(customFields).length > 0 && (
                    <div className="space-y-3 mt-4">
                      {Object.entries(customFields).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50/50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">{key}</div>
                            <div className="text-sm text-gray-600 mt-0.5">{String(value)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomField(key)}
                            className="h-7 w-7 p-0 rounded-lg hover:bg-red-100"
                          >
                            <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving || !name.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || !name.trim()}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {saving ? 'Saving...' : 'Save & Close'}
              </Button>
            </div>
          </div>
        </>
      )
  }, [activeTab, presetOpen, name, systemType, scope, status, tags, tagInput, description, symbols, symbolInput, 
      governance, rules, mechanisms, mechanismInput, participants, participantInput, inputs, inputInput,
      outputs, outputInput, stats, statKey, statValue, history, images, coverImage,
      customKey, customValue, customType, customFields, links, showLinkModal, linkSearchTerm, availableElements, linkCategoryFilter,
      saving, initial, onSave, onOpenChange, onDuplicate, onDelete, deleteConfirm])

  // Conditionally wrap in Dialog or render inline
  if (inline) {
    return (
      <>
        {FormContent}
        {/* Delete Confirmation */}
        {initial && onDelete && (
          <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete System?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{initial.name}"</span>? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete(initial)
                    setDeleteConfirm(false)
                    onOpenChange(false)
                  }}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Delete System
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 via-white to-emerald-50/30 sticky top-0 z-20 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {initial ? 'Edit System' : 'Create New System'}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-gray-600 font-medium">
                  Define the political, economic, or social structures of your world
                </DialogDescription>
              </div>
              {initial && onDuplicate && onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-xl rounded-xl">
                    <DropdownMenuItem onClick={() => {
                      onDuplicate(initial)
                      onOpenChange(false)
                    }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirm(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>

          {/* Form Content - extracted for inline mode */}
          {FormContent}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {initial && onDelete && (
        <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete System?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{initial.name}"</span>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(initial)
                  setDeleteConfirm(false)
                  onOpenChange(false)
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete System
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

// ============================================================================
// BULK ACTIONS BAR COMPONENT
// ============================================================================

interface BulkActionsBarProps {
  selectionCount: number
  onSetStatus: (status: SystemStatus) => void
  onAddTag: () => void
  onDelete: () => void
  onExportJSON: () => void
  onExportCSV: () => void
  uniqueTags: string[]
  hasUndo: boolean
  onUndo: () => void
}

function BulkActionsBar({
  selectionCount,
  onSetStatus,
  onAddTag,
  onDelete,
  onExportJSON,
  onExportCSV,
  uniqueTags,
  hasUndo,
  onUndo
}: BulkActionsBarProps) {
  return (
    <div 
      className="sticky top-[73px] z-10 bg-teal-50 border-y border-teal-200 px-6 py-3"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-teal-900" aria-live="polite">
          {selectionCount} selected
        </span>

        {/* Set Status */}
        <Select onValueChange={(value) => onSetStatus(value as SystemStatus)}>
          <SelectTrigger className="w-[160px] h-9 bg-white">
            <SelectValue placeholder="Set Status..." />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="historical">Historical</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="defunct">Defunct</SelectItem>
            <SelectItem value="evolving">Evolving</SelectItem>
          </SelectContent>
        </Select>

        {/* Add Tag */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTag}
          className="bg-white h-9"
        >
          <Tag className="w-4 h-4 mr-2" />
          Add Tag
        </Button>

        {/* Show unique tags from selection */}
        {uniqueTags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-teal-700">Tags:</span>
            {uniqueTags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {uniqueTags.length > 3 && (
              <span className="text-xs text-teal-600">+{uniqueTags.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Export Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportJSON}
          className="bg-background h-9"
          aria-label="Export selected systems as JSON"
        >
          <Download className="w-4 h-4 mr-2" />
          JSON
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportCSV}
          className="bg-background h-9"
          aria-label="Export selected systems as CSV"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>

        {/* Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="bg-background border-red-300 text-red-600 hover:bg-red-50 h-9"
          aria-label={`Delete ${selectionCount} selected systems`}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>

        {/* Undo */}
        {hasUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="bg-teal-600 text-white hover:bg-teal-700 border-teal-600 h-9"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

interface SystemsToolbarProps {
  query: string
  onQuery: (value: string) => void
  sort: SortOption
  onSort: (value: SortOption) => void
  filters: FilterState
  onFilters: (filters: FilterState) => void
  view: ViewMode
  onView: (view: ViewMode) => void
  onNew: () => void
  bulkMode: boolean
  onBulkMode: (enabled: boolean) => void
  selectionCount: number
  onClearFilters: () => void
  onBulkDelete?: () => void
}

function SystemsToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilters,
  view,
  onView,
  onNew,
  bulkMode,
  onBulkMode,
  selectionCount,
  onClearFilters,
  onBulkDelete
}: SystemsToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate active filter count
  const activeFilterCount = filters.types.length + filters.scopes.length + filters.status.length

  // Filter options
  const typeOptions: SystemType[] = [
    'political', 'economic', 'social', 'religious', 'legal',
    'military', 'educational', 'cultural', 'magical', 'technological'
  ]
  const scopeOptions: SystemScope[] = ['global', 'regional', 'local', 'organizational', 'individual']
  const statusOptions: SystemStatus[] = ['active', 'historical', 'proposed', 'defunct', 'evolving']

  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilters({ ...filters, [category]: updated })
  }

  const removeFilter = (category: keyof FilterState, value: string) => {
    onFilters({
      ...filters,
      [category]: filters[category].filter(v => v !== value)
    })
  }

  return (
    <div className="px-6 py-6">
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search systems... (press / to focus)"
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort */}
              <Select value={sort} onValueChange={(value) => onSort(value as SortOption)}>
                <SelectTrigger className="w-[140px] rounded-xl px-4 py-3 border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-50">
                  <SelectItem value="name_asc">Name A→Z</SelectItem>
                  <SelectItem value="name_desc">Name Z→A</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="type_asc">Type</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="rounded-xl px-4 py-3 border-gray-200 focus:ring-2 focus:ring-teal-500 transition-all duration-200"
                    aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-full">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-white rounded-xl shadow-lg" align="start">
                  <Command className="bg-white">
                    <CommandInput placeholder="Search filters..." className="bg-white" />
                    <CommandList>
                      <CommandEmpty>No filters found.</CommandEmpty>
                      
                      {/* Type Filters */}
                      <CommandGroup heading="Type">
                        {typeOptions.map((type) => (
                          <CommandItem
                            key={type}
                            onSelect={() => toggleFilter('types', type)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                filters.types.includes(type) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                              }`}>
                                {filters.types.includes(type) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="capitalize">{type}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <CommandSeparator />

                      {/* Scope Filters */}
                      <CommandGroup heading="Scope">
                        {scopeOptions.map((scope) => (
                          <CommandItem
                            key={scope}
                            onSelect={() => toggleFilter('scopes', scope)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                filters.scopes.includes(scope) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                              }`}>
                                {filters.scopes.includes(scope) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="capitalize">{scope}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <CommandSeparator />

                      {/* Status Filters */}
                      <CommandGroup heading="Status">
                        {statusOptions.map((status) => (
                          <CommandItem
                            key={status}
                            onSelect={() => toggleFilter('status', status)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                filters.status.includes(status) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                              }`}>
                                {filters.status.includes(status) && (
                                  <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                              </div>
                              <span className="capitalize">{status}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* View Toggle */}
              <ToggleGroup type="single" value={view} onValueChange={(value) => value && onView(value as ViewMode)}>
                <ToggleGroupItem value="grid" aria-label="Grid view" className="rounded-l-xl data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 transition-all duration-200">
                  <Grid3x3 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view" className="rounded-r-xl data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 transition-all duration-200">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Bulk Mode Toggle */}
              <Button
                variant={bulkMode ? 'default' : 'outline'}
                onClick={() => onBulkMode(!bulkMode)}
                className={`rounded-xl px-4 py-3 transition-all duration-200 ${
                  bulkMode 
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                aria-label={bulkMode ? 'Exit bulk selection mode' : 'Enter bulk selection mode'}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Bulk
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filters.types.map(type => (
                  <Badge 
                    key={`type-${type}`} 
                    variant="secondary" 
                    className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('types', type)}
                  >
                    {type}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.scopes.map(scope => (
                  <Badge 
                    key={`scope-${scope}`} 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('scopes', scope)}
                  >
                    {scope}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {filters.status.map(status => (
                  <Badge 
                    key={`status-${status}`} 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer transition-colors duration-200"
                    onClick={() => removeFilter('status', status)}
                  >
                    {status}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SystemsPanel({ projectId, selectedElement, onSystemsChange, onClearSelection }: any) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Data state
  const [systems, setSystems] = useState<SystemElement[]>([])
  const [loading, setLoading] = useState(true)
  
  // View state
  const [view, setView] = useState<ViewMode>('grid')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('name_asc')
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    scopes: [],
    status: []
  })
  
  // Bulk operations state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Quick view/edit state
  const [quickItem, setQuickItem] = useState<SystemElement | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<SystemElement | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Legacy state (to maintain compatibility)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSystem, setEditingSystem] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: '', scope: '', rules: '', participants: '' })

  // Bulk actions state
  const [showAddTagDialog, setShowAddTagDialog] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [undoSnapshot, setUndoSnapshot] = useState<{ systems: SystemElement[], selectedIds: Set<string> } | null>(null)

  const supabase = createSupabaseClient()

  // Toast notification with optional undo callback
  const showToast = (message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
    if (type === 'success') {
      console.log('✓', message)
      if (onUndo) {
        // In a real implementation, this would show a toast with an undo button
        // For now, we'll just log it
        console.log('Undo available - call onUndo() to revert')
      }
    } else {
      console.error('✗', message)
      alert(message)
    }
  }

  // ============================================================================
  // EFFECTS & DATA LOADING
  // ============================================================================

  // Load systems on mount and when projectId changes
  useEffect(() => { 
    loadSystems() 
  }, [projectId])

  // Handle external selection (from sidebar, timeline, etc.)
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'systems') {
      setEditingSystem(selectedElement)
      setEditing(selectedElement as SystemElement)
      setIsCreating(false)
      setEditorOpen(false) // Use inline editing instead of modal
      setQuickItem(null)
      // No need to set formData here - the inline editor will load it from editing state
    }
  }, [selectedElement])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Esc - close any open dialog/drawer
      if (e.key === 'Escape') {
        if (editorOpen) {
          setEditorOpen(false)
          setEditing(null)
          setEditingSystem(null)
        } else if (quickItem) {
          setQuickItem(null)
        } else if (showAddTagDialog) {
          setShowAddTagDialog(false)
          setNewTag('')
        }
        return
      }

      // Don't trigger shortcuts when typing in input fields (except Esc)
      if (isInputFocused) return

      // n - New system
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleNewSystem()
        return
      }

      // a - Select all (in bulk mode)
      if (e.key === 'a' && bulkMode && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleToggleAll()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editorOpen, quickItem, showAddTagDialog, bulkMode])

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch all non-deleted systems for the current project
   */
  const loadSystems = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch from world_elements where:
      // - project_id matches
      // - category is 'systems'
      // - not soft-deleted (attributes.__deleted != true)
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'systems')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading systems:', error)
        throw error
      }

      // Filter out soft-deleted items
      const activeSystems = (data || []).filter(
        (system: any) => !system.attributes?.__deleted
      ) as SystemElement[]

      setSystems(activeSystems)
    } catch (error) {
      console.error('Failed to load systems:', error)
      setSystems([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClearFilters = useCallback(() => {
    setFilters({ types: [], scopes: [], status: [] })
  }, [])

  const handleNewSystem = useCallback(() => {
    setEditing({
      id: '',
      name: '',
      description: '',
      project_id: projectId,
      category: 'systems',
      attributes: {},
      tags: [],
      links: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as SystemElement)
    setIsCreating(true)
    setEditorOpen(false)
    setQuickItem(null)
  }, [projectId])

  const resetForm = useCallback(() => {
    setEditing(null)
    setIsCreating(false)
    setEditorOpen(false)
  }, [])

  const handleBulkModeChange = useCallback((enabled: boolean) => {
    setBulkMode(enabled)
    if (!enabled) {
      setSelectedIds(new Set())
    }
  }, [])

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleQuickView = useCallback((system: SystemElement) => {
    // Open inline editor instead of quick view drawer
    setEditingSystem(system)
    setEditing(system)
    setIsCreating(false)
    setEditorOpen(false)
  }, [])

  const handleEdit = useCallback((system: SystemElement) => {
    setEditingSystem(system)
    setEditing(system)
    setIsCreating(false)
    setEditorOpen(false)
    setQuickItem(null)
  }, [])

  // handleToggleAll will be defined after visibleSystems (see below)

  // ============================================================================
  // DATA OPERATIONS (CRUD with Optimistic Updates)
  // ============================================================================

  /**
   * Create or Update a system with optimistic UI update
   */
  const handleCreateSystem = async (data: Partial<SystemElement>) => {
    const isUpdate = !!data.id
    const previousSystems = [...systems]

    try {
      // Remove empty id from data to prevent insert issues
      const { id, created_at, updated_at, links, ...dataWithoutMeta } = data
      
      const systemData = {
        project_id: projectId,
        category: 'systems' as const,
        ...dataWithoutMeta,
        ...(id && { id }), // Only include id if it exists and is not empty
        attributes: {
          ...data.attributes,
          status: data.attributes?.status || 'active',
          links: links || [] // Store links inside attributes
        }
      }

      console.log('Creating/updating system. isUpdate:', isUpdate, 'systemData:', systemData)

      if (isUpdate) {
        // OPTIMISTIC UPDATE
        const optimisticSystem: SystemElement = {
          ...systemData,
          id: data.id!,
          created_at: systems.find(s => s.id === data.id)?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as SystemElement

        setSystems(prev => prev.map(s => s.id === data.id ? optimisticSystem : s))

        // Actual update
        const { data: updated, error } = await supabase
          .from('world_elements')
          .update({
            ...systemData,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single()

        if (error) throw error

        // Use DB timestamp
        setSystems(prev => prev.map(s => s.id === data.id ? updated as SystemElement : s))
        
        showToast('System updated successfully', 'success')
      } else {
        // OPTIMISTIC INSERT
        const tempId = `temp-${Date.now()}`
        const optimisticSystem: SystemElement = {
          ...systemData,
          id: tempId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as SystemElement

        setSystems(prev => [optimisticSystem, ...prev])

        // Actual insert
        const { data: created, error } = await supabase
          .from('world_elements')
          .insert(systemData)
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          console.error('System data being inserted:', systemData)
          throw error
        }

        // Replace temp with real
        setSystems(prev => prev.map(s => s.id === tempId ? created as SystemElement : s))

        showToast('System created successfully', 'success')
      }

      // Emit event
      window.dispatchEvent(new CustomEvent('systemCreated', {
        detail: { projectId }
      }))

      onSystemsChange?.()
    } catch (error) {
      console.error('Error saving system:', error)
      
      // ROLLBACK on error
      setSystems(previousSystems)
      
      showToast(`Failed to ${isUpdate ? 'update' : 'create'} system`, 'error')
      throw error
    }
  }

  /**
   * Duplicate a system with optimistic update
   */
  const handleDuplicate = async (system: SystemElement) => {
    const previousSystems = [...systems]

    try {
      const duplicateData = {
        project_id: projectId,
        category: 'systems' as const,
        name: `${system.name} (Copy)`,
        description: system.description,
        attributes: { ...system.attributes },
        tags: [...(system.tags || [])],
        links: [...(system.links || [])]
      }

      // OPTIMISTIC INSERT
      const tempId = `temp-${Date.now()}`
      const optimisticSystem: SystemElement = {
        ...duplicateData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as SystemElement

      setSystems(prev => [optimisticSystem, ...prev])

      // Actual insert
      const { data, error } = await supabase
        .from('world_elements')
        .insert(duplicateData)
        .select()
        .single()

      if (error) throw error

      // Replace temp with real
      setSystems(prev => prev.map(s => s.id === tempId ? data as SystemElement : s))

      showToast('System duplicated successfully', 'success')

      // Emit event
      window.dispatchEvent(new CustomEvent('systemCreated', {
        detail: { system: data, projectId }
      }))

      onSystemsChange?.()
    } catch (error) {
      console.error('Error duplicating system:', error)
      
      // ROLLBACK
      setSystems(previousSystems)
      
      showToast('Failed to duplicate system', 'error')
    }
  }

  /**
   * Hard delete - permanently removes from database
   */
  const handleDelete = async (system: SystemElement) => {
    const previousSystems = [...systems]

    try {
      // OPTIMISTIC: Remove from UI immediately
      setSystems(prev => prev.filter(s => s.id !== system.id))
      
      // Remove from selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(system.id)
        return next
      })

      // Delete images from storage first
      await deleteSystemImages(system)

      // Actual hard delete from database
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', system.id)

      if (error) throw error

      showToast('System deleted', 'success')
      onSystemsChange?.()
    } catch (error) {
      console.error('Error deleting system:', error)
      
      // ROLLBACK
      setSystems(previousSystems)
      
      showToast('Failed to delete system', 'error')
    }
  }

  /**
   * Bulk hard delete - permanently delete multiple systems
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    createSnapshot()
    const previousSystems = [...systems]
    const idsToDelete = Array.from(selectedIds)

    try {
      // OPTIMISTIC: Remove from UI immediately
      setSystems(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())

      // Delete images from storage and hard delete from database
      for (const id of idsToDelete) {
        // Find the system to get its images
        const systemToDelete = previousSystems.find(s => s.id === id)
        
        // Delete images from storage first
        if (systemToDelete) {
          await deleteSystemImages(systemToDelete)
        }
        
        // Delete from database
        const { error } = await supabase
          .from('world_elements')
          .delete()
          .eq('id', id)

        if (error) throw error
      }

      showToast(`${idsToDelete.length} systems deleted`, 'success', handleUndo)
      onSystemsChange?.()
    } catch (error) {
      console.error('Error bulk deleting systems:', error)
      
      // ROLLBACK
      setSystems(previousSystems)
      setSelectedIds(new Set(idsToDelete))
      
      showToast('Failed to delete systems', 'error')
      setUndoSnapshot(null)
    }
  }

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================

  /**
   * Create snapshot for undo functionality
   */
  const createSnapshot = () => {
    setUndoSnapshot({
      systems: [...systems],
      selectedIds: new Set(selectedIds)
    })
  }

  /**
   * Undo last bulk operation
   */
  const handleUndo = () => {
    if (undoSnapshot) {
      setSystems(undoSnapshot.systems)
      setSelectedIds(undoSnapshot.selectedIds)
      setUndoSnapshot(null)
      showToast('Undone successfully', 'success')
    }
  }

  /**
   * Bulk set status for selected systems
   */
  const handleBulkSetStatus = async (status: SystemStatus) => {
    if (selectedIds.size === 0) return

    createSnapshot()
    const previousSystems = [...systems]
    const idsToUpdate = Array.from(selectedIds)

    try {
      // OPTIMISTIC: Update UI immediately
      setSystems(prev => prev.map(s => 
        selectedIds.has(s.id) 
          ? { ...s, attributes: { ...s.attributes, status } }
          : s
      ))

      // Update all selected in database
      for (const id of idsToUpdate) {
        const system = previousSystems.find(s => s.id === id)
        if (system) {
          const { error } = await supabase
            .from('world_elements')
            .update({
              attributes: {
                ...system.attributes,
                status
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', id)

          if (error) throw error
        }
      }

      showToast(`Updated status for ${idsToUpdate.length} systems`, 'success', handleUndo)
      onSystemsChange?.()
    } catch (error) {
      console.error('Error bulk updating status:', error)
      
      // ROLLBACK
      setSystems(previousSystems)
      
      showToast('Failed to update status', 'error')
      setUndoSnapshot(null)
    }
  }

  /**
   * Bulk add tag to selected systems
   */
  const handleBulkAddTag = async (tag: string) => {
    if (selectedIds.size === 0 || !tag.trim()) return

    createSnapshot()
    const previousSystems = [...systems]
    const idsToUpdate = Array.from(selectedIds)
    const trimmedTag = tag.trim()

    try {
      // OPTIMISTIC: Update UI immediately
      setSystems(prev => prev.map(s => {
        if (selectedIds.has(s.id)) {
          const currentTags = s.tags || []
          // Only add if not already present
          if (!currentTags.includes(trimmedTag)) {
            return { ...s, tags: [...currentTags, trimmedTag] }
          }
        }
        return s
      }))

      // Update all selected in database
      for (const id of idsToUpdate) {
        const system = previousSystems.find(s => s.id === id)
        if (system) {
          const currentTags = system.tags || []
          // Only update if tag doesn't exist
          if (!currentTags.includes(trimmedTag)) {
            const { error } = await supabase
              .from('world_elements')
              .update({
                tags: [...currentTags, trimmedTag],
                updated_at: new Date().toISOString()
              })
              .eq('id', id)

            if (error) throw error
          }
        }
      }

      showToast(`Added tag "${trimmedTag}" to ${idsToUpdate.length} systems`, 'success', handleUndo)
      setShowAddTagDialog(false)
      setNewTag('')
      onSystemsChange?.()
    } catch (error) {
      console.error('Error bulk adding tag:', error)
      
      // ROLLBACK
      setSystems(previousSystems)
      
      showToast('Failed to add tag', 'error')
      setUndoSnapshot(null)
    }
  }

  /**
   * Get all unique tags from selected systems
   */
  const getSelectedTags = (): string[] => {
    const tagSet = new Set<string>()
    systems.forEach(system => {
      if (selectedIds.has(system.id) && system.tags) {
        system.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }

  /**
   * Export selected systems as JSON
   */
  const handleExportJSON = () => {
    if (selectedIds.size === 0) return

    const selectedSystems = systems.filter(s => selectedIds.has(s.id))
    const json = JSON.stringify(selectedSystems, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `systems-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast(`Exported ${selectedSystems.length} systems as JSON`, 'success')
  }

  /**
   * Export selected systems as CSV
   */
  const handleExportCSV = () => {
    if (selectedIds.size === 0) return

    const selectedSystems = systems.filter(s => selectedIds.has(s.id))
    
    // CSV headers
    const headers = [
      'ID', 'Name', 'Type', 'Scope', 'Status', 'Description', 
      'Governance', 'Rules', 'Tags', 'Created', 'Updated'
    ]
    
    // CSV rows
    const rows = selectedSystems.map(s => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      s.attributes?.type || '',
      s.attributes?.scope || '',
      s.attributes?.status || '',
      `"${(s.description || '').replace(/"/g, '""')}"`,
      `"${(s.attributes?.governance || '').replace(/"/g, '""')}"`,
      `"${(s.attributes?.rules || '').replace(/"/g, '""')}"`,
      `"${(s.tags || []).join(', ')}"`,
      s.created_at,
      s.updated_at
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `systems-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast(`Exported ${selectedSystems.length} systems as CSV`, 'success')
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Apply search, sort, and filters to get visible systems (memoized for performance)
  const visibleSystems = useMemo(
    () => applySearchSortFilter(systems, { query, sort, filters }),
    [systems, query, sort, filters]
  )

  // Legacy filtered systems (for backward compatibility with existing code)
  const legacyFilteredSystems = useMemo(
    () => systems.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [systems, searchTerm]
  )

  // Stats for display
  const totalSystems = systems.length
  const filteredCount = visibleSystems.length
  const hasActiveFilters = query.trim() !== '' || filters.types.length > 0 || 
                          filters.scopes.length > 0 || filters.status.length > 0

  // Toggle all handler (defined after visibleSystems)
  const handleToggleAll = useCallback(() => {
    const visibleIds = visibleSystems.map(s => s.id)
    const allSelected = visibleIds.every(id => selectedIds.has(id))
    
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        // Deselect all visible
        visibleIds.forEach(id => next.delete(id))
      } else {
        // Select all visible
        visibleIds.forEach(id => next.add(id))
      }
      return next
    })
  }, [visibleSystems, selectedIds])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
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
    )
  }

  // Full-page inline editor view (like Items panel)
  if (isCreating || (editing && !editorOpen && !quickItem)) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 rounded-xl px-3 py-1.5 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </Button>
                <div className="w-px h-6 bg-gray-200" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {isCreating ? 'Create New System' : `Edit ${editing?.name || 'System'}`}
                  </h1>
                  <p className="text-xs text-gray-600">
                    {isCreating ? 'Add a new system to your world.' : 'Modify the details of this system.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content - Embedded directly */}
        <div className="flex-1 overflow-y-auto">
          <SystemEditorDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) resetForm()
            }}
            initial={editing}
            onSave={handleCreateSystem}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            projectId={projectId}
            inline={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Systems</h1>
                <p className="text-sm text-gray-500">Define political, economic, and social structures that govern your world</p>
              </div>
            </div>
            <Button 
              onClick={handleNewSystem}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2.5 font-medium flex items-center gap-2"
              aria-label="Create new system (Press N)"
            >
              <Plus className="w-4 h-4" />
              New System
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <SystemsToolbar
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        filters={filters}
        onFilters={setFilters}
        view={view}
        onView={setView}
        onNew={handleNewSystem}
        bulkMode={bulkMode}
        onBulkMode={handleBulkModeChange}
        selectionCount={selectedIds.size}
        onClearFilters={handleClearFilters}
        onBulkDelete={handleBulkDelete}
      />

      {/* Bulk Actions Bar - Shown when systems are selected */}
      {bulkMode && selectedIds.size > 0 && (
        <BulkActionsBar
          selectionCount={selectedIds.size}
          onSetStatus={handleBulkSetStatus}
          onAddTag={() => setShowAddTagDialog(true)}
          onDelete={handleBulkDelete}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          uniqueTags={getSelectedTags()}
          hasUndo={!!undoSnapshot}
          onUndo={handleUndo}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6">
          {/* Results summary */}
          {hasActiveFilters && (
            <div className="mb-4 text-sm text-gray-600 pt-6">
              Showing <span className="font-semibold text-gray-900">{filteredCount}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalSystems}</span> systems
            </div>
          )}

          {/* Empty state */}
          {visibleSystems.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              {hasActiveFilters ? (
                <>
                  <p className="text-gray-600 text-lg mb-2">No systems match your filters</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setQuery('')
                      handleClearFilters()
                    }}
                  >
                    Clear all filters
                  </Button>
                </>
              ) : (
                <SystemsGrid
                  systems={[]}
                  bulkMode={bulkMode}
                  selectedIds={selectedIds}
                  onToggleSelection={handleToggleSelection}
                  onQuickView={handleQuickView}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onCreateFirst={handleNewSystem}
                />
              )}
            </div>
          ) : (
            /* Systems Grid/List - using visibleSystems (filtered, sorted) */
            <div className="pb-6">
              <SystemsGrid
                systems={visibleSystems}
                bulkMode={bulkMode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onQuickView={handleQuickView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onCreateFirst={handleNewSystem}
                viewMode={view}
              />
            </div>
          )}

          {/* Add Tag Dialog */}
          <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
            <DialogContent className="bg-white border-2 border-gray-200 shadow-2xl max-w-md">
              <DialogHeader className="pb-4 border-b border-gray-100">
                <DialogTitle className="text-xl font-bold text-gray-900">Add Tag to {selectedIds.size} System{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-2">
                  Enter a tag to add to all selected systems. The tag will only be added if it doesn't already exist on a system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-tag" className="text-sm font-semibold text-gray-900">Tag Name</Label>
                  <Input
                    id="new-tag"
                    placeholder="e.g., important, reviewed, legacy..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        handleBulkAddTag(newTag)
                      }
                    }}
                    className="bg-white border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    autoFocus
                  />
                </div>

                {/* Show existing tags from selection */}
                {getSelectedTags().length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Existing tags on selected systems:</Label>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedTags().map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer bg-gray-100 hover:bg-teal-100 border-2 border-gray-300 hover:border-teal-400 text-gray-700 hover:text-teal-700 transition-all duration-200"
                          onClick={() => setNewTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click a tag to use it</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTagDialog(false)
                    setNewTag('')
                  }}
                  className="rounded-xl border-2 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleBulkAddTag(newTag)}
                  disabled={!newTag.trim()}
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}