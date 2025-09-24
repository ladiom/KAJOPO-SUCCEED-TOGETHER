// Theme Utility - Centralized theme management
// This file provides consistent theme functionality across all pages

class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.savedTheme = localStorage.getItem('theme');
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.themeToggleBtn = null;
        this.sunIcon = null;
        this.moonIcon = null;
    }

    // Initialize theme system
    init() {
        console.log('ThemeManager: Initializing theme system');
        this.setupElements();
        this.applyInitialTheme();
        this.setupEventListeners();
    }

    // Setup DOM elements
    setupElements() {
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.sunIcon = document.getElementById('sun-icon');
        this.moonIcon = document.getElementById('moon-icon');

        if (!this.themeToggleBtn) {
            console.error('ThemeManager: Theme toggle button not found!');
            return false;
        }

        if (!this.sunIcon || !this.moonIcon) {
            console.warn('ThemeManager: Sun or moon icon not found!');
        }

        return true;
    }

    // Apply initial theme based on saved preference or system preference
    applyInitialTheme() {
        let initialTheme = 'light';

        if (this.savedTheme) {
            initialTheme = this.savedTheme;
        } else if (this.prefersDark) {
            initialTheme = 'dark';
        }

        console.log('ThemeManager: Applying initial theme:', initialTheme);
        this.applyTheme(initialTheme);
    }

    // Apply theme to the page
    applyTheme(theme) {
        console.log('ThemeManager: Applying theme:', theme);
        
        if (theme === 'dark') {
            this.html.setAttribute('data-theme', 'dark');
            this.updateIcons('dark');
            localStorage.setItem('theme', 'dark');
            console.log('ThemeManager: Dark theme applied');
        } else {
            this.html.setAttribute('data-theme', 'light');
            this.updateIcons('light');
            localStorage.setItem('theme', 'light');
            console.log('ThemeManager: Light theme applied');
        }
    }

    // Update icon visibility based on theme
    updateIcons(theme) {
        if (!this.sunIcon || !this.moonIcon) return;

        if (theme === 'dark') {
            this.sunIcon.classList.add('hidden');
            this.moonIcon.classList.remove('hidden');
        } else {
            this.sunIcon.classList.remove('hidden');
            this.moonIcon.classList.add('hidden');
        }
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const currentTheme = this.html.getAttribute('data-theme');
        console.log('ThemeManager: Toggling theme. Current:', currentTheme);
        
        if (currentTheme === 'dark') {
            this.applyTheme('light');
        } else {
            this.applyTheme('dark');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
            console.log('ThemeManager: Event listener attached to theme toggle button');
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.html.getAttribute('data-theme') || 'light';
    }

    // Check if dark theme is active
    isDarkTheme() {
        return this.getCurrentTheme() === 'dark';
    }
}

// Global theme manager instance
window.themeManager = new ThemeManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

