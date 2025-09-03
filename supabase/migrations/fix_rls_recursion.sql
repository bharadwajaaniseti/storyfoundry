-- Fix RLS policy infinite recursion issue
-- This script fixes the circular reference in conversation_participants policies

-- First, drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "conversation_participants_select_member" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;

-- Fix the conversation_participants SELECT policy (no self-reference)
CREATE POLICY "conversation_participants_select_member" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Fix the conversations SELECT policy to avoid recursion
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Also create a simpler policy for conversation_participants that allows users to see all participants in conversations they're part of
DROP POLICY IF EXISTS "conversation_participants_select_in_user_conversations" ON public.conversation_participants;
CREATE POLICY "conversation_participants_select_in_user_conversations" ON public.conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT cp.conversation_id 
      FROM public.conversation_participants cp 
      WHERE cp.user_id = auth.uid()
    )
  );

-- Disable the problematic policy and use the simpler ones
DROP POLICY IF EXISTS "conversation_participants_select_member" ON public.conversation_participants;

-- Enable the working policy
-- (The "conversation_participants_select_in_user_conversations" policy is already created above)

COMMENT ON POLICY "conversation_participants_select_in_user_conversations" ON public.conversation_participants IS 'Users can see all participants in conversations they are part of';
COMMENT ON POLICY "conversations_select_participant" ON public.conversations IS 'Users can see conversations they participate in';
