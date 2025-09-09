-- Quick fix for format_file_size function type mismatch
-- Run this in Supabase SQL Editor if you get the function type error

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.format_file_size(bigint);
DROP FUNCTION IF EXISTS public.format_file_size(numeric);

-- Recreate function with correct parameter type
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

-- Recreate the storage analytics view
DROP VIEW IF EXISTS public.storage_analytics;
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

-- Verify the fix
SELECT 'Storage analytics function fixed successfully!' as status;