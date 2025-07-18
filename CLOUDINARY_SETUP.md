# Cloudinary Setup Guide

This project now uses Cloudinary for media file uploads instead of AWS S3. Files are uploaded directly from the frontend to Cloudinary, and the URLs are stored in the Django database.

## Setup Instructions

### 1. Create a Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. Note your **Cloud Name**, **API Key**, and **API Secret** from the dashboard

### 2. Create an Upload Preset
1. Go to your Cloudinary Console
2. Navigate to **Settings** > **Upload** > **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `vikrahub_uploads` (or any name you prefer)
   - **Signing Mode**: Select **Unsigned** for frontend uploads
   - **Folder**: Set a default folder like `vikrahub/`
   - **Allowed formats**: `jpg,jpeg,png,gif,webp`
   - **Max file size**: Set appropriate limits (e.g., 10MB)
   - **Image transformations**: Add any default transformations you want

### 3. Configure Environment Variables

#### Frontend (.env file)
Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=vikrahub_uploads
REACT_APP_CLOUDINARY_API_KEY=your_api_key
```

#### Backend (.env file or environment variables)
Add these to your backend environment (optional, for future backend operations):

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Features

#### Current Implementation:
- ✅ Avatar uploads in profile editing
- ✅ Direct frontend-to-Cloudinary uploads
- ✅ Automatic URL storage in Django models
- ✅ Error handling and upload progress
- ✅ Image optimization and transformations

#### Ready for Extension:
- Portfolio item images
- Blog post images
- Service images
- Team member photos
- Creative asset previews

## Usage

### Basic Upload (Avatar Example)
```javascript
import { uploadToCloudinary } from '../utils/cloudinary';

const handleFileUpload = async (file) => {
  try {
    const result = await uploadToCloudinary(file, {
      folder: 'avatars',
      tags: ['avatar', 'profile']
    });
    
    // result.secure_url contains the Cloudinary URL
    setImageUrl(result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Image Display with Transformations
```javascript
import { getCloudinaryUrl, CLOUDINARY_PRESETS } from '../utils/cloudinary';

// Get optimized avatar URL
const avatarUrl = getCloudinaryUrl(publicId, CLOUDINARY_PRESETS.avatar);

// Custom transformations
const customUrl = getCloudinaryUrl(publicId, {
  width: 300,
  height: 200,
  crop: 'fill',
  quality: 'auto'
});
```

## Model Changes

All image fields have been converted from `ImageField` to `URLField`:

- `UserProfile.avatar` - Stores Cloudinary URL
- `Service.image` - Stores Cloudinary URL  
- `PortfolioItem.image` - Stores Cloudinary URL
- `BlogPost.image` - Stores Cloudinary URL
- `TeamMember.image` - Stores Cloudinary URL
- `CreativeAsset.preview_image` - Stores Cloudinary URL
- `CreativeAsset.asset_files` - Stores Cloudinary URL for file downloads

## Security Notes

1. **Upload Presets**: Use unsigned presets for frontend uploads
2. **Folder Organization**: Organize uploads in folders (avatars/, portfolio/, etc.)
3. **File Validation**: Client-side validation is supplemented by Cloudinary's upload restrictions
4. **Backend Validation**: URLs are validated on the Django side as well

## Benefits Over S3

1. **Easier Setup**: No complex IAM policies or credentials management
2. **Better Performance**: Built-in CDN and image optimization
3. **Simpler Frontend**: Direct uploads without presigned URLs
4. **Image Transformations**: Real-time image transformations via URL
5. **Free Tier**: Generous free tier for development

## Troubleshooting

### Upload Errors
- Check that your upload preset allows unsigned uploads
- Verify the file format is in your allowed formats list
- Ensure file size is within limits

### Environment Variables
- Make sure all REACT_APP_ variables are set correctly
- Restart the development server after changing .env files
- Check that your Cloudinary cloud name is correct (no spaces or special characters)

### CORS Issues
- Cloudinary automatically handles CORS for uploads
- No additional configuration needed

## Migration from S3

The migration removes all AWS S3 dependencies:
- ✅ Removed `django-storages` and `boto3` packages
- ✅ Removed S3 configuration from settings
- ✅ Converted all ImageField to URLField
- ✅ Updated frontend upload logic
- ✅ Database migration completed

Existing uploaded files on S3 would need to be manually migrated to Cloudinary if needed.
