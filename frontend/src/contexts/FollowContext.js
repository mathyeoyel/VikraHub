// frontend/src/contexts/FollowContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { followAPI } from '../api';
import { useAuth } from '../components/Auth/AuthContext';
import { useWebSocket } from './WebSocketContext';

const FollowContext = createContext();

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

export const FollowProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useWebSocket();
  
  // State management
  const [followData, setFollowData] = useState({});
  const [followStats, setFollowStats] = useState({});
  const [followNotifications, setFollowNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [followSuggestions, setFollowSuggestions] = useState([]);
  const [loading, setLoading] = useState({
    follow: false,
    stats: false,
    notifications: false,
    suggestions: false
  });

  // Request queue for follow stats to prevent too many concurrent requests
  const [statsRequestQueue, setStatsRequestQueue] = useState([]);
  const [activeStatsRequests, setActiveStatsRequests] = useState(0);
  const MAX_CONCURRENT_STATS_REQUESTS = 5;

  // Process stats request queue
  const processStatsQueue = () => {
    setStatsRequestQueue(currentQueue => {
      if (currentQueue.length === 0) return currentQueue;
      
      setActiveStatsRequests(currentActive => {
        if (currentActive >= MAX_CONCURRENT_STATS_REQUESTS) {
          return currentActive; // Don't start new requests if at limit
        }
        
        // Start the next request in queue
        const nextRequest = currentQueue[0];
        if (nextRequest) {
          executeStatsRequest(nextRequest);
        }
        
        return currentActive;
      });
      
      return currentQueue;
    });
  };

  // Execute a single stats request
  const executeStatsRequest = async ({ userId, resolvers, rejecters }) => {
    try {
      setActiveStatsRequests(prev => prev + 1);
      setLoading(prev => ({ ...prev, stats: true }));
      
      const response = await followAPI.getUserStats(userId);
      
      // Cache the stats
      setFollowStats(prev => ({
        ...prev,
        [userId]: response.data
      }));
      
      // Resolve all waiting promises
      const result = { success: true, data: response.data };
      resolvers.forEach(resolve => resolve(result));
    } catch (error) {
      console.error('Error getting follow stats:', error);
      
      // Reject all waiting promises
      const errorResult = { success: false, error: error.response?.data?.error || 'Failed to get follow stats' };
      rejecters.forEach(reject => reject(errorResult));
    } finally {
      setActiveStatsRequests(prev => prev - 1);
      setLoading(prev => ({ ...prev, stats: false }));
      
      // Remove completed request from queue and process next
      setStatsRequestQueue(prev => {
        const newQueue = prev.slice(1);
        return newQueue;
      });
    }
  };

  // Monitor queue and process when there are pending requests and available slots
  useEffect(() => {
    if (statsRequestQueue.length > 0 && activeStatsRequests < MAX_CONCURRENT_STATS_REQUESTS) {
      processStatsQueue();
    }
  }, [statsRequestQueue.length, activeStatsRequests]);

  // WebSocket message handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleFollowNotification = (data) => {
      console.log('Received follow notification:', data);
      
      if (data.type === 'follow_notification') {
        // The data structure is now flat, not nested under 'notification'
        const notification = {
          type: 'new_follower',
          follower: data.follower,
          message: data.message,
          timestamp: data.timestamp,
          follow_id: data.follow_id,
          id: data.follow_id // Use follow_id as notification id
        };
        
        // Add new notification to the list
        setFollowNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        setUnreadNotificationsCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(`New Follower: ${notification.follower.username}`, {
            body: notification.message,
            icon: notification.follower.profile_picture || '/logo192.png'
          });
        }
        
        // Update follow stats if it's the current user's stats
        if (user) {
          setFollowStats(prev => ({
            ...prev,
            [user.id]: {
              ...prev[user.id],
              followers_count: (prev[user.id]?.followers_count || 0) + 1
            }
          }));
        }
      }
    };

    // Listen for follow notifications
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'follow_notification') {
          handleFollowNotification(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    return () => {
      // Cleanup handled by WebSocket context
    };
  }, [socket, isConnected, user]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadMyFollowStats();
      loadFollowNotifications();
      loadFollowSuggestions();
    }
  }, [isAuthenticated, user]);

  // API functions
  const followUser = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, follow: true }));
      
      const response = await followAPI.follow(userId);
      
      // Update local follow stats
      setFollowStats(prev => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          following_count: (prev[user.id]?.following_count || 0) + 1
        },
        [userId]: {
          ...prev[userId],
          followers_count: (prev[userId]?.followers_count || 0) + 1,
          is_following: true
        }
      }));
      
      // Update follow data cache
      setFollowData(prev => ({
        ...prev,
        [`${user.id}_following_${userId}`]: true
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to follow user' };
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const unfollowUser = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, follow: true }));
      
      const response = await followAPI.unfollow(userId);
      
      // Update local follow stats
      setFollowStats(prev => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          following_count: Math.max((prev[user.id]?.following_count || 1) - 1, 0)
        },
        [userId]: {
          ...prev[userId],
          followers_count: Math.max((prev[userId]?.followers_count || 1) - 1, 0),
          is_following: false
        }
      }));
      
      // Update follow data cache
      setFollowData(prev => ({
        ...prev,
        [`${user.id}_following_${userId}`]: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to unfollow user' };
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const getFollowStats = async (userId) => {
    return new Promise((resolve, reject) => {
      // Check if we already have cached stats for this user
      if (followStats[userId]) {
        resolve({ success: true, data: followStats[userId] });
        return;
      }
      
      // Check if request is already in queue for this userId
      const existingRequest = statsRequestQueue.find(req => req.userId === userId);
      if (existingRequest) {
        // Add this resolve/reject to the existing request so multiple callers get the same result
        existingRequest.resolvers = existingRequest.resolvers || [];
        existingRequest.rejecters = existingRequest.rejecters || [];
        existingRequest.resolvers.push(resolve);
        existingRequest.rejecters.push(reject);
        return;
      }
      
      // Add request to queue with arrays for multiple resolvers/rejecters
      setStatsRequestQueue(prev => [...prev, { 
        userId, 
        resolvers: [resolve], 
        rejecters: [reject]
      }]);
    });
  };

  const loadMyFollowStats = async () => {
    if (!user) return;
    
    try {
      const response = await followAPI.getMyFollowStats();
      setFollowStats(prev => ({
        ...prev,
        [user.id]: response.data
      }));
    } catch (error) {
      console.error('Error loading my follow stats:', error);
    }
  };

  const getFollowers = async (userId, params = {}) => {
    try {
      const response = await followAPI.getFollowers(userId, params);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting followers:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to get followers' };
    }
  };

  const getFollowing = async (userId, params = {}) => {
    try {
      const response = await followAPI.getFollowing(userId, params);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting following:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to get following' };
    }
  };

  const loadFollowNotifications = async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      
      const response = await followAPI.getFollowNotifications();
      setFollowNotifications(response.data.results || response.data);
      
      // Count unread notifications
      const unreadCount = (response.data.results || response.data).filter(n => !n.is_read).length;
      setUnreadNotificationsCount(unreadCount);
    } catch (error) {
      console.error('Error loading follow notifications:', error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await followAPI.markNotificationRead(notificationId);
      
      // Update local state
      setFollowNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnreadNotificationsCount(prev => Math.max(prev - 1, 0));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to mark notification as read' };
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await followAPI.markAllNotificationsRead();
      
      // Update local state
      setFollowNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      
      setUnreadNotificationsCount(0);
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to mark all notifications as read' };
    }
  };

  const loadFollowSuggestions = async () => {
    try {
      setLoading(prev => ({ ...prev, suggestions: true }));
      
      const response = await followAPI.getFollowSuggestions();
      setFollowSuggestions(response.data);
    } catch (error) {
      console.error('Error loading follow suggestions:', error);
    } finally {
      setLoading(prev => ({ ...prev, suggestions: false }));
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await followAPI.searchUsers(query);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to search users' };
    }
  };

  // Utility functions
  const isFollowing = (userId) => {
    if (!user || !userId) return false;
    return followStats[userId]?.is_following || followData[`${user.id}_following_${userId}`] || false;
  };

  const getFollowersCount = (userId) => {
    return followStats[userId]?.followers_count || 0;
  };

  const getFollowingCount = (userId) => {
    return followStats[userId]?.following_count || 0;
  };

  const value = {
    // State
    followStats,
    followNotifications,
    unreadNotificationsCount,
    followSuggestions,
    loading,
    
    // Actions
    followUser,
    unfollowUser,
    getFollowStats,
    getFollowers,
    getFollowing,
    loadFollowNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loadFollowSuggestions,
    searchUsers,
    
    // Utilities
    isFollowing,
    getFollowersCount,
    getFollowingCount,
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
};
