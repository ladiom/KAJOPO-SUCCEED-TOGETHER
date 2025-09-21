-- Fix RLS policies to allow admin dashboard to see all users
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. DROP ALL EXISTING POLICIES
-- ==============================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- ==============================================
-- 2. CREATE NEW ADMIN-FRIENDLY POLICIES
-- ==============================================

-- Allow authenticated users to read all user data (for admin dashboard)
CREATE POLICY "Authenticated users can view all users" ON users
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow anonymous users to insert during registration
CREATE POLICY "Allow user registration" ON users
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- ==============================================
-- 3. ALTERNATIVE: MORE SECURE ADMIN-ONLY POLICY
-- ==============================================

-- If you want more security, you can use this instead of the above:
-- (Comment out the "Authenticated users can view all users" policy above first)

-- CREATE POLICY "Admins can view all users" ON users
--     FOR SELECT 
--     TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM users 
--             WHERE id = auth.uid() 
--             AND (account_type = 'admin' OR "accountType" = 'admin')
--         )
--     );

-- ==============================================
-- 4. VERIFY THE CHANGES
-- ==============================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Test the query that the admin dashboard uses
SELECT COUNT(*) as total_users FROM users;
