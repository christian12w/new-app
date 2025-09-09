-- AFZ Member Hub - Supabase Database Schema
-- Complete database structure for the member portal

-- Enable Row Level Security and required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- USERS & PROFILES
-- ========================================

-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- AFZ specific fields
    member_type TEXT DEFAULT 'community' CHECK (member_type IN ('community', 'active', 'advocate', 'volunteer', 'admin')),
    member_since DATE DEFAULT CURRENT_DATE,
    albinism_type TEXT CHECK (albinism_type IN ('oculocutaneous', 'ocular', 'hermansky_pudlak', 'chediak_higashi', 'other', 'support_person')),
    support_needs TEXT[], -- Array of support categories
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'members_only', 'private')),
    contact_visibility TEXT DEFAULT 'members_only' CHECK (contact_visibility IN ('public', 'members_only', 'private')),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Accessibility preferences
    accessibility_mode TEXT DEFAULT 'standard' CHECK (accessibility_mode IN ('standard', 'high_contrast', 'albinism_friendly')),
    preferred_theme TEXT DEFAULT 'light' CHECK (preferred_theme IN ('light', 'dark', 'auto')),
    
    -- Notifications preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false
);

-- ========================================
-- EVENTS MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content/agenda
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'meeting', 'conference', 'support_group', 'awareness_campaign', 'fundraiser', 'social', 'medical', 'educational')),
    category TEXT[] NOT NULL, -- Array of categories
    
    -- Date and time
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT DEFAULT 'Africa/Lusaka',
    
    -- Location
    location_type TEXT DEFAULT 'physical' CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
    venue_name TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    country TEXT DEFAULT 'Zambia',
    virtual_link TEXT,
    virtual_platform TEXT,
    
    -- Capacity and registration
    max_capacity INTEGER,
    registration_required BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    registration_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Organization
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    co_organizers UUID[], -- Array of user IDs
    
    -- Content and media
    featured_image TEXT,
    gallery_images TEXT[],
    documents TEXT[], -- Links to related documents/resources
    
    -- Status and visibility
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private', 'invitation_only')),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Event registrations/RSVPs
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Registration details
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    special_requirements TEXT,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    
    -- Payment (if applicable)
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived', 'refunded')),
    payment_amount DECIMAL(10,2),
    payment_method TEXT,
    payment_reference TEXT,
    
    UNIQUE(event_id, user_id)
);

-- ========================================
-- RESOURCES LIBRARY
-- ========================================

CREATE TABLE IF NOT EXISTS public.resource_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT, -- Hex color for UI
    icon TEXT, -- FontAwesome icon class
    parent_category_id UUID REFERENCES public.resource_categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content for articles
    
    -- Resource type and format
    resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'audio', 'article', 'link', 'image', 'toolkit', 'guide')),
    file_format TEXT, -- pdf, docx, mp4, etc.
    file_size BIGINT, -- in bytes
    file_url TEXT,
    external_url TEXT,
    
    -- Categorization
    category_id UUID REFERENCES public.resource_categories(id),
    tags TEXT[],
    target_audience TEXT[] DEFAULT ARRAY['general'], -- 'general', 'children', 'parents', 'healthcare', 'educators', 'advocates'
    language TEXT DEFAULT 'en',
    
    -- Content details
    reading_time INTEGER, -- estimated minutes
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Authorization and access
    access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'members_only', 'premium', 'restricted')),
    download_allowed BOOLEAN DEFAULT true,
    
    -- Publishing
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    published_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Engagement tracking
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource collections (user-created playlists)
CREATE TABLE IF NOT EXISTS public.resource_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-many relationship between collections and resources
CREATE TABLE IF NOT EXISTS public.collection_resources (
    collection_id UUID REFERENCES public.resource_collections(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (collection_id, resource_id)
);

-- Resource interactions (likes, bookmarks, etc.)
CREATE TABLE IF NOT EXISTS public.resource_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'download', 'like', 'bookmark', 'share')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB, -- Additional data like share platform, etc.
    
    UNIQUE(user_id, resource_id, interaction_type)
);

-- ========================================
-- MESSAGING & CHAT SYSTEM
-- ========================================

-- Chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Room type and settings
    room_type TEXT DEFAULT 'public' CHECK (room_type IN ('public', 'private', 'direct', 'support')),
    max_members INTEGER,
    
    -- Moderation
    moderated BOOLEAN DEFAULT false,
    moderator_ids UUID[],
    
    -- Access control
    join_approval_required BOOLEAN DEFAULT false,
    allowed_member_types TEXT[] DEFAULT ARRAY['community', 'active', 'advocate', 'volunteer', 'admin'],
    
    -- System fields
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Settings
    is_active BOOLEAN DEFAULT true
);

