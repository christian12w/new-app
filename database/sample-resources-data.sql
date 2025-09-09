-- AFZ Member Portal - Sample Resources Data
-- Populate the database with sample resource categories and resources

-- Insert sample resource categories (using UUIDs)
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

-- Insert sample resources
INSERT INTO public.resources (
    title, description, content, resource_type, category_id, 
    tags, language, difficulty_level, access_level, download_allowed, 
    status, published_at, view_count, download_count, like_count
) VALUES
    (
        'Complete Sun Protection Guide',
        'Comprehensive guide covering sun protection strategies, sunscreen selection, and UV safety for persons with albinism.',
        '<h2>Sun Protection for Persons with Albinism</h2><p>This comprehensive guide covers essential sun protection strategies including proper sunscreen use, protective clothing, and environmental awareness.</p><h3>Key Topics:</h3><ul><li>Understanding UV radiation</li><li>Choosing the right sunscreen</li><li>Protective clothing and accessories</li><li>Creating UV-safe environments</li></ul>',
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
        '<h2>Albinism Awareness Toolkit</h2><p>This toolkit provides resources for educators, employers, and community leaders to create inclusive environments.</p><h3>Included Materials:</h3><ul><li>Fact sheets about albinism</li><li>Presentation templates</li><li>Activity guides</li><li>Accommodation checklists</li></ul>',
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
        '<h2>Legal Rights and Advocacy</h2><p>Know your rights and learn how to advocate for yourself and others in the community.</p><h3>Topics Covered:</h3><ul><li>Constitutional rights</li><li>Disability legislation</li><li>Workplace protections</li><li>Educational rights</li><li>Healthcare access</li></ul>',
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
    ),
    (
        'Family Support Guide: Raising Children with Albinism',
        'Practical guide for parents and families, covering health care, education, and emotional support.',
        '<h2>Supporting Your Child with Albinism</h2><p>A comprehensive guide for parents navigating the journey of raising a child with albinism.</p><h3>Essential Topics:</h3><ul><li>Early childhood care</li><li>Educational advocacy</li><li>Building self-confidence</li><li>Connecting with support networks</li></ul>',
        'guide',
        (SELECT id FROM public.resource_categories WHERE name = 'Family & Parenting'),
        ARRAY['parenting', 'family support', 'child development', 'advocacy'],
        'en',
        'beginner',
        'public',
        true,
        'published',
        NOW(),
        187,
        94,
        56
    ),
    (
        'Workplace Accommodations Guide',
        'Detailed guide on workplace accommodations, rights, and creating inclusive work environments.',
        '<h2>Workplace Accommodations for Persons with Albinism</h2><p>Learn about your rights to workplace accommodations and how to request them effectively.</p><h3>Key Areas:</h3><ul><li>Visual accommodations</li><li>Environmental modifications</li><li>Technology solutions</li><li>Legal framework</li></ul>',
        'document',
        (SELECT id FROM public.resource_categories WHERE name = 'Workplace & Career'),
        ARRAY['workplace', 'accommodations', 'employment', 'accessibility'],
        'en',
        'intermediate',
        'public',
        true,
        'published',
        NOW(),
        134,
        78,
        29
    ),
    (
        'Starting a Support Group: Community Building Guide',
        'Step-by-step guide for establishing and maintaining effective support groups in your community.',
        '<h2>Building Strong Support Communities</h2><p>Learn how to create and sustain meaningful support groups that make a real difference.</p><h3>Guide Contents:</h3><ul><li>Planning and preparation</li><li>Facilitation techniques</li><li>Resource mobilization</li><li>Sustainability strategies</li></ul>',
        'guide',
        (SELECT id FROM public.resource_categories WHERE name = 'Support Groups'),
        ARRAY['support groups', 'community building', 'facilitation', 'organizing'],
        'en',
        'intermediate',
        'public',
        true,
        'published',
        NOW(),
        98,
        45,
        22
    ),
    (
        'Advocacy Training Video Series',
        'Comprehensive video training series on effective advocacy strategies and techniques.',
        '<h2>Advocacy Training Series</h2><p>Master the art of advocacy with this comprehensive video training series featuring expert speakers and real-world examples.</p><h3>Video Topics:</h3><ul><li>Introduction to advocacy</li><li>Policy and legislation</li><li>Media engagement</li><li>Grassroots organizing</li></ul>',
        'video',
        (SELECT id FROM public.resource_categories WHERE name = 'Advocacy & Rights'),
        ARRAY['advocacy', 'training', 'video series', 'activism'],
        'en',
        'intermediate',
        'members_only',
        false,
        'published',
        NOW(),
        267,
        0,
        89
    ),
    (
        'Health Monitoring Checklist',
        'Essential health monitoring checklist for persons with albinism, including regular screenings and preventive care.',
        '<h2>Health Monitoring for Persons with Albinism</h2><p>Stay on top of your health with this comprehensive monitoring checklist and screening guide.</p><h3>Monitoring Areas:</h3><ul><li>Skin health assessments</li><li>Vision care schedule</li><li>Dermatology check-ups</li><li>General health maintenance</li></ul>',
        'document',
        (SELECT id FROM public.resource_categories WHERE name = 'Health & Wellness'),
        ARRAY['health monitoring', 'preventive care', 'medical checklist', 'wellness'],
        'en',
        'beginner',
        'public',
        true,
        'published',
        NOW(),
        156,
        87,
        34
    ),
    (
        'Inclusive Education Policy Framework',
        'Policy framework and implementation guide for creating inclusive educational environments.',
        '<h2>Creating Inclusive Educational Environments</h2><p>Comprehensive policy framework for educational institutions to ensure full inclusion of students with albinism.</p><h3>Framework Components:</h3><ul><li>Policy development</li><li>Implementation strategies</li><li>Training programs</li><li>Evaluation metrics</li></ul>',
        'document',
        (SELECT id FROM public.resource_categories WHERE name = 'Education'),
        ARRAY['inclusive education', 'policy', 'framework', 'implementation'],
        'en',
        'advanced',
        'public',
        true,
        'published',
        NOW(),
        89,
        34,
        18
    ),
    (
        'AFZ Annual Impact Report 2024',
        'Comprehensive annual report showcasing AFZ achievements, programs, and community impact throughout 2024.',
        '<h2>AFZ 2024 Annual Impact Report</h2><p>Discover the incredible impact AFZ has made in the community throughout 2024, including program outcomes, success stories, and future initiatives.</p><h3>Report Highlights:</h3><ul><li>Program achievements</li><li>Community stories</li><li>Financial transparency</li><li>Future plans</li></ul>',
        'document',
        (SELECT id FROM public.resource_categories WHERE name = 'Advocacy & Rights'),
        ARRAY['annual report', 'impact', 'achievements', 'transparency'],
        'en',
        'beginner',
        'public',
        true,
        'published',
        NOW(),
        423,
        156,
        67
    );

-- Grant necessary permissions
GRANT SELECT ON public.resource_categories TO anon, authenticated;
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.resource_interactions TO authenticated;