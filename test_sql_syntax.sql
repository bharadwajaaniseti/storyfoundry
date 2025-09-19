-- Quick SQL syntax verification test
-- This is a simplified version to test the basic syntax

-- Test table creation
CREATE TABLE IF NOT EXISTS test_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Test policy creation with proper existence check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_table' AND policyname = 'test_policy') THEN
        CREATE POLICY "test_policy" ON public.test_table
          FOR SELECT USING (true);
    END IF;
END $$;

-- Clean up
DROP TABLE IF EXISTS test_table;

SELECT 'SQL syntax test passed!' as result;