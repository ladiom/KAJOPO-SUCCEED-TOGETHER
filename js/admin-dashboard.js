// Admin Dashboard JavaScript
// Handles user management, opportunities, and dashboard analytics

class AdminDashboard {
    constructor() {
        this.currentView = 'users';
        this.supabase = null;
        this.dataManager = null;
        this.allUsers = [];
        this.filteredUsers = [];
        this.allApplications = [];
        this.filteredApplications = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.typeFilter = 'all';
        this.applicationSearchTerm = '';
        this.applicationStatusFilter = 'all';
        this.applicationTypeFilter = 'all';
        this.init();
    }

    async init() {
        try {
            console.log('Starting admin dashboard initialization...');
            
            // Wait for Supabase to be available
            await this.waitForSupabase();
            console.log('Supabase client available');
            
            this.supabase = window.supabase;
            this.dataManager = window.dataManager;
            
            console.log('Supabase client:', this.supabase);
            console.log('Data manager:', this.dataManager);
            
            this.setupEventListeners();
            this.loadUsersView(); // Default view
            console.log('Admin Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    async waitForSupabase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkSupabase = () => {
                if (window.supabase) {
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkSupabase, 100);
                } else {
                    reject(new Error('Supabase not available'));
                }
            };
            
            checkSupabase();
        });
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('users-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchView('users');
        });

        document.getElementById('opportunities-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchView('opportunities');
        });

        document.getElementById('applications-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchView('applications');
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    switchView(view) {
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.getElementById(`${view}-nav`)?.classList.add('active');
        this.currentView = view;

        // Load appropriate view
        if (view === 'users') {
            this.loadUsersView();
        } else if (view === 'opportunities') {
            this.loadOpportunitiesView();
        } else if (view === 'applications') {
            this.loadApplicationsView();
        }
    }

    async loadUsersView() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Users Management</h2>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Total Users</h3>
                        <p class="text-3xl font-bold text-kajopo-blue" id="total-users">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Seekers</h3>
                        <p class="text-3xl font-bold text-kajopo-green" id="total-seekers">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Providers</h3>
                        <p class="text-3xl font-bold text-kajopo-purple" id="total-providers">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Confirmed</h3>
                        <p class="text-3xl font-bold text-green-600" id="confirmed-users">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Pending</h3>
                        <p class="text-3xl font-bold text-yellow-600" id="pending-users">Loading...</p>
                    </div>
                </div>

                <!-- Search and Filter -->
                <div class="bg-white rounded-lg shadow mb-6 p-4">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1 max-w-md">
                            <div class="relative">
                                <input type="text" id="user-search" placeholder="Search users by name, email, or type..." 
                                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg class="h-5 w-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                            </select>
                            <select id="type-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <option value="all">All Types</option>
                                <option value="seeker">Seekers</option>
                                <option value="provider">Providers</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions -->
                <div class="bg-white rounded-lg shadow mb-6 p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <label class="flex items-center">
                                <input type="checkbox" id="select-all-pending" class="rounded border-gray-300 text-kajopo-blue focus:ring-kajopo-blue">
                                <span class="ml-2 text-sm text-gray-700">Select All</span>
                            </label>
                            <span id="selected-count" class="text-sm text-gray-500">0 selected</span>
                        </div>
                        <div class="flex space-x-2">
                            <button id="bulk-process-btn" class="px-6 py-2 bg-kajopo-blue text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium" disabled>
                                Process Selected (<span id="bulk-count">0</span>)
                            </button>
                            <button id="bulk-admin-btn" class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium" disabled>
                                Manage Admin Roles (<span id="bulk-admin-count">0</span>)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">All Users</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input type="checkbox" id="select-all-checkbox" class="rounded border-gray-300 text-kajopo-blue focus:ring-kajopo-blue">
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="name">
                                        <div class="flex items-center space-x-1">
                                            <span>Name</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="email">
                                        <div class="flex items-center space-x-1">
                                            <span>Email</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="type">
                                        <div class="flex items-center space-x-1">
                                            <span>Type</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="status">
                                        <div class="flex items-center space-x-1">
                                            <span>Status</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="joined">
                                        <div class="flex items-center space-x-1">
                                            <span>Joined</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Loading users...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Load users data
        await this.loadUsersData();
    }

    async loadOpportunitiesView() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Opportunities Management</h2>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Total Opportunities</h3>
                        <p class="text-3xl font-bold text-kajopo-blue" id="total-opportunities">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Active</h3>
                        <p class="text-3xl font-bold text-kajopo-green" id="active-opportunities">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Paid</h3>
                        <p class="text-3xl font-bold text-kajopo-purple" id="paid-opportunities">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Volunteer</h3>
                        <p class="text-3xl font-bold text-kajopo-orange" id="volunteer-opportunities">Loading...</p>
                    </div>
                </div>

                <!-- Opportunities Table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">All Opportunities</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="opportunities-table-body" class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Loading opportunities...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Load opportunities data
        await this.loadOpportunitiesData();
    }

    async loadApplicationsView() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-4">Applications Management</h2>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Total Applications</h3>
                        <p class="text-3xl font-bold text-kajopo-blue" id="total-applications">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Pending</h3>
                        <p class="text-3xl font-bold text-yellow-600" id="pending-applications">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Approved</h3>
                        <p class="text-3xl font-bold text-green-600" id="approved-applications">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">Rejected</h3>
                        <p class="text-3xl font-bold text-red-600" id="rejected-applications">Loading...</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow">
                        <h3 class="text-lg font-semibold text-gray-700">This Week</h3>
                        <p class="text-3xl font-bold text-kajopo-purple" id="weekly-applications">Loading...</p>
                    </div>
                </div>

                <!-- Search and Filter -->
                <div class="bg-white rounded-lg shadow mb-6 p-4">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1 max-w-md">
                            <div class="relative">
                                <input type="text" id="application-search" placeholder="Search applications by name, email, or opportunity..." 
                                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg class="h-5 w-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <select id="application-status-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select id="application-type-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:ring-kajopo-blue focus:border-kajopo-blue bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <option value="all">All Types</option>
                                <option value="paid">Paid</option>
                                <option value="volunteer">Volunteer</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Applications Table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">All Applications</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="full_name">
                                        <div class="flex items-center space-x-1">
                                            <span>Applicant</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="status">
                                        <div class="flex items-center space-x-1">
                                            <span>Status</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" data-sort="created_at">
                                        <div class="flex items-center space-x-1">
                                            <span>Applied</span>
                                            <svg class="w-4 h-4 sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                            </svg>
                                        </div>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="applications-table-body" class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Loading applications...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Load applications data
        await this.loadApplicationsData();
        
        // Setup search and filter event listeners
        this.setupApplicationSearchAndFilter();
    }

    async loadUsersData() {
        try {
            const users = await this.dataManager.getUsers();
            console.log('Admin dashboard - loaded users:', users);
            console.log('Admin dashboard - user count:', users ? users.length : 0);
            
            // Store all users
            this.allUsers = users;
            
            // Apply filters and sorting
            this.applyFiltersAndSort();
            
            // Update stats
            const totalUsers = this.allUsers.length;
            const seekers = this.allUsers.filter(u => (u.account_type || u.accountType) === 'seeker').length;
            const providers = this.allUsers.filter(u => (u.account_type || u.accountType) === 'provider').length;
            const confirmedUsers = this.allUsers.filter(u => u.verified || u.isverified === true || u.email_confirmed_at).length;
            const pendingUsers = totalUsers - confirmedUsers;
            
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-seekers').textContent = seekers;
            document.getElementById('total-providers').textContent = providers;
            
            // Update confirmation stats if elements exist
            const confirmedElement = document.getElementById('confirmed-users');
            const pendingElement = document.getElementById('pending-users');
            if (confirmedElement) confirmedElement.textContent = confirmedUsers;
            if (pendingElement) pendingElement.textContent = pendingUsers;
            
            // Update table
            this.renderUsersTable();
            
            // Setup bulk action event listeners
            this.setupBulkActions();
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users data');
        }
    }

    applyFiltersAndSort() {
        // Apply search filter
        let filtered = this.allUsers.filter(user => {
            const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || '');
            const searchText = `${fullName} ${user.email} ${user.account_type || user.accountType || ''}`.toLowerCase();
            return searchText.includes(this.searchTerm.toLowerCase());
        });

        // Apply status filter
        if (this.statusFilter !== 'all') {
            filtered = filtered.filter(user => {
                const isConfirmed = user.verified || user.isverified === true || user.email_confirmed_at;
                return this.statusFilter === 'confirmed' ? isConfirmed : !isConfirmed;
            });
        }

        // Apply type filter
        if (this.typeFilter !== 'all') {
            filtered = filtered.filter(user => (user.account_type || user.accountType) === this.typeFilter);
        }

        // Apply sorting
        if (this.sortColumn) {
            filtered.sort((a, b) => {
                let aValue, bValue;
                
                switch (this.sortColumn) {
                    case 'name':
                        aValue = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : (a.name || '')).toLowerCase();
                        bValue = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : (b.name || '')).toLowerCase();
                        break;
                    case 'email':
                        aValue = (a.email || '').toLowerCase();
                        bValue = (b.email || '').toLowerCase();
                        break;
                    case 'type':
                        aValue = (a.accountType || '').toLowerCase();
                        bValue = (b.accountType || '').toLowerCase();
                        break;
                    case 'status':
                        const aConfirmed = a.isverified === true || a.email_confirmed_at;
                        const bConfirmed = b.isverified === true || b.email_confirmed_at;
                        aValue = aConfirmed ? 'confirmed' : 'pending';
                        bValue = bConfirmed ? 'confirmed' : 'pending';
                        break;
                    case 'joined':
                        aValue = new Date(a.created_at || 0);
                        bValue = new Date(b.created_at || 0);
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        this.filteredUsers = filtered;
    }

    renderUsersTable() {
            const tbody = document.getElementById('users-table-body');
        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
                return;
            }
        
        tbody.innerHTML = this.filteredUsers.map(user => {
            const isConfirmed = user.isverified === true || user.email_confirmed_at;
            const fullName = user.first_name && user.last_name ? 
                `${user.first_name} ${user.last_name}` : 
                (user.firstName && user.lastName ? 
                    `${user.firstName} ${user.lastName}` : 
                    (user.name || user.email || 'N/A'));
            
            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="user-checkbox rounded border-gray-300 text-kajopo-blue focus:ring-kajopo-blue" 
                           data-user-id="${user.id}" data-user-email="${user.email}" 
                           ${!isConfirmed ? '' : 'disabled'}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${fullName}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.email}</div>
                    </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (user.account_type || user.accountType) === 'admin' ? 'bg-red-100 text-red-800' :
                        (user.account_type || user.accountType) === 'seeker' ? 'bg-green-100 text-green-800' : 
                        'bg-purple-100 text-purple-800'
                    }">
                        ${user.account_type || user.accountType || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${isConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${!isConfirmed ? `<button onclick="adminDashboard.confirmUser('${user.id}', '${user.email}')" class="text-green-600 hover:text-green-900 mr-2">Confirm</button>` : ''}
                    <button onclick="adminDashboard.viewUser('${user.id}')" class="text-kajopo-blue hover:text-kajopo-purple mr-2">View</button>
                        <button onclick="adminDashboard.deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                </tr>
        `;
        }).join('');
    }

    setupBulkActions() {
        // Select all pending users checkbox
        const selectAllPending = document.getElementById('select-all-pending');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        const bulkProcessBtn = document.getElementById('bulk-process-btn');
        const selectedCount = document.getElementById('selected-count');
        const bulkCount = document.getElementById('bulk-count');

        // Select all visible users
        if (selectAllPending) {
            selectAllPending.addEventListener('change', (e) => {
                userCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateBulkActions();
            });
        }

        // Select all checkbox
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                userCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateBulkActions();
            });
        }

        // Individual checkboxes
        userCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBulkActions();
            });
        });

        // Bulk process button
        if (bulkProcessBtn) {
            bulkProcessBtn.addEventListener('click', () => {
                this.bulkProcessUsers();
            });
        }

        // Bulk admin management button
        const bulkAdminBtn = document.getElementById('bulk-admin-btn');
        if (bulkAdminBtn) {
            bulkAdminBtn.addEventListener('click', () => {
                this.bulkManageAdminRoles();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFiltersAndSort();
                this.renderUsersTable();
                this.updateBulkActions();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.applyFiltersAndSort();
                this.renderUsersTable();
                this.updateBulkActions();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.typeFilter = e.target.value;
                this.applyFiltersAndSort();
                this.renderUsersTable();
                this.updateBulkActions();
            });
        }

        // Column sorting
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortByColumn(column);
            });
        });
    }

    sortByColumn(column) {
        if (this.sortColumn === column) {
            // Toggle direction if same column
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        this.updateSortIndicators();

        // Apply sorting and re-render
        this.applyFiltersAndSort();
        this.renderUsersTable();
        this.updateBulkActions();
    }

    updateSortIndicators() {
        // Reset all sort indicators
        document.querySelectorAll('[data-sort]').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            icon.style.display = 'block';
            icon.style.opacity = '0.5';
        });

        // Highlight current sort column
        const currentHeader = document.querySelector(`[data-sort="${this.sortColumn}"]`);
        if (currentHeader) {
            const icon = currentHeader.querySelector('.sort-icon');
            icon.style.opacity = '1';
            
            // Update icon based on sort direction
            if (this.sortDirection === 'asc') {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
            } else {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
            }
        }
    }

    updateBulkActions() {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        const bulkProcessBtn = document.getElementById('bulk-process-btn');
        const bulkAdminBtn = document.getElementById('bulk-admin-btn');
        const selectedCount = document.getElementById('selected-count');
        const bulkCount = document.getElementById('bulk-count');
        const bulkAdminCount = document.getElementById('bulk-admin-count');

        const selectedCountNum = selectedCheckboxes.length;
        const totalVisible = userCheckboxes.length;

        if (selectedCount) selectedCount.textContent = `${selectedCountNum} selected`;
        if (bulkCount) bulkCount.textContent = selectedCountNum;
        if (bulkAdminCount) bulkAdminCount.textContent = selectedCountNum;

        const hasSelection = selectedCountNum > 0;
        if (bulkProcessBtn) {
            bulkProcessBtn.disabled = !hasSelection;
        }
        if (bulkAdminBtn) {
            bulkAdminBtn.disabled = !hasSelection;
        }

        // Update select all checkbox state
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            if (selectedCountNum === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (selectedCountNum === totalVisible) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    async bulkProcessUsers() {
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            this.showError('No users selected');
            return;
        }

        // Analyze selected users
        const selectedUsers = Array.from(selectedCheckboxes).map(cb => {
            const user = this.filteredUsers.find(u => u.id === cb.dataset.userId);
            return {
                id: cb.dataset.userId,
                email: cb.dataset.userEmail,
                isConfirmed: user && (user.isverified === true || user.email_confirmed_at),
                user: user
            };
        });

        const pendingUsers = selectedUsers.filter(u => !u.isConfirmed);
        const confirmedUsers = selectedUsers.filter(u => u.isConfirmed);
        const adminUsers = selectedUsers.filter(u => u.user && u.user.accountType === 'admin');
        const nonAdminUsers = selectedUsers.filter(u => u.user && u.user.accountType !== 'admin');

        // Determine what actions are needed
        let actionText = '';
        let warningText = '';
        
        if (pendingUsers.length > 0 && confirmedUsers.length > 0) {
            actionText = `Process ${selectedUsers.length} users`;
            warningText = `This will:\n• Confirm ${pendingUsers.length} pending user(s)\n• Delete ${confirmedUsers.length} confirmed user(s)\n\n⚠️ WARNING: Deletion is PERMANENT and cannot be undone!`;
        } else if (pendingUsers.length > 0) {
            actionText = `Confirm ${pendingUsers.length} user(s)`;
            warningText = `This will confirm ${pendingUsers.length} pending user(s) and allow them to access the platform.`;
        } else if (confirmedUsers.length > 0) {
            actionText = `Delete ${confirmedUsers.length} user(s)`;
            warningText = `⚠️ WARNING: This will PERMANENTLY DELETE ${confirmedUsers.length} user(s)!\n\nThis action cannot be undone and will remove all user data from the database.`;
        }

        // Add admin-specific warnings
        if (adminUsers.length > 0) {
            warningText += `\n\n🔐 ADMIN USERS: ${adminUsers.length} admin user(s) selected. Be careful when modifying admin accounts!`;
        }

        // Show detailed confirmation
        const userList = selectedUsers.map(u => `• ${u.email} (${u.isConfirmed ? 'Confirmed' : 'Pending'})`).join('\n');
        
        if (!confirm(`${actionText}\n\n${warningText}\n\nUsers to be processed:\n${userList}\n\nAre you sure you want to continue?`)) {
            return;
        }

        // Show loading state
        const bulkProcessBtn = document.getElementById('bulk-process-btn');
        const originalText = bulkProcessBtn.innerHTML;
        bulkProcessBtn.innerHTML = 'Processing...';
        bulkProcessBtn.disabled = true;

        try {
            let confirmCount = 0;
            let deleteCount = 0;
            const errors = [];

            // Process confirmations
            if (pendingUsers.length > 0) {
                for (const user of pendingUsers) {
                    try {
                        // Update auth.users table
                        const { error: authError } = await this.supabase.auth.admin.updateUserById(user.id, {
                            email_confirm: true
                        });

                        if (authError) {
                            console.error(`Error confirming user ${user.email}:`, authError);
                            errors.push(`${user.email}: ${authError.message}`);
                            continue;
                        }

                        // Update public.users table
                        const { error: publicError } = await this.supabase
                            .from('users')
                            .update({ isverified: true })
                            .eq('id', user.id);

                        if (publicError) {
                            console.error(`Error updating user ${user.email}:`, publicError);
                            errors.push(`${user.email}: ${publicError.message}`);
                            continue;
                        }

                        confirmCount++;
                    } catch (error) {
                        console.error(`Error processing user ${user.email}:`, error);
                        errors.push(`${user.email}: ${error.message}`);
                    }
                }
            }

            // Process deletions
            if (confirmedUsers.length > 0) {
                for (const user of confirmedUsers) {
                    try {
                        // Delete from public.users table first
                        const { error: publicError } = await this.supabase
                            .from('users')
                            .delete()
                            .eq('id', user.id);

                        if (publicError) {
                            console.error(`Error deleting user ${user.email} from public.users:`, publicError);
                            errors.push(`${user.email}: ${publicError.message}`);
                            continue;
                        }

                        // Delete from auth.users table
                        const { error: authError } = await this.supabase.auth.admin.deleteUser(user.id);
                        
                        if (authError) {
                            console.error(`Error deleting user ${user.email} from auth.users:`, authError);
                            errors.push(`${user.email}: ${authError.message}`);
                        } else {
                            deleteCount++;
                        }
                    } catch (error) {
                        console.error(`Error deleting user ${user.email}:`, error);
                        errors.push(`${user.email}: ${error.message}`);
                    }
                }
            }

            // Show results
            let resultMessage = '';
            if (confirmCount > 0) {
                resultMessage += `✅ Successfully confirmed ${confirmCount} user(s)\n`;
            }
            if (deleteCount > 0) {
                resultMessage += `✅ Successfully deleted ${deleteCount} user(s)\n`;
            }
            if (errors.length > 0) {
                resultMessage += `❌ Errors: ${errors.join('; ')}`;
            }

            if (confirmCount > 0 || deleteCount > 0) {
                this.showSuccess(resultMessage);
            }
            
            if (errors.length > 0) {
                this.showError(`Some operations failed: ${errors.join('; ')}`);
            }

            // Refresh the users list
            if (this.currentView === 'users') {
                await this.loadUsersData();
            }

        } catch (error) {
            console.error('Error in bulk process:', error);
            this.showError('Failed to process users: ' + error.message);
        } finally {
            // Restore button state
            bulkProcessBtn.innerHTML = originalText;
            bulkProcessBtn.disabled = false;
        }
    }

    async bulkManageAdminRoles() {
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            this.showError('No users selected');
            return;
        }

        // Analyze selected users
        const selectedUsers = Array.from(selectedCheckboxes).map(cb => {
            const user = this.filteredUsers.find(u => u.id === cb.dataset.userId);
            return {
                id: cb.dataset.userId,
                email: cb.dataset.userEmail,
                isAdmin: user && user.accountType === 'admin',
                user: user
            };
        });

        const adminUsers = selectedUsers.filter(u => u.isAdmin);
        const nonAdminUsers = selectedUsers.filter(u => !u.isAdmin);

        // Show role management options
        let actionOptions = '';
        if (adminUsers.length > 0) {
            actionOptions += `\n• Remove admin privileges from ${adminUsers.length} user(s)`;
        }
        if (nonAdminUsers.length > 0) {
            actionOptions += `\n• Grant admin privileges to ${nonAdminUsers.length} user(s)`;
        }

        const action = prompt(`Admin Role Management\n\nSelected users: ${selectedUsers.length}\n\nAvailable actions:${actionOptions}\n\nEnter action:\n1 - Grant admin privileges to non-admins\n2 - Remove admin privileges from admins\n3 - Cancel`, '3');

        if (!action || action === '3') {
            return;
        }

        let usersToProcess = [];
        let newRole = '';
        let actionText = '';

        if (action === '1' && nonAdminUsers.length > 0) {
            usersToProcess = nonAdminUsers;
            newRole = 'admin';
            actionText = `Grant admin privileges to ${nonAdminUsers.length} user(s)`;
        } else if (action === '2' && adminUsers.length > 0) {
            usersToProcess = adminUsers;
            newRole = 'seeker'; // Default to seeker when removing admin
            actionText = `Remove admin privileges from ${adminUsers.length} user(s)`;
        } else {
            this.showError('No valid users for the selected action');
            return;
        }

        // Confirm the action
        const userList = usersToProcess.map(u => `• ${u.email}`).join('\n');
        if (!confirm(`${actionText}\n\nUsers to be modified:\n${userList}\n\nAre you sure you want to continue?`)) {
            return;
        }

        // Show loading state
        const bulkAdminBtn = document.getElementById('bulk-admin-btn');
        const originalText = bulkAdminBtn.innerHTML;
        bulkAdminBtn.innerHTML = 'Updating Roles...';
        bulkAdminBtn.disabled = true;

        try {
            let successCount = 0;
            const errors = [];

            // Update user roles
            for (const user of usersToProcess) {
                try {
                    const { error } = await this.supabase
                        .from('users')
                        .update({ accountType: newRole })
                        .eq('id', user.id);

                    if (error) {
                        console.error(`Error updating role for ${user.email}:`, error);
                        errors.push(`${user.email}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Error updating role for ${user.email}:`, error);
                    errors.push(`${user.email}: ${error.message}`);
                }
            }

            // Show results
            if (successCount > 0) {
                this.showSuccess(`✅ Successfully updated ${successCount} user role(s)`);
            }
            
            if (errors.length > 0) {
                this.showError(`Some updates failed: ${errors.join('; ')}`);
            }

            // Refresh the users list
            if (this.currentView === 'users') {
                await this.loadUsersData();
            }

        } catch (error) {
            console.error('Error in bulk admin management:', error);
            this.showError('Failed to update user roles: ' + error.message);
        } finally {
            // Restore button state
            bulkAdminBtn.innerHTML = originalText;
            bulkAdminBtn.disabled = false;
        }
    }

    async loadOpportunitiesData() {
        try {
            const result = await this.dataManager.getOpportunities();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch opportunities');
            }
            
            const opportunities = result.data || [];
            
            // Update stats
            const totalOpportunities = opportunities.length;
            const activeOpportunities = opportunities.filter(o => o.status === 'active').length;
            const paidOpportunities = opportunities.filter(o => o.type === 'Paid' || o.type === 'paid').length;
            const volunteerOpportunities = opportunities.filter(o => o.type === 'Volunteer' || o.type === 'volunteer').length;
            
            document.getElementById('total-opportunities').textContent = totalOpportunities;
            document.getElementById('active-opportunities').textContent = activeOpportunities;
            document.getElementById('paid-opportunities').textContent = paidOpportunities;
            document.getElementById('volunteer-opportunities').textContent = volunteerOpportunities;
            
            // Update table
            const tbody = document.getElementById('opportunities-table-body');
            if (opportunities.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No opportunities found</td></tr>';
                return;
            }
            
            tbody.innerHTML = opportunities.map(opp => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${opp.title}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${opp.organization}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${opp.category}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            opp.type === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }">
                            ${opp.type}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            opp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }">
                            ${opp.status || 'active'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${opp.created_at ? new Date(opp.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="adminDashboard.viewOpportunity('${opp.id}')" class="text-kajopo-blue hover:text-kajopo-purple mr-3">View</button>
                        <button onclick="adminDashboard.deleteOpportunity('${opp.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                </tr>
            `).join('');
            
        } catch (error) {
            console.error('Error loading opportunities:', error);
            this.showError('Failed to load opportunities data');
        }
    }

    async loadApplicationsData() {
        try {
            console.log('Loading applications data...');
            console.log('Supabase client:', this.supabase);
            
            // Get all applications with opportunity details
            const { data: applications, error } = await this.supabase
                .from('applications')
                .select(`
                    *,
                    opportunities!applications_opportunity_id_fkey (
                        title,
                        organization,
                        type,
                        category
                    )
                `)
                .order('created_at', { ascending: false });
            
            console.log('Applications query result:', { data: applications, error });
            
            if (error) {
                console.error('Applications query error:', error);
                throw new Error(error.message);
            }
            
            const apps = applications || [];
            console.log('Found applications:', apps.length);
            this.allApplications = apps;
            
            // Apply current filters
            this.filterApplications();
            
            // Calculate stats from all applications (not filtered)
            const totalApplications = apps.length;
            const pendingApplications = apps.filter(app => app.status === 'pending').length;
            const approvedApplications = apps.filter(app => app.status === 'approved').length;
            const rejectedApplications = apps.filter(app => app.status === 'rejected').length;
            
            // Calculate weekly applications
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyApplications = apps.filter(app => {
                const appDate = new Date(app.created_at);
                return appDate >= oneWeekAgo;
            }).length;
            
            // Update stats cards
            document.getElementById('total-applications').textContent = totalApplications;
            document.getElementById('pending-applications').textContent = pendingApplications;
            document.getElementById('approved-applications').textContent = approvedApplications;
            document.getElementById('rejected-applications').textContent = rejectedApplications;
            document.getElementById('weekly-applications').textContent = weeklyApplications;
            
            // Update table with filtered applications
            this.renderApplicationsTable();
            
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showError('Failed to load applications data');
        }
    }

    async viewUser(userId) {
        try {
            const user = await this.dataManager.getUserById(userId);
            const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'N/A');
            alert(`User Details:\n\nName: ${fullName}\nEmail: ${user.email}\nType: ${user.accountType || 'N/A'}\nPhone: ${user.phone || 'N/A'}\nJoined: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`);
        } catch (error) {
            console.error('Error viewing user:', error);
            this.showError('Failed to load user details');
        }
    }

    async confirmUser(userId, email) {
        if (!confirm(`Are you sure you want to confirm ${email}?`)) {
            return;
        }
        
        try {
            // Generate SQL command for confirmation
            const sql = `
-- Run this in your Supabase SQL Editor to confirm the user:

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE id = '${userId}';

-- Also update the public.users table
UPDATE users 
SET isverified = true
WHERE id = '${userId}';

-- Verify the result
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE id = '${userId}';
            `;
            
            // Show SQL command to admin
            this.showNotification(`SQL to confirm ${email}:`, 'info');
            this.showNotification(`<pre>${sql}</pre>`, 'info');
            
            // Copy to clipboard
            navigator.clipboard.writeText(sql).then(() => {
                this.showSuccess('SQL copied to clipboard! Please run it in your Supabase SQL Editor.');
            }).catch(err => {
                console.error('Failed to copy SQL:', err);
                this.showError('Failed to copy SQL to clipboard');
            });
            
        } catch (error) {
            console.error('Error confirming user:', error);
            this.showError('Failed to generate confirmation SQL');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Delete from public.users table first
            const { error: publicError } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (publicError) {
                console.error('Error deleting user from public.users:', publicError);
                this.showError('Failed to delete user from database: ' + publicError.message);
                return;
            }

            // Delete from auth.users table
            const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);
            
            if (authError) {
                console.error('Error deleting user from auth.users:', authError);
                this.showError('Failed to delete user from authentication: ' + authError.message);
                return;
            }

            this.showSuccess('User deleted successfully');
            if (this.currentView === 'users') {
                await this.loadUsersData();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Failed to delete user: ' + error.message);
        }
    }

    async viewOpportunity(opportunityId) {
        try {
            const opportunity = await this.dataManager.getOpportunityById(opportunityId);
            alert(`Opportunity Details:\n\nTitle: ${opportunity.title}\nOrganization: ${opportunity.organization}\nCategory: ${opportunity.category}\nType: ${opportunity.type}\nLocation: ${opportunity.location}\nDeadline: ${opportunity.deadline || 'N/A'}\nStatus: ${opportunity.status || 'active'}`);
        } catch (error) {
            console.error('Error viewing opportunity:', error);
            this.showError('Failed to load opportunity details');
        }
    }

    async deleteOpportunity(opportunityId) {
        if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.dataManager.deleteOpportunity(opportunityId);
            this.showSuccess('Opportunity deleted successfully');
            if (this.currentView === 'opportunities') {
                await this.loadOpportunitiesData();
            }
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            this.showError('Failed to delete opportunity');
        }
    }

    async logout() {
        try {
            if (window.unifiedAuth) {
                await window.unifiedAuth.logout();
            }
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            window.location.href = 'admin-login.html';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' : 
            type === 'success' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    setupApplicationSearchAndFilter() {
        // Search input
        const searchInput = document.getElementById('application-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.applicationSearchTerm = e.target.value.toLowerCase();
                this.filterApplications();
                this.renderApplicationsTable();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('application-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.applicationStatusFilter = e.target.value;
                this.filterApplications();
                this.renderApplicationsTable();
            });
        }

        // Type filter
        const typeFilter = document.getElementById('application-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.applicationTypeFilter = e.target.value;
                this.filterApplications();
                this.renderApplicationsTable();
            });
        }

        // Sortable columns
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortApplications(column);
            });
        });
    }

    filterApplications() {
        this.filteredApplications = this.allApplications.filter(app => {
            // Search filter
            const matchesSearch = !this.applicationSearchTerm || 
                (app.full_name && app.full_name.toLowerCase().includes(this.applicationSearchTerm)) ||
                (app.email && app.email.toLowerCase().includes(this.applicationSearchTerm)) ||
                (app.opportunities?.title && app.opportunities.title.toLowerCase().includes(this.applicationSearchTerm)) ||
                (app.opportunities?.organization && app.opportunities.organization.toLowerCase().includes(this.applicationSearchTerm));

            // Status filter
            const matchesStatus = this.applicationStatusFilter === 'all' || 
                app.status === this.applicationStatusFilter;

            // Type filter
            const matchesType = this.applicationTypeFilter === 'all' || 
                app.opportunities?.type?.toLowerCase() === this.applicationTypeFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesType;
        });
    }

    sortApplications(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredApplications.sort((a, b) => {
            let aValue, bValue;

            switch (column) {
                case 'full_name':
                    aValue = a.full_name || '';
                    bValue = b.full_name || '';
                    break;
                case 'status':
                    aValue = a.status || '';
                    bValue = b.status || '';
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at || 0);
                    bValue = new Date(b.created_at || 0);
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderApplicationsTable();
    }

    renderApplicationsTable() {
        const tbody = document.getElementById('applications-table-body');
        if (!tbody) return;

        if (this.filteredApplications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No applications found</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredApplications.map(app => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${app.full_name || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${app.email || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${app.opportunities?.title || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${app.opportunities?.organization || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">
                        ${app.status || 'pending'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewApplication('${app.id}')" class="text-kajopo-blue hover:text-kajopo-purple mr-3">View</button>
                    <button onclick="adminDashboard.updateApplicationStatus('${app.id}', 'approved')" class="text-green-600 hover:text-green-900 mr-3">Approve</button>
                    <button onclick="adminDashboard.updateApplicationStatus('${app.id}', 'rejected')" class="text-red-600 hover:text-red-900">Reject</button>
                </td>
            </tr>
        `).join('');
    }

    async viewApplication(applicationId) {
        try {
            const { data: application, error } = await this.supabase
                .from('applications')
                .select(`
                    *,
                    opportunities (
                        title,
                        organization,
                        type,
                        category,
                        description
                    )
                `)
                .eq('id', applicationId)
                .single();
            
            if (error) {
                throw new Error(error.message);
            }
            
            const opp = application.opportunities;
            const message = application.message || 'No message provided';
            
            alert(`Application Details:
            
Applicant: ${application.full_name || 'N/A'}
Email: ${application.email || 'N/A'}
Phone: ${application.phone || 'N/A'}

Opportunity: ${opp?.title || 'N/A'}
Organization: ${opp?.organization || 'N/A'}
Type: ${opp?.type || 'N/A'}
Category: ${opp?.category || 'N/A'}

Status: ${application.status || 'pending'}
Applied: ${application.created_at ? new Date(application.created_at).toLocaleString() : 'N/A'}

Message:
${message}`);
            
        } catch (error) {
            console.error('Error viewing application:', error);
            this.showError('Failed to load application details');
        }
    }

    async updateApplicationStatus(applicationId, newStatus) {
        try {
            const { error } = await this.supabase
                .from('applications')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationId);
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.showSuccess(`Application ${newStatus} successfully`);
            
            // Refresh applications data if we're on the applications view
            if (this.currentView === 'applications') {
                // Update the application in our local data
                const appIndex = this.allApplications.findIndex(app => app.id === applicationId);
                if (appIndex !== -1) {
                    this.allApplications[appIndex].status = newStatus;
                    this.allApplications[appIndex].updated_at = new Date().toISOString();
                }
                
                // Re-filter and re-render
                this.filterApplications();
                this.renderApplicationsTable();
            }
            
        } catch (error) {
            console.error('Error updating application status:', error);
            this.showError('Failed to update application status');
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});