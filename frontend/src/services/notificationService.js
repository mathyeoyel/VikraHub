// Enhanced Notification Service for handling real-time alerts with WebSocket support
class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.unreadCount = 0;
  }

  // Initialize WebSocket connection for real-time notifications
  async initialize(token) {
    if (!token) {
      console.warn('No token provided for notification service');
      return;
    }

    this.token = token;
    this.connectWebSocket();
  }

  connectWebSocket() {
    if (this.isConnecting || (this.websocket && this.websocket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // Determine WebSocket URL based on environment
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
      const isProduction = apiUrl.includes('api.vikrahub.com');
      
      let wsUrl;
      if (isProduction) {
        wsUrl = `wss://api.vikrahub.com/ws/notifications/?token=${this.token}`;
      } else {
        wsUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${this.token}`;
      }

      console.log('🔔 Connecting to notification WebSocket...');
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('✅ Notification WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Request initial unread count
        this.sendMessage({ type: 'ping' });
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse notification WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 Notification WebSocket disconnected:', event.code);
        this.isConnecting = false;
        this.websocket = null;

        // Attempt to reconnect if not a clean close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting to reconnect notification WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connectWebSocket(), 3000 * this.reconnectAttempts);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ Notification WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to create notification WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  handleWebSocketMessage(data) {
    console.log('📨 Notification WebSocket message:', data);

    switch (data.type) {
      case 'new_notification':
        this.addNotification(data.notification);
        break;
      
      case 'unread_count':
      case 'unread_count_update':
        this.updateUnreadCount(data.count || data.notification_count || 0);
        break;
      
      case 'notification_marked_read':
        this.markNotificationAsRead(data.notification_id);
        break;
      
      case 'all_notifications_marked_read':
        this.markAllAsRead();
        break;
      
      case 'pong':
        // Keep-alive response
        break;
      
      default:
        console.log('Unknown notification message type:', data.type);
    }
  }

  sendMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  // Subscribe to notifications
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current notifications
    callback(this.notifications);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Add new notification from WebSocket
  addNotification(notification) {
    const formattedNotification = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      actor: notification.actor,
      verb: notification.verb,
      payload: notification.payload || {},
      timestamp: notification.created_at,
      read: notification.is_read || false,
      ...notification
    };

    this.notifications.unshift(formattedNotification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Update unread count
    if (!formattedNotification.read) {
      this.unreadCount++;
    }

    // Emit to all listeners
    this.emitUpdate();

    // Show browser notification if permission granted
    this.showBrowserNotification(formattedNotification);
  }

  // Emit notification to all listeners (legacy method for backward compatibility)
  emit(notification) {
    this.addNotification(notification);
  }

  // Update unread count
  updateUnreadCount(count) {
    this.unreadCount = count;
    this.emitUpdate();
  }

  // Emit update to all listeners
  emitUpdate() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Get all notifications
  getAll() {
    return this.notifications;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    // Send to server via WebSocket
    this.sendMessage({
      type: 'mark_notification_read',
      notification_id: notificationId
    });

    // Update local state
    this.markNotificationAsRead(notificationId);
  }

  // Mark all notifications as read
  markAllRead() {
    // Send to server via WebSocket
    this.sendMessage({
      type: 'mark_all_notifications_read'
    });

    // Update local state
    this.markAllAsRead();
  }

  // Internal method to mark notification as read
  markNotificationAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id == notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.emitUpdate();
    }
  }

  // Internal method to mark all as read
  markAllAsRead() {
    let changedCount = 0;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        changedCount++;
      }
    });

    if (changedCount > 0) {
      this.unreadCount = 0;
      this.emitUpdate();
    }
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Show browser notification (requires permission)
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title || 'New notification', {
          body: notification.message || notification.payload?.preview || '',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `vikrahub-${notification.id}`,
          requireInteraction: false,
          silent: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);

        // Handle click
        browserNotification.onclick = () => {
          window.focus();
          this.markAsRead(notification.id);
          browserNotification.close();
        };

      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  }

  // Register device for push notifications
  async registerDevice(token, platform = 'web', additionalData = {}) {
    try {
      const response = await fetch('/api/devices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          token,
          platform,
          ...additionalData
        })
      });

      if (response.ok) {
        const device = await response.json();
        console.log('✅ Device registered for push notifications:', device);
        return device;
      } else {
        console.error('Failed to register device:', response.status);
      }
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }

  // Clean up and disconnect
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // Clear all notifications
  clear() {
    this.notifications = [];
    this.unreadCount = 0;
    this.emitUpdate();
  }

  // Legacy methods for backward compatibility
  showError(message, title = 'Error') {
    this.addNotification({
      id: Date.now(),
      type: 'error',
      title,
      message,
      verb: 'error',
      created_at: new Date().toISOString()
    });
  }

  showSuccess(message, title = 'Success') {
    this.addNotification({
      id: Date.now(),
      type: 'success', 
      title,
      message,
      verb: 'success',
      created_at: new Date().toISOString()
    });
  }

  showInfo(message, title = 'Info') {
    this.addNotification({
      id: Date.now(),
      type: 'info',
      title,
      message,
      verb: 'info',
      created_at: new Date().toISOString()
    });
  }

  showWarning(message, title = 'Warning') {
    this.addNotification({
      id: Date.now(),
      type: 'warning',
      title,
      message,
      verb: 'warning',
      created_at: new Date().toISOString()
    });
  }

  // Specific notification types (legacy compatibility)
  followNotification(followerUsername, followerName) {
    this.addNotification({
      id: Date.now(),
      type: 'follow',
      title: 'New Follower',
      message: `${followerName || followerUsername} started following you`,
      verb: 'follow',
      created_at: new Date().toISOString(),
      payload: { follower_username: followerUsername, follower_name: followerName }
    });
  }

  messageNotification(senderUsername, senderName, messagePreview) {
    this.addNotification({
      id: Date.now(),
      type: 'message',
      title: 'New Message',
      message: `${senderName || senderUsername}: ${messagePreview}`,
      verb: 'message',
      created_at: new Date().toISOString(),
      payload: { sender_username: senderUsername, preview: messagePreview }
    });
  }

  projectNotification(type, projectTitle, clientName) {
    const messages = {
      'application': `New application for "${projectTitle}"`,
      'accepted': `Your application for "${projectTitle}" was accepted`,
      'completed': `Project "${projectTitle}" has been completed`,
      'review': `${clientName} left a review for "${projectTitle}"`
    };

    this.addNotification({
      id: Date.now(),
      type: 'project',
      title: 'Project Update',
      message: messages[type] || 'Project notification',
      verb: 'project',
      created_at: new Date().toISOString(),
      payload: { project_title: projectTitle, client_name: clientName }
    });
  }

  systemNotification(title, message, type = 'info') {
    this.addNotification({
      id: Date.now(),
      type: 'system',
      title,
      message,
      verb: 'system',
      created_at: new Date().toISOString()
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
