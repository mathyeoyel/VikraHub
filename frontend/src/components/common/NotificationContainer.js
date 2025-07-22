import React from 'react';
import { useNotifications } from './NotificationContext';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onClose }) => {
  const { type, message, title } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification__content">
        <div className="notification__icon">
          {getIcon()}
        </div>
        <div className="notification__text">
          {title && <div className="notification__title">{title}</div>}
          <div className="notification__message">{message}</div>
        </div>
      </div>
      <button
        className="notification__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationContainer;
