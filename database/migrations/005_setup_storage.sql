-- AFZ Member Portal - Storage Buckets Setup
-- Execute this in Supabase SQL Editor to set up file storage

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('avatars', 'avatars', true),
    ('resources', 'resources', true),
    ('events', 'events', true),
    ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Public avatar access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for resources bucket
CREATE POLICY "Public resource access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'resources' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Resource owners can update" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'resources' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can manage all resources" ON storage.objects 
    FOR ALL USING (
        bucket_id = 'resources' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Storage policies for events bucket
CREATE POLICY "Public event image access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Event organizers can upload images" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'events' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Event organizers can manage images" ON storage.objects 
    FOR ALL USING (
        bucket_id = 'events' AND 
        (
            auth.uid()::text = (storage.foldername(name))[1] OR
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'super_admin', 'moderator')
            )
        )
    );

-- Storage policies for chat files bucket (private)
CREATE POLICY "Chat file access for channel members" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'chat-files' AND 
        EXISTS (
            SELECT 1 FROM public.channel_members cm
            JOIN public.messages m ON m.channel_id = cm.channel_id
            WHERE cm.user_id = auth.uid() 
            AND m.file_url LIKE '%' || name
        )
    );

CREATE POLICY "Channel members can upload chat files" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "File owners can delete chat files" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'chat-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );