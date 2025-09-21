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
     * Authenticate user with email and password
     * Works for all account types (seeker, provider, admin)
     */
    async login(email, password, accountType = null) {
        try {
            if (!this.isSupabaseReady()) {
                console.error('✗ Login failed: Supabase client not initialized');
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }
            
            // Check if account is locked
            const lockStatus = await this.checkAccountLock(email);
            if (lockStatus.isLocked) {
                throw new Error(`Account is locked until ${new Date(lockStatus.lockedUntil).toLocaleString()}`);
            }
            
            // Query user from unified users table
            let query = this.supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase());
            
            // If account type is specified, filter by it
            if (accountType) {
                query = query.eq('accountType', accountType);
            }
            
            const { data: users, error } = await query;
            
            if (error) {
                throw new Error('Database error: ' + error.message);
            }
            
            if (!users || users.length === 0) {
                await this.incrementLoginAttempts(email);
                throw new Error('Invalid email or password');
            }
            
            const user = users[0];
            
            // Verify password
            const isValidPassword = await this.verifyPassword(password, user);
            
            if (!isValidPassword) {
                await this.incrementLoginAttempts(email);
                throw new Error('Invalid email or password');
            }
            
            // Reset login attempts on successful login
            await this.resetLoginAttempts(email);
            
            // Update last login timestamp
            await this.updateLastLogin(user.id);
            
            // Create session
            const session = this.createSession(user);
            this.saveSession(session);
            this.currentUser = user;
            
            return {
                success: true,
                user: this.sanitizeUser(user),
                session: session,
                accountType: user.accountType,
                role: user.role
            };
            
        } catch (error) {
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

            // Check if user already exists
            const { data: existingUsers } = await this.supabase
                .from('users')
                .select('id')
                .eq('email', userData.email.toLowerCase());

            if (existingUsers && existingUsers.length > 0) {
                throw new Error('User with this email already exists');
            }

            // Prepare user data
            const newUser = {
                email: userData.email.toLowerCase(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: `${userData.firstName} ${userData.lastName}`,
                accountType: userData.accountType || 'seeker',
                isVerified: false,
                profileComplete: false,
                createdAt: new Date().toISOString(),
                login_attempts: 0
            };

            // For new users, store password_hash to enable immediate login
            if (userData.password) {
                newUser.password_hash = userData.password;
            }

            const { data, error } = await this.supabase
                .from('users')
                .insert([newUser])
                .select();

            if (error) {
                throw new Error('Registration failed: ' + error.message);
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
    
    /**
     * Verify password for different user types
     */
    async verifyPassword(password, user) {
        // Check if password_hash column exists and has a value
        if (user.password_hash) {
            // If user has password_hash, use it for authentication
            return user.password_hash === password;
        } else {
            // If no password_hash, this is a legacy user
            // For demo purposes, allow login with any password
            console.log('Legacy user - allowing login without password verification');
            return true;
        }
    }
    
    /**
     * Check if account is locked due to failed login attempts
     */
    async checkAccountLock(email) {
        try {
            const { data: users } = await this.supabase
                .from('users')
                .select('login_attempts, locked_until')
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
                .select('login_attempts')
                .eq('email', email.toLowerCase());
            
            if (users && users.length > 0) {
                const attempts = (users[0].login_attempts || 0) + 1;
                const updateData = { login_attempts: attempts };
                
                // Lock account if max attempts reached
                if (attempts >= this.maxLoginAttempts) {
                    updateData.locked_until = new Date(Date.now() + this.lockoutDuration).toISOString();
                }
                
                await this.supabase
                    .from('users')
                    .update(updateData)
                    .eq('email', email.toLowerCase());
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
                    login_attempts: 0,
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
            accountType: user.accountType || 'seeker',
            role: user.role || (user.accountType === 'admin' ? 'admin' : 'user'),
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
        return this.currentUser && this.currentUser.accountType === 'admin';
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
        return this.currentUser ? this.currentUser.accountType : null;
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

            // Update user with password_hash if they don't have one
            if (!user.password_hash) {
                const { error: updateError } = await this.supabase
                    .from('users')
                    .update({ password_hash: password })
                    .eq('id', user.id);

                if (updateError) {
                    throw new Error('Failed to migrate user authentication');
                }

                console.log('Successfully migrated user authentication for:', email);
                return { success: true, message: 'User authentication migrated successfully' };
            } else {
                return { success: true, message: 'User already has authentication setup' };
            }

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
        const { password_hash, login_attempts, locked_until, ...sanitized } = user;
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