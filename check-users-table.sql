-- Check the actual structure of the users table
-- Run this first to see what columns exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

