import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import './LikeButton.css';

const LikeButton = ({ 
  type = 'post', // 'post', 'blog', 'comment', 'blog-comment'
  id, 
  initialLiked = false, 
  initialCount = 0,
  onLikeChange,
  size = 'medium',
  showCount = true,
  className = '',
  disabled = false
}) => {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please log in to like this content');
      return;
    }

    if (isLoading || disabled) return;

    setIsLoading(true);
    
    try {
      let response;
      
      // Import APIs dynamically to avoid circular imports
      const { postsAPI, commentsAPI, blogEngagementAPI } = await import('../../api');
      
      switch (type) {
        case 'post':
          response = await postsAPI.like(id);
          break;
        case 'blog':
          response = await blogEngagementAPI.likeBlog(id);
          break;
        case 'comment':
          response = await commentsAPI.like(id);
          break;
        case 'blog-comment':
          response = await blogEngagementAPI.likeBlogComment(id);
          break;
        default:
          throw new Error(`Unsupported like type: ${type}`);
      }

      const newIsLiked = response.data.status === 'liked';
      const newCount = response.data.like_count;

      setIsLiked(newIsLiked);
      setLikeCount(newCount);

      // Notify parent component
      if (onLikeChange) {
        onLikeChange({
          id,
          type,
          isLiked: newIsLiked,
          likeCount: newCount
        });
      }
    } catch (error) {
      console.error('Error liking content:', error);
      alert('Failed to like content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClass = () => {
    let baseClass = `like-button like-button--${size}`;
    if (isLiked) baseClass += ' like-button--liked';
    if (isLoading) baseClass += ' like-button--loading';
    if (disabled) baseClass += ' like-button--disabled';
    if (className) baseClass += ` ${className}`;
    return baseClass;
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <button
      onClick={handleLike}
      className={getButtonClass()}
      disabled={isLoading || disabled}
      title={isLiked ? 'Unlike' : 'Like'}
      aria-label={isLiked ? 'Unlike this content' : 'Like this content'}
    >
      <span className="like-button__icon">
        {isLoading ? (
          <span className="like-button__spinner"><i className="fas fa-spinner fa-spin icon"></i></span>
        ) : isLiked ? (
          <i className="fas fa-heart icon"></i>
        ) : (
          <i className="far fa-heart icon"></i>
        )}
      </span>
      {showCount && (
        <span className="like-button__count">
          {formatCount(likeCount)}
        </span>
      )}
    </button>
  );
};

export default LikeButton;
