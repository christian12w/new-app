-- AFZ Member Portal - Core Tables Schema
-- Execute this in Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('member', 'moderator', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE membership_type AS ENUM ('standard', 'premium', 'lifetime');

-- Profiles table (extends Supabase auth.users)
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

-- Chat channels table
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

-- Channel members (many-to-many)
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

-- Messages table
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

-- Events table
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

-- Event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    status text default 'attending' check (status in ('attending', 'maybe', 'not_attending', 'pending')),
    notes text,
    registered_at timestamp with time zone default now(),
    UNIQUE(event_id, user_id)
);

-- Resources table
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

-- Notifications table
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

-- User connections table (for networking)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx ON public.profiles(last_active_at);

CREATE INDEX IF NOT EXISTS messages_channel_idx ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_user_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events(start_date);
CREATE INDEX IF NOT EXISTS events_organizer_idx ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS events_featured_idx ON public.events(featured);

CREATE INDEX IF NOT EXISTS event_registrations_event_idx ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS event_registrations_user_idx ON public.event_registrations(user_id);

CREATE INDEX IF NOT EXISTS resources_type_idx ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS resources_category_idx ON public.resources USING GIN(category);
CREATE INDEX IF NOT EXISTS resources_featured_idx ON public.resources(is_featured);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at);