# AFZ Member Portal - Supabase Storage Setup Instructions

## Overview
This guide walks you through setting up Supabase Storage buckets and policies for the AFZ Member Portal, enabling secure file uploads for avatars, resources, events, and chat attachments.

## Prerequisites
- Supabase project created and configured
- Database schema from `supabase-schema.sql` already applied
- Admin access to Supabase dashboard

## Setup Steps

### 1. Execute Storage Setup SQL

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your AFZ project

2. **Run Storage Setup Script**
   - Navigate to `SQL Editor` in the left sidebar
   - Copy the contents of `database/storage-setup.sql`
   - Paste and execute the script
   - Verify successful execution

### 2. Configure Supabase Client

1. **Get your Supabase credentials**
   - In Supabase Dashboard, go to `Settings` → `API`
   - Copy your `Project URL` and `anon/public key`

2. **Update configuration file**
   - Open `js/services/supabase-config.js`
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key
   - Verify the URL matches your project

```javascript
const SUPABASE_CONFIG = {
    url: 'https://vzkbvhqvrazbxbhkynfy.supabase.co',
    anonKey: 'your-actual-anon-key-here',
};
```

### 3. Add Supabase Client Library

Add the Supabase JavaScript client to your HTML pages:

```html
<!-- Add before closing </head> tag -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/services/supabase-config.js"></script>
<script src="js/components/file-upload.js"></script>
```

### 4. Verify Storage Buckets

1. **Check bucket creation**
   - In Supabase Dashboard, go to `Storage`
   - Verify these buckets exist:
     - `avatars` (public, 5MB limit)
     - `resources` (public, 50MB limit)  
     - `events` (public, 10MB limit)
     - `chat-files` (private, 25MB limit)

2. **Test bucket policies**
   - Try uploading a test file to each bucket
   - Verify permissions work correctly

## Usage Examples

### Basic File Upload Component

```html
<!-- Avatar upload -->
<div id="avatar-upload"></div>

<script>
// Initialize avatar upload
const avatarUpload = new FileUploadComponent('avatar-upload', {
    uploadType: 'avatars',
    maxFiles: 1,
    allowMultiple: false,
    onSuccess: (files) => {
        console.log('Avatar uploaded:', files);
        // Update user profile with new avatar URL
    },
    onError: (errors) => {
        console.error('Upload failed:', errors);
    }
});
</script>
```

### Resource Upload (Admin Only)

```html
<!-- Resource upload for admins -->
<div id="resource-upload"></div>

<script>
// Initialize resource upload
const resourceUpload = new FileUploadComponent('resource-upload', {
    uploadType: 'resources',
    maxFiles: 5,
    allowMultiple: true,
    showPreview: true,
    onSuccess: (files) => {
        console.log('Resources uploaded:', files);
        // Add to resources database
    },
    customValidation: (file) => {
        // Additional validation if needed
        return { valid: true };
    }
});
</script>
```

### Event Image Upload

```html
<!-- Event image upload -->
<div id="event-upload"></div>

<script>
const eventUpload = new FileUploadComponent('event-upload', {
    uploadType: 'events',
    maxFiles: 3,
    allowMultiple: true,
    onSuccess: (files) => {
        console.log('Event images uploaded:', files);
        // Update event with image URLs
    }
});
</script>
```

## Storage Bucket Configuration

### Bucket Details

| Bucket | Purpose | Size Limit | Access | File Types |
|--------|---------|------------|--------|------------|
| `avatars` | User profile pictures | 5MB | Public | Images only |
| `resources` | Community resources | 50MB | Public | Documents, images, videos, audio |
| `events` | Event featured images | 10MB | Public | Images only |
| `chat-files` | Chat attachments | 25MB | Private | Documents, images, limited video/audio |

### Security Policies

- **Avatars**: Users can only upload/manage their own avatars
- **Resources**: Only admin users can upload resources
- **Events**: Any authenticated user can upload event images
- **Chat Files**: Users can upload files but only access files in rooms they belong to

## Troubleshooting

### Common Issues

1. **"Access denied" errors**
   - Check if user is authenticated
   - Verify user has correct permissions (admin role for resources)
   - Ensure RLS policies are correctly applied

2. **File upload fails**
   - Check file size against bucket limits
   - Verify file type is allowed
   - Check browser console for detailed errors

3. **CORS errors**
   - Ensure your domain is added to Supabase CORS settings
   - For local development, add `localhost:8080` to allowed origins

### Checking Upload Permissions

Use this helper function to check if a user can upload to a specific bucket:

```javascript
async function checkUploadPermission(bucketName) {
    const client = window.SupabaseConfig.getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
        console.log('User not authenticated');
        return false;
    }
    
    const { data, error } = await client.rpc('can_user_upload_to_bucket', {
        bucket_name: bucketName,
        user_id: user.id
    });
    
    return data;
}
```

## Storage Analytics

View storage usage analytics (admin only):

```javascript
async function getStorageAnalytics() {
    const client = window.SupabaseConfig.getSupabaseClient();
    const { data, error } = await client
        .from('storage_analytics')
        .select('*');
    
    if (error) {
        console.error('Error fetching analytics:', error);
        return null;
    }
    
    return data;
}
```

## Security Best Practices

1. **File Validation**
   - Always validate file types and sizes on both client and server
   - Implement virus scanning for production use
   - Sanitize file names to prevent path traversal

2. **Access Control**
   - Use RLS policies to enforce permissions
   - Regularly audit bucket access patterns
   - Monitor storage usage and costs

3. **Content Moderation**
   - Implement content moderation for user uploads
   - Have a process for removing inappropriate content
   - Log all upload activities for audit trails

## Next Steps

1. Test all upload functionality thoroughly
2. Set up content moderation workflows
3. Configure CDN for better performance (optional)
4. Implement file compression for large uploads
5. Set up automated backups for critical storage buckets

---

## Support

For issues or questions about storage setup:
1. Check Supabase documentation: https://supabase.com/docs/guides/storage
2. Review browser console for error messages
3. Test with different file types and sizes
4. Verify authentication state before uploads