// frontend/src/components/FollowNotifications.js
import React, { useState, useEffect } from 'react';
import { useFollow } from '../contexts/FollowContext';
import FollowButton from './FollowButton';
import './FollowNotifications.css';

const FollowNotifications = ({ 
  limit = 10,
  showMarkAllRead = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = ''
}) => {
  const { 
    followNotifications,
    unreadNotificationsCount,
    loadFollowNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loading
  } = useFollow();

  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    loadFollowNotifications();
  }, []);

  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadFollowNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Update displayed notifications when data changes
  useEffect(() => {
    const notificationsToShow = limit > 0 
      ? followNotifications.slice(0, limit)
      : followNotifications;
    
    setDisplayedNotifications(notificationsToShow);
  }, [followNotifications, limit]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const NotificationItem = ({ notification }) => (
    <div 
      className={`follow-notification ${!notification.is_read ? 'follow-notification--unread' : ''}`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="follow-notification__avatar">
        {notification.follower.profile_picture ? (
          <img 
            src={notification.follower.profile_picture} 
            alt={notification.follower.username}
            className="follow-notification__avatar-image"
          />
        ) : (
          <div className="follow-notification__avatar-placeholder">
            {notification.follower.full_name?.charAt(0) || notification.follower.username.charAt(0)}
          </div>
        )}
      </div>

      <div className="follow-notification__content">
        <div className="follow-notification__message">
          <strong>{notification.follower.full_name || notification.follower.username}</strong>
          <span> started following you</span>
        </div>
        
        <div className="follow-notification__time">
          {getTimeAgo(notification.follow_date)}
        </div>
      </div>

      <div className="follow-notification__action">
        <FollowButton
          userId={notification.follower.id}
          username={notification.follower.username}
          size="small"
          variant="outline"
        />
      </div>

      {!notification.is_read && (
        <div className="follow-notification__unread-indicator"></div>
      )}
    </div>
  );

  if (loading.notifications && displayedNotifications.length === 0) {
    return (
      <div className={`follow-notifications follow-notifications--loading ${className}`}>
        <div className="follow-notifications__header">
          <h3>Follow Notifications</h3>
        </div>
        <div className="follow-notifications__loading">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="follow-notification-skeleton">
              <div className="follow-notification-skeleton__avatar"></div>
              <div className="follow-notification-skeleton__content">
                <div className="follow-notification-skeleton__line"></div>
                <div className="follow-notification-skeleton__line follow-notification-skeleton__line--short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`follow-notifications ${className}`}>
      <div className="follow-notifications__header">
        <h3>
          Follow Notifications
          {unreadNotificationsCount > 0 && (
            <span className="follow-notifications__count">
              {unreadNotificationsCount}
            </span>
          )}
        </h3>
        
        {showMarkAllRead && unreadNotificationsCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="follow-notifications__mark-all-read"
            disabled={loading.notifications}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="follow-notifications__list">
        {displayedNotifications.length === 0 ? (
          <div className="follow-notifications__empty">
            <div className="follow-notifications__empty-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <p>No follow notifications yet</p>
            <small>You'll see notifications here when someone follows you</small>
          </div>
        ) : (
          displayedNotifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
            />
          ))
        )}
      </div>

      {followNotifications.length > limit && (
        <div className="follow-notifications__footer">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="follow-notifications__show-more"
          >
            {isExpanded ? 'Show less' : `Show all ${followNotifications.length} notifications`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowNotifications;
