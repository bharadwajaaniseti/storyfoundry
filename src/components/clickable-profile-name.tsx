'use client'

import React from 'react'

interface ClickableProfileNameProps {
  profileId?: string
  displayName?: string | null
  fallbackName?: string
  onClick?: (profileId: string) => void
  className?: string
  hoverClassName?: string
  disabled?: boolean
}

export const ClickableProfileName: React.FC<ClickableProfileNameProps> = ({
  profileId,
  displayName,
  fallbackName = 'Anonymous',
  onClick,
  className = '',
  hoverClassName = 'hover:text-purple-600 hover:underline',
  disabled = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (profileId && onClick && !disabled) {
      onClick(profileId)
    }
  }

  const name = displayName || fallbackName
  const isClickable = profileId && onClick && !disabled

  if (!isClickable) {
    return <span className={className}>{name}</span>
  }

  return (
    <button
      onClick={handleClick}
      className={`${className} ${hoverClassName} transition-colors cursor-pointer`}
      type="button"
    >
      {name}
    </button>
  )
}

export default ClickableProfileName
