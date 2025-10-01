'use client'

import React from 'react'
import { Crown, Edit3, Trash2, Globe, Eye } from 'lucide-react'
import { Culture } from '@/lib/validation/cultureSchema'
import { Button } from '@/components/ui/button'

interface CultureCardProps {
  culture: Culture
  onEdit: (culture: Culture) => void
  onDelete: (culture: Culture) => void
  onPreview?: (culture: Culture) => void
  viewMode?: 'grid' | 'list'
}

export default function CultureCard({ culture, onEdit, onDelete, onPreview, viewMode = 'grid' }: CultureCardProps) {
  // Count rich content
  const eventCount = (culture.attributes.historical_events?.length || 0)
  const figureCount = (culture.attributes.important_figures?.length || 0)
  const partyCount = (culture.attributes.political_parties?.length || 0)
  const hasRichContent = eventCount + figureCount + partyCount > 0

  // List view render
  if (viewMode === 'list') {
    return (
      <div 
        className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-pink-400/50 transition-all duration-300 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-pink-500/0 before:via-pink-500/5 before:to-purple-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        onClick={() => onEdit(culture)}
      >
        <div className="p-3.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Enhanced Icon with Gradient Background and Glow Effect */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-pink-50 via-pink-50 to-purple-50 flex items-center justify-center border border-pink-200/60 group-hover:border-pink-300 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  {culture.attributes.iconImage ? (
                    <img
                      src={culture.attributes.iconImage}
                      alt={culture.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : culture.attributes.icon ? (
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{culture.attributes.icon}</span>
                  ) : (
                    <Crown className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-pink-700 transition-colors duration-300">
                    {culture.name}
                  </h3>
                  {culture.attributes.government && (
                    <span className="text-xs text-gray-600 border border-gray-200/80 px-2 py-0.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 group-hover:border-pink-200 group-hover:from-pink-50 group-hover:to-pink-50/50 transition-all duration-300">
                      {culture.attributes.government}
                    </span>
                  )}
                </div>
                
                {culture.attributes.summary && (
                  <p className="text-xs text-gray-600 line-clamp-1 mb-1.5 leading-snug group-hover:text-gray-700 transition-colors duration-300">
                    {culture.attributes.summary}
                  </p>
                )}
                
                {/* Enhanced Info Row with Icons */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {partyCount > 0 && (
                    <span className="flex items-center gap-1.5 group-hover:text-pink-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 group-hover:bg-pink-500 group-hover:shadow-sm group-hover:shadow-pink-300 transition-all duration-300"></span>
                      <Globe className="w-3 h-3" />
                      <span className="font-medium">{partyCount}</span>
                    </span>
                  )}
                  {eventCount > 0 && (
                    <span className="flex items-center gap-1.5 group-hover:text-blue-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-500 group-hover:shadow-sm group-hover:shadow-blue-300 transition-all duration-300"></span>
                      <span className="font-medium">📅 {eventCount}</span>
                    </span>
                  )}
                  {figureCount > 0 && (
                    <span className="flex items-center gap-1.5 group-hover:text-purple-600 transition-colors duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:bg-purple-500 group-hover:shadow-sm group-hover:shadow-purple-300 transition-all duration-300"></span>
                      <span className="font-medium">👤 {figureCount}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {onPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPreview(culture)
                    }}
                    className="flex-shrink-0 opacity-60 group-hover:opacity-100 text-gray-400 hover:text-pink-600 hover:bg-pink-50/80 rounded-lg transition-all duration-300 group-hover:scale-105 h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(culture)
                  }}
                  className="flex-shrink-0 opacity-60 group-hover:opacity-100 text-gray-400 hover:text-pink-600 hover:bg-pink-50/80 rounded-lg transition-all duration-300 group-hover:scale-105 h-8 w-8 p-0"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(culture)
                  }}
                  className="flex-shrink-0 opacity-60 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-all duration-300 group-hover:scale-105 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated Bottom Border on Hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
      </div>
    )
  }

  // Grid view render (default)
  return (
    <div 
      className="group relative rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-xl hover:border-pink-400/50 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-pink-500/0 before:via-pink-500/5 before:to-purple-500/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      onClick={() => onEdit(culture)}
    >
      <div className="p-4 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Enhanced Icon with Gradient Background and Glow Effect */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-pink-50 via-pink-50 to-purple-50 flex items-center justify-center border border-pink-200/60 group-hover:border-pink-300 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                {culture.attributes.iconImage ? (
                  <img
                    src={culture.attributes.iconImage}
                    alt={culture.name}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                  />
                ) : culture.attributes.icon ? (
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">{culture.attributes.icon}</span>
                ) : (
                  <Crown className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-pink-700 transition-colors duration-300">
                {culture.name}
              </h3>
            </div>
          </div>
          
          {/* Action buttons - shown on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(culture)
                }}
                className="h-7 w-7 p-0 hover:bg-pink-50 hover:text-pink-600 transition-all duration-300 hover:scale-110"
                aria-label={`Preview ${culture.name}`}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(culture)
              }}
              className="h-7 w-7 p-0 hover:bg-pink-50 hover:text-pink-600 transition-all duration-300 hover:scale-110"
              aria-label={`Edit ${culture.name}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(culture)
              }}
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-all duration-300 hover:scale-110"
              aria-label={`Delete ${culture.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        {culture.attributes.summary && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 group-hover:text-gray-700 transition-colors duration-300">
            {culture.attributes.summary}
          </p>
        )}

        {/* Key Attributes */}
        <div className="space-y-1.5 mb-3">
          {culture.attributes.government && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1 group-hover:text-pink-600 transition-colors duration-300">
                <Globe className="w-3 h-3" />
                Government
              </span>
              <span className="text-gray-900 font-medium truncate ml-2 group-hover:text-pink-700 transition-colors duration-300">
                {culture.attributes.government}
              </span>
            </div>
          )}
          {culture.attributes.primary_language && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 group-hover:text-pink-600 transition-colors duration-300">Language</span>
              <span className="text-gray-900 font-medium truncate ml-2 group-hover:text-pink-700 transition-colors duration-300">
                {culture.attributes.primary_language}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {culture.tags && culture.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {culture.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200/80 group-hover:border-pink-200 group-hover:from-pink-50 group-hover:to-pink-50/50 transition-all duration-300"
              >
                {tag}
              </span>
            ))}
            {culture.tags.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-500 border border-gray-200/80 group-hover:border-pink-200 transition-all duration-300">
                +{culture.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Rich Content Stats */}
        {hasRichContent && (
          <div className="flex items-center gap-2.5 mb-3 text-[10px] text-gray-500">
            {partyCount > 0 && (
              <span className="flex items-center gap-1 group-hover:text-pink-600 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-pink-400 group-hover:bg-pink-500 group-hover:shadow-sm group-hover:shadow-pink-300 transition-all duration-300"></span>
                <Globe className="w-2.5 h-2.5" />
                <span className="font-medium">{partyCount}</span>
              </span>
            )}
            {eventCount > 0 && (
              <span className="flex items-center gap-1 group-hover:text-blue-600 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-blue-400 group-hover:bg-blue-500 group-hover:shadow-sm group-hover:shadow-blue-300 transition-all duration-300"></span>
                <span className="font-medium">📅 {eventCount}</span>
              </span>
            )}
            {figureCount > 0 && (
              <span className="flex items-center gap-1 group-hover:text-purple-600 transition-colors duration-300">
                <span className="w-1 h-1 rounded-full bg-purple-400 group-hover:bg-purple-500 group-hover:shadow-sm group-hover:shadow-purple-300 transition-all duration-300"></span>
                <span className="font-medium">👤 {figureCount}</span>
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 group-hover:border-pink-200 transition-colors duration-300">
          <div className="flex items-center gap-1">
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(culture)
                }}
                className="text-[10px] text-gray-600 hover:text-pink-600 hover:bg-pink-50/80 h-6 px-1.5 transition-all duration-300 hover:scale-105"
              >
                <Eye className="w-2.5 h-2.5 mr-0.5" />
                Preview
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(culture)
              }}
              className="text-[10px] text-pink-600 hover:text-pink-700 hover:bg-pink-50/80 h-6 px-1.5 transition-all duration-300 hover:scale-105"
            >
              <Edit3 className="w-2.5 h-2.5 mr-0.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(culture)
              }}
              className="text-[10px] text-gray-500 hover:text-red-600 hover:bg-red-50/80 h-6 px-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
            >
              <Trash2 className="w-2.5 h-2.5 mr-0.5" />
              Delete
            </Button>
          </div>
          <span className="text-[10px] text-gray-400 group-hover:text-pink-500 transition-colors duration-300">
            {new Date(culture.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {/* Animated Bottom Border on Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
    </div>
  )
}
