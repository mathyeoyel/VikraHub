// Cloudinary Upload Utility
// This file handles file uploads to Cloudinary directly from the frontend

const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with secure_url
 */
export const uploadToCloudinary = async (file, options = {}) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    throw new Error('Cloudinary cloud name not configured. Please set REACT_APP_CLOUDINARY_CLOUD_NAME environment variable.');
  }

  if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'your_upload_preset') {
    throw new Error('Cloudinary upload preset not configured. Please set REACT_APP_CLOUDINARY_UPLOAD_PRESET environment variable.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  // Add optional parameters
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.public_id) {
    formData.append('public_id', options.public_id);
  }

  if (options.tags) {
    formData.append('tags', Array.isArray(options.tags) ? options.tags.join(',') : options.tags);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {FileList|Array} files - Files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file, index) => {
    const fileOptions = {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
    };
    return uploadToCloudinary(file, fileOptions);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Image transformations
 * @returns {string} - Optimized image URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!publicId || !CLOUDINARY_CLOUD_NAME) {
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  // Build transformation string
  const transformArray = [];
  
  if (transformations.width) transformArray.push(`w_${transformations.width}`);
  if (transformations.height) transformArray.push(`h_${transformations.height}`);
  if (transformations.crop) transformArray.push(`c_${transformations.crop}`);
  if (transformations.quality) transformArray.push(`q_${transformations.quality}`);
  if (transformations.format) transformArray.push(`f_${transformations.format}`);
  
  const transformString = transformArray.length > 0 ? `${transformArray.join(',')}/` : '';
  
  return `${baseUrl}/${transformString}${publicId}`;
};

/**
 * Delete an image from Cloudinary (requires backend call for security)
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  // This should be handled by your backend for security reasons
  // Frontend doesn't have access to API secret
  console.warn('Delete operation should be handled by backend for security');
  throw new Error('Delete operation must be handled by backend');
};

// Common transformation presets
export const CLOUDINARY_PRESETS = {
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  hero: {
    width: 1200,
    height: 630,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  portfolio: {
    width: 800,
    height: 600,
    crop: 'fit',
    quality: 'auto',
    format: 'auto'
  }
};
