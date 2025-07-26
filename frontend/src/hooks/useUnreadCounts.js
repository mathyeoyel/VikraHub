import { useState, useEffect } from 'react';
import { messagingAPI, notificationsAPI } from '../api';

export const useUnreadCounts = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = async () => {
    try {
      setLoading(true);
      const [messagesResponse, notificationsResponse] = await Promise.all([
        messagingAPI.getUnreadMessagesCount().catch(() => ({ data: { unread_count: 0 } })),
        notificationsAPI.getUnreadCount().catch(() => ({ data: { unread_count: 0 } }))
      ]);

      setUnreadMessages(messagesResponse.data?.unread_count || 0);
      setUnreadNotifications(notificationsResponse.data?.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
      // Set to 0 on error - don't show false counts
      setUnreadMessages(0);
      setUnreadNotifications(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial counts
    fetchUnreadCounts();
    
    // Listen for real-time updates via WebSocket
    const handleUnreadCountUpdate = (event) => {
      const { message_count, notification_count } = event.detail;
      setUnreadMessages(message_count);
      setUnreadNotifications(notification_count);
    };

    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    
    // Fallback: Poll for updates every 2 minutes (reduced frequency since we have real-time updates)
    const interval = setInterval(fetchUnreadCounts, 120000);
    
    return () => {
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
      clearInterval(interval);
    };
  }, []);

  return {
    unreadMessages,
    unreadNotifications,
    loading,
    refreshCounts: fetchUnreadCounts
  };
};
