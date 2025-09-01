'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Send,
  Search,
  Users,
  MessageCircle,
  MoreHorizontal,
  ArrowLeft,
  Plus,
  Check,
  CheckCheck,
  Clock,
  UserPlus
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/auth'
import UserAvatar from '@/components/user-avatar'

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: string
}

interface FollowingUser {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: string
  bio: string | null
}

interface Conversation {
  id: string
  title: string | null
  type: 'direct' | 'group'
  created_at: string
  updated_at: string
  participants: Profile[]
  last_message?: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'system'
  created_at: string
  edited_at: string | null
  sender: Profile
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showMobileConversations, setShowMobileConversations] = useState(true)

  useEffect(() => {
    loadCurrentUser()
    loadConversations()
  }, [])

  useEffect(() => {
    // Load following users if no conversations
    if (conversations.length === 0 && !isLoading) {
      loadFollowingUsers()
    }
  }, [conversations, isLoading])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id)
      // Mark messages as read after a short delay to ensure messages are loaded
      setTimeout(() => {
        markMessagesAsRead(activeConversation.id)
      }, 1000)
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time subscriptions
  useEffect(() => {
    const supabase = createSupabaseClient()

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        console.log('🔔 New message received:', payload.new)
        const newMessage = payload.new as any
        
        // If the message is for the current active conversation, reload messages immediately
        if (activeConversation && newMessage.conversation_id === activeConversation.id) {
          console.log('📨 Reloading messages for active conversation')
          await loadMessages(activeConversation.id)
          scrollToBottom()
        }
        
        // Always update conversation list to refresh unread counts
        console.log('🔄 Updating conversation list')
        await loadConversations()
      })
      .subscribe()

    // Subscribe to conversation updates
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, async () => {
        console.log('🔄 Conversation updated, reloading list')
        await loadConversations()
      })
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
      conversationsSubscription.unsubscribe()
    }
  }, [activeConversation?.id]) // Only depend on conversation ID to avoid unnecessary re-subscriptions

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadCurrentUser = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role')
        .eq('id', user.id)
        .single()

      setCurrentUser(profile)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadFollowingUsers = async () => {
    if (!currentUser) return
    
    setIsLoadingFollowing(true)
    try {
      console.log('👥 Loading following users for:', currentUser.id)
      const supabase = createSupabaseClient()

      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          profiles!user_follows_following_id_fkey (
            id,
            display_name,
            avatar_url,
            role,
            bio
          )
        `)
        .eq('follower_id', currentUser.id)

      if (followsError) {
        console.error('❌ Error loading following users:', followsError)
        return
      }

      console.log('📋 Raw follows data:', followsData)

      if (followsData) {
        const following = followsData.map((follow: any) => follow.profiles).filter(Boolean)
        console.log('✅ Processed following users:', following)
        setFollowingUsers(following)
      }
    } catch (error) {
      console.error('❌ Error in loadFollowingUsers:', error)
    } finally {
      setIsLoadingFollowing(false)
    }
  }

  const loadConversations = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      console.log('🔍 Loading conversations for user:', user.id)

      // First, check if the conversation_participants table exists and is accessible
      const { data: testQuery, error: testError } = await supabase
        .from('conversation_participants')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Conversation participants table not accessible:', testError)
        console.error('❌ Error details:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        })
        
        // Try to check if any messaging tables exist
        console.log('🔍 Checking if conversations table exists...')
        const { data: conversationsTest, error: conversationsTestError } = await supabase
          .from('conversations')
          .select('id')
          .limit(1)
          
        if (conversationsTestError) {
          console.error('❌ Conversations table also not accessible:', conversationsTestError)
        } else {
          console.log('✅ Conversations table exists')
        }
        
        // For now, still show the following users functionality
        setConversations([])
        setIsLoading(false)
        return
      }

      console.log('✅ Conversation participants table is accessible')

      // Get conversations the user participates in
      const { data: userParticipations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (participationError) {
        console.error('❌ Error loading user participations:', participationError)
        setConversations([])
        setIsLoading(false)
        return
      }

      if (!userParticipations || userParticipations.length === 0) {
        console.log('📭 No conversations found for user')
        setConversations([])
        setIsLoading(false)
        return
      }

      const conversationIds = userParticipations.map(p => p.conversation_id)
      console.log('📋 Found conversation IDs:', conversationIds)

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, title, type, created_at, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (conversationsError) {
        console.error('❌ Error loading conversations:', conversationsError)
        setConversations([])
        setIsLoading(false)
        return
      }

      console.log('💬 Raw conversations data:', conversationsData)

      if (!conversationsData) {
        setConversations([])
        setIsLoading(false)
        return
      }

      // Process each conversation to get participants and last message
      const processedConversations = await Promise.all(
        conversationsData.map(async (conv: any) => {
          try {
            // Get all participants for this conversation
            const { data: participantsData } = await supabase
              .from('conversation_participants')
              .select(`
                user_id,
                last_read_at,
                profiles (
                  id,
                  display_name,
                  avatar_url,
                  role
                )
              `)
              .eq('conversation_id', conv.id)

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)

            // Get user's participant info for unread count
            const userParticipant = participantsData?.find(p => p.user_id === user.id)
            const lastReadAt = userParticipant?.last_read_at || new Date().toISOString()

            // Get unread count
            const { data: unreadMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', conv.id)
              .gt('created_at', lastReadAt)
              .neq('sender_id', user.id)

            return {
              id: conv.id,
              title: conv.title,
              type: conv.type,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              participants: participantsData?.map((p: any) => p.profiles).filter(Boolean) || [],
              last_message: lastMessageData?.[0] || null,
              unread_count: unreadMessages?.length || 0
            }
          } catch (error) {
            console.error('❌ Error processing conversation:', conv.id, error)
            return {
              id: conv.id,
              title: conv.title,
              type: conv.type,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              participants: [],
              last_message: null,
              unread_count: 0
            }
          }
        })
      )

      console.log('✅ Processed conversations:', processedConversations)
      setConversations(processedConversations)
    } catch (error) {
      console.error('❌ Error in loadConversations:', error)
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📥 Loading messages for conversation:', conversationId)
      const supabase = createSupabaseClient()

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          created_at,
          edited_at,
          profiles!messages_sender_id_fkey (
            id,
            display_name,
            avatar_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error loading messages:', error)
        return
      }

      if (messagesData) {
        const processedMessages = messagesData.map((msg: any) => ({
          ...msg,
          sender: msg.profiles
        }))
        console.log('✅ Loaded messages:', processedMessages.length)
        setMessages(processedMessages)
        
        // Auto-scroll to bottom after loading messages
        setTimeout(() => scrollToBottom(), 100)
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      console.log('📖 Marking messages as read for conversation:', conversationId)
      const supabase = createSupabaseClient()
      
      // Update the last_read_at timestamp for this user in this conversation
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser?.id)

      if (error) {
        console.error('❌ Error marking messages as read:', error)
        return
      }

      console.log('✅ Messages marked as read')
      
      // Immediately update the conversation list to reflect the read status
      await loadConversations()
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX
    
    try {
      console.log('📤 Sending message:', messageContent)
      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: currentUser.id,
          content: messageContent,
          message_type: 'text'
        })
        .select()

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }

      console.log('✅ Message sent successfully:', data)
      
      // Immediately reload messages to show the new message
      await loadMessages(activeConversation.id)
      scrollToBottom()
      
      // Update conversation list to refresh unread counts and last message
      await loadConversations()
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Restore the message if sending failed
      setNewMessage(messageContent)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const startConversationWithUser = async (user: FollowingUser) => {
    if (!currentUser) return

    try {
      console.log('🚀 Starting conversation with user:', user.display_name, user.id)
      const supabase = createSupabaseClient()

      // First check if RPC function exists
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_direct_conversation', { other_user_id: user.id })

      if (convError) {
        console.error('❌ Error creating conversation:', convError)
        console.error('❌ RPC Error details:', {
          code: convError.code,
          message: convError.message,
          details: convError.details,
          hint: convError.hint
        })
        
        // Show a user-friendly message
        alert(`Unable to start conversation with ${user.display_name}. The messaging system may not be fully set up yet.`)
        return
      }

      console.log('✅ Conversation created/found:', conversationId)

      // Reload conversations to include the new one
      await loadConversations()

      // Find the conversation in our state
      setTimeout(() => {
        const existingConversation = conversations.find((conv: Conversation) => conv.id === conversationId)
        if (existingConversation) {
          console.log('✅ Setting active conversation:', existingConversation)
          setActiveConversation(existingConversation)
          setShowMobileConversations(false)
        } else {
          console.log('⚠️ Conversation not found in state, reloading...')
          // If not found immediately, try again after a short delay
          setTimeout(async () => {
            await loadConversations()
            const retryConversation = conversations.find((conv: Conversation) => conv.id === conversationId)
            if (retryConversation) {
              setActiveConversation(retryConversation)
              setShowMobileConversations(false)
            }
          }, 1000)
        }
      }, 500)
    } catch (error) {
      console.error('❌ Error starting conversation:', error)
      alert(`Unable to start conversation with ${user.display_name}. Please try again later.`)
    }
  }

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title
    
    if (conversation.type === 'direct' && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id)
      return otherParticipant?.display_name || 'Unknown User'
    }
    
    return `Group (${conversation.participants.length} members)`
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct' && currentUser) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id)
      return otherParticipant?.avatar_url
    }
    return null
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    getConversationTitle(conv).toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col ${
          !showMobileConversations && activeConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4">
                {conversations.length === 0 ? (
                  <div>
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No conversations yet</h3>
                      <p className="text-gray-600 mb-6">Start messaging people you follow</p>
                    </div>

                    {/* Following Users */}
                    {isLoadingFollowing ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading your following...</p>
                      </div>
                    ) : followingUsers.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 px-2">People you follow</h4>
                        <div className="space-y-1">
                          {followingUsers.slice(0, 8).map((user) => (
                            <button
                              key={user.id}
                              onClick={() => startConversationWithUser(user)}
                              className="w-full p-3 rounded-lg text-left transition-colors hover:bg-gray-50 group"
                            >
                              <div className="flex items-center space-x-3">
                                <UserAvatar
                                  user={{
                                    avatar_url: user.avatar_url,
                                    display_name: user.display_name
                                  }}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-medium text-gray-800 truncate transition-colors ${
                                    user.role === 'writer'
                                      ? 'group-hover:text-orange-600'
                                      : 'group-hover:text-purple-600'
                                  }`}>
                                    {user.display_name || 'Unknown User'}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                                      user.role === 'writer' 
                                        ? 'bg-orange-100 text-orange-600' 
                                        : 'bg-purple-100 text-purple-600'
                                    }`}>
                                      {user.role}
                                    </span>
                                    {user.bio && (
                                      <p className="text-sm text-gray-600 truncate flex-1">
                                        {user.bio}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <MessageCircle className={`w-4 h-4 transition-colors ${
                                  user.role === 'writer'
                                    ? 'text-gray-400 group-hover:text-orange-500'
                                    : 'text-gray-400 group-hover:text-purple-500'
                                }`} />
                              </div>
                            </button>
                          ))}
                        </div>
                        {followingUsers.length > 8 && (
                          <div className="text-center mt-4">
                            <p className="text-sm text-gray-500">
                              And {followingUsers.length - 8} more...
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-800 mb-2">No one to message yet</h4>
                        <p className="text-gray-600 mb-4">Follow some writers or readers to start conversations</p>
                        <Link
                          href="/app/search"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          <span>Discover People</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No matching conversations</h3>
                    <p className="text-gray-600">Try a different search term</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setActiveConversation(conversation)
                      setShowMobileConversations(false)
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeConversation?.id === conversation.id
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar
                        user={{
                          avatar_url: getConversationAvatar(conversation),
                          display_name: getConversationTitle(conversation)
                        }}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-800 truncate">
                            {getConversationTitle(conversation)}
                          </h3>
                          {conversation.unread_count > 0 && (
                            <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.last_message.content}
                            </p>
                            <span className="text-xs text-gray-400 ml-2">
                              {formatMessageTime(conversation.last_message.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${
          showMobileConversations && !activeConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowMobileConversations(true)}
                    className="md:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <UserAvatar
                    user={{
                      avatar_url: getConversationAvatar(activeConversation),
                      display_name: getConversationTitle(activeConversation)
                    }}
                    size="sm"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {getConversationTitle(activeConversation)}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {activeConversation.type === 'direct' ? 'Direct message' : `${activeConversation.participants.length} members`}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUser?.id
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {showAvatar && !isOwn && (
                          <UserAvatar
                            user={{
                              avatar_url: message.sender.avatar_url,
                              display_name: message.sender.display_name || 'Unknown'
                            }}
                            size="sm"
                          />
                        )}
                        {!showAvatar && !isOwn && <div className="w-8" />}
                        
                        <div className={`rounded-lg px-3 py-2 ${
                          isOwn 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {message.sender.display_name || 'Unknown'}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-orange-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-800 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
