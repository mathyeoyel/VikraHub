// frontend/src/components/FollowButton.js
import React, { useState, useEffect } from 'react';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from './Auth/AuthContext';
import { followAPI } from '../api';
import './FollowButton.css';

const FollowButton = ({ 
  userId, 
  username, 
  initialFollowState = null,
  size = 'medium',
  variant = 'primary',
  className = '',
  onFollowChange = () => {}
}) => {
  const { user } = useAuth();
  const { 
    followUser, 
    unfollowUser, 
    isFollowing, 
    getFollowStats, 
    loading 
  } = useFollow();
  
  const [isFollowingUser, setIsFollowingUser] = useState(initialFollowState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load follow state on mount
  useEffect(() => {
    if (initialFollowState === null && userId && user && user.id !== userId) {
      loadFollowState();
    } else {
      setIsFollowingUser(initialFollowState);
    }
  }, [userId, initialFollowState, user]);

  // Update local state when context state changes
  useEffect(() => {
    if (userId && user && user.id !== userId) {
      setIsFollowingUser(isFollowing(userId));
    }
  }, [userId, isFollowing, user]);

  // Don't show follow button for current user
  if (!user || user.id === userId) {
    return null;
  }

  const loadFollowState = async () => {
    if (!userId) return;
    
    try {
      const result = await getFollowStats(userId);
      if (result.success) {
        setIsFollowingUser(result.data.is_following);
      }
    } catch (error) {
      console.error('Error loading follow state:', error);
    }
  };

  const handleFollowClick = async () => {
    if (isLoading || loading.follow) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      if (isFollowingUser) {
        // Use direct API call for unfollow
        result = await followAPI.unfollow(userId);
        setIsFollowingUser(false);
      } else {
        // Use direct API call for follow
        result = await followAPI.follow(userId);
        setIsFollowingUser(true);
      }
      
      // Notify parent component
      onFollowChange(!isFollowingUser, userId, username);
      
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      setError('Failed to update follow status');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading || loading.follow) {
      return isFollowingUser ? 'Unfollowing...' : 'Following...';
    }
    return isFollowingUser ? 'Following' : 'Follow';
  };

  const getButtonClass = () => {
    const baseClass = 'follow-button';
    const sizeClass = `follow-button--${size}`;
    const variantClass = `follow-button--${variant}`;
    const stateClass = isFollowingUser ? 'follow-button--following' : 'follow-button--not-following';
    const loadingClass = (isLoading || loading.follow) ? 'follow-button--loading' : '';
    
    return `${baseClass} ${sizeClass} ${variantClass} ${stateClass} ${loadingClass} ${className}`.trim();
  };

  return (
    <div className="follow-button-container">
      <button
        onClick={handleFollowClick}
        disabled={isLoading || loading.follow}
        className={getButtonClass()}
        title={isFollowingUser ? `Unfollow ${username}` : `Follow ${username}`}
      >
        <span className="follow-button__text">
          {getButtonText()}
        </span>
        
        {(isLoading || loading.follow) && (
          <span className="follow-button__spinner">
            <i className="fas fa-spinner spinner"></i>
          </span>
        )}
      </button>
      
      {error && (
        <div className="follow-button__error">
          {error}
        </div>
      )}
    </div>
  );
};

export default FollowButton;
