/**
 * Supabase Auth Integration for Kájọpọ̀ Connect
 * Handles authentication using Supabase's built-in auth system
 */

class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.sessionKey = 'kajopo_session';
        this.initRetryCount = 0;
        this.maxInitRetries = 3;

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.waitForSupabaseConfig();
            });
        } else {
            setTimeout(() => {
                this.waitForSupabaseConfig();
            }, 100);
        }
    }

    waitForSupabaseConfig() {
        if (window.supabaseClient && window.supabaseConfig) {
            console.log('✓ Supabase Auth: Using pre-initialized Supabase client');
            this.supabase = window.supabaseClient;
            this.loadSession();
        } else {
            console.log('Supabase Auth: Waiting for Supabase config to load...');
            setTimeout(() => {
                this.waitForSupabaseConfig();
            }, 500);
        }
    }

    isSupabaseReady() {
        return this.supabase !== null && window.supabaseClient !== null;
    }

    /**
     * Sign up new user with email and password
     */
    async signUp(email, password, userData = {}) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }

            console.log(`Signing up new user: ${email}`);

            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: userData.firstName || '',
                        last_name: userData.lastName || '',
                        account_type: userData.accountType || 'seeker'
                    }
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            // Create user record in public.users table
            if (data.user) {
                await this.createUserRecord(data.user, userData);
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
                message: 'User created successfully! Please check your email to confirm your account.'
            };

        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sign in with email and password
     */
    async signIn(email, password, accountType = null) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Authentication system is not available. Please refresh the page and try again.');
            }

            console.log(`Signing in user: ${email}`);

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw new Error(error.message);
            }

            // Get user data from public.users table
            const userData = await this.getUserData(data.user.id);

            // Check account type if specified
            const userAccountType = userData.account_type || userData.accountType;
            if (accountType && userAccountType !== accountType) {
                await this.signOut();
                throw new Error(`This account is for ${userAccountType}s, not ${accountType}s`);
            }

            // Check if user is admin
            const isAdmin = (userData.account_type || userData.accountType) === 'admin';

            // Create session
            const sessionData = {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    firstName: userData.first_name || userData.firstName || '',
                    lastName: userData.last_name || userData.lastName || '',
                    name: userData.first_name && userData.last_name ? 
                        `${userData.first_name} ${userData.last_name}` : 
                        (userData.firstName && userData.lastName ? 
                            `${userData.firstName} ${userData.lastName}` : 
                            userData.email),
                    accountType: userData.account_type || userData.accountType || 'seeker',
                    role: isAdmin ? 'admin' : (userData.role || 'user'),
                    isAdmin: isAdmin,
                    isVerified: userData.verified || userData.isverified || true,
                    profileComplete: userData.profilecomplete || true
                },
                session: data.session,
                loginTime: new Date().toISOString(),
                accountType: userData.account_type || userData.accountType || 'seeker'
            };

            this.currentUser = sessionData.user;
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            console.log('✓ Sign in successful:', sessionData.user.email);
            return {
                success: true,
                user: sessionData.user,
                session: data.session,
                accountType: sessionData.accountType
            };

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem(this.sessionKey);
            
            console.log('✓ Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.currentUser && (this.currentUser.isAdmin || this.currentUser.accountType === 'admin');
    }

    /**
     * Load session from localStorage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                this.currentUser = parsed.user;
                console.log('✓ Session loaded:', this.currentUser.email);
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }

    /**
     * Create user record in public.users table
     */
    async createUserRecord(authUser, userData = {}) {
        try {
            const { error } = await this.supabase
                .from('users')
                .insert({
                    id: authUser.id,
                    email: authUser.email,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                    accountType: userData.accountType || 'seeker',
                    isverified: true,
                    profilecomplete: false,
                    status: 'active',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error creating user record:', error);
            } else {
                console.log('✓ User record created in public.users table');
            }
        } catch (error) {
            console.error('Error creating user record:', error);
        }
    }

    /**
     * Get user data from public.users table
     */
    async getUserData(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
                return {
                    accountType: 'seeker',
                    isverified: true,
                    profilecomplete: false
                };
            }

            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return {
                accountType: 'seeker',
                isverified: true,
                profilecomplete: false
            };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            if (!this.isSupabaseReady()) {
                throw new Error('Authentication system is not available.');
            }

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                message: 'Password reset email sent!'
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
window.supabaseAuth = new SupabaseAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseAuth;
}

