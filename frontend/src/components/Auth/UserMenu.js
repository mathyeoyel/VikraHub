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
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name.slice(0, 2).toUpperCase();
    }
    if (user.last_name) {
      return user.last_name.slice(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U'; // Ultimate fallback
  };

  const getProfileImageUrl = (user) => {
    // Check for various possible profile image fields
    if (user.profile_picture) return user.profile_picture;
    if (user.profile_image) return user.profile_image;
    if (user.avatar) return user.avatar;
    if (user.photo) return user.photo;
    return null;
  };

  const handleImageError = (e) => {
    // Hide the image and show initials fallback
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const profileImageUrl = getProfileImageUrl(user);

  return (
    <div className="user-menu" ref={dropdownRef}>
      <div 
        className="user-avatar"
        onClick={toggleUserMenu}
        title={`${user.first_name} ${user.last_name}` || user.username}
      >
        {profileImageUrl ? (
          <>
            <img 
              src={profileImageUrl} 
              alt="Profile" 
              className="user-avatar-image"
              onError={handleImageError}
            />
            <div className="user-avatar-initials" style={{ display: 'none' }}>
              {getInitials(user)}
            </div>
          </>
        ) : (
          <div className="user-avatar-initials">
            {getInitials(user)}
          </div>
        )}
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
