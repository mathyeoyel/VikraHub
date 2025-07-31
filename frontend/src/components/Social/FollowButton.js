import React from 'react';
import ToggleButton from '../UI/ToggleButton';
import { userAPI } from '../../api';

/**
 * Specialized Follow/Unfollow button component
 * Built on top of the reusable ToggleButton component
 */
const FollowButton = ({
  userId,
  username,
  initialFollowing = false,
  initialFollowerCount = 0,
  size = 'medium',
  variant = 'outline',
  showCount = false,
  showIcon = true,
  showText = true,
  onFollowChange,
  onError,
  className = '',
  ...props
}) => {
  // API functions for follow/unfollow
  const handleFollow = async (id) => {
    try {
      const response = await userAPI.follow(id);
      return {
        status: 'followed',
        follow_count: response.follow_count || initialFollowerCount + 1,
        data: response
      };
    } catch (error) {
      console.error('Follow API error:', error);
      throw error;
    }
  };

  const handleUnfollow = async (id) => {
    try {
      const response = await userAPI.unfollow(id);
      return {
        status: 'unfollowed',
        follow_count: response.follow_count || Math.max(0, initialFollowerCount - 1),
        data: response
      };
    } catch (error) {
      console.error('Unfollow API error:', error);
      throw error;
    }
  };

  // Handle state changes
  const handleStateChange = (changeData) => {
    if (onFollowChange) {
      onFollowChange({
        userId,
        username,
        isFollowing: changeData.isActive,
        followerCount: changeData.count,
        ...changeData
      });
    }
  };

  // Handle errors with user-friendly messages
  const handleError = (error, defaultMessage) => {
    let errorMessage = defaultMessage;
    
    if (error.response?.status === 401) {
      errorMessage = 'Please log in to follow users';
    } else if (error.response?.status === 404) {
      errorMessage = 'User not found';
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || 'Invalid request';
    } else if (error.response?.status === 403) {
      errorMessage = 'You cannot follow this user';
    }

    if (onError) {
      onError(error, errorMessage);
    } else {
      alert(errorMessage);
    }
  };

  return (
    <ToggleButton
      id={userId}
      initialState={initialFollowing}
      initialCount={initialFollowerCount}
      
      // Button text and icons
      activeText="Following"
      inactiveText="Follow"
      activeIcon="✓"
      inactiveIcon="+"
      loadingIcon="⟳"
      
      // API functions
      activateAPI={handleFollow}
      deactivateAPI={handleUnfollow}
      
      // Styling
      size={size}
      variant={variant}
      showCount={showCount}
      showIcon={showIcon}
      showText={showText}
      className={`toggle-button--follow ${className}`}
      
      // Behavior
      requireAuth={true}
      
      // Callbacks
      onStateChange={handleStateChange}
      onError={handleError}
      
      // Accessibility
      title={initialFollowing ? 
        `Unfollow ${username || 'user'}` : 
        `Follow ${username || 'user'}`
      }
      ariaLabel={`${initialFollowing ? 'Unfollow' : 'Follow'} ${username || 'user'}`}
      
      {...props}
    />
  );
};

export default FollowButton;
