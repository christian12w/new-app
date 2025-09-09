-- AFZ Database Fix - UUID Error Resolution
-- Use this script if you encounter UUID vs string ID errors

-- This script fixes the common error:
-- ERROR: 22P02: invalid input syntax for type uuid: "cat_health"

-- Step 1: Clean up any problematic sample data (if it exists)
DELETE FROM public.resources WHERE category_id::text LIKE 'cat_%';
DELETE FROM public.resource_categories WHERE id::text LIKE 'cat_%';

-- Step 2: Insert resource categories with proper UUIDs
INSERT INTO public.resource_categories (name, description, color, icon, sort_order) VALUES
    ('Health & Wellness', 'Medical care, sun protection, skin health, and wellness resources', '#ef4444', 'fa-heartbeat', 1),
    ('Education', 'Educational materials, training resources, and learning guides', '#3b82f6', 'fa-graduation-cap', 2),
    ('Advocacy & Rights', 'Legal rights, advocacy tools, and empowerment resources', '#10b981', 'fa-balance-scale', 3),
    ('Support Groups', 'Peer support, counseling resources, and community building', '#f59e0b', 'fa-hands-helping', 4),
    ('Family & Parenting', 'Resources for families and parents of children with albinism', '#8b5cf6', 'fa-users', 5),
    ('Workplace & Career', 'Employment resources, workplace accommodations, and career guidance', '#06b6d4', 'fa-briefcase', 6),
    ('Legal Resources', 'Legal guides, rights documentation, and policy information', '#6366f1', 'fa-gavel', 7)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- Step 3: Insert sample resources with proper category references
INSERT INTO public.resources (
    title, description, content, resource_type, category_id, 
    tags, language, difficulty_level, access_level, download_allowed, 
    status, published_at, view_count, download_count, like_count
) VALUES
    (
        'Complete Sun Protection Guide',
        'Comprehensive guide covering sun protection strategies, sunscreen selection, and UV safety for persons with albinism.',
        '<h2>Sun Protection for Persons with Albinism</h2><p>This comprehensive guide covers essential sun protection strategies including proper sunscreen use, protective clothing, and environmental awareness.</p>',
        'guide',
        (SELECT id FROM public.resource_categories WHERE name = 'Health & Wellness'),
        ARRAY['sun protection', 'UV safety', 'skincare', 'health'],
        'en',
        'beginner',
        'public',
        true,
        'published',
        NOW(),
        245,
        89,
        34
    ),
    (
        'Albinism Awareness Toolkit',
        'Educational toolkit for schools, workplaces, and communities to promote understanding and inclusion.',
        '<h2>Albinism Awareness Toolkit</h2><p>This toolkit provides resources for educators, employers, and community leaders to create inclusive environments.</p>',
        'toolkit',
        (SELECT id FROM public.resource_categories WHERE name = 'Education'),
        ARRAY['awareness', 'education', 'inclusion', 'toolkit'],
        'en',
        'intermediate',
        'public',
        true,
        'published',
        NOW(),
        156,
        67,
        28
    ),
    (
        'Legal Rights Handbook for Persons with Albinism',
        'Comprehensive handbook covering legal rights, anti-discrimination laws, and advocacy strategies in Zambia.',
        '<h2>Legal Rights and Advocacy</h2><p>Know your rights and learn how to advocate for yourself and others in the community.</p>',
        'document',
        (SELECT id FROM public.resource_categories WHERE name = 'Legal Resources'),
        ARRAY['legal rights', 'advocacy', 'disability law', 'human rights'],
        'en',
        'advanced',
        'public',
        true,
        'published',
        NOW(),
        198,
        123,
        45
    )
ON CONFLICT DO NOTHING;

-- Verify the fix worked
SELECT 'Categories Count' AS check_type, COUNT(*) AS count FROM public.resource_categories
UNION ALL
SELECT 'Resources Count' AS check_type, COUNT(*) AS count FROM public.resources;

-- Show sample data
SELECT 
    r.title,
    rc.name AS category_name,
    r.resource_type,
    r.view_count
FROM public.resources r
JOIN public.resource_categories rc ON r.category_id = rc.id
ORDER BY r.view_count DESC
LIMIT 5;