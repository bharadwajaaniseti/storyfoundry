"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
// createPortal removed — popover features removed per user request
import { createSupabaseClient } from "@/lib/auth"

// Header toolbar removed — pins/labels/zones/measure/decor features removed per user request.

function ZoomControl() {
  const [open, setOpen] = useState(false)
  const [scale, setScaleLocal] = useState(1)

  useEffect(() => {
    const h = (ev: Event) => {
      const d = (ev as CustomEvent).detail || {}
      if (typeof d.scale === 'number') setScaleLocal(d.scale)
    }
    window.addEventListener('maps.panel.toolbar.sync', h as EventListener)
    return () => window.removeEventListener('maps.panel.toolbar.sync', h as EventListener)
  }, [])

  const emit = (payload: Record<string, any>) => window.dispatchEvent(new CustomEvent('maps.panel.toolbar.change', { detail: payload }))

  const choose = (v: number | 'fit') => {
    setOpen(false)
    if (v === 'fit') emit({ fit: true })
    else emit({ scale: v })
  }

  return (
    <div className="relative inline-block">
      <button 
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        onClick={() => setOpen(s => !s)}
      >
        {Math.round(scale * 100)}%
      </button>
      {open && (
        <div className="absolute mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-sm right-0 min-w-[120px] z-50">
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose('fit')}>Fit to Screen</div>
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose(0.25)}>25%</div>
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose(0.5)}>50%</div>
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose(1)}>100%</div>
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose(2)}>200%</div>
          <div className="py-2 px-3 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150" onClick={() => choose(4)}>400%</div>
        </div>
      )}
    </div>
  )
}

