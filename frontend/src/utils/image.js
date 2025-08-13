/**
 * Safe image utility functions with robust fallbacks
 * Replaces via.placeholder.com with self-contained data URIs
 */

/**
 * Generate a placeholder data URI with custom text
 * @param title - Text to display in the placeholder
 * @returns Data URI string for placeholder image
 */
export const placeholderDataUri = (title = "No Image") => {
  return `data:image/svg+xml;utf8,` +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
         <rect width='100%' height='100%' fill='#e5e7eb'/>
         <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
               font-family='system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
               font-size='20' fill='#6b7280'>${title}</text>
       </svg>`
    );
};

/**
 * Get a safe portfolio image URL with robust fallbacks
 * @param item - Portfolio item object from API
 * @returns Safe image URL (either valid HTTP URL or data URI)
 */
export const getPortfolioImage = (item) => {
  if (!item) {
    return placeholderDataUri("Portfolio");
  }

  // Try multiple image field possibilities
  const imageUrl = 
    item.image ||
    item.preview_image ||
    item.thumbnail ||
    item.featured_image ||
    (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
    (item.files && Array.isArray(item.files) && item.files.length > 0 ? item.files[0] : null) ||
    null;

  // Validate that we have a proper HTTP URL
  if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Fallback to placeholder with item title
  const title = item.title || item.name || "Portfolio Item";
  return placeholderDataUri(title);
};

/**
 * Get a safe avatar image URL with robust fallbacks
 * @param profile - User profile object from API
 * @returns Safe avatar URL (either valid HTTP URL or data URI)
 */
export const getAvatarImage = (profile) => {
  if (!profile) {
    return placeholderDataUri("User");
  }

  // Try avatar field
  const avatarUrl = profile.avatar;

  // Validate that we have a proper HTTP URL
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    return avatarUrl;
  }

  // Create initials-based placeholder
  const displayName = profile.display_name || profile.displayName || profile.username || "User";
  const initials = displayName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  
  return placeholderDataUri(initials);
};

/**
 * Validate if a URL is a valid HTTP/HTTPS URL
 * @param url - URL string to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Handle image load errors by replacing with placeholder
 * @param event - Image error event
 * @param fallbackTitle - Title for fallback placeholder
 */
export const handleImageError = (event, fallbackTitle = "Image") => {
  if (event.target) {
    event.target.src = placeholderDataUri(fallbackTitle);
    event.target.onerror = null; // Prevent infinite error loops
  }
};

const imageUtils = {
  placeholderDataUri,
  getPortfolioImage,
  getAvatarImage,
  isValidImageUrl,
  handleImageError
};

export default imageUtils;
