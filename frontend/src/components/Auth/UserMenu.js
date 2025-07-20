import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <span className="user-icon">👤</span>
        <span className="user-initials">{getInitials(user)}</span>
      </div>
      
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-item user-info">
            <strong>{user.first_name && user.last_name ? 
              `${user.first_name} ${user.last_name}` : 
              user.username}</strong>
            <br />
            <small>{user.email}</small>
          </div>
          <div className="dropdown-divider"></div>
          <Link to="/profile" className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span className="dropdown-icon">👤</span>
            My Profile
          </Link>
          <Link to="/profile" className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span className="dropdown-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/marketplace" className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span className="dropdown-icon">🎨</span>
            Inspiration
          </Link>
          <Link to="/freelance" className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span className="dropdown-icon">💼</span>
            Freelance Hub
          </Link>
          <div className="dropdown-divider"></div>
          <button 
            onClick={handleLogout}
            className="user-dropdown-item logout"
          >
            <span className="dropdown-icon">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
