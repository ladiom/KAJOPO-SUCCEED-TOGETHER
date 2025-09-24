-- Kájọpọ̀ Connect Database Relationships Setup (Safe Version)
-- This version handles existing constraints and policies gracefully

-- ==============================================
-- 1. DROP EXISTING POLICIES (if they exist)
-- ==============================================

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
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

-- ==============================================
-- 2. DROP EXISTING FOREIGN KEY CONSTRAINTS (if they exist)
-- ==============================================

-- Drop existing foreign key constraints to avoid conflicts
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_provider_id;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS fk_applications_seeker_id;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS fk_applications_opportunity_id;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_participant_1;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_participant_2;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender_id;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_conversation_id;

-- ==============================================
-- 3. CREATE FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key constraint: opportunities.provider_id → users.id
ALTER TABLE opportunities 
ADD CONSTRAINT fk_opportunities_provider_id 
FOREIGN KEY (provider_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: applications.seeker_id → users.id
ALTER TABLE applications 
ADD CONSTRAINT fk_applications_seeker_id 
FOREIGN KEY (seeker_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: applications.opportunity_id → opportunities.id
ALTER TABLE applications 
ADD CONSTRAINT fk_applications_opportunity_id 
FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: conversations.participant_1 → users.id
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_participant_1 
FOREIGN KEY (participant_1) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: conversations.participant_2 → users.id
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_participant_2 
FOREIGN KEY (participant_2) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: messages.sender_id → users.id
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint: messages.conversation_id → conversations.id
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_provider_id ON opportunities(provider_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Additional useful indexes
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users("accountType");

-- ==============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. CREATE RLS POLICIES
-- ==============================================

-- Users can read their own profile and update their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can read all opportunities
CREATE POLICY "Anyone can view opportunities" ON opportunities
    FOR SELECT USING (true);

-- Users can create opportunities if they are providers
CREATE POLICY "Providers can create opportunities" ON opportunities
    FOR INSERT WITH CHECK (
        auth.uid() = provider_id AND 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND "accountType" = 'provider')
    );

-- Users can update their own opportunities
CREATE POLICY "Providers can update own opportunities" ON opportunities
    FOR UPDATE USING (auth.uid() = provider_id);

-- Users can view applications for their opportunities or their own applications
CREATE POLICY "Users can view relevant applications" ON applications
    FOR SELECT USING (
        auth.uid() = seeker_id OR 
        EXISTS (
            SELECT 1 FROM opportunities 
            WHERE id = applications.opportunity_id AND provider_id = auth.uid()
        )
    );

-- Users can create applications
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = seeker_id);

-- Users can view conversations they participate in
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view conversation messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

-- Users can send messages in conversations they participate in
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
-- 7. VERIFY RELATIONSHIPS
-- ==============================================

-- Query to verify all foreign key relationships are working
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('opportunities', 'applications', 'conversations', 'messages')
ORDER BY tc.table_name, kcu.column_name;

