// frontend/src/components/FollowButton/FollowButtonPersistent.js
import React from 'react';
import { useFollow } from '../../hooks/useFollow';
import { useAuth } from '../Auth/AuthContext';
import './FollowButton.css';

/**
 * New persistent FollowButton component using React Query
 * Ensures follow state persists across page reloads and is idempotent
 */
const FollowButtonPersistent = ({ 
  userId, 
  username,
  size = 'medium',
  variant = 'primary',
  className = '',
  onFollowChange = () => {},
  showCount = false,
  disabled = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const {
    isFollowing,
    followersCount,
    isLoading,
    isFollowingUser,
    isUnfollowingUser,
    error,
    toggleFollow
  } = useFollow(userId);

  // Don't show follow button for current user or if not authenticated
  if (!isAuthenticated || !user || user.id === parseInt(userId)) {
    return null;
  }

  const handleFollowClick = async () => {
    if (disabled || isFollowingUser || isUnfollowingUser) return;
    
    try {
      await toggleFollow(userId);
      
      // Notify parent component of change
      onFollowChange({
        userId,
        username,
        isFollowing: !isFollowing,
        followerCount: isFollowing ? followersCount - 1 : followersCount + 1
      });
    } catch (error) {
      console.error('Follow operation failed:', error);
    }
  };

  const getButtonText = () => {
    if (isFollowingUser) return 'Following...';
    if (isUnfollowingUser) return 'Unfollowing...';
    return isFollowing ? 'Following' : 'Follow';
  };

  const getButtonClass = () => {
    const baseClass = 'follow-button';
    const sizeClass = `follow-button--${size}`;
    const variantClass = `follow-button--${variant}`;
    const stateClass = isFollowing ? 'follow-button--following' : 'follow-button--not-following';
    const loadingClass = (isFollowingUser || isUnfollowingUser) ? 'follow-button--loading' : '';
    const disabledClass = disabled ? 'follow-button--disabled' : '';
    
    return `${baseClass} ${sizeClass} ${variantClass} ${stateClass} ${loadingClass} ${disabledClass} ${className}`.trim();
  };

  return (
    <div className="follow-button-container">
      <button
        onClick={handleFollowClick}
        disabled={disabled || isFollowingUser || isUnfollowingUser || isLoading}
        className={getButtonClass()}
        title={isFollowing ? `Unfollow ${username}` : `Follow ${username}`}
        aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${username}`}
      >
        <span className="follow-button__content">
          {/* Icon */}
          <span className="follow-button__icon">
            {isFollowingUser || isUnfollowingUser ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : isFollowing ? (
              <i className="fas fa-check"></i>
            ) : (
              <i className="fas fa-plus"></i>
            )}
          </span>
          
          {/* Text */}
          <span className="follow-button__text">
            {getButtonText()}
          </span>
          
          {/* Count (optional) */}
          {showCount && (
            <span className="follow-button__count">
              {followersCount || 0}
            </span>
          )}
        </span>
      </button>
      
      {/* Error message */}
      {error && (
        <div className="follow-button__error">
          <small className="text-danger">
            {error.message || 'Failed to update follow status'}
          </small>
        </div>
      )}
    </div>
  );
};

export default FollowButtonPersistent;
