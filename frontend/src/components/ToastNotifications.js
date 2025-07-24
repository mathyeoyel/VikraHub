import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import './ToastNotifications.css';

const ToastNotifications = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifications) => {
      // Only show the latest unread notification as a toast
      const latestNotification = notifications.find(n => !n.read && !n.toastShown);
      
      if (latestNotification) {
        // Mark as shown to prevent duplicate toasts
        latestNotification.toastShown = true;
        
        const toast = {
          id: latestNotification.id,
          ...latestNotification,
          showTime: Date.now()
        };
        
        setToasts(prev => [...prev, toast]);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
          removeToast(toast.id);
        }, 5000);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleToastClick = (toast) => {
    if (toast.action) {
      switch (toast.action.type) {
        case 'profile':
          window.location.href = `/#/profile/${toast.action.data.username}`;
          break;
        case 'message':
          window.location.href = '/#/messages';
          break;
        case 'project':
          window.location.href = '/#/dashboard';
          break;
        default:
          break;
      }
    }
    
    // Mark notification as read
    notificationService.markAsRead(toast.id);
    removeToast(toast.id);
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => handleToastClick(toast)}
        >
          <div className="toast-icon">{toast.icon}</div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications;
