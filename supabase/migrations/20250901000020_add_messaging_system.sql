-- Add comprehensive messaging system
-- This includes conversations, messages, and participant management

-- CONVERSATIONS
-- Represents a conversation between two or more users
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, -- Optional title for group conversations
  type TEXT CHECK (type IN ('direct', 'group')) NOT NULL DEFAULT 'direct',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATION PARTICIPANTS
-- Tracks who is part of each conversation
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

-- MESSAGES
-- Individual messages within conversations
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'system')) DEFAULT 'text',
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Add updated_at trigger for conversations
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update conversation updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can see conversations they participate in
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can create conversations
CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update conversations they created or are admin of
CREATE POLICY "conversations_update_own" ON public.conversations
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_admin = TRUE
    )
  );

-- RLS Policies for conversation_participants
-- Users can see participants in conversations they're part of
CREATE POLICY "conversation_participants_select_member" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Users can add participants to conversations they created or are admin of
CREATE POLICY "conversation_participants_insert_admin" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id 
      AND c.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
      AND cp.is_admin = TRUE
    )
  );

-- Users can update their own participant record
CREATE POLICY "conversation_participants_update_own" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Users can remove themselves from conversations
CREATE POLICY "conversation_participants_delete_own" ON public.conversation_participants
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id 
      AND c.created_by = auth.uid()
    )
  );

-- RLS Policies for messages
-- Users can see messages in conversations they participate in
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can send messages to conversations they participate in
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can update their own messages (for editing)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp1 
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp2 
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM public.conversation_participants cp 
    WHERE cp.conversation_id = c.id
  ) = 2;
  
  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (type, created_by)
    VALUES ('direct', current_user_id)
    RETURNING id INTO conversation_id;
    
    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, current_user_id),
      (conversation_id, other_user_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.conversation_participants 
  SET last_read_at = NOW()
  WHERE conversation_participants.conversation_id = mark_messages_read.conversation_id 
  AND conversation_participants.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    (SELECT COUNT(*) 
     FROM public.messages m 
     WHERE m.conversation_id = cp.conversation_id 
     AND m.created_at > cp.last_read_at
     AND m.sender_id != auth.uid())
  ), 0)::INTEGER INTO unread_count
  FROM public.conversation_participants cp
  WHERE cp.user_id = auth.uid();
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
