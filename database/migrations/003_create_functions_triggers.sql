-- AFZ Member Portal - Database Functions and Triggers
-- Execute this in Supabase SQL Editor AFTER creating tables and policies

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role::text 
        FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean AS $$
BEGIN
    RETURN (
        SELECT CASE 
            WHEN role = 'super_admin' THEN true
            WHEN role = 'admin' AND required_role IN ('admin', 'moderator', 'member') THEN true
            WHEN role = 'moderator' AND required_role IN ('moderator', 'member') THEN true
            WHEN role = 'member' AND required_role = 'member' THEN true
            ELSE false
        END
        FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join default channels for new users
CREATE OR REPLACE FUNCTION public.join_default_channels(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Join the general channel (create if it doesn't exist)
    INSERT INTO public.chat_channels (id, name, description, type)
    VALUES (
        'general-channel-uuid'::uuid,
        'General Discussion',
        'Welcome to the AFZ community! This is where we have general discussions.',
        'public'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Add user to general channel
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES ('general-channel-uuid'::uuid, user_id, 'member')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    
    -- Join the announcements channel
    INSERT INTO public.chat_channels (id, name, description, type)
    VALUES (
        'announcements-uuid'::uuid,
        'Announcements',
        'Official announcements from the AFZ team.',
        'public'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Add user to announcements channel
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES ('announcements-uuid'::uuid, user_id, 'member')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    target_user_id uuid,
    notification_title text,
    notification_message text,
    notification_type text DEFAULT 'system',
    notification_priority text DEFAULT 'normal',
    notification_data jsonb DEFAULT '{}',
    action_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (
        user_id, title, message, type, priority, data, action_url
    ) VALUES (
        target_user_id, notification_title, notification_message, 
        notification_type, notification_priority, notification_data, action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update event attendee count
CREATE OR REPLACE FUNCTION public.update_event_stats()
RETURNS trigger AS $$
BEGIN
    -- This could be expanded to update event statistics
    -- For now, it's a placeholder for future stats tracking
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.chat_channels
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to join default channels when profile is created
CREATE OR REPLACE FUNCTION public.handle_profile_created()
RETURNS trigger AS $$
BEGIN
    -- Join default channels
    PERFORM public.join_default_channels(NEW.id);
    
    -- Create welcome notification
    PERFORM public.create_notification(
        NEW.id,
        'Welcome to AFZ!',
        'Welcome to the Albinism Foundation of Zambia community. We''re excited to have you here!',
        'system',
        'normal',
        '{"welcome": true}'::jsonb
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_created();

-- Create trigger for event registration notifications
CREATE OR REPLACE FUNCTION public.handle_event_registration()
RETURNS trigger AS $$
DECLARE
    event_title text;
    organizer_id uuid;
BEGIN
    -- Get event details
    SELECT title, organizer_id INTO event_title, organizer_id
    FROM public.events WHERE id = NEW.event_id;
    
    -- Notify event organizer
    IF organizer_id IS NOT NULL AND organizer_id != NEW.user_id THEN
        PERFORM public.create_notification(
            organizer_id,
            'New Event Registration',
            'Someone registered for your event: ' || event_title,
            'event',
            'normal',
            jsonb_build_object('event_id', NEW.event_id, 'registration_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_registration
    AFTER INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_event_registration();