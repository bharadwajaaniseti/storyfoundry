'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Send, MessageCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import UserAvatar from '@/components/user-avatar'

interface SendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: {
    id: string
    display_name: string | null
    avatar_url: string | null
    role: string
  }
}

export default function SendMessageModal({ isOpen, onClose, recipient }: SendMessageModalProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const sendMessage = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      // Get or create conversation using the RPC function
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_direct_conversation', { other_user_id: recipient.id })

      if (convError) {
        console.error('Error creating conversation:', convError)
        return
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text'
        })

      if (messageError) {
        console.error('Error sending message:', messageError)
        return
      }

      // Create notification for recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: recipient.id,
          type: 'message',
          title: 'New message',
          message: `${user.user_metadata?.display_name || 'Someone'} sent you a message`,
          data: {
            sender_id: user.id,
            conversation_id: conversationId
          }
        })

      // Close modal and redirect to messages
      onClose()
      router.push('/app/messages')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">Send Message</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Recipient */}
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <UserAvatar
              user={{
                avatar_url: recipient.avatar_url,
                display_name: recipient.display_name
              }}
              size="sm"
            />
            <div>
              <h3 className="font-medium text-gray-800">
                {recipient.display_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-600 capitalize">{recipient.role}</p>
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
