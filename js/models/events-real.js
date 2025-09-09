/**
 * AFZ Events Manager - Real Database Integration
 * Enhanced events system with Supabase backend
 */

class RealEventsManager {
    constructor() {
        this.db = window.afzDB;
        this.currentUser = null;
        this.events = [];
        this.userEvents = [];
        this.eventCategories = [];
        
        this.currentView = 'upcoming';
        this.currentFilter = 'all';
        this.currentDateRange = 'all';
        this.selectedEvents = new Set();
        
        this.init();
    }

    async init() {
        try {
            this.currentUser = await this.db.getCurrentUser();
            if (this.currentUser) {
                await this.loadEvents();
                this.setupEventListeners();
                this.renderEventsInterface();
            }
        } catch (error) {
            console.error('Error initializing events manager:', error);
            // Fallback to existing mock implementation
            this.setupMockEvents();
        }
    }

    async loadEvents(filters = {}) {
        try {
            // Set default filters for upcoming events
            const defaultFilters = {
                dateFrom: new Date().toISOString(),
                status: 'published',
                ...filters
            };
            
            this.events = await this.db.getEvents(defaultFilters);
            this.renderEventsList();
            this.updateEventStats();
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events. Please try again.');
        }
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFilters();
        });

        document.getElementById('date-filter')?.addEventListener('change', (e) => {
            this.currentDateRange = e.target.value;
            this.applyFilters();
        });

        // Search
        document.getElementById('events-search')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.debounceSearch();
        });

        // RSVP buttons
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.rsvp-btn')) {
                await this.handleRSVP(e.target.dataset.eventId, e.target.dataset.action);
            }
        });

        // View toggle
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });
    }

    async handleRSVP(eventId, action) {
        if (!this.currentUser) {
            this.showError('Please log in to RSVP to events.');
            return;
        }

        try {
            const rsvpData = {
                status: action === 'register' ? 'registered' : 'cancelled'
            };

            await this.db.rsvpToEvent(eventId, rsvpData);
            
            // Update UI
            const btn = document.querySelector(`[data-event-id=\"${eventId}\"]`);
            if (btn) {
                if (action === 'register') {
                    btn.textContent = 'Registered';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-success');
                    btn.dataset.action = 'cancel';
                } else {
                    btn.textContent = 'Register';
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-primary');
                    btn.dataset.action = 'register';
                }
            }

            this.showSuccess(`Successfully ${action === 'register' ? 'registered for' : 'cancelled registration for'} the event.`);
            
            // Reload events to update counts
            await this.loadEvents();
            
        } catch (error) {
            console.error('Error handling RSVP:', error);
            this.showError('Failed to update RSVP. Please try again.');
        }
    }

    applyFilters() {
        let filters = {};

        // Category filter
        if (this.currentFilter !== 'all') {
            filters.category = this.currentFilter;
        }

        // Date range filter
        const now = new Date();
        switch (this.currentDateRange) {
            case 'today':
                filters.dateFrom = now.toISOString().split('T')[0];
                filters.dateTo = now.toISOString().split('T')[0];
                break;
            case 'week':
                filters.dateFrom = now.toISOString();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                filters.dateTo = nextWeek.toISOString();
                break;
            case 'month':
                filters.dateFrom = now.toISOString();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                filters.dateTo = nextMonth.toISOString();
                break;
        }

        this.loadEvents(filters);
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    async performSearch() {
        if (!this.searchQuery.trim()) {
            await this.loadEvents();
            return;
        }

        try {
            // Filter events by search query
            const filteredEvents = this.events.filter(event => 
                event.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                event.venue_name?.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
            
            this.renderEventsList(filteredEvents);
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }

    renderEventsInterface() {
        const eventsContainer = document.getElementById('section-events');
        if (!eventsContainer) return;

        eventsContainer.innerHTML = `
            <div class=\"events-interface\">
                <!-- Events Header -->
                <div class=\"events-header\">
                    <div class=\"header-content\">
                        <h1>Community Events</h1>
                        <p>Discover, join, and participate in AFZ community activities</p>
                    </div>
                    <div class=\"header-actions\">
                        <button class=\"btn btn-secondary\" id=\"export-events\">
                            <i class=\"fas fa-calendar-alt\"></i>
                            Export Calendar
                        </button>
                        <button class=\"btn btn-primary\" id=\"create-event-btn\">
                            <i class=\"fas fa-plus\"></i>
                            Create Event
                        </button>
                    </div>
                </div>

                <!-- Filter Controls -->
                <div class=\"events-controls\">
                    <div class=\"search-section\">
                        <div class=\"search-box\">
                            <i class=\"fas fa-search\"></i>
                            <input type=\"text\" id=\"events-search\" placeholder=\"Search events...\">
                        </div>
                        <div class=\"filter-controls\">
                            <select id=\"category-filter\" class=\"filter-select\">
                                <option value=\"all\">All Categories</option>
                                <option value=\"healthcare\">Healthcare</option>
                                <option value=\"advocacy\">Advocacy</option>
                                <option value=\"education\">Education</option>
                                <option value=\"support\">Support Groups</option>
                                <option value=\"social\">Social</option>
                                <option value=\"fundraising\">Fundraising</option>
                            </select>
                            <select id=\"date-filter\" class=\"filter-select\">
                                <option value=\"all\">All Dates</option>
                                <option value=\"today\">Today</option>
                                <option value=\"week\">This Week</option>
                                <option value=\"month\">This Month</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Events List -->
                <div class=\"events-list\" id=\"events-list\">
                    <!-- Events will be populated here -->
                </div>

                <!-- Loading State -->
                <div class=\"loading-state\" id=\"events-loading\" style=\"display: none;\">
                    <div class=\"loading-spinner\"></div>
                    <p>Loading events...</p>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderEventsList(events = null) {
        const eventsToRender = events || this.events;
        const eventsListContainer = document.getElementById('events-list');
        
        if (!eventsListContainer) return;

        if (eventsToRender.length === 0) {
            eventsListContainer.innerHTML = `
                <div class=\"empty-state\">
                    <i class=\"fas fa-calendar-times\"></i>
                    <h3>No events found</h3>
                    <p>There are no events matching your criteria.</p>
                </div>
            `;
            return;
        }

        eventsListContainer.innerHTML = eventsToRender.map(event => this.renderEventCard(event)).join('');
    }

    renderEventCard(event) {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const isRegistered = event.user_registered || false; // This would come from the database
        
        return `
            <div class=\"event-card\" data-event-id=\"${event.id}\">
                <div class=\"event-date\">
                    <span class=\"month\">${startDate.toLocaleDateString('en', { month: 'short' })}</span>
                    <span class=\"day\">${startDate.getDate()}</span>
                </div>
                <div class=\"event-content\">
                    <div class=\"event-header\">
                        <h3 class=\"event-title\">${event.title}</h3>
                        <div class=\"event-meta\">
                            <span class=\"event-type\">${this.formatEventType(event.event_type)}</span>
                            <span class=\"event-location\">
                                <i class=\"fas fa-map-marker-alt\"></i>
                                ${event.location_type === 'virtual' ? 'Virtual Event' : (event.venue_name || event.city || 'TBA')}
                            </span>
                        </div>
                    </div>
                    <div class=\"event-description\">
                        <p>${event.description ? event.description.substring(0, 150) + '...' : 'No description available.'}</p>
                    </div>
                    <div class=\"event-details\">
                        <div class=\"event-time\">
                            <i class=\"fas fa-clock\"></i>
                            ${startDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            ${endDate && ' - ' + endDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class=\"event-organizer\">
                            <i class=\"fas fa-user\"></i>
                            By ${event.organizer?.display_name || event.organizer?.full_name || 'AFZ Team'}
                        </div>
                    </div>
                    <div class=\"event-actions\">
                        <button class=\"btn btn-outline\" onclick=\"this.showEventDetails('${event.id}')\">
                            <i class=\"fas fa-info-circle\"></i>
                            Details
                        </button>
                        ${this.renderRSVPButton(event, isRegistered)}
                    </div>
                </div>
            </div>
        `;
    }

    renderRSVPButton(event, isRegistered) {
        if (!this.currentUser) {
            return `
                <button class=\"btn btn-primary\" onclick=\"window.location.href='./auth.html'\">
                    <i class=\"fas fa-sign-in-alt\"></i>
                    Login to Register
                </button>
            `;
        }

        if (isRegistered) {
            return `
                <button class=\"btn btn-success rsvp-btn\" data-event-id=\"${event.id}\" data-action=\"cancel\">
                    <i class=\"fas fa-check\"></i>
                    Registered
                </button>
            `;
        } else {
            return `
                <button class=\"btn btn-primary rsvp-btn\" data-event-id=\"${event.id}\" data-action=\"register\">
                    <i class=\"fas fa-calendar-plus\"></i>
                    Register
                </button>
            `;
        }
    }

    formatEventType(type) {
        const types = {
            'workshop': 'Workshop',
            'meeting': 'Meeting',
            'conference': 'Conference',
            'support_group': 'Support Group',
            'awareness_campaign': 'Awareness Campaign',
            'fundraiser': 'Fundraiser',
            'social': 'Social Event',
            'medical': 'Medical',
            'educational': 'Educational'
        };
        return types[type] || type;
    }

    updateEventStats() {
        // Update dashboard stats if available
        const upcomingCount = this.events.filter(event => 
            new Date(event.start_date) > new Date()
        ).length;
        
        const statsElement = document.querySelector('.stat-card[data-stat=\"events\"] .stat-number');
        if (statsElement) {
            statsElement.textContent = upcomingCount.toString();
        }
    }

    setupMockEvents() {
        // Fallback to existing mock implementation
        console.log('Using mock events data');
    }

    showSuccess(message) {
        if (window.afzMemberHub) {
            window.afzMemberHub.showToastNotification(message, 'success');
        }
    }

    showError(message) {
        if (window.afzMemberHub) {
            window.afzMemberHub.showToastNotification(message, 'error');
        }
    }

    switchView(viewName) {
        this.currentView = viewName;
        
        // Update active tab
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view=\"${viewName}\"]`)?.classList.add('active');
        
        // Load appropriate data
        this.loadViewData(viewName);
    }

    async loadViewData(viewName) {
        const filters = {};
        
        switch (viewName) {
            case 'upcoming':
                filters.dateFrom = new Date().toISOString();
                break;
            case 'my-events':
                // Load user's registered events
                filters.user_registered = true;
                break;
            case 'past':
                filters.dateTo = new Date().toISOString();
                break;
        }
        
        await this.loadEvents(filters);
    }
}

// Initialize real events manager and replace the existing one
if (typeof window !== 'undefined') {
    window.RealEventsManager = RealEventsManager;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.realEventsManager = new RealEventsManager();
        });
    } else {
        window.realEventsManager = new RealEventsManager();
    }
}