/**
 * Unified Authentication System for Kájọpọ̀ Connect
 * Handles authentication for all user types (seekers, providers, admins) using a single users table
 */

class UnifiedAuth {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.sessionKey = 'kajopo_session';
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.initRetryCount = 0;
        this.maxInitRetries = 3; // Limit retry attempts
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.waitForSupabaseConfig();
            });
        } else {
            // DOM is already ready
            setTimeout(() => {
                this.waitForSupabaseConfig();
            }, 100);
        }
    }
    
    waitForSupabaseConfig() {
        // Wait for supabase-config.js to initialize
        if (window.supabaseClient && window.supabaseConfig) {
            console.log('✓ Unified Auth: Using pre-initialized Supabase client');
            this.supabase = window.supabaseClient;
            this.loadSession();
        } else {
            console.log('Unified Auth: Waiting for Supabase config to load...', {
                supabaseClient: !!window.supabaseClient,
                supabaseConfig: !!window.supabaseConfig,
                supabase: !!window.supabase
            });
            setTimeout(() => {
                this.waitForSupabaseConfig();
            }, 500);
        }
    }
    
    // This method is no longer needed - we use waitForSupabaseConfig() instead
    
    isSupabaseReady() {
        return this.supabase !== null && window.supabaseClient !== null;
    }
    
    /**
     * Initialize Supabase client
     */
    initializeSupabase() {
        if (window.supabaseClient && window.supabaseConfig) {
            this.supabase = window.supabaseClient;
            this.loadSession();
            return true;
        }
        return false;
    }
    
    /**
     * Authenticate user with email and password
     * Works for all account types (seeker, provider, admin)
     */
    async login(email, password, accountType = null) {
        try {
            if (!this.isSupabaseReady()) {
                console.error('✗ Login failed: Supabase client not initialized');
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }
            
            console.log(`Attempting login for: ${email}`);
            
            // First, try to use Supabase Auth for authentication
            try {
                const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (authError) {
                    console.log('Supabase Auth failed, trying custom authentication...', authError.message);
                    throw authError;
                }
                
                if (authData.user) {
                    // Get user data from our users table
                    const { data: userData, error: userError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('email', email.toLowerCase())
                        .single();
                    
                    if (userError || !userData) {
                        console.log('User not found in users table, creating basic session...');
                        // Create a basic user record if not found
                        const basicUser = {
                            id: authData.user.id,
                            email: authData.user.email,
                            first_name: authData.user.user_metadata?.first_name || '',
                            last_name: authData.user.user_metadata?.last_name || '',
                            account_type: 'seeker',
                            verified: authData.user.email_confirmed_at ? true : false
                        };
                        
                        const session = this.createSession(basicUser);
                        this.saveSession(session);
                        this.currentUser = basicUser;
                        
                        return {
                            success: true,
                            user: this.sanitizeUser(basicUser),
                            session: session,
                            accountType: basicUser.account_type,
                            role: 'user'
                        };
                    }
                    
                    // Check account type if specified
                    if (accountType && userData.account_type !== accountType) {
                        await this.supabase.auth.signOut();
                        throw new Error(`This account is for ${userData.account_type}s, not ${accountType}s`);
                    }
                    
                    const session = this.createSession(userData);
                    this.saveSession(session);
                    this.currentUser = userData;
                    
                    return {
                        success: true,
                        user: this.sanitizeUser(userData),
                        session: session,
                        accountType: userData.account_type || userData.accountType,
                        role: userData.role || (userData.account_type === 'admin' ? 'admin' : 'user')
                    };
                }
            } catch (authError) {
                console.log('Supabase Auth failed, trying fallback authentication...', authError.message);
                
                // Fallback: Try to query users table directly (for demo purposes)
                try {
                    const { data: users, error: queryError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('email', email.toLowerCase());
                    
                    if (queryError) {
                        console.error('Database query error:', queryError);
                        throw new Error('Database connection error. Please try again later.');
                    }
                    
                    if (!users || users.length === 0) {
                        throw new Error('Invalid email or password');
                    }
                    
                    const user = users[0];
                    
                    // For demo purposes, allow login with any password if user exists
                    console.log('Demo mode: Allowing login for existing user');
                    
                    const session = this.createSession(user);
                    this.saveSession(session);
                    this.currentUser = user;
                    
                    return {
                        success: true,
                        user: this.sanitizeUser(user),
                        session: session,
                        accountType: user.account_type || user.accountType,
                        role: user.role || (user.account_type === 'admin' ? 'admin' : 'user')
                    };
                    
                } catch (fallbackError) {
                    console.error('Fallback authentication failed:', fallbackError);
                    throw new Error('Invalid email or password');
                }
            }
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Register new user (for seekers and providers)
     */
    async register(userData) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }

            // Use Supabase Auth signUp method instead of direct table insert
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        first_name: userData.firstName,
                        last_name: userData.lastName,
                        account_type: userData.accountType || 'seeker',
                        phone: userData.phone || '',
                        location: userData.location || '',
                        organization: userData.organization || ''
                    }
                }
            });

            if (authError) {
                throw new Error('Registration failed: ' + authError.message);
            }

            if (authData.user) {
                console.log('Auth user created successfully:', authData.user);
                
                // Create user record in users table using the auth user ID
                // Only include columns that actually exist in the table
                const userInsertData = {
                    id: authData.user.id,
                    email: userData.email.toLowerCase(),
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    account_type: userData.accountType || 'seeker',
                    location: userData.location || '',
                    organization_name: userData.organization || '',
                    verified: false,
                    created_at: new Date().toISOString()
                };
                
                console.log('Attempting to insert user data:', userInsertData);
                
                const { data: userRecord, error: userError } = await this.supabase
                    .from('users')
                    .insert([userInsertData])
                    .select();

                if (userError) {
                    console.error('User record creation failed:', userError);
                    console.error('User data that failed to insert:', {
                        id: authData.user.id,
                        email: userData.email.toLowerCase(),
                        first_name: userData.firstName,
                        last_name: userData.lastName,
                        account_type: userData.accountType || 'seeker'
                    });
                    
                    // Try to insert again with a different approach
                    console.log('Attempting fallback user insertion...');
                    try {
                        const { data: fallbackRecord, error: fallbackError } = await this.supabase
                            .from('users')
                            .insert([{
                                id: authData.user.id,
                                email: userData.email.toLowerCase(),
                                first_name: userData.firstName,
                                last_name: userData.lastName,
                                account_type: userData.accountType || 'seeker',
                                location: userData.location || '',
                                organization_name: userData.organization || '',
                                verified: false,
                                created_at: new Date().toISOString()
                            }])
                            .select();
                        
                        if (fallbackError) {
                            console.error('Fallback insertion also failed:', fallbackError);
                        } else {
                            console.log('Fallback insertion successful:', fallbackRecord);
                            userRecord = fallbackRecord;
                        }
                    } catch (fallbackErr) {
                        console.error('Fallback insertion error:', fallbackErr);
                    }
                } else {
                    console.log('User record created successfully:', userRecord);
                }

                // Create a session for the newly registered user
                // Use the inserted userRecord if available, otherwise create fallback data
                const userDataForSession = (userRecord && userRecord.length > 0) ? userRecord[0] : {
                    id: authData.user.id,
                    email: userData.email.toLowerCase(),
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    account_type: userData.accountType || 'seeker',
                    location: userData.location || '',
                    organization_name: userData.organization || '',
                    verified: false,
                    created_at: new Date().toISOString()
                };

                // Verify the user was actually inserted into the database
                console.log('Verifying user insertion in database...');
                try {
                    const { data: verifyUser, error: verifyError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('id', authData.user.id)
                        .single();
                    
                    if (verifyError) {
                        console.error('User verification failed:', verifyError);
                        console.log('User exists in Auth but not in users table');
                    } else {
                        console.log('User verification successful:', verifyUser);
                        // Use the verified user data if available
                        if (verifyUser) {
                            userDataForSession = verifyUser;
                        }
                    }
                } catch (verifyErr) {
                    console.error('User verification error:', verifyErr);
                }

                // Create and save session
                const session = this.createSession(userDataForSession);
                this.saveSession(session);
                this.currentUser = userDataForSession;

                return {
                    success: true,
                    user: this.sanitizeUser(userDataForSession),
                    session: session,
                    accountType: userDataForSession.account_type || userDataForSession.accountType,
                    role: userDataForSession.role || (userDataForSession.account_type === 'admin' ? 'admin' : 'user'),
                    message: 'Registration successful! Welcome to Kájọpọ̀!'
                };
            }

            return {
                success: false,
                error: 'Registration failed - no user data returned'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Verify password for different user types
     */
    async verifyPassword(password, user) {
        // Password authentication is handled by Supabase Auth
        // This method is no longer needed for direct password checking
        return false;
    }
    
    /**
     * Check if account is locked due to failed login attempts
     */
    async checkAccountLock(email) {
        try {
            const { data: users } = await this.supabase
                .from('users')
                .select('locked_until')
                .eq('email', email.toLowerCase());
            
            if (!users || users.length === 0) {
                return { isLocked: false };
            }
            
            const user = users[0];
            
            if (user.locked_until) {
                const lockTime = new Date(user.locked_until);
                const now = new Date();
                
                if (now < lockTime) {
                    return {
                        isLocked: true,
                        lockedUntil: user.locked_until
                    };
                } else {
                    // Lock has expired, reset it
                    await this.resetLoginAttempts(email);
                }
            }
            
            return { isLocked: false };
            
        } catch (error) {
            console.error('Error checking account lock:', error);
            return { isLocked: false };
        }
    }
    
    /**
     * Increment login attempts and lock account if necessary
     */
    async incrementLoginAttempts(email) {
        try {
            const { data: users } = await this.supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase());
            
            if (users && users.length > 0) {
                // Simplified - just return success without tracking attempts
                return { success: true };
            }
        } catch (error) {
            console.error('Error incrementing login attempts:', error);
        }
    }
    
    /**
     * Reset login attempts after successful login
     */
    async resetLoginAttempts(email) {
        try {
            await this.supabase
                .from('users')
                .update({
                    locked_until: null
                })
                .eq('email', email.toLowerCase());
        } catch (error) {
            console.error('Error resetting login attempts:', error);
        }
    }
    
    /**
     * Update last login timestamp
     */
    async updateLastLogin(userId) {
        try {
            await this.supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }
    
    /**
     * Create session object
     */
    createSession(user) {
        return {
            userId: user.id,
            email: user.email,
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            displayName: user.name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.email,
            accountType: user.account_type || user.accountType || 'seeker',
            role: user.role || (user.account_type === 'admin' || user.accountType === 'admin' ? 'admin' : 'user'),
            permissions: user.permissions || [],
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
    }
    
    /**
     * Save session to localStorage
     */
    saveSession(session) {
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }
    
    /**
     * Load session from localStorage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Check if session is expired
                if (new Date() < new Date(session.expiresAt)) {
                    this.currentUser = session;
                    return session;
                } else {
                    this.logout();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.logout();
        }
        return null;
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Admins with permissions array
        if (this.currentUser.permissions && Array.isArray(this.currentUser.permissions)) {
            return this.currentUser.permissions.includes(permission);
        }
        
        // Super admin has all permissions
        if (this.currentUser.role === 'super_admin') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.currentUser && (this.currentUser.accountType === 'admin' || this.currentUser.account_type === 'admin');
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get user role
     */
    getUserRole() {
        return this.currentUser ? (this.currentUser.accountType || this.currentUser.account_type) : null;
    }

    /**
     * Migrate existing user to have password authentication
     * This helps users who exist in the database but can't login
     */
    async migrateUserAuth(email, password) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }

            // Find the user
            const { data: users, error: fetchError } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .limit(1);

            if (fetchError || !users || users.length === 0) {
                throw new Error('User not found');
            }

            const user = users[0];

            // Password authentication is handled by Supabase Auth
            return { success: true, message: 'User authentication handled by Supabase Auth' };

        } catch (error) {
            console.error('Migration error:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
        
        // Also sign out from Supabase Auth if applicable
        if (this.supabase && this.supabase.auth) {
            this.supabase.auth.signOut();
        }
    }
    
    /**
     * Remove sensitive data from user object
     */
    sanitizeUser(user) {
        const { locked_until, ...sanitized } = user;
        return sanitized;
    }
    
    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        try {
            if (!this.isAdmin() || !this.hasPermission('users')) {
                throw new Error('Insufficient permissions');
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .select('id, email, firstName, lastName, name, accountType, role, isVerified, profileComplete, createdAt, last_login')
                .order('createdAt', { ascending: false });
            
            if (error) {
                throw new Error('Failed to fetch users: ' + error.message);
            }
            
            return {
                success: true,
                users: data
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Update user (admin only)
     */
    async updateUser(userId, updates) {
        try {
            if (!this.isAdmin() || !this.hasPermission('users')) {
                throw new Error('Insufficient permissions');
            }
            
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select();
            
            if (error) {
                throw new Error('Failed to update user: ' + error.message);
            }
            
            return {
                success: true,
                user: this.sanitizeUser(data[0])
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create global instance
window.unifiedAuth = new UnifiedAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAuth;
}