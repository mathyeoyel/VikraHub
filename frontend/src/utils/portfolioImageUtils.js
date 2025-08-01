// Portfolio Image Utility
// This utility helps handle portfolio image loading with fallbacks

export const handleImageError = (event, fallbackSrc = '/assets/default-asset-placeholder.svg') => {
  const img = event.target;
  if (img.dataset.retried) {
    // Already tried fallback, hide the image
    img.style.display = 'none';
    console.warn(`Failed to load image and fallback: ${img.src}`);
    return;
  }
  
  // Try fallback image
  img.dataset.retried = 'true';
  img.src = fallbackSrc;
  console.warn(`Failed to load portfolio image, using fallback: ${img.dataset.originalSrc || img.src}`);
};

export const createPortfolioImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/default-asset-placeholder.svg';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
    return imagePath;
  }
  
  // If it's an absolute path, return as is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // If it's just a filename (like "sample.jpg"), check if it's likely an invalid reference
  if (!imagePath.includes('/') && imagePath.includes('.')) {
    console.warn(`Portfolio image appears to be just a filename: ${imagePath}, using fallback`);
    return '/assets/default-asset-placeholder.svg';
  }
  
  // For relative paths, construct portfolio path
  return `/portfolio/${imagePath}`;
};

export const preloadPortfolioImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};
