'use client'

import { useState, useEffect, useRef } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'
import { useMessageNotifications } from '@/hooks/useMessageNotifications'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  X, 
  UserPlus,
  MessageCircle,
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: any
}

export default function NotificationBell() {
  const { addToast } = useToast()
  const { totalUnreadMessages } = useMessageNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const supabase = createSupabaseClient()
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing all notifications:', error)
        return
      }

      setNotifications([])
      
      addToast({
        type: 'success',
        title: 'Notifications cleared',
        message: 'All notifications have been removed',
        duration: 3000
      })
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }

  // Helper function to create test notifications (for development)
  const createTestNotification = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const testNotifications = [
        {
          user_id: user.id,
          type: 'profile_access_request',
          title: 'New Profile Access Request',
          message: 'A reader wants to access your premium content',
          read: false
        },
        {
          user_id: user.id,
          type: 'follow',
          title: 'New Follower',
          message: 'Alex Chen started following you',
          read: false
        },
        {
          user_id: user.id,
          type: 'project_comment',
          title: 'New Comment',
          message: 'Someone commented on "The Last Chronicle"',
          read: false
        }
      ]

      const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)]
      
      const { error } = await supabase
        .from('notifications')
        .insert([randomNotification])

      if (error) {
        console.error('Error creating test notification:', error)
      }
    } catch (error) {
      console.error('Error creating test notification:', error)
    }
  }

  useEffect(() => {
    loadNotifications()

    // Set up real-time subscription for new notifications
    const supabase = createSupabaseClient()
    
    // Get current user first, then set up subscription
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const channel = supabase
          .channel('notifications')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
              const newNotification = payload.new as Notification
              setNotifications(prev => [newNotification, ...prev])
              
              // Show toast for new notifications
              const getToastType = (type: string) => {
                switch (type) {
                  case 'profile_access_approved':
                    return 'success'
                  case 'profile_access_denied':
                    return 'warning'
                  default:
                    return 'info'
                }
              }

              addToast({
                type: getToastType(newNotification.type),
                title: newNotification.title,
                message: newNotification.message,
                duration: 7000
              })
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    })
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length
  const totalNotifications = unreadCount + totalUnreadMessages

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'profile_access_request':
        return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'profile_access_granted':
        return <Check className="w-4 h-4 text-green-500" />
      case 'profile_access_denied':
        return <X className="w-4 h-4 text-red-500" />
      case 'follow':
        return <UserPlus className="w-4 h-4 text-purple-500" />
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'project_comment':
        return <MessageCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="relative z-[100000]" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 transition-colors"
        onDoubleClick={createTestNotification} // Double-click to create test notification
        title={totalNotifications > 0 ? `${totalNotifications} unread notifications` : 'No new notifications'}
      >
        <Bell className={`w-5 h-5 ${totalNotifications > 0 ? 'text-orange-600' : 'text-gray-600'} transition-colors`} />
        {totalNotifications > 0 && (
          <>
            {/* Notification Badge */}
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-500 animate-pulse"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
            {/* Pulse Animation Ring */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full animate-ping opacity-75"></div>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[99999]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {totalNotifications > 0 && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {totalNotifications} new
                  </Badge>
                )}
              </h3>
              <div className="flex items-center justify-between">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs px-2 py-1 h-7"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Read all
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Message Notifications Section */}
            {totalUnreadMessages > 0 && (
              <>
                <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700 flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Messages ({totalUnreadMessages})</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/app/messages'
                        setIsOpen(false)
                      }}
                      className="text-xs px-2 py-1 h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    >
                      View all
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-purple-25 border-b border-gray-200">
                  <p className="text-sm text-purple-600">
                    You have {totalUnreadMessages} unread message{totalUnreadMessages > 1 ? 's' : ''} waiting for you.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/app/messages'
                      setIsOpen(false)
                    }}
                    className="mt-2 text-xs px-3 py-1 h-7 text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Open Messages
                  </Button>
                </div>
              </>
            )}

            {/* Regular Notifications */}
            {notifications.length === 0 && totalUnreadMessages === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    // Handle notification clicks based on type
                    if (notification.type === 'profile_access_request') {
                      // Navigate to settings page
                      window.location.href = '/app/settings?tab=privacy'
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {totalNotifications > 0 
                  ? `${notifications.length} notification${notifications.length === 1 ? '' : 's'}${totalUnreadMessages > 0 ? `, ${totalUnreadMessages} message${totalUnreadMessages === 1 ? '' : 's'}` : ''}`
                  : 'No notifications'
                }
              </div>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs px-3 py-1 h-7"
                      >
                        <CheckCheck className="w-3 h-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs px-3 py-1 h-7 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear all
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs px-3 py-1 h-7"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
