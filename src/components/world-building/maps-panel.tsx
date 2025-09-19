"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createSupabaseClient } from "@/lib/auth"

interface MapData {
  id: string
  name: string
  description?: string
  image_url?: string | null
  created_at: string
  attributes?: {
    viewport?: {
      scale: number
      translate: { x: number; y: number }
    }
    annotations?: {
      pins?: Pin[]
      labels?: Label[]
      zones?: Zone[]
      measurements?: Measurement[]
      decorations?: Decoration[]
    }
  }
}

interface ViewportState {
  scale: number
  translate: { x: number; y: number }
}

interface Pin {
  id: string
  type: 'pin'
  x: number
  y: number
  label: string
  description?: string
  color: string
  icon?: string
}

interface Label {
  id: string
  type: 'label'
  x: number
  y: number
  text: string
  fontSize: number
  color: string
  backgroundColor?: string
  rotation?: number
}

interface Zone {
  id: string
  type: 'zone'
  points: { x: number; y: number }[]
  fillColor: string
  borderColor: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double'
  borderWidth?: number
  opacity: number
}

interface Measurement {
  id: string
  type: 'measurement'
  measurementType: 'distance' | 'area' | 'perimeter'
  points: { x: number; y: number }[]
  unit: 'px' | 'ft' | 'm' | 'km' | 'mi' | 'custom'
  customUnit?: string
  scale?: number // pixels per unit
  color: string
  showLabel: boolean
  labelPosition?: 'auto' | 'start' | 'middle' | 'end'
}

interface Decoration {
  id: string
  type: 'decoration'
  x: number
  y: number
  shape: 'arrow' | 'line' | 'circle' | 'rectangle' | 'star' | 'custom'
  size: number
  color: string
  rotation?: number
  customSvg?: string
}

type ToolMode = 'select' | 'pin' | 'label' | 'zone' | 'measurement' | 'decoration'

