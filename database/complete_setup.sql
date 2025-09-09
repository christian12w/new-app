-- =====================================================
-- AFZ Member Portal - Complete Database Setup
-- Execute this entire script in Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: CREATE CUSTOM TYPES AND TABLES
-- =====================================================

-- Custom types
CREATE TYPE user_role AS ENUM ('member', 'moderator', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE membership_type AS ENUM ('standard', 'premium', 'lifetime');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    display_name text,
    avatar_url text,
    phone text,
    date_of_birth date,
    gender text,
    location text,
    occupation text,
    bio text,
    interests text[],
    role user_role default 'member',
    status user_status default 'active',
    membership_type membership_type default 'standard',
    suspended_until timestamp with time zone,
    suspension_reason text,
    email_verified boolean default false,
    phone_verified boolean default false,
    privacy_settings jsonb default '{"profile_visibility": "public", "contact_info_visible": true, "activity_visible": true}',
    social_links jsonb default '{}',
    last_active_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Chat channels
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    type text default 'public' check (type in ('public', 'private', 'direct')),
    max_members integer default 100,
    is_archived boolean default false,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Channel members
CREATE TABLE IF NOT EXISTS public.channel_members (
    id uuid default uuid_generate_v4() primary key,
    channel_id uuid references public.chat_channels(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    role text default 'member' check (role in ('member', 'moderator', 'admin')),
    joined_at timestamp with time zone default now(),
    last_read_at timestamp with time zone default now(),
    is_muted boolean default false,
    UNIQUE(channel_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid default uuid_generate_v4() primary key,
    channel_id uuid references public.chat_channels(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    content text not null,
    message_type text default 'text' check (message_type in ('text', 'image', 'file', 'system')),
    reply_to_id uuid references public.messages(id) on delete set null,
    file_url text,
    file_name text,
    file_size integer,
    is_edited boolean default false,
    is_deleted boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    short_description text,
    image_url text,
    category text[] default '{}',
    location_type text default 'physical' check (location_type in ('physical', 'virtual', 'hybrid')),
    location_name text,
    location_address text,
    virtual_meeting_link text,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone,
    timezone text default 'UTC',
    max_attendees integer,
    cost_amount decimal(10,2) default 0,
    cost_currency text default 'USD',
    registration_required boolean default true,
    registration_deadline timestamp with time zone,
    agenda jsonb default '[]',
    requirements text[],
    organizer_id uuid references public.profiles(id) on delete set null,
    status text default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
    featured boolean default false,
    tags text[],
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    status text default 'attending' check (status in ('attending', 'maybe', 'not_attending', 'pending')),
    notes text,
    registered_at timestamp with time zone default now(),
    UNIQUE(event_id, user_id)
);

-- Resources
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    content text,
    resource_type text not null check (resource_type in ('document', 'video', 'audio', 'image', 'link', 'toolkit')),
    file_url text,
    file_name text,
    file_size integer,
    thumbnail_url text,
    category text[] default '{}',
    tags text[],
    language text default 'en',
    difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
    download_count integer default 0,
    view_count integer default 0,
    is_featured boolean default false,
    is_public boolean default true,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null check (type in ('system', 'event', 'message', 'connection', 'admin')),
    priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
    data jsonb default '{}',
    is_read boolean default false,
    action_url text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- User connections
CREATE TABLE IF NOT EXISTS public.user_connections (
    id uuid default uuid_generate_v4() primary key,
    requester_id uuid references public.profiles(id) on delete cascade,
    addressee_id uuid references public.profiles(id) on delete cascade,
    status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
    message text,
    connected_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    UNIQUE(requester_id, addressee_id)
);

-- =====================================================
-- PART 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON public.profiles(last_active_at);
CREATE INDEX IF NOT EXISTS messages_channel_idx ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_user_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events(start_date);
CREATE INDEX IF NOT EXISTS event_registrations_event_idx ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON public.resources(resource_type);
-- Add missing indexes for optimal performance
CREATE INDEX IF NOT EXISTS channel_members_channel_idx ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS channel_members_user_idx ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS event_registrations_user_idx ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS user_connections_requester_idx ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS user_connections_addressee_idx ON public.user_connections(addressee_id);

-- =====================================================
-- PART 3: ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Key policies (essential ones only)
CREATE POLICY "Users can view all public profiles" ON public.profiles FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can view public channels" ON public.chat_channels FOR SELECT USING (type = 'public' OR created_by = (SELECT auth.uid()));
CREATE POLICY "Users can create channels" ON public.chat_channels FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
CREATE POLICY "Channel creators and admins can update channels" ON public.chat_channels FOR UPDATE USING (
    created_by = (SELECT auth.uid()) OR 
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin', 'moderator')
    )
);

CREATE POLICY "Users can view channel members of channels they belong to" ON public.channel_members FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = (SELECT auth.uid())));
CREATE POLICY "Users can join public channels" ON public.channel_members FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.chat_channels WHERE id = channel_id AND type = 'public'));
CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view messages in channels they belong to" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = messages.channel_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "Users can send messages to channels they belong to" ON public.messages FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = messages.channel_id AND user_id = (SELECT auth.uid())));
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Moderators and admins can manage messages" ON public.messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin', 'moderator')
    )
);

