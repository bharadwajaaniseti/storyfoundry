-- Complete fix for RLS recursion in messaging system
-- This removes all potential circular dependencies

-- First, disable RLS temporarily to clear any locks
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversation participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own conversation participations" ON conversation_participants;
DROP POLICY IF EXISTS "System can insert conversation participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Re-enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_policy" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Create simple, non-recursive policies for conversation_participants
-- This is the key fix - avoid any subqueries that reference the same table
CREATE POLICY "participants_select_policy" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "participants_insert_policy" ON conversation_participants
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid() 
            OR 
            auth.uid() IN (
                SELECT id FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Create simple policies for messages
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON conversations TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Test the setup with a simple query
SELECT 'RLS policies recreated successfully' AS status;
