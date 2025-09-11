/**
 * Kájọpọ̀ Connect Form Validation System
 * Provides comprehensive form validation utilities
 */

class FormValidator {
    constructor() {
        this.rules = {
            required: (value) => value && value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^[\+]?[0-9]{10,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
            password: (value) => value && value.length >= 8,
            strongPassword: (value) => {
                const hasUpper = /[A-Z]/.test(value);
                const hasLower = /[a-z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                return value && value.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
            },
            minLength: (value, min) => value && value.length >= min,
            maxLength: (value, max) => value && value.length <= max,
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            date: (value) => {
                const date = new Date(value);
                return date instanceof Date && !isNaN(date);
            },
            futureDate: (value) => {
                const date = new Date(value);
                return date > new Date();
            }
        };

        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            password: 'Password must be at least 8 characters long',
            strongPassword: 'Password must contain uppercase, lowercase, number, and special character',
            minLength: 'Must be at least {min} characters long',
            maxLength: 'Must be no more than {max} characters long',
            url: 'Please enter a valid URL',
            date: 'Please enter a valid date',
            futureDate: 'Date must be in the future',
            passwordMatch: 'Passwords do not match'
        };
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Form field element
     * @param {Array} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateField(field, rules = []) {
        const value = field.value;
        const errors = [];

        try {
            for (const rule of rules) {
                let isValid = false;
                let message = '';

                if (typeof rule === 'string') {
                    // Simple rule
                    isValid = this.rules[rule] ? this.rules[rule](value) : true;
                    message = this.messages[rule] || 'Invalid value';
                } else if (typeof rule === 'object') {
                    // Rule with parameters
                    const { type, params, message: customMessage } = rule;
                    isValid = this.rules[type] ? this.rules[type](value, ...params) : true;
                    message = customMessage || this.messages[type]?.replace(/{(\w+)}/g, (match, key) => params[key] || match) || 'Invalid value';
                } else {
                    console.warn(`Unknown validation rule format:`, rule);
                    if (typeof errorHandler !== 'undefined') {
                        errorHandler.showWarning(`Unknown validation rule format for field ${field.name}`);
                    }
                    continue;
                }

                if (!isValid) {
                    errors.push(message);
                }
            }
        } catch (error) {
            console.error('Field validation error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Field validation');
            }
            errors.push('Validation error occurred');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} fieldRules - Field validation rules
     * @returns {Object} Validation result
     */
    validateForm(form, fieldRules = {}) {
        const results = {};
        let isFormValid = true;

        // Clear previous errors
        this.clearFormErrors(form);
        
        // Clear any existing error messages if error handler is available
        if (typeof errorHandler !== 'undefined') {
            errorHandler.clearAllFieldErrors(form);
        }

        // Validate each field
        for (const [fieldName, rules] of Object.entries(fieldRules)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const result = this.validateField(field, rules);
                results[fieldName] = result;

                if (!result.isValid) {
                    isFormValid = false;
                    this.showFieldError(field, result.errors[0]);
                    
                    // Also use error handler if available
                    if (typeof errorHandler !== 'undefined') {
                        errorHandler.showFieldError(field, result.errors[0]);
                    }
                }
            }
        }

        // Custom validation (e.g., password confirmation)
        const customValidation = this.performCustomValidation(form);
        if (!customValidation.isValid) {
            isFormValid = false;
            Object.assign(results, customValidation.results);
        }

        // Show summary error if form is invalid
        if (!isFormValid && typeof errorHandler !== 'undefined') {
            const errorCount = Object.keys(results).filter(key => !results[key].isValid).length;
            errorHandler.showError(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in the form before submitting.`);
        }

        return {
            isValid: isFormValid,
            results: results
        };
    }

    /**
     * Perform custom validation (e.g., password confirmation)
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Validation result
     */
    performCustomValidation(form) {
        const results = {};
        let isValid = true;

        // Password confirmation validation
        const password = form.querySelector('[name="password"]');
        const confirmPassword = form.querySelector('[name="confirmPassword"]');
        
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                isValid = false;
                results.confirmPassword = {
                    isValid: false,
                    errors: [this.messages.passwordMatch]
                };
                this.showFieldError(confirmPassword, this.messages.passwordMatch);
            }
        }

        return {
            isValid: isValid,
            results: results
        };
    }

    /**
     * Show error message for a field
     * @param {HTMLElement} field - Form field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        // Remove existing error
        this.clearFieldError(field);

        // Add error class to field
        field.classList.add('border-red-500', 'focus:border-red-500');
        field.classList.remove('border-gray-300', 'focus:border-kajopo-blue');

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-red-500 text-sm mt-1';
        errorElement.textContent = message;

        // Insert error message after field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    /**
     * Clear error for a specific field
     * @param {HTMLElement} field - Form field
     */
    clearFieldError(field) {
        // Remove error classes
        field.classList.remove('border-red-500', 'focus:border-red-500');
        field.classList.add('border-gray-300', 'focus:border-kajopo-blue');

        // Remove error message
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Clear all form errors
     * @param {HTMLFormElement} form - Form element
     */
    clearFormErrors(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => this.clearFieldError(field));
    }

    /**
     * Setup real-time validation for a form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} fieldRules - Field validation rules
     */
    setupRealTimeValidation(form, fieldRules) {
        for (const [fieldName, rules] of Object.entries(fieldRules)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    const result = this.validateField(field, rules);
                    if (!result.isValid) {
                        this.showFieldError(field, result.errors[0]);
                    } else {
                        this.clearFieldError(field);
                    }
                });

                field.addEventListener('input', () => {
                    // Clear error on input if field was previously invalid
                    if (field.classList.contains('border-red-500')) {
                        this.clearFieldError(field);
                    }
                });
            }
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     * @param {HTMLElement} container - Container element
     */
    showSuccessMessage(message, container = document.body) {
        this.showMessage(message, 'success', container);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {HTMLElement} container - Container element
     */
    showErrorMessage(message, container = document.body) {
        this.showMessage(message, 'error', container);
    }

    /**
     * Show message notification
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     * @param {HTMLElement} container - Container element
     */
    showMessage(message, type = 'info', container = document.body) {
        // Remove existing messages
        const existingMessages = container.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = `form-message p-4 rounded-lg mb-4 ${this.getMessageClasses(type)}`;
        messageElement.textContent = message;

        // Insert at the beginning of container
        container.insertBefore(messageElement, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    /**
     * Get CSS classes for message type
     * @param {string} type - Message type
     * @returns {string} CSS classes
     */
    getMessageClasses(type) {
        switch (type) {
            case 'success':
                return 'bg-green-100 border border-green-400 text-green-700';
            case 'error':
                return 'bg-red-100 border border-red-400 text-red-700';
            case 'warning':
                return 'bg-yellow-100 border border-yellow-400 text-yellow-700';
            default:
                return 'bg-blue-100 border border-blue-400 text-blue-700';
        }
    }
}

// Global form validator instance
const formValidator = new FormValidator();

// Common validation rule sets
const ValidationRules = {
    registration: {
        firstName: ['required', { type: 'minLength', params: [2], message: 'First name must be at least 2 characters' }],
        lastName: ['required', { type: 'minLength', params: [2], message: 'Last name must be at least 2 characters' }],
        email: ['required', 'email'],
        password: ['required', 'strongPassword'],
        confirmPassword: ['required'],
        location: ['required', { type: 'minLength', params: [3], message: 'Location must be at least 3 characters' }],
        accountType: ['required'],
        phone: ['phone'],
        organization: [{ type: 'minLength', params: [2], message: 'Organization name must be at least 2 characters' }]
    },
    login: {
        email: ['required', 'email'],
        password: ['required']
    },
    profile: {
        name: ['required', { type: 'minLength', params: [2] }],
        email: ['required', 'email'],
        phone: ['phone'],
        bio: [{ type: 'maxLength', params: [500], message: 'Bio must be less than 500 characters' }],
        website: ['url']
    },
    opportunity: {
        title: ['required', { type: 'minLength', params: [5] }],
        organization: ['required'],
        category: ['required'],
        type: ['required'],
        location: ['required'],
        description: ['required', { type: 'minLength', params: [50] }],
        deadline: ['required', 'date', 'futureDate'],
        duration: ['required'],
        commitment: ['required']
    },
    application: {
        coverLetter: ['required', { type: 'minLength', params: [100] }],
        experience: ['required'],
        availability: ['required']
    },
    contact: {
        name: ['required'],
        email: ['required', 'email'],
        subject: ['required'],
        message: ['required', { type: 'minLength', params: [10] }]
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, formValidator, ValidationRules };
}