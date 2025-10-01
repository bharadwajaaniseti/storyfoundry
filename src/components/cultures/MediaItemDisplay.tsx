'use client'

import React from 'react'
import { ExternalLink, Image as ImageIcon } from 'lucide-react'
import { MediaItem } from './MediaItemInput'

interface MediaItemDisplayProps {
  item: MediaItem
}

export default function MediaItemDisplay({ item }: MediaItemDisplayProps) {
  return (
    <div className="group">
      {item.imageUrls && item.imageUrls.length > 0 ? (
        <div className="space-y-2">
          {/* Image Gallery */}
          <div className="grid grid-cols-3 gap-1">
            {item.imageUrls.slice(0, 3).map((imageUrl, idx) => (
              <img
                key={idx}
                src={imageUrl}
                alt={`${item.name} ${idx + 1}`}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
          {item.imageUrls.length > 3 && (
            <p className="text-xs text-gray-500">+{item.imageUrls.length - 3} more</p>
          )}
          {item.name && (
            <p className="text-sm font-medium text-gray-700">{item.name}</p>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Link
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {item.name && (
            <p className="text-sm text-gray-700">{item.name}</p>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Link
            </a>
          )}
        </div>
      )}
    </div>
  )
}
