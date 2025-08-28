/**
 * Kájọpọ̀ Connect Data Management System
 * Handles localStorage operations, data validation, and synchronization
 */

class DataManager {
    constructor() {
        this.storageKeys = {
            users: 'kajopo_users',
            currentUser: 'kajopo_user',
            opportunities: 'kajopo_opportunities',
            applications: 'kajopo_applications',
            messages: 'kajopo_messages',
            conversations: 'kajopo_conversations',
            adminUsers: 'kajopo_admin_users',
            settings: 'kajopo_settings',
            cache: 'kajopo_cache'
        };
        
        this.schemas = {
            user: {
                id: 'string',
                name: 'string',
                email: 'string',
                userType: 'string',
                createdAt: 'string',
                profile: 'object'
            },
            opportunity: {
                id: 'string',
                title: 'string',
                organization: 'string',
                category: 'string',
                type: 'string',
                location: 'string',
                description: 'string',
                createdAt: 'string',
                createdBy: 'string'
            },
            application: {
                id: 'string',
                opportunityId: 'string',
                applicantId: 'string',
                status: 'string',
                createdAt: 'string'
            }
        };
        
        this.initializeStorage();
    }

    /**
     * Initialize storage with default data if empty
     */
    initializeStorage() {
        // Initialize with sample data if storage is empty
        if (!this.get('users')) {
            this.initializeSampleData();
        }
        
        // Set up storage event listener for cross-tab synchronization
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('kajopo_')) {
                this.handleStorageChange(e);
            }
        });
    }

    /**
     * Initialize sample data for development
     */
    initializeSampleData() {
        const sampleUsers = [
            {
                id: 'user_1',
                name: 'Adebayo Johnson',
                email: 'adebayo@example.com',
                userType: 'seeker',
                createdAt: new Date().toISOString(),
                profile: {
                    phone: '+234-801-234-5678',
                    location: 'Lagos, Nigeria',
                    bio: 'Passionate about community development and social impact.',
                    skills: ['Community Outreach', 'Project Management', 'Public Speaking'],
                    experience: 'intermediate'
                }
            },
            {
                id: 'user_2',
                name: 'Fatima Abdullahi',
                email: 'fatima@ngo.org',
                userType: 'provider',
                createdAt: new Date().toISOString(),
                profile: {
                    phone: '+234-802-345-6789',
                    organization: 'Hope Foundation Nigeria',
                    location: 'Abuja, Nigeria',
                    bio: 'Leading community development initiatives across Nigeria.',
                    website: 'https://hopefoundation.ng',
                    verified: true
                }
            }
        ];

        const sampleOpportunities = [
            {
                id: 'opp_1',
                title: 'Community Health Grant Program',
                organization: 'Hope Foundation Nigeria',
                category: 'Health',
                type: 'Grants',
                location: 'Lagos, Nigeria',
                description: 'Apply for funding to support community health initiatives focusing on preventive healthcare and wellness education in underserved areas.',
                requirements: ['Registered NGO or community organization', 'Health program experience', 'Community engagement plan'],
                duration: '12 months',
                commitment: 'Grant funding up to ₦2,000,000',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString(),
                createdBy: 'user_2',
                status: 'active',
                applicants: 0
            },
            {
                id: 'opp_2',
                title: 'Educational Technology Fellowship',
                organization: 'Lagos Youth Development Center',
                category: 'Technology Solutions',
                type: 'Fellowships',
                location: 'Lagos, Nigeria',
                description: 'Fellowship program for developing innovative technology solutions to improve educational access and quality in Nigerian schools.',
                requirements: ['Bachelor\'s degree in Technology/Education', 'Software development experience', 'Passion for educational innovation'],
                duration: '6 months',
                commitment: 'Full-time fellowship with stipend',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString(),
                createdBy: 'user_2',
                status: 'active',
                applicants: 3
            }
        ];

        this.set('users', sampleUsers);
        this.set('opportunities', sampleOpportunities);
        this.set('applications', []);
        this.set('messages', []);
        this.set('conversations', []);
    }

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Retrieved data
     */
    get(key, defaultValue = null) {
        try {
            const storageKey = this.storageKeys[key] || key;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error retrieving data for key '${key}':`, error);
            return defaultValue;
        }
    }

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Data to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            const storageKey = this.storageKeys[key] || key;
            localStorage.setItem(storageKey, JSON.stringify(value));
            this.updateCache(key, value);
            return true;
        } catch (error) {
            console.error(`Error storing data for key '${key}':`, error);
            return false;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            const storageKey = this.storageKeys[key] || key;
            localStorage.removeItem(storageKey);
            this.clearCache(key);
            return true;
        } catch (error) {
            console.error(`Error removing data for key '${key}':`, error);
            return false;
        }
    }

    /**
     * Clear all application data
     */
    clearAll() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        localStorage.removeItem(this.storageKeys.cache);
    }

    /**
     * Validate data against schema
     * @param {Object} data - Data to validate
     * @param {string} schemaName - Schema name
     * @returns {Object} Validation result
     */
    validateData(data, schemaName) {
        const schema = this.schemas[schemaName];
        if (!schema) {
            return { isValid: false, errors: [`Unknown schema: ${schemaName}`] };
        }

        const errors = [];
        
        for (const [field, expectedType] of Object.entries(schema)) {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
                continue;
            }

            const value = data[field];
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            
            if (expectedType !== actualType) {
                errors.push(`Field '${field}' expected ${expectedType}, got ${actualType}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Add item to array in storage
     * @param {string} key - Storage key
     * @param {*} item - Item to add
     * @param {string} schemaName - Schema for validation
     * @returns {boolean} Success status
     */
    addItem(key, item, schemaName = null) {
        // Validate if schema provided
        if (schemaName) {
            const validation = this.validateData(item, schemaName);
            if (!validation.isValid) {
                console.error('Validation failed:', validation.errors);
                return false;
            }
        }

        const items = this.get(key, []);
        
        // Ensure item has ID
        if (!item.id) {
            item.id = this.generateId();
        }
        
        // Add timestamp if not present
        if (!item.createdAt) {
            item.createdAt = new Date().toISOString();
        }

        items.push(item);
        return this.set(key, items);
    }

    /**
     * Update item in array
     * @param {string} key - Storage key
     * @param {string} itemId - Item ID
     * @param {Object} updates - Updates to apply
     * @returns {boolean} Success status
     */
    updateItem(key, itemId, updates) {
        const items = this.get(key, []);
        const index = items.findIndex(item => item.id === itemId);
        
        if (index === -1) {
            console.error(`Item with ID '${itemId}' not found in '${key}'`);
            return false;
        }

        // Apply updates
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        return this.set(key, items);
    }

    /**
     * Remove item from array
     * @param {string} key - Storage key
     * @param {string} itemId - Item ID
     * @returns {boolean} Success status
     */
    removeItem(key, itemId) {
        const items = this.get(key, []);
        const filteredItems = items.filter(item => item.id !== itemId);
        
        if (filteredItems.length === items.length) {
            console.error(`Item with ID '${itemId}' not found in '${key}'`);
            return false;
        }

        return this.set(key, filteredItems);
    }

    /**
     * Find item by ID
     * @param {string} key - Storage key
     * @param {string} itemId - Item ID
     * @returns {Object|null} Found item or null
     */
    findItem(key, itemId) {
        const items = this.get(key, []);
        return items.find(item => item.id === itemId) || null;
    }

    /**
     * Find items by criteria
     * @param {string} key - Storage key
     * @param {Function} predicate - Filter function
     * @returns {Array} Matching items
     */
    findItems(key, predicate) {
        const items = this.get(key, []);
        return items.filter(predicate);
    }

    /**
     * Search items by text
     * @param {string} key - Storage key
     * @param {string} query - Search query
     * @param {Array} fields - Fields to search in
     * @returns {Array} Matching items
     */
    searchItems(key, query, fields = []) {
        if (!query.trim()) {
            return this.get(key, []);
        }

        const items = this.get(key, []);
        const searchTerm = query.toLowerCase();

        return items.filter(item => {
            if (fields.length === 0) {
                // Search all string fields
                return Object.values(item).some(value => 
                    typeof value === 'string' && value.toLowerCase().includes(searchTerm)
                );
            } else {
                // Search specific fields
                return fields.some(field => {
                    const value = this.getNestedValue(item, field);
                    return typeof value === 'string' && value.toLowerCase().includes(searchTerm);
                });
            }
        });
    }

    /**
     * Get nested object value by path
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-separated path
     * @returns {*} Value or undefined
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export data for backup
     * @returns {Object} All application data
     */
    exportData() {
        const data = {};
        Object.keys(this.storageKeys).forEach(key => {
            data[key] = this.get(key);
        });
        return data;
    }

    /**
     * Import data from backup
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                if (this.storageKeys[key]) {
                    this.set(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        let totalSize = 0;
        const stats = {};

        Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
            const data = localStorage.getItem(storageKey);
            const size = data ? new Blob([data]).size : 0;
            stats[key] = {
                size: size,
                sizeFormatted: this.formatBytes(size),
                itemCount: data ? JSON.parse(data).length || 1 : 0
            };
            totalSize += size;
        });

        return {
            total: {
                size: totalSize,
                sizeFormatted: this.formatBytes(totalSize)
            },
            breakdown: stats
        };
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update cache for performance
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    updateCache(key, value) {
        const cache = this.get('cache', {});
        cache[key] = {
            data: value,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
    }

    /**
     * Clear cache for key
     * @param {string} key - Cache key
     */
    clearCache(key) {
        const cache = this.get('cache', {});
        delete cache[key];
        localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
    }

    /**
     * Handle storage changes from other tabs
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('kajopoDataChange', {
            detail: {
                key: event.key,
                oldValue: event.oldValue,
                newValue: event.newValue
            }
        }));
    }

    /**
     * Clean up old data based on retention policy
     */
    cleanupOldData() {
        const retentionDays = 90; // Keep data for 90 days
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        // Clean up old messages
        const messages = this.get('messages', []);
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) > cutoffDate
        );
        if (recentMessages.length !== messages.length) {
            this.set('messages', recentMessages);
        }

        // Clean up old applications
        const applications = this.get('applications', []);
        const recentApplications = applications.filter(app => 
            new Date(app.createdAt) > cutoffDate
        );
        if (recentApplications.length !== applications.length) {
            this.set('applications', recentApplications);
        }
    }
}

// Global data manager instance
const dataManager = new DataManager();

// Clean up old data on initialization
dataManager.cleanupOldData();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, dataManager };
}