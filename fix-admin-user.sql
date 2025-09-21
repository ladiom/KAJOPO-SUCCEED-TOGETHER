-- Fix admin user data
-- Run this in Supabase SQL Editor

-- Update admin user with proper name
UPDATE users 
SET 
    first_name = 'Admin',
    last_name = 'User',
    verified = true,
    registration_status = 'registered'
WHERE email = 'admin@admin.co' AND account_type = 'admin';

-- Verify the update
SELECT id, email, first_name, last_name, account_type, verified, registration_status
FROM users 
WHERE email = 'admin@admin.co';
