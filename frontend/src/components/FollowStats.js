// frontend/src/components/FollowStats.js
import React, { useState, useEffect } from 'react';
import { useFollow } from '../contexts/FollowContext';
import './FollowStats.css';

const FollowStats = ({ 
  userId, 
  username,
  showLabels = true,
  size = 'medium',
  clickable = true,
  className = '',
  onFollowersClick = () => {},
  onFollowingClick = () => {}
}) => {
  const { getFollowStats, getFollowersCount, getFollowingCount, loading } = useFollow();
  const [stats, setStats] = useState({
    followers_count: 0,
    following_count: 0,
    is_following: false,
    is_followed_by: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  // Update stats from context when available
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      followers_count: getFollowersCount(userId) || prev.followers_count,
      following_count: getFollowingCount(userId) || prev.following_count
    }));
  }, [userId, getFollowersCount, getFollowingCount]);

  const loadStats = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getFollowStats(userId);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading follow stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const handleFollowersClick = () => {
    if (clickable) {
      onFollowersClick(userId, username, stats.followers_count);
    }
  };

  const handleFollowingClick = () => {
    if (clickable) {
      onFollowingClick(userId, username, stats.following_count);
    }
  };

  const getContainerClass = () => {
    return `follow-stats follow-stats--${size} ${className}`.trim();
  };

  const getItemClass = (isClickable) => {
    return `follow-stats__item ${isClickable && clickable ? 'follow-stats__item--clickable' : ''}`.trim();
  };

  if (isLoading || loading.stats) {
    return (
      <div className={getContainerClass()}>
        <div className="follow-stats__loading">
          <div className="follow-stats__skeleton"></div>
          <div className="follow-stats__skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClass()}>
      <div 
        className={getItemClass(true)}
        onClick={handleFollowersClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFollowersClick();
          }
        } : undefined}
      >
        <span className="follow-stats__count">
          {formatCount(stats.followers_count)}
        </span>
        {showLabels && (
          <span className="follow-stats__label">
            {stats.followers_count === 1 ? 'Follower' : 'Followers'}
          </span>
        )}
      </div>

      <div 
        className={getItemClass(true)}
        onClick={handleFollowingClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFollowingClick();
          }
        } : undefined}
      >
        <span className="follow-stats__count">
          {formatCount(stats.following_count)}
        </span>
        {showLabels && (
          <span className="follow-stats__label">
            Following
          </span>
        )}
      </div>

      {/* Optional mutual follow indicator */}
      {stats.is_followed_by && stats.is_following && (
        <div className="follow-stats__mutual">
          <span className="follow-stats__mutual-badge">
            Mutual
          </span>
        </div>
      )}
    </div>
  );
};

export default FollowStats;
