import { useState, useEffect, useCallback } from 'react';
import { messagingAPI, notificationsAPI } from '../api';
import { isLoggedIn } from '../auth';

export const useUnreadCounts = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!isLoggedIn()) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [messagesResponse, notificationsResponse] = await Promise.all([
        // Safe API calls with 404 fallback as requested
        messagingAPI.getUnreadCount()
          .then(res => res)
          .catch(err => {
            console.warn('Messages unread count API failed:', err.response?.status);
            return { data: { unread_count: 0 } };
          }),
        notificationsAPI.getUnreadCount()
          .then(res => res)
          .catch(err => {
            console.warn('Notifications unread count API failed:', err.response?.status);
            return { data: { unread_count: 0 } };
          })
      ]);

      const messageCount = Math.max(0, messagesResponse.data?.unread_count || 0);
      const notificationCount = Math.max(0, notificationsResponse.data?.unread_count || 0);
      
      setUnreadMessages(messageCount);
      setUnreadNotifications(notificationCount);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
      // Graceful fallback: don't change counts on error to avoid confusion
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial counts
    fetchUnreadCounts();
    
    // Listen for real-time updates via WebSocket
    const handleUnreadCountUpdate = (event) => {
      const { message_count, notification_count } = event.detail;
      
      // Direct updates for real-time responsiveness
      if (message_count !== undefined) {
        setUnreadMessages(Math.max(0, message_count));
      }
      if (notification_count !== undefined) {
        setUnreadNotifications(Math.max(0, notification_count));
      }
    };

    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    
    // Conservative polling: Only poll if no real-time updates for 5 minutes
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCounts();
      }
    }, 300000); // 5 minutes
    
    return () => {
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchUnreadCounts]);

  return {
    unreadMessages,
    unreadNotifications,
    loading,
    refreshCounts: fetchUnreadCounts
  };
};
