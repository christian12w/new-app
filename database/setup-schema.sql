-- AFZ Member Hub Database Schema
-- Complete database setup for Supabase backend

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'maybe', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('document', 'video', 'image', 'link', 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'event', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    date_of_birth DATE,
    role user_role DEFAULT 'member',
    membership_type TEXT DEFAULT 'standard',
    is_verified BOOLEAN DEFAULT FALSE,
    accessibility_preferences JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "email_visible": false}',
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    timezone TEXT DEFAULT 'Africa/Lusaka',
    location_type TEXT DEFAULT 'physical', -- 'physical', 'virtual', 'hybrid'
    location_name TEXT,
    location_address TEXT,
    virtual_meeting_link TEXT,
    category TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT TRUE,
    registration_deadline TIMESTAMPTZ,
    status event_status DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    cost_amount DECIMAL(10,2) DEFAULT 0,
    cost_currency TEXT DEFAULT 'ZMW',
    requirements TEXT,
    agenda JSONB DEFAULT '[]',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status rsvp_status DEFAULT 'pending',
    registration_data JSONB DEFAULT '{}',
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- ============================================
-- RESOURCES SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'book',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    resource_type resource_type NOT NULL,
    category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    file_url TEXT,
    file_size INTEGER,
    file_mime_type TEXT,
    thumbnail_url TEXT,
    external_url TEXT,
    tags TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    access_level TEXT DEFAULT 'public', -- 'public', 'members', 'restricted'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'public', -- 'public', 'private', 'direct'
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{"allow_files": true, "allow_reactions": true}',
    member_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'member', 'moderator', 'admin'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": false}',
    UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}',
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'event', 'message'
    category TEXT DEFAULT 'general',
    data JSONB DEFAULT '{}',
    action_url TEXT,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER CONNECTIONS/NETWORKING
-- ============================================

CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
    message TEXT,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- ============================================
-- CONTENT MODERATION
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'message', 'resource', 'profile', 'event'
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    action_taken TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = true;

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (
        privacy_settings->>'profile_visible' = 'true' OR 
        auth.uid() = id OR
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Organizers can manage their events" ON events
    FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all events" ON events
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
    );

-- Event registrations policies
CREATE POLICY "Users can view their registrations" ON event_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their registrations" ON event_registrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view all registrations" ON event_registrations
    FOR SELECT USING (
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id)
    );

-- Resources policies
CREATE POLICY "Anyone can view published resources" ON resources
    FOR SELECT USING (
        status = 'published' AND 
        (access_level = 'public' OR auth.uid() IS NOT NULL)
    );

CREATE POLICY "Authors can manage their resources" ON resources
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
    );

-- Resource categories policies
CREATE POLICY "Anyone can view categories" ON resource_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON resource_categories
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
    );

-- Chat channels policies
CREATE POLICY "Members can view their channels" ON chat_channels
    FOR SELECT USING (
        type = 'public' OR 
        auth.uid() IN (SELECT user_id FROM channel_members WHERE channel_id = id)
    );

-- Channel members policies
CREATE POLICY "Users can view channel members" ON channel_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (SELECT user_id FROM channel_members WHERE channel_id = channel_members.channel_id)
    );

-- Messages policies
CREATE POLICY "Channel members can view messages" ON messages
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM channel_members WHERE channel_id = messages.channel_id)
    );

CREATE POLICY "Users can send messages to their channels" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (SELECT user_id FROM channel_members WHERE channel_id = messages.channel_id)
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default resource categories
INSERT INTO resource_categories (name, description, color, icon, sort_order) VALUES
    ('Medical', 'Health and medical resources for persons with albinism', '#EF4444', 'heart', 1),
    ('Education', 'Educational materials and learning resources', '#3B82F6', 'book', 2),
    ('Legal', 'Legal rights and advocacy information', '#8B5CF6', 'scale', 3),
    ('Support', 'Community support and counseling resources', '#10B981', 'users', 4),
    ('Safety', 'Sun protection and safety guidelines', '#F59E0B', 'shield', 5),
    ('Community', 'Community events and social resources', '#EC4899', 'heart', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert default chat channels
INSERT INTO chat_channels (name, description, type, settings) VALUES
    ('General Discussion', 'Open discussion for all community members', 'public', '{"allow_files": true, "allow_reactions": true}'),
    ('Healthcare Support', 'Share experiences and advice about healthcare', 'public', '{"allow_files": true, "allow_reactions": true}'),
    ('Advocacy & Rights', 'Discuss advocacy efforts and rights issues', 'public', '{"allow_files": true, "allow_reactions": true}'),
    ('Events & Meetups', 'Coordinate and discuss community events', 'public', '{"allow_files": true, "allow_reactions": true}'),
    ('Youth Support', 'Support group for young people with albinism', 'public', '{"allow_files": true, "allow_reactions": true}')
ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('avatars', 'avatars', true),
    ('resources', 'resources', true),
    ('events', 'events', true),
    ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Resource files are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resources' AND 
        auth.role() = 'authenticated'
    );

-- ============================================
-- COMPLETED SCHEMA SETUP
-- ============================================

-- This schema provides:
-- ✅ User profiles with roles and preferences
-- ✅ Events system with RSVP functionality
-- ✅ Resource library with categories
-- ✅ Real-time chat system
-- ✅ Notification system
-- ✅ User connections/networking
-- ✅ Content moderation
-- ✅ File storage integration
-- ✅ Row Level Security (RLS)
-- ✅ Performance optimized indexes
-- ✅ Automatic triggers and functions