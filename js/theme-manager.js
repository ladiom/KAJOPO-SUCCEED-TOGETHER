/**
 * Kajopo Connect - Theme Manager
 * Handles light/dark theme switching with accessibility and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
    this.bindEvents();
    this.announceTheme();
  }

  /**
   * Get stored theme from localStorage
   */
  getStoredTheme() {
    try {
      return localStorage.getItem('kajopo-theme');
    } catch (e) {
      console.warn('localStorage not available for theme storage');
      return null;
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Store theme preference
   */
  storeTheme(theme) {
    try {
      localStorage.setItem('kajopo-theme', theme);
    } catch (e) {
      console.warn('Could not store theme preference');
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add/remove dark class for Tailwind compatibility
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    this.currentTheme = theme;
    this.storeTheme(theme);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    const colors = {
      light: '#FAFAF5',
      dark: '#121212'
    };
    
    metaThemeColor.content = colors[theme] || colors.light;
  }

  /**
   * Toggle between themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    this.announceTheme();
    
    // Update toggle button
    this.updateToggleButton();
  }

  /**
   * Create theme toggle button if it doesn't exist
   */
  createThemeToggle() {
    // Check if toggle already exists
    if (document.querySelector('.theme-toggle')) {
      this.updateToggleButton();
      return;
    }

    // Find existing theme toggle in navigation or create new one
    const existingToggle = document.querySelector('[data-theme-toggle]');
    if (existingToggle) {
      existingToggle.classList.add('theme-toggle');
      existingToggle.innerHTML = this.getToggleHTML();
      this.updateToggleButton();
      return;
    }

    // Create new toggle button
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.setAttribute('title', 'Switch between light and dark themes');
    toggle.innerHTML = this.getToggleHTML();
    
    // Try to add to navigation or header
    const nav = document.querySelector('nav, header, .header');
    if (nav) {
      nav.appendChild(toggle);
    } else {
      // Fallback: add to body with fixed positioning
      toggle.style.position = 'fixed';
      toggle.style.top = '20px';
      toggle.style.right = '20px';
      toggle.style.zIndex = '1000';
      document.body.appendChild(toggle);
    }
    
    this.updateToggleButton();
  }

  /**
   * Get HTML for toggle button
   */
  getToggleHTML() {
    return `
      <div class="theme-toggle-handle">
        <span class="theme-icon">🌙</span>
      </div>
      <span class="sr-only">Toggle between light and dark themes</span>
    `;
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButton() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    
    const icon = toggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    const label = `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Theme toggle click
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Keyboard support for theme toggle
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('.theme-toggle') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!this.getStoredTheme()) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(systemTheme);
          this.updateToggleButton();
          this.announceTheme();
        }
      });
    }

    // Handle page visibility changes (for theme sync across tabs)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const storedTheme = this.getStoredTheme();
        if (storedTheme && storedTheme !== this.currentTheme) {
          this.applyTheme(storedTheme);
          this.updateToggleButton();
        }
      }
    });
  }

  /**
   * Announce theme change to screen readers
   */
  announceTheme() {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Switched to ${this.currentTheme} theme`;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen reader has time to read it
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.applyTheme(theme);
      this.updateToggleButton();
      this.announceTheme();
    }
  }

  /**
   * Reset to system theme
   */
  resetToSystemTheme() {
    try {
      localStorage.removeItem('kajopo-theme');
    } catch (e) {
      console.warn('Could not remove theme preference');
    }
    
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    this.updateToggleButton();
    this.announceTheme();
  }
}

// Utility functions for theme-aware components
window.ThemeUtils = {
  /**
   * Get current theme
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /**
   * Check if current theme is dark
   */
  isDarkTheme() {
    return this.getCurrentTheme() === 'dark';
  },

  /**
   * Get theme-appropriate color
   */
  getThemeColor(lightColor, darkColor) {
    return this.isDarkTheme() ? darkColor : lightColor;
  },

  /**
   * Listen for theme changes
   */
  onThemeChange(callback) {
    window.addEventListener('themeChanged', (e) => {
      callback(e.detail.theme);
    });
  }
};

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}