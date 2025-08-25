/**
 * Error Handler and User Feedback System
 * Provides centralized error handling and user notifications
 */

class ErrorHandler {
    constructor() {
        this.notificationContainer = null;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            this.createNotificationContainer();
        }
        this.notificationContainer = document.getElementById('notification-container');
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${this.getNotificationClasses(type)} transform translate-x-full transition-transform duration-300 ease-in-out`;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="close-notification inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.notificationContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Add close functionality
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    removeNotification(notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationClasses(type) {
        const baseClasses = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden p-4';
        
        switch (type) {
            case 'success':
                return `${baseClasses} border-l-4 border-green-400`;
            case 'error':
                return `${baseClasses} border-l-4 border-red-400`;
            case 'warning':
                return `${baseClasses} border-l-4 border-yellow-400`;
            default:
                return `${baseClasses} border-l-4 border-blue-400`;
        }
    }

    getIcon(type) {
        switch (type) {
            case 'success':
                return `<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`;
            case 'error':
                return `<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`;
            case 'warning':
                return `<svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>`;
            default:
                return `<svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`;
        }
    }

    // Convenience methods
    showSuccess(message, duration = 5000) {
        return this.showNotification(message, 'success', duration);
    }

    showError(message, duration = 8000) {
        return this.showNotification(message, 'error', duration);
    }

    showWarning(message, duration = 6000) {
        return this.showNotification(message, 'warning', duration);
    }

    showInfo(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    }

    // Loading state management
    showLoading(element, message = 'Loading...') {
        if (!element) return;
        
        element.disabled = true;
        const originalText = element.textContent;
        element.setAttribute('data-original-text', originalText);
        
        element.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${message}
        `;
    }

    hideLoading(element) {
        if (!element) return;
        
        element.disabled = false;
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.textContent = originalText;
            element.removeAttribute('data-original-text');
        }
    }

    // Form validation error display
    showFieldError(fieldElement, message) {
        this.clearFieldError(fieldElement);
        
        fieldElement.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        
        const errorElement = document.createElement('p');
        errorElement.className = 'mt-1 text-sm text-red-600 field-error';
        errorElement.textContent = message;
        
        fieldElement.parentNode.appendChild(errorElement);
    }

    clearFieldError(fieldElement) {
        fieldElement.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    clearAllFieldErrors(formElement) {
        const errorElements = formElement.querySelectorAll('.field-error');
        errorElements.forEach(error => error.remove());
        
        const errorFields = formElement.querySelectorAll('.border-red-500');
        errorFields.forEach(field => {
            field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        });
    }

    // Network error handling
    handleNetworkError(error) {
        console.error('Network error:', error);
        this.showError('Network connection failed. Please check your internet connection and try again.');
    }

    // Generic error handler
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'An unexpected error occurred. Please try again.';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        this.showError(message);
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Global error event listeners
window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, 'Global error');
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, 'Unhandled promise rejection');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}