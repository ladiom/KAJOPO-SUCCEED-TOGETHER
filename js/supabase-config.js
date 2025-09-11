// Supabase Configuration
const SUPABASE_URL = 'https://wklvqccyzmwmnfalqnik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHZxY2N5em13bW5mYWxxbmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjMxMDEsImV4cCI6MjA3MjMzOTEwMX0.hUpVVt0LVy_BiSa5H1odymJCW2Id0VfBytuARKZ4hYo';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbHZxY2N5em13bW5mYWxxbmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2MzEwMSwiZXhwIjoyMDcyMzM5MTAxfQ.XUNKfQ9LqH8Mj4tAhXDG0iKLp9ziCMd--Zks6eU7tQs';

// Initialize Supabase client when the library is available
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Export for use in other files
        window.supabaseClient = supabaseClient;
        window.supabaseConfig = {
            url: SUPABASE_URL,
            anonKey: SUPABASE_ANON_KEY,
            serviceKey: SUPABASE_SERVICE_KEY
        };
        
        console.log('Supabase initialized successfully');
        return true;
    } else {
        console.warn('Supabase library not yet loaded, retrying...');
        return false;
    }
}

// Try to initialize immediately, or wait for DOM ready
if (!initializeSupabase()) {
    document.addEventListener('DOMContentLoaded', function() {
        // Retry initialization with a small delay
        setTimeout(() => {
            if (!initializeSupabase()) {
                console.error('Failed to initialize Supabase - library may not be loaded');
            }
        }, 100);
    });
}