-- Safe Migration script to update users table structure while preserving data
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CREATE NEW USERS TABLE WITH UPDATED STRUCTURE
-- ==============================================

CREATE TABLE users_new (
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
-- 2. MIGRATE EXISTING DATA
-- ==============================================

-- Insert existing users with field mapping
INSERT INTO users_new (
    id, email, first_name, last_name, account_type, organization_name, 
    org_type, years_in_business, focus_areas, target_beneficiaries,
    registration_status, location, languages, bio, linkedin, website,
    preferred_languages, collaboration_interest, impact_metrics, verified,
    created_at, updated_at
)
SELECT 
    id,
    email,
    COALESCE("firstName", '') as first_name,
    COALESCE("lastName", '') as last_name,
    COALESCE("accountType", 'seeker') as account_type,
    COALESCE(organization, '') as organization_name,
    '' as org_type, -- New field, empty for existing users
    CASE 
        WHEN experience = '0-1' THEN 1
        WHEN experience = '2-5' THEN 3
        WHEN experience = '6-10' THEN 8
        WHEN experience = '11-15' THEN 13
        WHEN experience = '15+' THEN 15
        ELSE 0
    END as years_in_business,
    CASE 
        WHEN interests IS NOT NULL AND jsonb_typeof(interests) = 'array' THEN 
            ARRAY(SELECT jsonb_array_elements_text(interests))
        WHEN interests IS NOT NULL AND jsonb_typeof(interests) = 'string' THEN 
            ARRAY[interests::text]
        ELSE ARRAY[]::text[]
    END as focus_areas,
    ARRAY[]::text[] as target_beneficiaries, -- New field, empty for existing users
    'registered' as registration_status,
    COALESCE(location, '') as location,
    CASE 
        WHEN languages IS NOT NULL THEN string_to_array(languages, ',')
        ELSE ARRAY[]::text[]
    END as languages,
    COALESCE(bio, '') as bio,
    '' as linkedin, -- New field, empty for existing users
    '' as website, -- New field, empty for existing users
    ARRAY[]::text[] as preferred_languages, -- New field, empty for existing users
    ARRAY[]::text[] as collaboration_interest, -- New field, empty for existing users
    NULL as impact_metrics, -- New field, empty for existing users
    COALESCE("isverified", false) as verified,
    COALESCE("created_at", now()) as created_at,
    COALESCE("updated_at", now()) as updated_at
FROM users;

-- ==============================================
-- 3. CREATE INDEXES ON NEW TABLE
-- ==============================================

CREATE INDEX idx_users_new_email ON users_new(email);
CREATE INDEX idx_users_new_account_type ON users_new(account_type);
CREATE INDEX idx_users_new_registration_status ON users_new(registration_status);
CREATE INDEX idx_users_new_verified ON users_new(verified);
CREATE INDEX idx_users_new_location ON users_new(location);
CREATE INDEX idx_users_new_org_type ON users_new(org_type);

-- ==============================================
-- 4. DROP EXISTING CONSTRAINTS AND POLICIES
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
-- 5. DROP OLD USERS TABLE AND RENAME NEW ONE
-- ==============================================

-- Drop the old users table
DROP TABLE IF EXISTS users CASCADE;

-- Rename the new table to users
ALTER TABLE users_new RENAME TO users;

-- ==============================================
-- 6. RECREATE FOREIGN KEY CONSTRAINTS
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
-- 7. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 8. CREATE RLS POLICIES
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
-- 9. CREATE UPDATED RLS POLICIES FOR OTHER TABLES
-- ==============================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view opportunities" ON opportunities;
DROP POLICY IF EXISTS "Providers can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Providers can update own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can view relevant applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

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
-- 10. CREATE TRIGGER FOR UPDATED_AT
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
-- 11. VERIFY MIGRATION
-- ==============================================

-- Check that all users were migrated
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN account_type = 'seeker' THEN 1 END) as seekers,
    COUNT(CASE WHEN account_type = 'provider' THEN 1 END) as providers,
    COUNT(CASE WHEN account_type = 'admin' THEN 1 END) as admins
FROM users;

-- Verify the new table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
