// frontend/src/utils/imageUtils.js

/**
 * Global image error handler for fallback avatars and images
 * @param {Event} e - The error event from the img element
 * @param {string} fallbackType - Type of fallback ('avatar', 'cover', 'general')
 */
export const handleImageError = (e, fallbackType = 'avatar') => {
  const fallbacks = {
    avatar: '/assets/default-avatar.png',
    cover: '/assets/default-cover.jpg', 
    general: '/assets/placeholder.png',
    logo: '/assets/default-logo.png'
  };
  
  const fallbackUrl = fallbacks[fallbackType] || fallbacks.general;
  
  // Prevent infinite loop if fallback image also fails
  if (e.target.src !== fallbackUrl) {
    e.target.src = fallbackUrl;
  } else {
    // If even fallback fails, use a data URL with a simple placeholder
    e.target.src = generateDataUrlAvatar(e.target.alt || 'User');
  }
};

/**
 * Generate a simple data URL avatar with initials
 * @param {string} name - Name to extract initials from
 * @returns {string} Data URL for the generated avatar
 */
export const generateDataUrlAvatar = (name) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 60;
  canvas.height = 60;
  
  // Background
  ctx.fillStyle = '#000223';
  ctx.fillRect(0, 0, 60, 60);
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Get initials
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  ctx.fillText(initials || '?', 30, 30);
  
  return canvas.toDataURL();
};

/**
 * Get appropriate avatar URL with fallback
 * @param {Object} user - User object
 * @returns {string} Avatar URL or generated placeholder
 */
export const getAvatarUrl = (user) => {
  if (user?.avatar) {
    return user.avatar;
  }
  
  if (user?.profile_picture) {
    return user.profile_picture;
  }
  
  // Generate UI Avatars URL as fallback
  const name = user?.full_name || 
               `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
               user?.username || 
               'User';
               
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000223&color=ffffff&size=60`;
};
