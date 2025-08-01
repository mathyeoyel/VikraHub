import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { notificationsAPI } from '../../api';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Mock notifications for development
      setNotifications([
        {
          id: 1,
          type: 'message',
          title: 'New Message',
          message: 'John Smith sent you a message about the project collaboration.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          is_read: false,
          action_url: '/messages',
          sender: {
            username: 'john_designer',
            name: 'John Smith',
            avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=000223&color=ffffff&size=40'
          }
        },
        {
          id: 2,
          type: 'project',
          title: 'Project Application',
          message: 'Someone applied to your freelance project "Website Redesign".',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_read: false,
          action_url: '/dashboard',
          sender: null
        },
        {
          id: 3,
          type: 'system',
          title: 'Profile Updated',
          message: 'Your profile has been successfully updated with new information.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          is_read: true,
          action_url: '/profile',
          sender: null
        },
        {
          id: 4,
          type: 'social',
          title: 'New Follower',
          message: 'Sarah Johnson started following you.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          is_read: true,
          action_url: '/profile/sarah_writer',
          sender: {
            username: 'sarah_writer',
            name: 'Sarah Johnson',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffa000&color=ffffff&size=40'
          }
        },
        {
          id: 5,
          type: 'marketplace',
          title: 'Asset Purchase',
          message: 'Your digital asset "Modern UI Kit" was purchased by a client.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_read: true,
          action_url: '/marketplace',
          sender: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Update locally for development
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Update locally for development
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Update locally for development
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <i className="fas fa-comment icon"></i>;
      case 'project': return '💼';
      case 'system': return '⚙️';
      case 'social': return '👥';
      case 'marketplace': return '🎨';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="notifications-actions">
            {unreadCount > 0 && (
              <button className="btn btn-secondary" onClick={markAllAsRead}>
                Mark all as read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="notifications-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <h3>No notifications</h3>
              <p>
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : filter === 'read'
                  ? "No read notifications found."
                  : "You don't have any notifications yet."
                }
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <span className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="notification-info">
                        {notification.sender && (
                          <img
                            src={notification.sender.avatar}
                            alt={notification.sender.name}
                            className="sender-avatar"
                          />
                        )}
                        <div className="notification-text">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>

                  {!notification.is_read && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
