/**
 * Supabase Mock Implementation
 * Fallback for when Supabase CDN sources fail to load
 */
(function() {
  // Create a global supabase object
  window.supabase = {
    createClient: function() {
      console.warn('Using mock Supabase client');
      
      // Return a mock client with methods that match Supabase's API
      return {
        from: function() {
          return {
            select: function() {
              // Return mock data for user stats
              return Promise.resolve({
                data: [
                  { accountType: 'seeker' },
                  { accountType: 'seeker' },
                  { accountType: 'seeker' },
                  { accountType: 'seeker' },
                  { accountType: 'provider' },
                  { accountType: 'provider' }
                ],
                error: null
              });
            },
            // Mock other methods
            insert: function() { return { data: null, error: null, select: function() { return Promise.resolve({ data: [], error: null }); } }; },
            update: function() { return Promise.resolve({ data: [], error: null }); },
            delete: function() { return Promise.resolve({ data: [], error: null }); }
          };
        },
        auth: {
          signInWithPassword: function() {
            return Promise.resolve({ data: null, error: { message: 'Authentication not available in mock mode' } });
          },
          signUp: function() {
            return Promise.resolve({ data: null, error: { message: 'Authentication not available in mock mode' } });
          },
          signOut: function() {
            return Promise.resolve({ data: null, error: null });
          },
          onAuthStateChange: function() { return function() { }; },
          getUser: function() {
            return Promise.resolve({ data: null, error: { message: 'No user in mock mode' } });
          }
        },
        storage: {
          from: function() {
            return {
              upload: function() { return Promise.resolve({ data: { Key: 'mock-key' }, error: null }); },
              getPublicUrl: function() { return { publicUrl: 'https://mock-url.com' }; }
            };
          }
        },
        rpc: function() { return Promise.resolve({ data: null, error: null }); }
      };
    }
  };

  // Mock some additional utility functions if needed
  if (!window.dbManager) {
    window.dbManager = {
      ensureInitialized: function() { return Promise.resolve(true); },
      getOpportunities: function() {
        return Promise.resolve({
          success: true,
          data: [
            {
              title: "Community Cleanup Event",
              organization: "Green Neighborhood Association",
              tags: ["Community", "Environment"],
              category: "Volunteer",
              type: "In-person",
              location: "Local Park",
              description: "Help us clean up our community park and make it beautiful for everyone.",
              deadline: "2023-12-31",
              duration: "3 hours"
            },
            {
              title: "Free Coding Workshop",
              organization: "Tech Education Initiative",
              tags: ["Education", "Technology"],
              category: "Learning",
              type: "Online",
              location: "Virtual",
              description: "Learn the basics of web development in this free workshop for beginners.",
              deadline: "2023-12-15",
              duration: "4 weeks"
            },
            {
              title: "Food Drive for Families in Need",
              organization: "Community Outreach Program",
              tags: ["Charity", "Community"],
              category: "Volunteer",
              type: "In-person",
              location: "Community Center",
              description: "Help collect and distribute food to families in our community who need assistance.",
              deadline: "2023-12-20",
              duration: "Ongoing"
            }
          ]
        });
      },
      getMatches: function() { return Promise.resolve({ success: true, data: [] }); },
      updateUserProfile: function() { return Promise.resolve({ success: true }); }
    };
  }

  // Mock authentication utilities
  if (!window.userAuth) {
    window.userAuth = {
      isAuthenticated: function() { return false; },
      getUserInfo: function() { return null; },
      signOut: function() { return Promise.resolve(); }
    };
  }

  console.log('Mock Supabase implementation loaded successfully');
})();

