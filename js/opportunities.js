/**
 * Kájọpọ̀ Connect Opportunities Management System
 * Handles opportunity creation, browsing, filtering, and applications
 */

class OpportunityManager {
    constructor() {
        this.opportunitiesKey = 'kajopo_opportunities';
        this.applicationsKey = 'kajopo_applications';
    }

    /**
     * Get all opportunities
     * @returns {Array} Array of opportunities
     */
    getAllOpportunities() {
        try {
            const opportunities = localStorage.getItem(this.opportunitiesKey);
            return opportunities ? JSON.parse(opportunities) : this.getDefaultOpportunities();
        } catch (error) {
            console.error('Error getting opportunities:', error);
            return this.getDefaultOpportunities();
        }
    }

    /**
     * Create new opportunity
     * @param {Object} opportunityData - Opportunity data
     * @returns {Object} Creation result
     */
    createOpportunity(opportunityData) {
        try {
            const opportunities = this.getAllOpportunities();
            
            const newOpportunity = {
                id: this.generateOpportunityId(),
                ...opportunityData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'active',
                applications: [],
                views: 0
            };

            opportunities.push(newOpportunity);
            localStorage.setItem(this.opportunitiesKey, JSON.stringify(opportunities));

            return { success: true, opportunity: newOpportunity };
        } catch (error) {
            console.error('Error creating opportunity:', error);
            return { success: false, message: 'Failed to create opportunity' };
        }
    }

    /**
     * Update opportunity
     * @param {string} opportunityId - Opportunity ID
     * @param {Object} updatedData - Updated data
     * @returns {Object} Update result
     */
    updateOpportunity(opportunityId, updatedData) {
        try {
            const opportunities = this.getAllOpportunities();
            const index = opportunities.findIndex(opp => opp.id === opportunityId);
            
            if (index === -1) {
                return { success: false, message: 'Opportunity not found' };
            }

            opportunities[index] = {
                ...opportunities[index],
                ...updatedData,
                updatedAt: Date.now()
            };

            localStorage.setItem(this.opportunitiesKey, JSON.stringify(opportunities));
            return { success: true, opportunity: opportunities[index] };
        } catch (error) {
            console.error('Error updating opportunity:', error);
            return { success: false, message: 'Failed to update opportunity' };
        }
    }

    /**
     * Delete opportunity
     * @param {string} opportunityId - Opportunity ID
     * @returns {Object} Deletion result
     */
    deleteOpportunity(opportunityId) {
        try {
            const opportunities = this.getAllOpportunities();
            const filteredOpportunities = opportunities.filter(opp => opp.id !== opportunityId);
            
            localStorage.setItem(this.opportunitiesKey, JSON.stringify(filteredOpportunities));
            return { success: true };
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            return { success: false, message: 'Failed to delete opportunity' };
        }
    }

    /**
     * Apply to opportunity
     * @param {string} opportunityId - Opportunity ID
     * @param {Object} applicationData - Application data
     * @returns {Object} Application result
     */
    applyToOpportunity(opportunityId, applicationData) {
        try {
            const applications = this.getAllApplications();
            
            // Check if user already applied
            const existingApplication = applications.find(
                app => app.opportunityId === opportunityId && app.userId === applicationData.userId
            );
            
            if (existingApplication) {
                return { success: false, message: 'You have already applied to this opportunity' };
            }

            const newApplication = {
                id: this.generateApplicationId(),
                opportunityId: opportunityId,
                ...applicationData,
                status: 'pending',
                submittedAt: Date.now()
            };

            applications.push(newApplication);
            localStorage.setItem(this.applicationsKey, JSON.stringify(applications));

            return { success: true, application: newApplication };
        } catch (error) {
            console.error('Error applying to opportunity:', error);
            return { success: false, message: 'Failed to submit application' };
        }
    }

    /**
     * Get all applications
     * @returns {Array} Array of applications
     */
    getAllApplications() {
        try {
            const applications = localStorage.getItem(this.applicationsKey);
            return applications ? JSON.parse(applications) : [];
        } catch (error) {
            console.error('Error getting applications:', error);
            return [];
        }
    }

    /**
     * Filter opportunities
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered opportunities
     */
    filterOpportunities(filters) {
        let opportunities = this.getAllOpportunities();

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            opportunities = opportunities.filter(opp => 
                opp.title.toLowerCase().includes(searchTerm) ||
                opp.description.toLowerCase().includes(searchTerm) ||
                opp.organization.toLowerCase().includes(searchTerm)
            );
        }

        if (filters.category && filters.category !== 'all') {
            opportunities = opportunities.filter(opp => opp.category === filters.category);
        }

        if (filters.type && filters.type !== 'all') {
            opportunities = opportunities.filter(opp => opp.type === filters.type);
        }

        if (filters.region && filters.region !== 'all') {
            opportunities = opportunities.filter(opp => opp.location === filters.region);
        }

