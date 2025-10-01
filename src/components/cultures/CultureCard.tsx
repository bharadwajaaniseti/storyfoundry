'use client'

import React from 'react'
import { Crown, Edit3, Trash2, Globe } from 'lucide-react'
import { Culture } from '@/lib/validation/cultureSchema'
import { Button } from '@/components/ui/button'

interface CultureCardProps {
  culture: Culture
  onEdit: (culture: Culture) => void
  onDelete: (culture: Culture) => void
}

export default function CultureCard({ culture, onEdit, onDelete }: CultureCardProps) {
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              {culture.attributes.icon ? (
                <span className="text-xl">{culture.attributes.icon}</span>
              ) : (
                <Crown className="w-5 h-5 text-pink-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {culture.name}
              </h3>
            </div>
          </div>
          
          {/* Action buttons - shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(culture)}
              className="h-8 w-8 p-0 hover:bg-pink-50 hover:text-pink-600"
              aria-label={`Edit ${culture.name}`}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(culture)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${culture.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        {culture.attributes.summary && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {culture.attributes.summary}
          </p>
        )}

        {/* Key Attributes */}
        <div className="space-y-2 mb-4">
          {culture.attributes.government && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Government
              </span>
              <span className="text-gray-900 font-medium truncate ml-2">
                {culture.attributes.government}
              </span>
            </div>
          )}
          {culture.attributes.primary_language && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Language</span>
              <span className="text-gray-900 font-medium truncate ml-2">
                {culture.attributes.primary_language}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {culture.tags && culture.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {culture.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {culture.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                +{culture.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(culture)}
            className="text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50 h-7 px-2"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <span className="text-xs text-gray-400">
            {new Date(culture.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}
