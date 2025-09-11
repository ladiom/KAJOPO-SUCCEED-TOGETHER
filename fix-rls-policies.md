# Fix Row Level Security (RLS) Policies for Registration

## Problem
The registration is failing because Supabase Row Level Security (RLS) is enabled but no policies exist to allow user registration.

## Solution
You need to create RLS policies in your Supabase dashboard.

### Step 1: Create Policy for Users Table

1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Find the `users` table
4. Click "New Policy"
5. Create a policy with these settings:

**Policy Name:** `Allow user registration`
**Policy Type:** `INSERT`
**Target Roles:** `anon` (for anonymous users during registration)
**Policy Definition:**
```sql
true
```

### Step 2: Alternative - More Secure Policy

For better security, you can create a more restrictive policy:

**Policy Name:** `Allow authenticated user registration`
**Policy Type:** `INSERT`
**Target Roles:** `authenticated`
**Policy Definition:**
```sql
auth.uid() = id
```

### Step 3: Enable RLS Policies for Reading User Data

Create a SELECT policy:

**Policy Name:** `Users can read own data`
**Policy Type:** `SELECT`
**Target Roles:** `authenticated`
**Policy Definition:**
```sql
auth.uid() = id
```

### Step 4: Test the Registration

After creating these policies:
1. Try registering a new user
2. Check the browser console for any remaining errors
3. Verify the user appears in the users table

## Quick Fix Commands (Run in Supabase SQL Editor)

```sql
-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert during registration
CREATE POLICY "Allow user registration" ON users
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id::uuid);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id::uuid)
    WITH CHECK (auth.uid() = id::uuid);
```

## Notes
- The `anon` role is for unauthenticated users (during registration)
- The `authenticated` role is for logged-in users
- Make sure your user ID field matches the auth.uid() format (UUID)