-- Chat room memberships
CREATE TABLE IF NOT EXISTS public.chat_room_members (
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Membership details
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Permissions
    can_post BOOLEAN DEFAULT true,
    can_upload_files BOOLEAN DEFAULT true,
    
    -- Notification settings
    notifications_enabled BOOLEAN DEFAULT true,
    notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
    
    PRIMARY KEY (room_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'emoji_reaction')),
    
    -- Rich content
    attachments JSONB, -- File attachments metadata
    mentions UUID[], -- Array of mentioned user IDs
    reply_to UUID REFERENCES public.chat_messages(id), -- Reply to another message
    
    -- Message status
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, emoji)
);

-- ========================================
-- NOTIFICATIONS SYSTEM
-- ========================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('system', 'event', 'message', 'resource', 'connection', 'announcement')),
    
    -- Priority and category
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT NOT NULL,
    
    -- Rich content
    icon TEXT, -- FontAwesome icon
    image_url TEXT,
    action_url TEXT, -- URL to navigate when clicked
    
    -- Metadata
    related_entity_type TEXT, -- 'event', 'resource', 'user', etc.
    related_entity_id UUID,
    metadata JSONB, -- Additional structured data
    
    -- Status
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    delivery_method TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'sms', 'push'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- ========================================
-- CONNECTIONS & NETWORKING
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Connection status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    connection_type TEXT DEFAULT 'general' CHECK (connection_type IN ('general', 'mentor', 'mentee', 'support_buddy', 'advocate_partner')),
    
    -- Request details
    request_message TEXT,
    response_message TEXT,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure no duplicate connections
    UNIQUE(requester_id, addressee_id),
    CHECK(requester_id != addressee_id)
);

-- ========================================
-- ADMIN & MODERATION
-- ========================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN ('user_suspend', 'user_ban', 'content_moderate', 'resource_approve', 'event_approve', 'message_delete')),
    target_type TEXT NOT NULL, -- 'user', 'resource', 'event', 'message', etc.
    target_id UUID NOT NULL,
    
    -- Action metadata
    reason TEXT NOT NULL,
    notes TEXT,
    duration INTERVAL, -- For temporary actions
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- For temporary actions
);

-- ========================================
-- TRIGGERS & FUNCTIONS
-- ========================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to join default chat rooms for new users
CREATE OR REPLACE FUNCTION public.join_default_rooms(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Join user to General Discussion room
    INSERT INTO public.chat_room_members (room_id, user_id, role)
    SELECT cr.id, p_user_id, 'member'
    FROM public.chat_rooms cr
    WHERE cr.name = 'General Discussion'
    AND NOT EXISTS (
        SELECT 1 FROM public.chat_room_members crm 
        WHERE crm.room_id = cr.id AND crm.user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle profile creation and setup
CREATE OR REPLACE FUNCTION public.handle_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Join default chat rooms
    PERFORM public.join_default_rooms(NEW.id);
    
    -- Create welcome notification
    INSERT INTO public.notifications (recipient_id, title, message, notification_type, category)
    VALUES (
        NEW.id,
        'Welcome to AFZ Community!',
        'Welcome to the Albinism Foundation Zambia community. Explore resources, connect with others, and participate in events.',
        'system',
        'welcome'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handling new profile setup
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_created();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_activity on chat rooms
CREATE OR REPLACE FUNCTION update_chat_room_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_rooms 
    SET last_activity = NOW() 
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update chat room activity
DROP TRIGGER IF EXISTS update_room_activity_on_message ON public.chat_messages;
CREATE TRIGGER update_room_activity_on_message AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_room_activity();

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (profile_visibility = 'public' OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR ALL USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (SELECT auth.uid()) AND p.member_type = 'admin'
        )
    );

-- Events policies
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
CREATE POLICY "Public events are viewable by everyone" ON public.events
    FOR SELECT USING (visibility = 'public' OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events
    FOR UPDATE USING ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (SELECT auth.uid()) AND p.member_type = 'admin'
        )
    );

-- Event registrations policies
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
CREATE POLICY "Users can register for events" ON public.event_registrations
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;
CREATE POLICY "Users can view their own registrations" ON public.event_registrations
    FOR SELECT USING ((SELECT auth.uid()) = user_id OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update their own registrations" ON public.event_registrations;
CREATE POLICY "Users can update their own registrations" ON public.event_registrations
    FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Resources policies
DROP POLICY IF EXISTS "Public resources are viewable by everyone" ON public.resources;
CREATE POLICY "Public resources are viewable by everyone" ON public.resources
    FOR SELECT USING (access_level = 'public' OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can create resources" ON public.resources;
CREATE POLICY "Users can create resources" ON public.resources
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update their own resources" ON public.resources;
CREATE POLICY "Users can update their own resources" ON public.resources
    FOR UPDATE USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
CREATE POLICY "Admins can manage all resources" ON public.resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (SELECT auth.uid()) AND p.member_type = 'admin'
        )
    );

-- Resource collections policies
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.resource_collections;
CREATE POLICY "Users can manage their own collections" ON public.resource_collections
    FOR ALL USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public collections are viewable" ON public.resource_collections;
CREATE POLICY "Public collections are viewable" ON public.resource_collections
    FOR SELECT USING (is_public = true OR (SELECT auth.uid()) = user_id);

-- Chat room policies
DROP POLICY IF EXISTS "Users can view public chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can view public chat rooms" ON public.chat_rooms
    FOR SELECT USING (room_type = 'public' OR (SELECT auth.uid()) = created_by OR EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_rooms.id AND user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = created_by);

-- Chat room members policies
DROP POLICY IF EXISTS "Users can view room members of rooms they belong to" ON public.chat_room_members;
CREATE POLICY "Users can view room members of rooms they belong to" ON public.chat_room_members
    FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can join public rooms" ON public.chat_room_members;
CREATE POLICY "Users can join public rooms" ON public.chat_room_members
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = room_id AND room_type = 'public'));

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in rooms they're members of" ON public.chat_messages;
CREATE POLICY "Users can view messages in rooms they're members of" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_room_members 
            WHERE room_id = chat_messages.room_id 
            AND user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages to rooms they belong to" ON public.chat_messages;
