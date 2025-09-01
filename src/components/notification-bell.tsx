'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  X, 
  UserPlus,
  MessageCircle,
  Clock
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      case 'project_comment':
        return <MessageCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
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

          <div className="p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full text-sm"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
