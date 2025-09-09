-- AFZ Member Portal - Sample Notifications Data
-- Populate the database with sample notifications for testing

-- First, let's get some user IDs to work with (assuming we have at least one user)
-- This script should be run after users exist in the profiles table

-- Insert sample notifications for testing
-- Note: Replace the recipient_id values with actual user IDs from your profiles table

INSERT INTO public.notifications (
    recipient_id, title, message, notification_type, category, priority, action_url, metadata
) VALUES
    -- Welcome notification (system)
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'Welcome to AFZ Member Hub!',
        'Thank you for joining our community. Explore resources, connect with members, and participate in upcoming events.',
        'system',
        'welcome',
        'normal',
        '#resources',
        '{"type": "welcome", "version": "1.0"}'::jsonb
    ),
    
    -- Event notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'New Health Workshop Available',
        'Join us for a comprehensive health and wellness workshop this Saturday. Learn about sun protection and skincare for persons with albinism.',
        'event',
        'events',
        'high',
        '#events',
        '{"event_id": "health_workshop_2024", "event_date": "2024-09-14"}'::jsonb
    ),
    
    -- Resource notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'New Resource: Sun Protection Guide',
        'A comprehensive guide covering sun protection strategies has been added to the resource library.',
        'resource',
        'resources',
        'normal',
        '#resources',
        '{"resource_id": "res_sun_protection_guide", "category": "health"}'::jsonb
    ),
    
    -- Announcement notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'AFZ Community Update - September 2024',
        'Check out our latest community achievements and upcoming initiatives. Read the full announcement in our latest newsletter.',
        'announcement',
        'announcements',
        'high',
        '#resources',
        '{"newsletter_id": "sept_2024", "type": "monthly_update"}'::jsonb
    ),
    
    -- Connection notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'New Connection Request',
        'Someone wants to connect with you in the AFZ community network.',
        'connection',
        'networking',
        'normal',
        '#connections',
        '{"connection_type": "peer_support", "source": "community"}'::jsonb
    ),
    
    -- Message notification (already read)
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'New Message in Healthcare Support',
        'You have a new message in the Healthcare Support channel.',
        'message',
        'chat',
        'normal',
        '#chat',
        '{"channel": "healthcare_support", "sender": "Dr. Smith"}'::jsonb
    ),
    
    -- System maintenance notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'Scheduled Maintenance Complete',
        'System maintenance has been completed. All features are now fully operational.',
        'system',
        'maintenance',
        'low',
        null,
        '{"maintenance_window": "2024-09-06T02:00:00Z", "duration": "2 hours"}'::jsonb
    ),
    
    -- Resource suggestion notification
    (
        (SELECT id FROM public.profiles LIMIT 1),
        'Recommended: Legal Rights Handbook',
        'Based on your interests, we recommend checking out the Legal Rights Handbook for Persons with Albinism.',
        'resource',
        'recommendations',
        'normal',
        '#resources',
        '{"resource_id": "res_legal_rights_handbook", "recommendation_type": "content_based"}'::jsonb
    );

-- Mark some notifications as read (simulate user interaction)
UPDATE public.notifications 
SET read_at = NOW() - INTERVAL '1 hour'
WHERE notification_type = 'message' OR priority = 'low';

-- Update one notification as read recently
UPDATE public.notifications 
SET read_at = NOW() - INTERVAL '30 minutes'
WHERE title = 'New Resource: Sun Protection Guide';

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- Create a function to generate welcome notifications for new users
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.notifications (
        recipient_id,
        title,
        message,
        notification_type,
        category,
        priority,
        action_url,
        metadata
    ) VALUES (
        NEW.id,
        'Welcome to AFZ Member Hub!',
        'Thank you for joining our community. Explore resources, connect with members, and participate in upcoming events. Get started by updating your profile and exploring available resources.',
        'system',
        'welcome',
        'normal',
        '#profile',
        '{"type": "welcome", "auto_generated": true}'::jsonb
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send welcome notifications
DROP TRIGGER IF EXISTS welcome_notification_trigger ON public.profiles;
CREATE TRIGGER welcome_notification_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_welcome_notification();

-- Create a function to send event notifications to all members
CREATE OR REPLACE FUNCTION public.notify_all_members_of_event(
    event_title TEXT,
    event_message TEXT,
    event_id UUID DEFAULT NULL,
    priority_level TEXT DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    member_record RECORD;
BEGIN
    -- Insert notifications for all active members
    FOR member_record IN 
        SELECT id FROM public.profiles 
        WHERE role != 'suspended' AND id IN (
            SELECT DISTINCT user_id FROM auth.users WHERE email_confirmed_at IS NOT NULL
        )
    LOOP
        INSERT INTO public.notifications (
            recipient_id,
            title,
            message,
            notification_type,
            category,
            priority,
            action_url,
            metadata
        ) VALUES (
            member_record.id,
            event_title,
            event_message,
            'event',
            'events',
            priority_level,
            '#events',
            CASE 
                WHEN event_id IS NOT NULL THEN 
                    ('{"event_id": "' || event_id || '", "type": "event_announcement"}')::jsonb
                ELSE 
                    '{"type": "event_announcement"}'::jsonb
            END
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to send resource notifications
CREATE OR REPLACE FUNCTION public.notify_resource_added(
    resource_title TEXT,
    resource_description TEXT,
    resource_id UUID,
    resource_category TEXT DEFAULT 'general'
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    member_record RECORD;
BEGIN
    -- Insert notifications for all active members
    FOR member_record IN 
        SELECT id FROM public.profiles 
        WHERE role != 'suspended'
    LOOP
        INSERT INTO public.notifications (
            recipient_id,
            title,
            message,
            notification_type,
            category,
            priority,
            action_url,
            metadata
        ) VALUES (
            member_record.id,
            'New Resource: ' || resource_title,
            resource_description || ' has been added to the resource library.',
            'resource',
            'resources',
            'normal',
            '#resources',
            ('{"resource_id": "' || resource_id || '", "category": "' || resource_category || '", "type": "new_resource"}')::jsonb
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage of the notification functions:
-- SELECT public.notify_all_members_of_event('Health Workshop', 'Join us for a health and wellness workshop', 'event-id-here', 'high');
-- SELECT public.notify_resource_added('New Health Guide', 'Comprehensive health guidance for persons with albinism', 'resource-id-here', 'health');