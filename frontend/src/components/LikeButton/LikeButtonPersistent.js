// frontend/src/components/LikeButton/LikeButtonPersistent.js
import React from 'react';
import { useLike } from '../../hooks/useFollow';
import { useAuth } from '../Auth/AuthContext';
import './LikeButton.css';

/**
 * New persistent LikeButton component using React Query
 * Ensures like state persists across page reloads and is idempotent
 */
const LikeButtonPersistent = ({ 
  itemType, // 'post', 'blog', 'comment'
  itemId,
  size = 'medium',
  variant = 'primary',
  className = '',
  onLikeChange = () => {},
  showCount = true,
  disabled = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const {
    isLiked,
    likeCount,
    isLoading,
    isToggling,
    error,
    toggleLike
  } = useLike(itemType, itemId);

  // Don't show like button if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLikeClick = async () => {
    if (disabled || isToggling) return;
    
    try {
      await toggleLike();
      
      // Notify parent component of change
      onLikeChange({
        itemType,
        itemId,
        isLiked: !isLiked,
        likeCount: isLiked ? likeCount - 1 : likeCount + 1
      });
    } catch (error) {
      console.error('Like operation failed:', error);
    }
  };

  const getButtonText = () => {
    if (isToggling) return isLiked ? 'Unliking...' : 'Liking...';
    return isLiked ? 'Liked' : 'Like';
  };

  const getButtonClass = () => {
    const baseClass = 'like-button';
    const sizeClass = `like-button--${size}`;
    const variantClass = `like-button--${variant}`;
    const stateClass = isLiked ? 'like-button--liked' : 'like-button--not-liked';
    const loadingClass = isToggling ? 'like-button--loading' : '';
    const disabledClass = disabled ? 'like-button--disabled' : '';
    
    return `${baseClass} ${sizeClass} ${variantClass} ${stateClass} ${loadingClass} ${disabledClass} ${className}`.trim();
  };

  return (
    <div className="like-button-container">
      <button
        onClick={handleLikeClick}
        disabled={disabled || isToggling || isLoading}
        className={getButtonClass()}
        title={isLiked ? `Unlike this ${itemType}` : `Like this ${itemType}`}
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this ${itemType}`}
      >
        <span className="like-button__content">
          {/* Icon */}
          <span className="like-button__icon">
            {isToggling ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : isLiked ? (
              <i className="fas fa-heart"></i>
            ) : (
              <i className="far fa-heart"></i>
            )}
          </span>
          
          {/* Count (optional) */}
          {showCount && (
            <span className="like-button__count">
              {likeCount || 0}
            </span>
          )}
        </span>
      </button>
      
      {/* Error message */}
      {error && (
        <div className="like-button__error">
          <small className="text-danger">
            {error.message || 'Failed to update like status'}
          </small>
        </div>
      )}
    </div>
  );
};

export default LikeButtonPersistent;
