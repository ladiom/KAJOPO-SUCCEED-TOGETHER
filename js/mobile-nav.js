/**
 * Mobile Navigation Component
 * Handles responsive navigation menu for mobile devices
 */

class MobileNavigation {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createMobileNavStructure();
        this.bindEvents();
        this.handleResize();
    }

    createMobileNavStructure() {
        // Find existing navigation
        const existingNav = document.querySelector('nav');
        if (!existingNav) return;

        // Create mobile toggle button
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-nav-toggle md:hidden';
        mobileToggle.innerHTML = `
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
        `;
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        mobileToggle.setAttribute('aria-expanded', 'false');

        // Create mobile overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-nav-menu';
        mobileMenu.setAttribute('role', 'dialog');
        mobileMenu.setAttribute('aria-modal', 'true');
        mobileMenu.setAttribute('aria-label', 'Mobile navigation');

        // Clone navigation items
        const navItems = existingNav.querySelectorAll('a, button');
        const mobileNavContent = document.createElement('div');
        mobileNavContent.className = 'space-y-4';

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'mobile-nav-close mb-6 p-2';
        closeButton.innerHTML = `
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
        closeButton.setAttribute('aria-label', 'Close mobile menu');
        mobileMenu.appendChild(closeButton);

        // Clone and style navigation items for mobile
        navItems.forEach(item => {
            if (item.closest('.mobile-nav-toggle')) return; // Skip the toggle button itself
            
            const mobileItem = item.cloneNode(true);
            mobileItem.className = 'block w-full text-left py-3 px-4 text-lg font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors';
            
            // Handle special styling for buttons
            if (item.tagName === 'BUTTON' || item.classList.contains('bg-indigo-600') || item.classList.contains('bg-green-600')) {
                mobileItem.className = 'block w-full text-center py-3 px-4 text-lg font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mb-2';
            }
            
            mobileNavContent.appendChild(mobileItem);
        });

        mobileMenu.appendChild(mobileNavContent);

        // Insert elements into DOM
        const navContainer = existingNav.querySelector('.flex');
        if (navContainer) {
            navContainer.appendChild(mobileToggle);
        }
        
        document.body.appendChild(overlay);
        document.body.appendChild(mobileMenu);

        // Store references
        this.toggle = mobileToggle;
        this.overlay = overlay;
        this.menu = mobileMenu;
        this.closeButton = closeButton;
    }

    bindEvents() {
        if (!this.toggle) return;

        // Toggle button click
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        // Close button click
        if (this.closeButton) {
            this.closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
            });
        }

        // Overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Close menu when clicking on navigation links
        if (this.menu) {
            this.menu.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    this.closeMenu();
                }
            });
        }
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        
        if (this.menu) {
            this.menu.classList.add('open');
        }
        
        if (this.overlay) {
            this.overlay.classList.add('open');
        }
        
        if (this.toggle) {
            this.toggle.setAttribute('aria-expanded', 'true');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        if (this.closeButton) {
            this.closeButton.focus();
        }
    }

    closeMenu() {
        this.isOpen = false;
        
        if (this.menu) {
            this.menu.classList.remove('open');
        }
        
        if (this.overlay) {
            this.overlay.classList.remove('open');
        }
        
        if (this.toggle) {
            this.toggle.setAttribute('aria-expanded', 'false');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        if (this.toggle) {
            this.toggle.focus();
        }
    }

    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth >= 768 && this.isOpen) {
            this.closeMenu();
        }
    }

    destroy() {
        if (this.menu) {
            this.menu.remove();
        }
        if (this.overlay) {
            this.overlay.remove();
        }
        if (this.toggle) {
            this.toggle.remove();
        }
    }
}

// Auto-initialize when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileNav = new MobileNavigation();
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}