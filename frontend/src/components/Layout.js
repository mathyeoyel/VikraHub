import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import UserMenu from './Auth/UserMenu';
import AuthModal from './Auth/AuthModal';
import logoImage from '../assets/images/logo.webp';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { isAuthenticated, user } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="logo">
            <img src={logoImage} alt="VikraHub" className="logo-img" />
            <span className="logo-text">VikraHub</span>
          </div>
          <button 
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/members" className="nav-link" onClick={() => setIsMenuOpen(false)}>Members</Link>
            <Link to="/marketplace" className="nav-link" onClick={() => setIsMenuOpen(false)}>Marketplace</Link>
            <Link to="/freelance" className="nav-link" onClick={() => setIsMenuOpen(false)}>Freelance</Link>
            <Link to="/services" className="nav-link" onClick={() => setIsMenuOpen(false)}>Services</Link>
            
            {isAuthenticated ? (
              <div className="auth-section">
                <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/upload-asset" className="nav-link" onClick={() => setIsMenuOpen(false)}>Upload Asset</Link>
                {user && (user.is_staff || user.is_superuser) && (
                  <Link to="/admin" className="nav-link admin-link" onClick={() => setIsMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <UserMenu />
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="nav-link get-started-btn" 
                  onClick={() => openAuthModal('login')}
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>VikraHub</h3>
              <p>Professional digital solutions for your business needs.</p>
            </div>
            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li><a href="/services">Web Development</a></li>
                <li><a href="/services">Digital Marketing</a></li>
                <li><a href="/services">UI/UX Design</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: info@vikrahub.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 VikraHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />
    </div>
  );
};

export default Layout;
