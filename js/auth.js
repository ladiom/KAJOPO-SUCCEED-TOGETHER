/**
 * Kájọpọ̀ Connect User Authentication System
 * Handles user login, registration, session management, and user data
 */

class UserAuth {
    constructor() {
        this.sessionKey = 'kajopo_user_session';
        this.usersKey = 'kajopo_users';
        this.currentUserKey = 'kajopo_current_user';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Check if user is authenticated
     * @returns {Object|null} User data or null
     */
    getCurrentUser() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return null;

            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (session.expiresAt <= Date.now()) {
                this.clearSession();
                return null;
            }

            // Handle cases where user might not exist yet during registration
            if (!session.user) {
                console.warn('Session exists but user data is missing');
                this.clearSession();
                return null;
            }

            return session.user;
        } catch (error) {
            console.error('Error reading user session:', error);
            this.clearSession();
            return null;
        }
    }

    /**
     * Create user session
     * @param {Object} userData - User data
     */
    createSession(userData) {
        const session = {
            user: userData,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionDuration,
            sessionId: this.generateSessionId()
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        localStorage.setItem(this.currentUserKey, JSON.stringify(userData));
    }

    /**
     * Clear user session
     */
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.currentUserKey);
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} Registration result
     */
    registerUser(userData) {
        try {
            if (!userData.email || !userData.password) {
                throw new Error('Email and password are required');
            }

            if (!userData.firstName || !userData.lastName) {
                throw new Error('First name and last name are required');
            }

            // Get existing users
            const users = this.getAllUsers();
            
            // Check if email already exists
            if (users.find(user => user.email === userData.email)) {
                const errorMsg = 'An account with this email already exists. Please use a different email or sign in.';
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(errorMsg);
                }
                return { success: false, message: errorMsg };
            }

            // Create new user
            const newUser = {
                id: this.generateUserId(),
                ...userData,
                createdAt: Date.now(),
                status: 'active',
                profileComplete: false
            };

            // Add to users array
            users.push(newUser);
            localStorage.setItem(this.usersKey, JSON.stringify(users));

            // Create session
            this.createSession(newUser);

            if (typeof errorHandler !== 'undefined') {
                errorHandler.showSuccess('Account created successfully! Welcome to Kájọpọ̀.');
            }

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.message || 'Registration failed. Please try again.';
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Registration');
            }
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Login result
     */
    loginUser(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            const users = this.getAllUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                const errorMsg = 'Invalid email or password. Please check your credentials and try again.';
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(errorMsg);
                }
                return { success: false, message: errorMsg };
            }

            if (user.status === 'suspended') {
                const errorMsg = 'Account suspended';
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(errorMsg);
                }
                return { success: false, message: errorMsg };
            }

            // Create session
            this.createSession(user);

            if (typeof errorHandler !== 'undefined') {
                errorHandler.showSuccess('Login successful! Welcome back.');
            }

            return { success: true, user: user };
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.message || 'Login failed. Please try again.';
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Login');
            }
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Get all registered users
     * @returns {Array} Array of users
     */
    getAllUsers() {
        try {
            const users = localStorage.getItem(this.usersKey);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    /**
     * Update user profile
     * @param {Object} updatedData - Updated user data
     * @returns {Object} Update result
     */
    updateUserProfile(updatedData) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                return { success: false, message: 'Not authenticated' };
            }

            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }

            // Update user data
            const updatedUser = { ...users[userIndex], ...updatedData, updatedAt: Date.now() };
            users[userIndex] = updatedUser;
            
            // Save to localStorage
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            
            // Update session
            this.createSession(updatedUser);

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Update failed' };
        }
    }

    /**
     * Generate unique user ID
     * @returns {string} Unique ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Check if user is authenticated and redirect if not
     * @param {string} redirectUrl - URL to redirect to if not authenticated
     * @returns {boolean} True if authenticated
     */
    requireAuth(redirectUrl = 'signin-form.html') {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Demo login for testing purposes
     * @param {string} type - Type of demo user ('seeker' or 'provider')
     * @returns {Object} Login result
     */
    loginDemo(type) {
        try {
            let demoUser;
            
            if (type === 'seeker') {
                demoUser = {
                    id: 'demo_seeker_1',
                    accountType: 'seeker',
                    name: 'Sarah Johnson',
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    email: 'sarah.johnson@example.com',
                    phone: '+1234567890',
                    location: 'Nairobi, Kenya',
                    currentRole: 'Community Health Coordinator',
                    organization: 'Health for All NGO',
                    experience: '6-10',
                    skills: 'Community health, Training delivery, Health education, Data collection, Program management',
                    languages: 'English, Swahili',
                    interests: ['healthcare', 'education', 'community-development'],
                    bio: 'Passionate about improving healthcare access in underserved communities through innovative programs and community engagement.',
                    registeredAt: new Date().toISOString(),
                    isVerified: true,
                    profileComplete: true
                };
            } else {
                demoUser = {
                    id: 'demo_provider_1',
                    accountType: 'provider',
                    name: 'Michael Chen',
                    firstName: 'Michael',
                    lastName: 'Chen',
                    email: 'michael.chen@globalhealth.org',
                    phone: '+1987654321',
                    location: 'New York, USA',
                    currentRole: 'Program Director',
                    organization: 'Global Health Initiative',
                    experience: '11-15',
                    skills: 'Program management, Grant writing, Partnership development, Strategic planning, Impact measurement',
                    languages: 'English, Mandarin, Spanish',
                    interests: ['healthcare', 'poverty', 'economic-development'],
                    bio: 'Leading global health programs focused on sustainable development and capacity building in emerging markets.',
                    registeredAt: new Date().toISOString(),
                    isVerified: true,
                    profileComplete: true
                };
            }
            
            // Create session
            this.createSession(demoUser);
            
            return {
                success: true,
                user: demoUser,
                message: 'Demo login successful'
            };
        } catch (error) {
            console.error('Demo login error:', error);
            return {
                success: false,
                message: 'Demo login failed'
            };
        }
    }
    
    /**
     * Login user with Supabase authentication
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {boolean} rememberMe - Whether to remember the user
     * @returns {Promise<Object>} Login result
     */
    async login(email, password, rememberMe = false) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Check if database manager is available
            if (typeof window.dbManager === 'undefined') {
                console.warn('Database manager not available, falling back to localStorage');
                return this.loginUser(email, password);
            }

            // Ensure Supabase is initialized
            const isInitialized = await window.dbManager.ensureInitialized();
            if (!isInitialized) {
                console.warn('Supabase not initialized, falling back to localStorage');
                return this.loginUser(email, password);
            }

            // Use database manager for login
            const result = await window.dbManager.signInUser(email, password);
            
            if (result.success) {
                this.createSession(result.user);
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showSuccess('Login successful! Welcome back.');
                }
                return result;
            } else {
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(result.error || 'Login failed');
                }
                return result;
            }

            // Legacy Supabase authentication (keeping as fallback)
            const { data, error } = await window.dbManager.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Supabase login error:', error);
                const errorMsg = error.message || 'Login failed. Please check your credentials.';
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(errorMsg);
                }
                return { success: false, message: errorMsg };
            }

            if (data.user) {
                // Get user profile from Supabase
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                let userData;
                if (profile && !profileError) {
                    userData = {
                        id: data.user.id,
                        email: data.user.email,
                        ...profile
                    };
                } else {
                    // Create basic user data from auth response
                    userData = {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email,
                        firstName: data.user.user_metadata?.firstName || '',
                        lastName: data.user.user_metadata?.lastName || '',
                        accountType: data.user.user_metadata?.accountType || 'seeker',
                        registeredAt: data.user.created_at,
                        isVerified: data.user.email_confirmed_at !== null,
                        profileComplete: false
                    };
                }

                // Create session
                this.createSession(userData);

                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showSuccess('Login successful! Welcome back.');
                }

                return { success: true, user: userData };
            }

            return { success: false, message: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.message || 'Login failed. Please try again.';
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Login');
            }
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Register a new user with Supabase
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async register(userData) {
        try {
            if (!userData.email || !userData.password) {
                throw new Error('Email and password are required');
            }

            if (!userData.firstName || !userData.lastName) {
                throw new Error('First name and last name are required');
            }

            // Check if database manager is available
            if (typeof window.dbManager === 'undefined') {
                console.warn('Database manager not available, falling back to localStorage');
                return this.registerUser(userData);
            }

            // Ensure Supabase is initialized
            const isInitialized = await window.dbManager.ensureInitialized();
            if (!isInitialized) {
                console.warn('Supabase not initialized, falling back to localStorage');
                return this.registerUser(userData);
            }

            // Use database manager for registration
            const result = await window.dbManager.registerUser({
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                accountType: userData.accountType || 'seeker',
                phone: userData.phone || '',
                location: userData.location || '',
                organization: userData.organization || '',
                skills: userData.skills || '',
                interests: userData.interests || []
            });

            if (result.success && result.data && result.data.user) {
                // Create local session after successful registration
                const sessionData = {
                    id: result.data.user.id,
                    email: userData.email,
                    name: `${userData.firstName} ${userData.lastName}`,
                    userType: userData.accountType || 'seeker',
                    phone: userData.phone || '',
                    location: userData.location || ''
                };
                
                this.createSession(sessionData);
                
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showSuccess('Registration successful! Welcome to Kájọpọ̀.');
                }
                return result;
            } else {
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(result.error || 'Registration failed');
                }
                return result;
            }

            // Legacy Supabase registration (keeping as fallback)
            const { data, error } = await window.dbManager.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        name: `${userData.firstName} ${userData.lastName}`,
                        accountType: userData.accountType || 'seeker',
                        location: userData.location || '',
                        phone: userData.phone || ''
                    }
                }
            });

            if (error) {
                console.error('Supabase registration error:', error);
                const errorMsg = error.message || 'Registration failed. Please try again.';
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.showError(errorMsg);
                }
                return { success: false, message: errorMsg };
            }

            if (data.user) {
                // Create user profile in database
                const profileData = {
                    id: data.user.id,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    name: `${userData.firstName} ${userData.lastName}`,
                    accountType: userData.accountType || 'seeker',
                    phone: userData.phone || '',
                    location: userData.location || '',
                    organization: userData.organization || '',
                    created_at: new Date().toISOString()
                };

                // Save to users table
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([profileData]);

                if (insertError) {
                    console.error('Error saving user profile:', insertError);
                }

                // Create session if user is confirmed (or in development)
                if (data.user.email_confirmed_at || data.session) {
                    this.createSession(profileData);
                }

                if (typeof errorHandler !== 'undefined') {
                    if (data.user.email_confirmed_at) {
                        errorHandler.showSuccess('Registration successful! Welcome to Kájọpọ̀.');
                    } else {
                        errorHandler.showSuccess('Registration successful! Please check your email to verify your account.');
                    }
                }

                return {
                    success: true,
                    user: profileData,
                    message: data.user.email_confirmed_at ? 'Registration successful' : 'Please verify your email'
                };
            }

            return { success: false, message: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.message || 'Registration failed due to an error';
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Registration');
            }
            return { success: false, message: errorMsg };
        }
    }

    /**
     * Logout user from Supabase
     * @returns {Promise<Object>} Logout result
     */
    async logout() {
        try {
            // Clear local session first
            this.clearSession();

            // If Supabase is available, sign out from there too
            if (typeof window.supabaseClient !== 'undefined') {
                const { error } = await window.supabaseClient.auth.signOut();
                if (error) {
                    console.error('Supabase logout error:', error);
                }
            }

            if (typeof errorHandler !== 'undefined') {
                errorHandler.showSuccess('Logged out successfully');
            }

            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Logout failed' };
        }
    }
    
    /**
     * Generate a unique user ID
     * @returns {string} Unique user ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Check if user profile is complete
     * @param {Object} userData - User data to check
     * @returns {boolean} Whether profile is complete
     */
    isProfileComplete(userData) {
        const requiredFields = ['firstName', 'lastName', 'email', 'location', 'accountType'];
        return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
    }
}

// Global auth instance
const userAuth = new UserAuth();

// Global helper functions
function checkUserAuth() {
    try {
        return userAuth.getCurrentUser();
    } catch (error) {
        console.error('Error checking user auth:', error);
        return null;
    }
}

function updateUserInfo() {
    try {
        const user = checkUserAuth();
        if (user) {
            // Update user name in UI
            const userNameElements = document.querySelectorAll('.user-name, #userName');
            userNameElements.forEach(el => {
                if (el) el.textContent = user.name || user.email;
            });

            // Update user email in UI
            const userEmailElements = document.querySelectorAll('.user-email, #userEmail');
            userEmailElements.forEach(el => {
                if (el) el.textContent = user.email;
            });

            // Update user type in UI
            const userTypeElements = document.querySelectorAll('.user-type, #userType');
            userTypeElements.forEach(el => {
                if (el) el.textContent = user.userType || 'User';
            });
        }
    } catch (error) {
        console.error('Error updating user info:', error);
        // Silently fail to avoid disrupting the user experience
    }
}

function setupUserMenuListeners() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const signOutBtn = document.getElementById('signOutBtn');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });

        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            userAuth.clearSession();
            window.location.href = 'index.html';
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserAuth, userAuth };
}