CREATE POLICY "Users can view published events" ON public.events FOR SELECT USING (status = 'published' OR organizer_id = (SELECT auth.uid()));
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK ((SELECT auth.uid()) = organizer_id);
CREATE POLICY "Event organizers can update own events" ON public.events FOR UPDATE USING (organizer_id = (SELECT auth.uid()));
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin', 'moderator')
    )
);

CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = (SELECT auth.uid())));
CREATE POLICY "Users can update own registrations" ON public.event_registrations FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can cancel own registrations" ON public.event_registrations FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view public resources" ON public.resources FOR SELECT USING (is_public = true OR uploaded_by = (SELECT auth.uid()));
CREATE POLICY "Users can upload resources" ON public.resources FOR INSERT WITH CHECK ((SELECT auth.uid()) = uploaded_by);
CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE USING (uploaded_by = (SELECT auth.uid()));
CREATE POLICY "Admins can manage all resources" ON public.resources FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin', 'moderator')
    )
);

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()));
CREATE POLICY "Users can create connection requests" ON public.user_connections FOR INSERT WITH CHECK (requester_id = (SELECT auth.uid()));
CREATE POLICY "Users can respond to connection requests" ON public.user_connections FOR UPDATE USING (addressee_id = (SELECT auth.uid()) OR requester_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own connections" ON public.user_connections FOR DELETE USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()));

-- =====================================================
-- PART 4: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Auto-create profile function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join default channels function
CREATE OR REPLACE FUNCTION public.join_default_channels(user_id uuid) RETURNS void AS $$
BEGIN
    INSERT INTO public.chat_channels (id, name, description, type) VALUES 
        (uuid_generate_v4(), 'General Discussion', 'Welcome to the AFZ community!', 'public'),
        (uuid_generate_v4(), 'Announcements', 'Official announcements from AFZ.', 'public')
    ON CONFLICT (name) DO NOTHING;
    
    -- Join user to existing channels by name
    INSERT INTO public.channel_members (channel_id, user_id, role)
    SELECT c.id, user_id, 'member'
    FROM public.chat_channels c
    WHERE c.name IN ('General Discussion', 'Announcements')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification function
CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_title text, notification_message text, notification_type text DEFAULT 'system', notification_priority text DEFAULT 'normal', notification_data jsonb DEFAULT '{}', action_url text DEFAULT NULL) RETURNS uuid AS $$
DECLARE notification_id uuid;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, priority, data, action_url)
    VALUES (target_user_id, notification_title, notification_message, notification_type, notification_priority, notification_data, action_url)
    RETURNING id INTO notification_id;
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.chat_channels FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile created trigger
CREATE OR REPLACE FUNCTION public.handle_profile_created() RETURNS trigger AS $$
BEGIN
    PERFORM public.join_default_channels(NEW.id);
    PERFORM public.create_notification(NEW.id, 'Welcome to AFZ!', 'Welcome to the Albinism Foundation of Zambia community!', 'system', 'normal', '{"welcome": true}'::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_profile_created();

-- =====================================================
-- PART 5: CREATE STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('avatars', 'avatars', true),
    ('resources', 'resources', true),
    ('events', 'events', true),
    ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public avatar access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Public resource access" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Authenticated users can upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND (SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Public event image access" ON storage.objects FOR SELECT USING (bucket_id = 'events');

-- =====================================================
-- PART 6: INSERT SAMPLE DATA
-- =====================================================

-- Sample events
INSERT INTO public.events (title, description, short_description, category, location_type, location_name, start_date, end_date, max_attendees, cost_amount, registration_required, status, featured) VALUES
    ('Annual AFZ Health Camp', 'Free comprehensive health screening for persons with albinism.', 'Free health screening and dermatology consultations.', ARRAY['healthcare', 'support'], 'physical', 'Lusaka Community Center', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '8 hours', 100, 0.00, true, 'published', true),
    ('Albinism Awareness Workshop', 'Educational workshop on sun protection and building confidence.', 'Workshop on sun protection and confidence building.', ARRAY['education', 'advocacy'], 'hybrid', 'AFZ Office, Ndola', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '4 hours', 50, 10.00, true, 'published', false),
    ('Virtual Support Group', 'Monthly virtual support group meeting.', 'Monthly virtual support group for community connection.', ARRAY['support', 'social'], 'virtual', 'Zoom Meeting', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 30, 0.00, true, 'published', false);

-- Sample resources
INSERT INTO public.resources (title, description, resource_type, category, tags, language, difficulty_level, is_featured, is_public) VALUES
    ('Sun Protection Guide', 'Comprehensive guide for sun protection strategies for persons with albinism.', 'document', ARRAY['healthcare', 'education'], ARRAY['sun-protection', 'skincare'], 'en', 'beginner', true, true),
    ('Family Guide to Albinism', 'Educational resource for families to understand albinism.', 'document', ARRAY['education', 'family'], ARRAY['family-support', 'education'], 'en', 'beginner', true, true),
    ('Career Success Stories', 'Video series featuring successful professionals with albinism.', 'video', ARRAY['inspiration', 'career'], ARRAY['careers', 'success-stories'], 'en', 'intermediate', false, true);

-- Update resource stats
UPDATE public.resources SET view_count = FLOOR(RANDOM() * 100) + 10, download_count = FLOOR(RANDOM() * 50) + 5 WHERE is_public = true;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Verify setup
SELECT 'Database setup completed successfully!' as status;