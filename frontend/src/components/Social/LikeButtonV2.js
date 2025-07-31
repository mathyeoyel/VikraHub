import React from 'react';
import ToggleButton from '../UI/ToggleButton';

/**
 * Specialized Like/Unlike button component
 * Built on top of the reusable ToggleButton component
 * Supports posts, blogs, comments, and blog comments
 */
const LikeButtonV2 = ({
  type = 'post', // 'post', 'blog', 'comment', 'blog-comment'
  id,
  initialLiked = false,
  initialCount = 0,
  size = 'medium',
  variant = 'default',
  showCount = true,
  showIcon = true,
  showText = false,
  onLikeChange,
  onError,
  className = '',
  ...props
}) => {
  // API functions for like/unlike
  const handleLike = async (itemId) => {
    try {
      let response;
      
      // Dynamic import to avoid circular dependencies
      const { postsAPI, commentsAPI, blogEngagementAPI } = await import('../../api');
      
      switch (type) {
        case 'post':
          response = await postsAPI.like(itemId);
          break;
        case 'blog':
          response = await blogEngagementAPI.likeBlog(itemId);
          break;
        case 'comment':
          response = await commentsAPI.like(itemId);
          break;
        case 'blog-comment':
          response = await blogEngagementAPI.likeBlogComment(itemId);
          break;
        default:
          throw new Error(`Unsupported like type: ${type}`);
      }

      // Normalize response format
      return {
        status: response.data?.status || response.status || 'liked',
        like_count: response.data?.like_count || response.like_count || initialCount + 1,
        data: response
      };
    } catch (error) {
      console.error(`${type} like API error:`, error);
      throw error;
    }
  };

  const handleUnlike = async (itemId) => {
    try {
      let response;
      
      // Dynamic import to avoid circular dependencies
      const { postsAPI, commentsAPI, blogEngagementAPI } = await import('../../api');
      
      switch (type) {
        case 'post':
          response = await postsAPI.like(itemId); // Same endpoint toggles
          break;
        case 'blog':
          response = await blogEngagementAPI.likeBlog(itemId);
          break;
        case 'comment':
          response = await commentsAPI.like(itemId);
          break;
        case 'blog-comment':
          response = await blogEngagementAPI.likeBlogComment(itemId);
          break;
        default:
          throw new Error(`Unsupported like type: ${type}`);
      }

      // Normalize response format
      return {
        status: response.data?.status || response.status || 'unliked',
        like_count: response.data?.like_count || response.like_count || Math.max(0, initialCount - 1),
        data: response
      };
    } catch (error) {
      console.error(`${type} unlike API error:`, error);
      throw error;
    }
  };

  // Handle state changes
  const handleStateChange = (changeData) => {
    if (onLikeChange) {
      onLikeChange({
        id,
        type,
        isLiked: changeData.isActive,
        likeCount: changeData.count,
        ...changeData
      });
    }
  };

  // Handle errors with context-specific messages
  const handleError = (error, defaultMessage) => {
    let errorMessage = defaultMessage;
    
    if (error.response?.status === 401) {
      errorMessage = `Please log in to like this ${type}`;
    } else if (error.response?.status === 404) {
      errorMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} not found`;
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || 'Invalid request';
    } else if (error.response?.status === 403) {
      errorMessage = `You cannot like this ${type}`;
    }

    if (onError) {
      onError(error, errorMessage);
    } else {
      console.error('Like error:', errorMessage);
      // Don't show alert for like errors as they're not critical
    }
  };

  // Get appropriate icons for different content types
  const getIcons = () => {
    switch (type) {
      case 'post':
      case 'blog':
        return {
          activeIcon: '❤️',
          inactiveIcon: '🤍'
        };
      case 'comment':
      case 'blog-comment':
        return {
          activeIcon: '👍',
          inactiveIcon: '👍🏻'
        };
      default:
        return {
          activeIcon: '❤️',
          inactiveIcon: '🤍'
        };
    }
  };

  const icons = getIcons();

  return (
    <ToggleButton
      id={id}
      initialState={initialLiked}
      initialCount={initialCount}
      
      // Button text and icons
      activeText="Liked"
      inactiveText="Like"
      activeIcon={icons.activeIcon}
      inactiveIcon={icons.inactiveIcon}
      loadingIcon="⟳"
      
      // API functions
      activateAPI={handleLike}
      deactivateAPI={handleUnlike}
      
      // Styling
      size={size}
      variant={variant}
      showCount={showCount}
      showIcon={showIcon}
      showText={showText}
      className={`toggle-button--like ${className}`}
      
      // Behavior
      requireAuth={true}
      
      // Callbacks
      onStateChange={handleStateChange}
      onError={handleError}
      
      // Accessibility
      title={initialLiked ? 
        `Unlike this ${type}` : 
        `Like this ${type}`
      }
      ariaLabel={`${initialLiked ? 'Unlike' : 'Like'} this ${type}`}
      
      {...props}
    />
  );
};

export default LikeButtonV2;
