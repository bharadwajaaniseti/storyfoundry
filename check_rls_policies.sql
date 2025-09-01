-- Query to check current RLS policies and identify recursion issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;
