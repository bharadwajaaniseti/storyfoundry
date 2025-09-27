'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Plus, Search, Edit3, Trash2, BookOpen, Tag, 
  FileText, User, MapPin, Package, Calendar,
  Zap, Globe, Cog, Save, X, Download, Copy,
  Clock, Layout, Link, Link2, ExternalLink, History,
  Image as ImageIcon, Table, Play, Volume2, Code, Bold, Italic, Underline, BarChart3,
  ChevronUp, ChevronDown, Crown, Shield, Heart, Users, Map, Palette, Brain, Sparkles, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupabaseClient } from '@/lib/auth'
import { 
  uploadEncyclopediaMedia, 
  formatFileSize, 
  isSupabaseStorageUrl 
} from '@/lib/encyclopedia-storage'

// World Element Types Configuration
const WORLD_ELEMENT_TYPES = {
  characters: { label: 'Characters', icon: Users, emoji: '👤' },
  relationships: { label: 'Relationships', icon: Heart, emoji: '💕' },
  locations: { label: 'Locations', icon: MapPin, emoji: '📍' },
  timeline: { label: 'Timeline', icon: Clock, emoji: '📅' },
  calendar: { label: 'Calendar', icon: Calendar, emoji: '📅' },
  calendar_system: { label: 'Calendar', icon: Calendar, emoji: '📅' },
  research: { label: 'Research', icon: BookOpen, emoji: '📄' },
  maps: { label: 'Maps', icon: Map, emoji: '🗺️' },
  species: { label: 'Species', icon: Zap, emoji: '🧬' },
  cultures: { label: 'Cultures', icon: Crown, emoji: '👑' },
  items: { label: 'Items', icon: Package, emoji: '⚔️' },
  systems: { label: 'Systems', icon: Globe, emoji: '🌍' },
  languages: { label: 'Languages', icon: Shield, emoji: '🗣️' },
  religions: { label: 'Religions', icon: Heart, emoji: '⛪' },
  philosophies: { label: 'Philosophies', icon: Brain, emoji: '🧠' },
  encyclopedia: { label: 'Encyclopedia', icon: BookOpen, emoji: '📚' },
  magic: { label: 'Magic', icon: Sparkles, emoji: '✨' },
  arcs: { label: 'Arcs', icon: Star, emoji: '⭐' }
}

// Rich Text Toolbar Component
function RichTextToolbar({ 
  onAddImage, 
  onAddTable, 
  onAddStats, 
  onAddMedia,
  onAddLink,
  onFormatText,
  activeField = null 
}: {
  onAddImage: () => void
  onAddTable: () => void
  onAddStats: () => void
  onAddMedia: () => void
  onAddLink: () => void
  onFormatText: (format: string) => void
  activeField?: string | null
}) {
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-lg mb-2 flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-600 mr-2">Format:</span>
        <button
          type="button"
          onClick={() => onFormatText('bold')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('italic')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText('underline')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline className="w-3 h-3" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-600 mr-2">Insert:</span>
        <button
          type="button"
          onClick={onAddImage}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          Image
        </button>
        <button
          type="button"
          onClick={onAddTable}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
        >
          <Table className="w-3 h-3" />
          Table
        </button>
        <button
          type="button"
          onClick={onAddStats}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors"
        >
          <Cog className="w-3 h-3" />
          Stats
        </button>
        <button
          type="button"
          onClick={onAddMedia}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
        >
          <Play className="w-3 h-3" />
          Media
        </button>
        <button
          type="button"
          onClick={onAddLink}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
          title="Link Element"
        >
          <Link2 className="w-3 h-3" />
          Link
        </button>
      </div>
    </div>
  )
}

// Resizable Image Component
const ResizableImage = ({ 
  src, 
  alt, 
  caption, 
  initialWidth, 
  initialHeight,
  isEditing = false,
  onResize,
  imageIndex
}: {
  src: string
  alt: string
  caption?: string
  initialWidth?: number
  initialHeight?: number
  isEditing?: boolean
  onResize?: (width: number, height: number, index: number) => void
  imageIndex?: number
}) => {
  const [size, setSize] = useState({
    width: initialWidth || 0,
    height: initialHeight || 0
  })
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 })
  const [aspectRatio, setAspectRatio] = useState(1)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      // Calculate mouse movement from start position
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      // Use the average of both deltas for more natural resizing
      const avgDelta = (deltaX + deltaY) / 2
      
      // Calculate new width with constraints
      const newWidth = Math.max(80, Math.min(1000, originalSize.width + avgDelta))
      const newHeight = newWidth / aspectRatio
      
      const newSize = { 
        width: Math.round(newWidth), 
        height: Math.round(newHeight) 
      }
      
      setSize(newSize)
      
      // Callback to parent immediately for markdown update
      if (onResize && typeof imageIndex === 'number') {
        onResize(newSize.width, newSize.height, imageIndex)
      }
    })
  }, [isResizing, dragStart, originalSize, aspectRatio, onResize, imageIndex])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(false)
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Reset cursor and user selection
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }, [isResizing])

  // Prevent default for various events during resize
  const preventDefault = useCallback((e: Event) => {
    e.preventDefault()
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!containerRef.current || size.width === 0 || size.height === 0) return
    
    console.log('Mouse down - starting resize', { currentSize: size })
    
    // Capture initial values immediately (not using state)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height
    const ratio = startWidth / startHeight
    
    // Create local handlers that don't depend on React state
    const localMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      moveEvent.stopPropagation()
      
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const avgDelta = (deltaX + deltaY) / 2
      
      const newWidth = Math.max(80, Math.min(1000, startWidth + avgDelta))
      const newHeight = newWidth / ratio
      
      const newSize = { 
        width: Math.round(newWidth), 
        height: Math.round(newHeight) 
      }
      
      setSize(newSize)
      
      if (onResize && typeof imageIndex === 'number') {
        onResize(newSize.width, newSize.height, imageIndex)
      }
    }
    
    const localMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault()
      upEvent.stopPropagation()
      
      console.log('Mouse up - ending resize')
      setIsResizing(false)
      
      // Remove all listeners
      document.removeEventListener('mousemove', localMouseMove, true)
      document.removeEventListener('mouseup', localMouseUp, true)
      window.removeEventListener('mousemove', localMouseMove, true)
      window.removeEventListener('mouseup', localMouseUp, true)
      
      // Reset styles
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }
    
    // Set state and styles
    setIsResizing(true)
    setDragStart({ x: startX, y: startY })
    setOriginalSize({ width: startWidth, height: startHeight })
    setAspectRatio(ratio)
    
    document.body.style.cursor = 'se-resize'
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    
    // Add listeners immediately with capture=true
    document.addEventListener('mousemove', localMouseMove, { passive: false, capture: true })
    document.addEventListener('mouseup', localMouseUp, { passive: false, capture: true })
    window.addEventListener('mousemove', localMouseMove, { passive: false, capture: true })
    window.addEventListener('mouseup', localMouseUp, { passive: false, capture: true })
    
    console.log('Event listeners added for resize')
    
  }, [size, onResize, imageIndex])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }
  }, [])

  // Auto-set initial dimensions when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if ((!initialWidth && !initialHeight) || (size.width === 0 && size.height === 0)) {
      // Set initial size to a reasonable default while maintaining aspect ratio
      const maxWidth = 400
      const naturalAspectRatio = img.naturalHeight / img.naturalWidth
      const newWidth = Math.min(img.naturalWidth, maxWidth)
      const newHeight = Math.round(newWidth * naturalAspectRatio)
      const newSize = { width: newWidth, height: newHeight }
      setSize(newSize)
      
      // Also notify the parent component about the initial size
      if (onResize && typeof imageIndex === 'number') {
        onResize(newWidth, newHeight, imageIndex)
      }
    } else if (initialWidth && initialHeight) {
      // Use provided dimensions
      setSize({ width: initialWidth, height: initialHeight })
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block my-4">
      <div 
        className={`relative rounded-lg overflow-hidden shadow-md transition-all duration-200 select-none ${
          isEditing && !isResizing ? 'hover:shadow-xl hover:scale-[1.02]' : ''
        } ${isResizing ? 'shadow-2xl ring-4 ring-blue-400 ring-opacity-30 scale-[1.01]' : ''}`}
        style={{ 
          width: size.width > 0 ? `${size.width}px` : 'auto', 
          height: size.height > 0 ? `${size.height}px` : 'auto',
          minWidth: isEditing ? '80px' : 'auto',
          maxWidth: '1000px',
          transition: isResizing ? 'none' : 'all 0.2s ease-out',
          position: 'relative',
          isolation: 'isolate'
        }}
        onMouseDown={(e) => {
          // Prevent any interference with resize handle
          if (isEditing && !isResizing) {
            e.stopPropagation()
          }
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={`w-full h-full transition-all duration-200 select-none ${
            size.width > 0 ? 'object-cover' : 'object-contain'
          } ${isResizing ? 'pointer-events-none opacity-95' : 'opacity-100'}`}
          style={{ 
            width: size.width > 0 ? `${size.width}px` : 'auto', 
            height: size.height > 0 ? `${size.height}px` : 'auto',
            transition: isResizing ? 'none' : 'all 0.2s ease-out'
          }}
          onLoad={handleImageLoad}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDcuMTcgMTIuNDUgNS44OCAxMS43OUM1LjY5IDExLjY5IDUuNDYgMTEuNjMgNS4yMyAxMS42M0M0Ljg2IDExLjYzIDQuNSAxMS43NyA0LjI1IDEyLjAyTDIuMjkgMTRDMi4xIDEzLjY0IDIgMTMuMjIgMiAxMi43N0wyIDEwVjhDMiA3LjQ1IDIuMjIgNi45NSAyLjU5IDYuNTlDMi45NSA2LjIyIDMuNDUgNiA0IDZIMjBDMjAuNTUgNiAyMS4wNSA2.MjIgMjEuNDEgNi41OUMyMS43OCA2Ljk1IDIyIDcuNDUgMjIgOFYxMFYxMi43N0MyMiAxMy4yMiAyMS45IDEzLjY0IDIxLjcxIDE0TDE5Ljc1IDEyLjAyQzE5LjUgMTEuNzcgMTkuMTQgMTEuNjMgMTguNzcgMTEuNjNDMTguNTQgMTEuNjMgMTguMzEgMTEuNjkgMTguMTIgMTEuNzlDMTYuODMgMTIuNDUgMTQuMjEgMTMuNzkgMTIgMTZaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* Resize handle - only show in editing mode */}
        {isEditing && (
          <>
            <div
              className="absolute bottom-0 right-0 w-12 h-12 bg-blue-500 cursor-se-resize opacity-90 hover:opacity-100 transition-all duration-200 border-l-4 border-t-4 border-white shadow-xl hover:scale-110 z-50"
              onMouseDown={handleMouseDown}
              onDragStart={(e) => e.preventDefault()}
              style={{
                clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
                touchAction: 'none'
              }}
              title="Drag to resize image"
            />
            
            {/* Corner grip lines for better visibility */}
            <div className="absolute bottom-2 right-2 pointer-events-none z-40">
              <div className="w-4 h-0.5 bg-white opacity-90 mb-0.5 transform rotate-45 origin-left"></div>
              <div className="w-3 h-0.5 bg-white opacity-90 mb-0.5 transform rotate-45 origin-left"></div>
              <div className="w-2 h-0.5 bg-white opacity-90 transform rotate-45 origin-left"></div>
            </div>
          </>
        )}
        
        {/* Size display tooltip in editing mode */}
        {isEditing && (isResizing || size.width > 0) && (
          <div className="absolute top-3 left-3 bg-gray-900 bg-opacity-95 text-white text-sm px-3 py-2 rounded-lg shadow-2xl z-30 border border-gray-600 backdrop-blur-sm">
            <div className="font-mono font-medium">
              {Math.round(size.width)} × {Math.round(size.height)}px
            </div>
          </div>
        )}
        
        {/* Resize indicator when hovering in edit mode */}
        {isEditing && !isResizing && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-all duration-300 bg-blue-500 bg-opacity-5 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none">
            <div className="absolute bottom-12 right-3 text-blue-700 text-xs font-semibold bg-blue-50 bg-opacity-90 px-3 py-1.5 rounded-full shadow-md border border-blue-200">
              Drag corner to resize
            </div>
          </div>
        )}
      </div>
      
      {caption && (
        <p className="text-sm text-gray-600 text-center mt-2 italic">
          {caption}
        </p>
      )}
    </div>
  )
}

