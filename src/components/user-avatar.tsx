'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: {
    avatar_url?: string | null
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
  }
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  className?: string
  fallbackClassName?: string
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  fallbackClassName = ''
}: UserAvatarProps) {
  // Generate initials from available name data
  const getInitials = () => {
    if (user.display_name) {
      const names = user.display_name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return user.display_name[0].toUpperCase()
    }
    
    if (user.first_name || user.last_name) {
      const first = user.first_name?.[0] || ''
      const last = user.last_name?.[0] || ''
      return `${first}${last}`.toUpperCase() || 'U'
    }
    
    return 'U'
  }

  // Size classes for predefined sizes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-32 h-32',
    custom: '' // Use custom className
  }

  const fallbackSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg', 
    xl: 'text-3xl',
    custom: ''
  }

  return (
    <Avatar className={cn(size !== 'custom' ? sizeClasses[size] : '', className)}>
      <AvatarImage 
        src={user.avatar_url || undefined} 
        alt={user.display_name || 'User avatar'}
        className="object-cover"
        onError={(e) => {
          console.error('❌ Avatar image failed to load:', user.avatar_url)
          console.error('Error details:', e)
        }}
      />
      <AvatarFallback 
        className={cn(
          'bg-gradient-to-br from-gray-500 to-gray-600 text-white font-semibold',
          size !== 'custom' ? fallbackSizeClasses[size] : '',
          fallbackClassName
        )}
      >
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  )
}
