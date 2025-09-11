/**
 * Kájọpọ̀ Connect Admin Authentication & Authorization System
 * Handles admin login, session management, and role-based access control
 */

class AdminAuth {
    constructor() {
        this.sessionKey = 'kajopo_admin_session';
        this.lockoutKey = 'kajopo_admin_lockout';
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionCheckInterval = null;
        
        // Admin roles and permissions
        this.roles = {
            'super_admin': {
                name: 'Super Administrator',
                permissions: ['users', 'opportunities', 'applications', 'analytics', 'settings', 'admin_management']
            },
            'admin': {
                name: 'Administrator',
                permissions: ['users', 'opportunities', 'applications', 'analytics']
            },
            'moderator': {
                name: 'Moderator',
                permissions: ['opportunities', 'applications']
            }
        };
        
        this.startSessionMonitoring();
    }

    /**
     * Check if user has valid admin session
     * @returns {Object|null} Admin session data or null
     */
    getCurrentSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return null;

            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (session.expiresAt <= Date.now()) {
                this.clearSession();
                return null;
            }

            return session;
        } catch (error) {
            console.error('Error reading admin session:', error);
            this.clearSession();
            return null;
        }
    }

    /**
     * Check if current admin has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} True if admin has permission
     */
    hasPermission(permission) {
        const session = this.getCurrentSession();
        if (!session || !session.admin) return false;

        const adminRole = session.admin.role;
        const roleConfig = this.roles[adminRole];
        
        return roleConfig && roleConfig.permissions.includes(permission);
    }

    /**
     * Check if current admin has any of the specified permissions
     * @param {Array} permissions - Array of permissions to check
     * @returns {boolean} True if admin has at least one permission
     */
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }

    /**
     * Check if current admin has all specified permissions
     * @param {Array} permissions - Array of permissions to check
     * @returns {boolean} True if admin has all permissions
     */
    hasAllPermissions(permissions) {
        return permissions.every(permission => this.hasPermission(permission));
    }

    /**
     * Get current admin info
     * @returns {Object|null} Admin info or null
     */
    getCurrentAdmin() {
        const session = this.getCurrentSession();
        return session ? session.admin : null;
    }

    /**
     * Create admin session
     * @param {Object} adminData - Admin data
     * @param {boolean} rememberMe - Whether to create long-term session
     */
    createSession(adminData, rememberMe = false) {
        const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 30 days or 8 hours
        const session = {
            admin: adminData,
            createdAt: Date.now(),
            expiresAt: Date.now() + sessionDuration,
            sessionId: this.generateSessionId(),
            rememberMe: rememberMe
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        
        // Also set legacy admin data for backward compatibility
        localStorage.setItem('kajopo_admin', JSON.stringify(adminData));
        
        // Log session creation
        this.logActivity('session_created', {
            adminId: adminData.email,
            sessionId: session.sessionId,
            rememberMe: rememberMe
        });
    }

    /**
     * Clear admin session
     */
    clearSession() {
        const session = this.getCurrentSession();
        if (session) {
            this.logActivity('session_cleared', {
                adminId: session.admin.email,
                sessionId: session.sessionId
            });
        }
        
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem('kajopo_admin'); // Remove legacy data
    }

    /**
     * Check if account is locked due to failed login attempts
     * @returns {boolean} True if account is locked
     */
    isAccountLocked() {
        try {
            const lockoutData = localStorage.getItem(this.lockoutKey);
            if (!lockoutData) return false;

            const lockout = JSON.parse(lockoutData);
            if (lockout.until > Date.now()) {
                return true;
            }

            // Lockout expired, remove it
            localStorage.removeItem(this.lockoutKey);
            return false;
        } catch (error) {
            console.error('Error checking account lockout:', error);
            return false;
        }
    }

    /**
     * Record failed login attempt
     * @param {string} email - Admin email
     */
    recordFailedAttempt(email) {
        const attempts = this.getFailedAttempts() + 1;
        
        if (attempts >= this.maxLoginAttempts) {
            const lockoutData = {
                until: Date.now() + this.lockoutDuration,
                attempts: attempts,
                email: email
            };
            localStorage.setItem(this.lockoutKey, JSON.stringify(lockoutData));
            
            this.logActivity('account_locked', {
                email: email,
                attempts: attempts,
                lockoutUntil: lockoutData.until
            });
        }
    }

    /**
     * Get number of failed login attempts
     * @returns {number} Number of failed attempts
     */
    getFailedAttempts() {
        try {
            const lockoutData = localStorage.getItem(this.lockoutKey);
            if (!lockoutData) return 0;

            const lockout = JSON.parse(lockoutData);
            return lockout.attempts || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Clear failed login attempts
     */
    clearFailedAttempts() {
        localStorage.removeItem(this.lockoutKey);
    }

    /**
     * Admin login method
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @param {boolean} rememberMe - Whether to remember login
     * @returns {Promise<Object>} Login result
     */
    async login(email, password, rememberMe = false) {
        try {
            // Check if account is locked
            if (this.isAccountLocked()) {
                const lockout = JSON.parse(localStorage.getItem(this.lockoutKey));
                const timeRemaining = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
                throw new Error(`Account locked. Try again in ${timeRemaining} minutes.`);
            }
    
            // Check if database manager is available
            if (typeof window.dbManager === 'undefined') {
                throw new Error('Database manager not available');
            }
    
            // Ensure Supabase is initialized
            const isInitialized = await window.dbManager.ensureInitialized();
            if (!isInitialized) {
                throw new Error('Database connection not available');
            }
    
            // Query admin_users table - Fixed query
            const { data, error } = await window.dbManager.supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .single();
    
            if (error) {
                console.error('Database query error:', error);
                this.recordFailedAttempt(email);
                throw new Error('Invalid admin credentials');
            }
    
            if (!data) {
                console.log('No admin user found for email:', email);
                this.recordFailedAttempt(email);
                throw new Error('Invalid admin credentials');
            }
    
            // Debug logging
            console.log('Found admin user:', { email: data.email, hasPassword: !!data.password_hash });
            console.log('Password comparison:', { 
                stored: data.password_hash, 
                provided: password, 
                match: data.password_hash === password 
            });
    
            // Check password (since it's stored as plain text for now)
            if (data.password_hash !== password) {
                console.log('Password mismatch - stored:', data.password_hash, 'provided:', password);
                this.recordFailedAttempt(email);
                throw new Error('Invalid admin credentials');
            }
    
            // Clear failed attempts on successful login
            this.clearFailedAttempts();
    
            // Create admin session
            const adminData = {
                id: data.id,
                email: data.email,
                firstName: data.firstName || data.first_name,
                lastName: data.lastName || data.last_name,
                name: `${data.firstName || data.first_name} ${data.lastName || data.last_name}`,
                role: data.role,
                permissions: data.permissions || this.roles[data.role]?.permissions || []
            };
    
            this.createSession(adminData, rememberMe);
    
            this.logActivity('admin_login', {
                adminId: adminData.email,
                role: adminData.role
            });
    
            return {
                success: true,
                admin: adminData,
                message: 'Admin login successful'
            };
    
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                message: error.message || 'Admin login failed'
            };
        }
    }

    /**
     * Redirect to admin login if not authenticated
     * @param {string} returnUrl - URL to return to after login
     */
    requireAuth(returnUrl = null) {
        const session = this.getCurrentSession();
        if (!session) {
            const loginUrl = returnUrl ? 
                `admin-login.html?return=${encodeURIComponent(returnUrl)}` : 
                'admin-login.html';
            window.location.href = loginUrl;
            return false;
        }
        return true;
    }

    /**
     * Require specific permission, redirect if not authorized
     * @param {string|Array} permissions - Permission(s) required
     * @param {string} redirectUrl - URL to redirect to if unauthorized
     */
    requirePermission(permissions, redirectUrl = 'admin-login.html') {
        if (!this.requireAuth()) return false;

        const hasPermission = Array.isArray(permissions) ? 
            this.hasAnyPermission(permissions) : 
            this.hasPermission(permissions);

        if (!hasPermission) {
            this.showUnauthorizedMessage();
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
            return false;
        }
        return true;
    }

    /**
     * Show unauthorized access message
     */
    showUnauthorizedMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        message.textContent = 'Unauthorized: You do not have permission to access this resource.';
        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    /**
     * Start monitoring session expiration
     */
    startSessionMonitoring() {
        // Check session every minute
        this.sessionCheckInterval = setInterval(() => {
            const session = this.getCurrentSession();
            if (session) {
                const timeUntilExpiry = session.expiresAt - Date.now();
                
                // Warn user 5 minutes before expiry
                if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 4 * 60 * 1000) {
                    this.showSessionWarning();
                }
                
                // Auto-logout when session expires
                if (timeUntilExpiry <= 0) {
                    this.handleSessionExpiry();
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Show session expiration warning
     */
    showSessionWarning() {
        const warning = document.createElement('div');
        warning.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        warning.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <span>Your session will expire in 5 minutes. Please save your work.</span>
            </div>
        `;
        document.body.appendChild(warning);

        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 10000);
    }

    /**
     * Handle session expiry
     */
    handleSessionExpiry() {
        this.clearSession();
        
        const expiredMessage = document.createElement('div');
        expiredMessage.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        expiredMessage.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
                <p class="text-sm text-gray-500 mb-6">Your admin session has expired. You will be redirected to the login page.</p>
                <button onclick="window.location.href='admin-login.html'" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Go to Login
                </button>
            </div>
        `;
        document.body.appendChild(expiredMessage);

        // Auto-redirect after 5 seconds
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 5000);
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Log admin activity
     * @param {string} action - Action performed
     * @param {Object} data - Additional data
     */
    logActivity(action, data = {}) {
        const logEntry = {
            timestamp: Date.now(),
            action: action,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // In production, this would send to a logging service
        console.log('Admin Activity:', logEntry);
        
        // Store in localStorage for demo purposes (in production, use proper logging)
        const logs = JSON.parse(localStorage.getItem('kajopo_admin_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 log entries
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('kajopo_admin_logs', JSON.stringify(logs));
    }

    /**
     * Get admin activity logs
     * @param {number} limit - Number of logs to return
     * @returns {Array} Array of log entries
     */
    getActivityLogs(limit = 50) {
        const logs = JSON.parse(localStorage.getItem('kajopo_admin_logs') || '[]');
        return logs.slice(-limit).reverse(); // Return most recent first
    }

    /**
     * Stop session monitoring
     */
    stopSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }

    /**
     * Extend current session
     * @param {number} additionalTime - Additional time in milliseconds
     */
    extendSession(additionalTime = 2 * 60 * 60 * 1000) { // Default 2 hours
        const session = this.getCurrentSession();
        if (session) {
            session.expiresAt = Math.min(
                session.expiresAt + additionalTime,
                Date.now() + (session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000)
            );
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            
            this.logActivity('session_extended', {
                adminId: session.admin.email,
                sessionId: session.sessionId,
                newExpiryTime: session.expiresAt
            });
        }
    }
}

// Create global instance
window.adminAuth = new AdminAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAuth;
}