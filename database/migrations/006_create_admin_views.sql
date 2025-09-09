-- AFZ Member Portal - Admin Dashboard Views
-- Execute this in Supabase SQL Editor to create helpful views for admin dashboard

-- View for admin dashboard member statistics
CREATE OR REPLACE VIEW public.admin_member_stats AS
SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE status = 'active') as active_members,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_members,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_members,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'moderator') as moderator_count,
    COUNT(*) FILTER (WHERE role = 'member') as regular_member_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
    COUNT(*) FILTER (WHERE last_active_at >= CURRENT_DATE - INTERVAL '30 days') as active_last_30_days,
    COUNT(*) FILTER (WHERE last_active_at >= CURRENT_DATE - INTERVAL '7 days') as active_last_7_days
FROM public.profiles;

-- View for event statistics
CREATE OR REPLACE VIEW public.admin_event_stats AS
SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE status = 'published') as published_events,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_events,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_events,
    COUNT(*) FILTER (WHERE start_date >= NOW()) as upcoming_events,
    COUNT(*) FILTER (WHERE start_date < NOW() AND end_date > NOW()) as ongoing_events,
    COUNT(*) FILTER (WHERE end_date < NOW()) as past_events,
    COUNT(*) FILTER (WHERE featured = true) as featured_events,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as created_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as created_this_week
FROM public.events;

-- View for message/chat statistics
CREATE OR REPLACE VIEW public.admin_message_stats AS
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as unique_message_senders,
    COUNT(DISTINCT channel_id) as active_channels,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as messages_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as messages_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as messages_this_month,
    COUNT(*) FILTER (WHERE message_type = 'file') as file_messages,
    COUNT(*) FILTER (WHERE message_type = 'image') as image_messages,
    AVG(LENGTH(content)) as avg_message_length
FROM public.messages
WHERE is_deleted = false;

-- View for resource statistics
CREATE OR REPLACE VIEW public.admin_resource_stats AS
SELECT 
    COUNT(*) as total_resources,
    SUM(download_count) as total_downloads,
    SUM(view_count) as total_views,
    COUNT(*) FILTER (WHERE resource_type = 'document') as documents,
    COUNT(*) FILTER (WHERE resource_type = 'video') as videos,
    COUNT(*) FILTER (WHERE resource_type = 'audio') as audio_files,
    COUNT(*) FILTER (WHERE resource_type = 'image') as images,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_resources,
    COUNT(*) FILTER (WHERE is_public = true) as public_resources,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week
FROM public.resources;

-- View for recent activity (for admin dashboard activity feed)
CREATE OR REPLACE VIEW public.admin_recent_activity AS
SELECT 
    'user_joined' as activity_type,
    p.display_name as user_name,
    'Joined the community' as activity_description,
    p.created_at as activity_time,
    p.id as related_id
FROM public.profiles p
WHERE p.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'event_created' as activity_type,
    pr.display_name as user_name,
    'Created event: ' || e.title as activity_description,
    e.created_at as activity_time,
    e.id as related_id
FROM public.events e
JOIN public.profiles pr ON e.organizer_id = pr.id
WHERE e.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'resource_uploaded' as activity_type,
    pr.display_name as user_name,
    'Uploaded resource: ' || r.title as activity_description,
    r.created_at as activity_time,
    r.id as related_id
FROM public.resources r
JOIN public.profiles pr ON r.uploaded_by = pr.id
WHERE r.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'event_registration' as activity_type,
    pr.display_name as user_name,
    'Registered for event: ' || e.title as activity_description,
    er.registered_at as activity_time,
    er.id as related_id
FROM public.event_registrations er
JOIN public.profiles pr ON er.user_id = pr.id
JOIN public.events e ON er.event_id = e.id
WHERE er.registered_at >= NOW() - INTERVAL '7 days'

ORDER BY activity_time DESC
LIMIT 20;

-- View for user engagement metrics
CREATE OR REPLACE VIEW public.admin_user_engagement AS
SELECT 
    p.id,
    p.display_name,
    p.email,
    p.role,
    p.status,
    p.created_at as join_date,
    p.last_active_at,
    
    -- Message activity
    COALESCE(msg_stats.message_count, 0) as message_count,
    COALESCE(msg_stats.recent_messages, 0) as recent_messages,
    
    -- Event activity
    COALESCE(event_stats.events_registered, 0) as events_registered,
    COALESCE(event_stats.events_organized, 0) as events_organized,
    
    -- Resource activity
    COALESCE(resource_stats.resources_uploaded, 0) as resources_uploaded,
    
    -- Connection activity
    COALESCE(conn_stats.connections_made, 0) as connections_made,
    
    -- Engagement score (simple calculation)
    (
        COALESCE(msg_stats.message_count, 0) * 1 +
        COALESCE(event_stats.events_registered, 0) * 3 +
        COALESCE(event_stats.events_organized, 0) * 5 +
        COALESCE(resource_stats.resources_uploaded, 0) * 4 +
        COALESCE(conn_stats.connections_made, 0) * 2
    ) as engagement_score

FROM public.profiles p

LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as message_count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_messages
    FROM public.messages
    WHERE is_deleted = false
    GROUP BY user_id
) msg_stats ON p.id = msg_stats.user_id

LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as events_registered
    FROM public.event_registrations
    GROUP BY user_id
    
    UNION ALL
    
    SELECT 
        organizer_id as user_id,
        COUNT(*) as events_organized
    FROM public.events
    WHERE organizer_id IS NOT NULL
    GROUP BY organizer_id
) event_stats ON p.id = event_stats.user_id

LEFT JOIN (
    SELECT 
        uploaded_by as user_id,
        COUNT(*) as resources_uploaded
    FROM public.resources
    WHERE uploaded_by IS NOT NULL
    GROUP BY uploaded_by
) resource_stats ON p.id = resource_stats.user_id

LEFT JOIN (
    SELECT 
        requester_id as user_id,
        COUNT(*) as connections_made
    FROM public.user_connections
    WHERE status = 'accepted'
    GROUP BY requester_id
    
    UNION ALL
    
    SELECT 
        addressee_id as user_id,
        COUNT(*) as connections_made
    FROM public.user_connections
    WHERE status = 'accepted'
    GROUP BY addressee_id
) conn_stats ON p.id = conn_stats.user_id

ORDER BY engagement_score DESC;

-- Grant access to admin views
GRANT SELECT ON public.admin_member_stats TO authenticated;
GRANT SELECT ON public.admin_event_stats TO authenticated;
GRANT SELECT ON public.admin_message_stats TO authenticated;
GRANT SELECT ON public.admin_resource_stats TO authenticated;
GRANT SELECT ON public.admin_recent_activity TO authenticated;
GRANT SELECT ON public.admin_user_engagement TO authenticated;