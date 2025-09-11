# Database Schema Documentation

This document outlines the expected database schema for the Kájọpọ̀ Connect application based on the code analysis.

## Tables

### 1. users
**Purpose**: Store user profile information

**Columns**:
- `id` (UUID, Primary Key) - User ID from Supabase Auth
- `email` (VARCHAR) - User email address
- `full_name` (VARCHAR) - User's full name
- `user_type` (VARCHAR) - Type of user ('seeker' or 'provider')
- `phone` (VARCHAR) - User's phone number
- `created_at` (TIMESTAMP) - Account creation timestamp

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

## Relationships

1. **users → opportunities**: One-to-many (provider_id)
   - A user can create multiple opportunities

2. **users → applications**: One-to-many (seeker_id)
   - A user can submit multiple applications

3. **opportunities → applications**: One-to-many (opportunity_id)
   - An opportunity can have multiple applications

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