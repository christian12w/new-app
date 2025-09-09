/**
 * AFZ Notification Service
 * Utility service for creating system notifications
 */

class NotificationService {
    static async createWelcomeNotification(userId) {
        return await this.createNotification(userId, {
            title: 'Welcome to AFZ Member Hub!',
            message: 'Thank you for joining our community. Explore resources, connect with members, and participate in events.',
            type: 'system',
            category: 'welcome',
            priority: 'normal',
            actionUrl: '#resources'
        });
    }

    static async createEventNotification(userId, eventTitle, eventId) {
        return await this.createNotification(userId, {
            title: 'New Event Available',
            message: `${eventTitle} has been scheduled. Register now to secure your spot.`,
            type: 'event',
            category: 'events',
            priority: 'normal',
            actionUrl: `#events?event=${eventId}`
        });
    }

    static async createResourceNotification(userId, resourceTitle, resourceId) {
        return await this.createNotification(userId, {
            title: 'New Resource Added',
            message: `${resourceTitle} has been added to the resource library.`,
            type: 'resource',
            category: 'resources',
            priority: 'normal',
            actionUrl: `#resources?resource=${resourceId}`
        });
    }

    static async createConnectionNotification(userId, fromUserName, connectionId) {
        return await this.createNotification(userId, {
            title: 'New Connection Request',
            message: `${fromUserName} wants to connect with you.`,
            type: 'connection',
            category: 'networking',
            priority: 'normal',
            actionUrl: `#connections?request=${connectionId}`
        });
    }

    static async createMessageNotification(userId, fromUserName, channelName) {
        return await this.createNotification(userId, {
            title: 'New Message',
            message: `${fromUserName} sent you a message in ${channelName}.`,
            type: 'message',
            category: 'chat',
            priority: 'normal',
            actionUrl: '#chat'
        });
    }

    static async createAnnouncementNotification(userIds, title, message, actionUrl = null) {
        const notifications = userIds.map(userId => ({
            recipient_id: userId,
            title: title,
            message: message,
            notification_type: 'announcement',
            category: 'announcements',
            priority: 'high',
            action_url: actionUrl
        }));

        return await this.createBulkNotifications(notifications);
    }

    static async createSystemNotification(userId, title, message, priority = 'normal') {
        return await this.createNotification(userId, {
            title: title,
            message: message,
            type: 'system',
            category: 'system',
            priority: priority
        });
    }

    // Core notification creation function
    static async createNotification(userId, notificationData) {
        if (!window.sb) {
            console.warn('Supabase not available for notifications');
            return null;
        }

        try {
            const { data, error } = await window.sb
                .from('notifications')
                .insert({
                    recipient_id: userId,
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
            return null;
        }
    }

    // Bulk notification creation
    static async createBulkNotifications(notifications) {
        if (!window.sb) return null;

        try {
            const { data, error } = await window.sb
                .from('notifications')
                .insert(notifications)
                .select();

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            return null;
        }
    }

    // Get all members for announcements
    static async getAllMemberIds() {
        if (!window.sb) return [];

        try {
            const { data, error } = await window.sb
                .from('profiles')
                .select('id')
                .neq('role', 'suspended');

            if (error) throw error;
            return data.map(profile => profile.id);

        } catch (error) {
            console.error('Error getting member IDs:', error);
            return [];
        }
    }

    // Utility function for admin announcements
    static async createAdminAnnouncement(title, message, actionUrl = null) {
        const memberIds = await this.getAllMemberIds();
        if (memberIds.length === 0) return null;

        return await this.createAnnouncementNotification(memberIds, title, message, actionUrl);
    }
}

// Make available globally
window.NotificationService = NotificationService;