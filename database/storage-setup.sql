-- AFZ Member Portal - Supabase Storage Buckets Setup
-- Execute this in Supabase SQL Editor to set up storage buckets and policies

-- ========================================
-- CREATE STORAGE BUCKETS
-- ========================================

-- Create buckets for different types of file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('resources', 'resources', true, 52428800, ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg'
])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('events', 'events', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('chat-files', 'chat-files', false, 26214400, ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mp3', 'audio/wav'
])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- CREATE STORAGE POLICIES
-- ========================================

-- AVATARS BUCKET POLICIES
-- Allow public viewing of avatars
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- RESOURCES BUCKET POLICIES
-- Allow public viewing of resources
DROP POLICY IF EXISTS "Public resource access" ON storage.objects;
CREATE POLICY "Public resource access" ON storage.objects
    FOR SELECT USING (bucket_id = 'resources');

-- Allow admins to upload resources
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
CREATE POLICY "Admins can upload resources" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resources' 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND member_type = 'admin'
        )
    );

-- Allow admins to update resources
DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
CREATE POLICY "Admins can update resources" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resources' 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND member_type = 'admin'
        )
    );

-- Allow admins to delete resources
DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;
CREATE POLICY "Admins can delete resources" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resources' 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND member_type = 'admin'
        )
    );

-- EVENTS BUCKET POLICIES
-- Allow public viewing of event images
DROP POLICY IF EXISTS "Public event image access" ON storage.objects;
CREATE POLICY "Public event image access" ON storage.objects
    FOR SELECT USING (bucket_id = 'events');

-- Allow authenticated users to upload event images
DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
CREATE POLICY "Users can upload event images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'events' 
        AND (SELECT auth.uid()) IS NOT NULL
    );

-- Allow event creators to manage their event images
DROP POLICY IF EXISTS "Users can manage own event images" ON storage.objects;
CREATE POLICY "Users can manage own event images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'events' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- CHAT FILES BUCKET POLICIES (Private bucket)
-- Allow users to view files in rooms they belong to
DROP POLICY IF EXISTS "Users can view chat files in their rooms" ON storage.objects;
CREATE POLICY "Users can view chat files in their rooms" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-files' 
        AND EXISTS (
            SELECT 1 FROM public.chat_room_members crm
            JOIN public.chat_messages cm ON cm.room_id = crm.room_id
            WHERE crm.user_id = (SELECT auth.uid())
            AND cm.attachments ? 'file_path'
            AND cm.attachments->>'file_path' = name
        )
    );

-- Allow users to upload chat files
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
CREATE POLICY "Users can upload chat files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-files' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own chat files
DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;
CREATE POLICY "Users can delete own chat files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-files' 
        AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
    );

-- ========================================
-- HELPER FUNCTIONS FOR STORAGE
-- ========================================

-- Function to get file size in a readable format
CREATE OR REPLACE FUNCTION public.format_file_size(size_bytes numeric)
RETURNS text AS $$
BEGIN
    IF size_bytes IS NULL OR size_bytes = 0 THEN
        RETURN '0 B';
    ELSIF size_bytes < 1024 THEN
        RETURN size_bytes || ' B';
    ELSIF size_bytes < 1048576 THEN
        RETURN ROUND(size_bytes / 1024.0, 1) || ' KB';
    ELSIF size_bytes < 1073741824 THEN
        RETURN ROUND(size_bytes / 1048576.0, 1) || ' MB';
    ELSE
        RETURN ROUND(size_bytes / 1073741824.0, 1) || ' GB';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate file upload permissions
CREATE OR REPLACE FUNCTION public.can_user_upload_to_bucket(bucket_name text, user_id uuid)
RETURNS boolean AS $$
BEGIN
    CASE bucket_name
        WHEN 'avatars' THEN
            -- Anyone can upload avatars
            RETURN user_id IS NOT NULL;
        WHEN 'resources' THEN
            -- Only admins can upload resources
            RETURN EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = user_id AND member_type = 'admin'
            );
        WHEN 'events' THEN
            -- Any authenticated user can upload event images
            RETURN user_id IS NOT NULL;
        WHEN 'chat-files' THEN
            -- Any authenticated user can upload chat files
            RETURN user_id IS NOT NULL;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STORAGE ANALYTICS VIEW
-- ========================================

-- View for storage usage analytics
CREATE OR REPLACE VIEW public.storage_analytics AS
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    COALESCE(SUM(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::bigint 
        ELSE 0 END), 0) as total_size_bytes,
    public.format_file_size(COALESCE(SUM(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::bigint 
        ELSE 0 END), 0)::numeric) as total_size_formatted,
    COALESCE(AVG(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::bigint 
        ELSE NULL END), 0) as avg_file_size,
    MIN(created_at) as first_upload,
    MAX(created_at) as last_upload
FROM storage.objects
WHERE bucket_id IN ('avatars', 'resources', 'events', 'chat-files')
GROUP BY bucket_id;

-- Grant permissions to view storage analytics for admins
GRANT SELECT ON public.storage_analytics TO authenticated;

-- Verification message
SELECT 'Supabase Storage buckets and policies setup completed successfully!' as status;