// Element Link Component - Modern clickable button for linked worldbuilding elements
const ElementLink = ({ elementName, category, elementId, onElementClick }: {
  elementName: string
  category: string
  elementId: string
  onElementClick?: (elementId: string, category: string) => void
}) => {
  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'characters': return <User className="w-3 h-3" />
      case 'locations': return <MapPin className="w-3 h-3" />
      case 'organizations': return <Shield className="w-3 h-3" />
      case 'items': return <Crown className="w-3 h-3" />
      case 'lore': return <Heart className="w-3 h-3" />
      case 'encyclopedia': return <BookOpen className="w-3 h-3" />
      case 'events': return <Calendar className="w-3 h-3" />
      case 'maps': return <Globe className="w-3 h-3" />
      case 'research': return <Zap className="w-3 h-3" />
      default: return <BookOpen className="w-3 h-3" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'characters': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
      case 'locations': return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
      case 'organizations': return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
      case 'items': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200'
      case 'lore': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
      case 'encyclopedia': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200'
      case 'events': return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
      case 'maps': return 'bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200'
      case 'research': return 'bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
    }
  }

  return (
    <button
      onClick={() => onElementClick?.(elementId, category)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer element-link ${getCategoryColor(category)}`}
      title={`${category}: ${elementName}`}
    >
      {getIcon(category)}
      <span className="truncate max-w-32 element-name">{elementName}</span>
    </button>
  )
}

// Utility function to render markdown-like content with inline images, tables, and element links
const renderRichText = (text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void, onElementClick?: (elementId: string, category: string) => void) => {
  if (!text) return null
  
  // First, let's split by images and tables, but preserve everything else
  const parts = text.split(/(\!\[.*?\]\([^)]*\)|(?:\n\*\*.*?\*\*\n)?\n(?:\|.*?\|\n)+)/g)
  let imageIndex = 0
  
  const processTextForElementLinks = (textPart: string) => {
    if (!textPart) return null
    
    // More robust approach: find all element links and their positions
    const elementLinkPattern = /@\{([^|]+)\|([^|]+)\|([^}]+)\}/g
    const matches = []
    let match
    
    // Find all matches and their positions
    while ((match = elementLinkPattern.exec(textPart)) !== null) {
      matches.push({
        match: match[0],
        elementName: match[1],
        category: match[2],
        elementId: match[3],
        start: match.index,
        end: match.index + match[0].length
      })
    }
    
    if (matches.length === 0) {
      // No element links, return as text
      return (
        <span className="whitespace-pre-wrap">
          {textPart}
        </span>
      )
    }
    
    // Build components with text and links
    const components = []
    let lastEnd = 0
    
    matches.forEach((matchData, index) => {
      // Add text before this match
      if (matchData.start > lastEnd) {
        const beforeText = textPart.slice(lastEnd, matchData.start)
        if (beforeText) {
          components.push(
            <span key={`text-before-${index}`} className="whitespace-pre-wrap">
              {beforeText}
            </span>
          )
        }
      }
      
      // Add the element link
      components.push(
        <ElementLink 
          key={`link-${index}`}
          elementName={matchData.elementName}
          category={matchData.category}
          elementId={matchData.elementId}
          onElementClick={onElementClick}
        />
      )
      
      lastEnd = matchData.end
    })
    
    // Add any remaining text after the last match
    if (lastEnd < textPart.length) {
      const afterText = textPart.slice(lastEnd)
      if (afterText) {
        components.push(
          <span key="text-after" className="whitespace-pre-wrap">
            {afterText}
          </span>
        )
      }
    }
    
    return components
  }
  
  return (
    <>
      {parts.map((part, index) => {
        // Handle images: ![alt](url "caption") or ![alt](url width=200 height=150 "caption")
        const imageMatch = part.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+width=(\d+))?\s*(?:\s+height=(\d+))?\s*(?:\s+"([^"]*)")?\)/)
        if (imageMatch) {
          const [, alt, url, width, height, caption] = imageMatch
          const currentImageIndex = imageIndex++
          return (
            <ResizableImage
              key={`img-${index}`}
              src={url}
              alt={alt}
              caption={caption}
              initialWidth={width ? parseInt(width) : undefined}
              initialHeight={height ? parseInt(height) : undefined}
              isEditing={isEditing}
              onResize={onImageResize}
              imageIndex={currentImageIndex}
            />
          )
        }
        
        // Handle tables
        const tableMatch = part.match(/(?:\n\*\*(.+?)\*\*\n)?\n(\|.+\|\n(?:\|.+\|\n)+)/g)
        if (tableMatch) {
          const lines = part.trim().split('\n')
          let title = ''
          let tableStart = 0
          
          // Check if first line is a title
          if (lines[0]?.match(/\*\*(.+?)\*\*/)) {
            title = lines[0].replace(/\*\*(.+?)\*\*/, '$1')
            tableStart = 1
            // Skip empty line after title
            if (lines[1] === '') tableStart = 2
          }
          
          const tableLines = lines.slice(tableStart).filter(line => line.startsWith('|'))
          if (tableLines.length >= 2) {
            const headers = tableLines[0].split('|').slice(1, -1).map(h => h.trim())
            const rows = tableLines.slice(2).map(line => 
              line.split('|').slice(1, -1).map(cell => cell.trim())
            )
            
            return (
              <div key={`table-${index}`} className="my-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {title && (
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{title}</h4>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        }
        
        // Handle regular text (which might contain element links)
        if (part && part.trim()) {
          return (
            <div key={`content-${index}`}>
              {processTextForElementLinks(part)}
            </div>
          )
        }
        
        return null
      }).filter(Boolean)}
    </>
  )
}

interface EncyclopediaEntry {
  id: string
  project_id: string
  category: string
  name: string
  description: string
  attributes: {
    type: string
    definition: string
    pronunciation?: string
    etymology?: string
    origin?: string
    related_terms?: string
    examples?: string
    cross_references?: string[]
    images?: Array<{
      url: string
      caption?: string
      alt?: string
      width?: number
      height?: number
    }>
    tables?: Array<{
      title: string
      headers: string[]
      rows: string[][]
    }>
    stats?: Array<{
      label: string
      value: string
      category?: string
    }>
    rich_content?: {
      formatted_description?: string
      embedded_media?: Array<{
        type: 'video' | 'audio' | 'iframe'
        url: string
        title?: string
      }>
    }
  }
  tags: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

interface EncyclopediaTemplate {
  id: string
  name: string
  type: string
  attributes: {
    definition: string
    etymology?: string
    origin?: string
    related_terms?: string
    examples?: string
  }
  tags: string[]
}

interface EncyclopediaPanelProps {
  projectId: string
  selectedElement?: any | null  // WorldElement from sidebar
  onEncyclopediaChange?: () => void
  onNavigateToElement?: (elementId: string, category: string) => void
}

export default function EncyclopediaPanel({ projectId, selectedElement, onEncyclopediaChange, onNavigateToElement }: EncyclopediaPanelProps) {
  const [entries, setEntries] = useState<EncyclopediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<EncyclopediaEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [recentEntries, setRecentEntries] = useState<string[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showSingleExportDialog, setShowSingleExportDialog] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showTableEditor, setShowTableEditor] = useState(false)
  const [showStatsEditor, setShowStatsEditor] = useState(false)
  const [showMediaEmbed, setShowMediaEmbed] = useState(false)
  const [crossReferences, setCrossReferences] = useState<{[key: string]: EncyclopediaEntry[]}>({})  
  
  // Link modal states
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ field: '', position: 0 })
  const [allWorldElements, setAllWorldElements] = useState<any[]>([])
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [imageForm, setImageForm] = useState({ 
    url: '', 
    caption: '', 
    alt: '', 
    uploadMethod: 'url' as 'url' | 'upload',
    file: null as File | null 
  })
  const [tableForm, setTableForm] = useState({ title: '', headers: '', data: '' })
  const [statsForm, setStatsForm] = useState({ stats: '', category: '' })
  const [mediaForm, setMediaForm] = useState({ type: 'video' as 'video' | 'audio' | 'iframe', url: '', title: '' })

  const supabase = createSupabaseClient()

  // Handle element link clicks - navigate to element
  const handleElementClick = (elementId: string, category: string) => {
    console.log('Encyclopedia: Element link clicked:', elementId, category)
    if (onNavigateToElement) {
      onNavigateToElement(elementId, category)
    } else {
      console.warn('No navigation handler provided to EncyclopediaPanel')
    }
  }

  // Handle image resizing in the main viewer (this is for non-editing mode)
  const handleViewerImageResize = (width: number, height: number, imageIndex: number, fieldName?: string) => {
    // In viewer mode, we don't allow resizing, but this could be extended
    // for future features like saving resize preferences
    console.log('Image resized in viewer:', { width, height, imageIndex, fieldName })
  }

  // Entry types with icons
  const entryTypes = [
    { id: 'concept', label: 'Concept', icon: FileText, color: 'text-blue-600' },
    { id: 'person', label: 'Person', icon: User, color: 'text-green-600' },
    { id: 'place', label: 'Place', icon: MapPin, color: 'text-purple-600' },
    { id: 'object', label: 'Object', icon: Package, color: 'text-orange-600' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-red-600' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-indigo-600' },
    { id: 'culture', label: 'Culture', icon: Zap, color: 'text-pink-600' },
    { id: 'technology', label: 'Technology', icon: Cog, color: 'text-gray-600' }
  ]

  // Predefined templates for quick entry creation
  const templates: EncyclopediaTemplate[] = [
    {
      id: 'character-template',
      name: 'Character Profile',
      type: 'person',
      attributes: {
        definition: 'A [role/occupation] known for [key trait/achievement]',
        origin: 'Born in [location] during [time period]',
        related_terms: 'Family members, allies, enemies',
        examples: 'Notable actions, quotes, or appearances'
      },
      tags: ['character', 'person']
    },
    {
      id: 'location-template',
      name: 'Location Guide',
      type: 'place',
      attributes: {
        definition: 'A [type of place] located in [region/area]',
        origin: 'Established/discovered in [time period] by [founder/discoverer]',
        etymology: 'The name comes from [language/meaning]',
        examples: 'Important events, landmarks, or features'
      },
      tags: ['location', 'place']
    },
    {
      id: 'concept-template',
      name: 'Concept Explanation',
      type: 'concept',
      attributes: {
        definition: 'A [type of concept] that involves [key aspects]',
        origin: 'First developed/discovered by [person/culture] in [time period]',
        related_terms: 'Similar concepts, opposing ideas, prerequisites',
        examples: 'Real-world applications, historical instances'
      },
      tags: ['concept', 'theory']
    },
    {
      id: 'object-template',
      name: 'Artifact/Object',
      type: 'object',
      attributes: {
        definition: 'A [type of object] that [primary function/purpose]',
        origin: 'Created by [maker/culture] in [time period] for [purpose]',
        etymology: 'Named after [origin of name]',
        examples: 'Notable uses, appearances, or significance'
      },
      tags: ['artifact', 'item']
    }
  ]

  useEffect(() => {
    fetchEntries()
  }, [projectId])

  // Detect cross-references in text
  const detectCrossReferences = (text: string, currentEntryId: string) => {
    const references: EncyclopediaEntry[] = []
    entries.forEach(entry => {
      if (entry.id !== currentEntryId && text.toLowerCase().includes(entry.name.toLowerCase())) {
        references.push(entry)
      }
    })
    return references
  }

  // Add to recent entries
  const addToRecent = (entryId: string) => {
    setRecentEntries(prev => {
      const filtered = prev.filter(id => id !== entryId)
      return [entryId, ...filtered].slice(0, 5) // Keep last 5
    })
  }

  // Export functionality
  const exportEncyclopedia = async (format: 'json' | 'markdown') => {
    try {
      if (format === 'json') {
        const dataStr = JSON.stringify(entries, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `encyclopedia-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === 'markdown') {
        let markdown = '# Encyclopedia Export\n\n'
        entries.forEach(entry => {
          markdown += `## ${entry.name}\n\n`
          if (entry.attributes?.definition) {
            markdown += `**Definition:** ${entry.attributes.definition}\n\n`
          }
          if (entry.description) {
            markdown += `${entry.description}\n\n`
          }
          if (entry.attributes?.origin) {
            markdown += `**Origin:** ${entry.attributes.origin}\n\n`
          }
          if (entry.attributes?.etymology) {
            markdown += `**Etymology:** ${entry.attributes.etymology}\n\n`
          }
          if (entry.tags.length > 0) {
            markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`
          }
          markdown += '---\n\n'
        })
        const dataBlob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `encyclopedia-${new Date().toISOString().split('T')[0]}.md`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Export individual entry
  const exportSingleEntry = async (entry: EncyclopediaEntry, format: 'json' | 'markdown') => {
    try {
      if (format === 'json') {
        const dataStr = JSON.stringify(entry, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${entry.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === 'markdown') {
        let markdown = `# ${entry.name}\n\n`
        
        if (entry.attributes?.definition) {
          markdown += `**Definition:** ${entry.attributes.definition}\n\n`
        }
        
        if (entry.description) {
          markdown += `## Description\n\n${entry.description}\n\n`
        }
        
        if (entry.attributes?.origin) {
          markdown += `## Origin\n\n${entry.attributes.origin}\n\n`
        }
        
        if (entry.attributes?.etymology) {
          markdown += `## Etymology\n\n${entry.attributes.etymology}\n\n`
        }
        
        if (entry.attributes?.related_terms) {
          markdown += `## Related Terms\n\n${entry.attributes.related_terms}\n\n`
        }
        
        if (entry.attributes?.examples) {
          markdown += `## Examples & Usage\n\n${entry.attributes.examples}\n\n`
        }
        
        if (entry.tags.length > 0) {
          markdown += `## Tags\n\n${entry.tags.map(tag => `- ${tag}`).join('\n')}\n\n`
        }
        
        markdown += `---\n\n*Entry Type: ${entry.attributes?.type || 'Unknown'}*\n`
        markdown += `*Created: ${new Date(entry.created_at).toLocaleDateString()}*\n`
        markdown += `*Last Modified: ${new Date(entry.updated_at).toLocaleDateString()}*\n`
        
        const dataBlob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${entry.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Single entry export failed:', error)
    }
  }

  // Duplicate entry function
  const duplicateEntry = (entry: EncyclopediaEntry) => {
    const duplicated: EncyclopediaEntry = {
      ...entry,
      id: `temp-${Date.now()}`,
      name: `${entry.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSelectedEntry(duplicated)
    setIsEditing(true)
  }

  // Advanced content management functions
  const addImage = (entry: EncyclopediaEntry, imageData: { url: string; caption?: string; alt?: string }) => {
    const updatedEntry = {
      ...entry,
      attributes: {
        ...entry.attributes,
        images: [...(entry.attributes.images || []), imageData]
      }
    }
    return updatedEntry
  }

  const addTable = (entry: EncyclopediaEntry, tableData: { title: string; headers: string[]; rows: string[][] }) => {
    const updatedEntry = {
      ...entry,
      attributes: {
        ...entry.attributes,
        tables: [...(entry.attributes.tables || []), tableData]
      }
    }
    return updatedEntry
  }

  const addStats = (entry: EncyclopediaEntry, statsData: Array<{ label: string; value: string; category?: string }>) => {
    const updatedEntry = {
      ...entry,
      attributes: {
        ...entry.attributes,
        stats: [...(entry.attributes.stats || []), ...statsData]
      }
    }
    return updatedEntry
  }

  const addEmbeddedMedia = (entry: EncyclopediaEntry, mediaData: { type: 'video' | 'audio' | 'iframe'; url: string; title?: string }) => {
    const updatedEntry = {
      ...entry,
      attributes: {
        ...entry.attributes,
        rich_content: {
          ...entry.attributes.rich_content,
          embedded_media: [...(entry.attributes.rich_content?.embedded_media || []), mediaData]
        }
      }
    }
    return updatedEntry
  }

  // Handle selectedElement from sidebar
  useEffect(() => {
    if (selectedElement && selectedElement.category === 'encyclopedia') {
      // Find the entry in our current entries or set it directly if it's already loaded
      const existingEntry = entries.find(entry => entry.id === selectedElement.id)
      if (existingEntry) {
        setSelectedEntry(existingEntry)
        setIsEditing(false)
      } else if (selectedElement.id) {
        // Convert the sidebar element to encyclopedia entry format
        const encyclopediaEntry: EncyclopediaEntry = {
          id: selectedElement.id,
          project_id: selectedElement.project_id,
          category: selectedElement.category,
          name: selectedElement.name,
          description: selectedElement.description,
          attributes: selectedElement.attributes || {},
          tags: selectedElement.tags || [],
          created_at: selectedElement.created_at,
          updated_at: selectedElement.updated_at
        }
        setSelectedEntry(encyclopediaEntry)
        setIsEditing(false)
      }
    }
  }, [selectedElement, entries])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      
      // Load encyclopedia entries and all world elements for linking
      const [entriesResult, worldElementsResult] = await Promise.all([
        supabase
          .from('world_elements')
          .select('*')
          .eq('project_id', projectId)
          .eq('category', 'encyclopedia')
          .order('name', { ascending: true }),
        supabase
          .from('world_elements')
          .select('id, name, category, description')
          .eq('project_id', projectId)
          .neq('category', 'encyclopedia')
          .order('category, name')
      ])

      if (entriesResult.error) throw entriesResult.error
      if (worldElementsResult.error) throw worldElementsResult.error
      
      setEntries(entriesResult.data || [])
      setAllWorldElements(worldElementsResult.data || [])
    } catch (error) {
      console.error('Error fetching encyclopedia entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewEntry = (template?: EncyclopediaTemplate) => {
    // Create a temporary entry that hasn't been saved to database yet
    const tempEntry: EncyclopediaEntry = {
      id: `temp-${Date.now()}`, // Temporary ID
      project_id: projectId,
      category: 'encyclopedia',
      name: template ? `New ${template.name}` : 'New Encyclopedia',
      description: '',
      attributes: {
        type: template?.type || 'concept',
        definition: template?.attributes.definition || '',
        pronunciation: '',
        etymology: template?.attributes.etymology || '',
        origin: template?.attributes.origin || '',
        related_terms: template?.attributes.related_terms || '',
        examples: template?.attributes.examples || '',
        cross_references: []
      },
      tags: template?.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSelectedEntry(tempEntry)
    setIsEditing(true)
  }

  const createBasicEntry = () => createNewEntry()
  const createFromTemplate = (template: EncyclopediaTemplate) => createNewEntry(template)

  const saveEntry = async (entryToSave: EncyclopediaEntry) => {
    try {
      const isNewEntry = entryToSave.id.startsWith('temp-')
      
      if (isNewEntry) {
        // Create new entry in database
        const { id, created_at, updated_at, ...entryData } = entryToSave
        
        const { data, error } = await supabase
          .from('world_elements')
          .insert(entryData)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setEntries(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
          setSelectedEntry(data)
          setIsEditing(false)
          onEncyclopediaChange?.()
        }
      } else {
        // Update existing entry
        const { data, error } = await supabase
          .from('world_elements')
          .update({
            name: entryToSave.name,
            description: entryToSave.description,
            attributes: entryToSave.attributes,
            tags: entryToSave.tags,
            image_url: entryToSave.image_url
          })
          .eq('id', entryToSave.id)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setEntries(prev => 
            prev.map(entry => entry.id === data.id ? data : entry)
              .sort((a, b) => a.name.localeCompare(b.name))
          )
          setSelectedEntry(data)
          setIsEditing(false)
          onEncyclopediaChange?.()
        }
      }
    } catch (error) {
      console.error('Error saving encyclopedia entry:', error)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase
        .from('world_elements')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.id !== entryId))
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null)
        setIsEditing(false)
      }
      
      onEncyclopediaChange?.()
    } catch (error) {
      console.error('Error deleting encyclopedia entry:', error)
    }
  }

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.attributes?.definition && entry.attributes.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || entry.attributes?.type === selectedType
    
    return matchesSearch && matchesType
  })

  const getTypeInfo = (type: string) => {
    return entryTypes.find(t => t.id === type) || entryTypes[0]
  }

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading encyclopedia...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header with controls - Only show when not viewing/editing an entry */}
      {!selectedEntry && (
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-orange-600" />
              Encyclopedia
              <span className="text-base font-normal text-gray-500">({entries.length} entries)</span>
            </h3>
            <div className="flex items-center gap-4">
              {/* Search and Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  {entryTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Recent Entries */}
                {recentEntries.length > 0 && (
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Recent
                    </Button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-900">Recently Viewed</h4>
                      </div>
                      {recentEntries.map(entryId => {
                        const entry = entries.find(e => e.id === entryId)
                        if (!entry) return null
                        const typeInfo = entryTypes.find(t => t.id === entry.attributes?.type) || entryTypes[0]
                        const IconComponent = typeInfo.icon
                        return (
                          <button
                            key={entry.id}
                            onClick={() => {
                              setSelectedEntry(entry)
                              addToRecent(entry.id)
                            }}
                            className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <IconComponent className={`w-4 h-4 ${typeInfo.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{entry.name}</div>
                              <div className="text-xs text-gray-500">{typeInfo.label}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Export */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  className="text-gray-600 hover:text-gray-800"
                  disabled={entries.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                {/* Template Selector */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                  
                  {showTemplateSelector && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="font-medium text-gray-900">Quick Start Templates</h4>
                        <p className="text-xs text-gray-500 mt-1">Pre-filled templates to get you started</p>
                      </div>
                      {templates.map(template => {
                        const typeInfo = entryTypes.find(t => t.id === template.type) || entryTypes[0]
                        const IconComponent = typeInfo.icon
                        return (
                          <button
                            key={template.id}
                            onClick={() => {
                              createFromTemplate(template)
                              setShowTemplateSelector(false)
                            }}
                            className="w-full p-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color === 'text-blue-600' ? 'bg-blue-100' : typeInfo.color === 'text-green-600' ? 'bg-green-100' : typeInfo.color === 'text-purple-600' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                              <IconComponent className={`w-4 h-4 ${typeInfo.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{template.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{template.attributes.definition.substring(0, 50)}...</div>
                              <div className="text-xs text-gray-500 mt-1">For {typeInfo.label} entries</div>
                            </div>
                          </button>
                        )
                      })}
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            createBasicEntry()
                            setShowTemplateSelector(false)
                          }}
                          className="w-full p-2 text-left hover:bg-gray-50 text-gray-700 text-sm rounded transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Start from scratch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={createBasicEntry}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEntry ? (
          <>
            {/* Article Header */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {(() => {
                    const typeInfo = getTypeInfo(selectedEntry.attributes?.type)
                    const IconComponent = typeInfo.icon
                    return <IconComponent className={`w-5 h-5 mt-0.5 ${typeInfo.color}`} />
                  })()}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedEntry.name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded ${
                        selectedEntry.attributes?.type === 'concept' ? 'bg-blue-100 text-blue-700' :
                        selectedEntry.attributes?.type === 'person' ? 'bg-green-100 text-green-700' :
                        selectedEntry.attributes?.type === 'place' ? 'bg-purple-100 text-purple-700' :
                        selectedEntry.attributes?.type === 'object' ? 'bg-orange-100 text-orange-700' :
                        selectedEntry.attributes?.type === 'event' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getTypeInfo(selectedEntry.attributes?.type).label}
                      </span>
                      {selectedEntry.attributes?.pronunciation && (
                        <span className="italic">
                          /{selectedEntry.attributes.pronunciation}/
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 text-sm font-medium"
                  >
                    ← Back to Articles
                  </Button>
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // If it's a new unsaved entry, go back to the list view
                          if (selectedEntry?.id.startsWith('temp-')) {
                            setSelectedEntry(null)
                          } else {
                            // For existing entries, just exit edit mode
                            const currentEntry = entries.find(e => e.id === selectedEntry.id)
                            if (currentEntry) setSelectedEntry(currentEntry)
                          }
                          setIsEditing(false)
                        }}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 text-sm font-medium"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSingleExportDialog(true)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateEntry(selectedEntry)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEntry(selectedEntry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <EncyclopediaEntryEditor
                  entry={selectedEntry}
                  onSave={saveEntry}
                  onCancel={() => {
                    // If it's a new unsaved entry, go back to the list view
                    if (selectedEntry?.id.startsWith('temp-')) {
                      setSelectedEntry(null)
                    }
                    setIsEditing(false)
                  }}
                  onElementClick={handleElementClick}
                />
              ) : (
                <EncyclopediaEntryViewer 
                  entry={selectedEntry} 
                  entries={entries}
                  onEntryClick={(entry) => {
                    setSelectedEntry(entry)
                    addToRecent(entry.id)
                  }}
                  onElementClick={handleElementClick}
                />
              )}
            </div>
          </>
        ) : (
          /* Articles List View */
          <div className="flex-1 overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    {searchTerm || selectedType !== 'all' 
                      ? 'No articles match your filters' 
                      : 'No encyclopedia articles yet'
                    }
                  </h3>
                  <p className="text-sm mb-4 text-gray-400">
                    {searchTerm || selectedType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start building your world knowledge base'
                    }
                  </p>
                  <Button 
                    onClick={createBasicEntry}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Encyclopedia
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredEntries.map(entry => {
                    const typeInfo = getTypeInfo(entry.attributes?.type)
                    const IconComponent = typeInfo.icon
                    return (
                      <EncyclopediaCard
                        key={entry.id}
                        entry={entry}
                        typeInfo={typeInfo}
                        IconComponent={IconComponent}
                        onClick={() => {
                          setSelectedEntry(entry)
                          setIsEditing(false)
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export All Encyclopedia Entries
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">Export all {entries.length} encyclopedia entries:</p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    exportEncyclopedia('json')
                    setShowExportDialog(false)
                  }}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">JSON Format</div>
                  <div className="text-sm text-gray-500">Complete data export for backup or migration</div>
                </button>
                <button
                  onClick={() => {
                    exportEncyclopedia('markdown')
                    setShowExportDialog(false)
                  }}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Markdown Format</div>
                  <div className="text-sm text-gray-500">Human-readable documentation format</div>
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Single Entry Export Dialog */}
      {showSingleExportDialog && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export "{selectedEntry.name}"
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">Export this encyclopedia entry:</p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    exportSingleEntry(selectedEntry, 'json')
                    setShowSingleExportDialog(false)
                  }}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">JSON Format</div>
                  <div className="text-sm text-gray-500">Complete entry data for backup or sharing</div>
                </button>
                <button
                  onClick={() => {
                    exportSingleEntry(selectedEntry, 'markdown')
                    setShowSingleExportDialog(false)
                  }}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Markdown Format</div>
                  <div className="text-sm text-gray-500">Formatted document with sections and metadata</div>
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSingleExportDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Encyclopedia Card Component (simplified without Visual Web)
const EncyclopediaCard = React.memo(({ 
  entry, 
  typeInfo, 
  IconComponent,
  onClick 
}: { 
  entry: EncyclopediaEntry
  typeInfo: any
  IconComponent: any
  onClick: () => void
}) => {
  return (
    <div 
      className="group relative overflow-hidden border border-gray-200/60 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 ease-out bg-white/80 backdrop-blur-sm hover:bg-white hover:border-orange-200 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-amber-50/0 to-yellow-50/0 group-hover:from-orange-50/30 group-hover:via-amber-50/20 group-hover:to-yellow-50/10 transition-all duration-500 rounded-2xl" />
      
      {/* Card Header */}
      <div className="relative z-10 p-4 border-b border-gray-100 group-hover:border-orange-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo.bgColor} ${typeInfo.borderColor} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md`}>
            <IconComponent className={`w-5 h-5 ${typeInfo.color} transition-colors duration-300`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate text-base mb-1 group-hover:text-gray-800 transition-colors duration-300">
              {entry.name}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs rounded ${
              typeInfo.id === 'concept' ? 'bg-blue-100 text-blue-700' :
              typeInfo.id === 'person' ? 'bg-green-100 text-green-700' :
              typeInfo.id === 'place' ? 'bg-purple-100 text-purple-700' :
              typeInfo.id === 'object' ? 'bg-orange-100 text-orange-700' :
              typeInfo.id === 'event' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            } group-hover:scale-105 transition-transform duration-300`}>
              {typeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-4">
        <div className="space-y-3">
          {entry.attributes?.definition && (
            <div className="bg-gray-50/70 rounded-xl p-3 group-hover:bg-white/70 transition-all duration-300 border border-gray-100 group-hover:border-gray-200">
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 line-clamp-3 leading-relaxed">
                {entry.attributes.definition}
              </p>
            </div>
          )}
          
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-white/60 text-gray-600 text-xs rounded-full group-hover:bg-white/80 transition-all duration-300 shadow-sm group-hover:shadow-md border border-gray-200/40"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-0.5 group-hover:text-gray-500 transition-colors duration-300">
                  +{entry.tags.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {!entry.attributes?.definition && entry.tags.length === 0 && (
            <div className="text-center py-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors duration-300">
                <IconComponent className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-600 transition-colors duration-300">
                Click to add details
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  )
})

EncyclopediaCard.displayName = "EncyclopediaCard"

// RichTextEditor component moved outside for stability
const RichTextEditor = ({ 
  fieldName, 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  placeholder, 
  className, 
  textAreaRef, 
  previewMode, 
  onTogglePreview,
  pastingImages,
  handlePaste,
  handleDrop,
  handleDragOver,
  handleImageResize,
  renderRichText
}: {
  fieldName: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onFocus: () => void
  onBlur: () => void
  placeholder: string
  className: string
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>
  previewMode: boolean
  onTogglePreview: () => void
  pastingImages: {[key: string]: boolean}
  handlePaste: (e: React.ClipboardEvent, fieldName: string) => void
  handleDrop: (e: React.DragEvent, fieldName: string) => void
  handleDragOver: (e: React.DragEvent) => void
  handleImageResize: (width: number, height: number, imageIndex: number, fieldName: string) => void
  renderRichText: (content: string, preview?: boolean, onImageResize?: (width: number, height: number, imageIndex: number) => void) => React.ReactNode
}) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">
          {pastingImages[fieldName] ? (
            <span className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
              Uploading pasted image...
            </span>
          ) : (
            'Paste or drag images directly (Ctrl+V)'
          )}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onTogglePreview}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              previewMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            title={previewMode ? 'Switch to edit mode' : 'Preview rendered content'}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>
      {previewMode ? (
        <div className={`${className} p-4 bg-gray-50 prose prose-sm max-w-none`}>
          {renderRichText(value, true, (width, height, imageIndex) => {
            handleImageResize(width, height, imageIndex, fieldName)
          })}
        </div>
      ) : (
        <Textarea
          ref={textAreaRef}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onPaste={(e) => handlePaste(e, fieldName)}
          onDrop={(e) => handleDrop(e, fieldName)}
          onDragOver={handleDragOver}
          placeholder={placeholder}
          className={`${className} p-4`}
          data-field={fieldName}
        />
      )}
    </div>
  )
}

// Entry Editor Component
function EncyclopediaEntryEditor({ 
  entry, 
  onSave, 
  onCancel,
  onElementClick
}: { 
  entry: EncyclopediaEntry
  onSave: (entry: EncyclopediaEntry) => void
  onCancel: () => void
  onElementClick?: (elementId: string, category: string) => void
}) {
  const [editedEntry, setEditedEntry] = useState<EncyclopediaEntry>(entry)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Advanced editor state
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showTableEditor, setShowTableEditor] = useState(false)
  const [editingTableIndex, setEditingTableIndex] = useState<number | null>(null)
  const [showStatsEditor, setShowStatsEditor] = useState(false)
  const [showMediaEmbed, setShowMediaEmbed] = useState(false)
  const [showRichContentPreview, setShowRichContentPreview] = useState(true)
  
  // Inline content state
  const [activeTextArea, setActiveTextArea] = useState<string | null>(null)
  const [insertionContext, setInsertionContext] = useState<string | null>(null)
  const [pastingImages, setPastingImages] = useState<{[key: string]: boolean}>({})

  // Link functionality state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [cursorPosition, setCursorPosition] = useState<{ field: string; position: number }>({ field: '', position: 0 })
  const [allWorldElements, setAllWorldElements] = useState<any[]>([])
  const [linkSearchTerm, setLinkSearchTerm] = useState('')
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('all') // Category filter for link modal

  // Load worldbuilding elements for linking
  useEffect(() => {
    const loadWorldElements = async () => {
      if (!editedEntry.project_id) {
        console.log('No project_id available for loading elements')
        return
      }
      
      console.log('Loading worldbuilding elements for project:', editedEntry.project_id)
      
      try {
        const supabase = createSupabaseClient()
        const elements = []
        
        // Load all worldbuilding elements from world_elements table
        const { data: worldElements, error: worldElementsError } = await supabase
          .from('world_elements')
          .select('id, name, category')
          .eq('project_id', editedEntry.project_id)
          .neq('id', editedEntry.id || '') // Exclude current entry if editing existing one
        
        if (worldElementsError) {
          console.error('World elements query error:', worldElementsError)
        } else if (worldElements) {
          console.log('Loaded world elements:', worldElements.length)
          elements.push(...worldElements.map(e => ({ ...e, category: e.category })))
        }
        
        console.log('Total worldbuilding elements loaded:', elements.length)
        setAllWorldElements(elements)
      } catch (error) {
        console.error('Failed to load worldbuilding elements:', error)
      }
    }
    
    loadWorldElements()
  }, [editedEntry.project_id, editedEntry.id])

  // Clipboard paste handling
  const handlePaste = async (e: React.ClipboardEvent, fieldName: string) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        
        const file = item.getAsFile()
        if (!file || !editedEntry.project_id) continue

        try {
          // Show loading state
          setPastingImages(prev => ({ ...prev, [fieldName]: true }))
          
          // Upload the pasted image
          const result = await uploadEncyclopediaMedia({
            projectId: editedEntry.project_id,
            entryId: editedEntry.id || 'temp',
            mediaType: 'images',
            file: file
          })
          
          if (result.success && result.url) {
            // Create image markdown with a more descriptive name and default size
            const fileName = file.name || `pasted-image-${Date.now()}`
            const imageMarkdown = `![${fileName}](${result.url} width=400 height=300)`
            
            // Insert the image markdown at cursor position
            insertContentAtCursor(fieldName, imageMarkdown)
            
            console.log('Image pasted and uploaded successfully')
          }
        } catch (error) {
          console.error('Failed to upload pasted image:', error)
        } finally {
          // Hide loading state
          setPastingImages(prev => ({ ...prev, [fieldName]: false }))
        }
        break
      }
    }
  }
  
  const handleDrop = async (e: React.DragEvent, fieldName: string) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0 || !editedEntry.project_id) return
    
    for (const file of imageFiles) {
      try {
        // Show loading state
        setPastingImages(prev => ({ ...prev, [fieldName]: true }))
        
        // Upload the dropped image
        const result = await uploadEncyclopediaMedia({
          projectId: editedEntry.project_id,
          entryId: editedEntry.id || 'temp',
          mediaType: 'images',
          file: file
        })
        
        if (result.success && result.url) {
          // Create image markdown
          const fileName = file.name || `dropped-image-${Date.now()}`
          const imageMarkdown = `![${fileName}](${result.url} width=400 height=300)`
          
          // Insert the image markdown at cursor position
          insertContentAtCursor(fieldName, imageMarkdown)
          
          console.log('Image dropped and uploaded successfully')
        }
      } catch (error) {
        console.error('Failed to upload dropped image:', error)
      } finally {
        // Hide loading state
        setPastingImages(prev => ({ ...prev, [fieldName]: false }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const insertContentAtCursor = (fieldName: string, content: string) => {
    const currentValue = (editedEntry.attributes as any)?.[fieldName] || ''
    const textArea = textAreaRefs[fieldName as keyof typeof textAreaRefs]?.current
    
    if (textArea) {
      const start = textArea.selectionStart
      const end = textArea.selectionEnd
      const newValue = currentValue.substring(0, start) + content + currentValue.substring(end)
      updateAttribute(fieldName, newValue)
      
      // Set cursor position after inserted content
      setTimeout(() => {
        textArea.selectionStart = textArea.selectionEnd = start + content.length
        textArea.focus()
      }, 0)
    } else {
      // Fallback: append to end
      const newValue = currentValue + (currentValue ? '\n' : '') + content
      updateAttribute(fieldName, newValue)
    }
  }
  
  // Handle image resizing in rich text content
  const handleImageResize = (width: number, height: number, imageIndex: number, fieldName: string) => {
    const currentValue = fieldName === 'description' ? editedEntry.description : (editedEntry.attributes as any)?.[fieldName] || ''
    
    // Find and update the image markdown with size attributes
    const parts = currentValue.split(/(\!\[.*?\]\([^)]+\))/g)
    let foundImageIndex = 0
    
    const updatedParts = parts.map((part: string) => {
      const imageMatch = part.match(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+width=\d+)?\s*(?:\s+height=\d+)?\s*(?:\s+"([^"]*)")?\)/)
      if (imageMatch) {
        if (foundImageIndex === imageIndex) {
          const [, alt, url, caption] = imageMatch
          const captionPart = caption ? ` "${caption}"` : ''
          const updatedImageMarkdown = `![${alt}](${url} width=${Math.round(width)} height=${Math.round(height)}${captionPart})`
          foundImageIndex++
          return updatedImageMarkdown
        }
        foundImageIndex++
      }
      return part
    })
    
    const newValue = updatedParts.join('')
    if (fieldName === 'description') {
      setEditedEntry(prev => ({ ...prev, description: newValue }))
    } else {
      updateAttribute(fieldName, newValue)
    }
  }
  
  // RichTextEditor component with paste support moved outside for stability
  
  const [previewMode, setPreviewMode] = useState<{[key: string]: boolean}>({})
  const [textAreaRefs] = useState<{[key: string]: React.RefObject<HTMLTextAreaElement | null>}>({
    description: React.createRef(),
    definition: React.createRef(),
    origin: React.createRef(),
    etymology: React.createRef(),
    related_terms: React.createRef(),
    examples: React.createRef()
  })
  
  // Modal form states
  const [imageForm, setImageForm] = useState({ 
    url: '', 
    caption: '', 
    alt: '', 
    uploadMethod: 'url' as 'url' | 'upload',
    file: null as File | null,
    uploading: false,
    uploadProgress: 0
  })
  const [tableForm, setTableForm] = useState({ title: '', headers: '', data: '' })
  const [statsForm, setStatsForm] = useState({ stats: '', category: '' })
  const [mediaForm, setMediaForm] = useState({ 
    type: 'video' as 'video' | 'audio' | 'iframe', 
    url: '', 
    title: '',
    file: null as File | null,
    uploading: false,
    uploadProgress: 0
  })

  const entryTypes = [
    { id: 'concept', label: 'Concept', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'person', label: 'Person', icon: User, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'place', label: 'Place', icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'object', label: 'Object', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    { id: 'culture', label: 'Culture', icon: Zap, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
    { id: 'technology', label: 'Technology', icon: Cog, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
  ]

  const steps = [
    { id: 1, title: 'Basics', icon: FileText, description: 'Essential information' },
    { id: 2, title: 'Definition', icon: BookOpen, description: 'Core meaning & description' },
    { id: 3, title: 'Context', icon: Globe, description: 'History & connections' }
  ]

  const handleSave = () => {
    onSave(editedEntry)
  }

  const updateAttribute = (key: string, value: string) => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }))
  }

  // Link functionality
  const handleAddLink = (fieldName?: string) => {
    // Capture current cursor position in active field
    const activeFieldName = fieldName || activeTextArea
    if (!activeFieldName) return
    
    const textareaElement = document.querySelector(`textarea[data-field="${activeFieldName}"]`) as HTMLTextAreaElement
    if (textareaElement) {
      setCursorPosition({
        field: activeFieldName,
        position: textareaElement.selectionStart || 0
      })
    }
    
    setShowLinkModal(true)
  }

  const insertElementLink = (element: any) => {
    const { field, position } = cursorPosition
    if (!field) return
    
    const textareaElement = document.querySelector(`textarea[data-field="${field}"]`) as HTMLTextAreaElement
    if (!textareaElement) return
    
    const currentValue = textareaElement.value
    const linkText = `@{${element.name}|${element.category}|${element.id}}`
    const newValue = currentValue.slice(0, position) + linkText + currentValue.slice(position)
    const newCursorPos = position + linkText.length
    
    // Update the appropriate field
    if (field === 'description') {
      setEditedEntry(prev => ({ ...prev, description: newValue }))
    } else {
      setEditedEntry(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [field]: newValue }
      }))
    }
    
    // Close modal and set cursor position
    setShowLinkModal(false)
    setLinkSearchTerm('')
    setLinkCategoryFilter('all') // Reset category filter
    
    setTimeout(() => {
      textareaElement.focus()
      textareaElement.setSelectionRange(newCursorPos, newCursorPos)
    }, 10)
  }
  
  // Advanced content utility functions
  const addImage = async (url: string, caption?: string, alt?: string, file?: File) => {
    let finalUrl = url
    
    // If it's a file upload, upload to Supabase storage
    if (file && editedEntry.project_id) {
      setImageForm(prev => ({ ...prev, uploading: true, uploadProgress: 0 }))
      
      try {
        const uploadResult = await uploadEncyclopediaMedia({
          projectId: editedEntry.project_id,
          entryId: editedEntry.id || 'temp',
          mediaType: 'images',
          file: file
        })
        
        if (uploadResult.success && uploadResult.url) {
          finalUrl = uploadResult.url
        } else {
          console.error('Upload failed:', uploadResult.error)
          alert(`Upload failed: ${uploadResult.error}`)
          return
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Upload failed. Please try again.')
        return
      } finally {
        setImageForm(prev => ({ ...prev, uploading: false, uploadProgress: 0 }))
      }
    }
    
    const newImage = { url: finalUrl, caption: caption || '', alt: alt || '' }
    
    // If we have an insertion context or active text area, insert inline
    const targetField = insertionContext || activeTextArea
    if (targetField) {
      const imageMarkdown = `![${alt || caption || 'Image'}](${finalUrl} width=400 height=300${caption ? ` "${caption}"` : ''})`
      insertInlineContent(imageMarkdown)
      setInsertionContext(null) // Clear context after use
    } else {
      // Otherwise, add to images array as before
      setEditedEntry(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          images: [...(prev.attributes?.images || []), newImage]
        }
      }))
    }
  }

  const removeImage = (index: number) => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        images: (prev.attributes?.images || []).filter((_, i) => i !== index)
      }
    }))
  }

  const addTable = (title: string, headers: string[], rows: string[][]) => {
    const newTable = { title, headers, rows }
    
    // If we have an insertion context or active text area, insert inline
    const targetField = insertionContext || activeTextArea
    if (targetField) {
      // Create markdown table
      let tableMarkdown = title ? `\n**${title}**\n\n` : '\n'
      tableMarkdown += '| ' + headers.join(' | ') + ' |\n'
      tableMarkdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n'
      rows.forEach(row => {
        tableMarkdown += '| ' + row.join(' | ') + ' |\n'
      })
      tableMarkdown += '\n'
      insertInlineContent(tableMarkdown)
      setInsertionContext(null) // Clear context after use
    } else {
      // Otherwise, add to tables array as before
      setEditedEntry(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          tables: [...(prev.attributes?.tables || []), newTable]
        }
      }))
    }
  }

  const removeTable = (index: number) => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        tables: (prev.attributes?.tables || []).filter((_, i) => i !== index)
      }
    }))
  }

  const editTable = (index: number) => {
    const table = editedEntry.attributes?.tables?.[index]
    if (table) {
      setTableForm({
        title: table.title,
        headers: table.headers.join(', '),
        data: table.rows.map(row => row.join(', ')).join('\n')
      })
      setEditingTableIndex(index)
      setShowTableEditor(true)
    }
  }

  const updateTable = (title: string, headers: string[], rows: string[][]) => {
    if (editingTableIndex !== null) {
      const updatedTable = { title, headers, rows }
      setEditedEntry(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          tables: (prev.attributes?.tables || []).map((table, i) => 
            i === editingTableIndex ? updatedTable : table
          )
        }
      }))
      setEditingTableIndex(null)
    }
  }

  const addStats = (stats: Array<{label: string, value: string, category?: string}>) => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        stats: [...(prev.attributes?.stats || []), ...stats]
      }
    }))
  }

  const removeAllStats = () => {
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        stats: []
      }
    }))
  }

  const addEmbeddedMedia = (type: 'video' | 'audio' | 'iframe', url: string, title?: string) => {
    const newMedia = { type, url, title: title || '' }
    setEditedEntry(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        rich_content: {
          ...prev.attributes?.rich_content,
          embedded_media: [...(prev.attributes?.rich_content?.embedded_media || []), newMedia]
        }
      }
    }))
  }

  // Inline content insertion functions
  const insertInlineContent = (content: string) => {
    const fieldToUse = insertionContext || activeTextArea
    if (!fieldToUse || !textAreaRefs[fieldToUse]) return
    
    const textArea = textAreaRefs[fieldToUse].current
    if (!textArea) return

    const start = textArea.selectionStart
    const end = textArea.selectionEnd
    const currentValue = textArea.value
    const newValue = currentValue.substring(0, start) + content + currentValue.substring(end)
    
    // Update the appropriate field
    if (fieldToUse === 'description') {
      setEditedEntry(prev => ({ ...prev, description: newValue }))
    } else if (fieldToUse === 'definition') {
      setEditedEntry(prev => ({ 
        ...prev, 
        attributes: { ...prev.attributes, definition: newValue }
      }))
    } else if (fieldToUse === 'origin') {
      setEditedEntry(prev => ({ 
        ...prev, 
        attributes: { ...prev.attributes, origin: newValue }
      }))
    } else if (fieldToUse === 'etymology') {
      setEditedEntry(prev => ({ 
        ...prev, 
        attributes: { ...prev.attributes, etymology: newValue }
      }))
    } else if (fieldToUse === 'related_terms') {
      setEditedEntry(prev => ({ 
        ...prev, 
        attributes: { ...prev.attributes, related_terms: newValue }
      }))
    } else if (fieldToUse === 'examples') {
      setEditedEntry(prev => ({ 
        ...prev, 
        attributes: { ...prev.attributes, examples: newValue }
      }))
    }
    
    // Set cursor position after inserted content
    setTimeout(() => {
      textArea.focus()
      textArea.setSelectionRange(start + content.length, start + content.length)
    }, 0)
  }

  const insertInlineImage = (fieldContext?: string) => {
    if (fieldContext) {
      setInsertionContext(fieldContext)
    } else if (!activeTextArea) {
      // Fallback to regular image addition
      setInsertionContext(null)
    }
    
    // Insert placeholder and show image modal
    setShowImageUpload(true)
  }

  const insertInlineTable = (fieldContext?: string) => {
    if (fieldContext) {
      setInsertionContext(fieldContext)
    } else if (!activeTextArea) {
      setInsertionContext(null)
    }
    
    setEditingTableIndex(null)
    setTableForm({ title: '', headers: '', data: '' })
    setShowTableEditor(true)
  }

  const insertInlineStats = () => {
    if (!activeTextArea) {
      setShowStatsEditor(true)
      return
    }
    
    setShowStatsEditor(true)
  }

  // Preview mode helpers
  const togglePreviewMode = (fieldName: string) => {
    setPreviewMode(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const isPreviewMode = (fieldName: string) => {
    return previewMode[fieldName] || false
  }

  const selectedType = entryTypes.find(t => t.id === (editedEntry.attributes?.type || 'concept'))
  const SelectedIcon = selectedType?.icon || FileText

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto px-6 py-0 w-full flex flex-col">
        {/* Step Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {currentStep === 1 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  Essential Information
                </h3>
                <p className="text-orange-100 text-sm">The foundation of your encyclopedia entry</p>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Title Field */}
                  <div className="xl:col-span-3">
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Entry Title *
                    </label>
                    <Input
                      value={editedEntry.name}
                      onChange={(e) => setEditedEntry({...editedEntry, name: e.target.value})}
                      placeholder="Enter an engaging title..."
                      className="h-14 text-xl font-semibold border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-6"
                    />
                  </div>
                  
                  {/* Entry Type Selection */}
                  <div className="xl:col-span-2">
                    <label className="block text-lg font-bold text-gray-900 mb-4">
                      Choose Entry Type
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {entryTypes.map(type => {
                        const TypeIcon = type.icon
                        const isSelected = editedEntry.attributes?.type === type.id
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => updateAttribute('type', type.id)}
                            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                              isSelected 
                                ? `${type.bgColor} ${type.borderColor} shadow-lg ring-2 ring-opacity-20` 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-md hover:shadow-lg'
                            }`}
                          >
                            <TypeIcon className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isSelected ? type.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <div className={`text-sm font-bold transition-all duration-300 ${isSelected ? type.color : 'text-gray-600 group-hover:text-gray-800'}`}>
                              {type.label}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Pronunciation */}
                    <div className="space-y-3">
                      <label className="block text-lg font-bold text-gray-900">
                        Pronunciation
                      </label>
                      <Input
                        value={editedEntry.attributes?.pronunciation || ''}
                        onChange={(e) => updateAttribute('pronunciation', e.target.value)}
                        placeholder="/pronunciation/"
                        className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4"
                      />
                      <p className="text-sm text-gray-500">Phonetic guide (e.g., /ˈwɜːrdə/)</p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                      <label className="block text-lg font-bold text-gray-900">
                        Tags & Keywords
                      </label>
                      <Input
                        value={editedEntry.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          setEditedEntry({...editedEntry, tags})
                        }}
                        placeholder="magic, ancient, powerful..."
                        className="h-12 border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4"
                      />
                      <p className="text-sm text-gray-500">Separate with commas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-white" />
                  Definition & Description
                </h3>
                <p className="text-blue-100 text-sm">Explain what it is and bring it to life</p>
              </div>
              
              {/* Advanced Content Toolbar */}
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-blue-900 mr-2">Rich Content:</span>
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Add Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTableIndex(null)
                      setTableForm({ title: '', headers: '', data: '' })
                      setShowTableEditor(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Table className="w-3 h-3" />
                    Add Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStatsEditor(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Cog className="w-3 h-3" />
                    Add Stats
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaEmbed(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Embed Media
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  <div className="space-y-3 flex flex-col">
                    <label className="block text-lg font-bold text-gray-900">
                      Core Definition *
                    </label>
                    <RichTextToolbar 
                      onAddImage={() => insertInlineImage('definition')}
                      onAddTable={() => insertInlineTable('definition')}
                      onAddStats={insertInlineStats}
                      onAddMedia={() => setShowMediaEmbed(true)}
                      onAddLink={() => handleAddLink('definition')}
                      onFormatText={(format) => {
                        // TODO: Implement text formatting
                        console.log('Format text:', format)
                      }}
                      activeField={activeTextArea}
                    />
                    <RichTextEditor
                      fieldName="definition"
                      value={editedEntry.attributes?.definition || ''}
                      onChange={(e) => updateAttribute('definition', e.target.value)}
                      onFocus={() => setActiveTextArea('definition')}
                      onBlur={() => setActiveTextArea(null)}
                      placeholder="Provide a clear, concise definition that captures the essence..."
                      className="flex-1 min-h-48 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none rounded-xl text-base"
                      textAreaRef={textAreaRefs.definition}
                      previewMode={isPreviewMode('definition')}
                      onTogglePreview={() => togglePreviewMode('definition')}
                      pastingImages={pastingImages}
                      handlePaste={handlePaste}
                      handleDrop={handleDrop}
                      handleDragOver={handleDragOver}
                      handleImageResize={handleImageResize}
                      renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                    />
                    <p className="text-sm text-gray-500">A brief, dictionary-style definition</p>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <label className="block text-lg font-bold text-gray-900">
                      Rich Description
                    </label>
                    <RichTextToolbar 
                      onAddImage={() => insertInlineImage('description')}
                      onAddTable={() => insertInlineTable('description')}
                      onAddStats={insertInlineStats}
                      onAddMedia={() => setShowMediaEmbed(true)}
                      onAddLink={() => handleAddLink('description')}
                      onFormatText={(format) => {
                        console.log('Format text:', format)
                      }}
                      activeField={activeTextArea}
                    />
                    <RichTextEditor
                      fieldName="description"
                      value={editedEntry.description}
                      onChange={(e) => setEditedEntry({...editedEntry, description: e.target.value})}
                      onFocus={() => setActiveTextArea('description')}
                      onBlur={() => setActiveTextArea(null)}
                      placeholder="Paint a vivid picture with rich details, context, and world-building depth..."
                      className="flex-1 min-h-48 border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none rounded-xl text-base"
                      textAreaRef={textAreaRefs.description}
                      previewMode={isPreviewMode('description')}
                      onTogglePreview={() => togglePreviewMode('description')}
                      pastingImages={pastingImages}
                      handlePaste={handlePaste}
                      handleDrop={handleDrop}
                      handleDragOver={handleDragOver}
                      handleImageResize={handleImageResize}
                      renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                    />
                    <p className="text-sm text-gray-500">Elaborate with storytelling details</p>
                  </div>
                </div>
                
                {/* Display added rich content preview - Dynamic and Collapsible */}
                {(editedEntry.attributes?.images?.length || editedEntry.attributes?.tables?.length || editedEntry.attributes?.stats?.length) && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowRichContentPreview(!showRichContentPreview)}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">Rich Content</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {(editedEntry.attributes?.images?.length || 0) + (editedEntry.attributes?.tables?.length || 0) + (editedEntry.attributes?.stats?.length ? 1 : 0)} items
                        </span>
                      </div>
                      {showRichContentPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showRichContentPreview && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {editedEntry.attributes.images?.map((img, idx) => (
                          <div key={`img-${idx}`} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                            <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="flex-1 text-xs truncate" title={img.caption || img.url}>
                              {img.caption || 'Image'}
                            </span>
                            <button 
                              className="text-red-500 hover:text-red-700 text-xs px-1 py-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              onClick={() => removeImage(idx)}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {editedEntry.attributes.tables?.map((table, idx) => (
                          <div key={`table-${idx}`} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                            <Table className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="flex-1 text-xs truncate" title={table.title}>
                              {table.title || 'Table'}
                            </span>
                            <button 
                              className="text-blue-500 hover:text-blue-700 text-xs px-1 py-1 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                              onClick={() => editTable(idx)}
                              title="Edit table"
                            >
                              ✎
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 text-xs px-1 py-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              onClick={() => removeTable(idx)}
                              title="Remove table"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {editedEntry.attributes.stats?.length && (
                          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                            <Cog className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span className="flex-1 text-xs">
                              {editedEntry.attributes.stats.length} stats
                            </span>
                            <button 
                              className="text-red-500 hover:text-red-700 text-xs px-1 py-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              onClick={removeAllStats}
                              title="Remove all stats"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-white" />
                  History & Connections
                </h3>
                <p className="text-emerald-100 text-sm">Origins, etymology, and world connections</p>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Origin Story
                      </label>
                      <RichTextToolbar 
                        onAddImage={() => insertInlineImage('origin')}
                        onAddTable={() => insertInlineTable('origin')}
                        onAddStats={insertInlineStats}
                        onAddMedia={() => setShowMediaEmbed(true)}
                        onAddLink={() => handleAddLink('origin')}
                        onFormatText={(format) => {
                          console.log('Format text:', format)
                        }}
                        activeField={activeTextArea}
                      />
                      <RichTextEditor
                        fieldName="origin"
                        value={editedEntry.attributes?.origin || ''}
                        onChange={(e) => updateAttribute('origin', e.target.value)}
                        onFocus={() => setActiveTextArea('origin')}
                        onBlur={() => setActiveTextArea(null)}
                        placeholder="Where and how did this come to be?"
                        className="h-24 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl"
                        textAreaRef={textAreaRefs.origin}
                        previewMode={isPreviewMode('origin')}
                        onTogglePreview={() => togglePreviewMode('origin')}
                        pastingImages={pastingImages}
                        handlePaste={handlePaste}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleImageResize={handleImageResize}
                        renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                      />
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Etymology
                      </label>
                      <RichTextToolbar 
                        onAddImage={() => insertInlineImage('etymology')}
                        onAddTable={() => insertInlineTable('etymology')}
                        onAddStats={insertInlineStats}
                        onAddMedia={() => setShowMediaEmbed(true)}
                        onAddLink={() => handleAddLink('etymology')}
                        onFormatText={(format) => {
                          console.log('Format text:', format)
                        }}
                        activeField={activeTextArea}
                      />
                      <RichTextEditor
                        fieldName="etymology"
                        value={editedEntry.attributes?.etymology || ''}
                        onChange={(e) => updateAttribute('etymology', e.target.value)}
                        onFocus={() => setActiveTextArea('etymology')}
                        onBlur={() => setActiveTextArea(null)}
                        placeholder="How did the name evolve?"
                        className="h-24 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl"
                        textAreaRef={textAreaRefs.etymology}
                        previewMode={isPreviewMode('etymology')}
                        onTogglePreview={() => togglePreviewMode('etymology')}
                        pastingImages={pastingImages}
                        handlePaste={handlePaste}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleImageResize={handleImageResize}
                        renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Related Terms
                      </label>
                      <RichTextToolbar 
                        onAddImage={() => insertInlineImage('related_terms')}
                        onAddTable={() => insertInlineTable('related_terms')}
                        onAddStats={insertInlineStats}
                        onAddMedia={() => setShowMediaEmbed(true)}
                        onAddLink={() => handleAddLink('related_terms')}
                        onFormatText={(format) => {
                          console.log('Format text:', format)
                        }}
                        activeField={activeTextArea}
                      />
                      <RichTextEditor
                        fieldName="related_terms"
                        value={editedEntry.attributes?.related_terms || ''}
                        onChange={(e) => updateAttribute('related_terms', e.target.value)}
                        onFocus={() => setActiveTextArea('related_terms')}
                        onBlur={() => setActiveTextArea(null)}
                        placeholder="Connected concepts, synonyms, contrasts..."
                        className="h-24 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl"
                        textAreaRef={textAreaRefs.related_terms}
                        previewMode={isPreviewMode('related_terms')}
                        onTogglePreview={() => togglePreviewMode('related_terms')}
                        pastingImages={pastingImages}
                        handlePaste={handlePaste}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleImageResize={handleImageResize}
                        renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                      />
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="block text-lg font-bold text-gray-900">
                        Examples & Usage
                      </label>
                      <RichTextToolbar 
                        onAddImage={() => insertInlineImage('examples')}
                        onAddTable={() => insertInlineTable('examples')}
                        onAddStats={insertInlineStats}
                        onAddMedia={() => setShowMediaEmbed(true)}
                        onAddLink={() => handleAddLink('examples')}
                        onFormatText={(format) => {
                          console.log('Format text:', format)
                        }}
                        activeField={activeTextArea}
                      />
                      <RichTextEditor
                        fieldName="examples"
                        value={editedEntry.attributes?.examples || ''}
                        onChange={(e) => updateAttribute('examples', e.target.value)}
                        onFocus={() => setActiveTextArea('examples')}
                        onBlur={() => setActiveTextArea(null)}
                        placeholder="Show this element in action..."
                        className="h-24 border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 resize-none rounded-xl"
                        textAreaRef={textAreaRefs.examples}
                        previewMode={isPreviewMode('examples')}
                        onTogglePreview={() => togglePreviewMode('examples')}
                        pastingImages={pastingImages}
                        handlePaste={handlePaste}
                        handleDrop={handleDrop}
                        handleDragOver={handleDragOver}
                        handleImageResize={handleImageResize}
                        renderRichText={(text: string, isEditing: boolean = false, onImageResize?: (width: number, height: number, index: number) => void) => renderRichText(text, isEditing, onImageResize, onElementClick)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-2 mt-1 flex-shrink-0">
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="px-6 py-3 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl"
              >
                ← Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button 
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-xl"
              >
                Next Step →
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {editedEntry.id.startsWith('temp-') ? 'Create Entry' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal Dialogs */}
      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Add Image
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Upload Method Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setImageForm({...imageForm, uploadMethod: 'url'})}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${ 
                    (imageForm.uploadMethod || 'url') === 'url' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📎 Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageForm({...imageForm, uploadMethod: 'upload'})}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    imageForm.uploadMethod === 'upload' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📁 Upload File
                </button>
              </div>

              {/* URL Method */}
              {(imageForm.uploadMethod || 'url') === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL *</label>
                    <Input 
                      placeholder="https://example.com/image.jpg or paste any image URL" 
                      className="w-full"
                      value={imageForm.url}
                      onChange={(e) => setImageForm({...imageForm, url: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, GIF, WebP formats</p>
                  </div>
                </div>
              )}

              {/* Upload Method */}
              {imageForm.uploadMethod === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file size (10MB limit)
                            if (file.size > 10 * 1024 * 1024) {
                              alert('File size must be less than 10MB')
                              return
                            }
                            
                            // Create object URL for preview
                            const url = URL.createObjectURL(file)
                            setImageForm({...imageForm, url, file})
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="space-y-2">
                          <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span>
                            {' '}or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          {imageForm.file && (
                            <div className="mt-2 text-sm text-gray-600">
                              Selected: {imageForm.file.name} ({formatFileSize(imageForm.file.size)})
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {imageForm.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <img 
                    src={imageForm.url} 
                    alt="Preview" 
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'
                    }}
                  />
                </div>
              )}

              {/* Caption and Alt Text */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption (Optional)</label>
                  <Input 
                    placeholder="Describe this image for readers..." 
                    className="w-full"
                    value={imageForm.caption}
                    onChange={(e) => setImageForm({...imageForm, caption: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text (Optional)</label>
                  <Input 
                    placeholder="Alternative text for accessibility" 
                    className="w-full"
                    value={imageForm.alt}
                    onChange={(e) => setImageForm({...imageForm, alt: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setShowImageUpload(false)
                  setImageForm({ url: '', caption: '', alt: '', uploadMethod: 'url', file: null, uploading: false, uploadProgress: 0 })
                  setInsertionContext(null)
                }}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={async () => {
                    if (imageForm.url) {
                      await addImage(imageForm.url, imageForm.caption, imageForm.alt, imageForm.file || undefined)
                      setShowImageUpload(false)
                      setImageForm({ url: '', caption: '', alt: '', uploadMethod: 'url', file: null, uploading: false, uploadProgress: 0 })
                      setInsertionContext(null)
                    }
                  }}
                  disabled={!imageForm.url || imageForm.uploading}
                >
                  {imageForm.uploading ? 'Uploading...' : 'Add Image'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Table Editor Modal */}
      {showTableEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Table className="w-5 h-5" />
                {editingTableIndex !== null ? 'Edit Table' : 'Create Table'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Title</label>
                <Input 
                  placeholder="Character Stats, Timeline, etc." 
                  className="w-full"
                  value={tableForm.title}
                  onChange={(e) => setTableForm({...tableForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Headers (comma-separated)</label>
                <Input 
                  placeholder="Name, Level, Class, HP" 
                  className="w-full"
                  value={tableForm.headers}
                  onChange={(e) => setTableForm({...tableForm, headers: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Data</label>
                <Textarea 
                  placeholder="Enter data rows, one per line, comma-separated:
John Doe, 15, Warrior, 150
Jane Smith, 12, Mage, 80"
                  className="w-full h-32 resize-none"
                  value={tableForm.data}
                  onChange={(e) => setTableForm({...tableForm, data: e.target.value})}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setShowTableEditor(false)
                  setTableForm({ title: '', headers: '', data: '' })
                  setEditingTableIndex(null)
                  setInsertionContext(null)
                }}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    if (tableForm.title && tableForm.headers && tableForm.data) {
                      const headers = tableForm.headers.split(',').map(h => h.trim())
                      const rows = tableForm.data.split('\n').map(row => 
                        row.split(',').map(cell => cell.trim())
                      ).filter(row => row.some(cell => cell.length > 0))
                      
                      if (editingTableIndex !== null) {
                        updateTable(tableForm.title, headers, rows)
                      } else {
                        addTable(tableForm.title, headers, rows)
                      }
                      
                      setShowTableEditor(false)
                      setTableForm({ title: '', headers: '', data: '' })
                      setEditingTableIndex(null)
                      setInsertionContext(null)
                    }
                  }}
                  disabled={!tableForm.title || !tableForm.headers || !tableForm.data}
                >
                  {editingTableIndex !== null ? 'Update Table' : 'Create Table'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Editor Modal */}
      {showStatsEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Cog className="w-5 h-5" />
                Add Statistics
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statistics (one per line)</label>
                <Textarea 
                  placeholder="Population: 50,000
Area: 500 sq km
Founded: 1247 AD
Elevation: 800m"
                  className="w-full h-32 resize-none"
                  value={statsForm.stats}
                  onChange={(e) => setStatsForm({...statsForm, stats: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                <Input 
                  placeholder="Demographics, Geography, etc." 
                  className="w-full"
                  value={statsForm.category}
                  onChange={(e) => setStatsForm({...statsForm, category: e.target.value})}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setShowStatsEditor(false)
                  setStatsForm({ stats: '', category: '' })
                }}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={() => {
                    if (statsForm.stats) {
                      const statsArray = statsForm.stats.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.includes(':'))
                        .map(line => {
                          const [label, value] = line.split(':').map(s => s.trim())
                          return { label, value, category: statsForm.category || undefined }
                        })
                      
                      addStats(statsArray)
                      setShowStatsEditor(false)
                      setStatsForm({ stats: '', category: '' })
                    }
                  }}
                  disabled={!statsForm.stats}
                >
                  Add Stats
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Media Embed Modal */}
      {showMediaEmbed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Embed Media
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mediaForm.type}
                  onChange={(e) => setMediaForm({...mediaForm, type: e.target.value as 'video' | 'audio' | 'iframe'})}
                >
                  <option value="video">Video (YouTube, Vimeo)</option>
                  <option value="audio">Audio File</option>
                  <option value="iframe">General Embed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media URL</label>
                <Input 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="w-full"
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm({...mediaForm, url: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                <Input 
                  placeholder="Title for this media" 
                  className="w-full"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({...mediaForm, title: e.target.value})}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setShowMediaEmbed(false)
                  setMediaForm({ type: 'video', url: '', title: '', file: null, uploading: false, uploadProgress: 0 })
                }}>Cancel</Button>
                <Button 
                  size="sm" 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    if (mediaForm.url) {
                      addEmbeddedMedia(mediaForm.type, mediaForm.url, mediaForm.title)
                      setShowMediaEmbed(false)
                      setMediaForm({ type: 'video', url: '', title: '', file: null, uploading: false, uploadProgress: 0 })
                    }
                  }}
                  disabled={!mediaForm.url}
                >
                  Embed Media
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Link Worldbuilding Element
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Search Input */}
              <div>
                <Input
                  placeholder="Search worldbuilding elements..."
                  value={linkSearchTerm}
                  onChange={(e) => setLinkSearchTerm(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                <select
                  value={linkCategoryFilter}
                  onChange={(e) => setLinkCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories ({allWorldElements.length})</option>
                  {(() => {
                    // Get unique categories with counts
                    const categoryGroups = allWorldElements.reduce((acc, el) => {
                      acc[el.category] = (acc[el.category] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    const sortedCategories = Object.keys(categoryGroups).sort()
                    
                    return sortedCategories.map(category => {
                      const config = WORLD_ELEMENT_TYPES[category as keyof typeof WORLD_ELEMENT_TYPES]
                      const emoji = config?.emoji || '📝'
                      const label = config?.label || category.charAt(0).toUpperCase() + category.slice(1)
                      const count = categoryGroups[category]
                      
                      return (
                        <option key={category} value={category}>
                          {emoji} {label} ({count})
                        </option>
                      )
                    })
                  })()}
                </select>
              </div>

              {/* Element List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allWorldElements
                  .filter(element => {
                    // Category filter
                    const categoryMatch = linkCategoryFilter === 'all' || element.category === linkCategoryFilter
                    
                    // Search filter
                    const searchMatch = element.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                      element.category?.toLowerCase().includes(linkSearchTerm.toLowerCase())
                    
                    return categoryMatch && searchMatch
                  })
                  .map((element, index) => {
                    // Get element type configuration
                    const config = WORLD_ELEMENT_TYPES[element.category as keyof typeof WORLD_ELEMENT_TYPES]
                    const Icon = config?.icon || BookOpen
                    const label = config?.label || element.category.charAt(0).toUpperCase() + element.category.slice(1)
                    
                    return (
                      <button
                        key={`${element.category}-${element.id}`}
                        onClick={() => insertElementLink(element)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">{element.name}</div>
                            <div className="text-sm text-gray-500">{label}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                
                {allWorldElements.filter(element => {
                  // Category filter
                  const categoryMatch = linkCategoryFilter === 'all' || element.category === linkCategoryFilter
                  
                  // Search filter
                  const searchMatch = element.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
                    element.category?.toLowerCase().includes(linkSearchTerm.toLowerCase())
                  
                  return categoryMatch && searchMatch
                }).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    {linkSearchTerm || linkCategoryFilter !== 'all' 
                      ? 'No elements found matching your filters.' 
                      : 'No worldbuilding elements available.'}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLinkModal(false)
                    setLinkSearchTerm('')
                    setLinkCategoryFilter('all') // Reset category filter
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Entry Viewer Component  
function EncyclopediaEntryViewer({ 
  entry, 
  entries = [], 
  onEntryClick,
  onElementClick
}: { 
  entry: EncyclopediaEntry
  entries?: EncyclopediaEntry[]
  onEntryClick?: (entry: EncyclopediaEntry) => void 
  onElementClick?: (elementId: string, category: string) => void
}) {
  // Entry types for cross-reference display
  const entryTypes = [
    { id: 'concept', label: 'Concept', icon: FileText, color: 'text-blue-600' },
    { id: 'person', label: 'Person', icon: User, color: 'text-green-600' },
    { id: 'place', label: 'Place', icon: MapPin, color: 'text-purple-600' },
    { id: 'object', label: 'Object', icon: Package, color: 'text-orange-600' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'text-red-600' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-indigo-600' },
    { id: 'culture', label: 'Culture', icon: Zap, color: 'text-pink-600' },
    { id: 'technology', label: 'Technology', icon: Cog, color: 'text-gray-600' }
  ]
  
  // Detect cross-references in the entry content
  const detectedReferences = React.useMemo(() => {
    const references: EncyclopediaEntry[] = []
    const searchText = `${entry.description} ${entry.attributes?.definition || ''} ${entry.attributes?.origin || ''} ${entry.attributes?.etymology || ''} ${entry.attributes?.related_terms || ''}`
    
    entries.forEach(otherEntry => {
      if (otherEntry.id !== entry.id && 
          searchText.toLowerCase().includes(otherEntry.name.toLowerCase())) {
        references.push(otherEntry)
      }
    })
    
    return references.slice(0, 6) // Limit to 6 references
  }, [entry, entries])
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        
        {/* Definition - Hero Block (spans full width) */}
        {entry.attributes?.definition && (
          <div className="col-span-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Definition</h2>
                <div className="text-xl leading-relaxed font-medium text-blue-50">
                  <span className="whitespace-pre-wrap">
                    {renderRichText(entry.attributes.definition, false, undefined, onElementClick) || entry.attributes.definition}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description Block - Large */}
        {entry.description && (
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Detailed Description</h3>
            </div>
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed text-base">
                {renderRichText(entry.description, false, undefined, onElementClick)}
              </div>
            </div>
          </div>
        )}

        {/* Tags - Compact Side Block */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
                <Tag className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Origin Block - Medium */}
        {entry.attributes?.origin && (
          <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-200 rounded-2xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="text-lg font-bold text-purple-900">Origin Story</h3>
            </div>
            <div className="text-purple-800 leading-relaxed">
              {renderRichText(entry.attributes.origin, false, undefined, onElementClick) || (
                <span className="whitespace-pre-wrap">
                  {entry.attributes.origin}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Etymology Block - Medium */}
        {entry.attributes?.etymology && (
          <div className="col-span-12 md:col-span-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl p-6 shadow-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-200 rounded-2xl flex items-center justify-center">
                <span className="text-indigo-700 text-sm font-bold">Et</span>
              </div>
              <h3 className="text-lg font-bold text-indigo-900">Etymology</h3>
            </div>
            <div className="text-indigo-800 leading-relaxed">
              {renderRichText(entry.attributes.etymology, false, undefined, onElementClick) || (
                <span className="whitespace-pre-wrap">
                  {entry.attributes.etymology}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Related Terms - Wide Block */}
        {entry.attributes?.related_terms && (
          <div className="col-span-12 lg:col-span-7 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-200 rounded-2xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Related Terms & Concepts</h3>
            </div>
            <div className="text-emerald-800 leading-relaxed">
              {renderRichText(entry.attributes.related_terms, false, undefined, onElementClick) || (
                <span className="whitespace-pre-wrap">
                  {entry.attributes.related_terms}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Examples - Compact Block */}
        {entry.attributes?.examples && (
          <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 shadow-lg border border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-200 rounded-2xl flex items-center justify-center">
                <span className="text-amber-700 text-sm font-bold">Ex</span>
              </div>
              <h3 className="text-lg font-bold text-amber-900">Examples & Usage</h3>
            </div>
            <div className="text-amber-800 leading-relaxed">
              {renderRichText(entry.attributes.examples, false, undefined, onElementClick) || (
                <span className="whitespace-pre-wrap">
                  {entry.attributes.examples}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Images Block - Gallery Layout */}
        {entry.attributes?.images && entry.attributes.images.length > 0 && (
          <div className="col-span-12 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Images</h3>
              <span className="text-sm text-gray-500">({entry.attributes.images.length} images)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entry.attributes.images.map((image, index) => (
                <div key={index} className="group relative">
                  <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-md">
                    <img
                      src={image.url}
                      alt={image.caption || `Encyclopedia image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDcuMTcgMTIuNDUgNS44OCAxMS43OUM1LjY5IDExLjY5IDUuNDYgMTEuNjMgNS4yMyAxMS42M0M0Ljg2IDExLjYzIDQuNSAxMS43NyA0LjI1IDEyLjAyTDIuMjkgMTRDMi4xIDEzLjY0IDIgMTMuMjIgMiAxMi43N0wyIDEwVjhDMiA3LjQ1IDIuMjIgNi45NSAyLjU5IDYuNTlDMi45NSA2LjIyIDMuNDUgNiA0IDZIMjBDMjAuNTUgNiAyMS4wNSA2LjIyIDIxLjQxIDYuNTlDMjEuNzggNi45NSAyMiA3LjQ1IDIyIDhWMTBWMTIuNzdDMjIgMTMuMjIgMjEuOSAxMy42NCAyMS43MSAxNEwxOS43NSAxMi4wMkMxOS41IDExLjc3IDE5LjE0IDExLjYzIDE4Ljc3IDExLjYzQzE4LjU0IDExLjYzIDE4LjMxIDExLjY5IDE4LjEyIDExLjc5QzE2LjgzIDEyLjQ1IDE0LjIxIDEzLjc5IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                      }}
                    />
                  </div>
                  {image.caption && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {image.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Block - Structured Data */}
        {entry.attributes?.tables && entry.attributes.tables.length > 0 && (
          <div className="col-span-12 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                <Table className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Data Tables</h3>
              <span className="text-sm text-gray-500">({entry.attributes.tables.length} tables)</span>
            </div>
            <div className="space-y-8">
              {entry.attributes.tables.map((table, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden">
                  {table.title && (
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900">{table.title}</h4>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {table.headers.map((header, headerIndex) => (
                            <th key={headerIndex} className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Block - Key Metrics */}
        {entry.attributes?.stats && entry.attributes.stats.length > 0 && (
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-violet-50 to-purple-100 rounded-3xl p-6 shadow-lg border border-violet-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-200 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-700" />
              </div>
              <h3 className="text-lg font-bold text-violet-900">Statistics & Metrics</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entry.attributes.stats.map((stat, index) => (
                <div key={index} className="bg-white bg-opacity-70 rounded-2xl p-4 shadow-sm">
                  <div className="text-2xl font-bold text-violet-800 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-violet-700">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rich Content Block - Embedded Media */}
        {entry.attributes?.rich_content && (entry.attributes.rich_content.formatted_description || entry.attributes.rich_content.embedded_media) && (
          <div className="col-span-12 lg:col-span-6 bg-gradient-to-br from-rose-50 to-pink-100 rounded-3xl p-6 shadow-lg border border-rose-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-200 rounded-2xl flex items-center justify-center">
                <Play className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="text-lg font-bold text-rose-900">Rich Content</h3>
            </div>
            <div className="space-y-4">
              {/* Formatted description */}
              {entry.attributes.rich_content.formatted_description && (
                <div className="bg-white bg-opacity-70 rounded-2xl p-4 shadow-sm">
                  <div className="prose max-w-none">
                    <div 
                      className="text-rose-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: entry.attributes.rich_content.formatted_description }}
                    />
                  </div>
                </div>
              )}
              
              {/* Embedded media */}
              {entry.attributes.rich_content.embedded_media && entry.attributes.rich_content.embedded_media.length > 0 && (
                <div className="space-y-3">
                  {entry.attributes.rich_content.embedded_media.map((media, index) => (
                    <div key={index} className="bg-white bg-opacity-70 rounded-2xl p-4 shadow-sm">
                      {media.title && (
                        <h4 className="font-semibold text-rose-900 mb-3">{media.title}</h4>
                      )}
                      {media.type === 'video' && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={media.url}
                            title={media.title || 'Embedded video'}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {media.type === 'audio' && (
                        <audio controls className="w-full">
                          <source src={media.url} />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {media.type === 'iframe' && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={media.url}
                            title={media.title || 'Embedded content'}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cross-References Block - Full Width */}
        {detectedReferences.length > 0 && (
          <div className="col-span-12 bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center">
                <Link className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cross-References</h3>
              <span className="text-sm text-slate-500">({detectedReferences.length} related entries found)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detectedReferences.map(ref => {
                const typeInfo = entryTypes.find((t: any) => t.id === ref.attributes?.type) || entryTypes[0]
                const IconComponent = typeInfo.icon
                return (
                  <button
                    key={ref.id}
                    onClick={() => onEntryClick?.(ref)}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <IconComponent className={`w-4 h-4 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                          {ref.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {typeInfo.label}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}