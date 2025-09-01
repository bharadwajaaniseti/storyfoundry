'use client'

import { MessageCircle, Clock } from 'lucide-react'
import { useMessageNotifications } from '@/hooks/useMessageNotifications'
import { useRouter } from 'next/navigation'
import UserAvatar from '@/components/user-avatar'

export default function MessageNotifications() {
  const { messageNotifications, totalUnreadMessages, isLoading } = useMessageNotifications()
  const router = useRouter()

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span>Messages</span>
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (messageNotifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span>Messages</span>
        </h3>
        <div className="text-center py-6">
          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No new messages</p>
          <p className="text-xs text-gray-500 mt-1">
            Messages from your conversations will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span>Messages</span>
          {totalUnreadMessages > 0 && (
            <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full font-medium">
              {totalUnreadMessages} new
            </span>
          )}
        </h3>
        <button
          onClick={() => router.push('/app/messages')}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          View all
        </button>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {messageNotifications.slice(0, 5).map((notification) => (
          <div
            key={notification.id}
            onClick={() => router.push(`/app/messages?conversation=${notification.conversation_id}`)}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
          >
            <div className="relative">
              <UserAvatar
                user={{
                  avatar_url: notification.sender_avatar,
                  display_name: notification.sender_name
                }}
                size="sm"
              />
              {notification.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {notification.unread_count > 9 ? '9+' : notification.unread_count}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.sender_name}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatRelativeTime(notification.last_message_at)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {notification.message_preview}
              </p>
              {notification.unread_count > 1 && (
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  +{notification.unread_count - 1} more message{notification.unread_count > 2 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {messageNotifications.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => router.push('/app/messages')}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1 w-full justify-center"
          >
            <span>View {messageNotifications.length - 5} more message{messageNotifications.length - 5 > 1 ? 's' : ''}</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