        // Sort opportunities
        if (filters.sortBy) {
            opportunities.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'newest':
                        return b.createdAt - a.createdAt;
                    case 'oldest':
                        return a.createdAt - b.createdAt;
                    case 'deadline':
                        return new Date(a.deadline) - new Date(b.deadline);
                    case 'alphabetical':
                        return a.title.localeCompare(b.title);
                    default:
                        return b.createdAt - a.createdAt;
                }
            });
        }

        return opportunities;
    }

    /**
     * Generate unique opportunity ID
     * @returns {string} Unique ID
     */
    generateOpportunityId() {
        return 'opp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique application ID
     * @returns {string} Unique ID
     */
    generateApplicationId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get default sample opportunities
     * @returns {Array} Default opportunities
     */
    getDefaultOpportunities() {
        return [
            {
                id: 'opp_1',
                title: 'Youth Education Program Coordinator',
                organization: 'Lagos Education Initiative',
                category: 'Education',
                type: 'Volunteer',
                location: 'Lagos, Nigeria',
                description: 'Join our team to coordinate educational programs for underprivileged youth in Lagos communities.',
                requirements: ['Bachelor\'s degree in Education or related field', 'Experience working with youth', 'Strong communication skills'],
                deadline: '2024-04-15',
                duration: '6 months',
                commitment: 'Part-time (15-20 hours/week)',
                status: 'active',
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000,
                applications: [],
                views: 45
            },
            {
                id: 'opp_2',
                title: 'Community Health Outreach Volunteer',
                organization: 'HealthCare Access Nigeria',
                category: 'Healthcare',
                type: 'Volunteer',
                location: 'Abuja, Nigeria',
                description: 'Support community health initiatives and help provide healthcare access to rural communities.',
                requirements: ['Background in healthcare or public health', 'Willingness to travel', 'Local language proficiency'],
                deadline: '2024-04-20',
                duration: '3 months',
                commitment: 'Full-time',
                status: 'active',
                createdAt: Date.now() - 172800000,
                updatedAt: Date.now() - 172800000,
                applications: [],
                views: 32
            },
            {
                id: 'opp_3',
                title: 'Digital Skills Training Facilitator',
                organization: 'TechForGood Nigeria',
                category: 'Technology',
                type: 'Paid',
                location: 'Remote',
                description: 'Facilitate digital literacy programs for young entrepreneurs across Nigeria.',
                requirements: ['Expertise in digital tools and platforms', 'Teaching or training experience', 'Fluent in English and local languages'],
                deadline: '2024-05-01',
                duration: '4 months',
                commitment: 'Part-time (20-25 hours/week)',
                status: 'active',
                createdAt: Date.now() - 259200000,
                updatedAt: Date.now() - 259200000,
                applications: [],
                views: 67
            }
        ];
    }
}

// Global opportunity manager instance
const opportunityManager = new OpportunityManager();

// Global helper functions
function loadDynamicOpportunities() {
    const opportunities = opportunityManager.getAllOpportunities();
    const container = document.getElementById('opportunitiesContainer');
    
    if (!container) return;

    container.innerHTML = '';
    
    opportunities.forEach(opportunity => {
        const card = createOpportunityCard(opportunity);
        container.appendChild(card);
    });

    updateResultsCount(opportunities.length);
}

function createOpportunityCard(opportunity) {
    const card = document.createElement('div');
    card.className = 'opportunity-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    
    const typeClass = opportunity.type === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">${opportunity.title}</h3>
                <p class="text-gray-600 mb-2">${opportunity.organization}</p>
                <div class="flex flex-wrap gap-2 mb-3">
                    <span class="px-3 py-1 ${typeClass} text-sm rounded-full">${opportunity.type}</span>
                    <span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">${opportunity.category}</span>
                    <span class="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">${opportunity.location}</span>
                </div>
            </div>
        </div>
        <p class="text-gray-700 mb-4 line-clamp-3">${opportunity.description}</p>
        <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
                <p>Deadline: ${new Date(opportunity.deadline).toLocaleDateString()}</p>
                <p>Duration: ${opportunity.duration}</p>
            </div>
            <button class="apply-now-btn bg-kajopo-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors" 
                    data-opportunity-id="${opportunity.id}">
                Apply Now
            </button>
        </div>
    `;
    
    return card;
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} opportunities found`;
    }
}

function filterOpportunities() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const regionFilter = document.getElementById('regionFilter');
    const sortBy = document.getElementById('sortBy');

    const filters = {
        search: searchInput ? searchInput.value : '',
        category: categoryFilter ? categoryFilter.value : 'all',
        type: typeFilter ? typeFilter.value : 'all',
        region: regionFilter ? regionFilter.value : 'all',
        sortBy: sortBy ? sortBy.value : 'newest'
    };

    const filteredOpportunities = opportunityManager.filterOpportunities(filters);
    
    const container = document.getElementById('opportunitiesContainer');
    if (container) {
        container.innerHTML = '';
        filteredOpportunities.forEach(opportunity => {
            const card = createOpportunityCard(opportunity);
            container.appendChild(card);
        });
    }

    updateResultsCount(filteredOpportunities.length);
}

function setupApplyNowButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('apply-now-btn')) {
            e.preventDefault();
            const opportunityId = e.target.getAttribute('data-opportunity-id');
            
            // Check if user is authenticated
            const user = checkUserAuth();
            if (!user) {
                alert('Please sign in to apply for opportunities.');
                window.location.href = 'signin-form.html';
                return;
            }
            
            // Redirect to application form
            window.location.href = `application-form.html?opportunity=${opportunityId}`;
        }
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpportunityManager, opportunityManager };
}