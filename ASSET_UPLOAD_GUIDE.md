# Asset Upload Guide for VikraHub

## Problem Solved
The broken images in the marketplace were caused by using Django's local file storage on Render's ephemeral filesystem. Assets uploaded through Django admin were being stored locally and lost on deployment restarts.

## Solution: Cloudinary Integration

### For Django Admin Users:

1. **Upload to Cloudinary First**
   - Go to [Cloudinary Console](https://cloudinary.com/console)
   - Upload your preview images and asset files
   - Copy the generated URLs

2. **Asset Upload Process**:

   **For Preview Images:**
   - Upload image to Cloudinary
   - Copy the image URL (e.g., `https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg`)
   - Paste into the "Preview Image" field in Django admin

   **For Asset Files:**
   - Create a ZIP file with your assets
   - Upload ZIP to Cloudinary as a "Raw" file
   - Copy the raw file URL (e.g., `https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/assets.zip`)
   - Paste into the "Asset Files" field in Django admin

3. **URL Format Examples**:
   ```
   Preview Image: https://res.cloudinary.com/vikrahub/image/upload/v1234567890/preview-image.jpg
   Asset Files: https://res.cloudinary.com/vikrahub/raw/upload/v1234567890/asset-package.zip
   ```

### For Frontend Upload (Alternative):
The frontend asset upload form already handles Cloudinary integration automatically. Users can upload files directly through the marketplace interface at `/upload-asset`.

## Benefits:
- ✅ Images display correctly on deployed site
- ✅ Files persist across deployments
- ✅ Fast CDN delivery worldwide
- ✅ Automatic image optimization
- ✅ Scalable file storage

## Next Steps:
1. Update existing assets with Cloudinary URLs
2. Use frontend upload form for new assets (recommended)
3. Or follow the Django admin process above for manual uploads

## Technical Notes:
- The Asset model now uses URLField instead of ImageField/FileField
- Cloudinary URL validation ensures proper format
- Frontend upload form provides better user experience
- All existing functionality (download, purchase, etc.) remains unchanged
