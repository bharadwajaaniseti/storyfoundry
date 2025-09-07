'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send, 
  User, 
  MessageSquare, 
  Pin,
  Reply,
  AlertCircle 
} from 'lucide-react'
import { useCollaborationMessages, useRealTimeCollaboration } from '@/hooks/useCollaboration'
import { CollaborationMessage, getRelativeTime } from '@/lib/collaboration-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CollaborationMessagesProps {
  projectId: string
}

export default function CollaborationMessages({ projectId }: CollaborationMessagesProps) {
  const { messages, loading, error, sendMessage } = useCollaborationMessages(projectId)
  const { subscribeToMessages } = useRealTimeCollaboration(projectId)
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState('general')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const channel = subscribeToMessages((message) => {
      // Real-time message updates would be handled here
      // For now, we'll rely on the hook's refresh mechanism
    })

    return () => {
      channel.unsubscribe()
    }
  }, [projectId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    try {
      setSending(true)
      await sendMessage({
        content: newMessage.trim(),
        message_type: messageType,
        parent_id: replyTo || undefined
      })
      setNewMessage('')
      setReplyTo(null)
      setMessageType('general')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleReply = (messageId: string) => {
    setReplyTo(messageId)
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800'
      case 'feedback':
        return 'bg-green-100 text-green-800'
      case 'question':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderMessage = (message: CollaborationMessage, isReply = false) => (
    <div 
      key={message.id} 
      className={`flex space-x-3 ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.sender?.avatar_url} />
        <AvatarFallback>
          <User className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm text-gray-800">
            {message.sender?.display_name || 'Unknown User'}
          </span>
          {message.sender?.verified_pro && (
            <Badge variant="outline" className="text-xs">
              Pro
            </Badge>
          )}
          <Badge className={`text-xs ${getMessageTypeColor(message.message_type)}`}>
            {message.message_type}
          </Badge>
          <span className="text-xs text-gray-500">
            {getRelativeTime(message.created_at)}
          </span>
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-orange-500" />
          )}
        </div>
        
        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
          {message.content}
        </p>

        {!isReply && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReply(message.id)}
              className="h-6 px-2 text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
        )}

        {/* Render replies */}
        {message.replies && message.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.replies.map((reply) => renderMessage(reply, true))}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Error loading messages: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Team Messages</span>
          <Badge variant="outline" className="text-xs">
            {messages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-800 mb-1">No messages yet</h3>
              <p className="text-xs text-gray-600">
                Start the conversation with your team
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => renderMessage(message))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Context */}
        {replyTo && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Replying to message</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex space-x-2">
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sending}
            />
            
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
