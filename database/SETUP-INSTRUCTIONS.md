# AFZ Supabase Database Setup Instructions

## 🚀 Quick Setup Guide

Follow these steps to configure your Supabase database for the AFZ Member Portal:

### 1. **Access Supabase SQL Editor**
1. Go to your Supabase project dashboard: `https://vzkbvhqvrazbxbhkynfy.supabase.co`
2. Navigate to the **SQL Editor** in the left sidebar
3. You'll execute each migration file in order

### 2. **Execute Migration Files in Order**

**IMPORTANT:** Execute these files in the exact order listed below:

#### **Step 1: Core Tables Schema**
```sql
-- Copy and paste content from: database/migrations/001_create_core_tables.sql
-- This creates all the main tables (profiles, events, messages, etc.)
```

#### **Step 2: Row Level Security Policies**
```sql
-- Copy and paste content from: database/migrations/002_create_rls_policies.sql
-- This sets up security policies to protect user data
```

#### **Step 3: Database Functions and Triggers**
```sql
-- Copy and paste content from: database/migrations/003_create_functions_triggers.sql
-- This adds automated functionality like timestamps and notifications
```

#### **Step 4: Sample Data**
```sql
-- Copy and paste content from: database/migrations/004_insert_sample_data.sql
-- This adds initial channels, events, and resources for testing
```

#### **Step 5: Storage Buckets**
```sql
-- Copy and paste content from: database/migrations/005_setup_storage.sql
-- This configures file storage for avatars, resources, and chat files
```

#### **Step 6: Admin Dashboard Views**
```sql
-- Copy and paste content from: database/migrations/006_create_admin_views.sql
-- This creates helpful views for the admin dashboard statistics
```

### 3. **Verify Setup**

After executing all migrations, verify your setup:

#### **Check Tables Created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `channel_members`
- `chat_channels`
- `event_registrations`
- `events`
- `messages`
- `notifications`
- `profiles`
- `resources`
- `user_connections`

#### **Check Storage Buckets:**
Go to **Storage** in Supabase and verify these buckets exist:
- `avatars` (public)
- `resources` (public)
- `events` (public)
- `chat-files` (private)

#### **Check Admin Views:**
```sql
SELECT * FROM public.admin_member_stats;
SELECT * FROM public.admin_event_stats;
SELECT * FROM public.admin_recent_activity LIMIT 5;
```

### 4. **Authentication Setup**

#### **Enable Email Authentication:**
1. Go to **Authentication > Settings**
2. Enable **Email** provider
3. Configure email templates if desired

#### **Create First Admin User:**
1. Go to **Authentication > Users**
2. Click **Add User** manually
3. Enter email: `admin@afz-zambia.org`
4. Set a secure password
5. After creation, update their role:

```sql
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'admin@afz-zambia.org';
```

### 5. **Real-time Configuration**

#### **Enable Real-time:**
1. Go to **Database > Replication**
2. Enable replication for these tables:
   - `profiles`
   - `messages`
   - `events`
   - `event_registrations`
   - `notifications`

### 6. **Test the Setup**

#### **Test Member Portal:**
1. Open the member portal: `file:///c:/Users/HP/Desktop/afz/member-hub.html`
2. Try signing up with a new account
3. Check that a profile is automatically created
4. Verify you're added to default channels

#### **Test Admin Dashboard:**
1. Sign in with your admin account
2. Go to the admin dashboard
3. Verify you can see member statistics
4. Check that real-time updates work

### 7. **Production Considerations**

#### **Security Checklist:**
- ✅ RLS policies are enabled on all tables
- ✅ Storage policies restrict access appropriately
- ✅ Admin functions check user roles
- ✅ API keys are properly configured

#### **Performance Optimization:**
- ✅ Indexes are created on frequently queried columns
- ✅ Views are optimized for admin dashboard
- ✅ Real-time subscriptions are scoped appropriately

#### **Backup Strategy:**
- Set up automated backups in Supabase
- Export schema regularly
- Consider point-in-time recovery options

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. RLS Policy Errors**
If you get permission denied errors:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Temporarily disable RLS for testing (NOT for production)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

#### **2. Storage Upload Errors**
If file uploads fail:
- Verify storage policies are correctly set
- Check bucket permissions in Supabase Storage
- Ensure file paths follow the expected format

#### **3. Real-time Not Working**
If real-time updates don't appear:
- Check that replication is enabled for the table
- Verify WebSocket connection in browser dev tools
- Ensure proper channel subscriptions in JavaScript

#### **4. Function Execution Errors**
If triggers or functions fail:
```sql
-- Check function definitions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE 'handle_%';

-- Check trigger status
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## 📊 Database Schema Overview

The AFZ database includes:

- **User Management**: Profiles with roles and status tracking
- **Real-time Chat**: Channels, members, and message history
- **Event System**: Events, registrations, and notifications
- **Resource Library**: Documents, videos, and file management
- **Social Features**: User connections and networking
- **Admin Tools**: Statistics, moderation, and management views

## 🎯 Next Steps

After database setup:

1. **Test all features** in the member portal
2. **Create admin accounts** for your team
3. **Upload initial resources** and create first events
4. **Configure email notifications** (if using)
5. **Set up monitoring** for production use

Your AFZ Member Portal database is now ready for production use!