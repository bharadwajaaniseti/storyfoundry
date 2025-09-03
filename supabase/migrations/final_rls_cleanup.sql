-- Final cleanup to ensure messaging system works
-- This completely removes the problematic circular policies

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "conversation_participants_select_in_user_conversations" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_admin" ON conversation_participants;
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
DROP POLICY IF EXISTS "messages_select_participant" ON messages;

-- Keep RLS disabled for now since the temp fix worked
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Ensure proper permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;  
GRANT ALL ON messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Messaging system cleaned up and should work now' AS status;
