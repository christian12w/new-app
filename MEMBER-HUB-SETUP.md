# AFZ Member Hub - Setup Instructions

This guide will help you set up the complete AFZ Member Hub with real backend functionality.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Ensure Node.js is installed for development
3. **Git**: For version control and deployment

## Step 1: Supabase Setup

### 1.1 Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click \"New Project\"
3. Choose organization and fill project details:
   - **Name**: AFZ Member Hub
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to Zambia (e.g., eu-west-1)

### 1.2 Configure Project Settings

1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOi...`)

### 1.3 Set up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy the entire content from `/database/supabase-schema.sql`
4. Run the query to create all tables and policies

### 1.4 Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: Add your domain (e.g., `https://afz-zambia.com`)
3. **Redirect URLs**: Add both:
   - `https://afz-zambia.com/pages/member-hub.html`
   - `http://localhost:8080/pages/member-hub.html` (for development)

4. **Email Templates**: Customize authentication emails with AFZ branding

## Step 2: Update Frontend Configuration

### 2.1 Update Supabase Client

Edit `js/supabaseClient.js`:

```javascript
var SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
var SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Replace with your actual Supabase credentials.

### 2.2 Environment Variables (Optional)

For better security, create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Authentication Flow Setup

### 3.1 Enable Social Providers (Optional)

1. Go to **Authentication** → **Providers**
2. Enable desired providers:
   - **Google**: For easy sign-up
   - **Facebook**: Popular in Zambia
   - **GitHub**: For tech-savvy users

3. Configure each provider with your app credentials

### 3.2 Email Verification

1. **Authentication** → **Settings**
2. **Enable email confirmations**: Turn ON
3. **Secure email change**: Turn ON
4. Customize email templates with AFZ branding

## Step 4: Row Level Security (RLS)

### 4.1 Verify RLS Policies

The schema includes comprehensive RLS policies. Verify they're enabled:

1. Go to **Table Editor**
2. For each table, check **Settings** → **Row Level Security**
3. Ensure RLS is **Enabled** for all tables

### 4.2 Test Policies

1. Create a test user account
2. Try accessing data through the member portal
3. Verify users can only see/edit their own data

## Step 5: File Storage Setup

### 5.1 Create Storage Buckets

1. Go to **Storage**
2. Create buckets:
   - `avatars` (for user profile pictures)
   - `resources` (for uploaded documents)
   - `event-images` (for event photos)
   - `chat-files` (for chat attachments)

### 5.2 Configure Bucket Policies

For each bucket, set appropriate policies:

```sql
-- Allow authenticated users to upload to avatars
CREATE POLICY \"Users can upload own avatar\" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view public resources
CREATE POLICY \"Public resources are viewable\" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');
```

## Step 6: Real-time Features

### 6.1 Enable Realtime

1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - `chat_messages`
   - `notifications`
   - `events`
   - `event_registrations`

### 6.2 Configure Realtime Policies

Ensure users can only subscribe to data they have access to:

```sql
-- Enable realtime for authenticated users only
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## Step 7: Testing the Setup

### 7.1 Create Test Data

1. **SQL Editor** → Run these queries to create sample data:

```sql
-- Insert test events
INSERT INTO public.events (
  title, description, event_type, start_date, end_date,
  location_type, venue_name, city, organizer_id, status
) VALUES (
  'AFZ Healthcare Workshop',
  'Learn about eye care and skin protection for persons with albinism',
  'workshop',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  'physical',
  'Lusaka Community Center',
  'Lusaka',
  (SELECT id FROM auth.users LIMIT 1),
  'published'
);

-- Insert test resources
INSERT INTO public.resources (
  title, description, resource_type, access_level,
  author_id, status, published_at
) VALUES (
  'Sunscreen Application Guide',
  'Step-by-step guide for proper sunscreen application',
  'guide',
  'public',
  (SELECT id FROM auth.users LIMIT 1),
  'published',
  NOW()
);
```

### 7.2 Test Authentication

1. Open member portal: `/pages/member-hub.html`
2. Try signing up with email
3. Check email for verification link
4. Complete registration and login

### 7.3 Test Features

1. **Dashboard**: Verify stats load correctly
2. **Events**: Check events list and RSVP functionality
3. **Resources**: Test resource browsing and search
4. **Notifications**: Verify real-time notifications work
5. **Profile**: Test profile updates

## Step 8: Production Deployment

### 8.1 Environment Configuration

1. Set production environment variables
2. Update CORS settings in Supabase
3. Configure custom domain authentication URLs

### 8.2 Security Checklist

- [ ] RLS policies tested and working
- [ ] File upload restrictions in place
- [ ] Rate limiting configured
- [ ] API keys secured (not in frontend code)
- [ ] HTTPS enforced
- [ ] Email verification required

### 8.3 Performance Optimization

1. **Database**:
   - Ensure indexes are in place (included in schema)
   - Monitor query performance
   - Set up connection pooling

2. **Frontend**:
   - Enable CDN for static assets
   - Compress images
   - Enable browser caching

## Step 9: Monitoring & Maintenance

### 9.1 Set Up Monitoring

1. **Supabase Dashboard**:
   - Monitor API usage
   - Check database performance
   - Review authentication logs

2. **Error Tracking**:
   - Implement error logging
   - Set up alerts for critical issues

### 9.2 Regular Maintenance

1. **Database**:
   - Regular backups (Supabase handles this)
   - Clean up old notifications
   - Archive old events

2. **Content Moderation**:
   - Review uploaded resources
   - Monitor chat messages
   - Manage user reports

## Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Check Site URL configuration
   - Verify email template settings
   - Check RLS policies

2. **Real-time not working**:
   - Verify realtime is enabled for tables
   - Check subscription permissions
   - Test with browser developer tools

3. **File uploads failing**:
   - Check storage bucket policies
   - Verify file size limits
   - Test with different file types

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [AFZ Technical Support](mailto:tech@afz-zambia.org)
- [Community Discord](https://discord.gg/afz-zambia)

## Next Steps

Once the basic setup is complete, consider implementing:

1. **Advanced Features**:
   - Email notifications for events
   - SMS notifications (via Twilio)
   - Push notifications
   - Advanced analytics

2. **Integrations**:
   - Google Calendar sync
   - Zoom integration for virtual events
   - Payment processing for event fees
   - Social media integration

3. **Mobile App**:
   - React Native or Flutter app
   - Offline capabilities
   - Push notifications

---

**Note**: This setup creates a production-ready member hub. Start with development/staging environment before deploying to production.