function AddMapDropdown({ onUpload, onCreateBlank }: { onUpload: () => void; onCreateBlank: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        onClick={() => setOpen(s => !s)}
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
        <div className="absolute mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 text-sm right-0 min-w-[160px] z-50">
          <div className="py-3 px-4 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150 flex items-center gap-3" onClick={() => { setOpen(false); onUpload(); }}>
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Image
          </div>
          <div className="py-3 px-4 rounded-md hover:bg-orange-50 cursor-pointer transition-colors duration-150 flex items-center gap-3" onClick={() => { setOpen(false); onCreateBlank(); }}>
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

export default function MapsPanelRedesigned({ mapId, projectId }: { mapId?: string; projectId?: string }) {
  return <App mapId={mapId} projectId={projectId} />
}

function App({ mapId, projectId }: { mapId?: string; projectId?: string }) {
  const supabase = createSupabaseClient()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [maps, setMaps] = useState<Array<any>>([])
  const [loadingMaps, setLoadingMaps] = useState(false)
  const [selectedMapId, setSelectedMapId] = useState<string | null>(mapId || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isLoadingMap, setIsLoadingMap] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadSelected = async () => {
      if (!mapId && !selectedMapId) return
      const idToLoad = selectedMapId || mapId
      try {
        const { data, error } = await supabase.from("world_elements").select("*").eq("id", idToLoad).single()
        if (error) throw error
        if (!mounted) return
        if (data?.image_url) setFileUrl(data.image_url)
        
        // Load viewport state if available
        if (data?.attributes?.viewport) {
          const viewport = data.attributes.viewport
          // Emit viewport change to canvas
          window.dispatchEvent(new CustomEvent('maps.panel.viewport.load', { 
            detail: { 
              scale: viewport.scale || 1, 
              translate: viewport.translate || { x: 0, y: 0 } 
            } 
          }))
        }
      } catch (err) {
        console.warn("Failed to load map", err)
      }
    }

    loadSelected()
    return () => { mounted = false }
  }, [mapId, selectedMapId])

  // load all maps for the project into the sidebar
  useEffect(() => {
    if (!projectId) return
    let mounted = true
    ;(async () => {
      setLoadingMaps(true)
      try {
        const { data, error } = await supabase.from("world_elements").select("*").eq("project_id", projectId).eq("category", "maps").order('created_at', { ascending: false })
        if (error) throw error
        if (!mounted) return
        setMaps(data || [])
      } catch (err) {
        console.warn('Failed to load maps', err)
      } finally {
        if (mounted) setLoadingMaps(false)
      }
    })()
    return () => { mounted = false }
  }, [projectId])

  const openFile = () => fileInputRef.current?.click()
  const onFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }
    if (!projectId) {
      alert('Missing project context. Cannot upload map.')
      return
    }

    setUploading(true)
    try {
      // FIRST: Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Upload - Current user:', user)
      console.log('Upload - Auth error:', authError)

      if (!user) {
        alert('You must be logged in to upload maps. Please refresh the page and try again.')
        setUploading(false)
        return
      }

      // SECOND: Check project ownership and collaborator status
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, title')
        .eq('id', projectId)
        .single()

      console.log('Upload - Project data:', projectData)
      console.log('Upload - Project error:', projectError)

      if (projectError) {
        console.error('Upload - Project not found or access denied:', projectError)
        alert('Unable to access project. Please check your permissions.')
        setUploading(false)
        return
      }

      const isOwner = projectData.owner_id === user.id
      console.log('Upload - Is project owner:', isOwner)

      let hasPermission = isOwner

      if (!isOwner) {
        // Check if user is an active collaborator
        const { data: collabData, error: collabError } = await supabase
          .from('project_collaborators')
          .select('status, permissions')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        console.log('Upload - Collaborator data:', collabData)
        console.log('Upload - Collaborator error:', collabError)

        if (collabData && !collabError) {
          hasPermission = true
          console.log('Upload - User is active collaborator with permissions:', collabData.permissions)
        } else {
          console.log('Upload - User is not an active collaborator')
        }
      }

      if (!hasPermission) {
        alert(`You don't have permission to add maps to this project. Only the project owner or active collaborators can add maps.`)
        setUploading(false)
        return
      }

      // THIRD: Proceed with file upload
      const form = new FormData()
      form.append('file', file)
      form.append('projectId', projectId)

      const resp = await fetch('/api/uploads/map', { method: 'POST', body: form })
      let json: any = null
      try {
        json = await resp.json()
      } catch (parseErr) {
        const text = await resp.text().catch(() => '')
        console.error('Upload failed — non-JSON response', resp.status, text)
        alert('Upload failed: Invalid server response')
        setUploading(false)
        return
      }

      if (!resp.ok) {
        console.error('Upload failed', resp.status, resp.statusText, json)
        alert(json?.error || `Failed to upload (${resp.status})`)
        setUploading(false)
        return
      }

      const publicUrl = json.publicUrl

      // FOURTH: Insert world_elements record with proper error handling
      const payload = {
        project_id: projectId,
        category: 'maps',
        name: file.name,
        description: '',
        image_url: publicUrl,
        attributes: {}
      }

      console.log('Upload - Inserting payload:', payload)

      const { data, error } = await supabase
        .from('world_elements')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Upload - DB insert failed:', error)

        // Provide specific error messages based on error type
        if (error.message.includes('violates row-level security policy')) {
          alert('Permission denied: Unable to save map. Please check your project permissions.')
        } else if (error.message.includes('duplicate key')) {
          alert('A map with this name already exists. Please rename the file and try again.')
        } else {
          alert(`Failed to save map: ${error.message}`)
        }

        setUploading(false)
        return
      }

      console.log('Upload - Successfully created map record:', data)

      // Update UI
      setMaps((prev) => [data, ...(prev || [])])
      setSelectedMapId(data.id)
      setFileUrl(data.image_url)

      console.log('Upload - Complete success')

    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload failed due to an unexpected error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const createBlankMap = async () => {
    if (!projectId) {
      alert('Missing project context. Cannot create map.')
      return
    }

    const name = prompt('Enter map name:', 'New Map')
    if (!name) return

    const description = prompt('Enter description (optional):', '') || ''

    try {
      // FIRST: Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Create blank map - Current user:', user)
      console.log('Create blank map - Auth error:', authError)

      if (!user) {
        alert('You must be logged in to create maps. Please refresh the page and try again.')
        return
      }

      // SECOND: Check project ownership and collaborator status
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, title')
        .eq('id', projectId)
        .single()

      console.log('Create blank map - Project data:', projectData)
      console.log('Create blank map - Project error:', projectError)

      if (projectError) {
        console.error('Create blank map - Project not found or access denied:', projectError)
        alert('Unable to access project. Please check your permissions.')
        return
      }

      const isOwner = projectData.owner_id === user.id
      console.log('Create blank map - Is project owner:', isOwner)

      let hasPermission = isOwner

      if (!isOwner) {
        // Check if user is an active collaborator
        const { data: collabData, error: collabError } = await supabase
          .from('project_collaborators')
          .select('status, permissions')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        console.log('Create blank map - Collaborator data:', collabData)
        console.log('Create blank map - Collaborator error:', collabError)

        if (collabData && !collabError) {
          hasPermission = true
          console.log('Create blank map - User is active collaborator with permissions:', collabData.permissions)
        } else {
          console.log('Create blank map - User is not an active collaborator')
        }
      }

      if (!hasPermission) {
        alert(`You don't have permission to add maps to this project. Only the project owner or active collaborators can add maps.`)
        return
      }

      // THIRD: Insert world_elements record with proper error handling
      const payload = {
        project_id: projectId,
        category: 'maps',
        name: name,
        description: description,
        image_url: null,
        attributes: {}
      }

      console.log('Create blank map - Inserting payload:', payload)

      const { data, error } = await supabase
        .from('world_elements')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Create blank map - DB insert failed:', error)

        // Provide specific error messages based on error type
        if (error.message.includes('violates row-level security policy')) {
          alert('Permission denied: Unable to create map. Please check your project permissions.')
        } else if (error.message.includes('duplicate key')) {
          alert('A map with this name already exists. Please choose a different name.')
        } else {
          alert(`Failed to create blank map: ${error.message}`)
        }

        return
      }

      console.log('Create blank map - Successfully created map record:', data)

      // Update UI
      setMaps((prev) => [data, ...(prev || [])])
      setSelectedMapId(data.id)
      setFileUrl(null)

      console.log('Create blank map - Complete success')

    } catch (err) {
      console.error('Create blank map error:', err)
      alert('Failed to create blank map due to an unexpected error. Please try again.')
    }
  }

  const filteredAndSortedMaps = maps
    .filter(m => 
      !searchQuery || 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        const aName = a.name || ''
        const bName = b.name || ''
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName)
      } else {
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
      }
    })

  return (
    <div className="h-[80vh] w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 grid grid-cols-[320px,1fr]">
      <aside className="border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Maps</h3>
            <AddMapDropdown onUpload={() => openFile()} onCreateBlank={createBlankMap} />
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="date">Date Created</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            {loadingMaps ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : filteredAndSortedMaps.length === 0 ? (
              <div className="text-sm text-gray-500">{maps.length === 0 ? 'No maps yet' : 'No maps match your search'}</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {filteredAndSortedMaps.map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => { 
                      setSelectedMapId(m.id); 
                      setFileUrl(m.image_url);
                      // Emit map selection event for viewport loading
                      window.dispatchEvent(new CustomEvent('maps.panel.map.selected', { detail: { mapId: m.id } }));
                    }} 
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                      selectedMapId === m.id 
                        ? 'ring-2 ring-orange-400 bg-orange-50 shadow-lg transform scale-[1.02]' 
                        : 'bg-white hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-lg">🗺️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate text-sm">{m.name || 'Untitled Map'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {m.description ? (
                          <span className="truncate block">{m.description}</span>
                        ) : (
                          <span className="text-gray-400">No description</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedMapId === m.id && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="relative bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-12 px-4 flex items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm" style={{ position: 'relative', zIndex: 9999 }}>
          <div className="flex items-center gap-3 pointer-events-auto">
            <ZoomControl />
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="text-xs text-gray-500 font-medium">
              {selectedMapId ? 'Map loaded' : 'No map selected'}
            </div>
          </div>
          <div className="ml-auto">
            <div className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 shadow-sm">
              Base Layer ▾
            </div>
          </div>
        </div>

        {!fileUrl ? (
          <div className="h-[calc(80vh-48px)] w-full grid place-items-center">
            <div className="w-[640px] max-w-[88vw] rounded-2xl border bg-white shadow-sm p-10 text-center">
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Upload Your Map</h2>
              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={openFile}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-2.5 hover:bg-black focus:outline-none"
                >
                  {uploading ? "Uploading..." : "Upload Map"}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || undefined)} />
            </div>
          </div>
        ) : (
          <EditorCanvas src={fileUrl as string} mapId={selectedMapId || undefined} projectId={projectId} isBlank={!fileUrl} />
        )}
      </section>
    </div>
  )
}

