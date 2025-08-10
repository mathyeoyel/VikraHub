// Portfolio Image Utility
// This utility helps handle portfolio image loading with fallbacks

export const handleImageError = (event, fallbackSrc = '/assets/default-asset-placeholder.svg') => {
  const img = event.target;
  
  if (img.dataset.retried) {
    // Already tried fallback, hide the image and show placeholder
    img.style.display = 'none';
    console.warn(`Failed to load image and fallback: ${img.src}`);
    
    // Create a placeholder div to replace the image
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      background: #f5f5f5;
      border: 2px dashed #ddd;
      border-radius: 8px;
      color: #999;
      text-align: center;
      font-family: inherit;
    `;
    placeholder.innerHTML = `
      <div>
        <i class="fas fa-image" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
        <p style="margin: 0; font-size: 14px;">Image not available</p>
      </div>
    `;
    
    // Replace the image with the placeholder
    if (img.parentNode) {
      img.parentNode.replaceChild(placeholder, img);
    }
    return;
  }
  
  // Try fallback image first
  img.dataset.retried = 'true';
  img.src = fallbackSrc;
  console.warn(`Failed to load portfolio image, trying fallback: ${img.dataset.originalSrc || img.src}`);
};

export const createPortfolioImageUrl = (imagePath) => {
  if (!imagePath || imagePath === 'W.png') {
    console.warn('Invalid or problematic image path detected, using fallback');
    return '/assets/default-asset-placeholder.svg';
  }
  
  // If already a full URL (including Cloudinary), return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
    console.log('🌐 Using full URL for image:', imagePath);
    return imagePath;
  }
  
  // If it's an absolute path, return as is
  if (imagePath.startsWith('/')) {
    console.log('📁 Using absolute path for image:', imagePath);
    return imagePath;
  }
  
  // If it's just a filename (like "sample.jpg"), check if it's likely an invalid reference
  if (!imagePath.includes('/') && imagePath.includes('.')) {
    console.warn(`Portfolio image appears to be just a filename: ${imagePath}, checking media paths`);
    
    // Try common Django media paths
    const mediaUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = mediaUrl.replace('/api/', '');
    
    // Try multiple possible media paths
    const possiblePaths = [
      `${baseUrl}/media/portfolio/${imagePath}`,
      `${baseUrl}/media/portfolios/${imagePath}`,
      `${baseUrl}/media/portfolio_images/${imagePath}`,
      `${baseUrl}/media/${imagePath}`
    ];
    
    console.log('🔍 Trying media paths for filename:', possiblePaths[0]);
    return possiblePaths[0]; // Return the first one, let error handling deal with fallbacks
  }
  
  // For relative paths, construct portfolio path
  const portfolioUrl = `/portfolio/${imagePath}`;
  console.log('📂 Using relative portfolio path:', portfolioUrl);
  return portfolioUrl;
};

export const preloadPortfolioImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

// Helper function to get all possible image URLs for a portfolio item
export const getPortfolioImageUrls = (item) => {
  const possibleFields = [
    item.image,
    item.preview_image,
    item.thumbnail,
    item.photo,
    item.picture,
    item.imageUrl
  ].filter(Boolean); // Remove null/undefined values
  
  return possibleFields.map(field => createPortfolioImageUrl(field));
};

// Helper function to try loading an image with multiple fallback URLs
export const createImageWithFallbacks = (imageUrls, onLoad, onError) => {
  if (!imageUrls || imageUrls.length === 0) {
    if (onError) onError();
    return null;
  }
  
  let currentIndex = 0;
  const img = new Image();
  
  const tryNext = () => {
    if (currentIndex >= imageUrls.length) {
      if (onError) onError();
      return;
    }
    
    img.onload = () => {
      if (onLoad) onLoad(img, imageUrls[currentIndex]);
    };
    
    img.onerror = () => {
      currentIndex++;
      tryNext();
    };
    
    img.src = imageUrls[currentIndex];
  };
  
  tryNext();
  return img;
};
