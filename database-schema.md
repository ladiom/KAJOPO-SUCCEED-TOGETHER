# Database Schema Documentation

This document outlines the expected database schema for the Kájọpọ̀ Connect application based on the code analysis.

## Tables

### 1. users
**Purpose**: Store user profile information

**Columns**:
- `id` (UUID, Primary Key) - User ID from Supabase Auth
- `email` (VARCHAR) - User email address
- `firstName` (VARCHAR) - User's first name
- `lastName` (VARCHAR) - User's last name
- `name` (VARCHAR) - User's full name
- `accountType` (VARCHAR) - Type of user ('seeker', 'provider', or 'admin')
- `phone` (VARCHAR) - User's phone number
- `location` (VARCHAR) - User's location
- `organization` (VARCHAR) - User's organization/company
- `currentRole` (VARCHAR) - User's current role/position
- `experience` (TEXT) - User's experience level
- `skills` (TEXT) - User's skills and expertise
- `languages` (VARCHAR) - Languages spoken
- `interests` (JSONB) - User's areas of interest
- `bio` (TEXT) - User's biography
- `isverified` (BOOLEAN) - Email verification status
- `profilecomplete` (BOOLEAN) - Profile completion status
- `status` (VARCHAR) - User account status
- `created_at` (TIMESTAMP) - Account creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### 2. opportunities
**Purpose**: Store opportunity listings

**Columns**:
- `id` (UUID, Primary Key) - Unique opportunity identifier
- `title` (VARCHAR) - Opportunity title
- `organization` (VARCHAR) - Organization offering the opportunity
- `category` (VARCHAR) - Opportunity category (Healthcare, Education, Technology, etc.)
- `type` (VARCHAR) - Opportunity type ('Paid' or 'Volunteer')
- `location` (VARCHAR) - Location of the opportunity
- `description` (TEXT) - Detailed description
- `requirements` (TEXT/JSON) - Requirements for the opportunity
- `deadline` (DATE) - Application deadline
- `duration` (VARCHAR) - Duration of the opportunity
- `commitment` (VARCHAR) - Time commitment required
- `contact_email` (VARCHAR) - Contact email for applications
- `compensation` (VARCHAR) - Compensation details
- `provider_id` (UUID, Foreign Key) - References users.id
- `status` (VARCHAR) - Opportunity status ('active', 'closed', etc.)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### 3. applications
**Purpose**: Store job/opportunity applications

**Columns**:
- `id` (UUID, Primary Key) - Unique application identifier
- `opportunity_id` (UUID, Foreign Key) - References opportunities.id
- `seeker_id` (UUID, Foreign Key) - References users.id
- `status` (VARCHAR) - Application status ('pending', 'approved', 'rejected')
- `created_at` (TIMESTAMP) - Application submission timestamp
- Additional application data fields (varies based on form)

### 4. conversations
**Purpose**: Store conversation threads between users

**Columns**:
- `id` (UUID, Primary Key) - Unique conversation identifier
- `participant1` (UUID, Foreign Key) - References users.id (first participant)
- `participant2` (UUID, Foreign Key) - References users.id (second participant)
- `created_at` (TIMESTAMP) - Conversation creation timestamp
- `updated_at` (TIMESTAMP) - Last message timestamp

### 5. messages
**Purpose**: Store individual messages within conversations

**Columns**:
- `id` (UUID, Primary Key) - Unique message identifier
- `conversation_id` (UUID, Foreign Key) - References conversations.id
- `sender_id` (UUID, Foreign Key) - References users.id
- `content` (TEXT) - Message content
- `sent_at` (TIMESTAMP) - Message sent timestamp
- `read_at` (TIMESTAMP) - Message read timestamp (nullable)

## Relationships

1. **users → opportunities**: One-to-many (provider_id)
   - A user can create multiple opportunities

2. **users → applications**: One-to-many (seeker_id)
   - A user can submit multiple applications

3. **opportunities → applications**: One-to-many (opportunity_id)
   - An opportunity can have multiple applications

4. **users → conversations**: One-to-many (participant1, participant2)
   - A user can participate in multiple conversations
   - Each conversation has exactly two participants

5. **conversations → messages**: One-to-many (conversation_id)
   - A conversation can have multiple messages

6. **users → messages**: One-to-many (sender_id)
   - A user can send multiple messages

## Notes

- The application currently handles missing foreign key relationships gracefully by removing complex joins
- All timestamp fields use ISO string format
- The schema supports both paid and volunteer opportunities
- User authentication is handled by Supabase Auth, with additional profile data in the users table

## Database Setup

To set up the database:
1. Create the tables in Supabase with the above schema
2. Set up Row Level Security (RLS) policies as needed
3. Use the seed-database.html page to add sample data
4. Test connections using debug-console.html