// Enhanced zoom control with more visual feedback
function ZoomControl({ scale, onScaleChange, onFitToScreen }: { 
  scale: number
  onScaleChange: (scale: number) => void
  onFitToScreen: () => void
}) {
  const [open, setOpen] = useState(false)

  const zoomLevels = [
    { label: "Fit to Screen", value: "fit" as const, icon: "⊞" },
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.5 },
    { label: "100%", value: 1, icon: "1:1" },
    { label: "200%", value: 2 },
    { label: "400%", value: 4 },
  ]

  const handleZoomSelect = (value: number | "fit") => {
    setOpen(false)
    if (value === "fit") {
      onFitToScreen()
    } else {
      onScaleChange(value)
    }
  }

  const handleZoomIn = () => {
    const newScale = Math.min(4, scale * 1.25)
    onScaleChange(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, scale / 1.25)
    onScaleChange(newScale)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Zoom Out Button */}
      <button 
        className="w-8 h-8 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
        onClick={handleZoomOut}
        disabled={scale <= 0.1}
        title="Zoom Out"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      {/* Zoom Level Display */}
      <div className="relative">
        <button 
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[70px]"
          onClick={() => setOpen(!open)}
        >
          {Math.round(scale * 100)}%
          <svg className={`w-3 h-3 inline ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {open && (
          <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 text-sm right-0 min-w-[140px] z-50">
            {zoomLevels.map((level) => (
              <div 
                key={level.label}
                className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150 flex items-center justify-between" 
                onClick={() => handleZoomSelect(level.value)}
              >
                <span>{level.label}</span>
                {level.icon && <span className="text-xs text-gray-400">{level.icon}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Zoom In Button */}
      <button 
        className="w-8 h-8 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
        onClick={handleZoomIn}
        disabled={scale >= 4}
        title="Zoom In"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  )
}

// Map Tools Toolbar - Campfire-style annotation tools
function MapToolsBar({ activeTool, onToolChange, onClearAll }: {
  activeTool: ToolMode
  onToolChange: (tool: ToolMode) => void
  onClearAll: () => void
}) {
  const tools = [
    { 
      id: 'select' as ToolMode, 
      label: 'Select', 
      icon: '⌘',
      description: 'Select and move annotations'
    },
    { 
      id: 'pin' as ToolMode, 
      label: 'Pins', 
      icon: '📍',
      description: 'Add location markers'
    },
    { 
      id: 'label' as ToolMode, 
      label: 'Labels', 
      icon: '🏷️',
      description: 'Add text labels'
    },
    { 
      id: 'zone' as ToolMode, 
      label: 'Zones', 
      icon: '🗾',
      description: 'Draw area boundaries'
    },
    { 
      id: 'measurement' as ToolMode, 
      label: 'Measurement', 
      icon: '📏',
      description: 'Measure distances'
    },
    { 
      id: 'decoration' as ToolMode, 
      label: 'Decorations', 
      icon: '🎨',
      description: 'Add decorative elements'
    }
  ]

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTool === tool.id
              ? 'bg-orange-100 text-orange-700 border border-orange-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
          title={tool.description}
        >
          <span className="text-base">{tool.icon}</span>
          <span className="hidden sm:inline">{tool.label}</span>
        </button>
      ))}
      
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      
      <button
        onClick={onClearAll}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
        title="Clear all annotations"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  )
}

// Add map dropdown for upload/create options
function AddMapDropdown({ onUpload, onCreateBlank }: { 
  onUpload: () => void
  onCreateBlank: () => void 
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        onClick={() => setOpen(!open)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Map
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 text-sm right-0 min-w-[160px] z-50">
          <div 
            className="py-3 px-4 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150 flex items-center gap-3" 
            onClick={() => { setOpen(false); onUpload(); }}
          >
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Image
          </div>
          <div 
            className="py-3 px-4 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150 flex items-center gap-3" 
            onClick={() => { setOpen(false); onCreateBlank(); }}
          >
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Blank
          </div>
        </div>
      )}
    </div>
  )
}

// Interactive canvas component with pan/zoom functionality
function MapCanvas({ 
  map, 
  viewport, 
  onViewportChange,
  annotations,
  activeTool,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationSelect,
  selectedAnnotation
}: { 
  map: MapData | null
  viewport: ViewportState
  onViewportChange: (viewport: ViewportState) => void
  annotations: (Pin | Label | Zone | Measurement | Decoration)[]
  activeTool: ToolMode
  onAnnotationAdd: (annotation: Pin | Label | Zone | Measurement | Decoration) => void
  onAnnotationUpdate: (id: string, updates: any) => void
  onAnnotationDelete: (id: string) => void
  onAnnotationSelect: (annotation: any | null) => void
  selectedAnnotation: any | null
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const isPanningRef = useRef(false)
  const lastPanPositionRef = useRef({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  // Handle keyboard events for space-drag panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.code === "Space") {
        e.preventDefault()
        setIsSpacePressed(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Zoom via wheel/trackpad
  const handleWheel = (e: React.WheelEvent) => {
    if (!canvasRef.current) return
    
    e.preventDefault()
    
    const rect = canvasRef.current.getBoundingClientRect()
    const deltaY = e.deltaY
    const zoomFactor = Math.exp(-deltaY * 0.001)
    
    const newScale = Math.min(4, Math.max(0.1, viewport.scale * zoomFactor))
    
    // Zoom towards cursor position
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    
    // Calculate the point in the image that the cursor is over
    const imageX = (cursorX - viewport.translate.x) / viewport.scale
    const imageY = (cursorY - viewport.translate.y) / viewport.scale
    
    // Calculate new translate to keep the same point under the cursor
    const newTranslateX = cursorX - imageX * newScale
    const newTranslateY = cursorY - imageY * newScale
    
    onViewportChange({
      scale: newScale,
      translate: { x: newTranslateX, y: newTranslateY }
    })
  }

  // Convert screen coordinates to map coordinates
  const screenToMapCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    // Validate input coordinates
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      console.warn('Invalid coordinates provided to screenToMapCoords:', { clientX, clientY })
      return { x: 0, y: 0 }
    }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    
    // Convert to map coordinates accounting for scale and translation
    const mapX = (screenX - viewport.translate.x) / viewport.scale
    const mapY = (screenY - viewport.translate.y) / viewport.scale
    
    // Validate output coordinates
    if (!Number.isFinite(mapX) || !Number.isFinite(mapY)) {
      console.warn('Invalid map coordinates calculated:', { mapX, mapY, viewport })
      return { x: 0, y: 0 }
    }
    
    return { x: mapX, y: mapY }
  }

  // Pan via drag and annotation placement
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log('Main handlePointerDown:', { 
      button: e.button, 
      activeTool, 
      target: e.target?.constructor?.name,
      ctrlKey: e.ctrlKey,
      isSpacePressed 
    })
    
    if (e.button === 0 && (e.ctrlKey || e.metaKey || isSpacePressed)) {
      // Primary button with modifier or space - pan mode
      console.log('Starting pan mode')
      isPanningRef.current = true
      lastPanPositionRef.current = { x: e.clientX, y: e.clientY }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      e.preventDefault()
    } else if (e.button === 1) {
      // Middle mouse button - pan mode
      console.log('Middle button pan')
      isPanningRef.current = true
      lastPanPositionRef.current = { x: e.clientX, y: e.clientY }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      e.preventDefault()
    } else if (e.button === 0 && activeTool !== 'select') {
      // Annotation creation is handled by AnnotationOverlay, not here
      console.log('Annotation creation delegated to AnnotationOverlay for tool:', activeTool)
      return
    } else if (e.button === 0 && activeTool === 'select') {
      // Select mode - allow events to bubble to annotations
      console.log('Select mode - allowing event to bubble')
      // Don't prevent default or stop propagation
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    
    const deltaX = e.clientX - lastPanPositionRef.current.x
    const deltaY = e.clientY - lastPanPositionRef.current.y
    
    lastPanPositionRef.current = { x: e.clientX, y: e.clientY }
    
    onViewportChange({
      scale: viewport.scale,
      translate: {
        x: viewport.translate.x + deltaX,
        y: viewport.translate.y + deltaY
      }
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false
      try {
        ;(e.target as Element).releasePointerCapture?.(e.pointerId)
      } catch {
        // Ignore errors
      }
    }
  }

  // Double-click to fit/center
  const handleDoubleClick = () => {
    if (!canvasRef.current) return
    
    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    if (!map?.image_url) {
      // For blank maps, just center at 100% scale
      onViewportChange({
        scale: 1,
        translate: { x: 0, y: 0 }
      })
      return
    }
    
    if (imageRef.current) {
      const naturalWidth = imageRef.current.naturalWidth
      const naturalHeight = imageRef.current.naturalHeight
      
      if (naturalWidth && naturalHeight) {
        // Calculate scale to fit image in canvas
        const scaleX = canvasRect.width / naturalWidth
        const scaleY = canvasRect.height / naturalHeight
        const fitScale = Math.min(scaleX, scaleY, 1) // Don't scale beyond 100%
        
        // Center the image
        const centerX = canvasRect.width / 2
        const centerY = canvasRect.height / 2
        const imageX = centerX - (naturalWidth * fitScale) / 2
        const imageY = centerY - (naturalHeight * fitScale) / 2
        
        onViewportChange({
          scale: fitScale,
          translate: { x: imageX, y: imageY }
        })
      }
    }
  }

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full bg-gray-50 overflow-hidden relative ${
        isSpacePressed ? 'cursor-grab' : 'cursor-default'
      } ${isPanningRef.current ? 'cursor-grabbing' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute top-0 left-0 transform-gpu"
        style={{
          transform: `translate(${viewport.translate.x}px, ${viewport.translate.y}px) scale(${viewport.scale})`,
          transformOrigin: "0 0"
        }}
      >
        {map?.image_url ? (
          <img
            ref={imageRef}
            src={map.image_url}
            alt={map.name}
            className="block max-w-none select-none"
            draggable={false}
            style={{ imageRendering: "auto" }}
          />
        ) : (
          <div className="w-[800px] h-[600px] bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="text-xl font-medium text-gray-700 mb-2">Blank Map</div>
              <div className="text-sm text-gray-500 max-w-xs">
                Start with a blank canvas. You can upload an image later or use this as a reference space.
              </div>
            </div>
          </div>
        )}
        
        {/* Annotation Overlay */}
        <AnnotationOverlay 
          annotations={annotations}
          activeTool={activeTool}
          onAnnotationAdd={onAnnotationAdd}
          onAnnotationUpdate={onAnnotationUpdate}
          onAnnotationDelete={onAnnotationDelete}
          selectedAnnotation={selectedAnnotation}
          onAnnotationSelect={onAnnotationSelect}
          mapDimensions={
            map?.image_url && imageRef.current 
              ? { 
                  width: imageRef.current.naturalWidth || 800, 
                  height: imageRef.current.naturalHeight || 600 
                } 
              : { width: 800, height: 600 }
          }
        />
      </div>
      
      {/* Helpful instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
        <div className="space-y-1">
          <div>🖱️ Drag to pan • 🖱️ Wheel to zoom • ⏸️ Space+drag to pan • ⏸️ Double-click to fit</div>
          <div>
            {activeTool === 'select' && '🔍 Select: Click annotations • Del to delete • Enter to edit'}
            {activeTool === 'pin' && '📍 Pin: Click to place • Double-click to edit label'}
            {activeTool === 'label' && '🏷️ Label: Click to place • Auto-edit mode'}
            {activeTool === 'zone' && '🗾 Zone: Click to place • Double-click edge to add point • Drag points to edit'}
            {activeTool === 'measurement' && '📏 Measurement: Click to start • Move to preview • Click to finish • ESC to cancel'}
            {activeTool === 'decoration' && '🎨 Decoration: Click to place • Select to change shape/size'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to notify parent components of new maps
const notifyMapCreated = (mapData: any, projectId: string) => {
  // Dispatch custom event for sidebar and other components to listen
  window.dispatchEvent(new CustomEvent('mapCreated', {
    detail: { map: mapData, projectId }
  }))
}

// Type guards for annotation type checking
const isPinAnnotation = (annotation: Pin | Label | Zone | Measurement | Decoration): annotation is Pin => annotation.type === 'pin'
const isLabelAnnotation = (annotation: Pin | Label | Zone | Measurement | Decoration): annotation is Label => annotation.type === 'label'
const isZoneAnnotation = (annotation: Pin | Label | Zone | Measurement | Decoration): annotation is Zone => annotation.type === 'zone'
const isDecorationAnnotation = (annotation: Pin | Label | Zone | Measurement | Decoration): annotation is Decoration => annotation.type === 'decoration'
const isMeasurementAnnotation = (annotation: Pin | Label | Zone | Measurement | Decoration): annotation is Measurement => annotation.type === 'measurement'

// Annotation Overlay Component - handles rendering and interaction of all annotation types
function AnnotationOverlay({ 
  annotations, 
  activeTool, 
  onAnnotationAdd, 
  onAnnotationUpdate, 
  onAnnotationDelete,
  mapDimensions,
  selectedAnnotation,
  onAnnotationSelect
}: {
  annotations: (Pin | Label | Zone | Measurement | Decoration)[]
  activeTool: ToolMode
  onAnnotationAdd: (annotation: Pin | Label | Zone | Measurement | Decoration) => void
  onAnnotationUpdate: (id: string, updates: any) => void
  onAnnotationDelete: (id: string) => void
  mapDimensions: { width: number, height: number }
  selectedAnnotation: any | null
  onAnnotationSelect: (annotation: any | null) => void
}) {
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const CLICK_DEBOUNCE_MS = 500 // Prevent multiple clicks within 500ms
  const processingClickRef = useRef(false)
  const lastProcessedClickRef = useRef<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Measurement tool state
  const [activeMeasurement, setActiveMeasurement] = useState<{
    startPoint: { x: number; y: number } | null
    previewPoint: { x: number; y: number } | null
    measurementType: 'distance' | 'area' | 'perimeter'
  }>({
    startPoint: null,
    previewPoint: null,
    measurementType: 'distance'
  })

  // Consolidated keyboard handler for annotation management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: Don't interfere with text input in text fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (selectedAnnotation) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          onAnnotationDelete(selectedAnnotation.id)
          onAnnotationSelect(null)
        } else if (e.key === 'Escape') {
          onAnnotationSelect(null)
          setEditingAnnotation(null)
        } else if (e.key === 'Enter') {
          const annotation = annotations.find(ann => ann.id === selectedAnnotation.id)
          if (annotation && (annotation.type === 'pin' || annotation.type === 'label')) {
            setEditingAnnotation(selectedAnnotation.id)
          }
        }
      } else if (e.key === 'Escape' && activeMeasurement.startPoint) {
        // Cancel measurement creation
        setActiveMeasurement({
          startPoint: null,
          previewPoint: null,
          measurementType: 'distance'
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnnotation, annotations, onAnnotationDelete, onAnnotationSelect, activeMeasurement])

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Create unique click identifier based on coordinates and time
    const clickId = `${e.clientX}-${e.clientY}-${activeTool}-${Date.now()}`
    
    // Prevent duplicate execution with ref guard
    if (processingClickRef.current) {
      return
    }
    
    // Check if this exact click was already processed
    if (lastProcessedClickRef.current === clickId) {
      return
    }
    
    // Debounce rapid clicks to prevent duplicate annotations
    const now = Date.now()
    if (now - lastClickTime < CLICK_DEBOUNCE_MS) {
      return
    }
    
    // Set processing flag and record this click
    processingClickRef.current = true
    lastProcessedClickRef.current = clickId
    setLastClickTime(now)
    
    // Clear processing flag after a short delay
    setTimeout(() => {
      processingClickRef.current = false
    }, 100)
    
    if (activeTool === 'select') {
      // Deselect when clicking on empty space
      onAnnotationSelect(null)
      setEditingAnnotation(null)
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    // Create new annotation based on active tool
    const id = `${activeTool}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    switch (activeTool) {
      case 'pin':
        const pin: Pin = {
          id,
          type: 'pin',
          x: x * mapDimensions.width,
          y: y * mapDimensions.height,
          label: 'New Pin',
          color: '#ef4444',
          icon: '📍'
        }
        onAnnotationAdd(pin)
        onAnnotationSelect({ id, type: 'pin' })
        break
        
      case 'label':
        const label: Label = {
          id,
          type: 'label',
          x: x * mapDimensions.width,
          y: y * mapDimensions.height,
          text: 'New Label',
          fontSize: 16,
          color: '#1f2937',
          backgroundColor: '#ffffff',
          rotation: 0
        }
        onAnnotationAdd(label)
        onAnnotationSelect({ id, type: 'label' })
        setEditingAnnotation(id)
        break
        
      case 'zone':
        const zone: Zone = {
          id,
          type: 'zone',
          points: [
            { x: x * mapDimensions.width - 80, y: y * mapDimensions.height - 80 },
            { x: x * mapDimensions.width + 80, y: y * mapDimensions.height - 80 },
            { x: x * mapDimensions.width + 80, y: y * mapDimensions.height + 80 },
            { x: x * mapDimensions.width - 80, y: y * mapDimensions.height + 80 }
          ],
          fillColor: '#10b981',
          borderColor: '#059669',
          borderStyle: 'solid',
          borderWidth: 2,
          opacity: 0.8
        }
        onAnnotationAdd(zone)
        onAnnotationSelect({ id, type: 'zone' })
        break
        
      case 'measurement':
        // New measurement flow: click to start, move to preview, click to finish
        const clickPoint = { x: x * mapDimensions.width, y: y * mapDimensions.height }
        
        if (!activeMeasurement.startPoint) {
          // First click: start measurement
          setActiveMeasurement({
            ...activeMeasurement,
            startPoint: clickPoint,
            previewPoint: clickPoint
          })
        } else {
          // Second click: finish measurement
          const measurement: Measurement = {
            id,
            type: 'measurement',
            measurementType: activeMeasurement.measurementType,
            points: [activeMeasurement.startPoint, clickPoint],
            unit: 'px',
            scale: 1,
            color: '#f59e0b',
            showLabel: true,
            labelPosition: 'auto'
          }
          onAnnotationAdd(measurement)
          onAnnotationSelect({ id, type: 'measurement' })
          
          // Reset measurement state
          setActiveMeasurement({
            startPoint: null,
            previewPoint: null,
            measurementType: 'distance'
          })
        }
        break
        
      case 'decoration':
        const decoration: Decoration = {
          id,
          type: 'decoration',
          x: x * mapDimensions.width,
          y: y * mapDimensions.height,
          shape: 'circle',
          size: 20,
          color: '#8b5cf6',
          rotation: 0
        }
        onAnnotationAdd(decoration)
        onAnnotationSelect({ id, type: 'decoration' })
        break
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Update measurement preview when in measurement mode
    if (activeTool === 'measurement' && activeMeasurement.startPoint) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      
      setActiveMeasurement({
        ...activeMeasurement,
        previewPoint: { x: x * mapDimensions.width, y: y * mapDimensions.height }
      })
    }
  }

  // Separate HTML-based and SVG-based annotations
  const htmlAnnotations = annotations.filter(annotation => 
    isPinAnnotation(annotation) || isLabelAnnotation(annotation)
  )
  const svgAnnotations = annotations.filter(annotation => 
    isZoneAnnotation(annotation) || isDecorationAnnotation(annotation) || isMeasurementAnnotation(annotation)
  )

  return (
    <div 
      className="absolute inset-0 pointer-events-auto"
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      style={{ 
        cursor: activeTool !== 'select' ? 'crosshair' : 'default',
        width: mapDimensions.width,
        height: mapDimensions.height 
      }}
    >
      {/* HTML-based annotations (pins, labels) */}
      {htmlAnnotations.map((annotation, index) => (
        <AnnotationRenderer
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotation?.id === annotation.id}
          onSelect={() => onAnnotationSelect(annotation)}
          onUpdate={(updates) => onAnnotationUpdate(annotation.id, updates)}
          onDelete={() => onAnnotationDelete(annotation.id)}
          editingAnnotation={editingAnnotation}
          onStartEdit={(id) => setEditingAnnotation(id)}
          onEndEdit={() => setEditingAnnotation(null)}
          annotationIndex={index}
        />
      ))}
      
      {/* Single shared SVG overlay for all SVG-based annotations */}
      {svgAnnotations.length > 0 && (
        <svg 
          style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            width: '100%', 
            height: '100%', 
            pointerEvents: 'auto',
            zIndex: 10 
          }}
          viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
        >
          {svgAnnotations.map((annotation, index) => {
            const key = annotation.id
            const isSelected = selectedAnnotation?.id === annotation.id
            const onSelect = () => onAnnotationSelect(annotation)
            const onUpdate = (updates: any) => onAnnotationUpdate(annotation.id, updates)
            const onDelete = () => onAnnotationDelete(annotation.id)
            
            if (isZoneAnnotation(annotation)) {
              return (
                <EnhancedZoneRenderer
                  key={key}
                  annotation={annotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              )
            }
            
            if (isDecorationAnnotation(annotation)) {
              return (
                <EnhancedDecorationRenderer
                  key={key}
                  annotation={annotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              )
            }
            
            if (isMeasurementAnnotation(annotation)) {
              return (
                <EnhancedMeasurementRenderer
                  key={key}
                  annotation={annotation}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              )
            }
            
            return null
          })}
          
          {/* Measurement Preview */}
          {activeTool === 'measurement' && activeMeasurement.startPoint && activeMeasurement.previewPoint && (
            <g>
              <line
                x1={activeMeasurement.startPoint.x}
                y1={activeMeasurement.startPoint.y}
                x2={activeMeasurement.previewPoint.x}
                y2={activeMeasurement.previewPoint.y}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5,5"
                opacity={0.8}
              />
              <circle
                cx={activeMeasurement.startPoint.x}
                cy={activeMeasurement.startPoint.y}
                r={4}
                fill="#f59e0b"
                opacity={0.8}
              />
              <circle
                cx={activeMeasurement.previewPoint.x}
                cy={activeMeasurement.previewPoint.y}
                r={4}
                fill="#f59e0b"
                opacity={0.8}
              />
              {/* Live distance preview */}
              <text
                x={(activeMeasurement.startPoint.x + activeMeasurement.previewPoint.x) / 2}
                y={(activeMeasurement.startPoint.y + activeMeasurement.previewPoint.y) / 2 - 10}
                textAnchor="middle"
                className="text-xs font-medium"
                fill="#f59e0b"
                style={{
                  filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))',
                  userSelect: 'none'
                }}
              >
                {Math.round(Math.sqrt(
                  Math.pow(activeMeasurement.previewPoint.x - activeMeasurement.startPoint.x, 2) + 
                  Math.pow(activeMeasurement.previewPoint.y - activeMeasurement.startPoint.y, 2)
                ))}px
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  )
}