function EditorCanvas({ src, mapId, projectId, isBlank = false }: { src: string; mapId?: string; projectId?: string; isBlank?: boolean }) {
  const supabase = createSupabaseClient()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [spacePan, setSpacePan] = useState(false)
  const scaleRef = useRef(scale)
  const translateRef = useRef(translate)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { translateRef.current = translate }, [translate])

  // removed pins/zones/measurements/decor state and handlers per user request
  useEffect(() => {
    const toolHandler = (ev: Event) => {
      const d = (ev as CustomEvent).detail || {}
      if (typeof d.scale === 'number') {
        const prev = scaleRef.current
        const next = d.scale
        const rect = wrapperRef.current?.getBoundingClientRect()
        if (rect) {
          const cx = rect.width / 2
          const cy = rect.height / 2
          const px = (cx - translateRef.current.x) / prev
          const py = (cy - translateRef.current.y) / prev
          const nextTx = cx - px * next
          const nextTy = cy - py * next
          setTranslate({ x: nextTx, y: nextTy })
        }
        setScale(next)
      }
      if (d.fit) {
        const rect = wrapperRef.current?.getBoundingClientRect()
        if (rect) {
          if (isBlank) {
            // For blank maps, just center at 100% scale
            setScale(1)
            setTranslate({ x: 0, y: 0 })
          } else {
            const img = imgRef.current
            if (img) {
              const r = img.getBoundingClientRect()
              const sx = rect.width / r.width
              const sy = rect.height / r.height
              const f = Math.min(sx, sy)
              setScale(f)
              // center
              const cx = rect.width / 2
              const cy = rect.height / 2
              const px = r.width / 2
              const py = r.height / 2
              const nextTx = cx - px * f
              const nextTy = cy - py * f
              setTranslate({ x: nextTx, y: nextTy })
            }
          }
        }
      }
    }

    const viewportLoadHandler = (ev: Event) => {
      const d = (ev as CustomEvent).detail || {}
      if (d.scale && d.translate) {
        setScale(d.scale)
        setTranslate(d.translate)
      }
    }

    window.addEventListener('maps.panel.toolbar.change', toolHandler as EventListener)
    window.addEventListener('maps.panel.viewport.load', viewportLoadHandler as EventListener)
    return () => {
      window.removeEventListener('maps.panel.toolbar.change', toolHandler as EventListener)
      window.removeEventListener('maps.panel.viewport.load', viewportLoadHandler as EventListener)
    }
  }, [isBlank])

  // keep header toolbar in sync with canvas state (only scale remains)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('maps.panel.toolbar.sync', {
      detail: { scale }
    }))
  }, [scale])

  const saveViewport = useCallback(async () => {
    if (!mapId) return

    try {
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (!user) {
        console.warn('Save viewport - User not authenticated')
        return
      }

      const viewportData = {
        scale: scale,
        translate: translate
      }

      const { error } = await supabase
        .from('world_elements')
        .update({
          attributes: {
            viewport: viewportData
          }
        })
        .eq('id', mapId)

      if (error) {
        console.error('Save viewport - DB update failed:', error)
      } else {
        console.log('Save viewport - Successfully saved viewport')
      }
    } catch (err) {
      console.warn('Save viewport error:', err)
    }
  }, [mapId, scale, translate])

  // Autosave viewport with 1.5s debounce
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
  }, [scale, translate, saveViewport])

  // persistence helpers removed (pins/zones/decorations removed)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePan(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePan(false)
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  const onWheel = (e: React.WheelEvent) => {
    // zoom when ctrl/meta pressed or with touchpad pinch (no modifier)
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    e.preventDefault()
    const delta = -e.deltaY
    const zoomFactor = Math.exp(delta * 0.0015)
    const prevScale = scale
    const nextScale = Math.min(4, Math.max(0.25, prevScale * zoomFactor))
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // keep the point under cursor stable
    const px = (cx - translate.x) / prevScale
    const py = (cy - translate.y) / prevScale
    const nextTx = cx - px * nextScale
    const nextTy = cy - py * nextScale
    setScale(nextScale)
    setTranslate({ x: nextTx, y: nextTy })
  }

  const onPointerDownPan = (e: React.PointerEvent) => {
    // start panning on middle button or when space is held
    if (e.button === 1 || spacePan) {
      isPanningRef.current = true
      lastPan.current = { x: e.clientX, y: e.clientY }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }
  }

  const onPointerMovePan = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPan.current.x
    const dy = e.clientY - lastPan.current.y
    lastPan.current = { x: e.clientX, y: e.clientY }
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }))
  }

  const onPointerUpPan = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    isPanningRef.current = false
    try {
      ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    } catch {}
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) {
      if (isBlank) {
        // For blank maps, just center at 100% scale
        setScale(1)
        setTranslate({ x: 0, y: 0 })
      } else {
        const img = imgRef.current
        if (img) {
          const r = img.getBoundingClientRect()
          const sx = rect.width / r.width
          const sy = rect.height / r.height
          const f = Math.min(sx, sy)
          setScale(f)
          // center
          const cx = rect.width / 2
          const cy = rect.height / 2
          const px = r.width / 2
          const py = r.height / 2
          const nextTx = cx - px * f
          const nextTy = cy - py * f
          setTranslate({ x: nextTx, y: nextTy })
        }
      }
    }
  }

  // pin dragging removed

  return (
    <div className="h-full w-full overflow-hidden bg-gray-100">
      <div className="h-full w-full relative">
        <div
          ref={wrapperRef}
          onWheel={onWheel}
          onPointerDown={onPointerDownPan}
          onPointerMove={onPointerMovePan}
          onPointerUp={onPointerUpPan}
          onDoubleClick={onDoubleClick}
          style={{ touchAction: "none", width: "100%", height: "100%" }}
          className="bg-white border rounded-2xl shadow-sm overflow-hidden relative h-full w-full"
        >
          {/* Header toolbar is now rendered in the App header next to 100% control.
              Listen for toolbar changes to update canvas modes. */}
          
          <div style={{ width: "100%", height: "100%", transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transformOrigin: "0 0" }}>
            {isBlank ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors duration-300 hover:border-orange-300 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100">
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-4">🗺️</div>
                  <div className="text-xl font-medium text-gray-800 mb-2">Blank Map</div>
                  <div className="text-sm text-gray-500 mb-4 max-w-xs">
                    Start with a blank canvas. Upload an image later or use this as a reference space.
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-200 rounded-full px-3 py-1 inline-block">
                    💡 Tip: Double-click anywhere to fit the view
                  </div>
                </div>
              </div>
            ) : (
              <img ref={imgRef} src={src} alt="map" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} className="select-none" />
            )}
            <div className="absolute inset-0 pointer-events-none">
              {/* All overlay features (pins, zones, measurements, decorations) removed per user request. */}
            </div>
          </div>
        </div>
      </div>

      {/* popovers removed — overlays fully removed */}
    </div>
  )
}
