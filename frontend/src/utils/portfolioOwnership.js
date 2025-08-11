// Portfolio Ownership Utilities
// Centralized functions for checking portfolio item ownership

/**
 * Check if the current user owns a portfolio item
 * @param {Object} portfolioItem - The portfolio item object
 * @param {Object} currentUser - The current authenticated user
 * @returns {boolean} - True if user owns the item
 */
export const isPortfolioOwner = (portfolioItem, currentUser) => {
  if (!portfolioItem || !currentUser) {
    return false;
  }
  
  // Check direct user object
  if (portfolioItem.user && portfolioItem.user.id === currentUser.id) {
    return true;
  }
  
  // Check user_id field (alternative structure)
  if (portfolioItem.user_id === currentUser.id) {
    return true;
  }
  
  return false;
};

/**
 * Validate portfolio ownership and show appropriate error
 * @param {Object} portfolioItem - The portfolio item object
 * @param {Object} currentUser - The current authenticated user
 * @param {string} action - The action being attempted (edit, delete, etc.)
 * @returns {boolean} - True if validation passes
 */
export const validatePortfolioOwnership = (portfolioItem, currentUser, action = 'modify') => {
  if (!currentUser) {
    alert(`You must be logged in to ${action} portfolio items.`);
    return false;
  }
  
  if (!isPortfolioOwner(portfolioItem, currentUser)) {
    alert(`You can only ${action} your own portfolio items.`);
    return false;
  }
  
  return true;
};

/**
 * Log ownership validation attempts for debugging
 * @param {Object} portfolioItem - The portfolio item object
 * @param {Object} currentUser - The current authenticated user
 * @param {string} action - The action being attempted
 * @param {boolean} isAuthorized - Whether the action is authorized
 */
export const logOwnershipCheck = (portfolioItem, currentUser, action, isAuthorized) => {
  console.log(`🔒 Portfolio ownership check for ${action}:`, {
    itemId: portfolioItem?.id,
    itemOwner: portfolioItem?.user?.username || portfolioItem?.user_id,
    currentUser: currentUser?.username || currentUser?.id,
    isAuthorized,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get owner display name for a portfolio item
 * @param {Object} portfolioItem - The portfolio item object
 * @returns {string} - Owner display name
 */
export const getPortfolioOwnerName = (portfolioItem) => {
  if (!portfolioItem) return 'Unknown';
  
  if (portfolioItem.user) {
    return portfolioItem.user.username || 
           `${portfolioItem.user.first_name} ${portfolioItem.user.last_name}`.trim() ||
           portfolioItem.user.email ||
           'Unknown User';
  }
  
  return 'Unknown';
};

/**
 * Check if current user can perform bulk operations on portfolio items
 * @param {Array} portfolioItems - Array of portfolio items
 * @param {Object} currentUser - The current authenticated user
 * @returns {Object} - Result with canPerform boolean and unauthorized items array
 */
export const validateBulkPortfolioOwnership = (portfolioItems, currentUser) => {
  if (!currentUser) {
    return {
      canPerform: false,
      unauthorizedItems: portfolioItems,
      message: 'You must be logged in to perform bulk operations.'
    };
  }
  
  const unauthorizedItems = portfolioItems.filter(item => 
    !isPortfolioOwner(item, currentUser)
  );
  
  return {
    canPerform: unauthorizedItems.length === 0,
    unauthorizedItems,
    message: unauthorizedItems.length > 0 
      ? `You can only modify your own portfolio items. ${unauthorizedItems.length} item(s) are not owned by you.`
      : 'All items are owned by you.'
  };
};
