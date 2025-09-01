-- Fix messaging RPC functions and ensure they work correctly

-- Drop and recreate the RPC function with better error handling
DROP FUNCTION IF EXISTS get_or_create_direct_conversation(UUID);

CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Validate input
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  IF other_user_id IS NULL THEN
    RAISE EXCEPTION 'Other user ID cannot be null';
  END IF;
  
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Check if conversation already exists between these two users
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
  ) = 2
  LIMIT 1;
  
  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    -- Create the conversation
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

-- Update mark_messages_read function with better error handling
DROP FUNCTION IF EXISTS mark_messages_read(UUID);

CREATE OR REPLACE FUNCTION mark_messages_read(conversation_id UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  IF conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation ID cannot be null';
  END IF;
  
  -- Verify user is participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = mark_messages_read.conversation_id 
    AND conversation_participants.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  -- Update last read timestamp
  UPDATE public.conversation_participants 
  SET last_read_at = NOW()
  WHERE conversation_participants.conversation_id = mark_messages_read.conversation_id 
  AND conversation_participants.user_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_or_create_direct_conversation(UUID) IS 'Creates a new direct conversation between the current user and another user, or returns existing conversation ID';
COMMENT ON FUNCTION mark_messages_read(UUID) IS 'Marks all messages in a conversation as read for the current user';
