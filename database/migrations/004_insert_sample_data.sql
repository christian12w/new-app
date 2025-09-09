-- AFZ Member Portal - Sample Data
-- Execute this in Supabase SQL Editor AFTER creating all tables and functions
-- This provides initial data for testing the admin dashboard

-- Insert sample chat channels
INSERT INTO public.chat_channels (id, name, description, type) VALUES
    ('general-channel-uuid'::uuid, 'General Discussion', 'Welcome to the AFZ community! General discussions and introductions.', 'public'),
    ('announcements-uuid'::uuid, 'Announcements', 'Official announcements from the AFZ team.', 'public'),
    ('support-group-uuid'::uuid, 'Support Group', 'Peer support and encouragement for community members.', 'public'),
    ('advocacy-uuid'::uuid, 'Advocacy & Awareness', 'Discussions about advocacy efforts and awareness campaigns.', 'public'),
    ('healthcare-uuid'::uuid, 'Healthcare Resources', 'Share and discuss healthcare information and resources.', 'public')
ON CONFLICT (id) DO NOTHING;

-- Insert sample events (these will show up in the admin dashboard)
INSERT INTO public.events (
    title, description, short_description, image_url, category, 
    location_type, location_name, start_date, end_date, 
    max_attendees, cost_amount, registration_required, status, featured
) VALUES
    (
        'Annual AFZ Community Health Camp', 
        'Free comprehensive health screening including dermatology consultations, vision testing, and general health checkups specifically designed for persons with albinism.',
        'Free health screening and dermatology consultations for the albinism community.',
        'assets/events/health-camp.jpg',
        ARRAY['healthcare', 'support'],
        'physical',
        'Lusaka Community Center, Lusaka',
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days' + INTERVAL '8 hours',
        100,
        0.00,
        true,
        'published',
        true
    ),
    (
        'Albinism Awareness Workshop', 
        'Educational workshop covering sun protection, skincare, and building confidence. Includes practical demonstrations and Q&A sessions.',
        'Educational workshop on sun protection and building confidence.',
        'assets/events/awareness-workshop.jpg',
        ARRAY['education', 'advocacy'],
        'hybrid',
        'AFZ Office, Ndola',
        NOW() + INTERVAL '21 days',
        NOW() + INTERVAL '21 days' + INTERVAL '4 hours',
        50,
        10.00,
        true,
        'published',
        false
    ),
    (
        'Virtual Support Group Meeting', 
        'Monthly virtual support group meeting for persons with albinism and their families. Share experiences and connect with the community.',
        'Monthly virtual support group for community connection.',
        'assets/events/support-meeting.jpg',
        ARRAY['support', 'social'],
        'virtual',
        'Zoom Meeting',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
        30,
        0.00,
        true,
        'published',
        false
    ),
    (
        'Youth Empowerment Conference', 
        'Conference focused on empowering young people with albinism through education, career guidance, and leadership development.',
        'Empowering young people with albinism through education and career guidance.',
        'assets/events/youth-conference.jpg',
        ARRAY['education', 'advocacy', 'social'],
        'physical',
        'University of Zambia, Lusaka',
        NOW() + INTERVAL '45 days',
        NOW() + INTERVAL '47 days',
        200,
        25.00,
        true,
        'published',
        true
    );

-- Insert sample resources
INSERT INTO public.resources (
    title, description, resource_type, category, tags, 
    language, difficulty_level, is_featured, is_public
) VALUES
    (
        'Sun Protection Guide for Albinism',
        'Comprehensive guide covering essential sun protection strategies, sunscreen selection, and daily care routines for persons with albinism.',
        'document',
        ARRAY['healthcare', 'education'],
        ARRAY['sun-protection', 'skincare', 'health'],
        'en',
        'beginner',
        true,
        true
    ),
    (
        'Understanding Albinism: Family Guide',
        'Educational resource for families to understand albinism, support their loved ones, and navigate common challenges.',
        'document',
        ARRAY['education', 'family'],
        ARRAY['family-support', 'education', 'understanding'],
        'en',
        'beginner',
        true,
        true
    ),
    (
        'Career Success Stories',
        'Video series featuring successful professionals with albinism sharing their career journeys and advice.',
        'video',
        ARRAY['inspiration', 'career'],
        ARRAY['careers', 'success-stories', 'inspiration'],
        'en',
        'intermediate',
        false,
        true
    ),
    (
        'Advocacy Toolkit',
        'Complete toolkit for advocacy including templates, fact sheets, and presentation materials for raising albinism awareness.',
        'toolkit',
        ARRAY['advocacy', 'resources'],
        ARRAY['advocacy', 'awareness', 'templates'],
        'en',
        'advanced',
        true,
        true
    );

-- Insert sample notifications (these will appear in admin dashboard for activity monitoring)
-- Note: These will be created automatically when users join, but we can add some system notifications

-- Sample notification function calls (these create notifications that admins can see in the dashboard)
-- These represent the type of activity that would show up in the admin dashboard

-- Create some sample system announcements that would show activity
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- This is just for demonstration - in reality, notifications would be created by actual user actions
    -- We're creating some sample data to show in the admin dashboard
    NULL; -- Placeholder for when we have actual user accounts
END $$;

-- Insert sample message for testing (requires actual users to be meaningful)
-- This is commented out as it requires actual user accounts
-- INSERT INTO public.messages (channel_id, user_id, content, message_type) VALUES
--     ('general-channel-uuid'::uuid, 'actual-user-id'::uuid, 'Welcome to the AFZ community!', 'text');

-- Update view counts for resources to show activity
UPDATE public.resources SET 
    view_count = FLOOR(RANDOM() * 100) + 10,
    download_count = FLOOR(RANDOM() * 50) + 5
WHERE is_public = true;