-- AFZ Member Portal - Row Level Security Policies
-- Execute this in Supabase SQL Editor AFTER creating tables

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all public profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Chat channels policies
CREATE POLICY "Users can view public channels" ON public.chat_channels
    FOR SELECT USING (type = 'public' OR created_by = auth.uid());

CREATE POLICY "Users can create channels" ON public.chat_channels
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators and admins can update channels" ON public.chat_channels
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Channel members policies
CREATE POLICY "Users can view channel members of channels they belong to" ON public.channel_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.channel_members cm 
            WHERE cm.channel_id = channel_members.channel_id 
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join public channels" ON public.channel_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chat_channels 
            WHERE id = channel_id 
            AND type = 'public'
        )
    );

CREATE POLICY "Users can leave channels" ON public.channel_members
    FOR DELETE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in channels they belong to" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channel_members 
            WHERE channel_id = messages.channel_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to channels they belong to" ON public.messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.channel_members 
            WHERE channel_id = messages.channel_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Moderators and admins can manage messages" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Events policies
CREATE POLICY "Users can view published events" ON public.events
    FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can update own events" ON public.events
    FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Event registrations policies
CREATE POLICY "Users can view registrations for events they're registered to" ON public.event_registrations
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id 
            AND organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON public.event_registrations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own registrations" ON public.event_registrations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can cancel own registrations" ON public.event_registrations
    FOR DELETE USING (user_id = auth.uid());

-- Resources policies
CREATE POLICY "Users can view public resources" ON public.resources
    FOR SELECT USING (is_public = true OR uploaded_by = auth.uid());

CREATE POLICY "Users can upload resources" ON public.resources
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own resources" ON public.resources
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all resources" ON public.resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- User connections policies
CREATE POLICY "Users can view own connections" ON public.user_connections
    FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create connection requests" ON public.user_connections
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can respond to connection requests" ON public.user_connections
    FOR UPDATE USING (addressee_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can delete own connections" ON public.user_connections
    FOR DELETE USING (requester_id = auth.uid() OR addressee_id = auth.uid());