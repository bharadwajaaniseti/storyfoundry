import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/auth-client'

export interface MessageNotification {
  id: string
  conversation_id: string
  sender_name: string
  sender_avatar?: string
  message_preview: string
  unread_count: number
  last_message_at: string
}

export const useMessageNotifications = () => {
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([])
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadMessageNotifications = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Get conversations with unread messages
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          type,
          updated_at,
          conversation_participants!inner (
            user_id,
            last_read_at
          )
        `)
        .eq('conversation_participants.user_id', user.id)

      if (error) {
        console.error('Error loading message notifications:', error)
        setIsLoading(false)
        return
      }

      if (!conversations) {
        setIsLoading(false)
        return
      }

      // Process each conversation to get unread count and latest message
      const notifications: MessageNotification[] = []
      let totalUnread = 0

      for (const conv of conversations) {
        const userParticipant = conv.conversation_participants.find(p => p.user_id === user.id)
        const lastReadAt = userParticipant?.last_read_at || new Date().toISOString()

        // Get unread messages count
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id, sender_id')
          .eq('conversation_id', conv.id)
          .gt('created_at', lastReadAt)
          .neq('sender_id', user.id)

        const unreadCount = unreadMessages?.length || 0

        if (unreadCount > 0) {
          // Get the latest message for preview
          const { data: latestMessage } = await supabase
            .from('messages')
            .select(`
              content,
              created_at,
              profiles!messages_sender_id_fkey (
                display_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (latestMessage) {
            const sender = Array.isArray(latestMessage.profiles) ? latestMessage.profiles[0] : latestMessage.profiles
            
            notifications.push({
              id: conv.id,
              conversation_id: conv.id,
              sender_name: sender?.display_name || 'Unknown',
              sender_avatar: sender?.avatar_url,
              message_preview: latestMessage.content.substring(0, 50) + (latestMessage.content.length > 50 ? '...' : ''),
              unread_count: unreadCount,
              last_message_at: latestMessage.created_at
            })

            totalUnread += unreadCount
          }
        }
      }

      // Sort by most recent message
      notifications.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

      setMessageNotifications(notifications)
      setTotalUnreadMessages(totalUnread)
    } catch (error) {
      console.error('Error loading message notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessageNotifications()

    // Set up real-time subscription for new messages
    const supabase = createSupabaseClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const channel = supabase
          .channel('message-notifications')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          }, async (payload) => {
            const newMessage = payload.new as any
            
            // Check if this message is for a conversation the user is part of
            const { data: participant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', newMessage.conversation_id)
              .eq('user_id', user.id)
              .single()

            // Only reload if the user is part of this conversation and didn't send the message
            if (participant && newMessage.sender_id !== user.id) {
              console.log('🔔 New message notification detected, reloading...')
              await loadMessageNotifications()
            }
          })
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    })
  }, [])

  return {
    messageNotifications,
    totalUnreadMessages,
    isLoading,
    refresh: loadMessageNotifications
  }
}
