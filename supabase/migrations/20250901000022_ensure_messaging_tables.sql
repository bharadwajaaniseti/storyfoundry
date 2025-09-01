-- Ensure messaging tables exist with correct structure
-- This migration will create the tables if they don't exist

-- Check if conversations table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        CREATE TABLE public.conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT,
          type TEXT CHECK (type IN ('direct', 'group')) NOT NULL DEFAULT 'direct',
          created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
        CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);
        
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "conversations_select_participant" ON public.conversations
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.conversation_participants 
              WHERE conversation_participants.conversation_id = conversations.id 
              AND conversation_participants.user_id = auth.uid()
            )
          );

        CREATE POLICY "conversations_insert_own" ON public.conversations
          FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;
END
$$;

-- Check if conversation_participants table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants') THEN
        CREATE TABLE public.conversation_participants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          last_read_at TIMESTAMPTZ DEFAULT NOW(),
          is_admin BOOLEAN DEFAULT FALSE,
          UNIQUE(conversation_id, user_id)
        );
        
        CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
        CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
        
        ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "conversation_participants_select_member" ON public.conversation_participants
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.conversation_participants cp
              WHERE cp.conversation_id = conversation_participants.conversation_id 
              AND cp.user_id = auth.uid()
            )
          );

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

        CREATE POLICY "conversation_participants_update_own" ON public.conversation_participants
          FOR UPDATE USING (user_id = auth.uid());

        CREATE POLICY "conversation_participants_delete_own" ON public.conversation_participants
          FOR DELETE USING (
            user_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.conversations c
              WHERE c.id = conversation_participants.conversation_id 
              AND c.created_by = auth.uid()
            )
          );
    END IF;
END
$$;

-- Check if messages table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        CREATE TABLE public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
          sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
          content TEXT NOT NULL,
          message_type TEXT CHECK (message_type IN ('text', 'system')) DEFAULT 'text',
          edited_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
        CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
        CREATE INDEX idx_messages_created_at ON public.messages(created_at);
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "messages_select_participant" ON public.messages
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.conversation_participants 
              WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
            )
          );

        CREATE POLICY "messages_insert_participant" ON public.messages
          FOR INSERT WITH CHECK (
            sender_id = auth.uid() AND
            EXISTS (
              SELECT 1 FROM public.conversation_participants 
              WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
            )
          );

        CREATE POLICY "messages_update_own" ON public.messages
          FOR UPDATE USING (sender_id = auth.uid());

        CREATE POLICY "messages_delete_own" ON public.messages
          FOR DELETE USING (sender_id = auth.uid());
    END IF;
END
$$;