// Enhanced Pin Component with editing capabilities
function EnhancedPinRenderer({ 
  annotation, 
  isSelected, 
  isEditing,
  onSelect, 
  onUpdate, 
  onDelete,
  onStartEdit,
  onEndEdit
}: {
  annotation: Pin
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
  onStartEdit: () => void
  onEndEdit: () => void
}) {
  const [localLabel, setLocalLabel] = useState(annotation.label)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b']
  const icons = ['📍', '🏠', '⭐', '💰', '⚔️', '🛡️', '🗡️', '🏰', '🌟', '💎']

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      onUpdate({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onUpdate])

  const handleLabelSubmit = () => {
    onUpdate({ label: localLabel })
    onEndEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit()
    } else if (e.key === 'Escape') {
      setLocalLabel(annotation.label)
      onEndEdit()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return
    e.stopPropagation()
    
    if (isSelected) {
      // Start dragging
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - annotation.x,
        y: e.clientY - annotation.y
      })
    } else {
      onSelect()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartEdit()
  }

  return (
    <div 
      style={{
        position: 'absolute',
        left: annotation.x,
        top: annotation.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 1000 : 100
      }}
      className={`${isDragging ? 'cursor-grabbing' : isSelected ? 'cursor-grab' : 'cursor-pointer'} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Pin Icon */}
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg relative"
        style={{ backgroundColor: annotation.color }}
      >
        {annotation.icon}
        
        {/* Delete button when selected */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      {/* Label */}
      {isEditing ? (
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white px-2 py-1 rounded shadow text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
            autoFocus
          />
        </div>
      ) : (
        annotation.label && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
            {annotation.label}
          </div>
        )
      )}

      {/* Property Controls - Positioned below label */}
      {isSelected && !isEditing && (
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 flex gap-1 z-40"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setShowColorPicker(!showColorPicker)
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="px-2 py-1 bg-white border rounded text-xs hover:bg-gray-50 shadow-sm"
            title="Change color & icon"
          >
            🎨
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onStartEdit()
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="px-2 py-1 bg-white border rounded text-xs hover:bg-gray-50 shadow-sm"
            title="Edit label"
          >
            ✏️
          </button>
        </div>
      )}

      {/* Color Picker - Positioned to the right to avoid overlap */}
      {isSelected && showColorPicker && (
        <div 
          className="absolute top-0 left-full ml-2 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[200px]"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <div className="text-xs font-medium mb-2 text-gray-700">Colors</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onUpdate({ color })
                  setShowColorPicker(false)
                }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                className="w-7 h-7 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all"
                style={{ backgroundColor: color }}
                title={`Set color to ${color}`}
              />
            ))}
          </div>
          <div className="text-xs font-medium mb-2 text-gray-700">Icons</div>
          <div className="grid grid-cols-5 gap-1">
            {icons.map((icon) => (
              <button
                key={icon}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onUpdate({ icon })
                  setShowColorPicker(false)
                }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                className="w-7 h-7 text-sm hover:bg-gray-100 rounded hover:scale-110 transition-all flex items-center justify-center"
                title={`Set icon to ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setShowColorPicker(false)
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="mt-2 w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

// Enhanced Label Component with inline editing
function EnhancedLabelRenderer({ 
  annotation, 
  isSelected, 
  isEditing,
  onSelect, 
  onUpdate, 
  onDelete,
  onStartEdit,
  onEndEdit
}: {
  annotation: Label
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
  onStartEdit: () => void
  onEndEdit: () => void
}) {
  const [localText, setLocalText] = useState(annotation.text)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const colors = ['#1f2937', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
  const backgroundColors = ['#ffffff', '#f3f4f6', '#fef3c7', '#dcfce7', '#dbeafe', '#e0e7ff', '#fce7f3', 'transparent']
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32]

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      onUpdate({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onUpdate])

  const handleTextSubmit = () => {
    onUpdate({ text: localText })
    onEndEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    } else if (e.key === 'Escape') {
      setLocalText(annotation.text)
      onEndEdit()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isSelected) {
      onSelect()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return
    e.stopPropagation()
    
    if (isSelected) {
      // Start dragging
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - annotation.x,
        y: e.clientY - annotation.y
      })
    } else {
      onSelect()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartEdit()
  }

  if (isEditing) {
    return (
      <div
        style={{
          position: 'absolute',
          left: annotation.x,
          top: annotation.y,
          transform: `translate(-50%, -50%) rotate(${annotation.rotation || 0}deg)`,
          zIndex: 1000
        }}
      >
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          className="px-2 py-1 rounded shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          style={{
            fontSize: annotation.fontSize,
            color: annotation.color,
            backgroundColor: annotation.backgroundColor || '#ffffff',
            minWidth: '100px',
            minHeight: '24px'
          }}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: annotation.x,
        top: annotation.y,
        fontSize: annotation.fontSize,
        color: annotation.color,
        backgroundColor: annotation.backgroundColor,
        transform: `translate(-50%, -50%) rotate(${annotation.rotation || 0}deg)`,
        zIndex: isSelected ? 1000 : 100
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={`${isDragging ? 'cursor-grabbing' : isSelected ? 'cursor-grab' : 'cursor-pointer'} px-2 py-1 rounded shadow-sm relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
    >
      {annotation.text}
      
      {/* Delete button when selected */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
        >
          ×
        </button>
      )}

      {/* Property Controls */}
      {isSelected && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
          <div className="bg-white border rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[200px]">
            {/* Font Size */}
            <div>
              <label className="text-xs text-gray-600">Size</label>
              <select
                value={annotation.fontSize}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full text-xs border rounded px-1 py-0.5"
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
            
            {/* Text Color */}
            <div>
              <label className="text-xs text-gray-600">Color</label>
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ color })}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            {/* Background Color */}
            <div>
              <label className="text-xs text-gray-600">Background</label>
              <div className="grid grid-cols-4 gap-1">
                {backgroundColors.map((bgColor) => (
                  <button
                    key={bgColor}
                    onClick={() => onUpdate({ backgroundColor: bgColor })}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ 
                      backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                      backgroundImage: bgColor === 'transparent' ? 
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 
                        'none',
                      backgroundSize: bgColor === 'transparent' ? '8px 8px' : 'auto',
                      backgroundPosition: bgColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Rotation */}
            <div>
              <label className="text-xs text-gray-600">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                value={annotation.rotation || 0}
                onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{annotation.rotation || 0}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Measurement Component
function EnhancedMeasurementRenderer({ 
  annotation, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete
}: {
  annotation: Measurement
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
}) {
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)

  if (annotation.points.length < 2) return null

  const [start, end] = annotation.points
  const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
  const realDistance = distance / (annotation.scale || 1)
  
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  }

  const formatDistance = (dist: number, unit: string) => {
    switch (unit) {
      case 'px': return `${Math.round(dist)}px`
      case 'ft': return `${Math.round(dist)}ft`
      case 'm': return `${Math.round(dist)}m`
      case 'km': return `${(dist / 1000).toFixed(2)}km`
      case 'mi': return `${(dist / 5280).toFixed(2)}mi`
      case 'custom': return `${Math.round(dist)} ${annotation.customUnit || 'units'}`
      default: return `${Math.round(dist)}`
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleStartDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingStart(true)
  }

  const handleEndDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingEnd(true)
  }

  return (
    <g>
      {/* Main measurement line */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={annotation.color}
        strokeWidth={isSelected ? 3 : 2}
        onClick={handleClick}
        className="cursor-pointer"
        style={{ filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none' }}
      />
      
      {/* Start point handle */}
      <circle
        cx={start.x}
        cy={start.y}
        r={isSelected ? 6 : 4}
        fill={annotation.color}
        stroke="white"
        strokeWidth={2}
        className={`cursor-pointer ${isSelected ? 'cursor-move' : ''}`}
        onClick={handleClick}
        onMouseDown={handleStartDrag}
      />
      
      {/* End point handle */}
      <circle
        cx={end.x}
        cy={end.y}
        r={isSelected ? 6 : 4}
        fill={annotation.color}
        stroke="white"
        strokeWidth={2}
        className={`cursor-pointer ${isSelected ? 'cursor-move' : ''}`}
        onClick={handleClick}
        onMouseDown={handleEndDrag}
      />
      
      {/* Distance label - only show if showLabel is true */}
      {annotation.showLabel && (
        <text
          x={midpoint.x}
          y={midpoint.y - 10}
          textAnchor="middle"
          className="text-xs font-medium"
          fill={annotation.color}
          style={{
            filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))',
            userSelect: 'none'
          }}
        >
          {formatDistance(realDistance, annotation.unit)}
        </text>
      )}
      
      {/* Delete button when selected */}
      {isSelected && (
        <foreignObject x={midpoint.x + 30} y={midpoint.y - 20} width="20" height="20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
          >
            ×
          </button>
        </foreignObject>
      )}
    </g>
  )
}

// Enhanced Zone Component with editable points
function EnhancedZoneRenderer({ 
  annotation, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete
}: {
  annotation: Zone
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
}) {
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [isDraggingZone, setIsDraggingZone] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const fillColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4',
    '#f97316', '#84cc16', '#06b6d4', '#d946ef', '#71717a', '#ef4444', '#10b981', '#3b82f6'
  ]
  const borderColors = [
    '#1d4ed8', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#475569', '#0891b2',
    '#ea580c', '#65a30d', '#0e7490', '#c026d3', '#52525b', '#dc2626', '#059669', '#2563eb'
  ]

  // Global mouse event handlers for smooth zone dragging
  useEffect(() => {
    if (!isDraggingZone) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      
      // Use the same image finding logic as point dragging
      const allImages = document.querySelectorAll('img')
      let imageElement = null
      let imageRect = null
      
      // Find the image that's actually visible and in the viewport
      for (let img of allImages) {
        const rect = img.getBoundingClientRect()
        
        // Check if mouse is within this image's bounds
        if (e.clientX >= rect.left && e.clientX <= rect.right && 
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          imageElement = img
          imageRect = rect
          break
        }
      }
      
      if (!imageElement || !imageRect) {
        imageElement = allImages[0] as HTMLImageElement
        imageRect = imageElement.getBoundingClientRect()
      }
      
      // Calculate coordinates relative to the image
      const relativeX = e.clientX - imageRect.left
      const relativeY = e.clientY - imageRect.top
      
      // Convert to image natural coordinate system
      const svgX = (relativeX / imageRect.width) * imageElement.naturalWidth
      const svgY = (relativeY / imageRect.height) * imageElement.naturalHeight
      
      const newCentroidX = svgX - dragOffset.x
      const newCentroidY = svgY - dragOffset.y
      
      // Calculate the current centroid
      const currentCentroid = {
        x: annotation.points.reduce((sum, p) => sum + p.x, 0) / annotation.points.length,
        y: annotation.points.reduce((sum, p) => sum + p.y, 0) / annotation.points.length
      }
      
      // Calculate offset for all points
      const offsetX = newCentroidX - currentCentroid.x
      const offsetY = newCentroidY - currentCentroid.y
      
      // Move all points by the same offset
      const newPoints = annotation.points.map(point => ({
        x: point.x + offsetX,
        y: point.y + offsetY
      }))
      
      onUpdate({ points: newPoints })
    }

    const handleMouseUp = () => {
      setIsDraggingZone(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingZone, dragOffset, annotation.points, onUpdate])

  // Global mouse event handlers for point dragging
  useEffect(() => {
    if (draggedPointIndex === null) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      
      // Let's try to find the actual image that's visible on screen
      const allImages = document.querySelectorAll('img')
      console.log('Found images:', allImages.length)
      
      let imageElement = null
      let imageRect = null
      
      // Find the image that's actually visible and in the viewport
      for (let img of allImages) {
        const rect = img.getBoundingClientRect()
        console.log('Image rect:', rect.left, rect.top, rect.width, rect.height)
        
        // Check if mouse is within this image's bounds
        if (e.clientX >= rect.left && e.clientX <= rect.right && 
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          imageElement = img
          imageRect = rect
          console.log('Found correct image!')
          break
        }
      }
      
      if (!imageElement || !imageRect) {
        console.log('No suitable image found, using first image')
        imageElement = allImages[0] as HTMLImageElement
        imageRect = imageElement.getBoundingClientRect()
      }
      
      console.log('Using image rect:', imageRect.left, imageRect.top, imageRect.width, imageRect.height)
      console.log('Image natural:', imageElement.naturalWidth, imageElement.naturalHeight)
      console.log('Mouse:', e.clientX, e.clientY)
      
      // Calculate coordinates relative to the image
      const relativeX = e.clientX - imageRect.left
      const relativeY = e.clientY - imageRect.top
      
      console.log('Relative:', relativeX, relativeY)
      
      // Convert to image natural coordinate system
      const x = (relativeX / imageRect.width) * imageElement.naturalWidth
      const y = (relativeY / imageRect.height) * imageElement.naturalHeight
      
      console.log('Final coords:', x, y)
      
      // Ensure coordinates stay within bounds
      const clampedX = Math.max(0, Math.min(x, imageElement.naturalWidth))
      const clampedY = Math.max(0, Math.min(y, imageElement.naturalHeight))
      
      const newPoints = [...annotation.points]
      newPoints[draggedPointIndex] = { x: clampedX, y: clampedY }
      onUpdate({ points: newPoints })
    }

    const handleMouseUp = () => {
      setDraggedPointIndex(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedPointIndex, annotation.points, onUpdate])

  if (annotation.points.length < 3) return null

  const pathData = annotation.points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z'

  const centroid = {
    x: annotation.points.reduce((sum, p) => sum + p.x, 0) / annotation.points.length,
    y: annotation.points.reduce((sum, p) => sum + p.y, 0) / annotation.points.length
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleZoneMouseDown = (e: React.MouseEvent) => {
    if (!isSelected) return
    e.stopPropagation()
    
    // Use the same image finding logic as the dragging effect
    const allImages = document.querySelectorAll('img')
    let imageElement = null
    let imageRect = null
    
    // Find the image that's actually visible and in the viewport
    for (let img of allImages) {
      const rect = img.getBoundingClientRect()
      
      // Check if mouse is within this image's bounds
      if (e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        imageElement = img
        imageRect = rect
        break
      }
    }
    
    if (!imageElement || !imageRect) {
      imageElement = allImages[0] as HTMLImageElement
      imageRect = imageElement.getBoundingClientRect()
    }
    
    // Calculate coordinates relative to the image
    const relativeX = e.clientX - imageRect.left
    const relativeY = e.clientY - imageRect.top
    
    // Convert to image natural coordinate system
    const svgX = (relativeX / imageRect.width) * imageElement.naturalWidth
    const svgY = (relativeY / imageRect.height) * imageElement.naturalHeight
    
    // Calculate current centroid
    const currentCentroid = {
      x: annotation.points.reduce((sum, p) => sum + p.x, 0) / annotation.points.length,
      y: annotation.points.reduce((sum, p) => sum + p.y, 0) / annotation.points.length
    }
    
    setDragOffset({
      x: svgX - currentCentroid.x,
      y: svgY - currentCentroid.y
    })
    setIsDraggingZone(true)
  }

  const addPoint = (e: React.MouseEvent) => {
    if (!isSelected) return
    e.stopPropagation()
    
    // Use the same image finding logic as the dragging effect
    const allImages = document.querySelectorAll('img')
    let imageElement = null
    let imageRect = null
    
    // Find the image that's actually visible and in the viewport
    for (let img of allImages) {
      const rect = img.getBoundingClientRect()
      
      // Check if mouse is within this image's bounds
      if (e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        imageElement = img
        imageRect = rect
        break
      }
    }
    
    if (!imageElement || !imageRect) {
      imageElement = allImages[0] as HTMLImageElement
      imageRect = imageElement.getBoundingClientRect()
    }
    
    // Calculate coordinates relative to the image
    const relativeX = e.clientX - imageRect.left
    const relativeY = e.clientY - imageRect.top
    
    // Convert to image natural coordinate system
    const x = (relativeX / imageRect.width) * imageElement.naturalWidth
    const y = (relativeY / imageRect.height) * imageElement.naturalHeight
    
    // Find the best position to insert the new point
    let insertIndex = annotation.points.length
    let minDistance = Infinity
    
    for (let i = 0; i < annotation.points.length; i++) {
      const current = annotation.points[i]
      const next = annotation.points[(i + 1) % annotation.points.length]
      
      // Calculate distance from click point to the line segment
      const lineDistance = distanceToLineSegment({ x, y }, current, next)
      if (lineDistance < minDistance) {
        minDistance = lineDistance
        insertIndex = i + 1
      }
    }
    
    const newPoints = [...annotation.points]
    newPoints.splice(insertIndex, 0, { x, y })
    onUpdate({ points: newPoints })
  }

  const removePoint = (pointIndex: number) => {
    if (annotation.points.length <= 3) return // Keep minimum 3 points
    const newPoints = annotation.points.filter((_, i) => i !== pointIndex)
    onUpdate({ points: newPoints })
  }

  return (
    <g>
      {/* Zone fill and border */}
      <path
        d={pathData}
        fill={annotation.fillColor}
        stroke={annotation.borderColor}
        strokeWidth={isSelected ? (annotation.borderWidth || 2) + 1 : (annotation.borderWidth || 2)}
        strokeDasharray={annotation.borderStyle === 'dashed' ? '8,4' : 
                        annotation.borderStyle === 'dotted' ? '2,2' : 
                        annotation.borderStyle === 'double' ? '6,3,2,3' : 'none'}
        fillOpacity={annotation.opacity}
        onClick={handleClick}
        onMouseDown={handleZoneMouseDown}
        onDoubleClick={addPoint}
        className={isSelected ? "cursor-move" : "cursor-pointer"}
        style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none' }}
      />
      
      {/* Point handles when selected */}
      {isSelected && annotation.points.map((point, index) => (
        <g key={index}>
          <circle
            cx={point.x}
            cy={point.y}
            r={6}
            fill="white"
            stroke={annotation.borderColor}
            strokeWidth={2}
            className="cursor-move"
            onMouseDown={(e) => {
              console.log('Point mousedown triggered for index:', index)
              e.stopPropagation()
              setDraggedPointIndex(index)
            }}
          />
          {/* Point delete button */}
          {annotation.points.length > 3 && (
            <circle
              cx={point.x + 8}
              cy={point.y - 8}
              r={4}
              fill="#ef4444"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                removePoint(index)
              }}
            />
          )}
        </g>
      ))}
      
      {/* Center delete button */}
      {isSelected && (
        <circle
          cx={centroid.x}
          cy={centroid.y}
          r={8}
          fill="#ef4444"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <title>Delete Zone</title>
        </circle>
      )}
    </g>
  )
}

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}) {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

// Enhanced Decoration Component
function EnhancedDecorationRenderer({ 
  annotation, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete
}: {
  annotation: Decoration
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const shapes = [
    { value: 'circle', label: '●', title: 'Circle' },
    { value: 'rectangle', label: '■', title: 'Rectangle' },
    { value: 'star', label: '★', title: 'Star' },
    { value: 'arrow', label: '→', title: 'Arrow' },
    { value: 'line', label: '—', title: 'Line' }
  ]

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b']
  const sizes = [10, 15, 20, 25, 30, 40, 50, 60]

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelected) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      onUpdate({ x, y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const renderShape = () => {
    const baseProps = {
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      className: `cursor-pointer ${isSelected ? 'stroke-2 stroke-blue-500' : ''}`,
      style: { 
        filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none',
        transformOrigin: 'center'
      }
    }

    switch (annotation.shape) {
      case 'circle':
        return (
          <circle
            cx={annotation.x}
            cy={annotation.y}
            r={annotation.size / 2}
            fill={annotation.color}
            transform={`rotate(${annotation.rotation || 0} ${annotation.x} ${annotation.y})`}
            {...baseProps}
          />
        )
      
      case 'rectangle':
        return (
          <rect
            x={annotation.x - annotation.size / 2}
            y={annotation.y - annotation.size / 2}
            width={annotation.size}
            height={annotation.size}
            fill={annotation.color}
            transform={`rotate(${annotation.rotation || 0} ${annotation.x} ${annotation.y})`}
            {...baseProps}
          />
        )
      
      case 'star':
        const starPath = createStarPath(annotation.x, annotation.y, annotation.size / 2, annotation.size / 4, 5)
        return (
          <path
            d={starPath}
            fill={annotation.color}
            transform={`rotate(${annotation.rotation || 0} ${annotation.x} ${annotation.y})`}
            {...baseProps}
          />
        )
      
      case 'arrow':
        const arrowPath = createArrowPath(annotation.x, annotation.y, annotation.size)
        return (
          <path
            d={arrowPath}
            fill={annotation.color}
            transform={`rotate(${annotation.rotation || 0} ${annotation.x} ${annotation.y})`}
            {...baseProps}
          />
        )
      
      case 'line':
        return (
          <line
            x1={annotation.x - annotation.size / 2}
            y1={annotation.y}
            x2={annotation.x + annotation.size / 2}
            y2={annotation.y}
            stroke={annotation.color}
            strokeWidth={4}
            transform={`rotate(${annotation.rotation || 0} ${annotation.x} ${annotation.y})`}
            {...baseProps}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <g>
      {renderShape()}
      
      {/* Delete button when selected */}
      {isSelected && (
        <circle
          cx={annotation.x + annotation.size / 2 + 10}
          cy={annotation.y - annotation.size / 2 - 10}
          r={8}
          fill="#ef4444"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <title>Delete Decoration</title>
        </circle>
      )}
      
      {/* Property Controls */}
      {isSelected && (
        <foreignObject 
          x={annotation.x + annotation.size / 2 + 15} 
          y={annotation.y - annotation.size / 2} 
          width="200" 
          height="200"
        >
          <div className="bg-white border rounded-lg shadow-lg p-2 text-xs">
            <div className="mb-2">
              <label className="block text-gray-600">Shape</label>
              <div className="grid grid-cols-5 gap-1">
                {shapes.map((shape) => (
                  <button
                    key={shape.value}
                    onClick={() => onUpdate({ shape: shape.value })}
                    className={`w-8 h-8 border rounded text-center font-bold ${
                      annotation.shape === shape.value ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                    }`}
                    title={shape.title}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-2">
              <label className="block text-gray-600">Color</label>
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ color })}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="mb-2">
              <label className="block text-gray-600">Size</label>
              <div className="grid grid-cols-4 gap-1">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdate({ size })}
                    className={`px-2 py-1 border rounded text-xs ${
                      annotation.size === size ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-600">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                value={annotation.rotation || 0}
                onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-gray-500">{annotation.rotation || 0}°</span>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  )
}

// Helper functions for creating shape paths
function createStarPath(cx: number, cy: number, outerRadius: number, innerRadius: number, points: number) {
  let path = ''
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points
    const x = cx + radius * Math.cos(angle - Math.PI / 2)
    const y = cy + radius * Math.sin(angle - Math.PI / 2)
    path += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`
  }
  return path + ' Z'
}

function createArrowPath(cx: number, cy: number, size: number) {
  const halfSize = size / 2
  const quarterSize = size / 4
  return `M ${cx - halfSize} ${cy - quarterSize} 
          L ${cx + quarterSize} ${cy - quarterSize}
          L ${cx + quarterSize} ${cy - halfSize}
          L ${cx + halfSize} ${cy}
          L ${cx + quarterSize} ${cy + halfSize}
          L ${cx + quarterSize} ${cy + quarterSize}
          L ${cx - halfSize} ${cy + quarterSize} Z`
}

// Individual Annotation Renderer
function AnnotationRenderer({ 
  annotation, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  editingAnnotation,
  onStartEdit,
  onEndEdit,
  annotationIndex
}: {
  annotation: Pin | Label | Zone | Measurement | Decoration
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
  editingAnnotation: string | null
  onStartEdit: (id: string) => void
  onEndEdit: () => void
  annotationIndex?: number
}) {
  const handleClick = (e: React.MouseEvent) => {
    console.log('Annotation clicked:', annotation.id, annotation.type)
    e.stopPropagation()
    onSelect()
  }

  // Position calculation
  const getPosition = (): React.CSSProperties => {
    if (isZoneAnnotation(annotation)) {
      return { position: 'absolute', left: 0, top: 0, zIndex: isSelected ? 1000 : 100 }
    }
    
    const x = isPinAnnotation(annotation) || isLabelAnnotation(annotation) || isDecorationAnnotation(annotation) 
      ? annotation.x : 0
    const y = isPinAnnotation(annotation) || isLabelAnnotation(annotation) || isDecorationAnnotation(annotation)
      ? annotation.y : 0
      
    return {
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translate(-50%, -50%)',
      zIndex: isSelected ? 1000 : 100
    }
  }

  if (isPinAnnotation(annotation)) {
    return (
      <EnhancedPinRenderer
        annotation={annotation}
        isSelected={isSelected}
        isEditing={editingAnnotation === annotation.id}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onStartEdit={() => onStartEdit(annotation.id)}
        onEndEdit={onEndEdit}
      />
    )
  }
      
  if (isLabelAnnotation(annotation)) {
    return (
      <EnhancedLabelRenderer
        annotation={annotation}
        isSelected={isSelected}
        isEditing={editingAnnotation === annotation.id}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onStartEdit={() => onStartEdit(annotation.id)}
        onEndEdit={onEndEdit}
      />
    )
  }
      
  // SVG annotations are now handled in the shared SVG overlay
  return null
}

// Static Color Picker Component
function StaticColorPicker({ 
  selectedAnnotation,
  onColorUpdate,
  onOpacityUpdate 
}: {
  selectedAnnotation: any | null
  onColorUpdate: (type: 'fill' | 'border' | 'color' | 'borderStyle' | 'borderWidth' | 'unit' | 'customUnit' | 'scale' | 'showLabel', value: string | number | boolean) => void
  onOpacityUpdate: (opacity: number) => void
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Generate a color wheel with HSL colors
  const generateColorWheel = () => {
    const colors = []
    // Primary hues with high saturation and medium lightness
    for (let hue = 0; hue < 360; hue += 30) {
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }
    // Add some neutral colors
    colors.push('#000000', '#404040', '#808080', '#c0c0c0')
    return colors
  }

  const generateSecondaryColors = () => {
    const colors = []
    // Darker variants for borders
    for (let hue = 0; hue < 360; hue += 30) {
      colors.push(`hsl(${hue}, 60%, 40%)`)
    }
    // Add some neutral colors
    colors.push('#1a1a1a', '#2a2a2a', '#5a5a5a', '#9a9a9a')
    return colors
  }

  const fillColors = generateColorWheel()
  const borderColors = generateSecondaryColors()

  if (!selectedAnnotation) {
    return null
  }

  const isZone = selectedAnnotation.type === 'zone'
  const isPin = selectedAnnotation.type === 'pin'
  const isLabel = selectedAnnotation.type === 'label'
  const isMeasurement = selectedAnnotation.type === 'measurement'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Color Picker Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div 
          className="w-4 h-4 rounded border border-gray-300" 
          style={{ 
            backgroundColor: selectedAnnotation.fillColor || selectedAnnotation.color || '#3b82f6' 
          }}
        ></div>
        <span className="text-gray-700">{selectedAnnotation.type} Colors</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[320px]">
          <div className="space-y-4">
            {/* Fill/Main Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {isZone ? 'Fill Color' : isPin ? 'Pin Color' : 'Text Color'}
              </label>
              
              {/* Color Wheel */}
              <div className="grid grid-cols-8 gap-1 mb-3">
                {fillColors.map((color, index) => (
                  <button
                    key={`fill-${index}-${color}`}
                    onClick={() => onColorUpdate(isZone ? 'fill' : 'color', color)}
                    className={`w-6 h-6 rounded border-2 hover:border-gray-500 transition-all hover:scale-110 ${
                      (selectedAnnotation.fillColor || selectedAnnotation.color) === color 
                        ? 'border-blue-500 ring-1 ring-blue-300' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Custom:</label>
                <input
                  type="color"
                  value={selectedAnnotation.fillColor || selectedAnnotation.color || '#3b82f6'}
                  onChange={(e) => onColorUpdate(isZone ? 'fill' : 'color', e.target.value)}
                  className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedAnnotation.fillColor || selectedAnnotation.color || '#3b82f6'}
                  onChange={(e) => onColorUpdate(isZone ? 'fill' : 'color', e.target.value)}
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                  placeholder="#hexcolor"
                />
              </div>
            </div>

            {/* Border Color (for zones and labels) */}
            {(isZone || isLabel) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {isZone ? 'Border Color' : 'Background Color'}
                </label>
                
                {/* Color Wheel */}
                <div className="grid grid-cols-8 gap-1 mb-3">
                  {borderColors.map((color, index) => (
                    <button
                      key={`border-${index}-${color}`}
                      onClick={() => onColorUpdate('border', color)}
                      className={`w-6 h-6 rounded border-2 hover:border-gray-500 transition-all hover:scale-110 ${
                        selectedAnnotation.borderColor === color 
                          ? 'border-blue-500 ring-1 ring-blue-300' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                {/* Custom Color Input */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Custom:</label>
                  <input
                    type="color"
                    value={selectedAnnotation.borderColor || '#1d4ed8'}
                    onChange={(e) => onColorUpdate('border', e.target.value)}
                    className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedAnnotation.borderColor || '#1d4ed8'}
                    onChange={(e) => onColorUpdate('border', e.target.value)}
                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                    placeholder="#hexcolor"
                  />
                </div>
              </div>
            )}

            {/* Border Style (for zones only) */}
            {isZone && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Border Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onColorUpdate('borderStyle', 'solid')}
                    className={`px-3 py-2 text-xs border rounded flex items-center justify-center ${
                      (selectedAnnotation.borderStyle || 'solid') === 'solid'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-6 h-0 border-t-2 border-gray-600"></div>
                    <span className="ml-2">Solid</span>
                  </button>
                  
                  <button
                    onClick={() => onColorUpdate('borderStyle', 'dashed')}
                    className={`px-3 py-2 text-xs border rounded flex items-center justify-center ${
                      selectedAnnotation.borderStyle === 'dashed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-6 h-0 border-t-2 border-dashed border-gray-600"></div>
                    <span className="ml-2">Dashed</span>
                  </button>
                  
                  <button
                    onClick={() => onColorUpdate('borderStyle', 'dotted')}
                    className={`px-3 py-2 text-xs border rounded flex items-center justify-center ${
                      selectedAnnotation.borderStyle === 'dotted'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-6 h-0 border-t-2 border-dotted border-gray-600"></div>
                    <span className="ml-2">Dotted</span>
                  </button>
                  
                  <button
                    onClick={() => onColorUpdate('borderStyle', 'double')}
                    className={`px-3 py-2 text-xs border rounded flex items-center justify-center ${
                      selectedAnnotation.borderStyle === 'double'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-6 h-0 border-t-4 border-double border-gray-600"></div>
                    <span className="ml-2">Double</span>
                  </button>
                </div>
              </div>
            )}

            {/* Border Width (for zones only) */}
            {isZone && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Border Width</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedAnnotation.borderWidth || 2}
                    onChange={(e) => onColorUpdate('borderWidth', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 font-medium min-w-[25px]">
                    {selectedAnnotation.borderWidth || 2}px
                  </span>
                </div>
              </div>
            )}

            {/* Measurement Controls (for measurements only) */}
            {isMeasurement && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Unit</label>
                  <select
                    value={selectedAnnotation.unit || 'px'}
                    onChange={(e) => onColorUpdate('unit', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="px">Pixels</option>
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                    <option value="km">Kilometers</option>
                    <option value="mi">Miles</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                {selectedAnnotation.unit === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Custom Unit</label>
                    <input
                      type="text"
                      value={selectedAnnotation.customUnit || ''}
                      onChange={(e) => onColorUpdate('customUnit', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      placeholder="Enter unit name"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Scale (pixels per unit)</label>
                  <input
                    type="number"
                    value={selectedAnnotation.scale || 1}
                    onChange={(e) => onColorUpdate('scale', parseFloat(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedAnnotation.showLabel !== false}
                      onChange={(e) => onColorUpdate('showLabel', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Show Distance Label
                  </label>
                </div>
              </>
            )}

            {/* Opacity Control */}
            {(isZone || isLabel) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Opacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedAnnotation.opacity || 0.3}
                    onChange={(e) => onOpacityUpdate(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 font-medium min-w-[35px]">
                    {Math.round((selectedAnnotation.opacity || 0.3) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main Maps Panel component - Canvas only layout
function MapsPanel({ mapId, projectId }: { mapId?: string; projectId?: string }) {
  const supabase = createSupabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State management
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null)
  const [allMaps, setAllMaps] = useState<MapData[]>([])
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, translate: { x: 0, y: 0 } })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showMapList, setShowMapList] = useState(false)
  
  // Annotation tool state
  const [activeTool, setActiveTool] = useState<ToolMode>('select')
  const [annotations, setAnnotations] = useState<(Pin | Label | Zone | Measurement | Decoration)[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<any | null>(null)
  const annotationSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debounced save function to prevent duplicate saves
  const debouncedSave = useCallback((mapId: string, attributes: any) => {
    if (annotationSaveTimeoutRef.current) {
      clearTimeout(annotationSaveTimeoutRef.current)
    }
    
    annotationSaveTimeoutRef.current = setTimeout(() => {
      updateMapAttributes(mapId, attributes)
    }, 100) // 100ms debounce
  }, [])
  
  // Annotation handlers
  const handleAnnotationAdd = (annotation: Pin | Label | Zone | Measurement | Decoration) => {
    const updatedAnnotations = [...annotations, annotation]
    setAnnotations(updatedAnnotations)
    // Save to map's attributes field with debounce
    if (selectedMap) {
      const newAttributes = { 
        ...selectedMap.attributes, 
        annotations: updatedAnnotations 
      }
      debouncedSave(selectedMap.id, newAttributes)
    }
  }
  
  const handleAnnotationUpdate = (id: string, updates: any) => {
    const updatedAnnotations = annotations.map(ann => ann.id === id ? { ...ann, ...updates } as typeof ann : ann)
    setAnnotations(updatedAnnotations)
    // Save to map's attributes field with debounce
    if (selectedMap) {
      const newAttributes = { 
        ...selectedMap.attributes, 
        annotations: updatedAnnotations 
      }
      debouncedSave(selectedMap.id, newAttributes)
    }
  }
  
  const handleAnnotationDelete = (id: string) => {
    const filteredAnnotations = annotations.filter(ann => ann.id !== id)
    setAnnotations(filteredAnnotations)
    // Save to map's attributes field with debounce
    if (selectedMap) {
      const newAttributes = { 
        ...selectedMap.attributes, 
        annotations: filteredAnnotations 
      }
      debouncedSave(selectedMap.id, newAttributes)
    }
  }
  
  const handleClearAllAnnotations = () => {
    setAnnotations([])
    setSelectedAnnotation(null) // Clear selection when clearing all
    // Clear from map's attributes field with debounce
    if (selectedMap) {
      const newAttributes = { 
        ...selectedMap.attributes, 
        annotations: [] 
      }
      debouncedSave(selectedMap.id, newAttributes)
    }
  }

  // Color picker handlers
  const handleColorUpdate = (type: 'fill' | 'border' | 'color' | 'borderStyle' | 'borderWidth' | 'unit' | 'customUnit' | 'scale' | 'showLabel', value: string | number | boolean) => {
    if (!selectedAnnotation) return
    
    let updateKey: string
    let updates: any
    
    switch (type) {
      case 'fill':
        updateKey = 'fillColor'
        updates = { [updateKey]: value }
        break
      case 'border':
        updateKey = 'borderColor'
        updates = { [updateKey]: value }
        break
      case 'color':
        updateKey = 'color'
        updates = { [updateKey]: value }
        break
      case 'borderStyle':
        updates = { borderStyle: value }
        break
      case 'borderWidth':
        updates = { borderWidth: value }
        break
      case 'unit':
        updates = { unit: value }
        break
      case 'customUnit':
        updates = { customUnit: value }
        break
      case 'scale':
        updates = { scale: value }
        break
      case 'showLabel':
        updates = { showLabel: value }
        break
      default:
        return
    }
    
    handleAnnotationUpdate(selectedAnnotation.id, updates)
    setSelectedAnnotation({ ...selectedAnnotation, ...updates })
  }

  const handleOpacityUpdate = (opacity: number) => {
    if (!selectedAnnotation) return
    
    handleAnnotationUpdate(selectedAnnotation.id, { opacity })
    setSelectedAnnotation({ ...selectedAnnotation, opacity })
  }

  // Keyboard shortcuts for zoom (in MapsPanel scope)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with text input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (!selectedMap) return
      
      // Zoom shortcuts (with modifier keys for safety)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          const newScale = Math.min(4, viewport.scale * 1.25)
          setViewport(prev => ({ ...prev, scale: newScale }))
        } else if (e.key === '-') {
          e.preventDefault()
          const newScale = Math.max(0.1, viewport.scale / 1.25)
          setViewport(prev => ({ ...prev, scale: newScale }))
        } else if (e.key === '0') {
          e.preventDefault()
          setViewport({ scale: 1, translate: { x: 0, y: 0 } })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMap, viewport.scale])
  
  const updateMapAttributes = async (mapId: string, attributes: any) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('User not authenticated:', authError)
        return
      }
      
      // Save to database
      const { data, error } = await supabase
        .from('world_elements')
        .update({ attributes })
        .eq('id', mapId)
        .select()
      
      if (error) {
        console.error('Failed to save annotations:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.error('No rows updated - Map ID might not exist:', mapId)
        return
      }
    } catch (error) {
      console.error('Failed to save annotations:', error)
    }
  }
  
  // Viewport autosave with debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Viewport autosave with debouncing
  
  const saveViewport = useCallback(async () => {
    if (!selectedMap?.id) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { error } = await supabase
        .from('world_elements')
        .update({
          attributes: {
            ...selectedMap.attributes,
            viewport: viewport
          }
        })
        .eq('id', selectedMap.id)
      
      if (error) {
        console.error('Failed to save viewport:', error)
      }
    } catch (err) {
      console.error('Viewport save error:', err)
    }
  }, [selectedMap?.id, viewport, selectedMap?.attributes, supabase])
  
  // Autosave viewport every 1.5s after changes
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveViewport()
    }, 1500)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [viewport, saveViewport])
  
  // Load all maps for this project
  const loadAllMaps = async () => {
    if (!projectId) return
    
    try {
      const { data, error } = await supabase
        .from('world_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'maps')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAllMaps(data || [])
    } catch (err) {
      console.error('Failed to load maps:', err)
    }
  }

  // Load all maps when component mounts or projectId changes
  useEffect(() => {
    loadAllMaps()
  }, [projectId])

  // Load the specific map if mapId is provided
  useEffect(() => {
    if (!mapId) return
    
    const loadMap = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('world_elements')
          .select('*')
          .eq('id', mapId)
          .single()
        
        if (error) throw error
        
        setSelectedMap(data)
        // Load saved viewport or use defaults
        if (data.attributes?.viewport) {
          setViewport(data.attributes.viewport)
        } else {
          setViewport({ scale: 1, translate: { x: 0, y: 0 } })
        }
        // Load saved annotations
        if (data.attributes?.annotations) {
          setAnnotations(data.attributes.annotations)
        } else {
          setAnnotations([])
        }
      } catch (err) {
        console.error('Failed to load map:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadMap()
  }, [mapId, supabase])
  
  // Handle map upload
  const handleUpload = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !projectId) {
      console.log('Upload aborted - file:', !!file, 'projectId:', !!projectId)
      return
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)')
      return
    }
    
    console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type)
    
    const name = prompt('Enter map name:', file.name.replace(/\.[^/.]+$/, ""))
    if (!name) return
    
    const description = prompt('Enter description (optional):', '') || ''
    
    setUploading(true)
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth check - user:', !!user, 'error:', authError)
      
      if (!user || authError) {
        alert('You must be logged in to upload maps')
        return
      }
      
      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      
      console.log('Uploading to /api/uploads/map...')
      
      const uploadResponse = await fetch('/api/uploads/map', { 
        method: 'POST', 
        body: formData 
      })
      
      console.log('Upload response status:', uploadResponse.status)
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed with status:', uploadResponse.status, 'body:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${uploadResponse.status}` }
        }
        
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const responseData = await uploadResponse.json()
      console.log('Upload response data:', responseData)
      
      const { publicUrl } = responseData
      if (!publicUrl) {
        throw new Error('No public URL returned from upload')
      }
      
      console.log('Saving to database...')
      
      // Save to database
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'maps',
          name,
          description,
          image_url: publicUrl,
          attributes: {}
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database save error:', error)
        throw error
      }
      
      console.log('Successfully created map:', data)
      setSelectedMap(data)
      
      // Notify parent components that a new map was created
      if (projectId) {
        notifyMapCreated(data, projectId)
        // Reload all maps to include the new one
        loadAllMaps()
      }
      
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Failed to upload map: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  // Handle blank map creation
  const handleCreateBlank = async () => {
    if (!projectId) return
    
    const name = prompt('Enter map name:', 'New Map')
    if (!name) return
    
    const description = prompt('Enter description (optional):', '') || ''
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user || authError) {
        alert('You must be logged in to create maps')
        return
      }
      
      const { data, error } = await supabase
        .from('world_elements')
        .insert({
          project_id: projectId,
          category: 'maps',
          name,
          description,
          image_url: null,
          attributes: {}
        })
        .select()
        .single()
      
      if (error) throw error
      
      setSelectedMap(data)
      
      // Notify parent components that a new map was created
      if (projectId) {
        notifyMapCreated(data, projectId)
        // Reload all maps to include the new one
        loadAllMaps()
      }
      
    } catch (err) {
      console.error('Create blank map error:', err)
      alert(`Failed to create blank map: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // Handle zoom controls
  const handleScaleChange = (newScale: number) => {
    if (!selectedMap) return
    
    // Scale around center of viewport
    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      // Calculate point in image space
      const imageX = (centerX - viewport.translate.x) / viewport.scale
      const imageY = (centerY - viewport.translate.y) / viewport.scale
      
      // Calculate new translate to keep center point stable
      const newTranslateX = centerX - imageX * newScale
      const newTranslateY = centerY - imageY * newScale
      
      setViewport({
        scale: newScale,
        translate: { x: newTranslateX, y: newTranslateY }
      })
    } else {
      setViewport(prev => ({ ...prev, scale: newScale }))
    }
  }
  
  const handleFitToScreen = () => {
    setViewport({ scale: 1, translate: { x: 0, y: 0 } })
  }

  return (
    <div className="h-full w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 flex flex-col">
      {/* Enhanced Toolbar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-4">
          {selectedMap && (
            <ZoomControl 
              scale={viewport.scale}
              onScaleChange={handleScaleChange}
              onFitToScreen={handleFitToScreen}
            />
          )}
          
          {/* Map Info */}
          <div className="flex items-center gap-3">
            {selectedMap && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 rounded border border-gray-300 bg-white overflow-hidden">
                  {selectedMap.image_url ? (
                    <img src={selectedMap.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{selectedMap.name}</div>
                  {selectedMap.description && (
                    <div className="text-xs text-gray-500 max-w-[200px] truncate">{selectedMap.description}</div>
                  )}
                </div>
              </div>
            )}
            
            {!selectedMap && allMaps.length > 0 && (
              <div className="text-sm text-gray-600">
                {allMaps.length} map{allMaps.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
          
          {/* Annotation Tools */}
          {selectedMap && (
            <MapToolsBar 
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onClearAll={handleClearAllAnnotations}
            />
          )}
          
          {/* Color picker in toolbar */}
          {selectedAnnotation && (
            <div className="ml-4 pl-4 border-l border-gray-300">
              <StaticColorPicker 
                selectedAnnotation={selectedAnnotation}
                onColorUpdate={handleColorUpdate}
                onOpacityUpdate={handleOpacityUpdate}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Maps List Toggle */}
          {allMaps.length > 0 && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg border border-gray-200 transition-colors duration-200"
              onClick={() => setShowMapList(!showMapList)}
              title="Toggle maps list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Maps
            </button>
          )}
          
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              Uploading...
            </div>
          )}
          <AddMapDropdown onUpload={handleUpload} onCreateBlank={handleCreateBlank} />
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col" data-canvas="true">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <div className="text-lg font-medium">Loading map...</div>
            </div>
          </div>
        ) : selectedMap ? (
          <div className="flex-1">
            {/* Main canvas area - full width */}
            <MapCanvas 
              map={selectedMap}
              viewport={viewport}
              onViewportChange={setViewport}
              annotations={annotations}
              activeTool={activeTool}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              onAnnotationSelect={setSelectedAnnotation}
              selectedAnnotation={selectedAnnotation}
            />
          </div>
        ) : allMaps.length > 0 ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500 max-w-md">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Select a Map</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose from {allMaps.length} available map{allMaps.length !== 1 ? 's' : ''} or create a new one
              </p>
              
              {/* Grid of Map Options */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {allMaps.slice(0, 6).map((map) => (
                  <div
                    key={map.id}
                    className="group relative aspect-video rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:border-orange-300 hover:shadow-md"
                    onClick={() => setSelectedMap(map)}
                  >
                    {map.image_url ? (
                      <img 
                        src={map.image_url} 
                        alt={map.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-md transition-colors duration-200"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-md p-2">
                      <div className="text-white text-xs font-medium truncate">{map.name}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <AddMapDropdown onUpload={handleUpload} onCreateBlank={handleCreateBlank} />
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500 max-w-md">
              <div className="text-6xl mb-6">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">Start Your World Mapping</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Upload reference images or create blank canvases to design the geography of your story world. 
                Perfect for tracking locations, planning adventures, and visualizing your narrative space.
              </p>
              
              <div className="space-y-4">
                <AddMapDropdown onUpload={handleUpload} onCreateBlank={handleCreateBlank} />
                
                <div className="text-xs text-gray-400 mt-4">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.333-4.167L21 18M5 18V4.667L12.333 9M5 18l8.333-4.167" />
                      </svg>
                      Drag to pan
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Scroll to zoom
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Auto-save viewport
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default MapsPanel

