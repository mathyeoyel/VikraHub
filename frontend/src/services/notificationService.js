// Notification Service for handling real-time alerts
class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
  }

  // Subscribe to notifications
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Emit notification to all listeners
  emit(notification) {
    this.notifications.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    });

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Get all notifications
  getAll() {
    return this.notifications;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Clear all notifications
  clear() {
    this.notifications = [];
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Specific notification types
  followNotification(followerUsername, followerName) {
    this.emit({
      type: 'follow',
      title: 'New Follower',
      message: `${followerName || followerUsername} started following you`,
      action: {
        type: 'profile',
        data: { username: followerUsername }
      },
      icon: '👤'
    });
  }

  messageNotification(senderUsername, senderName, messagePreview) {
    this.emit({
      type: 'message',
      title: 'New Message',
      message: `${senderName || senderUsername}: ${messagePreview}`,
      action: {
        type: 'message',
        data: { username: senderUsername }
      },
      icon: '💬'
    });
  }

  projectNotification(type, projectTitle, clientName) {
    const messages = {
      'application': `New application for "${projectTitle}"`,
      'accepted': `Your application for "${projectTitle}" was accepted`,
      'completed': `Project "${projectTitle}" has been completed`,
      'review': `${clientName} left a review for "${projectTitle}"`
    };

    this.emit({
      type: 'project',
      title: 'Project Update',
      message: messages[type] || 'Project notification',
      action: {
        type: 'project',
        data: { title: projectTitle }
      },
      icon: '📋'
    });
  }

  systemNotification(title, message, type = 'info') {
    this.emit({
      type: 'system',
      title,
      message,
      action: null,
      icon: type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
