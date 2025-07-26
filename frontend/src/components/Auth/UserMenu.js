import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';
import './Auth.css';

const UserMenu = ({ onMenuAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { unreadMessages, unreadNotifications } = useUnreadCounts();
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle user menu and close hamburger menu on mobile
  const toggleUserMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Only close hamburger menu when user menu dropdown OPENS (not when it closes)
    if (newIsOpen && onMenuAction) {
      onMenuAction();
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    if (onMenuAction) onMenuAction();
  };

  const handleMenuClick = () => {
    setIsOpen(false);
    if (onMenuAction) onMenuAction();
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`;
    }
    return user.username[0].toUpperCase();
  };

  return (
    <div className="user-menu" ref={dropdownRef}>
      <div 
        className="user-avatar"
        onClick={toggleUserMenu}
        title={`${user.first_name} ${user.last_name}` || user.username}
      >
        <span className="user-icon">👤</span>
        <span className="user-initials">{getInitials(user)}</span>
        {(unreadMessages + unreadNotifications) > 0 && (
          <span className="user-avatar-badge">
            {unreadMessages + unreadNotifications}
          </span>
        )}
      </div>
      
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div className="user-menu-backdrop" onClick={() => setIsOpen(false)}></div>
          <div className="user-dropdown">
            <div className="user-dropdown-item user-info">
              <strong>{user.first_name && user.last_name ? 
                `${user.first_name} ${user.last_name}` : 
                user.username}</strong>
              <br />
              <small>{user.email}</small>
            </div>
            <div className="dropdown-divider"></div>
            <Link to="/profile" className="user-dropdown-item" onClick={handleMenuClick}>
              <div className="dropdown-content">
                <span className="dropdown-icon">👤</span>
                My Profile
              </div>
            </Link>
            <Link to="/messages" className="user-dropdown-item" onClick={handleMenuClick}>
              <div className="dropdown-content">
                <span className="dropdown-icon">💬</span>
                Messages
              </div>
              {unreadMessages > 0 && <span className="unread-badge">{unreadMessages}</span>}
            </Link>
            <Link to="/notifications" className="user-dropdown-item" onClick={handleMenuClick}>
              <div className="dropdown-content">
                <span className="dropdown-icon">🔔</span>
                Notifications
              </div>
              {unreadNotifications > 0 && <span className="unread-badge">{unreadNotifications}</span>}
            </Link>
            <div className="dropdown-divider"></div>
            <Link to="/dashboard" className="user-dropdown-item" onClick={handleMenuClick}>
              <div className="dropdown-content">
                <span className="dropdown-icon">📊</span>
                Dashboard
              </div>
            </Link>
            <Link to="/settings" className="user-dropdown-item" onClick={handleMenuClick}>
              <div className="dropdown-content">
                <span className="dropdown-icon">⚙️</span>
                Settings
              </div>
            </Link>
            <div className="dropdown-divider"></div>
            <button 
              onClick={handleLogout}
              className="user-dropdown-item logout"
            >
              <div className="dropdown-content">
                <span className="dropdown-icon">🚪</span>
                Logout
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
