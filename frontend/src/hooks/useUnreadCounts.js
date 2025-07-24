import { useState, useEffect } from 'react';
import { messagesAPI, notificationsAPI } from '../api';

export const useUnreadCounts = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = async () => {
    try {
      setLoading(true);
      const [messagesResponse, notificationsResponse] = await Promise.all([
        messagesAPI.getUnreadCount().catch(() => ({ data: { count: 0 } })),
        notificationsAPI.getUnreadCount().catch(() => ({ data: { count: 0 } }))
      ]);

      setUnreadMessages(messagesResponse.data?.count || 0);
      setUnreadNotifications(notificationsResponse.data?.count || 0);
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
    fetchUnreadCounts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    unreadMessages,
    unreadNotifications,
    loading,
    refreshCounts: fetchUnreadCounts
  };
};
