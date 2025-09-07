'use client'

import React, { useState, useEffect } from 'react'
import { 
  History, 
  Clock, 
  User, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  Download,
  Tag,
  TrendingUp,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react'

interface Version {
  id: string
  version_number: number
  change_summary: string | null
  word_count: number
  character_count: number
  created_at: string
  is_major_version: boolean
  tags: string[]
  user: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

interface ProjectHistoryProps {
  projectId: string
  currentUserId?: string
  canRestore?: boolean
}

export default function ProjectHistory({ projectId, currentUserId, canRestore = false }: ProjectHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [viewingContent, setViewingContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showMajorOnly, setShowMajorOnly] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    loadVersions(true)
  }, [projectId, showMajorOnly])

  const loadVersions = async (reset = false) => {
    try {
      setIsLoading(reset)
      const currentOffset = reset ? 0 : offset
      
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString()
      })
      
      if (showMajorOnly) {
        params.append('majorOnly', 'true')
      }

      const response = await fetch(`/api/projects/${projectId}/versions?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setVersions(data.versions || [])
          setOffset(20)
        } else {
          setVersions(prev => [...prev, ...(data.versions || [])])
          setOffset(prev => prev + 20)
        }
        
        setHasMore(data.hasMore)
      } else {
        console.warn('Version history API not available:', response.status)
        setVersions([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      setVersions([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  const viewVersionContent = async (version: Version) => {
    if (selectedVersion?.id === version.id) {
      setSelectedVersion(null)
      setViewingContent(null)
      return
    }

    setIsLoadingContent(true)
    setSelectedVersion(version)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/versions/${version.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setViewingContent(data.version.content)
      }
    } catch (error) {
      console.error('Error loading version content:', error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const restoreVersion = async (version: Version) => {
    if (!canRestore) return

    const confirmRestore = confirm(
      `Are you sure you want to restore to version ${version.version_number}? This will replace the current content.`
    )

    if (!confirmRestore) return

    setIsRestoring(true)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/versions/${version.id}/restore`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Successfully restored to version ${data.restoredVersion}`)
        // Reload the page to show the restored content
        window.location.reload()
      } else {
        throw new Error('Failed to restore version')
      }
    } catch (error) {
      console.error('Error restoring version:', error)
      alert('Failed to restore version')
    } finally {
      setIsRestoring(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getChangeIndicator = (currentVersion: Version, previousVersion?: Version) => {
    if (!previousVersion) return null
    
    const wordChange = currentVersion.word_count - previousVersion.word_count
    
    if (Math.abs(wordChange) < 10) return null
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${
        wordChange > 0 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {wordChange > 0 ? '+' : ''}{wordChange} words
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Version History</h2>
                <p className="text-sm text-gray-600">Track changes and restore previous versions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMajorOnly(!showMajorOnly)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                  showMajorOnly
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Major versions only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-0 min-h-[600px]">
          {/* Versions List */}
          <div className="border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Timeline</h3>
              <p className="text-sm text-gray-600">{versions.length} versions</p>
            </div>
            
            <div className="overflow-y-auto max-h-[500px]">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading versions...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No versions found</p>
                  <p className="text-sm mt-2">
                    {process.env.NODE_ENV === 'development' 
                      ? 'Version history requires database migration. Versions will be created automatically when content is saved after migration.'
                      : 'Versions are created automatically when content is saved'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => viewVersionContent(version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              v{version.version_number}
                            </span>
                            {version.is_major_version && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                MAJOR
                              </span>
                            )}
                            {getChangeIndicator(version, versions[index + 1])}
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              {version.user.avatar_url ? (
                                <img
                                  src={version.user.avatar_url}
                                  alt={version.user.display_name}
                                  className="w-4 h-4 rounded-full"
                                />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                              <span>{version.user.display_name}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(version.created_at)}</span>
                            </div>
                          </div>
                          
                          {version.change_summary && (
                            <p className="text-sm text-gray-700 mb-2">{version.change_summary}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{version.word_count.toLocaleString()} words</span>
                            <span>{version.character_count.toLocaleString()} chars</span>
                          </div>
                          
                          {version.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {version.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              viewVersionContent(version)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {canRestore && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                restoreVersion(version)
                              }}
                              disabled={isRestoring}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                              title="Restore this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={() => loadVersions(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Load more versions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div className="bg-gray-50">
            {selectedVersion ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Version {selectedVersion.version_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedVersion.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canRestore && (
                        <button
                          onClick={() => restoreVersion(selectedVersion)}
                          disabled={isRestoring}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : viewingContent ? (
                    <div className="bg-white rounded-lg p-4 h-full">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                        {viewingContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Failed to load content</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a version to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
