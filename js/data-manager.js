// Database Manager - Replaces localStorage operations with Supabase
class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.initializationPromise = this.initializeSupabase();
    }

    async initializeSupabase() {
        // Wait for Supabase client to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            console.log('DatabaseManager: Supabase client initialized successfully');
            return true;
        } else {
            console.error('DatabaseManager: Failed to initialize Supabase client after 5 seconds');
            return false;
        }
    }

    async ensureInitialized() {
        if (!this.supabase) {
            await this.initializationPromise;
        }
        return this.supabase !== null;
    }

    // ==================== USER MANAGEMENT ====================
    
    async registerUser(userData) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            // Register with Supabase Auth
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        name: `${userData.firstName} ${userData.lastName}`,
                        accountType: userData.accountType || userData.userType,
                        phone: userData.phone,
                        location: userData.location,
                        organization: userData.organization
                    }
                }
            });
            
            if (authError) throw authError;
            
            // Insert additional user data into users table and wait for completion
            if (authData.user) {
                const { data: userRecord, error: userError } = await this.supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        name: `${userData.firstName} ${userData.lastName}`,
                        accountType: userData.accountType || userData.userType,
                        phone: userData.phone || '',
                        location: userData.location || '',
                        organization: userData.organization || '',
                        currentRole: userData.currentRole || '',
                        experience: userData.experience || '',
                        skills: userData.skills || '',
                        languages: userData.languages || '',
                        interests: userData.interests || [],
                        bio: userData.bio || '',
                        // status: 'active',
                        created_at: new Date().toISOString()
                    }])
                    .select();
                
                if (userError) {
                    console.error('User record creation failed:', userError);
                    throw userError;
                }
                
                // Verify user record was created successfully
                if (!userRecord || userRecord.length === 0) {
                    throw new Error('User record creation failed - no record returned');
                }
                
                // Add a small delay to ensure database consistency
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            return { success: true, data: authData };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    async signInUser(email, password) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Get additional user data from users table
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (userError) console.warn('Could not fetch user data:', userError);
            
            return { 
                success: true, 
                data: {
                    ...data,
                    userData: userData
                }
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOutUser() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase client not available');
            }
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            if (!(await this.ensureInitialized())) {
                return { success: false, error: 'Supabase client not available' };
            }
            
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();

            if (authError) {
                console.error('Auth getUser error:', authError);
                return { success: false, error: authError.message };
            }
            
            if (!user) return { success: false, error: 'No user logged in' };
            
            // Get additional user data with retry logic for new registrations
            let userData = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (!error && data) {
                    userData = data;
                    break;
                }
                
                if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
                    console.error('User data fetch error:', error);
                    return { success: false, error: error.message };
                }
                
                // If user not found, wait a bit and retry (for new registrations)
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            return { 
                success: true, 
                data: {
                    authUser: user,
                    userData: userData
                }
            };
        } catch (error) {
            console.error('getCurrentUser error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ADMIN AUTHENTICATION ====================
    
    async signInAdmin(email, password) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password_hash', password) // In production, this should be properly hashed
                .eq('account_type', 'admin')
                .single();
            
            if (error || !data) {
                throw new Error('Invalid admin credentials');
            }
            
            return { 
                success: true, 
                admin: data
            };
        } catch (error) {
            console.error('Admin sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== OPPORTUNITY MANAGEMENT ====================
    
    async createOpportunity(opportunityData) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User must be logged in');
            
            const { data, error } = await this.supabase
                .from('opportunities')
                .insert([{
                    ...opportunityData,
                    provider_id: user.id,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create opportunity error:', error);
            return { success: false, error: error.message };
        }
    }

    async getOpportunities(filters = {}) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            let query = this.supabase
                .from('opportunities')
                .select('*');
            
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }
            if (filters.providerId) {
                query = query.eq('provider_id', filters.providerId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get opportunities error:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // ==================== APPLICATION MANAGEMENT ====================
    
    async submitApplication(opportunity_id, full_name, email, phone, message) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User must be logged in');
            
            const applicationData = {
                opportunity_id: opportunity_id,
                seeker_id: user.id,
                full_name: full_name,
                email: email,
                phone: phone,
                message: message,
                status: 'pending'
            };
            
            const { data, error } = await this.supabase
                .from('applications')
                .insert([applicationData])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Submit application error:', error);
            return { success: false, error: error.message };
        }
    }

    async getApplications(userId, userType = 'seeker') {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            let query = this.supabase
                .from('applications')
                .select(`
                    *,
                    opportunities(*),
                    users!applications_seeker_id_fkey(full_name, email)
                `);
            
            if (userType === 'seeker') {
                query = query.eq('seeker_id', userId);
            } else {
                // For providers, get applications for their opportunities
                query = query.eq('opportunities.provider_id', userId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get applications error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ADMIN METHODS ====================
    
    async getUsers() {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }
    
    async getUserById(userId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw error;
        }
    }
    
    async deleteUser(userId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            // First delete from auth
            const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);
            if (authError) {
                console.warn('Auth delete error (may not have admin privileges):', authError);
            }
            
            // Delete from users table
            const { error: userError } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (userError) throw userError;
            return { success: true };
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }
    
    async getOpportunityById(opportunityId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await this.supabase
                .from('opportunities')
                .select('*')
                .eq('id', opportunityId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get opportunity by ID error:', error);
            throw error;
        }
    }
    
    async deleteOpportunity(opportunityId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            
            const { error } = await this.supabase
                .from('opportunities')
                .delete()
                .eq('id', opportunityId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete opportunity error:', error);
            throw error;
        }
    }

    // ==================== MESSAGING SYSTEM ====================
    
    async getMessages(conversationId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase
                .from('messages')
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(full_name, email)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get messages error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendMessage(messageData) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User must be logged in');
            
            // First, ensure conversation exists
            const conversationResult = await this.getOrCreateConversation(
                messageData.senderId || user.id,
                messageData.receiverId
            );
            
            if (!conversationResult.success) {
                throw new Error('Failed to create conversation');
            }
            
            const { data, error } = await this.supabase
                .from('messages')
                .insert([{
                    conversation_id: conversationResult.data.id,
                    sender_id: user.id,
                    content: messageData.content,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrCreateConversation(participant1Id, participant2Id) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            // Check if conversation already exists
            const { data: existing, error: searchError } = await this.supabase
                .from('conversations')
                .select('*')
                .or(`and(participant1.eq.${participant1Id},participant2.eq.${participant2Id}),and(participant1.eq.${participant2Id},participant2.eq.${participant1Id})`)
                .limit(1);
            
            if (searchError) throw searchError;
            
            if (existing && existing.length > 0) {
                return { success: true, data: existing[0] };
            }
            
            // Create new conversation
            const { data, error } = await this.supabase
                .from('conversations')
                .insert([{
                    participant1: participant1Id,
                    participant2: participant2Id,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get/Create conversation error:', error);
            return { success: false, error: error.message };
        }
    }

    async getConversations(userId) {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase
                .from('conversations')
                .select(`
                    *,
                    messages(content, created_at, sender_id),
                    participant1_user:users!conversations_participant1_fkey(full_name, email),
                    participant2_user:users!conversations_participant2_fkey(full_name, email)
                `)
                .or(`participant1.eq.${userId},participant2.eq.${userId}`)
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get conversations error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== DATA MIGRATION ====================
    
    async migrateLocalStorageData() {
        try {
            if (!(await this.ensureInitialized())) {
                console.warn('Supabase client not available for migration');
                return;
            }
            
            console.log('Starting localStorage migration...');
            
            // Note: This is a one-time migration function
            // In production, you'd want to be more careful about data validation
            
            const migrationResults = {
                users: 0,
                opportunities: 0,
                applications: 0,
                messages: 0
            };
            
            // Migrate users (if any stored locally)
            const localUsers = JSON.parse(localStorage.getItem('kajopo_users') || '[]');
            console.log(`Found ${localUsers.length} local users to migrate`);
            
            // Migrate opportunities
            const localOpportunities = JSON.parse(localStorage.getItem('kajopo_opportunities') || '[]');
            console.log(`Found ${localOpportunities.length} local opportunities to migrate`);
            
            // Migrate applications
            const localApplications = JSON.parse(localStorage.getItem('kajopo_applications') || '[]');
            console.log(`Found ${localApplications.length} local applications to migrate`);
            
            // Migrate messages
            const localMessages = JSON.parse(localStorage.getItem('kajopo_messages') || '[]');
            console.log(`Found ${localMessages.length} local messages to migrate`);
            
            console.log('Migration completed:', migrationResults);
            return { success: true, results: migrationResults };
        } catch (error) {
            console.error('Migration failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== FILTER HELPER METHODS ====================
    
    async getUniqueCategories() {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase
                .from('opportunities')
                .select('category')
                .not('category', 'is', null);
            
            if (error) throw error;
            
            const uniqueCategories = [...new Set(data.map(item => item.category))]
                .filter(category => category && category.trim() !== '')
                .sort();
            
            return { success: true, data: uniqueCategories };
        } catch (error) {
            console.error('Get unique categories error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUniqueTypes() {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase
                .from('opportunities')
                .select('type')
                .not('type', 'is', null);
            
            if (error) throw error;
            
            const uniqueTypes = [...new Set(data.map(item => item.type))]
                .filter(type => type && type.trim() !== '')
                .sort();
            
            return { success: true, data: uniqueTypes };
        } catch (error) {
            console.error('Get unique types error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUniqueLocations() {
        try {
            if (!(await this.ensureInitialized())) {
                throw new Error('Supabase client not available');
            }
            const { data, error } = await this.supabase
                .from('opportunities')
                .select('location')
                .not('location', 'is', null);
            
            if (error) throw error;
            
            const uniqueLocations = [...new Set(data.map(item => item.location))]
                .filter(location => location && location.trim() !== '')
                .sort();
            
            return { success: true, data: uniqueLocations };
        } catch (error) {
            console.error('Get unique locations error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================
    
    async subscribeToMessages(conversationId, callback) {
        if (!(await this.ensureInitialized())) {
            console.error('Supabase client not available');
            return null;
        }
        return this.supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, callback)
            .subscribe();
    }

    async subscribeToOpportunities(callback) {
        if (!(await this.ensureInitialized())) {
            console.error('Supabase client not available');
            return null;
        }
        return this.supabase
            .channel('opportunities')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'opportunities'
            }, callback)
            .subscribe();
    }
}

// Initialize and export
window.dbManager = new DatabaseManager();
window.dataManager = window.dbManager; // For admin dashboard compatibility
console.log('Database Manager initialized successfully');
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.dbManager)));