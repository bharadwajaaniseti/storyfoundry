'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'
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

interface TimelineItem {
  id: string
  type: 'version' | 'activity' | 'approval'
  title: string
  description: string
  created_at: string
  user: {
    id: string
    display_name: string
    avatar_url?: string
  }
  metadata?: any
}

interface ProjectHistoryProps {
  projectId: string
  currentUserId?: string
  canRestore?: boolean
}

export default function ProjectHistory({ projectId, currentUserId, canRestore = false }: ProjectHistoryProps) {
  const { addToast } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [viewingContent, setViewingContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Timeline state
  const [viewMode, setViewMode] = useState<'versions' | 'timeline'>('versions')
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Filters
  const [tagFilter, setTagFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [projectId])

  const loadVersions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/versions`)
      
      if (!response.ok) {
        throw new Error('Failed to load version history')
      }
      
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (err) {
      console.error('Error loading versions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load versions')
      addToast({
        type: 'error',
        title: 'Failed to load version history',
        message: 'Please try again later.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTimeline = async (reset = true) => {
    try {
      setTimelineLoading(true)
      
      const currentPage = reset ? 1 : page + 1
      const response = await fetch(`/api/projects/${projectId}/timeline?page=${currentPage}&limit=20`)
      
      if (!response.ok) {
        throw new Error('Failed to load timeline')
      }
      
      const data = await response.json()
      
      if (reset) {
        setTimelineItems(data.items || [])
        setPage(1)
      } else {
        setTimelineItems(prev => [...prev, ...(data.items || [])])
        setPage(currentPage)
      }
      
      setHasMore(data.hasMore || false)
    } catch (err) {
      console.error('Error loading timeline:', err)
      addToast({
        type: 'error',
        title: 'Failed to load timeline',
        message: 'Please try again later.'
      })
    } finally {
      setTimelineLoading(false)
    }
  }

  const viewVersionContent = async (version: Version) => {
    try {
      setIsLoadingContent(true)
      setSelectedVersion(version)
      
      const response = await fetch(`/api/projects/${projectId}/versions/${version.id}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Version content API error:', response.status, errorText)
        throw new Error(`Failed to load version content (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      setViewingContent(data.version.content)
    } catch (err) {
      console.error('Error loading version content:', err)
      addToast({
        type: 'error',
        title: 'Failed to load version content',
        message: 'Please try again later.'
      })
    } finally {
      setIsLoadingContent(false)
    }
  }

  const restoreVersion = async (version: Version) => {
    if (!confirm(`Are you sure you want to restore to version ${version.version_number}? This will replace the current content.`)) {
      return
    }

    try {
      setIsRestoring(true)
      
      const response = await fetch(`/api/projects/${projectId}/versions/${version.id}/restore`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to restore version')
      }

      addToast({
        type: 'success',
        title: 'Version restored',
        message: `Successfully restored to version ${version.version_number}`
      })
      
      // Reload versions to show the new restore point
      loadVersions()
      
      // Clear selected version and content
      setSelectedVersion(null)
      setViewingContent(null)
      
    } catch (err) {
      console.error('Error restoring version:', err)
      addToast({
        type: 'error',
        title: 'Failed to restore version',
        message: 'Please try again later.'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else if (days < 30) {
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getVersionStats = () => {
    if (versions.length === 0) return null
    
    const totalVersions = versions.length
    const majorVersions = versions.filter(v => v.is_major_version).length
    const lastVersion = versions[0]
    const contributors = new Set(versions.map(v => v.user.id)).size
    
    return {
      totalVersions,
      majorVersions,
      lastVersion,
      contributors
    }
  }

  const stats = getVersionStats()

  const handleViewModeChange = (mode: 'versions' | 'timeline') => {
    setViewMode(mode)
    if (mode === 'timeline' && timelineItems.length === 0) {
      loadTimeline()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadVersions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Project History</h2>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('versions')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'versions' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Versions
            </button>
            <button
              onClick={() => handleViewModeChange('timeline')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalVersions}</div>
              <div className="text-sm text-gray-600">Total Versions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.majorVersions}</div>
              <div className="text-sm text-gray-600">Major Versions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.contributors}</div>
              <div className="text-sm text-gray-600">Contributors</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">
                {stats.lastVersion ? formatTime(stats.lastVersion.created_at) : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Update</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[600px]">
        {viewMode === 'versions' ? (
          <>
            {/* Version List */}
            <div className="lg:col-span-2 border-r border-gray-200">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Version History</h3>
                <p className="text-sm text-gray-600">{versions.length} versions</p>
              </div>
              
              <div className="overflow-y-auto max-h-[600px]">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No versions found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                          selectedVersion?.id === version.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-transparent'
                        }`}
                        onClick={() => viewVersionContent(version)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900">
                                Version {version.version_number}
                              </span>
                              
                              {version.is_major_version && (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                  MAJOR
                                </span>
                              )}
                              
                              {version.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                              {version.change_summary || 'No description provided'}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                              <span>{formatTime(version.created_at)}</span>
                              <span>•</span>
                              <span>{version.word_count.toLocaleString()} words</span>
                            </div>
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
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingContent ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : viewingContent ? (
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                          {viewingContent}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p>No content available</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                  <div>
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a version to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Timeline View
          <div className="lg:col-span-3 min-h-[600px]">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Activity Timeline</h3>
              <p className="text-sm text-gray-600">{timelineItems.length} events</p>
            </div>
            
            <div className="overflow-y-auto max-h-[600px] p-6">
              {timelineLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading timeline...</p>
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No timeline events found</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {timelineItems.map((item, index) => (
                      <div key={`${item.type}-${item.id}-${index}`} className="relative flex items-start space-x-4">
                        {/* Timeline dot */}
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 bg-white ${
                          item.type === 'version' ? 'border-blue-500' :
                          item.type === 'approval' ? 'border-green-500' :
                          'border-gray-400'
                        }`}></div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    item.type === 'version' ? 'bg-blue-100 text-blue-700' :
                                    item.type === 'approval' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {item.type}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                                
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    {item.user.avatar_url ? (
                                      <img
                                        src={item.user.avatar_url}
                                        alt={item.user.display_name}
                                        className="w-4 h-4 rounded-full"
                                      />
                                    ) : (
                                      <User className="w-4 h-4" />
                                    )}
                                    <span>{item.user.display_name}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{formatTime(item.created_at)}</span>
                                </div>
                                
                                {/* Show metadata for different types */}
                                {item.type === 'version' && item.metadata && (
                                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                    <span>v{item.metadata.version_number}</span>
                                    <span>{item.metadata.word_count?.toLocaleString()} words</span>
                                    {item.metadata.is_major_version && (
                                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                                        MAJOR
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {item.type === 'approval' && item.metadata && (
                                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                                    <span className={`px-2 py-1 rounded-full ${
                                      item.metadata.decision === 'approve' ? 'bg-green-100 text-green-700' :
                                      item.metadata.decision === 'reject' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {item.metadata.decision}
                                    </span>
                                    {item.metadata.editor && (
                                      <>
                                        <span>•</span>
                                        <span>by {item.metadata.editor.display_name}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action buttons for versions */}
                              {item.type === 'version' && item.metadata?.version_id && (
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => {
                                      // Convert timeline item to version format for viewing
                                      const version: Version = {
                                        id: item.metadata.version_id,
                                        version_number: item.metadata.version_number,
                                        change_summary: item.description,
                                        word_count: item.metadata.word_count || 0,
                                        character_count: item.metadata.character_count || 0,
                                        created_at: item.created_at,
                                        is_major_version: item.metadata.is_major_version || false,
                                        tags: item.metadata.tags || [],
                                        user: item.user
                                      };
                                      viewVersionContent(version);
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    title="View content"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  
                                  {canRestore && (
                                    <button
                                      onClick={() => {
                                        const version: Version = {
                                          id: item.metadata.version_id,
                                          version_number: item.metadata.version_number,
                                          change_summary: item.description,
                                          word_count: item.metadata.word_count || 0,
                                          character_count: item.metadata.character_count || 0,
                                          created_at: item.created_at,
                                          is_major_version: item.metadata.is_major_version || false,
                                          tags: item.metadata.tags || [],
                                          user: item.user
                                        };
                                        restoreVersion(version);
                                      }}
                                      disabled={isRestoring}
                                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                                      title="Restore this version"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMore && (
                      <div className="text-center py-4">
                        <button
                          onClick={() => loadTimeline(false)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Load more events
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}