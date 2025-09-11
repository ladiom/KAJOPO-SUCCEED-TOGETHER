// Search and Filter functionality with error handling
const searchFilter = {
    init() {
        try {
            this.setupEventListeners();
            this.loadFilters();
        } catch (error) {
            console.error('Search filter initialization error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Search filter initialization');
            }
        }
    },
    
    setupEventListeners() {
        try {
            // Search input
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
            }
            
            // Filter dropdowns
            const filters = ['categoryFilter', 'typeFilter', 'regionFilter'];
            filters.forEach(filterId => {
                const filter = document.getElementById(filterId);
                if (filter) {
                    filter.addEventListener('change', this.handleFilterChange.bind(this));
                }
            });
            
            // Sort dropdown
            const sortBy = document.getElementById('sortBy');
            if (sortBy) {
                sortBy.addEventListener('change', this.handleSortChange.bind(this));
            }
            
            // Clear filters button
            const clearBtn = document.getElementById('clearFilters');
            if (clearBtn) {
                clearBtn.addEventListener('click', this.clearAllFilters.bind(this));
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Setup event listeners');
            }
        }
    },
    
    loadFilters() {
        try {
            // Load filter options from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput && urlParams.get('search')) {
                searchInput.value = urlParams.get('search');
            }
            
            const filters = {
                categoryFilter: urlParams.get('category'),
                typeFilter: urlParams.get('type'),
                regionFilter: urlParams.get('region'),
                sortBy: urlParams.get('sort')
            };
            
            Object.entries(filters).forEach(([filterId, value]) => {
                const filter = document.getElementById(filterId);
                if (filter && value) {
                    filter.value = value;
                }
            });
            
            // Perform initial search if filters are present
            if (Object.values(filters).some(value => value) || urlParams.get('search')) {
                this.performSearch();
            }
        } catch (error) {
            console.error('Error loading filters:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Load filters');
            }
        }
    },
    
    handleSearch(event) {
        try {
            const searchTerm = event.target.value.trim();
            console.log('Searching for:', searchTerm);
            
            // Update URL with search parameter
            const url = new URL(window.location);
            if (searchTerm) {
                url.searchParams.set('search', searchTerm);
            } else {
                url.searchParams.delete('search');
            }
            window.history.replaceState({}, '', url);
            
            // Perform search
            this.performSearch();
            
            // Show search feedback
            if (typeof errorHandler !== 'undefined' && searchTerm) {
                errorHandler.showInfo(`Searching for "${searchTerm}"...`);
            }
        } catch (error) {
            console.error('Search error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Search');
            }
        }
    },
    
    handleFilterChange(event) {
        try {
            const filterId = event.target.id;
            const filterValue = event.target.value;
            
            console.log(`Filter ${filterId} changed to:`, filterValue);
            
            // Update URL with filter parameter
            const url = new URL(window.location);
            const paramMap = {
                categoryFilter: 'category',
                typeFilter: 'type',
                regionFilter: 'region'
            };
            
            const paramName = paramMap[filterId];
            if (paramName) {
                if (filterValue) {
                    url.searchParams.set(paramName, filterValue);
                } else {
                    url.searchParams.delete(paramName);
                }
                window.history.replaceState({}, '', url);
            }
            
            // Perform search
            this.performSearch();
        } catch (error) {
            console.error('Filter change error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Filter change');
            }
        }
    },
    
    handleSortChange(event) {
        try {
            const sortValue = event.target.value;
            console.log('Sort changed to:', sortValue);
            
            // Update URL with sort parameter
            const url = new URL(window.location);
            if (sortValue) {
                url.searchParams.set('sort', sortValue);
            } else {
                url.searchParams.delete('sort');
            }
            window.history.replaceState({}, '', url);
            
            // Perform search
            this.performSearch();
        } catch (error) {
            console.error('Sort change error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Sort change');
            }
        }
    },
    
    async performSearch() {
        try {
            // Get current filters
            const filters = this.getCurrentFilters();
            
            // Show loading state
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.innerHTML = '<span class="animate-pulse">Searching...</span>';
            }
            
            // This would typically make an API call
            // For now, we'll simulate the search with a delay
            console.log('Performing search with filters:', filters);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update results count (simulated)
            this.updateResultsCount(filters);
            
            // Trigger custom event for other components to listen to
            document.dispatchEvent(new CustomEvent('searchUpdated', {
                detail: { filters }
            }));
            
        } catch (error) {
            console.error('Search performance error:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Perform search');
            }
            
            // Reset results count on error
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.textContent = 'Error';
            }
        }
    },
    
    getCurrentFilters() {
        try {
            const searchInput = document.getElementById('searchInput');
            const categoryFilter = document.getElementById('categoryFilter');
            const typeFilter = document.getElementById('typeFilter');
            const regionFilter = document.getElementById('regionFilter');
            const sortBy = document.getElementById('sortBy');
            
            return {
                search: searchInput ? searchInput.value.trim() : '',
                category: categoryFilter ? categoryFilter.value : '',
                type: typeFilter ? typeFilter.value : '',
                region: regionFilter ? regionFilter.value : '',
                sort: sortBy ? sortBy.value : ''
            };
        } catch (error) {
            console.error('Error getting current filters:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Get current filters');
            }
            return {};
        }
    },
    
    updateResultsCount(filters) {
        try {
            // Get actual filtered count from opportunities manager
            let count = 0;
            
            if (typeof opportunityManager !== 'undefined') {
                const filteredOpportunities = opportunityManager.filterOpportunities(filters);
                count = filteredOpportunities.length;
            } else {
                // Fallback: get count from displayed opportunities
                const opportunityCards = document.querySelectorAll('#opportunitiesContainer .opportunity-card, #opportunitiesContainer .bg-gray-800');
                count = opportunityCards.length;
            }
            
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.textContent = count;
            }
            
            // Removed notification feedback to eliminate top-right notifications
        } catch (error) {
            console.error('Error updating results count:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Update results count');
            }
        }
    },
    
    clearAllFilters() {
        try {
            // Clear search input
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Reset all filter dropdowns
            const filters = ['categoryFilter', 'typeFilter', 'regionFilter', 'sortBy'];
            filters.forEach(filterId => {
                const filter = document.getElementById(filterId);
                if (filter) {
                    filter.value = '';
                }
            });
            
            // Clear URL parameters
            const url = new URL(window.location);
            url.search = '';
            window.history.replaceState({}, '', url);
            
            // Perform search with cleared filters
            this.performSearch();
            
            // Show success message
            if (typeof errorHandler !== 'undefined') {
                errorHandler.showSuccess('All filters cleared');
            }
            
            console.log('All filters cleared');
        } catch (error) {
            console.error('Error clearing filters:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError(error, 'Clear filters');
            }
        }
    },
    
    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = searchFilter;
}