import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Auth.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    setIsOpen(false);
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
        onClick={() => setIsOpen(!isOpen)}
        title={`${user.first_name} ${user.last_name}` || user.username}
      >
        {getInitials(user)}
      </div>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-item">
            <strong>{user.username}</strong>
            <br />
            <small>{user.email}</small>
          </div>
          <a href="/dashboard" className="user-dropdown-item">
            Dashboard
          </a>
          <a href="/profile" className="user-dropdown-item">
            Profile Settings
          </a>
          <a href="/marketplace" className="user-dropdown-item">
            Marketplace
          </a>
          <a href="/freelance" className="user-dropdown-item">
            Freelance Hub
          </a>
          <button 
            onClick={handleLogout}
            className="user-dropdown-item logout"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
