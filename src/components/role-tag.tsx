'use client'

import React from 'react'

export function getRoleColor(role?: string) {
  if (!role) return 'bg-gray-100 text-gray-600'
  const r = role.toLowerCase()
  const colors: Record<string, string> = {
    'coauthor': 'bg-blue-100 text-blue-800',
    'editor': 'bg-green-100 text-green-800',
    'reviewer': 'bg-purple-100 text-purple-800',
    'translator': 'bg-pink-100 text-pink-800',
    'producer': 'bg-orange-100 text-orange-800',
    'owner': 'bg-yellow-100 text-yellow-800'
  }
  return colors[r] || 'bg-gray-100 text-gray-600'
}

export default function RoleTag({ role, className }: { role?: string | null, className?: string }) {
  if (!role) return null
  const display = String(role).charAt(0).toUpperCase() + String(role).slice(1)
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs mr-1 ${getRoleColor(role)} ${className || ''}`}>
      {display}
    </span>
  )
}