CREATE POLICY "Users can send messages to rooms they belong to" ON public.chat_messages
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_room_members 
            WHERE room_id = chat_messages.room_id 
            AND user_id = (SELECT auth.uid())
            AND can_post = true
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
CREATE POLICY "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING ((SELECT auth.uid()) = sender_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR ALL USING ((SELECT auth.uid()) = recipient_id);

-- User connections policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.user_connections;
CREATE POLICY "Users can view their own connections" ON public.user_connections
    FOR SELECT USING ((SELECT auth.uid()) = requester_id OR (SELECT auth.uid()) = addressee_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON public.user_connections;
CREATE POLICY "Users can create connection requests" ON public.user_connections
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = requester_id);

DROP POLICY IF EXISTS "Users can respond to connection requests" ON public.user_connections;
CREATE POLICY "Users can respond to connection requests" ON public.user_connections
    FOR UPDATE USING ((SELECT auth.uid()) = addressee_id OR (SELECT auth.uid()) = requester_id);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_date_status ON public.events(start_date, status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_resources_author ON public.resources(author_id);
CREATE INDEX IF NOT EXISTS idx_resources_status_published ON public.resources(status, published_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON public.chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee ON public.user_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON public.notifications(notification_type, priority);

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert default resource categories (only if they don't exist)
INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Medical & Health', 'Healthcare resources and medical information', '#ef4444', 'fas fa-heartbeat', 1
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Medical & Health');

INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Education & Awareness', 'Educational materials and awareness resources', '#3b82f6', 'fas fa-graduation-cap', 2
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Education & Awareness');

INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Legal & Rights', 'Legal information and rights advocacy', '#8b5cf6', 'fas fa-gavel', 3
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Legal & Rights');

INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Support & Community', 'Community support and social resources', '#10b981', 'fas fa-users', 4
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Support & Community');

INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Employment & Training', 'Job opportunities and skills training', '#f59e0b', 'fas fa-briefcase', 5
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Employment & Training');

INSERT INTO public.resource_categories (name, description, color, icon, sort_order)
SELECT 'Daily Living', 'Practical guides for daily life', '#06b6d4', 'fas fa-home', 6
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories WHERE name = 'Daily Living');

-- Insert default chat rooms (only if they don't exist)
INSERT INTO public.chat_rooms (name, description, room_type)
SELECT 'General Discussion', 'Open discussion for all community members', 'public'
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'General Discussion');

INSERT INTO public.chat_rooms (name, description, room_type)
SELECT 'Healthcare Support', 'Discuss healthcare topics and share experiences', 'public'
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Healthcare Support');

INSERT INTO public.chat_rooms (name, description, room_type)
SELECT 'Advocacy & Rights', 'Advocacy discussions and rights information', 'public'
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Advocacy & Rights');

INSERT INTO public.chat_rooms (name, description, room_type)
SELECT 'Events & Meetups', 'Coordinate events and meetups', 'public'
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Events & Meetups');

INSERT INTO public.chat_rooms (name, description, room_type)
SELECT 'Youth Support', 'Support group for young people', 'private'
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Youth Support');

-- Final verification
SELECT 'AFZ Member Hub database schema setup completed successfully!' as status;