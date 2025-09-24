-- Migration script to update users table structure
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. BACKUP EXISTING DATA (Optional but recommended)
-- ==============================================

-- Create a backup table with current data
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users;

-- ==============================================
-- 2. DROP EXISTING CONSTRAINTS AND POLICIES
-- ==============================================

-- Drop existing foreign key constraints that reference users table
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_provider_id;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS fk_applications_seeker_id;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_participant_1;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_participant_2;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender_id;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Providers can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view relevant applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- ==============================================
-- 3. CREATE NEW USERS TABLE STRUCTURE
-- ==============================================

-- Drop the existing users table (this will remove all data!)
-- WARNING: This will delete all existing user data
DROP TABLE IF EXISTS users CASCADE;

-- Create the new users table with updated structure
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar UNIQUE NOT NULL,
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    account_type varchar NOT NULL CHECK (account_type IN ('seeker', 'provider', 'hybrid', 'admin')),
    organization_name varchar,
    org_type varchar,
    years_in_business smallint,
    focus_areas text[],
    target_beneficiaries text[],
    registration_status varchar DEFAULT 'registered' CHECK (registration_status IN ('registered', 'pending', 'informal')),
    location varchar,
    languages text[],
    bio text,
    linkedin varchar,
    website varchar,
    preferred_languages text[],
    collaboration_interest text[],
    impact_metrics jsonb,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- 4. CREATE INDEXES
-- ==============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_registration_status ON users(registration_status);
CREATE INDEX idx_users_verified ON users(verified);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_org_type ON users(org_type);

-- ==============================================
-- 5. RECREATE FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Recreate foreign key constraints
ALTER TABLE opportunities 
ADD CONSTRAINT fk_opportunities_provider_id 
FOREIGN KEY (provider_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE applications 
ADD CONSTRAINT fk_applications_seeker_id 
FOREIGN KEY (seeker_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_participant_1 
FOREIGN KEY (participant_1) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_participant_2 
FOREIGN KEY (participant_2) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 7. CREATE RLS POLICIES
-- ==============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================
-- 8. CREATE UPDATED RLS POLICIES FOR OTHER TABLES
-- ==============================================

-- Opportunities policies
CREATE POLICY "Anyone can view opportunities" ON opportunities
    FOR SELECT USING (true);

CREATE POLICY "Providers can create opportunities" ON opportunities
    FOR INSERT WITH CHECK (
        auth.uid() = provider_id AND 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND account_type IN ('provider', 'hybrid'))
    );

CREATE POLICY "Providers can update own opportunities" ON opportunities
    FOR UPDATE USING (auth.uid() = provider_id);

-- Applications policies
CREATE POLICY "Users can view relevant applications" ON applications
    FOR SELECT USING (
        auth.uid() = seeker_id OR 
        EXISTS (
            SELECT 1 FROM opportunities 
            WHERE id = applications.opportunity_id AND provider_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = seeker_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- Messages policies
CREATE POLICY "Users can view conversation messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

-- ==============================================
-- 9. CREATE TRIGGER FOR UPDATED_AT
-- ==============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 10. VERIFY STRUCTURE
-- ==============================================

-- Verify the new table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

