/**
 * AFZ Member Hub - Real-time Notifications Manager
 * Comprehensive notification system with real-time updates, categories, and actions
 */

class NotificationsManager {
    constructor() {
        this.currentUser = null;
        this.authService = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.realtimeSubscription = null;
        this.isInitialized = false;
        this.notificationTypes = {
            system: { icon: 'fa-cog', color: '#6b7280' },
            event: { icon: 'fa-calendar', color: '#3b82f6' },
            message: { icon: 'fa-comment', color: '#10b981' },
            resource: { icon: 'fa-book', color: '#f59e0b' },
            connection: { icon: 'fa-user-plus', color: '#8b5cf6' },
            announcement: { icon: 'fa-megaphone', color: '#ef4444' }
        };
        
        // Initialize after auth service is ready
        this.waitForServices().then(() => {
            this.init();
        }).catch(error => {
            console.error('NotificationsManager initialization failed:', error);
        });
    }

    async waitForServices() {
        let attempts = 0;
        while (!window.afzAuthService && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.afzAuthService || !window.afzAuthService.isAuthenticated) {
            throw new Error('Authentication service not available');
        }
        
        this.authService = window.afzAuthService;
        this.currentUser = this.authService.getCurrentUser();
        console.log('✅ NotificationsManager services ready for user:', this.currentUser.email);
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadNotifications();
            this.setupRealtimeSubscriptions();
            this.setupNotificationInterface();
            this.setupEventListeners();
            this.startPeriodicSync();
            
            this.isInitialized = true;
            console.log('✅ NotificationsManager initialized successfully');
        } catch (error) {
            console.error('Error initializing NotificationsManager:', error);
        }
    }

    async loadNotifications(limit = 20) {
        if (!window.sb || !this.currentUser) return;
        
        try {
            const { data: notifications, error } = await window.sb
                .from('notifications')
                .select('*')
                .eq('recipient_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            
            this.notifications = notifications || [];
            this.updateUnreadCount();
            this.updateNotificationBadge();
            this.renderNotificationsList();
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notifications = this.getDefaultNotifications();
            this.updateUnreadCount();
            this.updateNotificationBadge();
        }
    }

    setupRealtimeSubscriptions() {
        if (!window.sb || !this.currentUser) return;
        
        try {
            this.realtimeSubscription = window.sb
                .channel(`notifications-${this.currentUser.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${this.currentUser.id}`
                }, (payload) => {
                    this.handleNewNotification(payload.new);
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${this.currentUser.id}`
                }, (payload) => {
                    this.handleUpdatedNotification(payload.new);
                })
                .subscribe();

            console.log('✅ Real-time notifications subscription active');
        } catch (error) {
            console.error('Error setting up notifications subscription:', error);
        }
    }

    setupNotificationInterface() {
        // The interface is part of the header, so we'll just enhance it
        this.enhanceNotificationPanel();
    }

    enhanceNotificationPanel() {
        const notificationPanel = document.getElementById('notification-panel');
        if (!notificationPanel) return;

        // Update the notification panel with enhanced functionality
        const notificationList = document.getElementById('notification-list');
        if (notificationList) {
            notificationList.innerHTML = this.renderNotificationsList();
        }
    }

    renderNotificationsList() {
        if (!this.notifications || this.notifications.length === 0) {
            return this.renderEmptyState();
        }

        return this.notifications.map(notification => this.renderNotificationItem(notification)).join('');
    }

    renderNotificationItem(notification) {
        const typeConfig = this.notificationTypes[notification.notification_type] || this.notificationTypes.system;
        const isUnread = !notification.read_at;
        const timeAgo = this.formatTimeAgo(notification.created_at);
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : 'read'}" data-notification-id="${notification.id}">
                <div class="notification-icon" style="color: ${typeConfig.color}">
                    <i class="fas ${typeConfig.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4 class="notification-title">${notification.title}</h4>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    ${notification.action_url ? `
                        <div class="notification-actions">
                            <button class="notification-action-btn" onclick="notificationsManager.handleNotificationAction('${notification.id}', '${notification.action_url}')">
                                View Details
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="notification-controls">
                    ${isUnread ? `
                        <button class="control-btn mark-read" onclick="notificationsManager.markAsRead('${notification.id}')" title="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="control-btn delete" onclick="notificationsManager.deleteNotification('${notification.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="notification-empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bell-slash"></i>
                </div>
                <h3>No notifications</h3>
                <p>You're all caught up! New notifications will appear here.</p>
            </div>
        `;
    }

    async handleNewNotification(notification) {
        try {
            // Add to the beginning of the list
            this.notifications.unshift(notification);
            
            // Update UI
            this.updateUnreadCount();
            this.updateNotificationBadge();
            this.renderNotificationsList();
            
            // Show toast notification
            this.showToastNotification(notification);
            
            // Play notification sound
            this.playNotificationSound();
            
            // Update page title if in background
            this.updatePageTitle();
            
        } catch (error) {
            console.error('Error handling new notification:', error);
        }
    }

    async handleUpdatedNotification(updatedNotification) {
        try {
            // Update the notification in our local list
            const index = this.notifications.findIndex(n => n.id === updatedNotification.id);
            if (index !== -1) {
                this.notifications[index] = updatedNotification;
                this.updateUnreadCount();
                this.updateNotificationBadge();
                this.renderNotificationsList();
            }
        } catch (error) {
            console.error('Error handling updated notification:', error);
        }
    }

    async markAsRead(notificationId) {
        if (!window.sb) return;
        
        try {
            const { error } = await window.sb
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) throw error;
            
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read_at = new Date().toISOString();
                this.updateUnreadCount();
                this.updateNotificationBadge();
                this.renderNotificationsList();
            }
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
            this.showNotification('Failed to mark notification as read', 'error');
        }
    }

    async markAllAsRead() {
        if (!window.sb || !this.currentUser) return;
        
        try {
            const { error } = await window.sb
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('recipient_id', this.currentUser.id)
                .is('read_at', null);

            if (error) throw error;
            
            // Update local state
            this.notifications.forEach(notification => {
                if (!notification.read_at) {
                    notification.read_at = new Date().toISOString();
                }
            });
            
            this.updateUnreadCount();
            this.updateNotificationBadge();
            this.renderNotificationsList();
            
            this.showNotification('All notifications marked as read', 'success');
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            this.showNotification('Failed to mark all notifications as read', 'error');
        }
    }

    async deleteNotification(notificationId) {
        if (!window.sb) return;
        
        try {
            const { error } = await window.sb
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            
            // Remove from local state
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.updateUnreadCount();
            this.updateNotificationBadge();
            this.renderNotificationsList();
            
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showNotification('Failed to delete notification', 'error');
        }
    }

    async handleNotificationAction(notificationId, actionUrl) {
        // Mark as read when user clicks action
        await this.markAsRead(notificationId);
        
        // Navigate to the action URL
        if (actionUrl.startsWith('#')) {
            // Internal navigation
            if (window.afzMemberHub && window.afzMemberHub.switchSection) {
                const sectionName = actionUrl.replace('#', '');
                window.afzMemberHub.switchSection(sectionName);
            }
        } else if (actionUrl.startsWith('/') || actionUrl.startsWith('http')) {
            // External or relative navigation
            window.open(actionUrl, '_blank');
        }
        
        // Close notification panel
        this.closeNotificationPanel();
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read_at).length;
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    updatePageTitle() {
        if (document.hidden && this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) AFZ Member Hub`;
        } else {
            document.title = 'AFZ Member Hub';
        }
    }

    showToastNotification(notification) {
        if (window.afzMemberHub?.showToastNotification) {
            const typeConfig = this.notificationTypes[notification.notification_type] || this.notificationTypes.system;
            window.afzMemberHub.showToastNotification(
                notification.title,
                notification.notification_type === 'system' ? 'info' : 'success',
                {
                    icon: typeConfig.icon,
                    duration: 5000
                }
            );
        }
    }

    playNotificationSound() {
        try {
            // Create a subtle notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            
        } catch (error) {
            // Fallback or no sound if audio context fails
            console.debug('Audio notification not available');
        }
    }

    setupEventListeners() {
        // Mark all read button
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Filter buttons
        document.querySelectorAll('.notification-panel .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterNotifications(filter);
                
                // Update active filter
                document.querySelectorAll('.notification-panel .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Close notification panel when clicking outside
        document.addEventListener('click', (e) => {
            const notificationPanel = document.getElementById('notification-panel');
            const notificationBtn = document.getElementById('notifications-btn');
            
            if (notificationPanel && !notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationPanel.style.display = 'none';
            }
        });

        // Page visibility change for title updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updatePageTitle();
            }
        });
    }

    filterNotifications(filter) {
        let filteredNotifications;
        
        switch (filter) {
            case 'unread':
                filteredNotifications = this.notifications.filter(n => !n.read_at);
                break;
            case 'all':
            default:
                filteredNotifications = this.notifications;
                break;
        }
        
        const notificationList = document.getElementById('notification-list');
        if (notificationList) {
            notificationList.innerHTML = this.renderFilteredNotifications(filteredNotifications);
        }
    }

    renderFilteredNotifications(notifications) {
        if (notifications.length === 0) {
            return this.renderEmptyState();
        }
        return notifications.map(notification => this.renderNotificationItem(notification)).join('');
    }

    closeNotificationPanel() {
        const notificationPanel = document.getElementById('notification-panel');
        if (notificationPanel) {
            notificationPanel.style.display = 'none';
        }
    }

    startPeriodicSync() {
        // Sync notifications every 5 minutes
        setInterval(() => {
            this.loadNotifications();
        }, 5 * 60 * 1000);
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    getDefaultNotifications() {
        return [
            {
                id: 'sample_1',
                title: 'Welcome to AFZ Member Hub',
                message: 'Thank you for joining the AFZ community. Explore resources, connect with members, and participate in events.',
                notification_type: 'system',
                created_at: new Date().toISOString(),
                read_at: null,
                action_url: '#resources'
            },
            {
                id: 'sample_2',
                title: 'New Community Event',
                message: 'Health Awareness Workshop scheduled for next week. Register now to secure your spot.',
                notification_type: 'event',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read_at: null,
                action_url: '#events'
            }
        ];
    }

    showNotification(message, type = 'info') {
        if (window.afzMemberHub?.showToastNotification) {
            window.afzMemberHub.showToastNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Public API methods
    async createNotification(notificationData) {
        if (!window.sb || !this.currentUser) return;
        
        try {
            const { data, error } = await window.sb
                .from('notifications')
                .insert({
                    recipient_id: this.currentUser.id,
                    title: notificationData.title,
                    message: notificationData.message,
                    notification_type: notificationData.type || 'system',
                    category: notificationData.category || 'general',
                    priority: notificationData.priority || 'normal',
                    action_url: notificationData.actionUrl || null,
                    metadata: notificationData.metadata || {}
                })
                .select()
                .single();

            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    getUnreadCount() {
        return this.unreadCount;
    }

    destroy() {
        if (this.realtimeSubscription) {
            window.sb?.removeChannel(this.realtimeSubscription);
        }
        this.isInitialized = false;
    }
}

// Export for use in member hub
window.NotificationsManager = NotificationsManager;