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
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = this.dataManager.getUser(userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'An account with this email already exists'
                };
            }
            
            // Generate user ID and add metadata
            const newUser = {
                ...userData,
                id: this.generateUserId(),
                name: `${userData.firstName} ${userData.lastName}`,
                registeredAt: new Date().toISOString(),
                isVerified: false,
                profileComplete: this.isProfileComplete(userData),
                status: 'Active'
            };
            
            // Save user to data manager
            const saveResult = this.dataManager.saveUser(newUser);
            if (!saveResult.success) {
                return {
                    success: false,
                    message: 'Failed to save user data'
                };
            }
            
            // Create session for the new user
            this.createSession(newUser);
            
            return {
                success: true,
                user: newUser,
                message: 'Registration successful'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Registration failed due to an error'
            };
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
    return userAuth.getCurrentUser();
}

function updateUserInfo() {
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