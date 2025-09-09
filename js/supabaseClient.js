(function() {
    'use strict';

    var SUPABASE_URL = 'https://vzkbvhqvrazbxbhkynfy.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J2aHF2cmF6YnhiaGt5bmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg3MTEsImV4cCI6MjA3Mjc0NDcxMX0.e0SZ_Jl1BRDiAyOqYUDY1jKCphKTeYg2UseVMzMJ-ak';

    if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase UMD library not loaded. Ensure the CDN script is included before supabaseClient.js');
        return;
    }

    // Create a global client instance with enhanced configuration
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    });

    /**
     * AFZ Database Service
     * High-level API for member hub operations
     */
    window.AFZDatabaseService = class AFZDatabaseService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient;
            this.currentUser = null;
            this.realtimeSubscriptions = new Map();
        }

        // ============================================
        // AUTHENTICATION
        // ============================================

        async getCurrentUser() {
            if (this.currentUser) return this.currentUser;
            
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                // Get full profile
                const { data: profile } = await this.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                    
                this.currentUser = { ...user, profile };
            }
            
            return this.currentUser;
        }

        async signOut() {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.clearAllSubscriptions();
        }

        async updateProfile(updates) {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            
            // Update cached user
            this.currentUser.profile = data;
            return data;
        }

        // ============================================
        // EVENTS
        // ============================================

        async getEvents(filters = {}) {
            let query = this.supabase
                .from('events')
                .select(`
                    *,
                    organizer:organizer_id(full_name, display_name, avatar_url)
                `);

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.category) {
                query = query.contains('category', [filters.category]);
            }
            if (filters.dateFrom) {
                query = query.gte('start_date', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('start_date', filters.dateTo);
            }

            query = query.order('start_date', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        async rsvpToEvent(eventId, rsvpData = {}) {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('event_registrations')
                .upsert({
                    event_id: eventId,
                    user_id: user.id,
                    ...rsvpData
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        // ============================================
        // RESOURCES
        // ============================================

        async getResources(filters = {}) {
            let query = this.supabase
                .from('resources')
                .select(`
                    *,
                    category:category_id(name, color, icon),
                    author:author_id(full_name, display_name, avatar_url)
                `);

            // Apply filters
            if (filters.category) {
                query = query.eq('category_id', filters.category);
            }
            if (filters.type) {
                query = query.eq('resource_type', filters.type);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            // Only published resources
            query = query.eq('status', 'published');
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        async getResourceCategories() {
            const { data, error } = await this.supabase
                .from('resource_categories')
                .select('*')
                .order('sort_order');

            if (error) throw error;
            return data || [];
        }

        // ============================================
        // NOTIFICATIONS
        // ============================================

        async getNotifications(filters = {}) {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            let query = this.supabase
                .from('notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false });

            if (filters.unread) {
                query = query.is('read_at', null);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        async markNotificationRead(notificationId) {
            const { error } = await this.supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) throw error;
        }

        // ============================================
        // REAL-TIME SUBSCRIPTIONS
        // ============================================

        subscribeToNotifications(callback) {
            const user = this.currentUser;
            if (!user) return null;

            const subscription = this.supabase
                .channel('notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${user.id}`
                }, callback)
                .subscribe();

            this.realtimeSubscriptions.set('notifications', subscription);
            return subscription;
        }

        clearAllSubscriptions() {
            this.realtimeSubscriptions.forEach((subscription, key) => {
                this.supabase.removeChannel(subscription);
            });
            this.realtimeSubscriptions.clear();
        }
    };

    // Initialize database service
    window.afzDB = new window.AFZDatabaseService(window.sb);
})();

